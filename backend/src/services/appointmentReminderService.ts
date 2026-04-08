/**
 * @module services/appointmentReminderService
 * Polls for upcoming confirmed/scheduled appointments and sends reminder
 * emails to both client and provider 24 hours before the appointment.
 * Designed to run on a recurring interval via {@link startReminderScheduler}.
 */

import Appointment from '../models/Appointment';
import User from '../models/User';
import { sendAppointmentNotification } from './appointmentNotificationService';
import logger from '../utils/logger';

// Send reminders 24h before so clients have time to prepare or reschedule.
// Appointments created <24h out still get a reminder on the next poll cycle.
const REMINDER_LEAD_MS = 24 * 60 * 60 * 1000;

/**
 * Scan for upcoming appointments that need a reminder email
 * and haven't had one sent yet.
 *
 * Intended to be called periodically (e.g. via setInterval or a cron job).
 *
 * @returns The number of reminders successfully sent this cycle
 */
export async function processAppointmentReminders(): Promise<number> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + REMINDER_LEAD_MS);

  try {
    const appointments = await Appointment.find({
      status: { $in: ['confirmed', 'scheduled'] },
      startTime: { $gte: now, $lte: cutoff },
      reminderSentAt: { $exists: false },
    });

    let sent = 0;

    for (const appt of appointments) {
      try {
        const client = await User.findById(appt.clientId).select(
          'firstName lastName email'
        );
        const provider = await User.findById(appt.providerId).select(
          'firstName lastName email'
        );

        if (client) {
          await sendAppointmentNotification('reminder', {
            recipientEmail: client.email,
            recipientName: client.firstName,
            otherPartyName: provider
              ? `${provider.firstName} ${provider.lastName}`
              : 'your provider',
            startTime: appt.startTime,
            appointmentType: appt.type ?? 'virtual',
          });
        }

        if (provider) {
          await sendAppointmentNotification('reminder', {
            recipientEmail: provider.email,
            recipientName: provider.firstName,
            otherPartyName: client
              ? `${client.firstName} ${client.lastName}`
              : 'your client',
            startTime: appt.startTime,
            appointmentType: appt.type ?? 'virtual',
          });
        }

        appt.reminderSentAt = new Date();
        await appt.save();
        sent++;
      } catch (err) {
        logger.error(
          `Reminder failed for appointment ${String(appt._id)}: ${String(err)}`
        );
      }
    }

    if (sent > 0) {
      logger.info(`Sent ${sent} appointment reminder(s)`);
    }
    return sent;
  } catch (error) {
    logger.error(`Reminder scan failed: ${String(error)}`);
    return 0;
  }
}

let reminderInterval: ReturnType<typeof setInterval> | null = null;

/** Start the reminder polling loop (every 15 minutes). */
export function startReminderScheduler(): void {
  if (reminderInterval) return;
  // 15-min polling: frequent enough that a missed reminder is caught within
  // one cycle, infrequent enough to avoid excessive DB queries on small infra.
  const FIFTEEN_MIN = 15 * 60 * 1000;
  reminderInterval = setInterval(() => {
    processAppointmentReminders().catch(() => {});
  }, FIFTEEN_MIN);
  logger.info('Appointment reminder scheduler started (every 15 min)');
}

/** Stop the reminder polling loop. */
export function stopReminderScheduler(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
    logger.info('Appointment reminder scheduler stopped');
  }
}
