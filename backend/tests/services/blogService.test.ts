import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../src/models/BlogPost', () => {
  const MockBP = jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    populate: jest.fn().mockReturnThis(),
  }));
  (MockBP as unknown as Record<string, unknown>).find = jest.fn();
  (MockBP as unknown as Record<string, unknown>).findById = jest.fn();
  (MockBP as unknown as Record<string, unknown>).findOne = jest.fn();
  (MockBP as unknown as Record<string, unknown>).findByIdAndDelete = jest.fn();
  (MockBP as unknown as Record<string, unknown>).findBySlug = jest.fn();
  (MockBP as unknown as Record<string, unknown>).incrementViewCount = jest.fn();
  (MockBP as unknown as Record<string, unknown>).countDocuments = jest.fn();
  return { __esModule: true, default: MockBP };
});

jest.mock('../../src/models/BlogPostVersion', () => {
  const MockBPV = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
  }));
  (MockBPV as unknown as Record<string, unknown>).findOne = jest.fn();
  (MockBPV as unknown as Record<string, unknown>).find = jest.fn();
  return { __esModule: true, default: MockBPV };
});

jest.mock('../../src/models/Client', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));

jest.mock('../../src/models/Message', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
  })),
}));

jest.mock('../../src/models/User', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import BlogPost, { IBlogPost } from '../../src/models/BlogPost';
import BlogPostVersion from '../../src/models/BlogPostVersion';
import type { IUser } from '../../src/models/User';
import {
  canEditPost,
  listPublishedPosts,
  getPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getDraftPosts,
  getVersionHistory,
  getVersion,
  restoreVersion,
} from '../../src/services/blogService';
import { NotFoundError, ForbiddenError, BadRequestError, ConflictError } from '../../src/utils/errors';

// ── Helpers ──────────────────────────────────────────────────────────────────

const oid = () => new mongoose.Types.ObjectId();

function fakePost(overrides: Record<string, unknown> = {}): IBlogPost {
  const authorId = oid();
  const _id = oid();
  return {
    _id,
    id: _id.toString(),
    title: 'Test Post',
    slug: 'test-post',
    excerpt: 'An excerpt',
    content: 'Full content',
    category: 'wellness',
    tags: ['prenatal'],
    author: authorId,
    isPublished: true,
    publishDate: new Date(),
    featuredImage: undefined,
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    populate: jest.fn().mockReturnThis(),
    ...overrides,
  } as unknown as IBlogPost;
}

function fakeUser(overrides: Partial<Pick<IUser, '_id' | 'role' | 'firstName' | 'lastName'>> = {}): IUser {
  return {
    _id: oid(),
    role: 'provider',
    firstName: 'Jane',
    lastName: 'Doe',
    ...overrides,
  } as unknown as IUser;
}

/** Version query mock: .findOne().sort().limit() → resolves */
function mockVersionQuery(result: unknown) {
  (BlogPostVersion as unknown as Record<string, jest.Mock>).findOne = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockImplementation(() => Promise.resolve(result)),
    }),
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('blogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── canEditPost ─────────────────────────────────────────────────────────

  describe('canEditPost', () => {
    it('returns true when user is the author', () => {
      const authorId = oid();
      const user = fakeUser({ _id: authorId });
      const post = fakePost({ author: authorId });
      expect(canEditPost(user, post)).toBe(true);
    });

    it('returns true when user is a provider (any provider can edit)', () => {
      const user = fakeUser({ role: 'provider' });
      const post = fakePost({ author: oid() });
      expect(canEditPost(user, post)).toBe(true);
    });

    it('returns false when user is a client and not the author', () => {
      const user = fakeUser({ role: 'client' });
      const post = fakePost({ author: oid() });
      expect(canEditPost(user, post)).toBe(false);
    });
  });

  // ── getPostBySlug ───────────────────────────────────────────────────────

  describe('getPostBySlug', () => {
    it('throws NotFoundError when slug not found', async () => {
      (BlogPost.findBySlug as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(getPostBySlug('nonexistent-slug')).rejects.toThrow(NotFoundError);
    });

    it('returns post and increments view count', async () => {
      const post = fakePost();
      (BlogPost.findBySlug as jest.Mock).mockImplementation(() => Promise.resolve(post));
      (BlogPost.incrementViewCount as jest.Mock).mockImplementation(() => Promise.resolve(undefined));

      const result = await getPostBySlug('test-post');
      expect(result).toBe(post);
      expect(BlogPost.incrementViewCount).toHaveBeenCalledWith(post.id);
    });
  });

  // ── listPublishedPosts ──────────────────────────────────────────────────

  describe('listPublishedPosts', () => {
    it('returns paginated published posts', async () => {
      const posts = [fakePost(), fakePost()];
      (BlogPost.countDocuments as jest.Mock).mockImplementation(() => Promise.resolve(2));
      (BlogPost.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockImplementation(() => Promise.resolve(posts)),
            }),
          }),
        }),
      });

      const result = await listPublishedPosts({ limit: '10', page: '1' });
      expect(result.posts).toEqual(posts);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.pages).toBe(1);
    });
  });

  // ── createBlogPost ──────────────────────────────────────────────────────

  describe('createBlogPost', () => {
    it('throws BadRequestError when required fields are missing', async () => {
      const user = fakeUser();
      await expect(
        createBlogPost({ title: '', excerpt: '', content: '', category: '' }, user),
      ).rejects.toThrow(BadRequestError);
    });

    it('throws ConflictError when slug already exists', async () => {
      (BlogPost.findOne as jest.Mock).mockImplementation(() => Promise.resolve({ slug: 'existing' }));

      const user = fakeUser();
      await expect(
        createBlogPost({ title: 'Existing', excerpt: 'ex', content: 'con', category: 'cat' }, user),
      ).rejects.toThrow(ConflictError);
    });

    it('creates blog post successfully', async () => {
      (BlogPost.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));
      mockVersionQuery(null);

      const mockSave = jest.fn().mockImplementation(() => Promise.resolve(undefined));
      (BlogPost as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
        populate: jest.fn().mockReturnThis(),
        _id: oid(),
        title: 'New Post',
        tags: [],
      }));

      const user = fakeUser();
      await createBlogPost({ title: 'New Post', excerpt: 'ex', content: 'con', category: 'cat' }, user);
      expect(mockSave).toHaveBeenCalled();
    });
  });

  // ── updateBlogPost ──────────────────────────────────────────────────────

  describe('updateBlogPost', () => {
    it('throws NotFoundError when post not found', async () => {
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(updateBlogPost('badId', { title: 'Up' }, fakeUser())).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when non-author/non-provider tries to edit', async () => {
      const post = fakePost({ author: oid() });
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(post));

      const clientUser = fakeUser({ role: 'client', _id: oid() });
      await expect(updateBlogPost('id', { title: 'Up' }, clientUser)).rejects.toThrow(ForbiddenError);
    });

    it('updates successfully when user is the author', async () => {
      const authorId = oid();
      const post = fakePost({ author: authorId, isPublished: false });
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(post));
      mockVersionQuery(null);

      const user = fakeUser({ _id: authorId });
      await updateBlogPost('id', { title: 'Updated Title' }, user);
      expect(post.title).toBe('Updated Title');
      expect(post.save).toHaveBeenCalled();
    });
  });

  // ── deleteBlogPost ──────────────────────────────────────────────────────

  describe('deleteBlogPost', () => {
    it('throws NotFoundError when post not found', async () => {
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(deleteBlogPost('badId', fakeUser())).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError for non-author/non-provider', async () => {
      const post = fakePost({ author: oid() });
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(post));

      const clientUser = fakeUser({ role: 'client', _id: oid() });
      await expect(deleteBlogPost('id', clientUser)).rejects.toThrow(ForbiddenError);
    });

    it('deletes when user is the author', async () => {
      const authorId = oid();
      const post = fakePost({ author: authorId });
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(post));
      (BlogPost.findByIdAndDelete as jest.Mock).mockImplementation(() => Promise.resolve(undefined));

      await deleteBlogPost('id', fakeUser({ _id: authorId }));
      expect(BlogPost.findByIdAndDelete).toHaveBeenCalledWith('id');
    });
  });

  // ── getDraftPosts ───────────────────────────────────────────────────────

  describe('getDraftPosts', () => {
    it('returns unpublished posts for the author', async () => {
      const authorId = oid();
      const drafts = [fakePost({ isPublished: false })];
      (BlogPost.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockImplementation(() => Promise.resolve(drafts)),
        }),
      });

      const result = await getDraftPosts(authorId);
      expect(result).toEqual(drafts);
      expect(BlogPost.find).toHaveBeenCalledWith({ author: authorId, isPublished: false });
    });
  });

  // ── getVersionHistory ───────────────────────────────────────────────────

  describe('getVersionHistory', () => {
    it('throws NotFoundError when post not found', async () => {
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(getVersionHistory('badId', fakeUser())).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user cannot edit the post', async () => {
      const post = fakePost({ author: oid() });
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(post));

      const clientUser = fakeUser({ role: 'client', _id: oid() });
      await expect(getVersionHistory('id', clientUser)).rejects.toThrow(ForbiddenError);
    });
  });

  // ── getVersion ──────────────────────────────────────────────────────────

  describe('getVersion', () => {
    it('throws NotFoundError when post not found', async () => {
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(getVersion('badId', 'vId', fakeUser())).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when version not found', async () => {
      const authorId = oid();
      const post = fakePost({ author: authorId });
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(post));
      (BlogPostVersion as unknown as Record<string, jest.Mock>).findOne = jest.fn().mockReturnValue({
        populate: jest.fn().mockImplementation(() => Promise.resolve(null)),
      });

      await expect(getVersion('id', 'badVersion', fakeUser({ _id: authorId }))).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  // ── restoreVersion ──────────────────────────────────────────────────────

  describe('restoreVersion', () => {
    it('throws NotFoundError when post not found', async () => {
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(restoreVersion('badId', 'vId', fakeUser())).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when user cannot edit', async () => {
      const post = fakePost({ author: oid() });
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(post));

      const clientUser = fakeUser({ role: 'client', _id: oid() });
      await expect(restoreVersion('id', 'vId', clientUser)).rejects.toThrow(ForbiddenError);
    });

    it('throws NotFoundError when version not found', async () => {
      const authorId = oid();
      const post = fakePost({ author: authorId });
      (BlogPost.findById as jest.Mock).mockImplementation(() => Promise.resolve(post));
      (BlogPostVersion as unknown as Record<string, jest.Mock>).findOne = jest
        .fn()
        .mockImplementation(() => Promise.resolve(null));

      await expect(
        restoreVersion('id', 'badVersion', fakeUser({ _id: authorId })),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
