/**
 * @module routes/admin
 * Administrative endpoints for provider/user management.
 * Mounted at `/api/admin`.
 */
import express, { Request, Response, NextFunction } from 'express';

import { body } from 'express-validator';
import { requireRole, handleValidationErrors, authenticate } from '../middleware';
import logger from '../utils/logger';
import * as adminService from '../services/adminService';

/** Express router exposing admin management endpoints. */
const router = express.Router();


const requireProviderOrAdmin = requireRole(['provider', 'admin']);

interface AdminCreateProviderRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * @swagger
 * /admin/providers:
 *   post:
 *     summary: Create a new provider user (provider only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Provider created successfully
 *       400:
 *         description: Validation error or user already exists
 *       403:
 *         description: Forbidden (not a provider)
 *       500:
 *         description: Internal server error
 */
router.post(
  '/providers',
  authenticate,
  requireProviderOrAdmin,
  [
    body('firstName').trim().isLength({ min: 1, max: 50 }),
    body('lastName').trim().isLength({ min: 1, max: 50 }),
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  ],
  handleValidationErrors,
  async (
    req: Request<{}, any, AdminCreateProviderRequest>,
    res: Response,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const result = await adminService.createProvider(req.body);

      res.status(201).json({
        success: true,
        message: 'Provider created successfully',
        data: result,
      });
    } catch (err: any) {
      if (err?.statusCode === 409) {
        res.status(400).json({
          success: false,
          error: 'Registration failed',
          message: err.message,
        });
        return;
      }
      logger.error('Admin create provider error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create provider',
      });
    }
  }
);

export default router;
