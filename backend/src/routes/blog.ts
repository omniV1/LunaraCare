import express, { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

import { IUser } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { requireRole, authenticate } from '../middleware';
import logger from '../utils/logger';
import * as blogService from '../services/blogService';
import { APIError } from '../utils/errors';

const router: Router = express.Router();
const requireProvider = requireRole(['provider']);

/**
 * @swagger
 * /api/blog:
 *   get:
 *     summary: Get all published blog posts
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter by tag
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, excerpt, and content
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Number of posts to return
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *         description: Page number for pagination
 *     responses:
 *       200:
 *         description: List of published blog posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogPost'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: number
 *                     limit:
 *                       type: number
 *                     total:
 *                       type: number
 *                     pages:
 *                       type: number
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await blogService.listPublishedPosts({
      category: req.query.category as string | undefined,
      tag: req.query.tag as string | undefined,
      search: req.query.search as string | undefined,
      author: req.query.author as string | undefined,
      limit: req.query.limit as string | undefined,
      page: req.query.page as string | undefined,
    });
    res.json(result);
  } catch (error) {
    logger.error('Error fetching blog posts:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/blog/all:
 *   get:
 *     summary: Get all blog posts for management (providers only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *         description: Number of posts to return
 *     responses:
 *       200:
 *         description: List of all blog posts (published and drafts)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BlogPost'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/all', authenticate, requireProvider, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    const { limit = 50 } = req.query;
    const posts = await blogService.listAllPostsByAuthor(user!._id as mongoose.Types.ObjectId, Number(limit));
    return res.json({ posts });
  } catch (error) {
    logger.error('Error fetching all posts:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/blog/{slug}:
 *   get:
 *     summary: Get a specific blog post by slug
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post slug
 *     responses:
 *       200:
 *         description: Blog post details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *       404:
 *         description: Blog post not found
 */
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const post = await blogService.getPostBySlug(req.params.slug);
    return res.json(post);
  } catch (error) {
    logger.error('Error fetching blog post:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/blog:
 *   post:
 *     summary: Create a new blog post (providers only)
 *     tags: [Blog]
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
 *               - excerpt
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               featuredImage:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.post('/', authenticate, requireProvider, async (req: AuthenticatedRequest, res: Response) => {
  try {
    logger.debug('Blog POST request received:', {
      body: req.body,
      user: req.user,
      headers: req.headers,
    });

    const blogPost = await blogService.createBlogPost(req.body, req.user as IUser);
    return res.status(201).json(blogPost);
  } catch (error) {
    logger.error('Error creating blog post:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/blog/{id}:
 *   put:
 *     summary: Update a blog post (providers only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               featuredImage:
 *                 type: string
 *               isPublished:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Blog post not found
 */
router.put('/:id', authenticate, requireProvider, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blogPost = await blogService.updateBlogPost(req.params.id, req.body, req.user as IUser);
    return res.json(blogPost);
  } catch (error) {
    logger.error('Error updating blog post:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/blog/{id}:
 *   delete:
 *     summary: Delete a blog post (providers only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Blog post not found
 */
router.delete('/:id', authenticate, requireProvider, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await blogService.deleteBlogPost(req.params.id, req.user as IUser);
    return res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    logger.error('Error deleting blog post:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/blog/drafts:
 *   get:
 *     summary: Get user's draft blog posts (providers only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of draft blog posts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BlogPost'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/drafts', authenticate, requireProvider, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user } = req;
    if (!user) return res.status(401).json({ success: false, error: 'Not authenticated' });
    const drafts = await blogService.getDraftPosts(user._id as mongoose.Types.ObjectId);
    return res.json(drafts);
  } catch (error) {
    logger.error('Error fetching drafts:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/blog/{id}/versions:
 *   get:
 *     summary: Get version history for a blog post (providers only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: List of versions sorted by version number descending
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/BlogPostVersion'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Blog post not found
 */
router.get('/:id/versions', authenticate, requireProvider, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { versions } = await blogService.getVersionHistory(req.params.id, req.user as IUser);
    return res.json(versions);
  } catch (error) {
    logger.error('Error fetching blog post versions:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/blog/{id}/versions/{versionId}:
 *   get:
 *     summary: Get a specific version of a blog post (providers only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Version ID
 *     responses:
 *       200:
 *         description: Blog post version details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPostVersion'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Blog post or version not found
 */
router.get('/:id/versions/:versionId', authenticate, requireProvider, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const version = await blogService.getVersion(req.params.id, req.params.versionId, req.user as IUser);
    return res.json(version);
  } catch (error) {
    logger.error('Error fetching blog post version:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/blog/{id}/versions/{versionId}/restore:
 *   post:
 *     summary: Restore a blog post to a specific version (providers only)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blog post ID
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Version ID to restore
 *     responses:
 *       200:
 *         description: Blog post restored to the specified version
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlogPost'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 *       404:
 *         description: Blog post or version not found
 */
router.post('/:id/versions/:versionId/restore', authenticate, requireProvider, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const blogPost = await blogService.restoreVersion(req.params.id, req.params.versionId, req.user as IUser);
    return res.json(blogPost);
  } catch (error) {
    logger.error('Error restoring blog post version:', error);
    const status = error instanceof APIError ? error.statusCode : 500;
    return res.status(status).json({ message: error instanceof APIError ? error.message : 'Internal server error' });
  }
});

export default router;
