/**
 * @module services/blogService
 * Blog post CRUD, versioning, and client notification logic.
 * Supports drafts, full-text search, version history with rollback,
 * and real-time Socket.io notifications when a provider publishes content.
 */

import mongoose from 'mongoose';
import type { Server } from 'socket.io';
import BlogPost, { IBlogPost } from '../models/BlogPost';
import BlogPostVersion from '../models/BlogPostVersion';
import Client from '../models/Client';
import Message from '../models/Message';
import User, { IUser } from '../models/User';
import logger from '../utils/logger';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../utils/errors';

// ── Socket.io access ─────────────────────────────────────────────────────────

const getIO = () => (globalThis as unknown as { io?: Server }).io;

// ── Input / Result types ─────────────────────────────────────────────────────

/** Query parameters for filtering and paginating published posts. */
export interface BlogListQuery {
  category?: string;
  tag?: string;
  search?: string;
  author?: string;
  limit?: string | number;
  page?: string | number;
}

/** Paginated list of blog posts with metadata. */
export interface BlogListResult {
  posts: IBlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** Fields for creating a new blog post. */
export interface CreateBlogPostInput {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  featuredImage?: string;
  isPublished?: boolean;
}

/** Mutable fields when updating a blog post (all optional). */
export interface UpdateBlogPostInput {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  featuredImage?: string | null;
  isPublished?: boolean;
  changeReason?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Check whether a user can modify a specific post. */
export function canEditPost(user: IUser, post: IBlogPost): boolean {
  return post.author.toString() === user._id?.toString() || user.role === 'provider';
}

/** Create a version snapshot of a blog post. Non-critical -- errors are logged. */
async function createBlogPostVersion(
  blogPost: IBlogPost,
  changedBy: IUser,
  changeReason?: string,
): Promise<void> {
  try {
    const latestVersion = await BlogPostVersion.findOne({ blogPostId: blogPost._id })
      .sort({ versionNumber: -1 })
      .limit(1);

    const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    const version = new BlogPostVersion({
      blogPostId: blogPost._id,
      versionNumber: nextVersionNumber,
      title: blogPost.title,
      slug: blogPost.slug,
      excerpt: blogPost.excerpt,
      content: blogPost.content,
      featuredImage: blogPost.featuredImage,
      tags: blogPost.tags ?? [],
      category: blogPost.category,
      isPublished: blogPost.isPublished,
      changedBy: changedBy._id,
      changeReason,
    });

    await version.save();
    logger.debug(`Created version ${nextVersionNumber} for blog post ${blogPost._id}`);
  } catch (error) {
    logger.error('Error creating blog post version:', error);
    // Don't throw -- versioning is non-critical
  }
}

/** Notify all clients of a provider when a blog post is published. Non-critical. */
async function notifyClientsOfNewBlogPost(
  blogPost: IBlogPost,
  provider: IUser,
): Promise<void> {
  try {
    const providerIdValue = provider.id ?? provider._id;
    const clients = await Client.find({ assignedProvider: providerIdValue }).populate(
      'userId',
      'firstName lastName email',
    );

    if (!clients || clients.length === 0) return;

    const providerUser = await User.findById(providerIdValue);
    const io = getIO();

    for (const client of clients) {
      const clientUser = client.userId as unknown as {
        _id: mongoose.Types.ObjectId;
        firstName?: string;
        lastName?: string;
      } | undefined;
      if (!clientUser) continue;

      if (client.assignedProvider?.toString() !== providerIdValue.toString()) continue;

      const notificationMessage = new Message({
        conversationId: new mongoose.Types.ObjectId(),
        sender: providerIdValue,
        receiver: clientUser._id,
        content: `${providerUser?.firstName ?? 'Your provider'} has published a new blog post: "${blogPost.title}". Check it out!`,
        type: 'system',
        read: false,
      });

      await notificationMessage.save();

      if (io) {
        io.to(clientUser._id.toString()).emit('blog_post_published', {
          blogPostId: String(blogPost._id),
          blogPostTitle: blogPost.title,
          blogPostSlug: blogPost.slug,
          provider: providerUser?.firstName ?? 'Your provider',
          message: notificationMessage.content,
        });
      }
    }
  } catch (error) {
    logger.error('Error notifying clients of new blog post:', error);
  }
}

/** Apply update fields to a blog post document. */
function applyBlogUpdates(
  blogPost: IBlogPost,
  body: UpdateBlogPostInput,
): void {
  const { title, excerpt, content, category, tags, featuredImage, isPublished } = body;
  if (title) blogPost.title = title;
  if (excerpt) blogPost.excerpt = excerpt;
  if (content) blogPost.content = content;
  if (category) blogPost.category = category;
  if (tags) blogPost.tags = tags;
  if (featuredImage !== undefined) blogPost.featuredImage = featuredImage ?? undefined;
  if (isPublished !== undefined) {
    blogPost.isPublished = isPublished;
    if (isPublished && !blogPost.publishDate) {
      blogPost.publishDate = new Date();
    }
  }
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * List published blog posts with filtering, sorting, and pagination.
 *
 * @param query - Filter, search, and pagination parameters
 * @returns Paginated post list with total counts
 */
export async function listPublishedPosts(query: BlogListQuery): Promise<BlogListResult> {
  const { category, tag, search, author, limit = 10, page = 1 } = query;
  const skip = (Number(page) - 1) * Number(limit);

  const filters: Record<string, unknown> = { isPublished: true };
  if (category) filters.category = category;
  if (tag) filters.tags = { $in: [tag] };
  if (author) filters.author = author;
  if (search) {
    const sanitized = String(search).replace(/["\\\-~]/g, ' ').trim();
    if (sanitized) filters.$text = { $search: sanitized };
  }

  let sort: Record<string, 1 | -1 | { $meta: string }> = { publishDate: -1, createdAt: -1 };
  if (search) {
    sort = { score: { $meta: 'textScore' }, publishDate: -1, createdAt: -1 };
  }

  const total = await BlogPost.countDocuments(filters);

  let dbQuery = BlogPost.find(filters)
    .sort(sort)
    .populate('author', 'firstName lastName')
    .skip(skip)
    .limit(Number(limit));

  if (search) {
    dbQuery = dbQuery.select({ score: { $meta: 'textScore' } }) as typeof dbQuery;
  }

  const posts = await dbQuery;

  return {
    posts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  };
}

/**
 * List all blog posts (published and drafts) belonging to a provider.
 *
 * @param authorId - Provider's ObjectId
 * @param limit - Maximum posts to return
 * @returns Posts sorted by creation date descending
 */
export async function listAllPostsByAuthor(
  authorId: mongoose.Types.ObjectId,
  limit: number,
): Promise<IBlogPost[]> {
  const posts = await BlogPost.find({ author: authorId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('author', 'firstName lastName');

  return posts;
}

/**
 * Get a published blog post by slug and increment its view count.
 *
 * @param slug - URL-friendly post identifier
 * @returns The blog post document
 * @throws NotFoundError -- post not found
 */
export async function getPostBySlug(slug: string): Promise<IBlogPost> {
  const post = await BlogPost.findBySlug(slug);
  if (!post) {
    throw new NotFoundError('Blog post not found');
  }

  await BlogPost.incrementViewCount(post.id);
  return post;
}

/**
 * Create a new blog post, snapshot a version, and notify clients if published.
 *
 * @param data - Blog post content and metadata
 * @param user - Authenticated author
 * @returns The created blog post
 * @throws BadRequestError -- missing required fields
 * @throws ConflictError -- slug already exists
 */
export async function createBlogPost(
  data: CreateBlogPostInput,
  user: IUser,
): Promise<IBlogPost> {
  const { title, excerpt, content, category, tags = [], featuredImage, isPublished = false } = data;

  if (!title || !excerpt || !content || !category) {
    throw new BadRequestError('Title, excerpt, content, and category are required');
  }

  const slug = title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/(^-|-$)/g, '');

  const existingPost = await BlogPost.findOne({ slug });
  if (existingPost) {
    throw new ConflictError('A blog post with this title already exists');
  }

  const blogPost = new BlogPost({
    title,
    slug,
    excerpt,
    content,
    category,
    tags,
    featuredImage,
    author: user._id,
    isPublished,
    publishDate: isPublished ? new Date() : undefined,
  });

  await blogPost.save();

  await createBlogPostVersion(blogPost, user, 'Initial creation');

  if (isPublished) {
    await notifyClientsOfNewBlogPost(blogPost, user);
  }

  await blogPost.populate('author', 'firstName lastName');
  return blogPost;
}

/**
 * Update an existing blog post.
 *
 * @param id - Blog post ObjectId
 * @param data - Fields to update
 * @param user - Authenticated caller (must be author or provider)
 * @returns The updated blog post
 * @throws NotFoundError -- post not found
 * @throws ForbiddenError -- not the author or provider
 */
export async function updateBlogPost(
  id: string,
  data: UpdateBlogPostInput,
  user: IUser,
): Promise<IBlogPost> {
  const blogPost = await BlogPost.findById(id);
  if (!blogPost) {
    throw new NotFoundError('Blog post not found');
  }

  if (!canEditPost(user, blogPost)) {
    throw new ForbiddenError('You can only edit your own blog posts');
  }

  const wasPublished = blogPost.isPublished;

  await createBlogPostVersion(blogPost, user, data.changeReason);

  applyBlogUpdates(blogPost, data);

  await blogPost.save();

  if (data.isPublished === true && !wasPublished) {
    await notifyClientsOfNewBlogPost(blogPost, user);
  }

  await blogPost.populate('author', 'firstName lastName');
  return blogPost;
}

/**
 * Delete a blog post.
 *
 * @param id - Blog post ObjectId
 * @param user - Authenticated caller (must be author or provider)
 * @throws NotFoundError -- post not found
 * @throws ForbiddenError -- not the author or provider
 */
export async function deleteBlogPost(
  id: string,
  user: IUser,
): Promise<void> {
  const blogPost = await BlogPost.findById(id);
  if (!blogPost) {
    throw new NotFoundError('Blog post not found');
  }

  if (!canEditPost(user, blogPost)) {
    throw new ForbiddenError('You can only delete your own blog posts');
  }

  await BlogPost.findByIdAndDelete(id);
}

/**
 * Get draft blog posts for a provider.
 *
 * @param authorId - Provider's ObjectId
 * @returns Unpublished posts sorted by last saved date
 */
export async function getDraftPosts(authorId: mongoose.Types.ObjectId): Promise<IBlogPost[]> {
  const drafts = await BlogPost.find({
    author: authorId,
    isPublished: false,
  })
    .sort({ lastSaved: -1 })
    .populate('author', 'firstName lastName');

  return drafts;
}

/**
 * Get version history for a blog post.
 *
 * @param id - Blog post ObjectId
 * @param user - Authenticated caller
 * @returns All version snapshots sorted newest-first
 * @throws NotFoundError -- post not found
 * @throws ForbiddenError -- not the author or provider
 */
export async function getVersionHistory(
  id: string,
  user: IUser,
): Promise<{ versions: InstanceType<typeof BlogPostVersion>[] }> {
  const blogPost = await BlogPost.findById(id);
  if (!blogPost) {
    throw new NotFoundError('Blog post not found');
  }

  if (!canEditPost(user, blogPost)) {
    throw new ForbiddenError('You can only view versions of your own blog posts');
  }

  const versions = await BlogPostVersion.find({ blogPostId: id })
    .sort({ versionNumber: -1 })
    .populate('changedBy', 'firstName lastName');

  return { versions };
}

/**
 * Get a specific version of a blog post.
 *
 * @param id - Blog post ObjectId
 * @param versionId - Version snapshot ObjectId
 * @param user - Authenticated caller
 * @returns The requested version snapshot
 * @throws NotFoundError -- post or version not found
 * @throws ForbiddenError -- not the author or provider
 */
export async function getVersion(
  id: string,
  versionId: string,
  user: IUser,
): Promise<InstanceType<typeof BlogPostVersion>> {
  const blogPost = await BlogPost.findById(id);
  if (!blogPost) {
    throw new NotFoundError('Blog post not found');
  }

  if (!canEditPost(user, blogPost)) {
    throw new ForbiddenError('You can only view versions of your own blog posts');
  }

  const version = await BlogPostVersion.findOne({ _id: versionId, blogPostId: id })
    .populate('changedBy', 'firstName lastName');

  if (!version) {
    throw new NotFoundError('Version not found');
  }

  return version;
}

/**
 * Restore a blog post to a previous version.
 *
 * @param id - Blog post ObjectId
 * @param versionId - Version snapshot to restore
 * @param user - Authenticated caller
 * @returns The restored blog post
 * @throws NotFoundError -- post or version not found
 * @throws ForbiddenError -- not the author or provider
 */
export async function restoreVersion(
  id: string,
  versionId: string,
  user: IUser,
): Promise<IBlogPost> {
  const blogPost = await BlogPost.findById(id);
  if (!blogPost) {
    throw new NotFoundError('Blog post not found');
  }

  if (!canEditPost(user, blogPost)) {
    throw new ForbiddenError('You can only restore your own blog posts');
  }

  const version = await BlogPostVersion.findOne({ _id: versionId, blogPostId: id });
  if (!version) {
    throw new NotFoundError('Version not found');
  }

  // Snapshot current state before restoring
  await createBlogPostVersion(blogPost, user, `Snapshot before restoring to version ${version.versionNumber}`);

  // Apply the old version's data
  blogPost.title = version.title;
  blogPost.slug = version.slug;
  blogPost.excerpt = version.excerpt;
  blogPost.content = version.content;
  blogPost.featuredImage = version.featuredImage;
  blogPost.tags = version.tags;
  blogPost.category = version.category;
  blogPost.isPublished = version.isPublished;

  await blogPost.save();

  // Create a version snapshot of the restored state
  await createBlogPostVersion(blogPost, user, `Restored to version ${version.versionNumber}`);

  await blogPost.populate('author', 'firstName lastName');
  return blogPost;
}
