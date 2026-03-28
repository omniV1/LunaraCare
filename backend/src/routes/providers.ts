import express, { Router, Response } from 'express';
import mongoose from 'mongoose';

import { body, param, query } from 'express-validator';
import { AuthenticatedRequest } from '../types';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { requireRole, handleValidationErrors, authenticate } from '../middleware';
import { IUser } from '../models/User';
import logger from '../utils/logger';
import * as providerService from '../services/providerService';
import { APIError } from '../utils/errors';

const router: Router = express.Router();


const requireProviderOrAdmin = requireRole(['provider', 'admin']);

/**
 * @swagger
 * /providers/me:
 *   get:
 *     summary: Get current provider's own profile
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider profile with userId populated
 *       403:
 *         description: Not a provider
 *       404:
 *         description: Provider profile not found
 */
router.get('/me', authenticate, requireProviderOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const provider = await providerService.getMyProfile(req.user!._id as mongoose.Types.ObjectId);
    return res.json(provider);
  } catch (error) {
    logger.error('Get provider me error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to retrieve profile' });
  }
});

/**
 * @swagger
 * /providers/me:
 *   put:
 *     summary: Update current provider's profile and optional user name
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               professionalInfo: { type: object }
 *               contactInfo: { type: object }
 *               serviceAreas: { type: array, items: { type: string } }
 *               services: { type: array }
 *               availability: { type: object }
 *     responses:
 *       200:
 *         description: Profile updated
 *       403:
 *         description: Not a provider
 *       404:
 *         description: Provider profile not found
 */
router.put(
  '/me',
  authenticate,
  requireProviderOrAdmin,
  [
    body('firstName').optional().trim().isLength({ max: 50 }),
    body('lastName').optional().trim().isLength({ max: 50 }),
    body('bio').optional().trim().isLength({ max: 1000 }),
    body('certifications').optional().isArray(),
    body('specialties').optional().isArray(),
    body('services').optional().isArray(),
    body('yearsExperience').optional().isInt({ min: 0, max: 50 }),
    body('languages').optional().isArray(),
    body('serviceAreas').optional().isArray(),
    body('contactInfo').optional().isObject(),
    body('isAcceptingClients').optional().isBoolean(),
    body('maxClients').optional().isInt({ min: 1, max: 20 }),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const provider = await providerService.updateMyProfile(user._id as mongoose.Types.ObjectId, req.body);
      return res.json(provider);
    } catch (error) {
      logger.error('Update provider me error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to update profile' });
    }
  }
);

/**
 * @swagger
 * /providers/me/clients:
 *   get:
 *     summary: Get clients assigned to the current provider
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of assigned clients
 */
router.get('/me/clients', authenticate, requireProviderOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clients = await providerService.getMyClients(req.user!._id as mongoose.Types.ObjectId);
    return res.json(clients);
  } catch (error) {
    logger.error('My clients error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to retrieve clients' });
  }
});

/**
 * @swagger
 * /providers:
 *   get:
 *     summary: Get all active providers
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of providers
 */
router.get('/', authenticate, cacheResponse(60, 'providers-list'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentUser = req.user;
    const normalized = await providerService.listProviders(currentUser?._id as mongoose.Types.ObjectId | undefined, currentUser?.role);
    return res.json(normalized);
  } catch (error) {
    logger.error('List providers error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to retrieve providers' });
  }
});

/**
 * @swagger
 * /providers/{id}/availability:
 *   get:
 *     summary: Get provider availability slots
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider user ID
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (ISO 8601)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (ISO 8601)
 *     responses:
 *       200:
 *         description: List of availability slots
 */
router.get(
  '/:id/availability',
  authenticate,
  [
    param('id').isMongoId(),
    query('from').optional().isISO8601(),
    query('to').optional().isISO8601(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const fromDate = req.query.from ? new Date(req.query.from as string) : undefined;
      const toDate = req.query.to ? new Date(req.query.to as string) : undefined;
      const result = await providerService.getAvailability(req.params.id, fromDate, toDate);
      return res.json(result);
    } catch (error) {
      logger.error('Get availability error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to retrieve availability' });
    }
  }
);

/**
 * @swagger
 * /providers/{id}/availability:
 *   post:
 *     summary: Create availability slots for a provider
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     recurring:
 *                       type: boolean
 *                     dayOfWeek:
 *                       type: number
 *     responses:
 *       201:
 *         description: Slots created
 *       403:
 *         description: Forbidden
 */
router.post(
  '/:id/availability',
  authenticate,
  [
    param('id').isMongoId(),
    body('slots').isArray({ min: 1 }).withMessage('At least one slot is required'),
    body('slots.*.date').isISO8601(),
    body('slots.*.startTime').matches(/^\d{2}:\d{2}$/),
    body('slots.*.endTime').matches(/^\d{2}:\d{2}$/),
    body('slots.*.recurring').optional().isBoolean(),
    body('slots.*.dayOfWeek').optional().isInt({ min: 0, max: 6 }),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user?._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const providerId = req.params.id;

    // Only the provider themselves or an admin can set availability
    if (user._id.toString() !== providerId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const created = await providerService.createAvailabilitySlots(providerId, req.body.slots);
      return res.status(201).json({
        message: `${created.length} availability slot(s) created`,
        slots: created,
      });
    } catch (error) {
      logger.error('Create availability error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to create availability slots' });
    }
  }
);

/**
 * @swagger
 * /providers/invite-client:
 *   post:
 *     summary: Create a client account and send an invite email
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/invite-client',
  authenticate,
  requireProviderOrAdmin,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('firstName').isString().trim().isLength({ min: 1, max: 50 }).withMessage('First name required'),
    body('lastName').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Last name required'),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const client = await providerService.inviteClient(req.body, req.user as IUser);
      return res.status(201).json({
        message: `Invite sent to ${req.body.email}`,
        client,
      });
    } catch (error) {
      logger.error('Invite client error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to invite client' });
    }
  }
);

/**
 * @swagger
 * /providers/me/analytics:
 *   get:
 *     summary: Get analytics dashboard data for the current provider
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Provider analytics summary
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalClients: { type: number }
 *                 activeClients: { type: number }
 *                 completedClients: { type: number }
 *                 totalAppointments: { type: number }
 *                 completedAppointments: { type: number }
 *                 cancelledAppointments: { type: number }
 *                 upcomingAppointments: { type: number }
 *                 averageCheckInMood: { type: number, nullable: true }
 *                 totalMessages: { type: number }
 *                 totalResources: { type: number }
 *                 totalBlogPosts: { type: number }
 *                 recentActivity: { type: array }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not a provider
 */
router.get('/me/analytics', authenticate, requireProviderOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const analytics = await providerService.getAnalytics(req.user!._id as mongoose.Types.ObjectId);
    return res.json(analytics);
  } catch (error) {
    logger.error('Provider analytics error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to retrieve analytics' });
  }
});

export default router;
