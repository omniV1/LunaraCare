/**
 * BlogService unit tests. ApiClient is mocked so all tests run without a real backend.
 */
import type { ApiClient as _ApiClient } from '../../api/apiClient';

const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
} as unknown as jest.Mocked<_ApiClient>;

jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => mockApiClient,
  },
}));

import {
  blogService,
  type BlogPost,
  type CreateBlogPostData,
  type UpdateBlogPostData,
} from '../../services/blogService';

describe('BlogService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBlogPosts', () => {
    it('should fetch blog posts without filters', async () => {
      const mockResponse = {
        posts: [{ id: '1', title: 'Test Post' }],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await blogService.getBlogPosts();

      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringMatching(/^\/blog(\?|$)/));
      expect(result).toEqual(mockResponse);
    });

    it('should fetch blog posts with all filters', async () => {
      const mockResponse = {
        posts: [],
        pagination: { page: 2, limit: 5, total: 10, pages: 2 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const filters = {
        category: 'wellness',
        tag: 'mental-health',
        search: 'anxiety',
        limit: 5,
        page: 2,
      };

      const result = await blogService.getBlogPosts(filters);

      const url = mockApiClient.get.mock.calls[0][0];
      expect(url).toMatch(/^\/blog\?/);
      expect(url).toContain('category=wellness');
      expect(url).toContain('tag=mental-health');
      expect(url).toContain('search=anxiety');
      expect(url).toContain('limit=5');
      expect(url).toContain('page=2');
      expect(result).toEqual(mockResponse);
    });

    it('should fetch blog posts with partial filters', async () => {
      const mockResponse = {
        posts: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      await blogService.getBlogPosts({ search: 'test', limit: 20 });

      const url = mockApiClient.get.mock.calls[0][0];
      expect(url).toMatch(/^\/blog\?/);
      expect(url).toContain('search=test');
      expect(url).toContain('limit=20');
    });
  });

  describe('getBlogPost', () => {
    it('should fetch a single blog post by slug', async () => {
      const mockPost: BlogPost = {
        id: '1',
        title: 'Test Post',
        slug: 'test-post',
        excerpt: 'Test excerpt',
        content: 'Test content',
        author: { id: '1', firstName: 'John', lastName: 'Doe' },
        tags: ['test'],
        category: 'wellness',
        isPublished: true,
        viewCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockApiClient.get.mockResolvedValue(mockPost);

      const result = await blogService.getBlogPost('test-post');

      expect(mockApiClient.get).toHaveBeenCalledWith('/blog/test-post');
      expect(result).toEqual(mockPost);
    });
  });

  describe('createBlogPost', () => {
    it('should create a new blog post', async () => {
      const createData: CreateBlogPostData = {
        title: 'New Post',
        excerpt: 'New excerpt',
        content: 'New content',
        category: 'wellness',
        tags: ['new', 'test'],
        isPublished: false,
      };
      const mockResponse: BlogPost = {
        id: '2',
        ...createData,
        slug: 'new-post',
        author: { id: '1', firstName: 'John', lastName: 'Doe' },
        tags: createData.tags!,
        isPublished: false,
        viewCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await blogService.createBlogPost(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/blog', createData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateBlogPost', () => {
    it('should update an existing blog post', async () => {
      const updateData: UpdateBlogPostData = {
        id: '1',
        title: 'Updated Post',
        isPublished: true,
      };
      const mockResponse: BlogPost = {
        id: '1',
        title: 'Updated Post',
        slug: 'updated-post',
        excerpt: 'Test excerpt',
        content: 'Test content',
        author: { id: '1', firstName: 'John', lastName: 'Doe' },
        tags: ['test'],
        category: 'wellness',
        isPublished: true,
        viewCount: 0,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };
      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await blogService.updateBlogPost(updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/blog/1', {
        title: 'Updated Post',
        isPublished: true,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteBlogPost', () => {
    it('should delete a blog post by id', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await blogService.deleteBlogPost('1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/blog/1');
    });
  });

  describe('getDrafts', () => {
    it('should fetch draft blog posts', async () => {
      const mockDrafts: BlogPost[] = [
        {
          id: '1',
          title: 'Draft Post',
          slug: 'draft-post',
          excerpt: 'Draft excerpt',
          content: 'Draft content',
          author: { id: '1', firstName: 'John', lastName: 'Doe' },
          tags: ['draft'],
          category: 'wellness',
          isPublished: false,
          viewCount: 0,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        },
      ];
      mockApiClient.get.mockResolvedValue(mockDrafts);

      const result = await blogService.getDrafts();

      expect(mockApiClient.get).toHaveBeenCalledWith('/blog/drafts');
      expect(result).toEqual(mockDrafts);
    });
  });

  describe('getAllBlogPosts', () => {
    it('should fetch all blog posts', async () => {
      const mockResponse = {
        posts: [],
        pagination: { page: 1, limit: 100, total: 0, pages: 0 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await blogService.getAllBlogPosts();

      expect(mockApiClient.get).toHaveBeenCalledWith('/blog/all');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from title', () => {
      expect(blogService.generateSlug('Hello World')).toBe('hello-world');
      expect(blogService.generateSlug('This is a Test!')).toBe('this-is-a-test');
      expect(blogService.generateSlug('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should handle special characters', () => {
      expect(blogService.generateSlug('Test@#$%Post')).toBe('test-post');
      expect(blogService.generateSlug('Hello & Goodbye')).toBe('hello-goodbye');
    });

    it('should remove leading and trailing dashes', () => {
      expect(blogService.generateSlug('-Leading Dash')).toBe('leading-dash');
      expect(blogService.generateSlug('Trailing Dash-')).toBe('trailing-dash');
      expect(blogService.generateSlug('---Multiple---')).toBe('multiple');
    });

    it('should handle empty strings', () => {
      expect(blogService.generateSlug('')).toBe('');
      expect(blogService.generateSlug('   ')).toBe('');
    });
  });

  describe('estimateReadingTime', () => {
    it('should estimate reading time correctly', () => {
      const shortContent = 'This is a short test.'; // ~5 words
      expect(blogService.estimateReadingTime(shortContent)).toBe(1);

      const mediumContent = Array(200).fill('word').join(' '); // 200 words
      expect(blogService.estimateReadingTime(mediumContent)).toBe(1);

      const longContent = Array(500).fill('word').join(' '); // 500 words
      expect(blogService.estimateReadingTime(longContent)).toBe(3);
    });

    it('should return minimum 1 minute', () => {
      expect(blogService.estimateReadingTime('')).toBe(1);
      expect(blogService.estimateReadingTime('Short')).toBe(1);
    });

    it('should round up reading time', () => {
      const content = Array(250).fill('word').join(' '); // 250 words
      expect(blogService.estimateReadingTime(content)).toBe(2); // 250/200 = 1.25, rounds to 2
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = blogService.formatDate(dateString);

      // The format should be MM/DD/YYYY
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('should handle different date formats', () => {
      expect(blogService.formatDate('2024-12-25')).toBeTruthy();
      expect(blogService.formatDate('2024-06-15T00:00:00.000Z')).toBeTruthy();
    });
  });

  describe('truncateText', () => {
    it('should not truncate text shorter than limit', () => {
      const text = 'This is a short text';
      expect(blogService.truncateText(text, 30)).toBe(text);
    });

    it('should truncate text longer than limit', () => {
      const text = Array(50).fill('word').join(' '); // 50 words
      const result = blogService.truncateText(text, 30);

      expect(result).toContain('...');
      const words = result.split(' ').filter(w => w.length > 0);
      expect(words.length).toBe(30); // 30 words, last one has '...' appended
      expect(result).toMatch(/word\.\.\.$/);
    });

    it('should use default word limit of 30', () => {
      const text = Array(50).fill('word').join(' ');
      const result = blogService.truncateText(text);

      expect(result).toContain('...');
    });

    it('should handle edge cases', () => {
      expect(blogService.truncateText('', 10)).toBe('');
      expect(blogService.truncateText('word', 1)).toBe('word');
    });
  });
});
