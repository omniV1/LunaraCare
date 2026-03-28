import logger from '../utils/logger';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Simple in-memory cache with TTL support.
 * Drop-in replaceable with Redis when scaling requires it.
 */
class CacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Sweep expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.sweep(), 60_000);
  }

  /** Get a cached value, or undefined if missing / expired. */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  /** Store a value with a TTL in seconds (default 300 = 5 min). */
  set<T>(key: string, data: T, ttlSeconds = 300): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  /** Invalidate a single key. */
  del(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix. */
  invalidatePrefix(prefix: string): void {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    if (count > 0) {
      logger.debug(`Cache: invalidated ${count} key(s) with prefix "${prefix}"`);
    }
  }

  /** Remove all expired entries. */
  sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /** Clear everything. */
  clear(): void {
    this.store.clear();
  }

  /** Current number of entries (for metrics). */
  get size(): number {
    return this.store.size;
  }

  /** Stop the cleanup timer (call on shutdown). */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

export const cache = new CacheService();
export default cache;
