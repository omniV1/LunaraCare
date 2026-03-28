import { describe, it, expect, beforeEach } from '@jest/globals';
import cache from '../../src/services/cacheService';

describe('cacheService', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('returns undefined for missing keys', () => {
    expect(cache.get('nope')).toBeUndefined();
  });

  it('stores and retrieves a value', () => {
    cache.set('key1', { hello: 'world' }, 60);
    expect(cache.get('key1')).toEqual({ hello: 'world' });
  });

  it('returns undefined for expired entries', () => {
    cache.set('expired', 42, 0); // 0 seconds TTL
    // Tiny delay to ensure it's past
    expect(cache.get('expired')).toBeUndefined();
  });

  it('deletes a specific key', () => {
    cache.set('a', 1);
    cache.del('a');
    expect(cache.get('a')).toBeUndefined();
  });

  it('invalidatePrefix removes matching keys', () => {
    cache.set('user:1', 'alice');
    cache.set('user:2', 'bob');
    cache.set('post:1', 'hello');
    cache.invalidatePrefix('user:');
    expect(cache.get('user:1')).toBeUndefined();
    expect(cache.get('user:2')).toBeUndefined();
    expect(cache.get('post:1')).toBe('hello');
  });

  it('sweep removes expired entries', () => {
    cache.set('fresh', 1, 600);
    cache.set('stale', 2, 0);
    cache.sweep();
    expect(cache.get('fresh')).toBe(1);
    expect(cache.size).toBe(1);
  });

  it('clear removes all entries', () => {
    cache.set('x', 1);
    cache.set('y', 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('destroy stops interval and clears', () => {
    cache.set('z', 3);
    cache.destroy();
    expect(cache.size).toBe(0);
  });
});
