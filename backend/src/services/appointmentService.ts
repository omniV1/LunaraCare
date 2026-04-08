/**
 * @module services/appointmentService
 * Core appointment lifecycle management: CRUD, request/confirm/cancel flows,
 * availability-slot management, and bulk scheduling. Operates on the
 * Appointment and AvailabilitySlot models and sends email notifications
 * for state transitions.
 */

import mongoose from 'mongoose';
import Appointment, { IAppointmentDocument } from '../models/Appointment';
import AvailabilitySlot, { IAvailabilitySlotDocument } from '../models/AvailabilitySlot';
import User from '../models/User';
import Message from '../models/Message';
import { sendAppointmentNotification } from './appointmentNotificationService';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../utils/errors';

// ── Input / result types ────────────────────────────────────────────────────

/** Fields for directly creating a scheduled appointment. */
export interface CreateAppointmentInput {
  clientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  type?: 'virtual' | 'in_person';
  notes?: string;
}

/** Mutable fields when updating an existing appointment. */
export interface UpdateAppointmentInput {
  status?: 'scheduled' | 'completed' | 'cancelled' | 'requested' | 'confirmed';
  startTime?: string;
  endTime?: string;
  notes?: string;
}

/** Fields for requesting an appointment by booking an availability slot. */
export interface RequestAppointmentInput {
  providerId: string;
  slotId: string;
  type?: 'virtual' | 'in_person';
  notes?: string;
}

/** Fields for requesting an appointment at a proposed date/time (no slot). */
export interface RequestProposedInput {
  providerId: string;
  startTime: string;
  endTime: string;
  type?: 'virtual' | 'in_person';
  notes?: string;
}

/** Fields for creating a provider availability slot. */
export interface CreateAvailabilitySlotInput {
  date: string;
  startTime: string;
  endTime: string;
  recurring?: boolean;
}

/** Single item in a bulk-create appointment request. */
export interface BulkAppointmentItem {
  clientId: string;
  startTime: string;
  endTime: string;
  type?: string;
  notes?: string;
}

/** Minimal authenticated user context passed from the route layer. */
export interface CallerUser {
  _id: mongoose.Types.ObjectId | string;
  role: 'client' | 'provider' | 'admin';
  firstName: string;
  lastName: string;
}

// ── Service functions ───────────────────────────────────────────────────────

/**
 * List appointments for a user with role-based filtering and pagination.
 *
 * @param userId - Authenticated user's ObjectId
 * @param role - User role (determines filter: providerId vs clientId)
 * @param page - 1-based page number
 * @param limit - Maximum results per page
 * @returns Populated appointment documents sorted by start time descending
 */
export async function listAppointments(
  userId: mongoose.Types.ObjectId,
  role: string,
  page: number,
  limit: number
): Promise<IAppointmentDocument[]> {
  const filter =
    role === 'provider' ? { providerId: userId } : { clientId: userId };

  const appointments = await Appointment.find(filter)
    .sort({ startTime: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('clientId', 'firstName lastName email')
    .populate('providerId', 'firstName lastName email');

  return appointments;
}

/**
 * Upcoming appointments with active-status filter.
 *
 * @param userId - Authenticated user's ObjectId
 * @param role - User role (determines filter key)
 * @param limit - Maximum results to return
 * @returns Future appointments sorted chronologically
 */
export async function getUpcomingAppointments(
  userId: mongoose.Types.ObjectId,
  role: string,
  limit: number
): Promise<IAppointmentDocument[]> {
  const now = new Date();
  const roleKey = role === 'provider' ? 'providerId' : 'clientId';
  const filter = {
    [roleKey]: userId,
    startTime: { $gte: now },
    status: { $in: ['scheduled', 'confirmed', 'requested'] },
  };

  const appointments = await Appointment.find(filter)
    .sort({ startTime: 1 })
    .limit(limit)
    .populate('clientId', 'firstName lastName email')
    .populate('providerId', 'firstName lastName email');

  return appointments;
}

/**
 * Calendar appointments within a date range.
 *
 * @param userId - Authenticated user's ObjectId
 * @param role - User role
 * @param startDate - Range start (inclusive)
 * @param endDate - Range end (inclusive)
 * @returns Appointments within the range sorted chronologically
 */
export async function getCalendarAppointments(
  userId: mongoose.Types.ObjectId,
  role: string,
  startDate: Date,
  endDate: Date
): Promise<IAppointmentDocument[]> {
  const roleFilter =
    role === 'provider' ? { providerId: userId } : { clientId: userId };

  const appointments = await Appointment.find({
    ...roleFilter,
    startTime: { $gte: startDate, $lte: endDate },
  })
    .sort({ startTime: 1 })
    .populate('clientId', 'firstName lastName email')
    .populate('providerId', 'firstName lastName email');

  return appointments;
}

/**
 * Calendar availability slots for a provider within a date range.
 *
 * @param providerId - Provider's user ID
 * @param startDate - Range start (truncated to start-of-day)
 * @param endDate - Range end (inclusive)
 * @returns Availability slots sorted by date and start time
 */
export async function getCalendarAvailability(
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<IAvailabilitySlotDocument[]> {
  // Truncate to start-of-day so slots for today aren't missed
  const truncatedStart = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  const slots = await AvailabilitySlot.find({
    providerId,
    date: { $gte: truncatedStart, $lte: endDate },
  }).sort({ date: 1, startTime: 1 });

  return slots;
}

/**
 * Get a single appointment with participant access check.
 *
 * @throws NotFoundError  — appointment does not exist
 * @throws ForbiddenError — caller is not a participant
 */
export async function getAppointmentById(
  id: string,
  userId: string,
  userRole: string
): Promise<IAppointmentDocument> {
  const appointment = await Appointment.findById(id)
    .populate('clientId', 'firstName lastName email')
    .populate('providerId', 'firstName lastName email');

  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  const isParticipant =
    appointment.clientId?._id?.toString() === userId ||
    appointment.providerId?._id?.toString() === userId ||
    userRole === 'admin';

  if (!isParticipant) {
    throw new ForbiddenError('Access denied');
  }

  return appointment;
}

/**
 * Create an appointment. Only providers/admins can schedule for another user.
 *
 * @param data - Appointment details
 * @param user - Authenticated caller context
 * @returns The created and populated appointment document
 * @throws ForbiddenError — non-provider/admin trying to schedule for another client
 */
export async function createAppointment(
  data: CreateAppointmentInput,
  user: CallerUser
): Promise<IAppointmentDocument> {
  const { clientId, providerId, startTime, endTime, type, notes } = data;

  if (clientId.toString() !== user._id.toString() && user.role !== 'provider' && user.role !== 'admin') {
    throw new ForbiddenError(
      'Only providers or admins can schedule appointments for clients. Use the request flow to book as a client.'
    );
  }

  const appointment = new Appointment({
    clientId,
    providerId,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    type: type ?? 'virtual',
    notes: notes ?? undefined,
    requestedBy: user._id,
    status: 'scheduled',
  });
  await appointment.save();
  await appointment.populate('clientId', 'firstName lastName email');
  await appointment.populate('providerId', 'firstName lastName email');

  return appointment;
}

/**
 * Update an appointment. Only participants or admins may update.
 *
 * @throws NotFoundError  — appointment does not exist
 * @throws ForbiddenError — caller is not a participant
 */
export async function updateAppointment(
  id: string,
  data: UpdateAppointmentInput,
  userId: string,
  userRole: string
): Promise<IAppointmentDocument> {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  const isParticipant =
    appointment.clientId?.toString() === userId ||
    appointment.providerId?.toString() === userId ||
    userRole === 'admin';

  if (!isParticipant) {
    throw new ForbiddenError('Access denied');
  }

  const { status, startTime, endTime, notes } = data;
  if (status) appointment.status = status;
  if (startTime) appointment.startTime = new Date(startTime);
  if (endTime) appointment.endTime = new Date(endTime);
  if (notes !== undefined) appointment.notes = notes;
  await appointment.save();

  return appointment;
}

/**
 * Delete an appointment. Only participants or admins may delete.
 *
 * @throws NotFoundError  — appointment does not exist
 * @throws ForbiddenError — caller is not a participant
 */
export async function deleteAppointment(
  id: string,
  userId: string,
  userRole: string
): Promise<void> {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  const isParticipant =
    appointment.clientId?.toString() === userId ||
    appointment.providerId?.toString() === userId ||
    userRole === 'admin';

  if (!isParticipant) {
    throw new ForbiddenError('Access denied');
  }

  await appointment.deleteOne();
}

/**
 * Request an appointment by booking an availability slot.
 * Sends email + in-app notification to the provider.
 *
 * @throws NotFoundError  — slot not found
 * @throws ConflictError  — slot is already booked
 * @throws BadRequestError — slot does not belong to the provider
 */
export async function requestAppointment(
  input: RequestAppointmentInput,
  user: CallerUser
): Promise<IAppointmentDocument> {
  const { providerId, slotId, type, notes } = input;

  // Find and validate the slot
  const slot = await AvailabilitySlot.findById(slotId);
  if (!slot) {
    throw new NotFoundError('Availability slot not found');
  }
  if (slot.isBooked) {
    throw new ConflictError('Slot is already booked');
  }
  if (slot.providerId.toString() !== providerId) {
    throw new BadRequestError('Slot does not belong to this provider');
  }

  // Create the appointment in "requested" state
  const appointment = new Appointment({
    clientId: user._id,
    providerId,
    startTime: slot.date,
    endTime: slot.date,
    type: type ?? 'virtual',
    notes,
    requestedBy: user._id,
    status: 'requested',
    availabilitySlotId: slot._id,
  });
  await appointment.save();

  // Mark slot as booked
  slot.isBooked = true;
  slot.appointmentId = appointment._id as mongoose.Types.ObjectId;
  await slot.save();

  // Send email + in-app notification to provider
  const provider = await User.findById(providerId).select('firstName lastName email');
  if (provider) {
    await sendAppointmentNotification('requested', {
      recipientEmail: provider.email,
      recipientName: provider.firstName,
      otherPartyName: `${user.firstName} ${user.lastName}`,
      startTime: slot.date,
      appointmentType: type ?? 'virtual',
      notes,
    });

    const dateLabel = new Date(slot.date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeLabel = `${slot.startTime}\u2013${slot.endTime}`;
    await new Message({
      conversationId: new mongoose.Types.ObjectId(),
      sender: user._id,
      receiver: provider._id,
      type: 'system',
      title: 'New Appointment Request',
      content: `${user.firstName} ${user.lastName} requested an appointment on ${dateLabel} at ${timeLabel} (${type === 'in_person' ? 'In Person' : 'Virtual'}).${notes ? ` Note: ${notes}` : ''}`,
      read: false,
    }).save();
  }

  return appointment;
}

/**
 * Request an appointment at a proposed date/time (no availability slot required).
 * Sends email + in-app notification to the provider.
 *
 * @throws BadRequestError — end time not after start time
 */
export async function requestProposedAppointment(
  input: RequestProposedInput,
  user: CallerUser
): Promise<IAppointmentDocument> {
  const { providerId, startTime, endTime, type, notes } = input;
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    throw new BadRequestError('End time must be after start time');
  }

  const appointment = new Appointment({
    clientId: user._id,
    providerId,
    startTime: start,
    endTime: end,
    type: type ?? 'virtual',
    notes,
    requestedBy: user._id,
    status: 'requested',
  });
  await appointment.save();

  const provider = await User.findById(providerId).select('firstName lastName email');
  if (provider) {
    await sendAppointmentNotification('requested', {
      recipientEmail: provider.email,
      recipientName: provider.firstName,
      otherPartyName: `${user.firstName} ${user.lastName}`,
      startTime: start,
      appointmentType: type ?? 'virtual',
      notes,
    });

    const dateLabel = start.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeLabel = start.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    await new Message({
      conversationId: new mongoose.Types.ObjectId(),
      sender: user._id,
      receiver: provider._id,
      type: 'system',
      title: 'New Appointment Request',
      content: `${user.firstName} ${user.lastName} proposed an appointment on ${dateLabel} at ${timeLabel} (${type === 'in_person' ? 'In Person' : 'Virtual'}).${notes ? ` Note: ${notes}` : ''}`,
      read: false,
    }).save();
  }

  return appointment;
}

/**
 * Confirm a requested appointment. Only the assigned provider or an admin
 * can confirm. Sends confirmation email to the client.
 *
 * @throws NotFoundError   — appointment not found
 * @throws BadRequestError — appointment is not in 'requested' status
 * @throws ForbiddenError  — caller is not the provider or admin
 */
export async function confirmAppointment(
  id: string,
  userId: string,
  userRole: string,
  userName: string
): Promise<IAppointmentDocument> {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  if (appointment.status !== 'requested') {
    throw new BadRequestError(
      `Cannot confirm an appointment with status '${appointment.status}'`
    );
  }

  const isProvider = appointment.providerId.toString() === userId;
  if (!isProvider && userRole !== 'admin') {
    throw new ForbiddenError('Forbidden');
  }

  appointment.status = 'confirmed';
  appointment.confirmedAt = new Date();
  await appointment.save();

  // Send confirmation email to client
  const client = await User.findById(appointment.clientId).select(
    'firstName lastName email'
  );
  if (client) {
    await sendAppointmentNotification('confirmed', {
      recipientEmail: client.email,
      recipientName: client.firstName,
      otherPartyName: userName,
      startTime: appointment.startTime,
      appointmentType: appointment.type ?? 'virtual',
      notes: appointment.notes,
    });
  }

  return appointment;
}

/**
 * Cancel an appointment. Frees the availability slot and notifies the other party.
 *
 * @throws NotFoundError   — appointment not found
 * @throws BadRequestError — appointment is already cancelled or completed
 * @throws ForbiddenError  — caller is not a participant
 */
export async function cancelAppointment(
  id: string,
  userId: string,
  userRole: string,
  userName: string,
  reason?: string
): Promise<IAppointmentDocument> {
  const appointment = await Appointment.findById(id);
  if (!appointment) {
    throw new NotFoundError('Appointment not found');
  }

  if (appointment.status === 'cancelled' || appointment.status === 'completed') {
    throw new BadRequestError(
      `Cannot cancel an appointment with status '${appointment.status}'`
    );
  }

  const isClient = appointment.clientId.toString() === userId;
  const isProvider = appointment.providerId.toString() === userId;
  if (!isClient && !isProvider && userRole !== 'admin') {
    throw new ForbiddenError('Forbidden');
  }

  appointment.status = 'cancelled';
  appointment.cancelledAt = new Date();
  appointment.cancelledBy = new mongoose.Types.ObjectId(userId);
  appointment.cancellationReason = reason ?? undefined;
  await appointment.save();

  // Free the availability slot
  if (appointment.availabilitySlotId) {
    await AvailabilitySlot.findByIdAndUpdate(appointment.availabilitySlotId, {
      isBooked: false,
      appointmentId: undefined,
    });
  }

  // Notify the other party
  const otherPartyId = isClient
    ? appointment.providerId
    : appointment.clientId;
  const otherParty = await User.findById(otherPartyId).select(
    'firstName lastName email'
  );
  if (otherParty) {
    await sendAppointmentNotification('cancelled', {
      recipientEmail: otherParty.email,
      recipientName: otherParty.firstName,
      otherPartyName: userName,
      startTime: appointment.startTime,
      appointmentType: appointment.type ?? 'virtual',
      reason,
    });
  }

  return appointment;
}

/**
 * Create an availability slot for a provider.
 *
 * @param providerId - Provider's ObjectId
 * @param data - Slot date, time range, and recurrence flag
 * @returns The newly created availability slot
 */
export async function createAvailabilitySlot(
  providerId: mongoose.Types.ObjectId,
  data: CreateAvailabilitySlotInput
): Promise<IAvailabilitySlotDocument> {
  const { date, startTime, endTime, recurring } = data;
  const dateStr = String(date).trim();
  const slotDate =
    /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
      ? new Date(`${dateStr}T12:00:00.000Z`)
      : new Date(date);

  const slot = new AvailabilitySlot({
    providerId,
    date: slotDate,
    startTime,
    endTime,
    isBooked: false,
    recurring: recurring ?? false,
  });
  await slot.save();

  return slot;
}

/**
 * Delete an availability slot belonging to a provider.
 *
 * @throws NotFoundError — slot not found or does not belong to provider
 */
export async function deleteAvailabilitySlot(
  id: string,
  providerId: mongoose.Types.ObjectId
): Promise<void> {
  const slot = await AvailabilitySlot.findOneAndDelete({
    _id: id,
    providerId,
  });
  if (!slot) {
    throw new NotFoundError('Slot not found');
  }
}

/**
 * Bulk create appointments for a provider.
 *
 * @param appointments - Array of appointment items to create
 * @param providerId - Provider's ObjectId assigned to all appointments
 * @returns Array of created appointment documents
 */
export async function bulkCreateAppointments(
  appointments: BulkAppointmentItem[],
  providerId: mongoose.Types.ObjectId
): Promise<IAppointmentDocument[]> {
  const created = await Appointment.insertMany(
    appointments.map((a) => ({
      clientId: new mongoose.Types.ObjectId(a.clientId),
      providerId,
      startTime: new Date(a.startTime),
      endTime: new Date(a.endTime),
      type: a.type ?? 'virtual',
      notes: a.notes ?? '',
      status: 'scheduled',
    }))
  );

  return created as IAppointmentDocument[];
}
