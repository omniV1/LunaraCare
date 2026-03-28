import { Types } from 'mongoose';
import {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  isTokenExpired,
  getTokenExpiration,
  getUserIdFromToken,
  getTokenTimeToExpiry,
  validateJWTEnvironment,
} from '../../src/utils/tokenUtils';

describe('Token Utils', () => {
  const mockUser = {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    role: 'client',
  };

  // Setup test environment variables
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
  });

  describe('validateJWTEnvironment', () => {
    it('should not throw when JWT secrets are properly set', () => {
      expect(() => validateJWTEnvironment()).not.toThrow();
    });

    it('should throw when JWT_SECRET is missing', () => {
      const original = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;
      
      expect(() => validateJWTEnvironment()).toThrow('Missing required JWT environment variables');
      
      process.env.JWT_SECRET = original;
    });

    it('should throw when JWT_REFRESH_SECRET is missing', () => {
      const original = process.env.JWT_REFRESH_SECRET;
      delete process.env.JWT_REFRESH_SECRET;
      
      expect(() => validateJWTEnvironment()).toThrow('Missing required JWT environment variables');
      
      process.env.JWT_REFRESH_SECRET = original;
    });

    it('should throw when secrets are the same', () => {
      const originalRefresh = process.env.JWT_REFRESH_SECRET;
      process.env.JWT_REFRESH_SECRET = process.env.JWT_SECRET;
      
      expect(() => validateJWTEnvironment()).toThrow('must be different');
      
      process.env.JWT_REFRESH_SECRET = originalRefresh;
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const tokens = generateTokens(mockUser);
      
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should include user data in token payload', () => {
      const tokens = generateTokens(mockUser);
      const decoded = decodeToken(tokens.accessToken);
      
      expect(decoded).toBeTruthy();
      expect(decoded!.id).toBe(mockUser._id.toString());
      expect(decoded!.email).toBe(mockUser.email);
      expect(decoded!.role).toBe(mockUser.role);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const tokens = generateTokens(mockUser);
      const payload = verifyAccessToken(tokens.accessToken);
      
      expect(payload.id).toBe(mockUser._id.toString());
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw error for refresh token used as access token', () => {
      const tokens = generateTokens(mockUser);
      expect(() => verifyAccessToken(tokens.refreshToken)).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const tokens = generateTokens(mockUser);
      const payload = verifyRefreshToken(tokens.refreshToken);
      
      expect(payload.id).toBe(mockUser._id.toString());
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });

    it('should throw error for access token used as refresh token', () => {
      const tokens = generateTokens(mockUser);
      expect(() => verifyRefreshToken(tokens.accessToken)).toThrow();
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const tokens = generateTokens(mockUser);
      const decoded = decodeToken(tokens.accessToken);
      
      expect(decoded).toBeTruthy();
      expect(decoded!.id).toBe(mockUser._id.toString());
      expect(decoded!.email).toBe(mockUser.email);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should decode without verifying signature', () => {
      const tokens = generateTokens(mockUser);
      const decoded = decodeToken(tokens.accessToken);
      expect(decoded).toBeTruthy();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for a fresh token', () => {
      const tokens = generateTokens(mockUser);
      expect(isTokenExpired(tokens.accessToken)).toBe(false);
    });

    it('should return true for invalid token', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });

    it('should return true for malformed token', () => {
      expect(isTokenExpired('not.a.jwt')).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return expiration date for valid token', () => {
      const tokens = generateTokens(mockUser);
      const expiration = getTokenExpiration(tokens.accessToken);
      
      expect(expiration).toBeInstanceOf(Date);
      expect(expiration!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const expiration = getTokenExpiration('invalid-token');
      expect(expiration).toBeNull();
    });
  });

  describe('getUserIdFromToken', () => {
    it('should extract user ID from valid token', () => {
      const tokens = generateTokens(mockUser);
      const userId = getUserIdFromToken(tokens.accessToken);
      
      expect(userId).toBe(mockUser._id.toString());
    });

    it('should return null for invalid token', () => {
      const userId = getUserIdFromToken('invalid-token');
      expect(userId).toBeNull();
    });
  });

  describe('getTokenTimeToExpiry', () => {
    it('should return positive time for fresh token', () => {
      const tokens = generateTokens(mockUser);
      const timeToExpiry = getTokenTimeToExpiry(tokens.accessToken);
      
      expect(timeToExpiry).toBeGreaterThan(0);
      expect(timeToExpiry).toBeLessThanOrEqual(3600); // 1 hour max
    });

    it('should return null for invalid token', () => {
      const timeToExpiry = getTokenTimeToExpiry('invalid-token');
      expect(timeToExpiry).toBeNull();
    });
  });

  describe('Token Lifecycle', () => {
    it('should create tokens with different expiration times', () => {
      const tokens = generateTokens(mockUser);
      
      const accessExpiry = getTokenExpiration(tokens.accessToken);
      const refreshExpiry = getTokenExpiration(tokens.refreshToken);
      
      expect(refreshExpiry!.getTime()).toBeGreaterThan(accessExpiry!.getTime());
    });

    it('should maintain user data through decode cycle', () => {
      const tokens = generateTokens(mockUser);
      const decoded = decodeToken(tokens.accessToken);
      
      expect(decoded!.id).toBe(mockUser._id.toString());
      expect(decoded!.email).toBe(mockUser.email);
      expect(decoded!.role).toBe(mockUser.role);
    });
  });
});

