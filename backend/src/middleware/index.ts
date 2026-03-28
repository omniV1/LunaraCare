import { Request, Response, NextFunction } from 'express';
import { ValidationError as ExpressValidationError, validationResult } from 'express-validator';
import passport from 'passport';
import { APIError, handleMongooseError, handleJWTError, ValidationError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

// Extend Express Request interface to include custom properties
declare global {
  namespace Express {
    interface Request {
      startTime?: number;
      rateLimit?: {
        resetTime?: Date;
        limit?: number;
        current?: number;
      };
    }
    interface Response {
      success?: (data: unknown, message?: string, statusCode?: number) => void;
      error?: (message: string, statusCode?: number, details?: unknown) => void;
    }
  }
}

/**
 * Request timing and logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  req.startTime = Date.now();

  logger.debug('%s %s - %s', req.method, req.originalUrl, req.ip);

  res.on('finish', () => {
    const duration = Date.now() - (req.startTime ?? 0);
    const level = res.statusCode >= 400 ? 'warn' : 'debug';
    logger[level]('%s %s %d %dms', req.method, req.originalUrl, res.statusCode, duration);
  });

  next();
};

/**
 * Validation error handler middleware
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const validationErrors = errors.array().map((error: ExpressValidationError) => ({
      field: 'path' in error ? error.path : 'unknown',
      message: error.msg,
      value: 'value' in error ? error.value : undefined,
    }));

    res.status(422).json({
      success: false,
      error: 'Validation failed',
      details: validationErrors,
    });
    return;
  }

  next();
};

/**
 * Async error wrapper to catch async route errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handling middleware
 */
export const errorHandler = (err: Error & { statusCode?: number; code?: number; name: string; details?: unknown }, _req: Request, res: Response, _next: NextFunction): void => {
  let error: { message: string; statusCode?: number; code?: number; name?: string; stack?: string } = { ...err, message: err.message };

  logger.error('Server Error:', err);

  // API Errors (our custom errors) - check before Mongoose so ValidationError is handled correctly
  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err instanceof ValidationError && err.details ? { details: err.details } : {}),
    });
    return;
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.code === 11000) {
    error = handleMongooseError(err);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    error = handleJWTError(err);
  }

  // Converted API errors (from Mongoose/JWT above)
  if (error instanceof APIError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error instanceof ValidationError && error.details ? { details: error.details } : {}),
    });
    return;
  }

  // Express validation errors
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }

  // Default server error
  const statusCode = error.statusCode ?? 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal Server Error'
      : error.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Role-based access control middleware
 * @param allowedRoles - Array of roles that are permitted (e.g. ['provider', 'admin'])
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const role = req.user?.role;
    if (role && allowedRoles.includes(role)) {
      return next();
    }
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: 'You do not have permission to access this resource',
    });
  };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
  });
};

/**
 * Rate limiting error handler
 */
export const rateLimitHandler = (req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: req.rateLimit?.resetTime,
  });
};

// CORS is handled by the 'cors' package in server.ts
// This handler was removed to eliminate duplication

/**
 * Security headers middleware
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Remove Express signature
  res.removeHeader('X-Powered-By');

  // Add security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Request sanitization middleware
 */
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
  // Remove any potentially dangerous characters from request body
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj: Record<string, unknown>): void => {
      for (const key in obj) {
        if (typeof obj[key] === 'string') {
          obj[key] = obj[key].trim();
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key] as Record<string, unknown>);
        }
      }
    };
    sanitize(req.body);
  }

  next();
};

/**
 * Response format middleware
 */
export const responseFormatter = (_req: Request, res: Response, next: NextFunction): void => {
  // Add success response helper
  res.success = (data: unknown, message: string = 'Success', statusCode: number = 200): void => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  };

  // Add error response helper
  res.error = (message: string, statusCode: number = 500, details: unknown = null): void => {
    const body: Record<string, unknown> = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    };
    if (details) body.details = details;
    res.status(statusCode).json(body);
  };

  next();
};

/**
 * JWT authentication middleware.
 * Uses passport's default behavior for compatibility with the auth flow.
 */
export const authenticate = passport.authenticate('jwt', { session: false });
