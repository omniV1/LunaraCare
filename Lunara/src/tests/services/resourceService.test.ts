/**
 * resourceService.test.ts
 * Unit tests for ResourceService: singleton, getResources (array and paginated),
 * getResource, getCategories, create/update/delete, searchResources. ApiClient is mocked.
 */
import { ApiClient } from '../../api/apiClient';
import { ResourceService } from '../../services/resourceService';
import type { Resource, Category } from '../../services/resourceService';

jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: jest.fn() },
}));

describe('ResourceService', () => {
  const mockApi = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  } as unknown as jest.Mocked<ApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    (ApiClient.getInstance as jest.Mock).mockReturnValue(mockApi);
    (ResourceService as unknown as Record<string, unknown>)._instance = null;
  });

  describe('getInstance', () => {
    it('returns singleton instance', () => {
      const a = ResourceService.getInstance();
      const b = ResourceService.getInstance();
      expect(a).toBe(b);
    });

    it('exposes expected methods', () => {
      const instance = ResourceService.getInstance();
      expect(typeof instance.getResources).toBe('function');
      expect(typeof instance.getResource).toBe('function');
      expect(typeof instance.createResource).toBe('function');
      expect(typeof instance.updateResource).toBe('function');
      expect(typeof instance.deleteResource).toBe('function');
      expect(typeof instance.searchResources).toBe('function');
      expect(typeof instance.getCategories).toBe('function');
      expect(typeof instance.getCategory).toBe('function');
      expect(typeof instance.createCategory).toBe('function');
    });
  });

  describe('getResources', () => {
    it('returns array when API returns array', async () => {
      const resources: Resource[] = [];
      mockApi.get.mockResolvedValue(resources);

      const result = await ResourceService.getInstance().getResources();

      expect(mockApi.get).toHaveBeenCalledWith('/resources', expect.any(Object));
      expect(result).toEqual(resources);
    });

    it('extracts resources from paginated response', async () => {
      const resources = [{ id: 'r1', title: 'R1', description: '', content: '', category: { id: 'c1', name: 'C1' }, tags: [], author: { id: 'a1', firstName: 'A', lastName: 'B' }, targetWeeks: [], difficulty: 'beginner', isPublished: true, createdAt: '', updatedAt: '' }];
      mockApi.get.mockResolvedValue({ resources });

      const result = await ResourceService.getInstance().getResources();

      expect(result).toEqual(resources);
    });

    it('returns empty array when API returns neither array nor paginated shape', async () => {
      mockApi.get.mockResolvedValue({});

      const result = await ResourceService.getInstance().getResources();

      expect(result).toEqual([]);
    });

    it('passes filters including targetWeeks and tags', async () => {
      mockApi.get.mockResolvedValue([]);

      await ResourceService.getInstance().getResources({
        category: 'c1',
        difficulty: 'intermediate',
        targetWeeks: [1, 2, 3],
        tags: ['tag1'],
        isPublished: true,
      });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/resources',
        expect.objectContaining({
          category: 'c1',
          difficulty: 'intermediate',
          targetWeeks: [1, 2, 3],
          tags: ['tag1'],
          isPublished: 'true',
        })
      );
    });
  });

  describe('getResource', () => {
    it('fetches by id', async () => {
      const resource = { id: 'r1', title: 'R1', description: '', content: '', category: { id: 'c1', name: 'C1' }, tags: [], author: { id: 'a1', firstName: 'A', lastName: 'B' }, targetWeeks: [], targetPregnancyWeeks: [], difficulty: 'beginner', isPublished: true, createdAt: '', updatedAt: '' } as Resource;
      mockApi.get.mockResolvedValue(resource);

      const result = await ResourceService.getInstance().getResource('r1');

      expect(mockApi.get).toHaveBeenCalledWith('/resources/r1');
      expect(result).toEqual(resource);
    });
  });

  describe('getCategories', () => {
    it('fetches categories', async () => {
      const categories: Category[] = [];
      mockApi.get.mockResolvedValue(categories);

      const result = await ResourceService.getInstance().getCategories();

      expect(mockApi.get).toHaveBeenCalledWith('/categories');
      expect(result).toEqual(categories);
    });
  });

  describe('createResource', () => {
    it('posts create payload', async () => {
      const data = { title: 'T', description: 'D', content: 'C', category: 'c1' };
      const created = { id: 'r1', ...data } as unknown as Resource;
      mockApi.post.mockResolvedValue({ message: 'Created', resource: created });

      const result = await ResourceService.getInstance().createResource(data);

      expect(mockApi.post).toHaveBeenCalledWith('/resources', data);
      expect(result).toEqual(created);
    });
  });

  describe('updateResource', () => {
    it('puts update by id', async () => {
      const data = { title: 'Updated' };
      mockApi.put.mockResolvedValue({ message: 'Updated', resource: { id: 'r1', ...data } });

      await ResourceService.getInstance().updateResource('r1', data);

      expect(mockApi.put).toHaveBeenCalledWith('/resources/r1', data);
    });
  });

  describe('deleteResource', () => {
    it('deletes by id', async () => {
      mockApi.delete.mockResolvedValue(undefined);

      await ResourceService.getInstance().deleteResource('r1');

      expect(mockApi.delete).toHaveBeenCalledWith('/resources/r1');
    });
  });

  describe('searchResources', () => {
    it('calls getResources with search query', async () => {
      mockApi.get.mockResolvedValue([]);

      await ResourceService.getInstance().searchResources('query', { category: 'c1' });

      expect(mockApi.get).toHaveBeenCalledWith('/resources', expect.objectContaining({ search: 'query', category: 'c1' }));
    });
  });

  describe('categories', () => {
    it('getCategory fetches by id', async () => {
      const category = { id: 'c1', name: 'Cat1', createdAt: '', updatedAt: '' };
      mockApi.get.mockResolvedValue(category);

      const result = await ResourceService.getInstance().getCategory('c1');

      expect(mockApi.get).toHaveBeenCalledWith('/categories/c1');
      expect(result).toEqual(category);
    });

    it('createCategory posts data', async () => {
      const data = { name: 'New Cat', description: 'Desc' };
      mockApi.post.mockResolvedValue({ id: 'c2', ...data, createdAt: '', updatedAt: '' });

      await ResourceService.getInstance().createCategory(data);

      expect(mockApi.post).toHaveBeenCalledWith('/categories', data);
    });

    it('updateCategory puts by id', async () => {
      const data = { name: 'Updated' };
      mockApi.put.mockResolvedValue({ id: 'c1', ...data, createdAt: '', updatedAt: '' });

      await ResourceService.getInstance().updateCategory('c1', data);

      expect(mockApi.put).toHaveBeenCalledWith('/categories/c1', data);
    });

    it('deleteCategory deletes by id', async () => {
      mockApi.delete.mockResolvedValue(undefined);

      await ResourceService.getInstance().deleteCategory('c1');

      expect(mockApi.delete).toHaveBeenCalledWith('/categories/c1');
    });
  });

  describe('utility methods', () => {
    it('getPublishedResources calls getResources with isPublished true', async () => {
      mockApi.get.mockResolvedValue([]);

      await ResourceService.getInstance().getPublishedResources({ category: 'c1' });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/resources',
        expect.objectContaining({ isPublished: 'true', category: 'c1' })
      );
    });

    it('getResourcesByCategory passes category', async () => {
      mockApi.get.mockResolvedValue([]);

      await ResourceService.getInstance().getResourcesByCategory('cat-id', { difficulty: 'beginner' });

      expect(mockApi.get).toHaveBeenCalledWith(
        '/resources',
        expect.objectContaining({ category: 'cat-id', difficulty: 'beginner' })
      );
    });

    it('getResourcesByDifficulty passes difficulty', async () => {
      mockApi.get.mockResolvedValue([]);

      await ResourceService.getInstance().getResourcesByDifficulty('advanced');

      expect(mockApi.get).toHaveBeenCalledWith(
        '/resources',
        expect.objectContaining({ difficulty: 'advanced' })
      );
    });

    it('getResourcesForWeeks passes targetWeeks', async () => {
      mockApi.get.mockResolvedValue([]);

      await ResourceService.getInstance().getResourcesForWeeks([10, 20]);

      expect(mockApi.get).toHaveBeenCalledWith(
        '/resources',
        expect.objectContaining({ targetWeeks: [10, 20] })
      );
    });
  });

  describe('version methods', () => {
    it('getResourceVersions fetches versions', async () => {
      const versions = { versions: [{ id: 'v1', versionNumber: 1, title: 'T', description: '', content: '', category: 'c1', tags: [], targetWeeks: [], difficulty: 'beginner', isPublished: true, changedBy: null, createdAt: '', updatedAt: '' }] };
      mockApi.get.mockResolvedValue(versions);

      const result = await ResourceService.getInstance().getResourceVersions('r1');

      expect(mockApi.get).toHaveBeenCalledWith('/resources/r1/versions');
      expect(result).toEqual(versions);
    });

    it('restoreResourceVersion posts restore', async () => {
      const resource = { id: 'r1', title: 'R1', description: '', content: '', category: { id: 'c1', name: 'C1' }, tags: [], author: { id: 'a1', firstName: 'A', lastName: 'B' }, targetWeeks: [], targetPregnancyWeeks: [], difficulty: 'beginner', isPublished: true, createdAt: '', updatedAt: '' } as Resource;
      mockApi.post.mockResolvedValue(resource);

      const result = await ResourceService.getInstance().restoreResourceVersion('r1', 'v1');

      expect(mockApi.post).toHaveBeenCalledWith('/resources/r1/versions/v1/restore');
      expect(result).toEqual(resource);
    });
  });
});
