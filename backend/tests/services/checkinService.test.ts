import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../src/models/CheckIn', () => {
  const MockCheckIn = jest.fn().mockImplementation(() => ({
    save: jest.fn(),
  }));
  (MockCheckIn as unknown as Record<string, unknown>).find = jest.fn();
  (MockCheckIn as unknown as Record<string, unknown>).updateMany = jest.fn();
  (MockCheckIn as unknown as Record<string, unknown>).aggregate = jest.fn();
  return { __esModule: true, default: MockCheckIn };
});

jest.mock('../../src/models/Client', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../../src/services/checkinTrendService', () => ({
  getCheckInTrends: jest.fn(),
  getCheckInAlerts: jest.fn(),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import CheckIn from '../../src/models/CheckIn';
import { getCheckInTrends, getCheckInAlerts } from '../../src/services/checkinTrendService';
import {
  canAccessUserCheckins,
  createCheckIn,
  getUserCheckIns,
  getUserTrends,
  markCheckInsReviewed,
} from '../../src/services/checkinService';
import { ForbiddenError, ConflictError } from '../../src/utils/errors';

// ── Helpers ──────────────────────────────────────────────────────────────────

const oid = () => new mongoose.Types.ObjectId();

// ── Tests ────────────────────────────────────────────────────────────────────

describe('checkinService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── canAccessUserCheckins ───────────────────────────────────────────────

  describe('canAccessUserCheckins', () => {
    it('returns true when userId equals targetUserId', () => {
      expect(canAccessUserCheckins('user1', 'client', 'user1')).toBe(true);
    });

    it('returns true for provider role', () => {
      expect(canAccessUserCheckins('provider1', 'provider', 'anyUser')).toBe(true);
    });

    it('returns true for admin role', () => {
      expect(canAccessUserCheckins('admin1', 'admin', 'anyUser')).toBe(true);
    });

    it('returns false when client tries to access another user', () => {
      expect(canAccessUserCheckins('user1', 'client', 'user2')).toBe(false);
    });
  });

  // ── createCheckIn ──────────────────────────────────────────────────────

  describe('createCheckIn', () => {
    it('creates a check-in and returns alerts', async () => {
      const userId = oid();
      const mockSave = jest.fn().mockImplementation(() => Promise.resolve(undefined));
      (CheckIn as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        userId,
        date: new Date('2026-03-21'),
        moodScore: 7,
        physicalSymptoms: [],
        notes: '',
        sharedWithProvider: false,
      }));
      (getCheckInAlerts as jest.Mock).mockImplementation(() => Promise.resolve([]));

      const result = await createCheckIn(
        { date: '2026-03-21', moodScore: 7 },
        userId,
      );

      expect(mockSave).toHaveBeenCalled();
      expect(result.message).toBe('Check-in recorded');
      expect(result.alerts).toEqual([]);
    });

    it('throws ConflictError on duplicate date (code 11000)', async () => {
      const userId = oid();
      const duplicateError = Object.assign(new Error('duplicate key'), { code: 11000 });
      (CheckIn as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockImplementation(() => Promise.reject(duplicateError)),
      }));

      await expect(
        createCheckIn({ date: '2026-03-21', moodScore: 7 }, userId),
      ).rejects.toThrow(ConflictError);
    });

    it('re-throws non-duplicate errors', async () => {
      const userId = oid();
      const genericError = new Error('Something else');
      (CheckIn as unknown as jest.Mock).mockImplementation(() => ({
        save: jest.fn().mockImplementation(() => Promise.reject(genericError)),
      }));

      await expect(
        createCheckIn({ date: '2026-03-21', moodScore: 7 }, userId),
      ).rejects.toThrow('Something else');
    });
  });

  // ── getUserCheckIns ─────────────────────────────────────────────────────

  describe('getUserCheckIns', () => {
    it('throws ForbiddenError when client tries to view another user', async () => {
      await expect(
        getUserCheckIns('user1', 'client', 'user2', 30),
      ).rejects.toThrow(ForbiddenError);
    });

    it('returns check-ins for authorized user', async () => {
      const mockCheckIns = [
        { moodScore: 7, date: new Date() },
        { moodScore: 5, date: new Date() },
      ];
      (CheckIn.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockImplementation(() => Promise.resolve(mockCheckIns)),
        }),
      });

      const result = await getUserCheckIns('user1', 'client', 'user1', 30);
      expect(result.checkIns).toEqual(mockCheckIns);
      expect(result.count).toBe(2);
    });

    it('allows provider to view any user check-ins', async () => {
      const mockCheckIns = [{ moodScore: 8, date: new Date() }];
      (CheckIn.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockImplementation(() => Promise.resolve(mockCheckIns)),
        }),
      });

      const result = await getUserCheckIns('provider1', 'provider', 'anyUser', 10);
      expect(result.checkIns).toHaveLength(1);
    });
  });

  // ── getUserTrends ───────────────────────────────────────────────────────

  describe('getUserTrends', () => {
    it('throws ForbiddenError when unauthorized', async () => {
      await expect(
        getUserTrends('user1', 'client', 'user2', 30),
      ).rejects.toThrow(ForbiddenError);
    });

    it('returns trends and alerts for authorized user', async () => {
      const mockTrends = {
        averageMood: 6.5,
        checkInCount: 10,
        moodTrend: 'stable',
        moodByDay: [],
        symptomFrequency: {},
        period: '30d',
      };
      const mockAlerts = [{ type: 'low_mood', message: 'Low mood', severity: 'warning' }];
      (getCheckInTrends as jest.Mock).mockImplementation(() => Promise.resolve(mockTrends));
      (getCheckInAlerts as jest.Mock).mockImplementation(() => Promise.resolve(mockAlerts));

      const result = await getUserTrends('user1', 'client', 'user1', 30);
      expect(result.trends).toEqual(mockTrends);
      expect(result.alerts).toEqual(mockAlerts);
    });
  });

  // ── markCheckInsReviewed ────────────────────────────────────────────────

  describe('markCheckInsReviewed', () => {
    it('calls updateMany with correct filters', async () => {
      (CheckIn.updateMany as jest.Mock).mockImplementation(() => Promise.resolve({ modifiedCount: 3 }));

      await markCheckInsReviewed('targetUser');

      expect(CheckIn.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'targetUser',
          providerReviewed: false,
        }),
        { $set: { providerReviewed: true } },
      );
    });
  });
});
