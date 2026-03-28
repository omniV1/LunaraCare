import express, { Response } from 'express';
import mongoose from 'mongoose';

const { body, validationResult } = require('express-validator');
import { authenticate } from '../middleware';
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';
import * as mfaService from '../services/mfaService';

/** Safely cast user._id to ObjectId. */
function uid(req: AuthenticatedRequest): mongoose.Types.ObjectId {
  return req.user!._id as mongoose.Types.ObjectId;
}

const router = express.Router();

/**
 * POST /auth/mfa/setup
 * Generate a TOTP secret and return QR code. Does NOT enable MFA yet.
 */
router.post('/setup', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await mfaService.setupMfa(uid(req), user.email, user.mfaEnabled ?? false);
    return res.json(result);
  } catch (error: any) {
    if (error?.statusCode === 400) return res.status(400).json({ error: error.message });
    logger.error('MFA setup error:', error);
    return res.status(500).json({ error: 'Failed to setup MFA' });
  }
});

/**
 * POST /auth/mfa/confirm-setup
 * Verify the user can produce a valid TOTP code, then enable MFA and return backup codes.
 */
router.post(
  '/confirm-setup',
  authenticate,
  [body('code').isString().isLength({ min: 6, max: 6 }).withMessage('6-digit code required')],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid code format', details: errors.array() });
    }

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await mfaService.confirmMfaSetup(uid(req), user.mfaEnabled ?? false, req.body.code);
      return res.json(result);
    } catch (error: any) {
      if (error?.statusCode === 400) return res.status(400).json({ error: error.message });
      logger.error('MFA confirm setup error:', error);
      return res.status(500).json({ error: 'Failed to confirm MFA setup' });
    }
  }
);

/**
 * POST /auth/mfa/disable
 * Requires current password + TOTP code (or backup code) to disable MFA.
 */
router.post(
  '/disable',
  authenticate,
  [
    body('password').isString().notEmpty().withMessage('Current password required'),
    body('code').isString().notEmpty().withMessage('TOTP or backup code required'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Unauthorized' });

      const result = await mfaService.disableMfa(
        uid(req),
        user.mfaEnabled ?? false,
        req.body.password,
        req.body.code
      );
      return res.json(result);
    } catch (error: any) {
      if (error?.statusCode === 400) return res.status(400).json({ error: error.message });
      if (error?.statusCode === 401) return res.status(401).json({ error: error.message });
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      logger.error('MFA disable error:', error);
      return res.status(500).json({ error: 'Failed to disable MFA' });
    }
  }
);

export default router;
