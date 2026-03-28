import {
  APIError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalAPIError,
  EmailError,
  FileUploadError,
  TokenError,
  isOperationalError,
  handleMongooseError,
  handleJWTError,
} from '../../src/utils/errors';
import { JsonWebTokenError, TokenExpiredError, NotBeforeError } from 'jsonwebtoken';

describe('Error Classes', () => {
  describe('APIError', () => {
    it('should create an API error with default values', () => {
      const error = new APIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('APIError');
    });

    it('should create an API error with custom status code', () => {
      const error = new APIError('Test error', 404);
      expect(error.statusCode).toBe(404);
    });

    it('should create a non-operational error', () => {
      const error = new APIError('Test error', 500, false);
      expect(error.isOperational).toBe(false);
    });
  });

  describe('BadRequestError', () => {
    it('should create a 400 error with default message', () => {
      const error = new BadRequestError();
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
    });

    it('should create a 400 error with custom message', () => {
      const error = new BadRequestError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Authentication required');
      expect(error.message).toBe('Authentication required');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a 403 error', () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error', () => {
      const error = new NotFoundError();
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should accept custom message', () => {
      const error = new NotFoundError('User not found');
      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 error', () => {
      const error = new ConflictError();
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe('Resource conflict');
    });
  });

  describe('ValidationError', () => {
    it('should create a 422 error without details', () => {
      const error = new ValidationError();
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Validation failed');
      expect(error.details).toBeNull();
    });

    it('should create a 422 error with validation details', () => {
      const details = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too short' },
      ];
      const error = new ValidationError('Validation failed', details);
      expect(error.details).toEqual(details);
    });
  });

  describe('RateLimitError', () => {
    it('should create a 429 error', () => {
      const error = new RateLimitError();
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too many requests');
    });
  });

  describe('InternalServerError', () => {
    it('should create a 500 error', () => {
      const error = new InternalServerError();
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create a 503 error', () => {
      const error = new ServiceUnavailableError();
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Service temporarily unavailable');
    });
  });

  describe('DatabaseError', () => {
    it('should create a 503 error', () => {
      const error = new DatabaseError();
      expect(error.statusCode).toBe(503);
      expect(error.message).toBe('Database operation failed');
    });
  });

  describe('ExternalAPIError', () => {
    it('should create a 502 error with service name', () => {
      const error = new ExternalAPIError('Stripe');
      expect(error.statusCode).toBe(502);
      expect(error.service).toBe('Stripe');
      expect(error.message).toContain('Stripe');
    });

    it('should accept custom message', () => {
      const error = new ExternalAPIError('Stripe', 'Payment failed');
      expect(error.message).toBe('Stripe: Payment failed');
    });
  });

  describe('EmailError', () => {
    it('should create a 502 error', () => {
      const error = new EmailError();
      expect(error.statusCode).toBe(502);
      expect(error.message).toBe('Email service error');
    });
  });

  describe('FileUploadError', () => {
    it('should create a 400 error', () => {
      const error = new FileUploadError();
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('File upload failed');
    });
  });

  describe('TokenError', () => {
    it('should create a 401 error', () => {
      const error = new TokenError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Invalid token');
    });
  });
});

describe('Error Utility Functions', () => {
  describe('isOperationalError', () => {
    it('should return true for operational API errors', () => {
      const error = new BadRequestError();
      expect(isOperationalError(error)).toBe(true);
    });

    it('should return false for non-operational errors', () => {
      const error = new APIError('Test', 500, false);
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for non-API errors', () => {
      const error = new Error('Standard error');
      expect(isOperationalError(error)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isOperationalError(null)).toBe(false);
      expect(isOperationalError(undefined)).toBe(false);
    });
  });

  describe('handleMongooseError', () => {
    it('should handle ValidationError', () => {
      const mongooseError: any = {
        name: 'ValidationError',
        errors: {
          email: {
            path: 'email',
            message: 'Email is required',
          },
          password: {
            path: 'password',
            message: 'Password is required',
          },
        },
      };

      const result = handleMongooseError(mongooseError);
      expect(result).toBeInstanceOf(ValidationError);
      expect(result.statusCode).toBe(422);
      expect((result as ValidationError).details).toHaveLength(2);
    });

    it('should handle CastError', () => {
      const castError: any = {
        name: 'CastError',
        path: 'userId',
        value: 'invalid-id',
      };

      const result = handleMongooseError(castError);
      expect(result).toBeInstanceOf(BadRequestError);
      expect(result.message).toContain('userId');
      expect(result.message).toContain('invalid-id');
    });

    it('should handle duplicate key error (code 11000)', () => {
      const duplicateError: any = {
        name: 'MongoError',
        code: 11000,
        keyValue: { email: 'test@example.com' },
      };

      const result = handleMongooseError(duplicateError);
      expect(result).toBeInstanceOf(ConflictError);
      expect(result.message).toContain('email');
      expect(result.message).toContain('already exists');
    });

    it('should handle MongoNetworkError', () => {
      const networkError: any = {
        name: 'MongoNetworkError',
        message: 'Connection failed',
      };

      const result = handleMongooseError(networkError);
      expect(result).toBeInstanceOf(DatabaseError);
      expect(result.message).toBe('Database connection failed');
    });

    it('should return InternalServerError for unknown errors', () => {
      const unknownError: any = {
        name: 'UnknownError',
        message: 'Something went wrong',
      };

      const result = handleMongooseError(unknownError);
      expect(result).toBeInstanceOf(InternalServerError);
      expect(result.message).toBe('Database operation failed');
    });
  });

  describe('handleJWTError', () => {
    it('should handle JsonWebTokenError (base class)', () => {
      const jwtError = new JsonWebTokenError('invalid signature');
      const result = handleJWTError(jwtError);
      expect(result).toBeInstanceOf(TokenError);
      // JsonWebTokenError is checked first, so all JWT errors become "Invalid token"
      expect(result.message).toBe('Invalid token');
    });

    it('should handle TokenExpiredError as JsonWebTokenError', () => {
      const expiredError = new TokenExpiredError('jwt expired', new Date());
      const result = handleJWTError(expiredError);
      expect(result).toBeInstanceOf(TokenError);
      // TokenExpiredError extends JsonWebTokenError, so caught by first instanceof check
      expect(result.message).toBe('Invalid token');
    });

    it('should handle NotBeforeError as JsonWebTokenError', () => {
      const notBeforeError = new NotBeforeError('jwt not active', new Date());
      const result = handleJWTError(notBeforeError);
      expect(result).toBeInstanceOf(TokenError);
      // NotBeforeError extends JsonWebTokenError, so caught by first instanceof check
      expect(result.message).toBe('Invalid token');
    });

    it('should handle generic JWT errors', () => {
      const genericError = new Error('Unknown JWT error');
      const result = handleJWTError(genericError);
      expect(result).toBeInstanceOf(TokenError);
      expect(result.message).toBe('Token error');
    });
  });
});

