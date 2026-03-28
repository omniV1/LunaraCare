import { ApiClient } from '../../api/apiClient';
import { UserService } from '../../services/userService';
import { UserProfile, PaginatedResponse, QueryParams } from '../../types/api';
import { User } from '../../types/user';

jest.mock('../../api/apiClient', () => {
  return {
    ApiClient: {
      getInstance: jest.fn(),
    },
  };
});

describe('UserService', () => {
  let userService: UserService;
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
    (UserService as unknown as Record<string, unknown>).instance = null;
    userService = UserService.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = UserService.getInstance();
      const instance2 = UserService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getCurrentProfile', () => {
    it('should get current user profile', async () => {
      const mockProfile: UserProfile = {
        id: '1',
        email: 'user@test.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockApiClient.get.mockResolvedValue(mockProfile);

      const result = await userService.getCurrentProfile();

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/profile');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData: Partial<UserProfile> = {
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const mockProfile: UserProfile = {
        id: '1',
        email: 'user@test.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'client',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockApiClient.put.mockResolvedValue(mockProfile);

      const result = await userService.updateProfile(updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith('/users/profile', updateData);
      expect(result).toEqual(mockProfile);
    });
  });

  describe('getUserById', () => {
    it('should get user by ID', async () => {
      const mockProfile: UserProfile = {
        id: '2',
        email: 'other@test.com',
        firstName: 'Other',
        lastName: 'User',
        role: 'provider',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };
      mockApiClient.get.mockResolvedValue(mockProfile);

      const result = await userService.getUserById(2);

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/2');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('getUsers', () => {
    it('should get paginated list of users', async () => {
      const mockResponse: PaginatedResponse<UserProfile> = {
        status: 200,
        data: [
          {
            id: '1',
            email: 'user1@test.com',
            firstName: 'User',
            lastName: 'One',
            role: 'client',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        meta: { currentPage: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params: QueryParams = { page: 1, pageSize: 10 };
      const result = await userService.getUsers(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/users?page=1&pageSize=10');
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty query params', async () => {
      const mockResponse: PaginatedResponse<UserProfile> = {
        status: 200,
        data: [],
        meta: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await userService.getUsers({});

      expect(mockApiClient.get).toHaveBeenCalledWith('/users');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getProviders', () => {
    it('should get paginated list of providers', async () => {
      const mockResponse: PaginatedResponse<UserProfile> = {
        status: 200,
        data: [
          {
            id: '1',
            email: 'provider@test.com',
            firstName: 'Provider',
            lastName: 'One',
            role: 'provider',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        meta: { currentPage: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params: QueryParams = { page: 1, pageSize: 10 };
      const result = await userService.getProviders(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/providers?page=1&pageSize=10');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getClients', () => {
    it('should get paginated list of clients', async () => {
      const mockResponse: PaginatedResponse<User> = {
        status: 200,
        data: [
          {
            id: '1',
            email: 'client@test.com',
            firstName: 'Client',
            lastName: 'One',
            role: 'client',
          },
        ],
        meta: { currentPage: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params: QueryParams = { page: 1, pageSize: 10 };
      const result = await userService.getClients(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/clients?page=1&pageSize=10');
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty query params for clients', async () => {
      const mockResponse: PaginatedResponse<User> = {
        status: 200,
        data: [],
        meta: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await userService.getClients({});

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/clients');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('buildQueryString', () => {
    it('should build query string with all params', () => {
      const params: QueryParams = {
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortOrder: 'asc',
        search: 'test',
      };
      const queryString = (userService as unknown as { buildQueryString(params: QueryParams): string }).buildQueryString(params);
      expect(queryString).toBe('?page=1&pageSize=10&sortBy=name&sortOrder=asc&search=test');
    });

    it('should build query string with partial params', () => {
      const params: QueryParams = { page: 2, sortBy: 'email' };
      const queryString = (userService as unknown as { buildQueryString(params: QueryParams): string }).buildQueryString(params);
      expect(queryString).toBe('?page=2&sortBy=email');
    });

    it('should return empty string for no params', () => {
      const params: QueryParams = {};
      const queryString = (userService as unknown as { buildQueryString(params: QueryParams): string }).buildQueryString(params);
      expect(queryString).toBe('');
    });
  });
});
