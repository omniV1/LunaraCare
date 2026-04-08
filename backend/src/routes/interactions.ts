/**
 * @module routes/interactions
 * Resource interaction tracking: views, downloads, favorites, and ratings.
 * Mounted at `/api/interactions`.
 */
import express, { Router, Response } from 'express';
import mongoose from 'mongoose';

import { authenticate } from '../middleware';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';
import * as interactionService from '../services/interactionService';

/** Safely cast user._id to ObjectId. */
function uid(req: AuthenticatedRequest): mongoose.Types.ObjectId {
  return req.user!._id as mongoose.Types.ObjectId;
}

/** Express router exposing resource interaction and favorites endpoints. */
const router: Router = express.Router();



/**
 * @swagger
 * /api/interactions:
 *   post:
 *     summary: Record a user interaction with a resource
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resourceId
 *               - interactionType
 *             properties:
 *               resourceId:
 *                 type: string
 *               interactionType:
 *                 type: string
 *                 enum: [view, download, favorite, rating]
 *               rating:
 *                 type: number
 *                 description: Required when interactionType is 'rating' (1-5)
 *     responses:
 *       201:
 *         description: Interaction recorded successfully
 *       200:
 *         description: Favorite toggled (removed)
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const { result, status } = await interactionService.recordInteraction(uid(req), req.body);
    return res.status(status).json(result);
  } catch (error: any) {
    if (error?.statusCode === 400) return res.status(400).json({ message: error.message });
    logger.error('Error recording interaction:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/interactions/favorites:
 *   get:
 *     summary: Get current user's favorited resources
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorited resources
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserResourceInteraction'
 *       401:
 *         description: Unauthorized
 */
router.get('/favorites', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user?._id) return res.status(401).json({ message: 'Unauthorized' });

    const favorites = await interactionService.getFavorites(uid(req));
    return res.json(favorites);
  } catch (error) {
    logger.error('Error fetching favorites:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/interactions/resource/{resourceId}/stats:
 *   get:
 *     summary: Get interaction stats for a resource
 *     tags: [Interactions]
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource interaction statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 viewCount:
 *                   type: number
 *                 downloadCount:
 *                   type: number
 *                 favoriteCount:
 *                   type: number
 *                 averageRating:
 *                   type: number
 *                 totalRatings:
 *                   type: number
 */
router.get('/resource/:resourceId/stats', async (req: express.Request, res: Response) => {
  try {
    const { resourceId } = req.params;
    const stats = await interactionService.getResourceStats(resourceId);
    return res.json(stats);
  } catch (error) {
    logger.error('Error fetching resource stats:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/interactions/favorites/{resourceId}:
 *   delete:
 *     summary: Remove a resource from favorites
 *     tags: [Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resourceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID to unfavorite
 *     responses:
 *       200:
 *         description: Favorite removed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Favorite not found
 */
router.delete('/favorites/:resourceId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user?._id) return res.status(401).json({ message: 'Unauthorized' });

    await interactionService.removeFavorite(uid(req), req.params.resourceId);
    return res.json({ message: 'Favorite removed successfully' });
  } catch (error: any) {
    if (error?.statusCode === 404) return res.status(404).json({ message: error.message });
    logger.error('Error removing favorite:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
