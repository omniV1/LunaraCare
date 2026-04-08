/**
 * @module routes/resources
 * Resource library CRUD, version history, and restore endpoints.
 * Mounted at `/api/resources`.
 */
import express, { Router, Response } from 'express';

import { AuthenticatedRequest } from '../types';
import { authenticate } from '../middleware';
import { body, param, validationResult } from 'express-validator';
import { APIError } from '../utils/errors';
import logger from '../utils/logger';
import {
  listResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getVersionHistory,
  restoreVersion,
} from '../services/resourceService';
import type { ResourceListQuery, UpdateResourceInput } from '../services/resourceService';

/** Express router exposing resource library endpoints. */
const router: Router = express.Router();

/**
 * @swagger
 * /resources:
 *   get:
 *     summary: Get all resources
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resources
 */

router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = req.query as unknown as ResourceListQuery;
    const result = await listResources(query, req.user?.role);
    return res.json(result);
  } catch (error) {
    if (error instanceof APIError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    logger.error('List resources error:', error);
    return res.status(500).json({ error: 'Failed to retrieve resources' });
  }
});

/**
 * @swagger
 * /resources/{id}:
 *   get:
 *     summary: Get resource by ID
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Single resource object
 *       404:
 *         description: Resource not found
 */
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
      const resource = await getResourceById(req.params.id);
      return res.json(resource);
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      logger.error('Get resource error:', error);
      return res.status(500).json({ error: 'Failed to retrieve specified resource' });
    }
  },
);

/**
 * @swagger
 * /resources:
 *   post:
 *     summary: Create a new resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               targetWeeks:
 *                 type: array
 *                 items:
 *                   type: number
 *               targetPregnancyWeeks:
 *                 type: array
 *                 items:
 *                   type: number
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               fileUrl:
 *                 type: string
 *               thumbnailUrl:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Resource created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Failed to create resource
 */
router.post(
  '/',
  authenticate,
  [
    body('title').isString().notEmpty(),
    body('description').isString().notEmpty(),
    body('content').isString().notEmpty(),
    body('category').isString().notEmpty(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.debug('Validation errors:', { errors: errors.array(), body: req.body });
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const result = await createResource(req.body, user);
      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      logger.error('Create resource error:', error);
      return res.status(500).json({ error: 'Failed to create resource' });
    }
  },
);

/**
 * @swagger
 * /resources/{id}:
 *   put:
 *     summary: Update an existing resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Resource'
 *     responses:
 *       200:
 *         description: Resource updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Failed to update resource
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isMongoId(),
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('content').optional().isString(),
    body('category').optional().isString(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const data: UpdateResourceInput = req.body;
      const result = await updateResource(req.params.id, data, user);
      return res.json(result);
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      logger.error('Update resource error:', error);
      return res.status(500).json({ error: 'Failed to update resource' });
    }
  },
);

/**
 * @swagger
 * /resources/{id}:
 *   delete:
 *     summary: Delete a resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource deleted
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Failed to delete resource
 */
router.delete(
  '/:id',
  authenticate,
  [param('id').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const result = await deleteResource(req.params.id, user);
      return res.json(result);
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      logger.error('Delete resource error:', error);
      return res.status(500).json({ error: 'Failed to delete resource' });
    }
  },
);

/**
 * @swagger
 * /resources/{id}/versions:
 *   get:
 *     summary: Get version history for a resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: List of versions
 *       404:
 *         description: Resource not found
 */
router.get(
  '/:id/versions',
  authenticate,
  [param('id').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }
    try {
      const result = await getVersionHistory(req.params.id);
      return res.json(result);
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      logger.error('Get version history error:', error);
      return res.status(500).json({ error: 'Failed to retrieve version history' });
    }
  },
);

/**
 * @swagger
 * /resources/{id}/versions/{versionId}/restore:
 *   post:
 *     summary: Restore a resource to a previous version
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Version ID
 *     responses:
 *       200:
 *         description: Resource restored
 *       404:
 *         description: Resource or version not found
 */
router.post(
  '/:id/versions/:versionId/restore',
  authenticate,
  [param('id').isMongoId(), param('versionId').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const result = await restoreVersion(req.params.id, req.params.versionId, user);
      return res.json(result);
    } catch (error) {
      if (error instanceof APIError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      logger.error('Restore version error:', error);
      return res.status(500).json({ error: 'Failed to restore version' });
    }
  },
);

export default router;
