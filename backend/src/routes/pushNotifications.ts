/**
 * @module routes/pushNotifications
 * Web push notification subscription management and VAPID key distribution.
 * Mounted at `/api/push`.
 */
import express, { Router, Response } from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import { sendToUser } from '../services/pushNotificationService';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';
import * as pushSubscriptionService from '../services/pushSubscriptionService';

/** Safely cast user._id to ObjectId. */
function uid(req: AuthenticatedRequest): mongoose.Types.ObjectId {
  return req.user!._id as mongoose.Types.ObjectId;
}

/** Express router exposing push notification subscription endpoints. */
const router: Router = express.Router();
const authenticate = passport.authenticate('jwt', { session: false });

/**
 * @swagger
 * /push/vapid-public-key:
 *   get:
 *     summary: Get the VAPID public key for push subscription
 *     tags: [Push Notifications]
 *     security: []
 *     responses:
 *       200:
 *         description: VAPID public key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     vapidPublicKey:
 *                       type: string
 *       500:
 *         description: VAPID key not configured
 */
router.get('/vapid-public-key', (_req, res: Response) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    res.status(500).json({
      success: false,
      error: 'Push notifications are not configured on the server',
    });
    return;
  }

  res.json({
    success: true,
    data: { vapidPublicKey },
  });
});

/**
 * @swagger
 * /push/subscribe:
 *   post:
 *     summary: Save a push subscription for the authenticated user
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *               - keys
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: Push service endpoint URL
 *               keys:
 *                 type: object
 *                 required:
 *                   - p256dh
 *                   - auth
 *                 properties:
 *                   p256dh:
 *                     type: string
 *                   auth:
 *                     type: string
 *     responses:
 *       201:
 *         description: Subscription saved
 *       200:
 *         description: Subscription already exists
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 */
router.post('/subscribe', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { message, created } = await pushSubscriptionService.subscribe(uid(req), req.body);
    const statusCode = created ? 201 : 200;
    res.status(statusCode).json({ success: true, message });
  } catch (error: any) {
    if (error?.statusCode === 400) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    logger.error('Error saving push subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to save subscription' });
  }
});

/**
 * @swagger
 * /push/subscribe:
 *   delete:
 *     summary: Remove a push subscription
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - endpoint
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: Push service endpoint URL to unsubscribe
 *     responses:
 *       200:
 *         description: Subscription removed
 *       400:
 *         description: Missing endpoint
 *       401:
 *         description: Unauthorized
 */
router.delete('/subscribe', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    await pushSubscriptionService.unsubscribe(uid(req), req.body.endpoint);
    res.json({ success: true, message: 'Subscription removed' });
  } catch (error: any) {
    if (error?.statusCode === 400) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    if (error?.statusCode === 404) {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    logger.error('Error removing push subscription:', error);
    res.status(500).json({ success: false, error: 'Failed to remove subscription' });
  }
});

/**
 * @swagger
 * /push/test:
 *   post:
 *     summary: Send a test push notification to the authenticated user
 *     tags: [Push Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test notification sent
 *       401:
 *         description: Unauthorized
 */
router.post('/test', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;

    const successCount = await sendToUser(String(userId), {
      title: 'Lunara Test Notification',
      body: 'If you see this, push notifications are working!',
      icon: '/icons/icon-192x192.png',
    });

    res.json({
      success: true,
      message: `Test notification sent to ${successCount} device(s)`,
      data: { devicesNotified: successCount },
    });
  } catch (error) {
    logger.error('Error sending test push notification:', error);
    res.status(500).json({ success: false, error: 'Failed to send test notification' });
  }
});

export default router;
