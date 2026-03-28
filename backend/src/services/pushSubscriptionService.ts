import mongoose from 'mongoose';
import PushSubscription from '../models/PushSubscription';
import { BadRequestError, NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

// ── Input types ──────────────────────────────────────────────────────────────

export interface SubscribeInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Save or update a push subscription for a user.
 *
 * @throws BadRequestError — missing required fields
 */
export async function subscribe(
  userId: mongoose.Types.ObjectId,
  data: SubscribeInput
): Promise<{ message: string; created: boolean }> {
  const { endpoint, keys } = data;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new BadRequestError('Missing required fields: endpoint, keys.p256dh, keys.auth');
  }

  const existing = await PushSubscription.findOne({ endpoint });

  if (existing) {
    if (String(existing.userId) !== String(userId)) {
      existing.userId = userId;
      existing.keys = keys;
      await existing.save();
    }
    return { message: 'Subscription updated', created: false };
  }

  await PushSubscription.create({ userId, endpoint, keys });
  logger.info(`Push subscription saved for user ${userId}`);
  return { message: 'Subscription saved', created: true };
}

/**
 * Remove a push subscription.
 *
 * @throws BadRequestError — missing endpoint
 * @throws NotFoundError   — subscription not found
 */
export async function unsubscribe(
  userId: mongoose.Types.ObjectId,
  endpoint: string
): Promise<void> {
  if (!endpoint) {
    throw new BadRequestError('Missing required field: endpoint');
  }

  const result = await PushSubscription.deleteOne({ userId, endpoint });

  if (result.deletedCount === 0) {
    throw new NotFoundError('Subscription not found');
  }

  logger.info(`Push subscription removed for user ${userId}`);
}
