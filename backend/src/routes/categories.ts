import express, { Request, Response } from 'express';

import { body, param, validationResult } from 'express-validator';
import { authenticate } from '../middleware';
import logger from '../utils/logger';
import * as categoryService from '../services/categoryService';

const router = express.Router();


/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', authenticate, async (_req: Request, res: Response) => {
  try {
    const categories = await categoryService.listCategories();
    return res.json(categories);
  } catch (error) {
    logger.error('List categories error:', error);
    return res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Single category object
 *       404:
 *         description: Category not found
 */
router.get('/:id', authenticate, [param('id').isMongoId()], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
  }
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    return res.json(category);
  } catch (error: any) {
    if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
    logger.error('Get category error:', error);
    return res.status(500).json({ error: 'Failed to retrieve specified category' });
  }
});

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Validation failed
 *       500:
 *         description: Failed to create category
 */
router.post(
  '/',
  authenticate,
  [body('name').isString().notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    try {
      const category = await categoryService.createCategory(req.body);
      return res.status(201).json({ message: 'Category created', category });
    } catch (error) {
      logger.error('Create category error:', error);
      return res.status(500).json({ error: 'Failed to create category' });
    }
  }
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update an existing category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated
 *       400:
 *         description: Validation failed
 *       404:
 *         description: Category not found
 *       500:
 *         description: Failed to update category
 */
router.put(
  '/:id',
  authenticate,
  [param('id').isMongoId(), body('name').optional().isString()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      return res.json({ message: 'Category updated', category });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      logger.error('Update category error:', error);
      return res.status(500).json({ error: 'Failed to update category' });
    }
  }
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted
 *       404:
 *         description: Category not found
 *       500:
 *         description: Failed to delete category
 */
router.delete(
  '/:id',
  authenticate,
  [param('id').isMongoId()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid ID', details: errors.array() });
    }
    try {
      await categoryService.deleteCategory(req.params.id);
      return res.json({ message: 'Category deleted' });
    } catch (error: any) {
      if (error?.statusCode === 404) return res.status(404).json({ error: error.message });
      logger.error('Delete category error:', error);
      return res.status(500).json({ error: 'Failed to delete category' });
    }
  }
);

export default router;
