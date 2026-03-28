import express, { Request, Response } from 'express';
import mongoose from 'mongoose';

import { param, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';
import { requireRole, handleValidationErrors, authenticate } from '../middleware';
import * as clientService from '../services/clientService';

/** Safely cast user._id to ObjectId. */
function uid(req: Request): mongoose.Types.ObjectId {
  return (req as AuthenticatedRequest).user!._id as mongoose.Types.ObjectId;
}

const router = express.Router();


const requireProviderOrAdmin = requireRole(['provider', 'admin']);

/**
 * @swagger
 * /client/me:
 *   get:
 *     summary: Get current user's client profile (clients only), with assigned provider populated
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client profile with assignedProvider populated
 *       403:
 *         description: Not a client
 *       404:
 *         description: Client profile not found
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user?._id) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const client = await clientService.getMyClientProfile(uid(req), user.role);
    return res.json(client);
  } catch (error: any) {
    if (error?.statusCode === 403) return res.status(403).json({ message: error.message });
    if (error?.statusCode === 404) return res.status(404).json({ message: error.message });
    logger.error('Get client me error:', error);
    return res.status(500).json({ message: 'Failed to retrieve profile' });
  }
});

/**
 * @swagger
 * /client:
 *   get:
 *     summary: List clients (my assigned; all when all=1 for provider)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: all
 *         schema:
 *           type: string
 *         description: If "1", provider gets all clients; otherwise returns only clients assigned to current user
 *     responses:
 *       200:
 *         description: List of client profiles with user and assignedProvider populated
 */
router.get('/', authenticate, requireProviderOrAdmin, async (req: Request, res: Response) => {
  const user = (req as AuthenticatedRequest).user;
  if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
  try {
    const clients = await clientService.listClients(uid(req), user.role, req.query.all === '1');
    return res.json({ clients });
  } catch (error) {
    logger.error('List clients error:', error);
    return res.status(500).json({ message: 'Failed to retrieve clients' });
  }
});

/**
 * @swagger
 * /client/{id}/assign:
 *   patch:
 *     summary: Assign client to current user (add to my list)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client assigned to you
 *       404:
 *         description: Client not found
 */
router.patch(
  '/:id/assign',
  authenticate,
  requireProviderOrAdmin,
  [param('id').isMongoId()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const client = await clientService.assignClient(req.params.id, uid(req));
      return res.json(client);
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ message: error.message });
      logger.error('Assign client error:', error);
      return res.status(500).json({ message: 'Failed to assign client' });
    }
  }
);

/**
 * @swagger
 * /client/{id}/unassign:
 *   patch:
 *     summary: Remove client from your list (non-destructive; client remains in system)
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Client removed from your list
 *       404:
 *         description: Client not found
 */
router.patch(
  '/:id/unassign',
  authenticate,
  requireProviderOrAdmin,
  [param('id').isMongoId()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    try {
      const client = await clientService.unassignClient(req.params.id, uid(req));
      return res.json(client);
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ message: error.message });
      if (error?.statusCode === 403) return res.status(403).json({ message: error.message });
      logger.error('Unassign client error:', error);
      return res.status(500).json({ message: 'Failed to unassign client' });
    }
  }
);

/**
 * GET /client/:id - Get one client profile (provider can view any)
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: 'Invalid client ID', errors: errors.array() });
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role !== 'provider' && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const client = await clientService.getClientById(req.params.id, user._id.toString(), user.role);
      return res.json(client);
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ message: error.message });
      if (error?.statusCode === 403) return res.status(403).json({ message: error.message });
      logger.error('Get client error:', error);
      return res.status(500).json({ message: 'Failed to retrieve client' });
    }
  }
);

/**
 * PUT /client/:id - Update client profile (provider can edit any)
 */
router.put(
  '/:id',
  authenticate,
  [param('id').isMongoId()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) return res.status(401).json({ message: 'Unauthorized' });
    if (user.role !== 'provider' && user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    try {
      const client = await clientService.updateClient(
        req.params.id,
        req.body,
        user._id.toString(),
        user.role
      );
      return res.json(client);
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ message: error.message });
      if (error?.statusCode === 403) return res.status(403).json({ message: error.message });
      logger.error('Update client error:', error);
      return res.status(500).json({ message: 'Failed to update client' });
    }
  }
);

/**
 * DELETE /client/:id - Permanently delete a client and all associated data
 */
router.delete(
  '/:id',
  authenticate,
  requireProviderOrAdmin,
  [param('id').isMongoId()],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) return res.status(401).json({ message: 'Unauthorized' });
    try {
      await clientService.deleteClient(req.params.id, uid(req));
      return res.json({ message: 'Client permanently deleted' });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ message: error.message });
      logger.error('Delete client error:', error);
      return res.status(500).json({ message: 'Failed to delete client' });
    }
  }
);

export default router;
