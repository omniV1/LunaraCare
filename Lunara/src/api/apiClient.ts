/**
 * @module apiClient
 * Singleton Axios wrapper used by every frontend service. Handles base URL
 * resolution, JWT injection, 401 token refresh, and 429 retry with backoff.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { getBaseApiUrl } from '../utils/getBaseApiUrl';

/**
 * ApiClient
 * -------------------------
 * Centralised Axios wrapper used by all frontend services.
 * – Sets baseURL from `VITE_API_BASE_URL` (defaults to `http://localhost:5000/api`)
 * – Automatically attaches the `Authorization: Bearer <token>` header if a token is stored in `localStorage`.
 * – Unwraps `data` so callers only receive the payload.
 */
export class ApiClient {
  private static _instance: ApiClient;
  private readonly axios: AxiosInstance;

  private constructor() {
    // Resolve base URL in a way that also works under Jest (no `import.meta`)
    const baseURL = getBaseApiUrl();

    this.axios = axios.create({
      baseURL,
      // Required so the browser sends/receives the httpOnly refreshToken cookie
      // on cross-origin requests to the backend.
      withCredentials: true,
    });

    // Inject token before every request
    this.axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        throw error instanceof Error ? error : new Error(String(error));
      }
    );

    // Flatten Axios responses so we always return the payload directly
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => response.data,
      async error => {
        const originalRequest = error.config;

        // Render's free tier aggressively rate-limits; retry up to 3 times with
        // exponential backoff (1s → 2s → 4s, capped at 8s) to ride out transient 429s.
        if (error.response?.status === 429 && originalRequest) {
          const retryCount = (originalRequest._retryCount as number) ?? 0;
          if (retryCount < 3) {
            (originalRequest as Record<string, unknown>)._retryCount = retryCount + 1;
            const delay = Math.min(1000 * 2 ** retryCount, 8000);
            await new Promise(r => setTimeout(r, delay));
            return this.axios(originalRequest);
          }
        }

        // Don't try to refresh tokens for auth endpoints (login, register, refresh)
        // Note: /users/profile is NOT excluded — it should benefit from token refresh
        // so that expired sessions are silently renewed instead of logging the user out.
        const isAuthEndpoint =
          originalRequest?.url &&
          (originalRequest.url.includes('/auth/login') ||
            originalRequest.url.includes('/auth/register') ||
            originalRequest.url.includes('/auth/refresh'));

        if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest?._retry &&
          !isAuthEndpoint
        ) {
          if (process.env.NODE_ENV !== 'production') {
            const hadToken = !!localStorage.getItem('token');
            console.warn(
              `[ApiClient] 401 on ${originalRequest?.url}. Token: ${hadToken ? 'yes' : 'NO'}`
            );
          }
          originalRequest._retry = true;
          try {
            const newToken = await refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return this.axios(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem('token');
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
            throw refreshError instanceof Error ? refreshError : new Error(String(refreshError));
          }
        }

        throw error instanceof Error ? error : new Error(String(error));
      }
    );

    // --- Token refresh handling -----------------------------
    // Deduplicate concurrent refresh attempts: if multiple requests 401 at the
    // same time, they all await the same in-flight refresh instead of each
    // triggering a separate /auth/refresh call (which would invalidate tokens).
    let isRefreshing = false;
    let refreshPromise: Promise<string> | null = null;

    const refreshAccessToken = async (): Promise<string> => {
      if (isRefreshing && refreshPromise) {
        return refreshPromise;
      }
      isRefreshing = true;
      // The refresh token is delivered via httpOnly cookie — the browser
      // sends it automatically with withCredentials: true.
      refreshPromise = axios
        .post(`${baseURL}/auth/refresh`, {}, { withCredentials: true })
        .then(res => {
          const newToken: string = res.data.data.accessToken;
          localStorage.setItem('token', newToken);
          window.dispatchEvent(new CustomEvent('auth:token-refreshed'));
          return newToken;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      return refreshPromise;
    };
  }

  /**
   * Returns the singleton ApiClient instance, creating it on first call.
   * @returns The shared {@link ApiClient} instance.
   */
  public static getInstance(): ApiClient {
    if (!this._instance) {
      this._instance = new ApiClient();
    }
    return this._instance;
  }

  /**
   * Performs a GET request with optional query parameters.
   * @param url - Relative endpoint path.
   * @param params - Optional query parameters (undefined/null values are stripped).
   * @returns The response payload of type `T`.
   */
  public async get<T>(url: string, params?: unknown): Promise<T> {
    // Ensure params are properly serialized
    // Axios automatically serializes params, but we need to make sure they're in the right format
    const config: Record<string, unknown> = {};
    if (params && typeof params === 'object') {
      // Flatten params and remove undefined values
      const cleanParams: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          cleanParams[key] = value;
        }
      }
      config.params = cleanParams;
    }
    const res = await this.axios.get<T, T>(url, config);
    return res;
  }

  /** Fetch a file as Blob (sends auth header; use for viewing files in a new tab). */
  public async getBlob(url: string): Promise<Blob> {
    const res = await this.axios.get<Blob>(url, { responseType: 'blob' });
    return res as unknown as Blob;
  }

  /**
   * Performs a POST request.
   * @param url - Relative endpoint path.
   * @param data - Optional request body.
   * @returns The response payload of type `T`.
   */
  public async post<T>(url: string, data?: unknown): Promise<T> {
    const res = await this.axios.post<T, T>(url, data);
    return res;
  }

  /**
   * Performs a PUT request.
   * @param url - Relative endpoint path.
   * @param data - Optional request body.
   * @returns The response payload of type `T`.
   */
  public async put<T>(url: string, data?: unknown): Promise<T> {
    const res = await this.axios.put<T, T>(url, data);
    return res;
  }

  /**
   * Performs a DELETE request.
   * @param url - Relative endpoint path.
   * @param config - Optional Axios config (e.g. `{ data: ... }` for request body).
   * @returns The response payload of type `T`.
   */
  public async delete<T>(url: string, config?: { data?: unknown }): Promise<T> {
    const res = await this.axios.delete<T, T>(url, config);
    return res;
  }

  /**
   * Performs a PATCH request.
   * @param url - Relative endpoint path.
   * @param data - Optional request body.
   * @returns The response payload of type `T`.
   */
  public async patch<T>(url: string, data?: unknown): Promise<T> {
    const res = await this.axios.patch<T, T>(url, data);
    return res;
  }
}
