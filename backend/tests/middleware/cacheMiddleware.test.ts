import { describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { cacheResponse } from '../../src/middleware/cacheMiddleware';
import cache from '../../src/services/cacheService';

function mockReq(overrides: Record<string, unknown> = {}): Request {
  return {
    method: 'GET',
    baseUrl: '/api',
    originalUrl: '/api/items?page=1',
    ...overrides,
  } as unknown as Request;
}

function mockRes() {
  const res = {
    statusCode: 200,
    status(code: number) { res.statusCode = code; return res; },
    json(body: unknown) { (res as Record<string, unknown>)._body = body; return res; },
  };
  return res as unknown as Response & { _body: unknown };
}

describe('cacheMiddleware', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('passes through non-GET requests without caching', () => {
    const middleware = cacheResponse(60);
    const req = mockReq({ method: 'POST' });
    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it('calls next and intercepts json on cache miss', () => {
    const middleware = cacheResponse(60, 'test');
    const req = mockReq();
    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);

    // Simulate the route handler calling res.json
    res.json({ data: 'hello' });
    expect(res._body).toEqual({ data: 'hello' });

    // Value should now be cached
    const key = 'test:/api/items?page=1';
    expect(cache.get(key)).toBeDefined();
  });

  it('returns cached response on cache hit', () => {
    const middleware = cacheResponse(60, 'test');
    const key = 'test:/api/items?page=1';
    cache.set(key, { status: 200, body: { cached: true } }, 60);

    const req = mockReq();
    const res = mockRes();
    let nextCalled = false;
    middleware(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res._body).toEqual({ cached: true });
  });

  it('does not cache error responses', () => {
    const middleware = cacheResponse(60, 'test');
    const req = mockReq();
    const res = mockRes();
    middleware(req, res, () => {});

    // Simulate a 500 response
    res.statusCode = 500;
    res.json({ error: 'fail' });

    const key = 'test:/api/items?page=1';
    expect(cache.get(key)).toBeUndefined();
  });

  it('uses req.baseUrl as default key prefix', () => {
    const middleware = cacheResponse(60);
    const req = mockReq({ baseUrl: '/custom' });
    const res = mockRes();
    middleware(req, res, () => {});

    res.json({ value: 1 });
    const key = '/custom:/api/items?page=1';
    expect(cache.get(key)).toBeDefined();
  });
});
