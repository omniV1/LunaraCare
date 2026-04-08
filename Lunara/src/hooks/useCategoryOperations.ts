/**
 * @module useCategoryOperations
 * React hook encapsulating CRUD state and actions for resource categories.
 * Used by provider-side resource management components.
 */
import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  ResourceService,
  Category,
  CreateCategoryData,
  UpdateCategoryData,
} from '../services/resourceService';

const resourceService = ResourceService.getInstance();

/** Default categories used when the API returns an empty list or fails. */
const FALLBACK_CATEGORIES: Category[] = [
  { id: '1', name: 'General', description: 'General resources', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', name: 'Pregnancy', description: 'Pregnancy-related resources', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', name: 'Postpartum', description: 'Postpartum-related resources', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

/**
 * Hook that manages category list state and provides CRUD operations.
 * Falls back to hardcoded categories when the API is unreachable.
 * @param handleError - Callback invoked with the caught error and a human-readable operation label.
 * @returns Category state (`categories`, `selectedCategory`, `loading`) and CRUD actions.
 */
export function useCategoryOperations(handleError: (error: unknown, operation: string) => void) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCategories = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const data = await resourceService.getCategories();

      if (!data || data.length === 0) {
        setCategories(FALLBACK_CATEGORIES);
      } else {
        setCategories(data);
      }
    } catch (error: unknown) {
      handleError(error, 'Loading categories');
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadCategory = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      const data = await resourceService.getCategory(id);
      setSelectedCategory(data);
    } catch (error) {
      handleError(error, 'Loading category');
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const createCategory = useCallback(async (data: CreateCategoryData): Promise<void> => {
    try {
      setLoading(true);
      const newCategory = await resourceService.createCategory(data);
      setCategories(prev => [...prev, newCategory]);
      toast.success('Category created successfully!');
    } catch (error) {
      handleError(error, 'Creating category');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const updateCategory = useCallback(async (id: string, data: UpdateCategoryData): Promise<void> => {
    try {
      setLoading(true);
      const updatedCategory = await resourceService.updateCategory(id, data);
      setCategories(prev => prev.map(c => (c.id === id ? updatedCategory : c)));
      if (selectedCategory?.id === id) {
        setSelectedCategory(updatedCategory);
      }
      toast.success('Category updated successfully!');
    } catch (error) {
      handleError(error, 'Updating category');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, selectedCategory?.id]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      await resourceService.deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
      if (selectedCategory?.id === id) {
        setSelectedCategory(null);
      }
      toast.success('Category deleted successfully!');
    } catch (error) {
      handleError(error, 'Deleting category');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [handleError, selectedCategory?.id]);

  return {
    categories,
    selectedCategory,
    loading,
    setSelectedCategory,
    loadCategories,
    loadCategory,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
