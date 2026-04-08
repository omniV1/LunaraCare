/**
 * @module utils/getBaseApiUrl
 * Resolves the backend API base URL and derived URLs (OAuth, Socket.io)
 * from Vite build-time defines or process.env, with a `/api` fallback.
 */

/**
 * Resolves the backend API base URL from Vite defines or process.env.
 * Falls back to `/api` for local dev-proxy setups.
 * @returns The API base URL string (e.g. `https://lunara.onrender.com/api` or `/api`).
 */
export const getBaseApiUrl = (): string => {
  // Vite build-time replacement (see vite.config.ts)
  const viteDefine =
    typeof __VITE_API_BASE_URL__ === 'undefined' ? undefined : __VITE_API_BASE_URL__;

  // Node / Jest runtime – read from process.env when running tests or SSR
  const nodeEnv = typeof process === 'undefined' ? undefined : process.env.VITE_API_BASE_URL;

  const raw = viteDefine ?? nodeEnv ?? '/api';
  // Treat empty string as "not set" so dev proxy works when VITE_API_BASE_URL is unset
  const url = typeof raw === 'string' && raw.trim() ? raw.trim() : '/api';
  return url;
};

/**
 * Full href to start Google OAuth on the API. The API base must be absolute
 * (https://your-api.../api) when the SPA is on another origin (e.g. Vercel).
 */
export function getGoogleOAuthStartUrl(redirectOrigin: string): string {
  const base = getBaseApiUrl().replace(/\/+$/, '');
  const q = encodeURIComponent(redirectOrigin);
  return `${base}/auth/google?redirect_origin=${q}`;
}

/** Base URL for Socket.io (same host as API, no /api path). */
export const getSocketUrl = (): string => {
  const base = getBaseApiUrl();
  if (base.startsWith('http')) {
    return base.replace(/\/api\/?$/, '') || base;
  }
  return typeof window !== 'undefined' ? window.location.origin : '';
};
