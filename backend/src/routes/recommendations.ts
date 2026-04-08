/**
 * @module routes/recommendations
 * Personalized resource and document recommendations based on client progress.
 * Mounted at `/api/recommendations`.
 */
import express, { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';
import * as recommendationService from '../services/recommendationService';

/** Safely cast user._id to ObjectId. */
function uid(req: AuthenticatedRequest): mongoose.Types.ObjectId {
  return req.user!._id as mongoose.Types.ObjectId;
}

/** Express router exposing recommendation endpoints. */
const router: Router = express.Router();



/**
 * @swagger
 * /recommendations/resources:
 *   get:
 *     summary: Get personalized resource recommendations for a client
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recommended resources based on client's postpartum week
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/resources',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?._id) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const data = await recommendationService.getResourceRecommendations(
        uid(req),
        req.user.role
      );

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      if (error?.statusCode === 403) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      if (error?.statusCode === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      logger.error('Error fetching resource recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch resource recommendations',
      });
    }
  }
);

/**
 * @swagger
 * /recommendations/documents:
 *   get:
 *     summary: Get document template suggestions based on client progress
 *     tags: [Recommendations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suggested document templates based on client's progress
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/documents',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user?._id) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const data = await recommendationService.getDocumentRecommendations(
        uid(req),
        req.user.role
      );

      res.json({
        success: true,
        data,
      });
    } catch (error: any) {
      if (error?.statusCode === 403) {
        res.status(403).json({ success: false, error: error.message });
        return;
      }
      if (error?.statusCode === 404) {
        res.status(404).json({ success: false, error: error.message });
        return;
      }
      logger.error('Error fetching document recommendations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch document recommendations',
      });
    }
  }
);

export default router;
