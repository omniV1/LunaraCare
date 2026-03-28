import webpush from 'web-push';
import PushSubscription, { IPushSubscription } from '../models/PushSubscription';
import logger from '../utils/logger';

let vapidInitialized = false;

function initVapid(): void {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const email = process.env.VAPID_EMAIL?.trim();

  if (!publicKey || !privateKey || !email) {
    logger.warn(
      'VAPID keys not configured – push notifications disabled. ' +
        'Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_EMAIL.'
    );
    return;
  }

  try {
    webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
    vapidInitialized = true;
    logger.info('Web-push VAPID credentials configured');
  } catch (err) {
    logger.warn(
      'Invalid VAPID keys – push notifications disabled. ' +
        'Ensure VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are valid (e.g. from web-push generate-vapid-keys).',
      err instanceof Error ? err.message : err
    );
  }
}

initVapid();

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  data?: Record<string, unknown>;
}

/**
 * Send a push notification to a single subscription.
 * Returns true on success, false on failure.
 * Automatically removes subscriptions that return HTTP 410 (Gone).
 */
export async function sendPushNotification(
  subscription: IPushSubscription,
  payload: PushPayload
): Promise<boolean> {
  if (!vapidInitialized) {
    logger.debug('Push skipped: VAPID not configured');
    return false;
  }
  const pushSub: webpush.PushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSub, JSON.stringify(payload));
    return true;
  } catch (error: unknown) {
    const webPushError = error as { statusCode?: number };
    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      logger.info(`Removing expired push subscription: ${subscription.endpoint}`);
      await PushSubscription.deleteOne({ _id: subscription._id });
      return false;
    }

    logger.error(`Push notification failed for ${subscription.endpoint}:`, error);
    return false;
  }
}

/**
 * Send a push notification to all subscriptions belonging to a user.
 * Returns the number of successful deliveries.
 */
export async function sendToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!vapidInitialized) {
    logger.debug('Push skipped: VAPID not configured');
    return 0;
  }
  const subscriptions = await PushSubscription.find({ userId });

  if (subscriptions.length === 0) {
    logger.debug(`No push subscriptions for user ${userId}`);
    return 0;
  }

  const results = await Promise.allSettled(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  );

  const successCount = results.filter(
    r => r.status === 'fulfilled' && r.value === true
  ).length;

  logger.info(
    `Push notifications sent to user ${userId}: ${successCount}/${subscriptions.length} succeeded`
  );

  return successCount;
}
