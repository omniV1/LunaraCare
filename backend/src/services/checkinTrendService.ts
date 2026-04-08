/**
 * @module services/checkinTrendService
 * Analyses client check-in history to compute mood trends, symptom
 * frequency maps, and alert conditions (low mood streaks, declining
 * trends, persistent symptoms). Consumed by the checkinService and
 * provider dashboard.
 */

import mongoose from 'mongoose';
import CheckIn, { ICheckInDocument } from '../models/CheckIn';
import logger from '../utils/logger';

/** Direction a client's mood is heading based on recent check-ins. */
type MoodTrend = 'improving' | 'stable' | 'declining';

/** Aggregated mood and symptom trend data for a given period. */
export interface TrendData {
  period: string;
  averageMood: number;
  checkInCount: number;
  moodByDay: Array<{ date: string; moodScore: number }>;
  symptomFrequency: Record<string, number>;
  moodTrend: MoodTrend;
}

/** A wellness alert triggered by check-in pattern analysis. */
export interface AlertInfo {
  type: 'low_mood' | 'declining_trend' | 'persistent_symptom';
  message: string;
  severity: 'info' | 'warning' | 'critical';
}

const ALERT_THRESHOLDS = {
  LOW_MOOD_SCORE: 3,
  LOW_MOOD_STREAK: 3,
  DECLINING_WINDOW: 7,
  PERSISTENT_SYMPTOM_DAYS: 5,
};

/**
 * Compute mood and symptom trends for a user over a rolling window.
 *
 * @param userId - Target user's ID
 * @param days - Number of days to look back (default 30)
 * @returns Aggregated trend data including average mood and symptom frequencies
 */
export async function getCheckInTrends(
  userId: string,
  days = 30
): Promise<TrendData> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const checkIns = await CheckIn.find({
    userId: new mongoose.Types.ObjectId(userId),
    date: { $gte: since },
  }).sort({ date: 1 });

  const moodByDay = checkIns.map(c => ({
    date: c.date.toISOString().split('T')[0],
    moodScore: c.moodScore,
  }));

  const totalMood = checkIns.reduce((sum, c) => sum + c.moodScore, 0);
  const averageMood = checkIns.length > 0 ? totalMood / checkIns.length : 0;

  const symptomFrequency = buildSymptomFrequency(checkIns);
  const moodTrend = computeMoodTrend(checkIns);

  return {
    period: `${days}d`,
    averageMood: Math.round(averageMood * 100) / 100,
    checkInCount: checkIns.length,
    moodByDay,
    symptomFrequency,
    moodTrend,
  };
}

/**
 * Evaluate recent check-ins against alert thresholds and return
 * any active warnings (low mood streak, declining trend, persistent symptom).
 *
 * @param userId - Target user's ID
 * @returns Array of triggered alerts, possibly empty
 */
export async function getCheckInAlerts(userId: string): Promise<AlertInfo[]> {
  const alerts: AlertInfo[] = [];
  const recent = await CheckIn.find({
    userId: new mongoose.Types.ObjectId(userId),
  })
    .sort({ date: -1 })
    .limit(ALERT_THRESHOLDS.DECLINING_WINDOW);

  if (recent.length === 0) return alerts;

  // Low mood streak
  let lowStreak = 0;
  for (const c of recent) {
    if (c.moodScore <= ALERT_THRESHOLDS.LOW_MOOD_SCORE) {
      lowStreak++;
    } else {
      break;
    }
  }
  if (lowStreak >= ALERT_THRESHOLDS.LOW_MOOD_STREAK) {
    alerts.push({
      type: 'low_mood',
      message: `Mood has been ${ALERT_THRESHOLDS.LOW_MOOD_SCORE} or below for ${lowStreak} consecutive check-ins`,
      severity: lowStreak >= 5 ? 'critical' : 'warning',
    });
  }

  // Declining trend
  if (recent.length >= 4) {
    const firstHalf = recent.slice(Math.floor(recent.length / 2));
    const secondHalf = recent.slice(0, Math.floor(recent.length / 2));
    const avgFirst = avg(firstHalf.map(c => c.moodScore));
    const avgSecond = avg(secondHalf.map(c => c.moodScore));
    if (avgFirst - avgSecond >= 2) {
      alerts.push({
        type: 'declining_trend',
        message: 'Mood trend is declining over the past week',
        severity: 'warning',
      });
    }
  }

  // Persistent symptom
  const symptomCounts = buildSymptomCounts(recent);
  for (const [symptom, count] of Object.entries(symptomCounts)) {
    if (count >= ALERT_THRESHOLDS.PERSISTENT_SYMPTOM_DAYS) {
      alerts.push({
        type: 'persistent_symptom',
        message: `'${symptom}' reported in ${count} of the last ${recent.length} check-ins`,
        severity: 'info',
      });
    }
  }

  if (alerts.length > 0) {
    logger.info(`Check-in alerts for user ${userId}`, { alertCount: alerts.length });
  }
  return alerts;
}

function buildSymptomCounts(recent: ICheckInDocument[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of recent) {
    for (const s of c.physicalSymptoms) {
      counts[s] = (counts[s] ?? 0) + 1;
    }
  }
  return counts;
}

// ── helpers ──────────────────────────────────────────────────────

function buildSymptomFrequency(
  checkIns: ICheckInDocument[]
): Record<string, number> {
  const freq: Record<string, number> = {};
  for (const c of checkIns) {
    for (const s of c.physicalSymptoms) {
      freq[s] = (freq[s] ?? 0) + 1;
    }
  }
  return freq;
}

function computeMoodTrend(checkIns: ICheckInDocument[]): MoodTrend {
  if (checkIns.length < 4) return 'stable';
  const mid = Math.floor(checkIns.length / 2);
  const firstAvg = avg(checkIns.slice(0, mid).map(c => c.moodScore));
  const secondAvg = avg(checkIns.slice(mid).map(c => c.moodScore));
  const diff = secondAvg - firstAvg;
  if (diff >= 1) return 'improving';
  if (diff <= -1) return 'declining';
  return 'stable';
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

