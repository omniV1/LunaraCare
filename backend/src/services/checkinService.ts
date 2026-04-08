/**
 * @module services/checkinService
 * Daily wellness check-in management for clients. Handles check-in
 * submission, retrieval, trend/alert analysis, and provider review
 * workflows. Operates on the CheckIn and Client models.
 */

import mongoose from 'mongoose';
import CheckIn, { ICheckInDocument, PhysicalSymptom } from '../models/CheckIn';
import Client from '../models/Client';
import { getCheckInTrends, getCheckInAlerts, TrendData, AlertInfo } from './checkinTrendService';
import { ForbiddenError, ConflictError } from '../utils/errors';

// ── Input / Result types ─────────────────────────────────────────────────────

/** Fields for submitting a daily wellness check-in. */
export interface CreateCheckInInput {
  date: string;
  moodScore: number;
  physicalSymptoms?: PhysicalSymptom[];
  notes?: string;
  sharedWithProvider?: boolean;
}

/** Result after recording a check-in, including any triggered alerts. */
export interface CreateCheckInResult {
  message: string;
  checkIn: ICheckInDocument;
  alerts: AlertInfo[];
}

/** Summary of a client that has unreviewed check-in alerts for their provider. */
export interface NeedsReviewItem {
  clientId: mongoose.Types.ObjectId;
  clientUserId: mongoose.Types.ObjectId;
  clientName: string;
  alerts: Array<{ type: string; message: string; severity: string }>;
  lastCheckIn: Date | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Check whether a user can access another user's check-ins. */
export function canAccessUserCheckins(
  userId: string,
  userRole: string,
  targetUserId: string,
): boolean {
  if (userId === targetUserId) return true;
  if (userRole === 'provider' || userRole === 'admin') return true;
  return false;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Submit a daily check-in.
 *
 * @param data - Mood score, symptoms, and notes
 * @param userId - Authenticated client's ObjectId
 * @returns The saved check-in and any active alerts
 * @throws ConflictError -- duplicate check-in for this date
 */
export async function createCheckIn(
  data: CreateCheckInInput,
  userId: mongoose.Types.ObjectId,
): Promise<CreateCheckInResult> {
  try {
    const checkIn = new CheckIn({
      userId,
      date: new Date(data.date),
      moodScore: data.moodScore,
      physicalSymptoms: data.physicalSymptoms ?? [],
      notes: data.notes,
      sharedWithProvider: data.sharedWithProvider ?? false,
    });
    await checkIn.save();

    const alerts = await getCheckInAlerts(String(userId));

    return {
      message: 'Check-in recorded',
      checkIn,
      alerts,
    };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: number }).code === 11000
    ) {
      throw new ConflictError('Check-in already exists for this date');
    }
    throw error;
  }
}

/**
 * Get check-ins for a user.
 *
 * @param callerId - Requesting user's ID
 * @param callerRole - Requesting user's role
 * @param targetUserId - User whose check-ins to retrieve
 * @param limit - Maximum records to return
 * @returns Check-in documents and count
 * @throws ForbiddenError -- access denied
 */
export async function getUserCheckIns(
  callerId: string,
  callerRole: string,
  targetUserId: string,
  limit: number,
): Promise<{ checkIns: ICheckInDocument[]; count: number }> {
  if (!canAccessUserCheckins(callerId, callerRole, targetUserId)) {
    throw new ForbiddenError('Forbidden');
  }

  const checkIns = await CheckIn.find({ userId: targetUserId })
    .sort({ date: -1 })
    .limit(limit);

  return { checkIns, count: checkIns.length };
}

/**
 * Get check-in trends and alerts for a user.
 *
 * @param callerId - Requesting user's ID
 * @param callerRole - Requesting user's role
 * @param targetUserId - User whose trends to analyse
 * @param days - Number of days to include in the trend window
 * @returns Trend data and active alerts
 * @throws ForbiddenError -- access denied
 */
export async function getUserTrends(
  callerId: string,
  callerRole: string,
  targetUserId: string,
  days: number,
): Promise<{ trends: TrendData; alerts: AlertInfo[] }> {
  if (!canAccessUserCheckins(callerId, callerRole, targetUserId)) {
    throw new ForbiddenError('Forbidden');
  }

  const trends = await getCheckInTrends(targetUserId, days);
  const alerts = await getCheckInAlerts(targetUserId);

  return { trends, alerts };
}

/**
 * Get clients with unreviewed check-in alerts (provider/admin).
 *
 * @param providerId - Provider's ObjectId to scope the client list
 * @returns Clients needing review and their alert details
 */
export async function getNeedsReview(
  providerId: mongoose.Types.ObjectId,
): Promise<{ data: NeedsReviewItem[]; count: number }> {
  const clients = await Client.find({ assignedProvider: providerId }).populate(
    'userId',
    'firstName lastName',
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const clientUserIds = clients
    .map(c => (c.userId as unknown as { _id: mongoose.Types.ObjectId } | undefined)?._id)
    .filter(Boolean);

  const [sharedCounts, lastCheckIns] = await Promise.all([
    CheckIn.aggregate([
      {
        $match: {
          userId: { $in: clientUserIds },
          sharedWithProvider: true,
          providerReviewed: false,
          date: { $gte: thirtyDaysAgo },
        },
      },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
    ]),
    CheckIn.aggregate([
      { $match: { userId: { $in: clientUserIds } } },
      { $sort: { date: -1 } },
      { $group: { _id: '$userId', lastDate: { $first: '$date' } } },
    ]),
  ]);

  const sharedMap = new Map(
    sharedCounts.map((s: { _id: mongoose.Types.ObjectId; count: number }) => [s._id.toString(), s.count]),
  );
  const lastMap = new Map(
    lastCheckIns.map((l: { _id: mongoose.Types.ObjectId; lastDate: Date }) => [l._id.toString(), l.lastDate]),
  );

  const results = await Promise.all(
    clients.map(async (client) => {
      const clientUserId = client.userId as unknown as {
        _id: mongoose.Types.ObjectId;
        firstName?: string;
        lastName?: string;
      };
      const uid = clientUserId._id.toString();
      const trendAlerts = await getCheckInAlerts(uid);
      const allAlerts: Array<{ type: string; message: string; severity: string }> = [
        ...trendAlerts,
      ];

      const sharedCount = sharedMap.get(uid) ?? 0;
      if (sharedCount > 0) {
        allAlerts.push({
          type: 'shared_checkin',
          message: `Client shared ${sharedCount} check-in${sharedCount > 1 ? 's' : ''} with you`,
          severity: 'info',
        });
      }

      if (allAlerts.length === 0) return null;

      return {
        clientId: client._id as mongoose.Types.ObjectId,
        clientUserId: clientUserId._id,
        clientName: `${clientUserId.firstName} ${clientUserId.lastName}`,
        alerts: allAlerts,
        lastCheckIn: lastMap.get(uid) ?? null,
      };
    }),
  );

  const data = results.filter((r): r is NeedsReviewItem => r !== null);
  return { data, count: data.length };
}

/**
 * Mark a client's recent check-ins as reviewed (provider/admin).
 *
 * @param targetUserId - Client user ID whose check-ins to mark as reviewed
 */
export async function markCheckInsReviewed(targetUserId: string): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await CheckIn.updateMany(
    { userId: targetUserId, date: { $gte: sevenDaysAgo }, providerReviewed: false },
    { $set: { providerReviewed: true } },
  );
}
