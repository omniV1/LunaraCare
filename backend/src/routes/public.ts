import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

import rateLimit from 'express-rate-limit';
const { body, param, validationResult } = require('express-validator');
import logger from '../utils/logger';
import { AuthenticatedRequest } from '../types';
import { requireRole, handleValidationErrors, authenticate } from '../middleware';
import * as inquiryService from '../services/inquiryService';

const router = express.Router();

const contactFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many submissions, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Interface for platform info response
interface PlatformInfo {
  platform: string;
  description: string;
  services: string[];
  contact: {
    email: string;
    phone: string;
  };
  features: string[];
}

// Interface for doula profile response
interface DoulaProfile {
  name: string;
  credentials: string[];
  experience: string;
  bio: string;
  specialties: string[];
  testimonials: Array<{
    text: string;
    author: string;
  }>;
}

// Interface for contact form request body
interface ContactFormBody {
  name: string;
  email: string;
  phone?: string;
  message: string;
  dueDate?: string;
}

// Interface for contact form response
interface ContactFormResponse {
  message: string;
  status: string;
}

// Interface for error response
interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * @swagger
 * /public/info:
 *   get:
 *     summary: Get basic platform information for public website
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Platform information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 platform:
 *                   type: string
 *                 description:
 *                   type: string
 *                 services:
 *                   type: array
 *                   items:
 *                     type: string
 */
router.get('/info', (_req: Request, res: Response<PlatformInfo>) => {
  res.json({
    platform: 'LUNARA',
    description: 'Postpartum Support Platform',
    services: [
      'Personalized Postpartum Care',
      'Real-time Doula Support',
      'Resource Library Access',
      'Appointment Scheduling',
      'Daily Wellness Check-ins',
    ],
    contact: {
      email: 'support@lunaracare.org',
      phone: '',
    },
    features: [
      'Secure messaging with certified doulas',
      'Personalized resource recommendations',
      'Daily wellness tracking',
      'Appointment scheduling',
      'Care plan management',
    ],
  });
});

/**
 * @swagger
 * /public/doula-profile:
 *   get:
 *     summary: Get doula profile information for public website
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Doula profile information
 */
router.get('/doula-profile', (_req: Request, res: Response<DoulaProfile>) => {
  res.json({
    name: 'Sarah L',
    credentials: [
      'Postpartum Support Specialist',
      'Lactation Counselor (CLC)',
      'Infant Sleep Educator',
    ],
    experience: '8+ years supporting new families',
    bio: 'Sarah L is passionate about empowering new parents during their fourth trimester journey. With over 8 years of experience, she combines evidence-based support with compassionate care to help families thrive during this transformative time.',
    specialties: [
      'Postpartum Recovery Support',
      'Breastfeeding/Chestfeeding Support',
      'Newborn Care Education',
      'Emotional Support',
      'Family Adjustment',
    ],
    testimonials: [
      {
        text: 'Sarah L was a lifeline during those first few weeks. Her support made all the difference in my recovery.',
        author: 'Jessica M.',
      },
      {
        text: "Professional, caring, and incredibly knowledgeable. I couldn't have navigated new motherhood without her.",
        author: 'Maria L.',
      },
    ],
  });
});

/**
 * @swagger
 * /public/contact:
 *   post:
 *     summary: Submit contact form from public website
 *     tags: [Public]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane@example.com"
 *               phone:
 *                 type: string
 *                 example: "+1-555-123-4567"
 *               message:
 *                 type: string
 *                 example: "I'm interested in postpartum support."
 *               dueDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-08-01"
 *     responses:
 *       200:
 *         description: Contact form submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Thank you for your inquiry! We will get back to you within 24 hours."
 *                 status:
 *                   type: string
 *                   example: "success"
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
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                         example: "Name is required and must be 2-100 characters"
 *                       param:
 *                         type: string
 *                         example: "name"
 *                       location:
 *                         type: string
 *                         example: "body"
 *                       value:
 *                         type: string
 *                         example: ""
 */
router.post(
  '/contact',
  contactFormLimiter,
  [
    body('name')
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name is required and must be 2-100 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('message')
      .isString()
      .trim()
      .isLength({ min: 5, max: 1000 })
      .withMessage('Message is required and must be 5-1000 characters'),
    body('phone')
      .optional()
      .isMobilePhone('any')
      .withMessage('Phone must be a valid mobile number'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date'),
  ],
  async (
    req: Request<{}, ContactFormResponse | ErrorResponse, ContactFormBody>,
    res: Response<ContactFormResponse | ErrorResponse>
  ): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Invalid input',
        details: errors.array(),
      });
      return;
    }

    try {
      const result = await inquiryService.submitContactForm({
        ...req.body,
        ipAddress: req.ip,
      });
      res.json(result);
    } catch (error) {
      logger.error('Contact form submission error:', error);
      res.status(500).json({
        error: 'Submission failed',
        message: 'Something went wrong. Please try again.',
      });
    }
  }
);

// ── Inquiry management (provider/admin only) ─────────────────────────────

const requireProviderOrAdmin = requireRole(['provider', 'admin']);

/**
 * @swagger
 * /public/inquiries:
 *   get:
 *     summary: List inquiries (provider/admin)
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, contacted, converted, closed]
 */
router.get(
  '/inquiries',
  authenticate,
  requireProviderOrAdmin,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await inquiryService.listInquiries(
        req.query as { status?: string; page?: string; limit?: string }
      );
      res.json(result);
    } catch (error) {
      logger.error('List inquiries error:', error);
      res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
  }
);

/**
 * @swagger
 * /public/inquiries/{id}:
 *   patch:
 *     summary: Update inquiry status/notes (provider/admin)
 *     tags: [Inquiries]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/inquiries/:id',
  authenticate,
  requireProviderOrAdmin,
  [
    param('id').isMongoId().withMessage('Invalid inquiry ID'),
    body('status').optional().isIn(['new', 'contacted', 'converted', 'closed']),
    body('notes').optional().isString().isLength({ max: 2000 }),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const inquiry = await inquiryService.updateInquiry(
        req.params.id,
        req.body,
        req.user!._id as mongoose.Types.ObjectId
      );
      res.json({ data: inquiry });
    } catch (error: any) {
      if (error?.statusCode === 404) {
        res.status(404).json({ error: error.message });
        return;
      }
      logger.error('Update inquiry error:', error);
      res.status(500).json({ error: 'Failed to update inquiry' });
    }
  }
);

export default router;
