/**
 * @module services/clientService
 * Client profile management for the provider/admin dashboard. Handles
 * listing, assignment, onboarding fields, intake data, and cascading
 * deletion of a client and all associated records (appointments,
 * care plans, check-ins, documents, messages).
 */

import mongoose from 'mongoose';
import Appointment from '../models/Appointment';
import CarePlan from '../models/CarePlan';
import CheckIn from '../models/CheckIn';
import Client, { IClientDocument } from '../models/Client';
import ClientDocument from '../models/ClientDocument';
import Message from '../models/Message';
import User from '../models/User';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import logger from '../utils/logger';

// ── Input types ──────────────────────────────────────────────────────────────

/** Mutable fields when updating a client profile. */
export interface UpdateClientInput {
  babyBirthDate?: string;
  dueDate?: string;
  birthDate?: string;
  status?: string;
  intakeCompleted?: boolean;
  intakeData?: Record<string, unknown>;
  providerNotesIntake?: string;
  onboardingSteps?: Record<string, boolean>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function canEditClient(
  userRole: string,
  userId: string,
  client: { assignedProvider?: { _id?: { toString(): string }; toString(): string } }
): boolean {
  if (userRole === 'admin') return true;
  if (userRole === 'provider') {
    const assignedId =
      client.assignedProvider?._id?.toString() ?? client.assignedProvider?.toString();
    return assignedId === userId;
  }
  return false;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Get current user's client profile (clients only).
 *
 * @throws ForbiddenError — not a client
 * @throws NotFoundError  — client profile not found
 */
export async function getMyClientProfile(
  userId: mongoose.Types.ObjectId,
  userRole: string
): Promise<IClientDocument> {
  if (userRole !== 'client') {
    throw new ForbiddenError('Only clients can access this endpoint');
  }

  const client = await Client.findOne({ userId })
    .populate('userId', 'firstName lastName email')
    .populate('assignedProvider', 'firstName lastName email')
    .lean();

  if (!client) {
    throw new NotFoundError('Client profile not found');
  }

  return client as IClientDocument;
}

/**
 * List clients (provider's assigned or all).
 *
 * @param userId - Authenticated user's ObjectId (used as provider filter)
 * @param userRole - Caller's role
 * @param showAll - When true and caller is provider/admin, returns all clients
 * @returns Enriched client records with display names and user details
 */
export async function listClients(
  userId: mongoose.Types.ObjectId,
  userRole: string,
  showAll: boolean
): Promise<Record<string, unknown>[]> {
  const allClients = showAll && (userRole === 'provider' || userRole === 'admin');
  const filter = allClients ? {} : { assignedProvider: userId };

  const aggregated = await Client.aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $limit: 500 },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userDoc',
      },
    },
    { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedProvider',
        foreignField: '_id',
        as: 'assignedProviderDoc',
      },
    },
    {
      $addFields: {
        assignedProvider: {
          $cond: {
            if: { $eq: [{ $size: '$assignedProviderDoc' }, 1] },
            then: {
              _id: { $arrayElemAt: ['$assignedProviderDoc._id', 0] },
              firstName: { $arrayElemAt: ['$assignedProviderDoc.firstName', 0] },
              lastName: { $arrayElemAt: ['$assignedProviderDoc.lastName', 0] },
              email: { $arrayElemAt: ['$assignedProviderDoc.email', 0] },
            },
            else: '$assignedProvider',
          },
        },
        userId: {
          $cond: {
            if: { $eq: [{ $type: '$userDoc' }, 'object'] },
            then: {
              _id: '$userDoc._id',
              firstName: '$userDoc.firstName',
              lastName: '$userDoc.lastName',
              email: '$userDoc.email',
            },
            else: '$userId',
          },
        },
        _displayNamePart: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ['$userDoc.firstName', ''] },
                ' ',
                { $ifNull: ['$userDoc.lastName', ''] },
              ],
            },
          },
        },
        clientUserId: { $ifNull: ['$userDoc._id', '$userId'] },
      },
    },
    { $unset: ['assignedProviderDoc'] },
    {
      $addFields: {
        displayName: {
          $cond: {
            if: { $gt: [{ $strLenCP: '$_displayNamePart' }, 0] },
            then: '$_displayNamePart',
            else: { $ifNull: ['$userDoc.email', 'Unknown'] },
          },
        },
      },
    },
    { $unset: ['_displayNamePart', 'userDoc'] },
  ]);

  return aggregated.map(
    (c: {
      displayName?: string;
      clientUserId?: { toString(): string };
      userId?: { toString(): string };
      _id?: { toString(): string };
      [key: string]: unknown;
    }) => ({
      ...c,
      displayName: c.displayName || 'Unknown',
      clientUserId:
        c.clientUserId?.toString?.() ??
        c.userId?.toString?.() ??
        c._id?.toString?.(),
    })
  );
}

/**
 * Assign a client to the current provider.
 *
 * @param clientId - Client document ObjectId
 * @param providerId - Provider's user ObjectId
 * @returns Updated client document with populated provider
 * @throws NotFoundError — client not found
 */
export async function assignClient(
  clientId: string,
  providerId: mongoose.Types.ObjectId
): Promise<IClientDocument> {
  const client = await Client.findById(clientId).populate('userId', 'firstName lastName email');
  if (!client) {
    throw new NotFoundError('Client not found');
  }

  client.assignedProvider = new mongoose.Types.ObjectId(String(providerId));
  if (client.onboardingSteps) {
    client.onboardingSteps.providerAssigned = true;
  }
  await client.save();

  // Backfill: set assignedProvider on all documents uploaded by this client
  const clientUserId = (client.userId as unknown as { _id?: mongoose.Types.ObjectId })?._id ?? client.userId;
  const providerOid = new mongoose.Types.ObjectId(String(providerId));
  if (clientUserId) {
    const uploaderId = new mongoose.Types.ObjectId(clientUserId.toString());
    const result = await ClientDocument.updateMany(
      { uploadedBy: uploaderId },
      { $set: { assignedProvider: providerOid } }
    );
    if (result.modifiedCount > 0) {
      logger.info(
        `Backfill: set assignedProvider on ${result.modifiedCount} document(s) for provider ${providerOid}`
      );
    }
  }

  await client.populate('assignedProvider', 'firstName lastName email');
  return client;
}

/**
 * Remove a client from the provider's list.
 *
 * @param clientId - Client document ObjectId
 * @param providerId - Provider's user ObjectId
 * @returns Updated client document with provider cleared
 * @throws NotFoundError  — client not found
 * @throws ForbiddenError — client is not assigned to the caller
 */
export async function unassignClient(
  clientId: string,
  providerId: mongoose.Types.ObjectId
): Promise<IClientDocument> {
  const client = await Client.findById(clientId).populate('userId', 'firstName lastName email');
  if (!client) {
    throw new NotFoundError('Client not found');
  }

  if (client.assignedProvider?.toString() !== String(providerId)) {
    throw new ForbiddenError('Client is not assigned to you');
  }

  client.assignedProvider = undefined;
  if (client.onboardingSteps) {
    client.onboardingSteps.providerAssigned = false;
  }
  await client.save();
  await client.populate('assignedProvider', 'firstName lastName email');
  return client;
}

/**
 * Get a single client profile by ID (provider/admin only).
 *
 * @param clientId - Client document ObjectId
 * @param userId - Authenticated user's ID for authorization
 * @param userRole - Caller's role
 * @returns Populated client document
 * @throws NotFoundError  — client not found
 * @throws ForbiddenError — not authorized
 */
export async function getClientById(
  clientId: string,
  userId: string,
  userRole: string
): Promise<IClientDocument> {
  const client = await Client.findById(clientId)
    .populate('userId', 'firstName lastName email')
    .populate('assignedProvider', 'firstName lastName email');

  if (!client) {
    throw new NotFoundError('Client not found');
  }

  if (!canEditClient(userRole, userId, client)) {
    throw new ForbiddenError('Not authorized to view this client');
  }

  return client;
}

/**
 * Update a client profile (provider/admin only).
 *
 * @param clientId - Client document ObjectId
 * @param data - Fields to update
 * @param userId - Authenticated user's ID for authorization
 * @param userRole - Caller's role
 * @returns Updated client document
 * @throws NotFoundError  — client not found
 * @throws ForbiddenError — not authorized
 */
export async function updateClient(
  clientId: string,
  data: UpdateClientInput,
  userId: string,
  userRole: string
): Promise<IClientDocument> {
  const client = await Client.findById(clientId);
  if (!client) {
    throw new NotFoundError('Client not found');
  }

  if (!canEditClient(userRole, userId, client)) {
    throw new ForbiddenError('Not authorized to edit this client');
  }

  const {
    babyBirthDate,
    dueDate,
    birthDate,
    status,
    intakeCompleted,
    intakeData,
    providerNotesIntake,
    onboardingSteps,
  } = data;

  if (babyBirthDate !== undefined)
    client.babyBirthDate = babyBirthDate ? new Date(babyBirthDate) : undefined;
  if (dueDate !== undefined) client.dueDate = dueDate ? new Date(dueDate) : undefined;
  if (birthDate !== undefined) client.birthDate = birthDate ? new Date(birthDate) : undefined;
  if (status !== undefined) client.status = status as IClientDocument['status'];
  if (intakeCompleted !== undefined) client.intakeCompleted = intakeCompleted;
  if (intakeData !== undefined)
    client.intakeData = { ...(client.intakeData ?? {}), ...intakeData } as typeof client.intakeData;
  if (providerNotesIntake !== undefined) client.providerNotesIntake = providerNotesIntake;
  if (onboardingSteps !== undefined)
    client.onboardingSteps = {
      ...(client.onboardingSteps ?? {}),
      ...onboardingSteps,
    } as typeof client.onboardingSteps;

  await client.save();
  await client.populate('userId', 'firstName lastName email');
  await client.populate('assignedProvider', 'firstName lastName email');
  return client;
}

/**
 * Permanently delete a client and all associated data.
 *
 * @param clientId - Client document ObjectId
 * @param deletedByUserId - ID of the user performing the deletion (for audit)
 * @throws NotFoundError — client not found
 */
export async function deleteClient(
  clientId: string,
  deletedByUserId: mongoose.Types.ObjectId
): Promise<void> {
  const client = await Client.findById(clientId);
  if (!client) {
    throw new NotFoundError('Client not found');
  }

  const clientUserId = client.userId;

  // Delete associated data
  await Promise.all([
    Appointment.deleteMany({ clientId: clientUserId }),
    CarePlan.deleteMany({ clientId: clientUserId }),
    CheckIn.deleteMany({ userId: clientUserId }),
    ClientDocument.deleteMany({ userId: clientUserId }),
    Message.deleteMany({ $or: [{ sender: clientUserId }, { receiver: clientUserId }] }),
  ]);

  // Delete the client record
  await Client.findByIdAndDelete(clientId);

  // Delete the user account
  if (clientUserId) {
    await User.findByIdAndDelete(clientUserId);
  }

  logger.info(`Client ${clientId} permanently deleted by user ${deletedByUserId}`);
}
