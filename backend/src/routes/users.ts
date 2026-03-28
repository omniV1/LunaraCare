import express, { Response } from 'express';
import mongoose from 'mongoose';

const { body, validationResult } = require('express-validator');
import { authenticate } from '../middleware';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';
import * as userService from '../services/userService';
import { APIError } from '../utils/errors';

const router = express.Router();

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60f7c2b8e1d2c8a1b8e1d2c8"
 *                     firstName:
 *                       type: string
 *                       example: "Jane"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "jane@example.com"
 *                     role:
 *                       type: string
 *                       example: "client"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *                 profile:
 *                   type: object
 *                   nullable: true
 *                   example: { "userId": "60f7c2b8e1d2c8a1b8e1d2c8", "status": "active" }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 */
router.get(
  '/profile',
  authenticate,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await userService.getProfile(user);
      return res.json(result);
    } catch (error) {
      logger.error('Get profile error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to retrieve profile' });
    }
  }
);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               profile:
 *                 type: object
 *                 properties:
 *                   phone:
 *                     type: string
 *                     example: "+1-555-123-4567"
 *                   timezone:
 *                     type: string
 *                     example: "America/Phoenix"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60f7c2b8e1d2c8a1b8e1d2c8"
 *                     firstName:
 *                       type: string
 *                       example: "Jane"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "jane@example.com"
 *                     role:
 *                       type: string
 *                       example: "client"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: "Phone must be a valid mobile number"
 *                       param:
 *                         type: string
 *                         example: "profile.phone"
 *                       location:
 *                         type: string
 *                         example: "body"
 *                       value:
 *                         type: string
 *                         example: "notaphone"
 */
router.put(
  '/profile',
  authenticate,
  [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('profile.phone').optional().isMobilePhone('any'),
    body('babyBirthDate')
      .optional()
      .isISO8601()
      .withMessage('babyBirthDate must be a valid ISO 8601 date'),
    body('dueDate').optional().isISO8601().withMessage('dueDate must be a valid ISO 8601 date'),
    body('birthDate').optional().isISO8601().withMessage('birthDate must be a valid ISO 8601 date'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
      }
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const result = await userService.updateProfile(user, req.body);
      return res.json(result);
    } catch (error) {
      logger.error('Update profile error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to update profile' });
    }
  }
);

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     summary: Change user password (requires current password)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').isString().notEmpty().withMessage('Current password required'),
    body('newPassword')
      .isString()
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and a number'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await userService.changePassword(
        user._id as mongoose.Types.ObjectId,
        req.body.currentPassword,
        req.body.newPassword,
      );
      return res.json(result);
    } catch (error) {
      logger.error('Change password error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to change password' });
    }
  }
);

/**
 * @swagger
 * /users/account:
 *   delete:
 *     summary: Delete own account permanently
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/account',
  authenticate,
  [body('password').isString().notEmpty().withMessage('Password required to delete account')],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await userService.deleteAccount(user._id as mongoose.Types.ObjectId, req.body.password);
      return res.json(result);
    } catch (error) {
      logger.error('Delete account error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to delete account' });
    }
  }
);

/**
 * @swagger
 * /users/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.get('/preferences', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const result = userService.getPreferences(user);
    return res.json(result);
  } catch (error) {
    logger.error('Get preferences error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to fetch preferences' });
  }
});

/**
 * @swagger
 * /users/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/preferences',
  authenticate,
  [
    body('emailNotifications').optional().isBoolean(),
    body('appointmentReminders').optional().isBoolean(),
    body('messageAlerts').optional().isBoolean(),
    body('checkInReminders').optional().isBoolean(),
    body('loginAlerts').optional().isBoolean(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await userService.updatePreferences(user, req.body);
      return res.json(result);
    } catch (error) {
      logger.error('Update preferences error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Failed to update preferences' });
    }
  }
);

export default router;
