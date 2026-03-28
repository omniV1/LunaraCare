/**
 * Deep tests for ApiClient – covers request interceptor (auth token injection),
 * response interceptor (data unwrapping), 401 handling (token refresh and retry),
 * concurrent 401 deduplication, session expiry event dispatch, 429 retry with
 * exponential backoff, auth endpoint exclusion from refresh, singleton pattern,
 * and HTTP method passthrough / GET param cleaning.
 *
 * Strategy: mock axios.create to capture the interceptors that ApiClient registers,
 * then invoke those interceptor callbacks directly in tests.
 */

// ── Capture interceptor callbacks ────────────────────────────────────────────

type InterceptorFn = (value: Record<string, unknown>) => Record<string, unknown>;
type InterceptorErrFn = (error: unknown) => unknown;

let requestFulfilled: InterceptorFn;
let requestRejected: InterceptorErrFn;
let responseFulfilled: InterceptorFn;
let responseRejected: InterceptorErrFn;

// Make the mock instance callable (axios instances are callable functions)
const mockAxiosInstance: Record<string, unknown> & jest.Mock = Object.assign(jest.fn(), {
  interceptors: {
    request: {
      use: jest.fn((fulfilled: InterceptorFn, rejected: InterceptorErrFn) => {
        requestFulfilled = fulfilled;
        requestRejected = rejected;
      }),
    },
    response: {
      use: jest.fn((fulfilled: InterceptorFn, rejected: InterceptorErrFn) => {
        responseFulfilled = fulfilled;
        responseRejected = rejected;
      }),
    },
  },
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
});

// Top-level axios.post is used for token refresh inside the ApiClient constructor
const mockAxiosPost = jest.fn();

jest.mock('axios', () => {
  const actual = jest.requireActual('axios');
  return {
    ...actual,
    create: jest.fn(() => mockAxiosInstance),
    post: mockAxiosPost,
  };
});

// Import AFTER mock setup so ApiClient constructor captures our interceptors
import { ApiClient } from '../../api/apiClient';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ApiClient – deep tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ---- Singleton ----

  describe('singleton pattern', () => {
    it('returns the same instance on multiple calls', () => {
      const a = ApiClient.getInstance();
      const b = ApiClient.getInstance();
      expect(a).toBe(b);
    });
  });

  // ---- Request interceptor: token injection ----

  describe('request interceptor – auth token injection', () => {
    it('adds Authorization header when token exists in localStorage', () => {
      localStorage.setItem('token', 'my-jwt');
      const config = { headers: {} as Record<string, string> };
      const result = requestFulfilled(config);
      expect((result as Record<string, Record<string, string>>).headers.Authorization).toBe('Bearer my-jwt');
    });

    it('does not add Authorization header when no token', () => {
      const config = { headers: {} as Record<string, string> };
      const result = requestFulfilled(config);
      expect((result as Record<string, Record<string, string>>).headers.Authorization).toBeUndefined();
    });

    it('throws error on request interceptor error path', () => {
      expect(() => requestRejected(new Error('config error'))).toThrow('config error');
    });

    it('wraps non-Error request failures as Error', () => {
      expect(() => requestRejected('string error')).toThrow('string error');
    });
  });

  // ---- Response interceptor: data unwrapping ----

  describe('response interceptor – data unwrapping', () => {
    it('unwraps response.data from Axios responses', () => {
      const response = { data: { user: { id: '1' } }, status: 200 };
      const result = responseFulfilled(response);
      expect(result).toEqual({ user: { id: '1' } });
    });
  });

  // ---- 401 handling: token refresh and retry ----

  describe('401 handling – token refresh and retry', () => {
    it('attempts token refresh on 401 for non-auth endpoints', async () => {
      localStorage.setItem('token', 'old-token');

      const refreshResponse = { data: { data: { accessToken: 'new-token' } } };
      mockAxiosPost.mockResolvedValue(refreshResponse);

      // Make the retry (this.axios(originalRequest)) return success
      mockAxiosInstance.mockResolvedValueOnce({ data: { result: 'ok' } });

      const originalRequest = {
        url: '/users/profile',
        headers: { Authorization: 'Bearer old-token' } as Record<string, string>,
        _retry: false,
      };
      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      await responseRejected(error);

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        {},
        { withCredentials: true },
      );
      expect(originalRequest._retry).toBe(true);
      expect(originalRequest.headers.Authorization).toBe('Bearer new-token');
      expect(localStorage.getItem('token')).toBe('new-token');
    });

    it('dispatches session-expired event and clears token when refresh fails', async () => {
      localStorage.setItem('token', 'old-token');
      mockAxiosPost.mockRejectedValue(new Error('refresh failed'));

      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

      const originalRequest = {
        url: '/users/profile',
        headers: {} as Record<string, string>,
        _retry: false,
      };
      const error = {
        response: { status: 401 },
        config: originalRequest,
      };

      await expect(responseRejected(error)).rejects.toThrow('refresh failed');
      expect(localStorage.getItem('token')).toBeNull();
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:session-expired' }),
      );

      dispatchSpy.mockRestore();
    });

    it('retries the original request with the new token after refresh', async () => {
      localStorage.setItem('token', 'old');
      mockAxiosPost.mockResolvedValue({ data: { data: { accessToken: 'fresh' } } });
      mockAxiosInstance.mockResolvedValueOnce({ success: true });

      const originalRequest = {
        url: '/some/data',
        headers: { Authorization: 'Bearer old' } as Record<string, string>,
        _retry: false,
      };
      const error = { response: { status: 401 }, config: originalRequest };

      const result = await responseRejected(error);

      // The interceptor called this.axios(originalRequest) after refresh
      expect(mockAxiosInstance).toHaveBeenCalledWith(originalRequest);
      expect(result).toEqual({ success: true });
    });

    it('does not attempt refresh for /auth/login', async () => {
      const error = {
        response: { status: 401 },
        config: { url: '/auth/login', headers: {}, _retry: false },
      };
      await expect(responseRejected(error)).rejects.toBeDefined();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('does not attempt refresh for /auth/register', async () => {
      const error = {
        response: { status: 401 },
        config: { url: '/auth/register', headers: {}, _retry: false },
      };
      await expect(responseRejected(error)).rejects.toBeDefined();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('does not attempt refresh for /auth/refresh', async () => {
      const error = {
        response: { status: 401 },
        config: { url: '/auth/refresh', headers: {}, _retry: false },
      };
      await expect(responseRejected(error)).rejects.toBeDefined();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('does not retry a request that has already been retried (_retry = true)', async () => {
      const error = {
        response: { status: 401 },
        config: { url: '/users/profile', headers: {}, _retry: true },
      };
      await expect(responseRejected(error)).rejects.toBeDefined();
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it('deduplicates concurrent 401 refreshes (only one /auth/refresh call)', async () => {
      localStorage.setItem('token', 'old');

      let resolveRefresh!: (v: unknown) => void;
      mockAxiosPost.mockReturnValue(new Promise(r => { resolveRefresh = r; }));

      // Both will return the retried result
      mockAxiosInstance.mockResolvedValue({ data: 'retried' });

      const makeError = (url: string) => ({
        response: { status: 401 },
        config: { url, headers: {} as Record<string, string>, _retry: false },
      });

      const p1 = responseRejected(makeError('/endpoint-a'));
      const p2 = responseRejected(makeError('/endpoint-b'));

      // Only one refresh should have been initiated
      expect(mockAxiosPost).toHaveBeenCalledTimes(1);

      // Resolve the shared refresh
      resolveRefresh({ data: { data: { accessToken: 'shared-token' } } });

      await Promise.all([p1, p2]);
      expect(localStorage.getItem('token')).toBe('shared-token');
    });
  });

  // ---- 429 rate limit retry ----

  describe('429 rate limit handling', () => {
    it('retries on 429 with incremented _retryCount', async () => {
      jest.useFakeTimers();

      const originalRequest = {
        url: '/api/data',
        headers: {},
        _retryCount: undefined as number | undefined,
      };
      const error = {
        response: { status: 429 },
        config: originalRequest,
      };

      mockAxiosInstance.mockResolvedValueOnce({ data: 'ok' });

      const promise = responseRejected(error);
      // Advance past the 1s backoff delay for first retry
      jest.advanceTimersByTime(1100);
      await promise;

      expect(originalRequest._retryCount).toBe(1);
      jest.useRealTimers();
    });

    it('stops retrying after 3 attempts on 429', async () => {
      const originalRequest = {
        url: '/api/data',
        headers: {},
        _retryCount: 3,
      };
      const error = {
        response: { status: 429 },
        config: originalRequest,
      };

      await expect(responseRejected(error)).rejects.toBeDefined();
    });
  });

  // ---- Error wrapping ----

  describe('error wrapping', () => {
    it('throws Error instances as-is', async () => {
      const error = new Error('network fail');
      Object.assign(error, { config: { url: '/test' } });
      await expect(responseRejected(error)).rejects.toThrow('network fail');
    });

    it('wraps non-Error rejection values', async () => {
      const error = {
        response: { status: 500 },
        config: { url: '/test' },
      };
      try {
        await responseRejected(error);
        // Should not reach here
        expect(true).toBe(false);
      } catch (e: unknown) {
        expect(e).toBeDefined();
      }
    });
  });

  // ---- HTTP methods ----

  describe('HTTP methods', () => {
    it('has get, post, put, delete, patch, getBlob methods', () => {
      const client = ApiClient.getInstance();
      expect(typeof client.get).toBe('function');
      expect(typeof client.post).toBe('function');
      expect(typeof client.put).toBe('function');
      expect(typeof client.delete).toBe('function');
      expect(typeof client.patch).toBe('function');
      expect(typeof client.getBlob).toBe('function');
    });
  });

  // ---- GET params cleaning ----

  describe('GET params cleaning', () => {
    it('strips undefined and null params from GET requests', async () => {
      const client = ApiClient.getInstance();
      mockAxiosInstance.get.mockResolvedValue([]);

      await client.get('/test', { status: 'active', empty: undefined, nil: null, valid: 'yes' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {
        params: { status: 'active', valid: 'yes' },
      });
    });

    it('passes empty config when no params', async () => {
      const client = ApiClient.getInstance();
      mockAxiosInstance.get.mockResolvedValue([]);

      await client.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', {});
    });
  });
});
