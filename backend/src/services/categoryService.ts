import Category from '../models/Category';
import { NotFoundError } from '../utils/errors';
import logger from '../utils/logger';

// ── Input types ──────────────────────────────────────────────────────────────

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentCategory?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentCategory?: string;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * List all categories, sorted by name.
 */
export async function listCategories() {
  const categories = await Category.find().sort({ name: 1 }).limit(500);
  logger.debug('Categories GET - Found %d categories', categories.length);
  return categories;
}

/**
 * Get a single category by ID.
 *
 * @throws NotFoundError — category not found
 */
export async function getCategoryById(id: string) {
  const category = await Category.findById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  return category;
}

/**
 * Create a new category.
 */
export async function createCategory(data: CreateCategoryInput) {
  const { name, description, parentCategory } = data;
  const category = new Category({ name, description, parentCategory });
  await category.save();
  return category;
}

/**
 * Update an existing category.
 *
 * @throws NotFoundError — category not found
 */
export async function updateCategory(id: string, data: UpdateCategoryInput) {
  const { name, description, parentCategory } = data;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (parentCategory !== undefined) updates.parentCategory = parentCategory;

  const category = await Category.findByIdAndUpdate(id, updates, { new: true });
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  return category;
}

/**
 * Delete a category.
 *
 * @throws NotFoundError — category not found
 */
export async function deleteCategory(id: string): Promise<void> {
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
}
