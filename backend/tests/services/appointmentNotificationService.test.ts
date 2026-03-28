import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// CJS-compatible mock
jest.mock('../../src/services/emailService', () => ({
  sendEmail: jest.fn().mockImplementation(() => Promise.resolve('msg-ok')),
}));

import { sendAppointmentNotification } from '../../src/services/appointmentNotificationService';
import { sendEmail } from '../../src/services/emailService';

const mockSendEmail = sendEmail as jest.Mock<(...args: unknown[]) => Promise<unknown>>;

interface EmailCall {
  to: string;
  template: string;
  data: Record<string, string>;
}

const basePayload = {
  recipientEmail: 'test@example.com',
  recipientName: 'Jane',
  otherPartyName: 'Dr. Smith',
  startTime: new Date('2026-04-01T10:00:00Z'),
  appointmentType: 'virtual',
};

describe('appointmentNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue('msg-ok');
  });

  it('sends a requested notification email', async () => {
    await sendAppointmentNotification('requested', basePayload);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const call = mockSendEmail.mock.calls[0][0] as EmailCall;
    expect(call.to).toBe('test@example.com');
    expect(call.template).toBe('appointment-request');
    expect(call.data.clientName).toBe('Dr. Smith');
  });

  it('sends a confirmed notification email', async () => {
    await sendAppointmentNotification('confirmed', basePayload);
    const call = mockSendEmail.mock.calls[0][0] as EmailCall;
    expect(call.template).toBe('appointment');
    expect(call.to).toBe('test@example.com');
  });

  it('sends a cancelled notification with reason', async () => {
    await sendAppointmentNotification('cancelled', {
      ...basePayload,
      reason: 'Schedule conflict',
    });
    const call = mockSendEmail.mock.calls[0][0] as EmailCall;
    expect(call.template).toBe('appointment-cancelled');
    expect(call.data.appointmentNotes).toBe('Schedule conflict');
  });

  it('sends a reminder notification', async () => {
    await sendAppointmentNotification('reminder', basePayload);
    const call = mockSendEmail.mock.calls[0][0] as EmailCall;
    expect(call.template).toBe('appointment');
    expect(call.to).toBe('test@example.com');
  });

  it('does not throw when email sending fails', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'));
    await expect(
      sendAppointmentNotification('requested', basePayload)
    ).resolves.toBeUndefined();
  });

  it('includes formatted date and time in email data', async () => {
    await sendAppointmentNotification('confirmed', basePayload);
    const call = mockSendEmail.mock.calls[0][0] as EmailCall;
    expect(call.data.appointmentDate).toBeDefined();
    expect(call.data.appointmentTime).toBeDefined();
    expect(call.data.clientName).toBe('Jane');
    expect(call.data.doulaName).toBe('Dr. Smith');
  });

  it('uses notes when reason is not provided', async () => {
    await sendAppointmentNotification('requested', {
      ...basePayload,
      notes: 'First visit',
    });
    const call = mockSendEmail.mock.calls[0][0] as EmailCall;
    expect(call.data.appointmentNotes).toBe('First visit');
  });
});
