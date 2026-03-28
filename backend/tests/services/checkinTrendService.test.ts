import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// Mock the CheckIn model (CJS-compatible)
jest.mock('../../src/models/CheckIn', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));

import {
  getCheckInTrends,
  getCheckInAlerts,
} from '../../src/services/checkinTrendService';
import CheckIn from '../../src/models/CheckIn';

const mockFind = CheckIn.find as jest.Mock;

function makeCheckIn(overrides: Record<string, unknown> = {}) {
  return {
    userId: new mongoose.Types.ObjectId(),
    date: new Date(),
    moodScore: 7,
    physicalSymptoms: [] as string[],
    notes: '',
    sharedWithProvider: false,
    ...overrides,
  };
}

describe('checkinTrendService', () => {
  const userId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getCheckInTrends ──────────────────────────────────────────

  describe('getCheckInTrends', () => {
    it('returns defaults when no check-ins exist', async () => {
      mockFind.mockReturnValue({ sort: () => Promise.resolve([]) });

      const result = await getCheckInTrends(userId, 30);
      expect(result.averageMood).toBe(0);
      expect(result.checkInCount).toBe(0);
      expect(result.moodByDay).toEqual([]);
      expect(result.moodTrend).toBe('stable');
      expect(result.period).toBe('30d');
    });

    it('calculates average mood and symptom frequency', async () => {
      const checkIns = [
        makeCheckIn({ date: new Date('2026-03-01'), moodScore: 8, physicalSymptoms: ['fatigue'] }),
        makeCheckIn({ date: new Date('2026-03-02'), moodScore: 6, physicalSymptoms: ['fatigue', 'anxiety'] }),
        makeCheckIn({ date: new Date('2026-03-03'), moodScore: 4, physicalSymptoms: ['anxiety'] }),
      ];
      mockFind.mockReturnValue({ sort: () => Promise.resolve(checkIns) });

      const result = await getCheckInTrends(userId, 7);
      expect(result.averageMood).toBe(6);
      expect(result.checkInCount).toBe(3);
      expect(result.symptomFrequency.fatigue).toBe(2);
      expect(result.symptomFrequency.anxiety).toBe(2);
    });

    it('detects improving mood trend', async () => {
      const checkIns = [
        makeCheckIn({ date: new Date('2026-03-01'), moodScore: 3 }),
        makeCheckIn({ date: new Date('2026-03-02'), moodScore: 3 }),
        makeCheckIn({ date: new Date('2026-03-03'), moodScore: 8 }),
        makeCheckIn({ date: new Date('2026-03-04'), moodScore: 9 }),
      ];
      mockFind.mockReturnValue({ sort: () => Promise.resolve(checkIns) });

      const result = await getCheckInTrends(userId, 7);
      expect(result.moodTrend).toBe('improving');
    });

    it('detects declining mood trend', async () => {
      const checkIns = [
        makeCheckIn({ date: new Date('2026-03-01'), moodScore: 9 }),
        makeCheckIn({ date: new Date('2026-03-02'), moodScore: 8 }),
        makeCheckIn({ date: new Date('2026-03-03'), moodScore: 3 }),
        makeCheckIn({ date: new Date('2026-03-04'), moodScore: 2 }),
      ];
      mockFind.mockReturnValue({ sort: () => Promise.resolve(checkIns) });

      const result = await getCheckInTrends(userId, 7);
      expect(result.moodTrend).toBe('declining');
    });

    it('returns stable when not enough data', async () => {
      const checkIns = [
        makeCheckIn({ date: new Date('2026-03-01'), moodScore: 5 }),
      ];
      mockFind.mockReturnValue({ sort: () => Promise.resolve(checkIns) });

      const result = await getCheckInTrends(userId, 7);
      expect(result.moodTrend).toBe('stable');
    });
  });

  // ── getCheckInAlerts ──────────────────────────────────────────

  describe('getCheckInAlerts', () => {
    it('returns empty array when no check-ins exist', async () => {
      mockFind.mockReturnValue({ sort: () => ({ limit: () => Promise.resolve([]) }) });

      const alerts = await getCheckInAlerts(userId);
      expect(alerts).toEqual([]);
    });

    it('detects low mood streak (warning)', async () => {
      const recent = [
        makeCheckIn({ moodScore: 2 }),
        makeCheckIn({ moodScore: 3 }),
        makeCheckIn({ moodScore: 1 }),
        makeCheckIn({ moodScore: 7 }),
      ];
      mockFind.mockReturnValue({ sort: () => ({ limit: () => Promise.resolve(recent) }) });

      const alerts = await getCheckInAlerts(userId);
      const lowMood = alerts.find(a => a.type === 'low_mood');
      expect(lowMood).toBeDefined();
      expect(lowMood!.severity).toBe('warning');
    });

    it('detects low mood streak (critical when >= 5)', async () => {
      const recent = Array.from({ length: 6 }, () => makeCheckIn({ moodScore: 2 }));
      mockFind.mockReturnValue({ sort: () => ({ limit: () => Promise.resolve(recent) }) });

      const alerts = await getCheckInAlerts(userId);
      const lowMood = alerts.find(a => a.type === 'low_mood');
      expect(lowMood).toBeDefined();
      expect(lowMood!.severity).toBe('critical');
    });

    it('does not flag low mood when streak is too short', async () => {
      const recent = [
        makeCheckIn({ moodScore: 2 }),
        makeCheckIn({ moodScore: 2 }),
        makeCheckIn({ moodScore: 7 }),
      ];
      mockFind.mockReturnValue({ sort: () => ({ limit: () => Promise.resolve(recent) }) });

      const alerts = await getCheckInAlerts(userId);
      const lowMood = alerts.find(a => a.type === 'low_mood');
      expect(lowMood).toBeUndefined();
    });

    it('detects declining trend', async () => {
      const recent = [
        makeCheckIn({ moodScore: 2 }),
        makeCheckIn({ moodScore: 3 }),
        makeCheckIn({ moodScore: 8 }),
        makeCheckIn({ moodScore: 9 }),
      ];
      mockFind.mockReturnValue({ sort: () => ({ limit: () => Promise.resolve(recent) }) });

      const alerts = await getCheckInAlerts(userId);
      const declining = alerts.find(a => a.type === 'declining_trend');
      expect(declining).toBeDefined();
    });

    it('does not flag declining when too few entries', async () => {
      const recent = [
        makeCheckIn({ moodScore: 2 }),
        makeCheckIn({ moodScore: 9 }),
      ];
      mockFind.mockReturnValue({ sort: () => ({ limit: () => Promise.resolve(recent) }) });

      const alerts = await getCheckInAlerts(userId);
      const declining = alerts.find(a => a.type === 'declining_trend');
      expect(declining).toBeUndefined();
    });

    it('detects persistent symptoms', async () => {
      const recent = Array.from({ length: 7 }, () =>
        makeCheckIn({ moodScore: 7, physicalSymptoms: ['fatigue'] })
      );
      mockFind.mockReturnValue({ sort: () => ({ limit: () => Promise.resolve(recent) }) });

      const alerts = await getCheckInAlerts(userId);
      const persistent = alerts.find(a => a.type === 'persistent_symptom');
      expect(persistent).toBeDefined();
      expect(persistent!.message).toContain('fatigue');
    });

    it('does not flag symptoms below threshold', async () => {
      const recent = [
        makeCheckIn({ moodScore: 7, physicalSymptoms: ['fatigue'] }),
        makeCheckIn({ moodScore: 7, physicalSymptoms: [] }),
        makeCheckIn({ moodScore: 7, physicalSymptoms: [] }),
      ];
      mockFind.mockReturnValue({ sort: () => ({ limit: () => Promise.resolve(recent) }) });

      const alerts = await getCheckInAlerts(userId);
      const persistent = alerts.find(a => a.type === 'persistent_symptom');
      expect(persistent).toBeUndefined();
    });
  });
});
