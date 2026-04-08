/**
 * @module useResourceOperations
 * React hook encapsulating CRUD state and actions for educational resources.
 * Supports filtering by category, difficulty, target weeks, and search queries.
 */
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  ResourceService,
  Resource,
  ResourceFilters,
  CreateResourceData,
  UpdateResourceData,
} from '../services/resourceService';


const resourceService = ResourceService.getInstance();

/**
 * Hook that manages resource list state and provides CRUD, search, and filter operations.
 * @param handleError - Callback invoked with the caught error and a human-readable operation label.
 * @returns Resource state (`resources`, `selectedResource`, `loading`) and action functions.
 */
export function useResourceOperations(handleError: (error: unknown, operation: string) => void) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(false);

  const loadResources = useCallback(async (filters?: ResourceFilters): Promise<void> => {
    try {
      setLoading(true);
      const data = await resourceService.getResources(filters);
      setResources(data ?? []);
    } catch (error: unknown) {
      handleError(error, 'Loading resources');
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadResource = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      const data = await resourceService.getResource(id);
      setSelectedResource(data);
    } catch (error) {
      handleError(error, 'Loading resource');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createResource = useCallback(async (data: CreateResourceData): Promise<void> => {
    try {
      setLoading(true);
      const newResource = await resourceService.createResource(data);
      setResources(prev => [newResource, ...prev]);
      toast.success('Resource created successfully!');
    } catch (error) {
      handleError(error, 'Creating resource');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateResource = useCallback(async (id: string, data: UpdateResourceData): Promise<void> => {
    try {
      setLoading(true);
      const updatedResource = await resourceService.updateResource(id, data);
      setResources(prev => prev.map(r => (r.id === id ? updatedResource : r)));
      if (selectedResource?.id === id) {
        setSelectedResource(updatedResource);
      }
      toast.success('Resource updated successfully!');
    } catch (error) {
      handleError(error, 'Updating resource');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, selectedResource?.id]);

  const deleteResource = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await resourceService.deleteResource(id);
      setResources(prev => prev.filter(r => r.id !== id));
      if (selectedResource?.id === id) {
        setSelectedResource(null);
      }
      toast.success('Resource deleted successfully!');
    } catch (error) {
      handleError(error, 'Deleting resource');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, selectedResource?.id]);

  const searchResources = useCallback(async (
    query: string,
    filters?: Omit<ResourceFilters, 'search'>
  ): Promise<void> => {
    try {
      setLoading(true);
      const data = await resourceService.searchResources(query, filters);
      setResources(data);
    } catch (error) {
      handleError(error, 'Searching resources');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadPublishedResources = useCallback(async (filters?: ResourceFilters): Promise<void> => {
    try {
      setLoading(true);
      const data = await resourceService.getPublishedResources(filters);
      setResources(data);
    } catch (error) {
      handleError(error, 'Loading published resources');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadResourcesByCategory = useCallback(async (
    categoryId: string,
    filters?: Omit<ResourceFilters, 'category'>
  ): Promise<void> => {
    try {
      setLoading(true);
      const data = await resourceService.getResourcesByCategory(categoryId, filters);
      setResources(data);
    } catch (error) {
      handleError(error, 'Loading resources by category');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadResourcesByDifficulty = useCallback(async (
    difficulty: 'beginner' | 'intermediate' | 'advanced',
    filters?: Omit<ResourceFilters, 'difficulty'>
  ): Promise<void> => {
    try {
      setLoading(true);
      const data = await resourceService.getResourcesByDifficulty(difficulty, filters);
      setResources(data);
    } catch (error) {
      handleError(error, 'Loading resources by difficulty');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadResourcesForWeeks = useCallback(async (
    weeks: number[],
    filters?: Omit<ResourceFilters, 'targetWeeks'>
  ): Promise<void> => {
    try {
      setLoading(true);
      const data = await resourceService.getResourcesForWeeks(weeks, filters);
      setResources(data);
    } catch (error) {
      handleError(error, 'Loading resources for weeks');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  return {
    resources,
    selectedResource,
    loading,
    setSelectedResource,
    loadResources,
    loadResource,
    createResource,
    updateResource,
    deleteResource,
    searchResources,
    loadPublishedResources,
    loadResourcesByCategory,
    loadResourcesByDifficulty,
    loadResourcesForWeeks,
  };
}
