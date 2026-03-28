import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../src/models/Appointment', () => {
  const mockSave = jest.fn();
  const mockDeleteOne = jest.fn();
  const MockAppointment = jest.fn().mockImplementation(() => ({
    save: mockSave,
    deleteOne: mockDeleteOne,
    populate: jest.fn().mockReturnThis(),
  }));
  (MockAppointment as unknown as Record<string, unknown>).find = jest.fn();
  (MockAppointment as unknown as Record<string, unknown>).findById = jest.fn();
  (MockAppointment as unknown as Record<string, unknown>).insertMany = jest.fn();
  return { __esModule: true, default: MockAppointment };
});

jest.mock('../../src/models/AvailabilitySlot', () => {
  const MockSlot = jest.fn().mockImplementation(() => ({ save: jest.fn() }));
  (MockSlot as unknown as Record<string, unknown>).find = jest.fn();
  (MockSlot as unknown as Record<string, unknown>).findById = jest.fn();
  (MockSlot as unknown as Record<string, unknown>).findOneAndDelete = jest.fn();
  (MockSlot as unknown as Record<string, unknown>).findByIdAndUpdate = jest.fn();
  return { __esModule: true, default: MockSlot };
});

jest.mock('../../src/models/User', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('../../src/models/Message', () => {
  const mockSave = jest.fn();
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({ save: mockSave })),
  };
});

jest.mock('../../src/services/appointmentNotificationService', () => ({
  sendAppointmentNotification: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import Appointment from '../../src/models/Appointment';
import AvailabilitySlot from '../../src/models/AvailabilitySlot';
import {
  listAppointments,
  getUpcomingAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  requestAppointment,
  requestProposedAppointment,
  confirmAppointment,
  cancelAppointment,
  deleteAvailabilitySlot,
  bulkCreateAppointments,
} from '../../src/services/appointmentService';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../src/utils/errors';

// ── Helpers ──────────────────────────────────────────────────────────────────

const oid = () => new mongoose.Types.ObjectId();

function fakeAppointment(overrides: Record<string, unknown> = {}) {
  const clientId = oid();
  const providerId = oid();
  return {
    _id: oid(),
    clientId: { _id: clientId, toString: () => clientId.toString() },
    providerId: { _id: providerId, toString: () => providerId.toString() },
    startTime: new Date('2026-04-01T10:00:00Z'),
    endTime: new Date('2026-04-01T11:00:00Z'),
    status: 'scheduled',
    type: 'virtual',
    notes: '',
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    deleteOne: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    populate: jest.fn().mockReturnThis(),
    ...overrides,
  };
}

/** Builds a chainable mock for Mongoose .find().sort().skip().limit().populate().populate() */
function chainedFind(result: unknown): Record<string, jest.Mock> {
  const resolve = () => Promise.resolve(result);
  const populatePair = () => ({
    populate: jest.fn().mockReturnValue({ populate: jest.fn().mockImplementation(resolve) }),
  });
  return {
    sort: jest.fn().mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue(populatePair()),
      }),
      limit: jest.fn().mockReturnValue(populatePair()),
      ...populatePair(),
    }),
    ...populatePair(),
  };
}

/** Builds a mock for .findById().populate().populate() → resolves to value */
function mockPopulateChain(value: unknown) {
  return {
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockImplementation(() => Promise.resolve(value)),
    }),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('appointmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── listAppointments ────────────────────────────────────────────────────

  describe('listAppointments', () => {
    it('returns appointments for a provider role', async () => {
      const appt = fakeAppointment();
      (Appointment.find as jest.Mock).mockReturnValue(chainedFind([appt]));

      const userId = oid();
      const result = await listAppointments(userId, 'provider', 1, 20);
      expect(Appointment.find).toHaveBeenCalledWith({ providerId: userId });
      expect(result).toEqual([appt]);
    });

    it('filters by clientId for non-provider role', async () => {
      (Appointment.find as jest.Mock).mockReturnValue(chainedFind([]));

      const userId = oid();
      await listAppointments(userId, 'client', 1, 20);
      expect(Appointment.find).toHaveBeenCalledWith({ clientId: userId });
    });
  });

  // ── getUpcomingAppointments ─────────────────────────────────────────────

  describe('getUpcomingAppointments', () => {
    it('returns upcoming appointments sorted by startTime asc', async () => {
      const appt = fakeAppointment();
      (Appointment.find as jest.Mock).mockReturnValue(chainedFind([appt]));

      const userId = oid();
      const result = await getUpcomingAppointments(userId, 'client', 5);
      expect(result).toEqual([appt]);
    });
  });

  // ── getAppointmentById ──────────────────────────────────────────────────

  describe('getAppointmentById', () => {
    it('throws NotFoundError when appointment does not exist', async () => {
      (Appointment.findById as jest.Mock).mockReturnValue(mockPopulateChain(null));

      await expect(getAppointmentById('badId', 'userId', 'client')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when caller is not a participant', async () => {
      const appt = fakeAppointment();
      (Appointment.findById as jest.Mock).mockReturnValue(mockPopulateChain(appt));

      await expect(
        getAppointmentById('id', 'unrelatedUser', 'client'),
      ).rejects.toThrow(ForbiddenError);
    });

    it('allows admin access to any appointment', async () => {
      const appt = fakeAppointment();
      (Appointment.findById as jest.Mock).mockReturnValue(mockPopulateChain(appt));

      const result = await getAppointmentById('id', 'anyAdminId', 'admin');
      expect(result).toBe(appt);
    });

    it('returns appointment when caller is a participant', async () => {
      const clientId = oid();
      const appt = fakeAppointment({
        clientId: { _id: clientId, toString: () => clientId.toString() },
      });
      (Appointment.findById as jest.Mock).mockReturnValue(mockPopulateChain(appt));

      const result = await getAppointmentById('id', clientId.toString(), 'client');
      expect(result).toBe(appt);
    });
  });

  // ── createAppointment ──────────────────────────────────────────────────

  describe('createAppointment', () => {
    it('throws ForbiddenError when non-provider/admin schedules for another client', async () => {
      const user = { _id: oid(), role: 'client' as const, firstName: 'A', lastName: 'B' };
      const data = {
        clientId: oid().toString(),
        providerId: oid().toString(),
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
      };

      await expect(createAppointment(data, user)).rejects.toThrow(ForbiddenError);
    });

    it('allows a provider to create an appointment', async () => {
      const providerId = oid();
      const clientId = oid();
      const user = { _id: providerId, role: 'provider' as const, firstName: 'Dr', lastName: 'Smith' };

      const mockSave = jest.fn().mockImplementation(() => Promise.resolve(undefined));
      const mockPopulate = jest.fn().mockReturnThis();
      (Appointment as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        populate: mockPopulate,
      }));

      const data = {
        clientId: clientId.toString(),
        providerId: providerId.toString(),
        startTime: '2026-04-01T10:00:00Z',
        endTime: '2026-04-01T11:00:00Z',
      };

      await createAppointment(data, user);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  // ── updateAppointment ──────────────────────────────────────────────────

  describe('updateAppointment', () => {
    it('throws NotFoundError when appointment not found', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(
        updateAppointment('badId', { status: 'completed' }, 'userId', 'provider'),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when caller is not a participant', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          clientId: { toString: () => 'c1' },
          providerId: { toString: () => 'p1' },
        }),
      );

      await expect(
        updateAppointment('id', { status: 'completed' }, 'otherUser', 'client'),
      ).rejects.toThrow(ForbiddenError);
    });

    it('updates status and time fields when authorized', async () => {
      const clientId = oid().toString();
      const mockSave = jest.fn().mockImplementation(() => Promise.resolve(undefined));
      const appt = {
        clientId: { toString: () => clientId },
        providerId: { toString: () => 'p1' },
        status: 'scheduled',
        startTime: new Date(),
        endTime: new Date(),
        notes: '',
        save: mockSave,
      };
      (Appointment.findById as jest.Mock).mockImplementation(() => Promise.resolve(appt));

      const result = await updateAppointment(
        'id',
        { status: 'completed', notes: 'Done' },
        clientId,
        'client',
      );
      expect(result.status).toBe('completed');
      expect(result.notes).toBe('Done');
      expect(mockSave).toHaveBeenCalled();
    });
  });

  // ── deleteAppointment ──────────────────────────────────────────────────

  describe('deleteAppointment', () => {
    it('throws NotFoundError when appointment not found', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(deleteAppointment('badId', 'uid', 'client')).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError for non-participant', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          clientId: { toString: () => 'c1' },
          providerId: { toString: () => 'p1' },
        }),
      );

      await expect(deleteAppointment('id', 'other', 'client')).rejects.toThrow(ForbiddenError);
    });

    it('deletes when admin', async () => {
      const mockDeleteOne = jest.fn().mockImplementation(() => Promise.resolve(undefined));
      (Appointment.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          clientId: { toString: () => 'c1' },
          providerId: { toString: () => 'p1' },
          deleteOne: mockDeleteOne,
        }),
      );

      await deleteAppointment('id', 'adminUser', 'admin');
      expect(mockDeleteOne).toHaveBeenCalled();
    });
  });

  // ── requestAppointment ─────────────────────────────────────────────────

  describe('requestAppointment', () => {
    it('throws NotFoundError when slot not found', async () => {
      (AvailabilitySlot.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      const user = { _id: oid(), role: 'client' as const, firstName: 'A', lastName: 'B' };
      await expect(
        requestAppointment({ providerId: 'p1', slotId: 'badSlot' }, user),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ConflictError when slot is already booked', async () => {
      (AvailabilitySlot.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({ isBooked: true, providerId: { toString: () => 'p1' } }),
      );

      const user = { _id: oid(), role: 'client' as const, firstName: 'A', lastName: 'B' };
      await expect(
        requestAppointment({ providerId: 'p1', slotId: 'slot1' }, user),
      ).rejects.toThrow(ConflictError);
    });

    it('throws BadRequestError when slot does not belong to provider', async () => {
      (AvailabilitySlot.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({ isBooked: false, providerId: { toString: () => 'differentProvider' } }),
      );

      const user = { _id: oid(), role: 'client' as const, firstName: 'A', lastName: 'B' };
      await expect(
        requestAppointment({ providerId: 'p1', slotId: 'slot1' }, user),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // ── requestProposedAppointment ─────────────────────────────────────────

  describe('requestProposedAppointment', () => {
    it('throws BadRequestError when endTime is before startTime', async () => {
      const user = { _id: oid(), role: 'client' as const, firstName: 'A', lastName: 'B' };
      await expect(
        requestProposedAppointment(
          {
            providerId: 'p1',
            startTime: '2026-04-01T11:00:00Z',
            endTime: '2026-04-01T10:00:00Z',
          },
          user,
        ),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // ── confirmAppointment ─────────────────────────────────────────────────

  describe('confirmAppointment', () => {
    it('throws NotFoundError when appointment not found', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(confirmAppointment('badId', 'uid', 'provider', 'Name')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws BadRequestError when status is not requested', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({ status: 'completed', providerId: { toString: () => 'p1' } }),
      );

      await expect(confirmAppointment('id', 'p1', 'provider', 'Name')).rejects.toThrow(
        BadRequestError,
      );
    });

    it('throws ForbiddenError when caller is not the provider or admin', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({ status: 'requested', providerId: { toString: () => 'p1' } }),
      );

      await expect(confirmAppointment('id', 'otherUser', 'client', 'Name')).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  // ── cancelAppointment ──────────────────────────────────────────────────

  describe('cancelAppointment', () => {
    it('throws NotFoundError when appointment not found', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(cancelAppointment('badId', 'uid', 'client', 'Name')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws BadRequestError when status is cancelled or completed', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          status: 'cancelled',
          clientId: { toString: () => 'c1' },
          providerId: { toString: () => 'p1' },
        }),
      );

      await expect(cancelAppointment('id', 'c1', 'client', 'Name')).rejects.toThrow(
        BadRequestError,
      );
    });

    it('throws ForbiddenError for non-participant', async () => {
      (Appointment.findById as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          status: 'scheduled',
          clientId: { toString: () => 'c1' },
          providerId: { toString: () => 'p1' },
        }),
      );

      await expect(cancelAppointment('id', 'other', 'client', 'Name')).rejects.toThrow(
        ForbiddenError,
      );
    });
  });

  // ── deleteAvailabilitySlot ─────────────────────────────────────────────

  describe('deleteAvailabilitySlot', () => {
    it('throws NotFoundError when slot not found', async () => {
      (AvailabilitySlot.findOneAndDelete as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(deleteAvailabilitySlot('badId', oid())).rejects.toThrow(NotFoundError);
    });

    it('succeeds when slot exists', async () => {
      (AvailabilitySlot.findOneAndDelete as jest.Mock).mockImplementation(() =>
        Promise.resolve({ _id: 'slot1' }),
      );

      await expect(deleteAvailabilitySlot('slot1', oid())).resolves.toBeUndefined();
    });
  });

  // ── bulkCreateAppointments ─────────────────────────────────────────────

  describe('bulkCreateAppointments', () => {
    it('creates multiple appointments', async () => {
      const items = [
        { clientId: oid().toString(), startTime: '2026-04-01T10:00:00Z', endTime: '2026-04-01T11:00:00Z' },
        { clientId: oid().toString(), startTime: '2026-04-02T10:00:00Z', endTime: '2026-04-02T11:00:00Z' },
      ];
      const mockResult = items.map(() => fakeAppointment());
      (Appointment.insertMany as jest.Mock).mockImplementation(() => Promise.resolve(mockResult));

      const result = await bulkCreateAppointments(items, oid());
      expect(Appointment.insertMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });
  });
});
