/**
 * @module utils/errors
 * Custom API error classes and error-conversion helpers for
 * consistent HTTP error responses across the application.
 */

import { Error as MongooseError } from 'mongoose';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';

interface ValidationErrorDetail {
  field: string;
  message: string;
}

/**
 * Base API Error class with HTTP status codes
 */
export class APIError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class BadRequestError extends APIError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized - Authentication required or failed
 */
export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * 403 Forbidden - User doesn't have permission
 */
export class ForbiddenError extends APIError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 409 Conflict - Resource already exists or state conflict
 */
export class ConflictError extends APIError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

/**
 * 422 Unprocessable Entity - Validation errors
 */
export class ValidationError extends APIError {
  details: ValidationErrorDetail[] | null;

  constructor(message = 'Validation failed', details: ValidationErrorDetail[] | null = null) {
    super(message, 422);
    this.details = details;
  }
}

/**
 * 429 Too Many Requests - Rate limit exceeded
 */
export class RateLimitError extends APIError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * 500 Internal Server Error - Unexpected server errors
 */
export class InternalServerError extends APIError {
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

/**
 * 503 Service Unavailable - External service down
 */
export class ServiceUnavailableError extends APIError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503);
  }
}

/**
 * Database connection errors
 */
export class DatabaseError extends APIError {
  constructor(message = 'Database operation failed') {
    super(message, 503);
  }
}

/**
 * External API errors
 */
export class ExternalAPIError extends APIError {
  service: string;

  constructor(service: string, message = 'External service error') {
    super(`${service}: ${message}`, 502);
    this.service = service;
  }
}

/**
 * Email service errors
 */
export class EmailError extends APIError {
  constructor(message = 'Email service error') {
    super(message, 502);
  }
}

/**
 * File upload errors
 */
export class FileUploadError extends APIError {
  constructor(message = 'File upload failed') {
    super(message, 400);
  }
}

/**
 * JWT token errors
 */
export class TokenError extends APIError {
  constructor(message = 'Invalid token') {
    super(message, 401);
  }
}

/**
 * Check if error is operational (expected) vs programming error
 */
export const isOperationalError = (error: unknown): boolean => {
  if (error instanceof APIError) {
    return error.isOperational;
  }
  return false;
};

interface MongooseValidationError extends MongooseError.ValidationError {
  errors: {
    [key: string]: MongooseError.ValidatorError | MongooseError.CastError;
  };
}

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, any>;
}

/**
 * Convert Mongoose errors to API errors
 */
export const handleMongooseError = (error: MongooseError | MongoError): APIError => {
  if (error.name === 'ValidationError') {
    const validationError = error as MongooseValidationError;
    const details = Object.values(validationError.errors).map(err => ({
      field: err.path,
      message: err.message,
    }));
    return new ValidationError('Validation failed', details);
  }

  if (error.name === 'CastError') {
    const castError = error as MongooseError.CastError;
    return new BadRequestError(`Invalid ${castError.path}: ${castError.value}`);
  }

  if ((error as MongoError).code === 11000) {
    const duplicateError = error as MongoError;
    const field = Object.keys(duplicateError.keyValue || {})[0];
    return new ConflictError(`${field} already exists`);
  }

  if (error.name === 'MongoNetworkError') {
    return new DatabaseError('Database connection failed');
  }

  return new InternalServerError('Database operation failed');
};

/**
 * Convert JWT errors to API errors
 */
export const handleJWTError = (error: Error): TokenError => {
  if (error instanceof JsonWebTokenError) {
    return new TokenError('Invalid token');
  }

  if (error instanceof TokenExpiredError) {
    return new TokenError('Token expired');
  }

  if (error instanceof NotBeforeError) {
    return new TokenError('Token not active');
  }

  return new TokenError('Token error');
};
