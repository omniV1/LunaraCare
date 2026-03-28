import express, { Router, Response } from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware';
import { AuthenticatedRequest } from '../types';
import { body, param, validationResult } from 'express-validator';
import logger from '../utils/logger';
import * as messageService from '../services/messageService';

/** Safely cast user._id to ObjectId. */
function uid(req: AuthenticatedRequest): mongoose.Types.ObjectId {
  return req.user!._id as mongoose.Types.ObjectId;
}

const router: Router = express.Router();


router.get('/all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const messages = await messageService.getAllMessages(uid(req), page, limit);
    return res.json(messages);
  } catch (error) {
    logger.error('Get all messages error:', error);
    return res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

router.get('/unread', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const unreadMessages = await messageService.getUnreadMessages(uid(req), page, limit);
    return res.json(unreadMessages);
  } catch (error) {
    logger.error('Get unread messages error:', error);
    return res.status(500).json({ error: 'Failed to retrieve unread messages' });
  }
});

// Get unread message count
router.get('/unread/count', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
    const count = await messageService.getUnreadCount(uid(req));
    return res.json({ count });
  } catch (error) {
    logger.error('Get unread count error:', error);
    return res.status(500).json({ error: 'Failed to retrieve unread count' });
  }
});

// List conversations (distinct conversationIds) for authenticated user
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
    const conversations = await messageService.listConversations(uid(req));
    return res.json(conversations);
  } catch (error) {
    logger.error('List conversations error:', error);
    return res.status(500).json({ error: 'Failed to retrieve conversations' });
  }
});

router.get('/for-me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const messages = await messageService.getMessagesForMe(uid(req), page, limit);
    return res.json({ messages });
  } catch (error) {
    logger.error('Get for-me messages error:', error);
    return res.status(500).json({ error: 'Failed to retrieve messages' });
  }
});

// Get conversation thread with a specific user (for message center)
router.get(
  '/with/:userId',
  authenticate,
  [param('userId').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid user ID', details: errors.array() });
    }
    try {
      if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
      const result = await messageService.getConversationWithUser(uid(req), req.params.userId);
      return res.json(result);
    } catch (error) {
      logger.error('Get conversation with user error:', error);
      return res.status(500).json({ error: 'Failed to retrieve conversation' });
    }
  }
);

// Get messages in a conversation
router.get(
  '/:conversationId',
  authenticate,
  [param('conversationId').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const messages = await messageService.getConversationMessages(
        req.params.conversationId,
        userId,
        req.user?.role ?? ''
      );
      return res.json(messages);
    } catch (error: any) {
      if (error?.statusCode === 403) return res.status(403).json({ error: error.message });
      logger.error('Get messages error:', error);
      return res.status(500).json({ error: 'Failed to retrieve messages' });
    }
  }
);

// Send a new message (creates conversation if first message)
router.post(
  '/',
  authenticate,
  [
    body('conversationId').optional().isMongoId(),
    body('receiver').isMongoId(),
    body('content').isString().notEmpty(),
    body('type').optional().isIn(['text', 'image', 'file', 'system']),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    try {
      if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
      const message = await messageService.sendMessage(req.body, uid(req), req.user.role ?? '');
      return res.status(201).json({ message: 'Message sent', data: message });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      if (error?.statusCode === 403) return res.status(403).json({ error: error.message });
      logger.error('Send message error:', error);
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }
);

// Mark all messages as read for the authenticated user
router.put('/read-all', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
    await messageService.markAllAsRead(uid(req));
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    logger.error('Read-all error:', error);
    return res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// Mark message as read
router.put(
  '/:id/read',
  authenticate,
  [param('id').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }
    try {
      const userId = req.user?._id?.toString();
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });
      const message = await messageService.markMessageAsRead(
        req.params.id,
        userId,
        req.user?.role ?? ''
      );
      return res.json({ message: 'Message marked as read', data: message });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      if (error?.statusCode === 403) return res.status(403).json({ error: error.message });
      logger.error('Mark read error:', error);
      return res.status(500).json({ error: 'Failed to update message' });
    }
  }
);

// Dismiss message (permanently delete)
router.put(
  '/:id/dismiss',
  authenticate,
  [param('id').isMongoId()],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }
    try {
      if (!req.user?._id) return res.status(401).json({ error: 'Unauthorized' });
      await messageService.dismissMessage(req.params.id, uid(req));
      return res.json({ message: 'Message dismissed and deleted' });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      logger.error('Dismiss error:', error);
      return res.status(500).json({ error: 'Failed to dismiss message' });
    }
  }
);

export default router;
