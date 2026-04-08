/**
 * @module routes/documents
 * Client document CRUD, submission workflow, provider review, and bulk upload.
 * Mounted at `/api/documents`.
 */
import express, { Response } from 'express';
import mongoose from 'mongoose';

import { IUser } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { body, validationResult } from 'express-validator';
import { requireRole, handleValidationErrors, authenticate } from '../middleware';
import logger from '../utils/logger';
import * as documentService from '../services/documentService';
import { APIError } from '../utils/errors';

const requireProviderOrAdmin = requireRole(['provider', 'admin']);
const requireProvider = requireRole(['provider']);

/** Express router exposing document management and review endpoints. */
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Client document management
 */

/**
 * @swagger
 * /documents:
 *   get:
 *     summary: Get all documents for the authenticated user
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await documentService.listDocuments(
      {
        documentType: req.query.documentType as string | undefined,
        submissionStatus: req.query.submissionStatus as string | undefined,
        provider: req.query.provider as string | undefined,
        search: req.query.search as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        limit: req.query.limit as string | undefined,
        page: req.query.page as string | undefined,
      },
      req.user as IUser,
    );
    return res.json(result);
  } catch (error) {
    logger.error('Get documents error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Failed to fetch documents' });
  }
});

/**
 * @swagger
 * /documents:
 *   post:
 *     summary: Create a new document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ClientDocument'
 *     responses:
 *       201:
 *         description: Document created
 *       400:
 *         description: Validation failed
 */
router.post(
  '/',
  authenticate,
  [
    body('title').isString().notEmpty().withMessage('Title is required'),
    body('documentType').isIn([
      'emotional-survey',
      'health-assessment',
      'personal-assessment',
      'feeding-log',
      'sleep-log',
      'mood-check-in',
      'recovery-notes',
      'progress-photo',
      'other',
    ]),
    body('files').isArray().withMessage('Files array is required'),
    body('uploadedBy').optional().isMongoId(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    try {
      const document = await documentService.createDocument(req.body, req.user as IUser);
      return res.status(201).json(document);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Create document error:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({
        message: error instanceof APIError ? error.message : 'Failed to create document',
        error: error instanceof APIError ? error.message : 'Internal server error',
      });
    }
  },
);

/**
 * @swagger
 * /documents/{id}:
 *   get:
 *     summary: Get a document by ID
 *     tags: [Documents]
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
 *         description: Document details
 *       404:
 *         description: Document not found
 */
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const document = await documentService.getDocumentById(req.params.id, req.user as IUser);
    return res.json(document);
  } catch (error) {
    logger.error('Get document error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Failed to fetch document' });
  }
});

/**
 * @swagger
 * /documents/{id}:
 *   put:
 *     summary: Update a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const document = await documentService.updateDocument(req.params.id, req.body, req.user as IUser);
    return res.json(document);
  } catch (error) {
    logger.error('Update document error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Failed to update document' });
  }
});

/**
 * @swagger
 * /documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await documentService.deleteDocument(req.params.id, req.user as IUser);
    return res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Delete document error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Failed to delete document' });
  }
});

/**
 * @swagger
 * /documents/{id}/submit:
 *   post:
 *     summary: Submit a document to the provider for review
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/submit', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await documentService.submitDocument(req.params.id, req.user as IUser);
    return res.json(result);
  } catch (error) {
    logger.error('Submit document error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Failed to submit document' });
  }
});

/**
 * @swagger
 * /documents/{id}/review:
 *   post:
 *     summary: Provider reviews a document and provides feedback
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               providerNotes:
 *                 type: string
 *               providerFeedback:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [reviewed-by-provider, completed]
 */
router.post('/:id/review', authenticate, requireProviderOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await documentService.reviewDocument(req.params.id, req.body, req.user as IUser);
    return res.json(result);
  } catch (error) {
    logger.error('Review document error:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Failed to review document' });
  }
});

// ── Bulk create document assignments ─────────────────────────────────
/**
 * @swagger
 * /documents/bulk-upload:
 *   post:
 *     summary: Create multiple document assignments at once
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 maxItems: 20
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     documentType:
 *                       type: string
 *                     clientUserId:
 *                       type: string
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Documents created
 */
router.post(
  '/bulk-upload',
  authenticate,
  requireProvider,
  [
    body('documents').isArray({ min: 1, max: 20 }).withMessage('Provide 1-20 documents'),
    body('documents.*.title').trim().notEmpty().withMessage('Each document needs a title'),
    body('documents.*.documentType').trim().notEmpty(),
    body('documents.*.clientUserId').trim().notEmpty(),
  ],
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { documents } = req.body as {
        documents: { title: string; documentType: string; clientUserId: string; notes?: string }[];
      };

      const created = await documentService.bulkCreateDocuments(documents, req.user!._id as mongoose.Types.ObjectId);

      return res.status(201).json({ message: `${created.length} documents created`, documents: created });
    } catch (error) {
      logger.error('Bulk document upload error:', error);
      const status = error instanceof APIError ? error.statusCode : 500;
      return res.status(status).json({ error: error instanceof APIError ? error.message : 'Bulk upload failed' });
    }
  },
);

export default router;
