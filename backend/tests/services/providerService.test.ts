import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../src/models/Provider', () => {
  const MockProvider = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    populate: jest.fn().mockReturnThis(),
    status: 'active',
  }));
  (MockProvider as unknown as Record<string, unknown>).findOne = jest.fn();
  (MockProvider as unknown as Record<string, unknown>).aggregate = jest.fn();
  return { __esModule: true, default: MockProvider };
});

jest.mock('../../src/models/AvailabilitySlot', () => {
  const MockSlot = jest.fn();
  (MockSlot as unknown as Record<string, unknown>).find = jest.fn();
  (MockSlot as unknown as Record<string, unknown>).insertMany = jest.fn();
  return { __esModule: true, default: MockSlot };
});

jest.mock('../../src/models/Client', () => ({
  __esModule: true,
  default: { find: jest.fn(), create: jest.fn() },
}));

jest.mock('../../src/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    collection: { name: 'users' },
  },
}));

jest.mock('../../src/models/Appointment', () => ({
  __esModule: true,
  default: { find: jest.fn(), countDocuments: jest.fn() },
}));

jest.mock('../../src/models/CheckIn', () => ({
  __esModule: true,
  default: { aggregate: jest.fn() },
}));

jest.mock('../../src/models/Message', () => ({
  __esModule: true,
  default: { countDocuments: jest.fn() },
}));

jest.mock('../../src/models/Resources', () => ({
  __esModule: true,
  default: { countDocuments: jest.fn() },
}));

jest.mock('../../src/models/BlogPost', () => ({
  __esModule: true,
  default: { countDocuments: jest.fn() },
}));

jest.mock('../../src/services/emailService', () => ({
  sendRawEmail: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
}));

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import Provider from '../../src/models/Provider';
import AvailabilitySlot from '../../src/models/AvailabilitySlot';
import Client from '../../src/models/Client';
import User from '../../src/models/User';
import Appointment from '../../src/models/Appointment';
import CheckIn from '../../src/models/CheckIn';
import Message from '../../src/models/Message';
import Resources from '../../src/models/Resources';
import BlogPost from '../../src/models/BlogPost';
import type { IUser } from '../../src/models/User';
import {
  getMyProfile,
  updateMyProfile,
  getMyClients,
  getAvailability,
  createAvailabilitySlots,
  inviteClient,
  getAnalytics,
} from '../../src/services/providerService';
import { NotFoundError, ConflictError } from '../../src/utils/errors';

// ── Helpers ──────────────────────────────────────────────────────────────────

const oid = () => new mongoose.Types.ObjectId();

interface FakeProvider {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  status: string;
  professionalInfo: { bio: string; certifications: string[]; specialties: string[]; yearsExperience: number; languages: string[] };
  contactInfo: Record<string, unknown>;
  services: unknown[];
  serviceAreas: unknown[];
  availability: { isAcceptingClients: boolean; maxClients: number };
  save: jest.Mock;
  populate: jest.Mock;
  set: jest.Mock;
  [key: string]: unknown;
}

function fakeProvider(overrides: Partial<FakeProvider> = {}): FakeProvider {
  return {
    _id: oid(),
    userId: oid(),
    status: 'active',
    professionalInfo: { bio: '', certifications: [], specialties: [], yearsExperience: 0, languages: [] },
    contactInfo: { businessPhone: '', businessEmail: '', website: '', socialMedia: {} },
    services: [],
    serviceAreas: [],
    availability: { isAcceptingClients: true, maxClients: 20 },
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    populate: jest.fn().mockReturnThis() as jest.Mock,
    set: jest.fn(),
    ...overrides,
  };
}

/** Mock for Provider.findOne().populate() chain */
function mockProviderQuery(value: unknown) {
  (Provider.findOne as jest.Mock).mockReturnValue({
    populate: jest.fn().mockImplementation(() => Promise.resolve(value)),
  });
}

/** Mock for chained .populate().populate().sort() pattern */
function mockPopulateSort(value: unknown) {
  return {
    populate: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({
        sort: jest.fn().mockImplementation(() => Promise.resolve(value)),
      }),
    }),
  };
}

/** Mock for .sort().limit().populate().populate() */
function mockSortLimitPopulate(value: unknown) {
  return {
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockImplementation(() => Promise.resolve(value)),
        }),
      }),
    }),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('providerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getMyProfile ────────────────────────────────────────────────────────

  describe('getMyProfile', () => {
    it('returns existing active profile', async () => {
      const provider = fakeProvider();
      mockProviderQuery(provider);

      const result = await getMyProfile(oid());
      expect(result).toBe(provider);
    });

    it('creates a new profile when one does not exist', async () => {
      mockProviderQuery(null);

      const mockSave = jest.fn().mockImplementation(() => Promise.resolve(undefined));
      (Provider as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        populate: jest.fn().mockReturnThis(),
        status: 'active',
      }));

      await getMyProfile(oid());
      expect(mockSave).toHaveBeenCalled();
    });

    it('activates an inactive profile', async () => {
      const provider = fakeProvider({ status: 'inactive' });
      mockProviderQuery(provider);

      await getMyProfile(oid());
      expect(provider.status).toBe('active');
      expect(provider.save).toHaveBeenCalled();
    });
  });

  // ── updateMyProfile ─────────────────────────────────────────────────────

  describe('updateMyProfile', () => {
    it('throws NotFoundError when provider not found', async () => {
      (Provider.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(updateMyProfile(oid(), { bio: 'New bio' })).rejects.toThrow(NotFoundError);
    });

    it('updates bio and saves', async () => {
      const provider = fakeProvider();
      (Provider.findOne as jest.Mock).mockImplementation(() => Promise.resolve(provider));

      await updateMyProfile(oid(), { bio: 'Updated bio' });
      expect(provider.professionalInfo.bio).toBe('Updated bio');
      expect(provider.save).toHaveBeenCalled();
    });

    it('updates user firstName/lastName when provided', async () => {
      const provider = fakeProvider();
      (Provider.findOne as jest.Mock).mockImplementation(() => Promise.resolve(provider));

      const mockUserSave = jest.fn().mockImplementation(() => Promise.resolve(undefined));
      const mockUser = { firstName: 'Old', lastName: 'Name', save: mockUserSave };
      (User.findById as jest.Mock).mockImplementation(() => Promise.resolve(mockUser));

      await updateMyProfile(oid(), { firstName: 'New', lastName: 'Person' });
      expect(mockUser.firstName).toBe('New');
      expect(mockUser.lastName).toBe('Person');
      expect(mockUserSave).toHaveBeenCalled();
    });

    it('maps certification labels to enum values', async () => {
      const provider = fakeProvider();
      (Provider.findOne as jest.Mock).mockImplementation(() => Promise.resolve(provider));

      await updateMyProfile(oid(), {
        certifications: ['DONA Birth Doula', 'Lactation Consultant (IBCLC)'],
      });

      expect(provider.set).toHaveBeenCalledWith(
        'professionalInfo.certifications',
        ['DONA_Birth_Doula', 'Lactation_Consultant_IBCLC'],
      );
    });
  });

  // ── getMyClients ────────────────────────────────────────────────────────

  describe('getMyClients', () => {
    it('returns clients sorted by createdAt desc', async () => {
      const clients = [
        { _id: oid(), userId: { firstName: 'A', lastName: 'B' } },
        { _id: oid(), userId: { firstName: 'C', lastName: 'D' } },
      ];
      (Client.find as jest.Mock).mockReturnValue(mockPopulateSort(clients));

      const result = await getMyClients(oid());
      expect(result).toHaveLength(2);
    });
  });

  // ── getAvailability ─────────────────────────────────────────────────────

  describe('getAvailability', () => {
    it('returns available slots within date range', async () => {
      const slots = [{ date: new Date(), startTime: '09:00', endTime: '10:00' }];
      (AvailabilitySlot.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockImplementation(() => Promise.resolve(slots)),
      });

      const result = await getAvailability('providerId', undefined, undefined);
      expect(result.providerId).toBe('providerId');
      expect(result.slots).toEqual(slots);
    });

    it('uses provided date range', async () => {
      (AvailabilitySlot.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockImplementation(() => Promise.resolve([])),
      });

      const from = new Date('2026-04-01');
      const to = new Date('2026-04-30');
      const result = await getAvailability('providerId', from, to);
      expect(result.from.getTime()).toBeLessThanOrEqual(from.getTime());
      expect(result.to).toBe(to);
    });
  });

  // ── createAvailabilitySlots ─────────────────────────────────────────────

  describe('createAvailabilitySlots', () => {
    it('creates slots with correct data', async () => {
      const slots = [
        { date: '2026-04-01', startTime: '09:00', endTime: '10:00' },
        { date: '2026-04-02', startTime: '14:00', endTime: '15:00', recurring: true },
      ];
      (AvailabilitySlot.insertMany as jest.Mock).mockImplementation(() =>
        Promise.resolve(slots.map(s => ({ ...s, isBooked: false }))),
      );

      const result = await createAvailabilitySlots('providerId', slots);
      expect(AvailabilitySlot.insertMany).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            providerId: 'providerId',
            startTime: '09:00',
            endTime: '10:00',
            recurring: false,
            isBooked: false,
          }),
          expect.objectContaining({ recurring: true }),
        ]),
      );
      expect(result).toHaveLength(2);
    });
  });

  // ── inviteClient ────────────────────────────────────────────────────────

  describe('inviteClient', () => {
    it('throws ConflictError when email already exists', async () => {
      (User.findOne as jest.Mock).mockImplementation(() =>
        Promise.resolve({ email: 'existing@test.com' }),
      );

      const provider = { _id: oid(), firstName: 'Dr', lastName: 'Smith' } as unknown as IUser;
      await expect(
        inviteClient({ email: 'existing@test.com', firstName: 'Jane', lastName: 'Doe' }, provider),
      ).rejects.toThrow(ConflictError);
    });

    it('creates user, client profile, and sends invite', async () => {
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

      const newUserId = oid();
      (User.create as jest.Mock).mockImplementation(() =>
        Promise.resolve({
          _id: newUserId,
          email: 'new@test.com',
          firstName: 'Jane',
          lastName: 'Doe',
        }),
      );
      (Client.create as jest.Mock).mockImplementation(() =>
        Promise.resolve({ userId: newUserId }),
      );

      const provider = { _id: oid(), firstName: 'Dr', lastName: 'Smith' } as unknown as IUser;
      const result = await inviteClient(
        { email: 'new@test.com', firstName: 'Jane', lastName: 'Doe' },
        provider,
      );

      expect(result.email).toBe('new@test.com');
      expect(result.firstName).toBe('Jane');
      expect(User.create).toHaveBeenCalled();
      expect(Client.create).toHaveBeenCalledWith({ userId: newUserId });
    });
  });

  // ── getAnalytics ────────────────────────────────────────────────────────

  describe('getAnalytics', () => {
    it('returns aggregated analytics data', async () => {
      const providerId = oid();
      const clientUserId = oid();

      (Client.find as jest.Mock).mockImplementation(() =>
        Promise.resolve([{ userId: clientUserId, status: 'active' }]),
      );
      (Appointment.countDocuments as jest.Mock)
        .mockImplementationOnce(() => Promise.resolve(10))
        .mockImplementationOnce(() => Promise.resolve(5))
        .mockImplementationOnce(() => Promise.resolve(2))
        .mockImplementationOnce(() => Promise.resolve(3));
      (CheckIn.aggregate as jest.Mock).mockImplementation(() =>
        Promise.resolve([{ avgMood: 7.5 }]),
      );
      (Message.countDocuments as jest.Mock).mockImplementation(() => Promise.resolve(20));
      (Resources.countDocuments as jest.Mock).mockImplementation(() => Promise.resolve(8));
      (BlogPost.countDocuments as jest.Mock).mockImplementation(() => Promise.resolve(4));
      (Appointment.find as jest.Mock).mockReturnValue(mockSortLimitPopulate([]));

      const result = await getAnalytics(providerId);
      expect(result.totalClients).toBe(1);
      expect(result.activeClients).toBe(1);
      expect(result.totalAppointments).toBe(10);
      expect(result.completedAppointments).toBe(5);
      expect(result.cancelledAppointments).toBe(2);
      expect(result.upcomingAppointments).toBe(3);
      expect(result.averageCheckInMood).toBe(7.5);
      expect(result.totalMessages).toBe(20);
      expect(result.totalResources).toBe(8);
      expect(result.totalBlogPosts).toBe(4);
    });

    it('returns null averageCheckInMood when no check-in data', async () => {
      const providerId = oid();

      (Client.find as jest.Mock).mockImplementation(() => Promise.resolve([]));
      (Appointment.countDocuments as jest.Mock).mockImplementation(() => Promise.resolve(0));
      (CheckIn.aggregate as jest.Mock).mockImplementation(() => Promise.resolve([]));
      (Message.countDocuments as jest.Mock).mockImplementation(() => Promise.resolve(0));
      (Resources.countDocuments as jest.Mock).mockImplementation(() => Promise.resolve(0));
      (BlogPost.countDocuments as jest.Mock).mockImplementation(() => Promise.resolve(0));
      (Appointment.find as jest.Mock).mockReturnValue(mockSortLimitPopulate([]));

      const result = await getAnalytics(providerId);
      expect(result.averageCheckInMood).toBeNull();
      expect(result.totalClients).toBe(0);
    });
  });
});
