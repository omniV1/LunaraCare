import { ApiClient } from '../../api/apiClient';
import { ProviderService } from '../../services/providerService';
import { Provider, ProviderAvailability } from '../../types/api';

jest.mock('../../api/apiClient', () => {
  return {
    ApiClient: {
      getInstance: jest.fn(),
    },
  };
});

jest.mock('date-fns', () => ({
  format: jest.fn((date, _formatStr) => {
    // Simple mock for format function
    if (date instanceof Date) {
      return date.toISOString().split('.')[0];
    }
    return date;
  }),
}));

describe('ProviderService', () => {
  let providerService: ProviderService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    } as unknown as jest.Mocked<ApiClient>;
    (ApiClient.getInstance as jest.Mock).mockReturnValue(mockApiClient);
    // Reset singleton
    (ProviderService as unknown as Record<string, unknown>).instance = null;
    providerService = ProviderService.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ProviderService.getInstance();
      const instance2 = ProviderService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getProviders', () => {
    it('should get list of providers', async () => {
      const mockProviders: Provider[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          role: 'provider',
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'provider',
        },
      ];
      mockApiClient.get.mockResolvedValue(mockProviders);

      const result = await providerService.getProviders();

      expect(mockApiClient.get).toHaveBeenCalledWith('/providers');
      expect(result).toEqual(mockProviders);
    });
  });

  describe('getProvider', () => {
    it('should get a single provider by ID', async () => {
      const mockProvider: Provider = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        role: 'provider',
      };
      mockApiClient.get.mockResolvedValue(mockProvider);

      const result = await providerService.getProvider(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/providers/1');
      expect(result).toEqual(mockProvider);
    });
  });

  describe('getProviderAvailability', () => {
    it('should get provider availability within date range', async () => {
      const mockAvailability: ProviderAvailability[] = [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      ];
      mockApiClient.get.mockResolvedValue(mockAvailability);

      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-07T23:59:59Z');
      const result = await providerService.getProviderAvailability(1, startDate, endDate);

      expect(mockApiClient.get).toHaveBeenCalledWith('/providers/1/availability', {
        start: expect.any(String),
        end: expect.any(String),
      });
      expect(result).toEqual(mockAvailability);
    });
  });

  describe('create', () => {
    it('should create a new provider', async () => {
      const newProvider = {
        firstName: 'New',
        lastName: 'Provider',
        email: 'new@test.com',
        role: 'provider',
      };
      const mockProvider: Provider = {
        id: '3',
        firstName: 'New',
        lastName: 'Provider',
        role: 'provider',
      };
      mockApiClient.post.mockResolvedValue(mockProvider);

      const result = await providerService.create(newProvider);

      expect(mockApiClient.post).toHaveBeenCalledWith('/providers', newProvider);
      expect(result).toEqual(mockProvider);
    });
  });

  describe('update', () => {
    it('should update an existing provider', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Provider',
      };
      const mockProvider: Provider = {
        id: '1',
        firstName: 'Updated',
        lastName: 'Provider',
        role: 'provider',
      };
      mockApiClient.put.mockResolvedValue(mockProvider);

      const result = await providerService.update('1', updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/providers/1', updateData);
      expect(result).toEqual(mockProvider);
    });
  });

  describe('delete', () => {
    it('should delete a provider', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await providerService.delete('1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/providers/1');
    });
  });
});
