import express, { Router, Response } from 'express';
import mongoose from 'mongoose';
import { body, param } from 'express-validator';
import { AuthenticatedRequest } from '../types';
import { cacheResponse } from '../middleware/cacheMiddleware';
import { requireRole, handleValidationErrors, authenticate } from '../middleware';
import logger from '../utils/logger';
import * as carePlanService from '../services/carePlanService';

/** Safely cast user._id to ObjectId. */
function uid(req: AuthenticatedRequest): mongoose.Types.ObjectId {
  return req.user!._id as mongoose.Types.ObjectId;
}

const router: Router = express.Router();

const requireProviderOrAdmin = requireRole(['provider', 'admin']);

// ── GET /care-plans/templates ───────────────────────────────────
/**
 * @swagger
 * /care-plans/templates:
 *   get:
 *     summary: List active care plan templates
 *     tags: [CarePlans]
 *     security:
 *       - bearerAuth: []
 */
router.get('/templates', authenticate, cacheResponse(600, 'care-plan-templates'), async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const templates = await carePlanService.listTemplates();
    return res.json(templates);
  } catch (error) {
    logger.error('List templates error:', error);
    return res.status(500).json({ error: 'Failed to retrieve templates' });
  }
});

// ── POST /care-plans/templates (provider only) ─────────────────────────────────
router.post(
  '/templates',
  authenticate,
  requireProviderOrAdmin,
  [
    body('name').isString().notEmpty(),
    body('targetCondition').isString().notEmpty(),
    body('description').optional().isString(),
    body('sections').isArray(),
    body('sections.*.title').isString().notEmpty(),
    body('sections.*.description').optional().isString(),
    body('sections.*.milestones').isArray(),
    body('sections.*.milestones.*.title').isString().notEmpty(),
    body('sections.*.milestones.*.weekOffset').isInt({ min: 0 }),
    body('sections.*.milestones.*.category').optional().isIn(['physical', 'emotional', 'feeding', 'self_care', 'general']),
    body('sections.*.milestones.*.description').optional().isString(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const template = await carePlanService.createTemplate(req.body, uid(req));
      return res.status(201).json({ message: 'Template created', template });
    } catch (error) {
      logger.error('Create template error:', error);
      return res.status(500).json({ error: 'Failed to create template' });
    }
  }
);

// ── GET /care-plans/my ──────────────────────────────────────────
router.get('/my', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await carePlanService.getMyCarePlans(uid(req));
    return res.json(result);
  } catch (error) {
    logger.error('Get my care plans error:', error);
    return res.status(500).json({ error: 'Failed to retrieve care plans' });
  }
});

// ── GET /care-plans/client/:clientUserId ────────────────────────
router.get(
  '/client/:clientUserId',
  authenticate,
  requireProviderOrAdmin,
  [param('clientUserId').isMongoId()],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await carePlanService.getCarePlansByClient(req.params.clientUserId);
      return res.json(result);
    } catch (error) {
      logger.error('Get care plans for client error:', error);
      return res.status(500).json({ error: 'Failed to retrieve care plans' });
    }
  }
);

// ── POST /care-plans ────────────────────────────────────────────
/**
 * @swagger
 * /care-plans:
 *   post:
 *     summary: Create a care plan (optionally from a template)
 *     tags: [CarePlans]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticate,
  requireProviderOrAdmin,
  [
    body('clientId').isMongoId(),
    body('title').isString().notEmpty(),
    body('templateId').optional().isMongoId(),
    body('description').optional().isString(),
    body('sections').optional().isArray(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const carePlan = await carePlanService.createCarePlan(req.body, uid(req));
      return res.status(201).json({ message: 'Care plan created', carePlan });
    } catch (error: any) {
      if (error?.statusCode === 404) {
        return res.status(404).json({ error: error.message });
      }
      logger.error('Create care plan error:', error);
      return res.status(500).json({ error: 'Failed to create care plan' });
    }
  }
);

// ── PUT /care-plans/:id ─────────────────────────────────────────
/**
 * @swagger
 * /care-plans/{id}:
 *   put:
 *     summary: Update a care plan
 *     tags: [CarePlans]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isMongoId(),
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('status').optional().isIn(['active', 'completed', 'paused', 'archived']),
    body('sections').optional().isArray(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const carePlan = await carePlanService.updateCarePlan(
        req.params.id,
        req.body,
        uid(req),
        user.role
      );
      return res.json({ message: 'Care plan updated', carePlan });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      if (error?.statusCode === 403) return res.status(403).json({ error: error.message });
      logger.error('Update care plan error:', error);
      return res.status(500).json({ error: 'Failed to update care plan' });
    }
  }
);

// ── PATCH /care-plans/:id/milestone/:milestoneId ────────────────
/**
 * @swagger
 * /care-plans/{id}/milestone/{milestoneId}:
 *   patch:
 *     summary: Update a single milestone status
 *     tags: [CarePlans]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/milestone/:milestoneId',
  authenticate,
  [
    param('id').isMongoId(),
    param('milestoneId').isMongoId(),
    body('status').isIn(['pending', 'in_progress', 'completed', 'skipped']),
    body('notes').optional().isString().isLength({ max: 1000 }),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const { carePlan, progress } = await carePlanService.updateMilestone(
        req.params.id,
        req.params.milestoneId,
        { status: req.body.status, notes: req.body.notes },
        uid(req),
        user.role
      );
      return res.json({ message: 'Milestone updated', progress, carePlan });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      if (error?.statusCode === 403) return res.status(403).json({ error: error.message });
      logger.error('Update milestone error:', error);
      return res.status(500).json({ error: 'Failed to update milestone' });
    }
  }
);

export default router;
