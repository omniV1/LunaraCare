import { ApiClient } from '../api/apiClient';

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

export interface CreateBlogPostData {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  featuredImage?: string;
  isPublished?: boolean;
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
  publishDate?: Date;
}

export interface BlogPostFilters {
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  limit?: number;
  page?: number;
}

export interface BlogPostResponse {
  posts: BlogPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class BlogService {
  private readonly baseUrl = '/blog';
  private readonly apiClient = ApiClient.getInstance();

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

  async getBlogPost(slug: string): Promise<BlogPost> {
    const response = await this.apiClient.get<BlogPost>(`${this.baseUrl}/${slug}`);
    return response as unknown as BlogPost;
  }

  async createBlogPost(data: CreateBlogPostData): Promise<BlogPost> {
    const response = await this.apiClient.post<BlogPost>(this.baseUrl, data);
    return response as unknown as BlogPost;
  }

  async updateBlogPost(data: UpdateBlogPostData): Promise<BlogPost> {
    const { id, ...updateData } = data;
    const response = await this.apiClient.put<BlogPost>(`${this.baseUrl}/${id}`, updateData);
    return response as unknown as BlogPost;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await this.apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async getDrafts(): Promise<BlogPost[]> {
    const response = await this.apiClient.get<BlogPost[]>(`${this.baseUrl}/drafts`);
    return response as unknown as BlogPost[];
  }

  async getAllBlogPosts(): Promise<BlogPostResponse> {
    const response = await this.apiClient.get<BlogPostResponse>(`${this.baseUrl}/all`);
    return response as unknown as BlogPostResponse;
  }

  // Helper function to generate slug from title
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/(^-|-$)/g, '');
  }

  // Helper function to estimate reading time
  estimateReadingTime(content: string): number {
    const wordCount = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
  }

  // Helper function to format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  // Helper function to truncate text
  truncateText(text: string, wordLimit: number = 30): string {
    const words = text.split(' ');
    if (words.length <= wordLimit) return text;
    return words.slice(0, wordLimit).join(' ') + '...';
  }
}

export const blogService = new BlogService();
