import express, { Router, Response } from 'express';
import mongoose from 'mongoose';
import { body, param, query } from 'express-validator';
import { AuthenticatedRequest } from '../types';
import { requireRole, handleValidationErrors, authenticate } from '../middleware';
import { PHYSICAL_SYMPTOMS } from '../models/CheckIn';
import logger from '../utils/logger';
import * as checkinService from '../services/checkinService';
import { APIError } from '../utils/errors';

const router: Router = express.Router();


const requireProviderOrAdmin = requireRole(['provider', 'admin']);

/**
 * @swagger
 * /checkins:
 *   post:
 *     summary: Submit a daily check-in
 *     tags: [CheckIns]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  [
    body('date').isISO8601(),
    body('moodScore').isInt({ min: 1, max: 10 }),
    body('physicalSymptoms')
      .optional()
      .isArray()
      .custom((arr: string[]) =>
        arr.every(s => (PHYSICAL_SYMPTOMS as readonly string[]).includes(s))
      )
      .withMessage('Invalid symptom value'),
    body('notes').optional().isString().isLength({ max: 2000 }),
    body('sharedWithProvider').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const result = await checkinService.createCheckIn(req.body, user._id as mongoose.Types.ObjectId);
      return res.status(201).json(result);
    } catch (error) {
      logger.error('Create check-in error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to save check-in' });
    }
  }
);

/**
 * @swagger
 * /checkins/user/{userId}:
 *   get:
 *     summary: Get check-ins for a user
 *     tags: [CheckIns]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/user/:userId',
  authenticate,
  [
    param('userId').isMongoId(),
    query('limit').optional().isInt({ min: 1, max: 90 }),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      const limit = req.query.limit ? Number(req.query.limit) : 30;
      const result = await checkinService.getUserCheckIns(
        String(user!._id),
        user!.role,
        req.params.userId,
        limit,
      );
      return res.json(result);
    } catch (error) {
      logger.error('Get check-ins error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to retrieve check-ins' });
    }
  }
);

/**
 * @swagger
 * /checkins/trends/{userId}:
 *   get:
 *     summary: Get check-in trends and alerts for a user
 *     tags: [CheckIns]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/trends/:userId',
  authenticate,
  [
    param('userId').isMongoId(),
    query('days').optional().isInt({ min: 7, max: 90 }),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      const days = req.query.days ? Number(req.query.days) : 30;
      const result = await checkinService.getUserTrends(
        String(user!._id),
        user!.role,
        req.params.userId,
        days,
      );
      return res.json(result);
    } catch (error) {
      logger.error('Get trends error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to retrieve trends' });
    }
  }
);

/**
 * @swagger
 * /checkins/needs-review:
 *   get:
 *     summary: Get clients with unreviewed check-in alerts (provider only)
 *     tags: [CheckIns]
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/needs-review',
  authenticate,
  requireProviderOrAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const result = await checkinService.getNeedsReview(user._id as mongoose.Types.ObjectId);
      return res.json(result);
    } catch (error) {
      logger.error('Get needs-review error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to retrieve check-in alerts' });
    }
  }
);

/**
 * @swagger
 * /checkins/user/{userId}/mark-reviewed:
 *   patch:
 *     summary: Mark a client's recent check-ins as reviewed (provider only)
 *     tags: [CheckIns]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/user/:userId/mark-reviewed',
  authenticate,
  requireProviderOrAdmin,
  [param('userId').isMongoId()],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await checkinService.markCheckInsReviewed(req.params.userId);
      return res.json({ message: 'Check-ins marked as reviewed' });
    } catch (error) {
      logger.error('Mark reviewed error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to mark check-ins as reviewed' });
    }
  }
);

export default router;
