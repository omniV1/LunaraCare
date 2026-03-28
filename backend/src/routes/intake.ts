import express, { Router, Response } from 'express';

import { body, param, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../types';
import { handleValidationErrors, authenticate } from '../middleware';
import logger from '../utils/logger';
import * as intakeService from '../services/intakeService';

const router: Router = express.Router();

/**
 * @swagger
 * /intake/me:
 *   get:
 *     summary: Get intake form for the authenticated user (client)
 *     tags: [Intake]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Intake form data
 *       404:
 *         description: Intake not found
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?._id?.toString();
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const result = await intakeService.getMyIntake(userId);
    return res.json(result);
  } catch (error) {
    logger.error('Get intake me error:', error);
    return res.status(500).json({ error: 'Failed to retrieve intake form' });
  }
});

/**
 * @swagger
 * /intake:
 *   post:
 *     summary: Create or update intake form for the authenticated client
 *     tags: [Intake]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Intake form saved
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/',
  authenticate,
  [
    // Optional, we allow flexible payload and rely on schema-level validation
    body('isComplete').optional().isBoolean(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const authedUser = req.user;
    if (!authedUser?._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const result = await intakeService.saveMyIntake(authedUser._id.toString(), req.body);
      return res.status(201).json(result);
    } catch (error) {
      logger.error('Save intake error:', error);
      return res.status(500).json({ error: 'Failed to save intake form' });
    }
  }
);

/**
 * @swagger
 * /intake/{userId}:
 *   get:
 *     summary: Get intake form for a user
 *     tags: [Intake]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Intake form data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Intake not found
 */
router.get(
  '/:userId',
  authenticate,
  [param('userId').isString().notEmpty()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid parameters', details: errors.array() });
    }

    const { userId } = req.params;
    const caller = req.user;
    if (!caller?._id) return res.status(401).json({ error: 'Unauthorized' });

    const canAccess = await intakeService.canAccessUserIntake(
      caller._id.toString(),
      caller.role,
      userId
    );
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const result = await intakeService.getIntakeByUserId(userId);
      return res.json(result);
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      logger.error('Get intake error:', error);
      return res.status(500).json({ error: 'Failed to retrieve intake form' });
    }
  }
);

/**
 * PUT /intake/:userId - Update a client's intake (provider; any client)
 */
router.put(
  '/:userId',
  authenticate,
  [param('userId').isString().notEmpty()],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.params;
    const caller = req.user;
    if (!caller?._id) return res.status(401).json({ error: 'Unauthorized' });

    const canAccess = await intakeService.canAccessUserIntake(
      caller._id.toString(),
      caller.role,
      userId
    );
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (caller.role !== 'provider' && caller.role !== 'admin') {
      return res.status(403).json({ error: "Only providers or admins can update another user's intake" });
    }
    try {
      const result = await intakeService.updateIntakeByUserId(userId, req.body);
      return res.json(result);
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      logger.error('Update intake error:', error);
      return res.status(500).json({ error: 'Failed to update intake' });
    }
  }
);

/**
 * @swagger
 * /intake/{userId}/section/{sectionId}:
 *   patch:
 *     summary: Partially update an intake form section (auto-save)
 *     tags: [Intake]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           enum: [personal, birth, feeding, support, health]
 *     responses:
 *       200:
 *         description: Intake section updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Intake not found
 */
router.patch(
  '/:userId/section/:sectionId',
  authenticate,
  [param('userId').isString().notEmpty(), param('sectionId').isString().notEmpty()],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    const { userId, sectionId } = req.params;
    const caller = req.user;
    if (!caller?._id) return res.status(401).json({ error: 'Unauthorized' });

    const canAccess = await intakeService.canAccessUserIntake(
      caller._id.toString(),
      caller.role,
      userId
    );
    if (!canAccess) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    try {
      const result = await intakeService.updateIntakeSection(userId, sectionId, req.body);
      return res.json(result);
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      logger.error('Update intake section error:', error);
      return res.status(500).json({ error: 'Failed to update intake section' });
    }
  }
);

export default router;
