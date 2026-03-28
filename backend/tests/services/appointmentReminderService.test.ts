import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

jest.mock('../../src/models/Appointment', () => ({
  __esModule: true,
  default: { find: jest.fn().mockImplementation(() => Promise.resolve([])) },
}));

jest.mock('../../src/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn().mockReturnValue({
      select: jest.fn().mockImplementation(() => Promise.resolve(null)),
    }),
  },
}));

jest.mock('../../src/services/appointmentNotificationService', () => ({
  sendAppointmentNotification: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
}));

import {
  processAppointmentReminders,
  startReminderScheduler,
  stopReminderScheduler,
} from '../../src/services/appointmentReminderService';
import Appointment from '../../src/models/Appointment';
import User from '../../src/models/User';
import { sendAppointmentNotification } from '../../src/services/appointmentNotificationService';

const mockApptFind = Appointment.find as unknown as jest.Mock<(...args: unknown[]) => Promise<unknown>>;
const mockUserFindById = User.findById as unknown as jest.Mock<(...args: unknown[]) => unknown>;
const mockNotify = sendAppointmentNotification as unknown as jest.Mock<(...args: unknown[]) => Promise<unknown>>;

function makeAppt(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'appt-1',
    clientId: 'client-1',
    providerId: 'provider-1',
    startTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
    type: 'virtual',
    reminderSentAt: undefined,
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    ...overrides,
  };
}

describe('appointmentReminderService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockApptFind.mockResolvedValue([]);
  });

  afterEach(() => {
    stopReminderScheduler();
    jest.useRealTimers();
  });

  it('startReminderScheduler does not throw', () => {
    expect(() => startReminderScheduler()).not.toThrow();
  });

  it('calling startReminderScheduler twice is idempotent', () => {
    startReminderScheduler();
    expect(() => startReminderScheduler()).not.toThrow();
  });

  it('stopReminderScheduler stops cleanly', () => {
    startReminderScheduler();
    expect(() => stopReminderScheduler()).not.toThrow();
  });

  it('stopReminderScheduler is safe to call when not running', () => {
    expect(() => stopReminderScheduler()).not.toThrow();
  });

  it('processAppointmentReminders returns 0 when no appointments found', async () => {
    mockApptFind.mockResolvedValueOnce([]);
    const sent = await processAppointmentReminders();
    expect(sent).toBe(0);
  });

  it('sends reminders to both client and provider', async () => {
    const appt = makeAppt();
    mockApptFind.mockResolvedValueOnce([appt]);

    const selectMock = jest.fn<() => Promise<unknown>>();
    selectMock
      .mockResolvedValueOnce({
        email: 'client@example.com', firstName: 'Alice', lastName: 'A',
      })
      .mockResolvedValueOnce({
        email: 'provider@example.com', firstName: 'Dr', lastName: 'B',
      });
    mockUserFindById.mockReturnValue({ select: selectMock });

    const sent = await processAppointmentReminders();
    expect(sent).toBe(1);
    expect(mockNotify).toHaveBeenCalledTimes(2);
    expect(appt.save).toHaveBeenCalled();
  });

  it('sends only to client when provider not found', async () => {
    const appt = makeAppt();
    mockApptFind.mockResolvedValueOnce([appt]);

    const selectMock = jest.fn<() => Promise<unknown>>();
    selectMock
      .mockResolvedValueOnce({
        email: 'client@example.com', firstName: 'Alice', lastName: 'A',
      })
      .mockResolvedValueOnce(null);
    mockUserFindById.mockReturnValue({ select: selectMock });

    const sent = await processAppointmentReminders();
    expect(sent).toBe(1);
    expect(mockNotify).toHaveBeenCalledTimes(1);
  });

  it('skips notifications when client not found', async () => {
    const appt = makeAppt();
    mockApptFind.mockResolvedValueOnce([appt]);

    const selectMock = jest.fn().mockImplementation(() => Promise.resolve(null));
    mockUserFindById.mockReturnValue({ select: selectMock });

    const sent = await processAppointmentReminders();
    expect(sent).toBe(1);
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('returns 0 when appointment scan throws', async () => {
    mockApptFind.mockRejectedValueOnce(new Error('DB down'));
    const sent = await processAppointmentReminders();
    expect(sent).toBe(0);
  });

  it('continues processing when individual reminder fails', async () => {
    const appt1 = makeAppt({ _id: 'appt-1' });
    const appt2 = makeAppt({ _id: 'appt-2' });
    mockApptFind.mockResolvedValueOnce([appt1, appt2]);

    let callCount = 0;
    const selectMock = jest.fn().mockImplementation(() => {
      callCount++;
      // First call (appt1 client lookup) throws
      if (callCount === 1) return Promise.reject(new Error('lookup fail'));
      // Rest succeed
      return Promise.resolve({
        email: 'u@example.com', firstName: 'U', lastName: 'U',
      });
    });
    mockUserFindById.mockReturnValue({ select: selectMock });

    const sent = await processAppointmentReminders();
    expect(sent).toBe(1);
  });
});
