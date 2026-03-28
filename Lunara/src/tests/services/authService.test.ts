import { AuthService } from '../../services/authService';
import { ApiClient } from '../../api/apiClient';

// Mock the entire ApiClient module
jest.mock('../../api/apiClient', () => {
  return {
    ApiClient: {
      getInstance: jest.fn(),
    },
  };
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock API client
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    } as unknown as jest.Mocked<ApiClient>;

    // Make getInstance return the mock
    (ApiClient.getInstance as jest.Mock).mockReturnValue(mockApiClient);

    // Reset the singleton
    (AuthService as unknown as Record<string, unknown>)._instance = null;

    // Get fresh instance
    authService = AuthService.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = AuthService.getInstance();
      const instance2 = AuthService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('providerLogin', () => {
    it('should login a provider successfully', async () => {
      const credentials = { email: 'provider@test.com', password: 'password123' };
      const mockResponse = {
        user: { id: '1', email: 'provider@test.com', role: 'provider' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.providerLogin(credentials);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result.user).toEqual(mockResponse.user);
    });

    it('should handle login errors', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        authService.providerLogin({ email: 'wrong@test.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('clientLogin', () => {
    it('should login a client successfully', async () => {
      const credentials = { email: 'client@test.com', password: 'password123' };
      const mockResponse = {
        user: { id: '2', email: 'client@test.com', role: 'client' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await authService.clientLogin(credentials);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result.user).toEqual(mockResponse.user);
    });
  });

  describe('registerClient', () => {
    it('should register a new client without auto-login', async () => {
      const data = {
        email: 'newclient@test.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
        providerId: 'provider-123',
      };
      const mockRegisterResponse = {
        success: true,
        data: { id: '4', firstName: 'Jane', lastName: 'Smith', email: data.email, role: 'client' },
      };

      mockApiClient.post.mockResolvedValueOnce(mockRegisterResponse);

      const result = await authService.registerClient(data);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', {
        ...data,
        role: 'client',
      });
      expect(mockApiClient.post).toHaveBeenCalledTimes(1);
      expect(result.email).toBe(data.email);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user', async () => {
      const mockUser = { id: '1', email: 'user@test.com', role: 'client' };
      mockApiClient.get.mockResolvedValue({ user: mockUser });

      const result = await authService.getCurrentUser();

      expect(mockApiClient.get).toHaveBeenCalledWith('/users/profile');
      expect(result).toEqual(mockUser);
    });
  });

  describe('refreshToken', () => {
    it('should post to refresh endpoint and return new access token', async () => {
      mockApiClient.post.mockResolvedValue({
        success: true,
        data: { accessToken: 'new-access-token' },
      });
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      const result = await authService.refreshToken();

      // Refresh token is now sent via httpOnly cookie, so body is empty.
      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {});
      expect(result).toBe('new-access-token');
      expect(setItemSpy).toHaveBeenCalledWith('token', 'new-access-token');
      setItemSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should remove access token from localStorage and call logout endpoint', async () => {
      mockApiClient.post.mockResolvedValue({ success: true });
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

      await authService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout', {});
      expect(removeItemSpy).toHaveBeenCalledWith('token');
      removeItemSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should throw when response missing user or accessToken', async () => {
      mockApiClient.post.mockResolvedValue({ data: {} });

      await expect(
        authService.clientLogin({ email: 'x@x.com', password: 'p' })
      ).rejects.toThrow('Invalid response from login endpoint');
    });
  });
});
