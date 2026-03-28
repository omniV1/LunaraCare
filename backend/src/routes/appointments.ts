import express, { Router, Response } from 'express';
import mongoose from 'mongoose';

import { AuthenticatedRequest } from '../types';
import { body, param, query, validationResult } from 'express-validator';
import { requireRole, handleValidationErrors, authenticate } from '../middleware';
import { APIError } from '../utils/errors';
import logger from '../utils/logger';
import {
  listAppointments,
  getUpcomingAppointments,
  getCalendarAppointments,
  getCalendarAvailability,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  requestAppointment,
  requestProposedAppointment,
  confirmAppointment,
  cancelAppointment,
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  bulkCreateAppointments,
  CallerUser,
} from '../services/appointmentService';

/** Safely cast the IUser._id (typed as unknown by Mongoose) to ObjectId. */
function userId(req: AuthenticatedRequest): mongoose.Types.ObjectId {
  return req.user!._id as mongoose.Types.ObjectId;
}

const router: Router = express.Router();


const requireProvider = requireRole(['provider']);

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const appointments = await listAppointments(userId(req), user.role, page, limit);
    return res.json(appointments);
  } catch (error) {
    if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
    logger.error('List appointments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve appointments' });
  }
});

// ── Upcoming appointments (must be before /:id so "upcoming" is not treated as id) ──
router.get('/upcoming', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.min(Math.max(parseInt(String(req.query.limit), 10) || 10, 1), 100);

    const appointments = await getUpcomingAppointments(userId(req), user.role, limit);
    return res.json(appointments);
  } catch (error) {
    if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
    logger.error('Upcoming appointments error:', error);
    return res.status(500).json({ error: 'Failed to retrieve upcoming appointments' });
  }
});

// ═══════════════════════════════════════════════════════════════════
//  CALENDAR (must be before /:id so "calendar" is not treated as id)
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /appointments/calendar:
 *   get:
 *     summary: Get appointments in a date range for the authenticated user
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Range start (ISO 8601)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Range end (ISO 8601)
 *     responses:
 *       200:
 *         description: List of appointments within the date range
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/calendar',
  authenticate,
  [
    query('startDate').isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
    query('endDate').isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const user = req.user;
    if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const appointments = await getCalendarAppointments(userId(req), user.role, startDate, endDate);
      return res.json(appointments);
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Calendar appointments error:', error);
      return res.status(500).json({ error: 'Failed to retrieve calendar appointments' });
    }
  }
);

/**
 * @swagger
 * /appointments/calendar/availability:
 *   get:
 *     summary: Get availability slots for a provider in a date range
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: providerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider user ID
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Range start (ISO 8601)
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Range end (ISO 8601)
 *     responses:
 *       200:
 *         description: List of availability slots
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/calendar/availability',
  authenticate,
  [
    query('providerId').isMongoId().withMessage('providerId must be a valid Mongo ID'),
    query('startDate').isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
    query('endDate').isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const user = req.user;
    if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const providerId = req.query.providerId as string;
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const slots = await getCalendarAvailability(providerId, startDate, endDate);
      return res.json(slots);
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Calendar availability error:', error);
      return res.status(500).json({ error: 'Failed to retrieve availability slots' });
    }
  }
);

// ── Get single appointment ──────────────────────────────────────────
router.get(
  '/:id',
  authenticate,
  [param('id').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }
    try {
      const uid = req.user?._id ? String(req.user._id) : undefined;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const appointment = await getAppointmentById(req.params.id, uid, req.user!.role);
      return res.json(appointment);
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Get appointment error:', error);
      return res.status(500).json({ error: 'Failed to retrieve appointment' });
    }
  }
);

// ── Create appointment (provider: schedule for any client; legacy compat) ────────────────────────
router.post(
  '/',
  authenticate,
  [
    body('clientId').isMongoId(),
    body('providerId').isMongoId(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('type').optional().isIn(['virtual', 'in_person']),
    body('notes').optional().isString(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    try {
      const user = req.user;
      if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });

      const caller: CallerUser = {
        _id: userId(req),
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      const appointment = await createAppointment(req.body, caller);
      return res.status(201).json({ message: 'Appointment created', appointment });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Create appointment error:', error);
      return res.status(500).json({ error: 'Failed to create appointment' });
    }
  }
);

// ── Update appointment ──────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  [
    param('id').isMongoId(),
    body('status')
      .optional()
      .isIn(['scheduled', 'completed', 'cancelled', 'requested', 'confirmed']),
    body('startTime').optional().isISO8601(),
    body('endTime').optional().isISO8601(),
    body('notes').optional().isString(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    try {
      const uid = req.user?._id ? String(req.user._id) : undefined;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const appointment = await updateAppointment(req.params.id, req.body, uid, req.user!.role);
      return res.json({ message: 'Appointment updated', appointment });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Update appointment error:', error);
      return res.status(500).json({ error: 'Failed to update appointment' });
    }
  }
);

// ── Delete appointment ──────────────────────────────────────────────
router.delete(
  '/:id',
  authenticate,
  [param('id').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }
    try {
      const uid = req.user?._id ? String(req.user._id) : undefined;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      await deleteAppointment(req.params.id, uid, req.user!.role);
      return res.json({ message: 'Appointment deleted' });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Delete appointment error:', error);
      return res.status(500).json({ error: 'Failed to delete appointment' });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════
//  BOOKING WORKFLOW
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /appointments/request:
 *   post:
 *     summary: Request a new appointment (books an availability slot)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/request',
  authenticate,
  [
    body('providerId').isMongoId(),
    body('slotId').isMongoId(),
    body('type').optional().isIn(['virtual', 'in_person']),
    body('notes').optional().isString(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const user = req.user;
    if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const caller: CallerUser = {
        _id: userId(req),
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      const appointment = await requestAppointment(req.body, caller);
      return res.status(201).json({
        message: 'Appointment requested',
        appointment,
      });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Request appointment error:', error);
      return res.status(500).json({ error: 'Failed to request appointment' });
    }
  }
);

/**
 * Client requests an appointment at a proposed date/time (no availability slot required).
 * Provider can approve, change the time, or decline.
 */
router.post(
  '/request-proposed',
  authenticate,
  [
    body('providerId').isMongoId(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('type').optional().isIn(['virtual', 'in_person']),
    body('notes').optional().isString(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const user = req.user;
    if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const caller: CallerUser = {
        _id: userId(req),
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      const appointment = await requestProposedAppointment(req.body, caller);
      return res.status(201).json({
        message: 'Appointment request sent. Your provider will approve or suggest another time.',
        appointment,
      });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Request proposed appointment error:', error);
      return res.status(500).json({ error: 'Failed to request appointment' });
    }
  }
);

/**
 * @swagger
 * /appointments/{id}/confirm:
 *   post:
 *     summary: Provider confirms a requested appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/confirm',
  authenticate,
  [param('id').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }

    const user = req.user;
    if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const userName = `${user.firstName} ${user.lastName}`;
      const appointment = await confirmAppointment(
        req.params.id,
        String(user._id),
        user.role,
        userName
      );
      return res.json({ message: 'Appointment confirmed', appointment });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Confirm appointment error:', error);
      return res.status(500).json({ error: 'Failed to confirm appointment' });
    }
  }
);

/**
 * @swagger
 * /appointments/{id}/cancel:
 *   post:
 *     summary: Cancel an appointment (client or provider)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/cancel',
  authenticate,
  [param('id').isMongoId(), body('reason').optional().isString()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid parameters', details: errors.array() });
    }

    const user = req.user;
    if (!user?._id) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const userName = `${user.firstName} ${user.lastName}`;
      const appointment = await cancelAppointment(
        req.params.id,
        String(user._id),
        user.role,
        userName,
        req.body.reason
      );
      return res.json({ message: 'Appointment cancelled', appointment });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Cancel appointment error:', error);
      return res.status(500).json({ error: 'Failed to cancel appointment' });
    }
  }
);

// ── Availability slot management (provider) ──────────────────────────

// Create availability slot
router.post(
  '/availability',
  authenticate,
  requireProvider,
  [
    body('date').isISO8601().withMessage('date must be ISO 8601'),
    body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('startTime must be HH:MM'),
    body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('endTime must be HH:MM'),
    body('recurring').optional().isBoolean(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const slot = await createAvailabilitySlot(userId(req), req.body);
      return res.status(201).json({ message: 'Availability slot created', slot });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Create availability slot error:', error);
      return res.status(500).json({ error: 'Failed to create availability slot' });
    }
  }
);

// Delete availability slot
router.delete(
  '/availability/:id',
  authenticate,
  requireProvider,
  [param('id').isMongoId()],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      await deleteAvailabilitySlot(req.params.id, userId(req));
      return res.json({ message: 'Availability slot deleted' });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Delete availability slot error:', error);
      return res.status(500).json({ error: 'Failed to delete slot' });
    }
  }
);

// ── Bulk create appointments ─────────────────────────────────────────
/**
 * @swagger
 * /appointments/bulk-create:
 *   post:
 *     summary: Create multiple appointments at once (provider only)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointments:
 *                 type: array
 *                 maxItems: 20
 *                 items:
 *                   type: object
 *                   properties:
 *                     clientId:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                       format: date-time
 *                     endTime:
 *                       type: string
 *                       format: date-time
 *                     type:
 *                       type: string
 *                       enum: [virtual, in_person]
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Appointments created
 */
router.post(
  '/bulk-create',
  authenticate,
  requireProvider,
  [
    body('appointments').isArray({ min: 1, max: 20 }).withMessage('Provide 1\u201320 appointments'),
    body('appointments.*.clientId').trim().notEmpty(),
    body('appointments.*.startTime').isISO8601(),
    body('appointments.*.endTime').isISO8601(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const created = await bulkCreateAppointments(req.body.appointments, userId(req));
      return res.status(201).json({ message: `${created.length} appointments created`, appointments: created });
    } catch (error) {
      if (error instanceof APIError) return res.status(error.statusCode).json({ error: error.message });
      logger.error('Bulk appointment creation error:', error);
      return res.status(500).json({ error: 'Bulk creation failed' });
    }
  }
);

export default router;
