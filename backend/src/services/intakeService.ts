/**
 * @module services/intakeService
 * Client intake form management. Handles retrieval, auto-save, and
 * completion of the onboarding intake questionnaire. Supports both
 * self-service (client) and provider-side access with authorization.
 */

import Client from '../models/Client';
import User from '../models/User';
import { NotFoundError } from '../utils/errors';

// ── Result types ─────────────────────────────────────────────────────────────

/** Intake form data with completion status. */
export interface IntakeResult {
  intakeCompleted: boolean;
  intake: Record<string, unknown> | null;
  onboarding?: Record<string, unknown>;
  clientId: string | null;
}

/** Result after saving intake form data. */
export interface IntakeSaveResult {
  message: string;
  intakeCompleted: boolean;
  intake: Record<string, unknown> | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function updateUserIntakeStatus(userId: string, completed: boolean): Promise<void> {
  if (!completed) return;
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        intakeCompleted: true,
        intakeCompletedAt: new Date(),
      },
    },
    { new: false }
  );
}

/**
 * Check if a caller can access a user's intake data.
 *
 * @param callerId - Requesting user's ID
 * @param callerRole - Requesting user's role
 * @param targetUserId - Owner of the intake data
 * @returns true if the caller has access
 */
export async function canAccessUserIntake(
  callerId: string,
  callerRole: string,
  targetUserId: string
): Promise<boolean> {
  if (callerId === targetUserId) return true;
  if (callerRole === 'admin') return true;
  if (callerRole === 'provider') {
    const client = await Client.findOne({ userId: targetUserId, assignedProvider: callerId });
    return !!client;
  }
  return false;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Get intake form for the authenticated client.
 *
 * @param userId - Client's user ID
 * @returns Intake data and completion status
 */
export async function getMyIntake(userId: string): Promise<IntakeResult> {
  const client = await Client.findOne({ userId });
  if (!client) {
    return { intakeCompleted: false, intake: null, clientId: null };
  }
  return {
    intakeCompleted: client.intakeCompleted,
    intake: (client.intakeData as Record<string, unknown>) ?? null,
    onboarding: client.onboardingSteps as unknown as Record<string, unknown>,
    clientId: String(client._id),
  };
}

/**
 * Create or update intake form for the authenticated client.
 *
 * @param userId - Client's user ID
 * @param body - Intake form data (set isComplete=true to finalise)
 * @returns Save confirmation with current intake state
 */
export async function saveMyIntake(
  userId: string,
  body: Record<string, unknown>
): Promise<IntakeSaveResult> {
  let client = await Client.findOne({ userId });
  client ??= new Client({ userId, status: 'active' });

  const isComplete = body.isComplete === true;
  const incomingData: Record<string, unknown> = { ...body };
  delete incomingData.isComplete;

  client.intakeData = {
    ...(client.intakeData ?? {}),
    ...incomingData,
    ...(isComplete ? { completedAt: new Date() } : {}),
  } as typeof client.intakeData;

  if (isComplete) {
    client.intakeCompleted = true;
  }

  await client.save();
  await updateUserIntakeStatus(userId, client.intakeCompleted);

  return {
    message: 'Intake form saved',
    intakeCompleted: client.intakeCompleted,
    intake: (client.intakeData as Record<string, unknown>) ?? null,
  };
}

/**
 * Get intake form for a specific user (by userId).
 *
 * @param userId - Target user's ID
 * @returns Intake data and completion status
 * @throws NotFoundError — client not found
 */
export async function getIntakeByUserId(userId: string): Promise<IntakeResult> {
  const client = await Client.findOne({ userId });
  if (!client) {
    throw new NotFoundError('Client not found');
  }
  return {
    intakeCompleted: client.intakeCompleted,
    intake: (client.intakeData as Record<string, unknown>) ?? null,
    onboarding: client.onboardingSteps as unknown as Record<string, unknown>,
    clientId: String(client._id),
  };
}

/**
 * Update a client's intake (provider/admin).
 *
 * @param userId - Target user's ID
 * @param body - Intake fields to merge
 * @returns Save confirmation with updated state
 * @throws NotFoundError — client not found
 */
export async function updateIntakeByUserId(
  userId: string,
  body: Record<string, unknown>
): Promise<IntakeSaveResult> {
  const client = await Client.findOne({ userId });
  if (!client) {
    throw new NotFoundError('Client not found');
  }

  const isComplete = body.isComplete === true;
  const incomingData: Record<string, unknown> = { ...body };
  delete incomingData.isComplete;

  client.intakeData = {
    ...(client.intakeData ?? {}),
    ...incomingData,
    ...(isComplete ? { completedAt: new Date() } : {}),
  } as typeof client.intakeData;

  if (isComplete) {
    client.intakeCompleted = true;
  }

  await client.save();
  await updateUserIntakeStatus(userId, client.intakeCompleted);

  return {
    message: 'Intake updated',
    intakeCompleted: client.intakeCompleted,
    intake: (client.intakeData as Record<string, unknown>) ?? null,
  };
}

/**
 * Partially update an intake form section (auto-save).
 *
 * @param userId - Client's user ID
 * @param sectionId - Section identifier (used in response message)
 * @param body - Section data to merge
 * @returns Save confirmation with updated state
 * @throws NotFoundError — intake form not found
 */
export async function updateIntakeSection(
  userId: string,
  sectionId: string,
  body: Record<string, unknown>
): Promise<IntakeSaveResult> {
  const client = await Client.findOne({ userId });
  if (!client) {
    throw new NotFoundError('Intake form not found');
  }

  const isComplete = body.isComplete === true;
  const incomingData: Record<string, unknown> = { ...body };
  delete incomingData.isComplete;

  client.intakeData = {
    ...(client.intakeData ?? {}),
    ...incomingData,
    ...(isComplete ? { completedAt: new Date() } : {}),
  } as typeof client.intakeData;

  if (isComplete) {
    client.intakeCompleted = true;
  }

  await client.save();
  await updateUserIntakeStatus(userId, client.intakeCompleted);

  return {
    message: `Intake section '${sectionId}' updated`,
    intakeCompleted: client.intakeCompleted,
    intake: (client.intakeData as Record<string, unknown>) ?? null,
  };
}
