import { Request, Response, NextFunction } from 'express';
import cache from '../services/cacheService';

/**
 * Express middleware that caches GET responses in memory.
 * @param ttlSeconds – time-to-live in seconds (default 300)
 * @param keyPrefix – optional prefix; defaults to the route path
 */
export function cacheResponse(ttlSeconds = 300, keyPrefix?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    const key = `${keyPrefix ?? req.baseUrl}:${req.originalUrl}`;
    const cached = cache.get<{ status: number; body: unknown }>(key);

    if (cached) {
      res.status(cached.status).json(cached.body);
      return;
    }

    // Intercept res.json to capture the response body
    const originalJson = res.json.bind(res);
    res.json = (body: unknown): Response => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, { status: res.statusCode, body }, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
}
