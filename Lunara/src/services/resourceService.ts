/**
 * ResourceService
 * --------------------------------------------------
 * Service for managing resources and categories in the LUNARA platform.
 * Follows the same singleton pattern as AuthService.
 *
 * Features:
 * - Resource CRUD operations
 * - Category management
 * - Filtering and search
 * - File upload support
 */

import { ApiClient } from '../api/apiClient';

/** Allowed difficulty levels for resources. */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** A postpartum care resource with metadata, versioning, and categorisation. */
export interface Resource {
  id: string;
  title: string;
  description: string;
  content: string;
  category: {
    id: string;
    name: string;
  };
  tags: string[];
  author: {
    id: string;
    firstName: string;
    lastName: string;
  };
  targetWeeks: number[];
  targetPregnancyWeeks: number[];
  difficulty: Difficulty;
  fileUrl?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
}

/** A resource category for grouping and filtering. */
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/** Optional query filters for listing resources. */
export interface ResourceFilters {
  category?: string;
  difficulty?: Difficulty;
  targetWeeks?: number[];
  targetPregnancyWeeks?: number[];
  tags?: string[];
  search?: string;
  isPublished?: boolean;
  author?: string;
}

/** Payload for creating a new resource. */
export interface CreateResourceData {
  title: string;
  description: string;
  content: string;
  category: string;
  tags?: string[];
  targetWeeks?: number[];
  targetPregnancyWeeks?: number[];
  difficulty?: Difficulty;
  fileUrl?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
}

/** Payload for updating an existing resource. */
export interface UpdateResourceData {
  title?: string;
  description?: string;
  content?: string;
  category?: string;
  tags?: string[];
  targetWeeks?: number[];
  targetPregnancyWeeks?: number[];
  difficulty?: Difficulty;
  fileUrl?: string;
  thumbnailUrl?: string;
  isPublished?: boolean;
}

/** Payload for creating a new category. */
export interface CreateCategoryData {
  name: string;
  description?: string;
}

/** Payload for updating an existing category. */
export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

// API Response types for better type safety
interface ResourcesResponse {
  resources?: Resource[];
}

type ResourceApiResponse = Resource[] | ResourcesResponse;

export class ResourceService {
  // Singleton pattern
  private static _instance: ResourceService | null = null;

  private readonly api = ApiClient.getInstance();

  static getInstance(): ResourceService {
    this._instance ??= new ResourceService();
    return this._instance;
  }

  private constructor() {}

  // Helper method to extract resources from API response (handles both array and paginated responses)
  private extractResources(res: ResourceApiResponse): Resource[] {
    // Handle both array response and paginated response
    if (Array.isArray(res)) {
      return res;
    }
    // If paginated response, return the resources array
    if (res?.resources) {
      return res.resources;
    }
    // Fallback to empty array
    return [];
  }

  // --- Resource Methods --------------------------------------------------

  /**
   * Get all resources with optional filtering
   */
  private cleanFilters(
    filters?: ResourceFilters
  ): Record<string, string | number | number[] | string[]> {
    const cleanParams: Record<string, string | number | number[] | string[]> = {};
    if (!filters) return cleanParams;

    if (filters.category) cleanParams.category = String(filters.category);
    if (filters.difficulty) cleanParams.difficulty = String(filters.difficulty);
    if (filters.search) cleanParams.search = String(filters.search);
    if (filters.author) cleanParams.author = String(filters.author);
    if (filters.isPublished !== undefined) cleanParams.isPublished = String(filters.isPublished);

    if (
      filters.targetWeeks &&
      Array.isArray(filters.targetWeeks) &&
      filters.targetWeeks.length > 0
    ) {
      cleanParams.targetWeeks = filters.targetWeeks;
    }

    if (
      filters.targetPregnancyWeeks &&
      Array.isArray(filters.targetPregnancyWeeks) &&
      filters.targetPregnancyWeeks.length > 0
    ) {
      cleanParams.targetPregnancyWeeks = filters.targetPregnancyWeeks;
    }

    if (filters.tags && Array.isArray(filters.tags) && filters.tags.length > 0) {
      cleanParams.tags = filters.tags;
    }

    return cleanParams;
  }

  async getResources(filters?: ResourceFilters): Promise<Resource[]> {
    const cleanParams = this.cleanFilters(filters);
    // Pass cleanParams directly - ApiClient.get() will wrap it in { params: ... }
    const res = await this.api.get<ResourceApiResponse>('/resources', cleanParams);
    return this.extractResources(res);
  }

  /**
   * Get a specific resource by ID
   */
  async getResource(id: string): Promise<Resource> {
    return this.api.get<Resource>(`/resources/${id}`);
  }

  /**
   * Create a new resource
   */
  async createResource(data: CreateResourceData): Promise<Resource> {
    const res = await this.api.post<{ message: string; resource: Resource }>('/resources', data);
    return res.resource;
  }

  /**
   * Update an existing resource
   */
  async updateResource(id: string, data: UpdateResourceData): Promise<Resource> {
    const res = await this.api.put<{ message: string; resource: Resource }>(`/resources/${id}`, data);
    return res.resource;
  }

  /**
   * Delete a resource
   */
  async deleteResource(id: string): Promise<void> {
    await this.api.delete(`/resources/${id}`);
  }

  /**
   * Search resources by text query
   */
  async searchResources(
    query: string,
    filters?: Omit<ResourceFilters, 'search'>
  ): Promise<Resource[]> {
    return this.getResources({ ...filters, search: query });
  }

  // --- Category Methods --------------------------------------------------

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    return this.api.get<Category[]>('/categories');
  }

  /**
   * Get a specific category by ID
   */
  async getCategory(id: string): Promise<Category> {
    return this.api.get<Category>(`/categories/${id}`);
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryData): Promise<Category> {
    return this.api.post<Category>('/categories', data);
  }

  /**
   * Update an existing category
   */
  async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    return this.api.put<Category>(`/categories/${id}`, data);
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }

  // --- Utility Methods --------------------------------------------------

  /**
   * Get published resources only (for public access)
   */
  async getPublishedResources(filters?: ResourceFilters): Promise<Resource[]> {
    return this.getResources({ ...filters, isPublished: true });
  }

  /**
   * Get resources by category
   */
  async getResourcesByCategory(
    categoryId: string,
    filters?: Omit<ResourceFilters, 'category'>
  ): Promise<Resource[]> {
    return this.getResources({ ...filters, category: categoryId });
  }

  /**
   * Get resources by difficulty level
   */
  async getResourcesByDifficulty(
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    filters?: Omit<ResourceFilters, 'difficulty'>
  ): Promise<Resource[]> {
    return this.getResources({ ...filters, difficulty });
  }

  /**
   * Get resources for specific postpartum weeks
   */
  async getResourcesForWeeks(
    weeks: number[],
    filters?: Omit<ResourceFilters, 'targetWeeks'>
  ): Promise<Resource[]> {
    return this.getResources({ ...filters, targetWeeks: weeks });
  }

  /**
   * Get resources for specific pregnancy weeks
   */
  async getResourcesForPregnancyWeeks(
    weeks: number[],
    filters?: Omit<ResourceFilters, 'targetPregnancyWeeks'>
  ): Promise<Resource[]> {
    return this.getResources({ ...filters, targetPregnancyWeeks: weeks });
  }

  // --- Version Methods --------------------------------------------------

  /**
   * Get version history for a resource
   */
  async getResourceVersions(
    resourceId: string
  ): Promise<{ versions: ResourceVersion[] }> {
    return this.api.get<{ versions: ResourceVersion[] }>(`/resources/${resourceId}/versions`);
  }

  /**
   * Restore a resource to a previous version
   */
  async restoreResourceVersion(resourceId: string, versionId: string): Promise<Resource> {
    return this.api.post<Resource>(`/resources/${resourceId}/versions/${versionId}/restore`);
  }
}

/** Snapshot of a resource at a specific version for history tracking. */
export interface ResourceVersion {
  id: string;
  versionNumber: number;
  title: string;
  description: string;
  content: string;
  category: string | { id: string; name: string; description?: string };
  tags: string[];
  targetWeeks: number[];
  targetPregnancyWeeks: number[];
  difficulty: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  isPublished: boolean;
  changedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  changeReason?: string;
  createdAt: string;
}
