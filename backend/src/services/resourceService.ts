/**
 * @module services/resourceService
 * Resource library CRUD, versioning, and client notifications.
 * Manages educational resources with category resolution, full-text search,
 * GridFS file storage for attachments, version history with rollback,
 * and real-time Socket.io notifications on publish.
 */

import mongoose from 'mongoose';
import Resources, { IResource } from '../models/Resources';
import Category from '../models/Category';
import ResourceVersion from '../models/ResourceVersion';
import Client from '../models/Client';
import Message from '../models/Message';
import User, { IUser } from '../models/User';
import gridfsService from './gridfsService';
import logger from '../utils/logger';
import { APIError } from '../utils/errors';
import type { Server } from 'socket.io';

// ── Socket.io access ─────────────────────────────────────────────────────────

const getIO = () => (globalThis as unknown as { io?: Server }).io;

// ── Constants ────────────────────────────────────────────────────────────────

const VALID_OBJECTID = /^[a-f0-9]{24}$/i;

const ALLOWED_UPDATE_FIELDS = [
  'title',
  'description',
  'content',
  'type',
  'category',
  'tags',
  'fileUrl',
  'thumbnailUrl',
  'isPublished',
  'metadata',
  'changeReason',
] as const;

// ── Input / Result types ─────────────────────────────────────────────────────

/** Query parameters for filtering and paginating resources. */
export interface ResourceListQuery {
  category?: string;
  difficulty?: string;
  targetWeeks?: string | string[];
  targetPregnancyWeeks?: string | string[];
  tags?: string | string[];
  search?: string;
  author?: string;
  isPublished?: string;
  limit?: string | number;
  page?: string | number;
}

/** Paginated resource list with category-resolved entries. */
export interface ResourceListResult {
  resources: Record<string, unknown>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** Fields for creating a new resource. */
export interface CreateResourceInput {
  title: string;
  description: string;
  content: string;
  category: string;
  tags?: string[];
  targetWeeks?: number[];
  targetPregnancyWeeks?: number[];
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  fileUrl?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
  [key: string]: unknown;
}

/** Mutable fields when updating a resource. */
export interface UpdateResourceInput {
  title?: string;
  description?: string;
  content?: string;
  type?: string;
  category?: string;
  tags?: string[];
  fileUrl?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
  metadata?: Record<string, unknown>;
  changeReason?: string;
  [key: string]: unknown;
}

// ── Low-level helpers ────────────────────────────────────────────────────────

/** Extract a file ID from a GridFS or legacy Supabase storage URL. */
export function extractFileId(url: string | undefined): string | null {
  if (!url) return null;

  // GridFS URL format: /api/files/<fileId>
  const gridfsPattern = /\/api\/files\/([a-f0-9]{24})$/i;
  const gridfsMatch = gridfsPattern.exec(url);
  if (gridfsMatch?.[1]) {
    return gridfsMatch[1];
  }

  // Legacy Supabase URL format (for backwards compatibility)
  const supabaseUrlPattern = /\/storage\/v1\/object\/public\/[^/]+\/(.+)$/;
  const supabaseMatch = supabaseUrlPattern.exec(url);
  if (supabaseMatch?.[1]) {
    return decodeURIComponent(supabaseMatch[1]);
  }

  return null;
}

/** Delete a file from GridFS storage by its URL. Silently ignores missing files. */
export async function deleteStorageFile(url: string | undefined): Promise<void> {
  const fileId = extractFileId(url);
  if (!fileId) return;

  if (VALID_OBJECTID.test(fileId)) {
    try {
      await gridfsService.deleteFile(fileId);
      logger.info(`Deleted file from GridFS: ${fileId}`);
    } catch {
      logger.debug(`File not found in GridFS (may be legacy): ${fileId}`);
    }
  }
}

/** Create a version snapshot of a resource. Non-critical — errors are logged, not thrown. */
export async function createResourceVersion(
  resource: IResource,
  changedBy: IUser | mongoose.Types.ObjectId,
  changeReason?: string,
): Promise<void> {
  try {
    const latestVersion = await ResourceVersion.findOne({ resourceId: resource._id })
      .sort({ versionNumber: -1 })
      .limit(1);

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const version = new ResourceVersion({
      resourceId: resource._id,
      versionNumber: nextVersionNumber,
      title: resource.title,
      description: resource.description,
      content: resource.content,
      category: resource.category,
      tags: resource.tags ?? [],
      targetWeeks: resource.targetWeeks ?? [],
      targetPregnancyWeeks: resource.targetPregnancyWeeks ?? [],
      difficulty: resource.difficulty,
      fileUrl: resource.fileUrl,
      thumbnailUrl: resource.thumbnailUrl,
      isPublished: resource.isPublished,
      changedBy: changedBy._id ?? changedBy,
      changeReason,
    });

    await version.save();
    logger.info(`Created version ${nextVersionNumber} for resource ${resource._id}`);
  } catch (error) {
    logger.error('Error creating resource version:', error);
    // Don't throw — versioning is non-critical
  }
}

/** Notify all clients of a provider when a new resource is published. Non-critical. */
export async function notifyClientsOfNewResource(
  resource: IResource,
  provider: IUser,
): Promise<void> {
  try {
    const clients = await Client.find({ assignedProvider: provider._id }).populate(
      'userId',
      'firstName lastName email',
    );

    if (!clients || clients.length === 0) {
      return;
    }

    const providerUser = await User.findById(provider._id);
    const io = getIO();

    for (const client of clients) {
      const clientUser = client.userId as unknown as IUser | null;
      if (!clientUser) continue;

      if (client.assignedProvider?.toString() !== String(provider._id)) {
        continue;
      }

      const notificationMessage = new Message({
        conversationId: new mongoose.Types.ObjectId(),
        sender: provider._id,
        receiver: clientUser._id,
        content: `${providerUser?.firstName ?? 'Your provider'} has published a new resource: "${resource.title}". Check it out in your resource library!`,
        messageType: 'notification',
        read: false,
      });

      await notificationMessage.save();

      if (io) {
        io.to(String(clientUser._id)).emit('newResource', {
          resourceId: resource._id,
          title: resource.title,
          message: notificationMessage.content,
        });
      }
    }
  } catch (error) {
    logger.error('Error notifying clients of new resource:', error);
    // Don't throw — notifications are non-critical
  }
}

/** Resolve a single resource's category from ID/name to a full object. */
export async function transformResourceCategory(
  resource: IResource,
): Promise<Record<string, unknown>> {
  const resourceObj = resource.toObject
    ? resource.toObject({ virtuals: true })
    : { ...resource };

  if (resourceObj.category && typeof resourceObj.category === 'string') {
    try {
      let category = null;
      if (VALID_OBJECTID.test(resourceObj.category)) {
        category = await Category.findById(resourceObj.category);
      }
      if (!category) {
        category = await Category.findOne({ name: resourceObj.category });
      }
      if (category) {
        resourceObj.category = {
          id: String(category._id),
          name: category.name,
          description: category.description,
        };
      } else {
        logger.warn(`Category not found: ${resourceObj.category}`);
        resourceObj.category = null;
      }
    } catch (error) {
      logger.error('Error fetching category for resource:', error);
      resourceObj.category = null;
    }
  }

  return resourceObj;
}

/** Batch-resolve categories for multiple resources (single DB round-trip). */
export async function transformResources(
  resources: IResource[],
): Promise<Record<string, unknown>[]> {
  const rawIds = [
    ...new Set(
      resources
        .map((r) => {
          const resourceObj = r.toObject ? r.toObject() : r;
          return resourceObj.category && typeof resourceObj.category === 'string'
            ? resourceObj.category
            : null;
        })
        .filter(Boolean),
    ),
  ];
  const categoryIds = rawIds.filter((id): id is string => VALID_OBJECTID.test(id));
  const nameIds = rawIds.filter((id) => !VALID_OBJECTID.test(id));

  const [categoriesById, categoriesByName] = await Promise.all([
    categoryIds.length > 0 ? Category.find({ _id: { $in: categoryIds } }) : [],
    nameIds.length > 0 ? Category.find({ name: { $in: nameIds } }) : [],
  ]);
  const categoryMap = new Map<string, { id: string; name: string; description: string }>();
  for (const cat of [...categoriesById, ...categoriesByName]) {
    const id = String(cat._id);
    categoryMap.set(id, { id, name: cat.name, description: cat.description });
  }
  for (const cat of categoriesByName) {
    categoryMap.set(cat.name, {
      id: String(cat._id),
      name: cat.name,
      description: cat.description,
    });
  }

  return resources.map((resource) => {
    const resourceObj = resource.toObject
      ? resource.toObject({ virtuals: true })
      : { ...resource };

    if (resourceObj.category && typeof resourceObj.category === 'string') {
      const categoryObj = categoryMap.get(resourceObj.category);
      if (categoryObj) {
        resourceObj.category = categoryObj;
      } else {
        logger.warn(
          `Category not found for resource ${resourceObj._id ?? resourceObj.id}: ${resourceObj.category}`,
        );
        resourceObj.category = null;
      }
    }

    return resourceObj;
  });
}

/** Build Mongo filter, sort, and pagination from the list-resources query params. */
export function buildResourceListQuery(
  query: ResourceListQuery,
  userRole: string | undefined,
): {
  filters: Record<string, unknown>;
  sort: Record<string, unknown>;
  skip: number;
  limit: number;
  page: number;
} {
  const {
    category,
    difficulty,
    targetWeeks,
    targetPregnancyWeeks,
    tags,
    search,
    author,
    isPublished,
    limit = 50,
    page = 1,
  } = query;

  type Primitive = string | number | boolean | symbol | bigint;
  const toStr = (p: Primitive): string => String(p);
  const safeStr = (v: unknown): string | undefined => {
    if (v == null) return undefined;
    if (Array.isArray(v)) {
      const first = v[0];
      if (first == null) return undefined;
      const t = typeof first;
      if (t === 'string' || t === 'number' || t === 'boolean' || t === 'symbol' || t === 'bigint') {
        return toStr(first);
      }
      return undefined;
    }
    switch (typeof v) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'symbol':
      case 'bigint':
        return toStr(v);
      default:
        return undefined;
    }
  };

  logger.debug('Resources GET params', {
    category: safeStr(category),
    difficulty: safeStr(difficulty),
    targetWeeks,
    tags,
    search,
    author,
    isPublished,
    limit,
    page,
  });

  const filters: Record<string, unknown> = {};

  if (userRole !== 'provider') {
    filters.isPublished = true;
  } else if (isPublished !== undefined) {
    filters.isPublished = isPublished === 'true';
  }

  const categoryId = safeStr(category)?.trim();
  if (categoryId) filters.category = categoryId;

  const difficultyValue = safeStr(difficulty)?.trim();
  if (
    difficultyValue &&
    ['beginner', 'intermediate', 'advanced'].includes(difficultyValue)
  ) {
    filters.difficulty = difficultyValue;
  }

  if (targetWeeks) {
    const weeks = Array.isArray(targetWeeks)
      ? targetWeeks.map((w) => Number(w))
      : [Number(targetWeeks)];
    filters.targetWeeks = { $in: weeks };
  }

  if (targetPregnancyWeeks) {
    const weeks = Array.isArray(targetPregnancyWeeks)
      ? targetPregnancyWeeks.map((w) => Number(w))
      : [Number(targetPregnancyWeeks)];
    filters.targetPregnancyWeeks = { $in: weeks };
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filters.tags = { $in: tagArray };
  }

  if (author) filters.author = author;
  if (search) {
    const sanitized = String(search).replace(/["\\\-~]/g, ' ').trim();
    if (sanitized) filters.$text = { $search: sanitized };
  }

  const sort: Record<string, unknown> =
    search ? { score: { $meta: 'textScore' }, createdAt: -1 } : { createdAt: -1 };
  const limitNum = Number(limit);
  const pageNum = Number(page);
  const skip = (pageNum - 1) * limitNum;

  return { filters, sort, skip, limit: limitNum, page: pageNum };
}

/** Delete old storage files when their URLs are being replaced on update. */
export async function deleteReplacedFiles(
  existing: { thumbnailUrl?: string; fileUrl?: string },
  body: { thumbnailUrl?: string; fileUrl?: string },
): Promise<void> {
  if (
    body.thumbnailUrl !== undefined &&
    body.thumbnailUrl !== existing.thumbnailUrl &&
    existing.thumbnailUrl
  ) {
    await deleteStorageFile(existing.thumbnailUrl);
  }
  if (
    body.fileUrl !== undefined &&
    body.fileUrl !== existing.fileUrl &&
    existing.fileUrl
  ) {
    await deleteStorageFile(existing.fileUrl);
  }
}

/** Update publishDate when the isPublished flag changes. */
export async function applyPublishStateChange(
  resource: IResource,
  existing: { isPublished?: boolean },
  body: { isPublished?: boolean },
): Promise<void> {
  if (body.isPublished === true && !existing.isPublished) {
    resource.publishDate = new Date();
    await resource.save();
  } else if (body.isPublished === false && existing.isPublished) {
    resource.publishDate = undefined;
    await resource.save();
  }
}

/** Delete all storage files (thumbnail + file) attached to a resource. Non-critical. */
export async function deleteResourceFiles(resource: IResource): Promise<void> {
  try {
    if (resource.thumbnailUrl) {
      await deleteStorageFile(resource.thumbnailUrl);
    }
    if (resource.fileUrl) {
      await deleteStorageFile(resource.fileUrl);
    }
  } catch (error) {
    logger.error('Error deleting resource files:', error);
    // Don't throw — file deletion is non-critical
  }
}

/** Format a populated changedBy field for version history responses. */
function formatChangedBy(
  cb: unknown,
): { id: string; firstName: string; lastName: string } | null {
  if (!cb || typeof cb !== 'object' || !('_id' in cb)) return null;
  const o = cb as { _id: { toString(): string }; firstName?: string; lastName?: string };
  return {
    id: o._id.toString(),
    firstName: o.firstName ?? '',
    lastName: o.lastName ?? '',
  };
}

// ── High-level service functions (called by route handlers) ──────────────────

/**
 * List resources with filtering, sorting, and pagination.
 *
 * @param query - Filter, search, and pagination parameters
 * @param userRole - Caller's role (providers see drafts too)
 * @returns Paginated, category-resolved resource list
 * @throws APIError 500 — database failure
 */
export async function listResources(
  query: ResourceListQuery,
  userRole: string | undefined,
): Promise<ResourceListResult> {
  const { filters, sort, skip, limit, page } = buildResourceListQuery(query, userRole);

  const total = await Resources.countDocuments(filters);
  const baseQuery = Resources.find(filters)
    .sort(sort as Record<string, 1 | -1 | { $meta: string }>)
    .populate('author', 'firstName lastName')
    .skip(skip)
    .limit(limit);

  const resources = filters.$text
    ? await baseQuery.select({ score: { $meta: 'textScore' } } as Record<string, number | object>)
    : await baseQuery;

  const transformedResources = await transformResources(resources);

  return {
    resources: transformedResources,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get a single resource by its ID.
 *
 * @param id - Resource ObjectId
 * @returns Category-resolved resource
 * @throws APIError 404 — resource not found
 */
export async function getResourceById(id: string): Promise<Record<string, unknown>> {
  const resource = await Resources.findById(id).populate('author', 'firstName lastName');
  if (!resource) {
    throw new APIError('Resource not found', 404);
  }
  return transformResourceCategory(resource);
}

/**
 * Create a new resource, snapshot a version, and notify clients if published.
 *
 * @param data - Resource content and metadata
 * @param user - Authenticated author
 * @returns Success message and the created resource
 * @throws APIError 401 — no authenticated user
 */
export async function createResource(
  data: CreateResourceInput,
  user: IUser,
): Promise<{ message: string; resource: Record<string, unknown> }> {
  const resourceData = {
    ...data,
    author: user._id,
    publishDate: data.isPublished ? new Date() : undefined,
  };
  const resource = new Resources(resourceData);
  await resource.save();

  await createResourceVersion(resource, user, 'Initial creation');

  if (data.isPublished) {
    await notifyClientsOfNewResource(resource, user);
  }

  await resource.populate('author', 'firstName lastName');
  const transformedResource = await transformResourceCategory(resource);

  return { message: 'Resource created', resource: transformedResource };
}

/**
 * Update an existing resource: authorize, clean up replaced files, apply
 * publish-state changes, snapshot a version, and notify clients.
 *
 * @param id - Resource ObjectId
 * @param data - Fields to update
 * @param user - Authenticated caller (must be author or admin)
 * @returns Success message and the updated resource
 * @throws APIError 404 — resource not found
 * @throws APIError 403 — not the author or admin
 */
export async function updateResource(
  id: string,
  data: UpdateResourceInput,
  user: IUser,
): Promise<{ message: string; resource: Record<string, unknown> }> {
  const existingResource = await Resources.findById(id);
  if (!existingResource) {
    throw new APIError('Resource not found', 404);
  }

  if (existingResource.author?.toString() !== user._id?.toString() && user.role !== 'admin') {
    throw new APIError('Only the author or an admin can edit this resource', 403);
  }

  await deleteReplacedFiles(existingResource, data);

  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (data[field] !== undefined) updates[field] = data[field];
  }

  const resource = await Resources.findByIdAndUpdate(id, updates, {
    new: true,
  }).populate('author', 'firstName lastName');
  if (!resource) {
    throw new APIError('Resource not found', 404);
  }

  await applyPublishStateChange(resource, existingResource, data);
  await createResourceVersion(existingResource, user, data.changeReason);

  if (data.isPublished === true && !existingResource.isPublished) {
    await notifyClientsOfNewResource(resource, user);
  }

  const transformedResource = await transformResourceCategory(resource);
  return { message: 'Resource updated', resource: transformedResource };
}

/**
 * Delete a resource: authorize, clean up files, and remove from DB.
 *
 * @param id - Resource ObjectId
 * @param user - Authenticated caller (must be author or admin)
 * @returns Success message
 * @throws APIError 404 — resource not found
 * @throws APIError 403 — not the author or admin
 */
export async function deleteResource(
  id: string,
  user: IUser,
): Promise<{ message: string }> {
  const resource = await Resources.findById(id);
  if (!resource) {
    throw new APIError('Resource not found', 404);
  }

  if (resource.author?.toString() !== user._id?.toString() && user.role !== 'admin') {
    throw new APIError('Only the author or an admin can delete this resource', 403);
  }

  await deleteResourceFiles(resource);
  await Resources.findByIdAndDelete(id);

  return { message: 'Resource deleted' };
}

/**
 * Get version history for a resource, with categories resolved.
 *
 * @param resourceId - Resource ObjectId
 * @returns All version snapshots sorted newest-first
 * @throws APIError 404 — resource not found
 */
export async function getVersionHistory(
  resourceId: string,
): Promise<{ versions: Record<string, unknown>[] }> {
  const resource = await Resources.findById(resourceId);
  if (!resource) {
    throw new APIError('Resource not found', 404);
  }

  const versions = await ResourceVersion.find({ resourceId })
    .sort({ versionNumber: -1 })
    .populate('changedBy', 'firstName lastName')
    .lean();

  const categoryIds = [...new Set(versions.map((v) => v.category).filter(Boolean))];
  const categories = await Category.find({ _id: { $in: categoryIds } }).lean();
  const categoryMap = new Map(categories.map((c) => [c._id.toString(), c]));

  const transformedVersions = versions.map((v) => {
    const categoryId = v.category?.toString() ?? v.category;
    const category = categoryMap.get(categoryId);

    return {
      id: v._id.toString(),
      versionNumber: v.versionNumber,
      title: v.title,
      description: v.description,
      content: v.content,
      category: category
        ? {
            id: category._id.toString(),
            name: category.name,
            description: category.description,
          }
        : null,
      tags: v.tags ?? [],
      targetWeeks: v.targetWeeks ?? [],
      targetPregnancyWeeks: v.targetPregnancyWeeks ?? [],
      difficulty: v.difficulty,
      fileUrl: v.fileUrl,
      thumbnailUrl: v.thumbnailUrl,
      isPublished: v.isPublished,
      changedBy: formatChangedBy(v.changedBy),
      changeReason: v.changeReason,
      createdAt: v.createdAt,
    };
  });

  return { versions: transformedVersions };
}

/**
 * Restore a resource to a previous version snapshot.
 *
 * @param resourceId - Resource ObjectId
 * @param versionId - Version snapshot ObjectId to restore
 * @param user - Authenticated caller
 * @returns Success message and the restored resource
 * @throws APIError 404 — resource or version not found
 * @throws APIError 401 — no authenticated user
 */
export async function restoreVersion(
  resourceId: string,
  versionId: string,
  user: IUser,
): Promise<{ message: string; resource: Record<string, unknown> }> {
  const resource = await Resources.findById(resourceId);
  if (!resource) {
    throw new APIError('Resource not found', 404);
  }

  const version = await ResourceVersion.findById(versionId);
  if (!version || version.resourceId.toString() !== resourceId) {
    throw new APIError('Version not found', 404);
  }

  resource.title = version.title;
  resource.description = version.description;
  resource.content = version.content;
  resource.category = version.category;
  resource.tags = version.tags ?? [];
  resource.targetWeeks = version.targetWeeks ?? [];
  resource.targetPregnancyWeeks = version.targetPregnancyWeeks ?? [];
  resource.difficulty = version.difficulty;
  resource.fileUrl = version.fileUrl;
  resource.thumbnailUrl = version.thumbnailUrl;
  resource.isPublished = version.isPublished;

  await resource.save();

  await createResourceVersion(resource, user, `Restored to version ${version.versionNumber}`);

  await resource.populate('author', 'firstName lastName');
  const transformedResource = await transformResourceCategory(resource);

  return { message: 'Resource restored', resource: transformedResource };
}
