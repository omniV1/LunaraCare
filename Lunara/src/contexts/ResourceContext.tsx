/**
 * @module ResourceContext
 * Provides centralised resource and category state to the component tree.
 * Auto-loads data when the user is authenticated and exposes CRUD + filtering
 * operations via the {@link useResource} hook.
 */

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import {
  Resource,
  Category,
  ResourceFilters,
  CreateResourceData,
  UpdateResourceData,
  CreateCategoryData,
  UpdateCategoryData,
} from '../services/resourceService';
import { useAuth } from './useAuth';
import { useResourceOperations } from '../hooks/useResourceOperations';
import { useCategoryOperations } from '../hooks/useCategoryOperations';

/**
 * Type guard narrowing an unknown value to a plain object.
 * @param v - Value to test.
 * @returns `true` when `v` is a non-null, non-array object.
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Shape of the value exposed by {@link ResourceContext}. */
export interface ResourceContextType {
  resources: Resource[];
  categories: Category[];
  selectedResource: Resource | null;
  selectedCategory: Category | null;
  loading: boolean;
  error: string | null;
  loadResources: (filters?: ResourceFilters) => Promise<void>;
  loadResource: (id: string) => Promise<void>;
  createResource: (data: CreateResourceData) => Promise<void>;
  updateResource: (id: string, data: UpdateResourceData) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;
  searchResources: (query: string, filters?: Omit<ResourceFilters, 'search'>) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadCategory: (id: string) => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<void>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  loadPublishedResources: (filters?: ResourceFilters) => Promise<void>;
  loadResourcesByCategory: (categoryId: string, filters?: Omit<ResourceFilters, 'category'>) => Promise<void>;
  loadResourcesByDifficulty: (
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    filters?: Omit<ResourceFilters, 'difficulty'>
  ) => Promise<void>;
  loadResourcesForWeeks: (weeks: number[], filters?: Omit<ResourceFilters, 'targetWeeks'>) => Promise<void>;
  setSelectedResource: (resource: Resource | null) => void;
  setSelectedCategory: (category: Category | null) => void;
  clearError: () => void;
}

/** Fast Refresh: context object is not a component; kept with provider for cohesion. */
// eslint-disable-next-line react-refresh/only-export-components -- context + provider module
export const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

/**
 * Context provider that composes resource and category hooks, handles errors,
 * and auto-fetches initial data when the user becomes authenticated.
 * @param props.children - Components that consume resource state via {@link useResource}.
 */
export const ResourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: unknown, operation: string) => {
    const errorMessage =
      isRecord(error) &&
      isRecord(error.response) &&
      isRecord(error.response.data) &&
      typeof error.response.data.message === 'string'
        ? error.response.data.message
        : error instanceof Error
          ? error.message
          : `${operation} failed`;
    setError(errorMessage);
    toast.error(errorMessage);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const resourceOps = useResourceOperations(handleError);
  const categoryOps = useCategoryOperations(handleError);

  const { loadResources } = resourceOps;
  const { loadCategories } = categoryOps;

  const loading = resourceOps.loading || categoryOps.loading;

  // Load initial data only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadResources().catch(() => {});
      loadCategories().catch(() => {});
    }
  }, [isAuthenticated, loadResources, loadCategories]);

  const value = useMemo(
    () => ({
      resources: resourceOps.resources,
      categories: categoryOps.categories,
      selectedResource: resourceOps.selectedResource,
      selectedCategory: categoryOps.selectedCategory,
      loading,
      error,
      loadResources: resourceOps.loadResources,
      loadResource: resourceOps.loadResource,
      createResource: resourceOps.createResource,
      updateResource: resourceOps.updateResource,
      deleteResource: resourceOps.deleteResource,
      searchResources: resourceOps.searchResources,
      loadCategories: categoryOps.loadCategories,
      loadCategory: categoryOps.loadCategory,
      createCategory: categoryOps.createCategory,
      updateCategory: categoryOps.updateCategory,
      deleteCategory: categoryOps.deleteCategory,
      loadPublishedResources: resourceOps.loadPublishedResources,
      loadResourcesByCategory: resourceOps.loadResourcesByCategory,
      loadResourcesByDifficulty: resourceOps.loadResourcesByDifficulty,
      loadResourcesForWeeks: resourceOps.loadResourcesForWeeks,
      setSelectedResource: resourceOps.setSelectedResource,
      setSelectedCategory: categoryOps.setSelectedCategory,
      clearError,
    }),
    [
      resourceOps.resources,
      categoryOps.categories,
      resourceOps.selectedResource,
      categoryOps.selectedCategory,
      loading,
      error,
      resourceOps.loadResources,
      resourceOps.loadResource,
      resourceOps.createResource,
      resourceOps.updateResource,
      resourceOps.deleteResource,
      resourceOps.searchResources,
      categoryOps.loadCategories,
      categoryOps.loadCategory,
      categoryOps.createCategory,
      categoryOps.updateCategory,
      categoryOps.deleteCategory,
      resourceOps.loadPublishedResources,
      resourceOps.loadResourcesByCategory,
      resourceOps.loadResourcesByDifficulty,
      resourceOps.loadResourcesForWeeks,
      clearError,
      resourceOps.setSelectedResource,
      categoryOps.setSelectedCategory,
    ]
  );

  return <ResourceContext.Provider value={value}>{children}</ResourceContext.Provider>;
};

export default ResourceProvider;
