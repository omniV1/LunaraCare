/**
 * Unit tests for backend middleware: requestLogger, handleValidationErrors,
 * asyncHandler, errorHandler, notFoundHandler, rateLimitHandler, securityHeaders,
 * sanitizeRequest, responseFormatter.
 */
import { Request, Response } from 'express';

jest.mock('express-validator', () => ({
  validationResult: jest.fn(),
}));
import {
  requestLogger,
  handleValidationErrors,
  asyncHandler,
  errorHandler,
  notFoundHandler,
  rateLimitHandler,
  securityHeaders,
  sanitizeRequest,
  responseFormatter,
} from '../../src/middleware';
import { BadRequestError, ValidationError } from '../../src/utils/errors';

describe('Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: jest.Mock;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      originalUrl: '/api/test',
      ip: '127.0.0.1',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      on: jest.fn(),
      removeHeader: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
    nextFn = jest.fn();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requestLogger', () => {
    it('sets req.startTime and calls next', () => {
      requestLogger(
        mockReq as Request,
        mockRes as Response,
        nextFn
      );
      expect(mockReq.startTime).toBeDefined();
      expect(typeof mockReq.startTime).toBe('number');
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('handleValidationErrors', () => {
    it('calls next when no validation errors', () => {
      const { validationResult } = require('express-validator');
      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => true,
        array: () => [],
      });
      handleValidationErrors(mockReq as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });

    it('sends 422 when validation has errors', () => {
      const { validationResult } = require('express-validator');
      (validationResult as jest.Mock).mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { path: 'email', msg: 'Invalid email', value: 'x' },
          { path: 'password', msg: 'Too short', value: 'ab' },
        ],
      });
      handleValidationErrors(mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          details: [
            { field: 'email', message: 'Invalid email', value: 'x' },
            { field: 'password', message: 'Too short', value: 'ab' },
          ],
        })
      );
      expect(nextFn).not.toHaveBeenCalled();
    });
  });

  describe('asyncHandler', () => {
    it('calls the wrapped handler and passes through', async () => {
      const handler = asyncHandler(async (_req, _res, next) => {
        next();
      });
      handler(mockReq as Request, mockRes as Response, nextFn);
      await Promise.resolve();
      expect(nextFn).toHaveBeenCalled();
    });

    it('catches async errors and passes to next', async () => {
      const handler = asyncHandler(async () => {
        throw new Error('Async failure');
      });
      handler(mockReq as Request, mockRes as Response, nextFn);
      await new Promise((r) => setImmediate(r));
      expect(nextFn).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('errorHandler', () => {
    it('sends APIError with statusCode and message', () => {
      const err = new BadRequestError('Invalid input');
      errorHandler(err, mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid input',
        })
      );
    });

    it('sends ValidationError with details', () => {
      const err = new ValidationError('Validation failed', [
        { field: 'email', message: 'Invalid' },
      ]);
      errorHandler(err, mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Validation failed',
          details: [{ field: 'email', message: 'Invalid' }],
        })
      );
    });

    it('sends 500 for generic Error in production', () => {
      const orig = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const err = new Error('Unexpected');
      Object.assign(err, { statusCode: undefined });
      errorHandler(err, mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal Server Error',
        })
      );
      process.env.NODE_ENV = orig;
    });

    it('sends message and stack in development for 500', () => {
      const orig = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      const err = new Error('Unexpected');
      Object.assign(err, { statusCode: undefined });
      errorHandler(err, mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      const call = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(call.error).toBe('Unexpected');
      expect(call.stack).toBeDefined();
      process.env.NODE_ENV = orig;
    });
  });

  describe('notFoundHandler', () => {
    it('sends 404 with route message', () => {
      notFoundHandler(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Route not found',
          message: expect.stringContaining('/api/test'),
        })
      );
    });
  });

  describe('rateLimitHandler', () => {
    it('sends 429 with retryAfter from req.rateLimit', () => {
      const resetTime = new Date();
      Object.assign(mockReq, { rateLimit: { resetTime } });
      rateLimitHandler(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Too many requests',
          retryAfter: resetTime,
        })
      );
    });
  });

  describe('securityHeaders', () => {
    it('removes X-Powered-By and sets security headers', () => {
      securityHeaders(mockReq as Request, mockRes as Response, nextFn);
      expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('sanitizeRequest', () => {
    it('trims string values in req.body', () => {
      Object.assign(mockReq, { body: { name: '  foo  ', nested: { title: '  bar  ' } } });
      sanitizeRequest(mockReq as Request, mockRes as Response, nextFn);
      expect((mockReq as Request).body.name).toBe('foo');
      expect((mockReq as Request).body.nested.title).toBe('bar');
      expect(nextFn).toHaveBeenCalled();
    });

    it('calls next when body is empty', () => {
      sanitizeRequest(mockReq as Request, mockRes as Response, nextFn);
      expect(nextFn).toHaveBeenCalled();
    });
  });

  describe('responseFormatter', () => {
    it('adds res.success and res.error helpers', () => {
      responseFormatter(mockReq as Request, mockRes as Response, nextFn);
      const formatted = mockRes as Record<string, unknown>;
      expect(formatted.success).toBeDefined();
      expect(formatted.error).toBeDefined();
      expect(nextFn).toHaveBeenCalled();
    });

    it('res.success sends 200 with data and message', () => {
      responseFormatter(mockReq as Request, mockRes as Response, nextFn);
      (mockRes as unknown as Record<string, Function>).success({ id: '1' }, 'Created', 201);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Created',
          data: { id: '1' },
        })
      );
    });

    it('res.error sends status with message and optional details', () => {
      responseFormatter(mockReq as Request, mockRes as Response, nextFn);
      (mockRes as unknown as Record<string, Function>).error('Not found', 404, { field: 'id' });
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Not found',
          details: { field: 'id' },
        })
      );
    });
  });
});
