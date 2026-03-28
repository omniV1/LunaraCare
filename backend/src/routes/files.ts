import express, { Response } from 'express';

import multer from 'multer';
import { authenticate } from '../middleware';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';
import * as fileService from '../services/fileService';

const router = express.Router();


// Configure multer for memory storage (files stored in buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Allowed file types for healthcare documents
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File upload and management (GridFS)
 */

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Upload a file to GridFS storage
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               folder:
 *                 type: string
 *                 description: Optional folder/category for organization
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: No file provided or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const result = await fileService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user?._id?.toString(),
        req.body.folder
      );

      return res.json({
        success: true,
        file: result,
      });
    } catch (error: unknown) {
      logger.error('File upload error:', error);
      return res.status(500).json({
        error: 'Failed to upload file',
      });
    }
  }
);

/**
 * @swagger
 * /api/files/{fileId}:
 *   get:
 *     summary: Download a file from GridFS
 *     tags: [Files]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: The GridFS file ID
 *     responses:
 *       200:
 *         description: File stream
 *       404:
 *         description: File not found
 */
router.get('/:fileId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const fileData = await fileService.downloadFile(
      req.params.fileId,
      req.user?._id?.toString(),
      req.user?.role
    );

    res.set({
      'Content-Type': fileData.contentType,
      'Content-Length': fileData.size.toString(),
      'Content-Disposition': `inline; filename="${encodeURIComponent(fileData.filename)}"`,
      'Cache-Control': 'private, max-age=3600',
    });

    fileData.stream.pipe(res);
  } catch (error: any) {
    if (error?.statusCode === 404 || (error instanceof Error && error.message === 'File not found')) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    if (error?.statusCode === 403) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    logger.error('File download error:', error);
    res.status(500).json({
      error: 'Failed to download file',
    });
  }
});

/**
 * @swagger
 * /api/files/{fileId}/info:
 *   get:
 *     summary: Get file metadata without downloading
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File metadata
 *       404:
 *         description: File not found
 */
router.get('/:fileId/info', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const info = await fileService.getFileInfo(
      req.params.fileId,
      req.user?._id?.toString(),
      req.user?.role
    );
    return res.json(info);
  } catch (error: any) {
    if (error?.statusCode === 404) return res.status(404).json({ error: 'File not found' });
    if (error?.statusCode === 403) return res.status(403).json({ error: 'Access denied' });
    logger.error('File info error:', error);
    return res.status(500).json({
      error: 'Failed to get file info',
    });
  }
});

/**
 * @swagger
 * /api/files/{fileId}:
 *   delete:
 *     summary: Delete a file from GridFS
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
router.delete('/:fileId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await fileService.deleteFile(
      req.params.fileId,
      req.user?._id?.toString(),
      req.user?.role
    );
    return res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error: any) {
    if (error?.statusCode === 404) return res.status(404).json({ error: 'File not found' });
    if (error?.statusCode === 403) return res.status(403).json({ error: 'Access denied' });
    logger.error('File delete error:', error);
    return res.status(500).json({
      error: 'Failed to delete file',
    });
  }
});

export default router;
