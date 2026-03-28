/**
 * RecommendationService unit tests.
 * Covers singleton behavior, resource/document recommendation API calls,
 * response unwrapping (data wrapper vs direct), and error propagation.
 */
import { RecommendationService } from '../../services/recommendationService';
import { ApiClient } from '../../api/apiClient';

jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: jest.fn(),
  },
}));

describe('RecommendationService', () => {
  let recommendationService: RecommendationService;
  let mockApiClient: { get: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient = { get: jest.fn() };
    (ApiClient.getInstance as jest.Mock).mockReturnValue(mockApiClient);
    (RecommendationService as unknown as Record<string, unknown>)._instance = null; // Reset singleton
    recommendationService = RecommendationService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const a = RecommendationService.getInstance();
      const b = RecommendationService.getInstance();
      expect(a).toBe(b);
    });
  });

  describe('getResourceRecommendations', () => {
    it('should return resource recommendations from API', async () => {
      const mockData = {
        resources: [],
        postpartumWeek: 4,
        reason: 'Based on your progress',
      };
      mockApiClient.get.mockResolvedValue({ data: mockData });

      const result = await recommendationService.getResourceRecommendations();

      expect(mockApiClient.get).toHaveBeenCalledWith('/recommendations/resources');
      expect(result).toEqual(mockData);
      expect(result.postpartumWeek).toBe(4);
    });

    it('should use response directly when data wrapper is absent', async () => {
      const mockData = {
        resources: [],
        postpartumWeek: 2,
        reason: 'Default',
      };
      mockApiClient.get.mockResolvedValue(mockData);

      const result = await recommendationService.getResourceRecommendations();

      expect(result).toEqual(mockData);
    });

    it('should propagate API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(recommendationService.getResourceRecommendations()).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getDocumentRecommendations', () => {
    it('should return document recommendations from API', async () => {
      const mockData = {
        suggestions: [],
        postpartumWeek: 3,
        submittedTypes: ['personal-assessment'],
      };
      mockApiClient.get.mockResolvedValue({ data: mockData });

      const result = await recommendationService.getDocumentRecommendations();

      expect(mockApiClient.get).toHaveBeenCalledWith('/recommendations/documents');
      expect(result).toEqual(mockData);
      expect(result.postpartumWeek).toBe(3);
    });

    it('should use response directly when data wrapper is absent', async () => {
      const mockData = {
        suggestions: [],
        postpartumWeek: 1,
        submittedTypes: [],
      };
      mockApiClient.get.mockResolvedValue(mockData);

      const result = await recommendationService.getDocumentRecommendations();

      expect(result).toEqual(mockData);
    });

    it('should propagate API errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Unauthorized'));

      await expect(recommendationService.getDocumentRecommendations()).rejects.toThrow(
        'Unauthorized'
      );
    });
  });
});
