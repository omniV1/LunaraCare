import { sendEmail } from './emailService';
import logger from '../utils/logger';

export type AppointmentEvent = 'requested' | 'confirmed' | 'cancelled' | 'reminder';

export interface NotificationPayload {
  recipientEmail: string;
  recipientName: string;
  otherPartyName: string;
  startTime: Date;
  appointmentType: string;
  notes?: string;
  reason?: string;
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(d: Date): string {
  return new Date(d).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Send an appointment lifecycle email using the correct template for each event.
 *
 * - 'requested'  → 'appointment-request' template  (sent to provider)
 * - 'confirmed'  → 'appointment'         template  (sent to client)
 * - 'cancelled'  → 'appointment-cancelled' template (sent to the other party)
 * - 'reminder'   → 'appointment'         template  (sent to client)
 */
export async function sendAppointmentNotification(
  event: AppointmentEvent,
  payload: NotificationPayload
): Promise<void> {
  const dateStr = formatDate(payload.startTime);
  const timeStr = formatTime(payload.startTime);

  let template: string;
  let data: Record<string, string>;

  if (event === 'requested') {
    // Recipient is the provider; otherPartyName is the client
    template = 'appointment-request';
    data = {
      providerName: payload.recipientName ?? 'Provider',
      clientName: payload.otherPartyName,
      appointmentDate: dateStr,
      appointmentTime: timeStr,
      appointmentType: payload.appointmentType === 'in_person' ? 'In Person' : 'Virtual',
      appointmentNotes: payload.notes ?? '',
    };
  } else if (event === 'cancelled') {
    template = 'appointment-cancelled';
    data = {
      clientName: payload.recipientName ?? 'there',
      doulaName: payload.otherPartyName,
      appointmentDate: dateStr,
      appointmentTime: timeStr,
      appointmentNotes: payload.reason ?? payload.notes ?? '',
    };
  } else {
    // 'confirmed' | 'reminder' — recipient is the client
    template = 'appointment';
    data = {
      clientName: payload.recipientName ?? 'there',
      doulaName: payload.otherPartyName,
      appointmentDate: dateStr,
      appointmentTime: timeStr,
      appointmentType: payload.appointmentType === 'in_person' ? 'In Person' : 'Virtual',
      appointmentNotes: payload.notes ?? '',
    };
  }

  try {
    await sendEmail({ to: payload.recipientEmail, template, data });
    logger.info(`Appointment ${event} notification sent to ${payload.recipientEmail}`);
  } catch (error) {
    // Log but don't throw – email failures shouldn't block the API response
    logger.error(`Failed to send appointment ${event} notification to ${payload.recipientEmail}: ${String(error)}`);
  }
}
