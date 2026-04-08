/**
 * @module blogService
 * Service for blog post CRUD operations, draft management, and helper
 * utilities (slug generation, reading time, date formatting).
 */

import { ApiClient } from '../api/apiClient';

/** Represents a published or draft blog post. */
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  featuredImage?: string;
  tags: string[];
  category: string;
  isPublished: boolean;
  publishDate?: string;
  lastSaved?: string;
  readTime?: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new blog post. */
export interface CreateBlogPostData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  featuredImage?: string;
  isPublished?: boolean;
}

/** Payload for updating an existing blog post. */
export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
  publishDate?: Date;
}

/** Query filters for listing blog posts. */
export interface BlogPostFilters {
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  limit?: number;
  page?: number;
}

/** Paginated blog post list response. */
export interface BlogPostResponse {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** Encapsulates blog post API interactions and formatting helpers. */
class BlogService {
  private readonly baseUrl = '/blog';
  private readonly apiClient = ApiClient.getInstance();

  /**
   * Lists blog posts matching the given filters.
   * @param filters - Optional category, tag, search, and pagination filters.
   * @returns Paginated blog post response.
   */
  async getBlogPosts(filters: BlogPostFilters = {}): Promise<BlogPostResponse> {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.tag) params.append('tag', filters.tag);
    if (filters.search) params.append('search', filters.search);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.page) params.append('page', filters.page.toString());

    const response = await this.apiClient.get<BlogPostResponse>(
      `${this.baseUrl}?${params.toString()}`
    );
    return response as unknown as BlogPostResponse;
  }

  /**
   * Fetches a single blog post by its URL slug.
   * @param slug - URL-friendly post identifier.
   * @returns The matching {@link BlogPost}.
   */
  async getBlogPost(slug: string): Promise<BlogPost> {
    const response = await this.apiClient.get<BlogPost>(`${this.baseUrl}/${slug}`);
    return response as unknown as BlogPost;
  }

  /**
   * Creates a new blog post.
   * @param data - Post creation payload.
   * @returns The newly created {@link BlogPost}.
   */
  async createBlogPost(data: CreateBlogPostData): Promise<BlogPost> {
    const response = await this.apiClient.post<BlogPost>(this.baseUrl, data);
    return response as unknown as BlogPost;
  }

  /**
   * Updates an existing blog post.
   * @param data - Update payload including the post `id`.
   * @returns The updated {@link BlogPost}.
   */
  async updateBlogPost(data: UpdateBlogPostData): Promise<BlogPost> {
    const { id, ...updateData } = data;
    const response = await this.apiClient.put<BlogPost>(`${this.baseUrl}/${id}`, updateData);
    return response as unknown as BlogPost;
  }

  /**
   * Deletes a blog post by ID.
   * @param id - Blog post identifier.
   */
  async deleteBlogPost(id: string): Promise<void> {
    await this.apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Fetches all draft (unpublished) blog posts.
   * @returns Array of draft {@link BlogPost} objects.
   */
  async getDrafts(): Promise<BlogPost[]> {
    const response = await this.apiClient.get<BlogPost[]>(`${this.baseUrl}/drafts`);
    return response as unknown as BlogPost[];
  }

  /**
   * Fetches all blog posts (published and drafts) for admin views.
   * @returns Paginated blog post response.
   */
  async getAllBlogPosts(): Promise<BlogPostResponse> {
    const response = await this.apiClient.get<BlogPostResponse>(`${this.baseUrl}/all`);
    return response as unknown as BlogPostResponse;
  }

  /**
   * Generates a URL-safe slug from a title string.
   * @param title - The blog post title.
   * @returns Lowercased, hyphen-separated slug.
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(^-|-$)/g, '');
  }

  /**
   * Estimates reading time in minutes based on a 200 wpm average.
   * @param content - Raw text content of the post.
   * @returns Estimated minutes (minimum 1).
   */
  estimateReadingTime(content: string): number {
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
  }

  /**
   * Formats an ISO date string for display (MM/DD/YYYY).
   * @param dateString - ISO 8601 date string.
   * @returns Locale-formatted date string.
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  /**
   * Truncates text to a maximum word count, appending ellipsis if needed.
   * @param text - Text to truncate.
   * @param wordLimit - Maximum number of words (default 30).
   * @returns Truncated string.
   */
  truncateText(text: string, wordLimit: number = 30): string {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  }
}

/** Pre-instantiated singleton blog service. */
export const blogService = new BlogService();
