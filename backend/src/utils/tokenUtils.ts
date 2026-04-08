/**
 * @module utils/tokenUtils
 * JWT token generation, verification, and introspection utilities
 * for access and refresh token lifecycle management.
 */

import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

interface IUser {
  _id: { toString(): string } | Types.ObjectId;
  email: string;
  role: string;
}

interface TokenPayload {
  id: string;
  email: string;
  role: string;
  exp?: number;
}

/** Parse JWT expiry from env to seconds: "1h" -> 3600, "7d" -> 604800, "15m" -> 900, or numeric string */
function parseExpiryToSeconds(envValue: string | undefined, defaultSeconds: number): number {
  if (!envValue || envValue.trim() === '') return defaultSeconds;
  const lower = envValue.toLowerCase().trim();
  const num = Number.parseInt(lower, 10);
  // Floor of 60s prevents misconfigured env vars from creating sub-minute tokens
  if (lower.endsWith('h')) return Math.max(60, (num || 1) * 3600);
  if (lower.endsWith('d')) return Math.max(60, (num || 1) * 86400);
  if (lower.endsWith('m')) return Math.max(60, (num || 1) * 60);
  if (!Number.isNaN(num)) return Math.max(60, num);
  return defaultSeconds;
}

/**
 * Generate access and refresh tokens for a user
 * @param user - User object
 * @returns Object containing accessToken and refreshToken
 */
export const generateTokens = (user: IUser): { accessToken: string; refreshToken: string } => {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  // Defaults: 1-hour access token, 7-day refresh token.
  // Short access tokens limit exposure if leaked; long refresh tokens reduce re-login friction.
  const accessExpiry = parseExpiryToSeconds(process.env.JWT_EXPIRE, 3600);
  const refreshExpiry = parseExpiryToSeconds(process.env.JWT_REFRESH_EXPIRE, 604800);

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: 'HS256',
    expiresIn: accessExpiry,
    issuer: 'lunara-api',
    audience: 'lunara-frontend',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    algorithm: 'HS256',
    expiresIn: refreshExpiry,
    issuer: 'lunara-api',
    audience: 'lunara-frontend',
  });

  return {
    accessToken,
    refreshToken,
  };
};

/**
 * Verify an access token
 * @param token - JWT access token
 * @returns Decoded token payload
 * @throws Error - If token is invalid or expired
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    algorithms: ['HS256'],
    issuer: 'lunara-api',
    audience: 'lunara-frontend',
  }) as TokenPayload;
};

/**
 * Verify a refresh token
 * @param token - JWT refresh token
 * @returns Decoded token payload
 * @throws Error - If token is invalid or expired
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
    algorithms: ['HS256'],
    issuer: 'lunara-api',
    audience: 'lunara-frontend',
  }) as TokenPayload;
};

/**
 * Decode a JWT token without verification (for debugging)
 * @param token - JWT token
 * @returns Decoded token payload
 */
export const decodeToken = (token: string): TokenPayload | null => {
  const decoded = jwt.decode(token) as TokenPayload | null;
  return decoded ?? null;
};

/**
 * Check if a token is expired
 * @param token - JWT token
 * @returns True if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const decoded = jwt.decode(token) as TokenPayload | null;
  if (!decoded?.exp) {
    return true;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get token expiration time
 * @param token - JWT token
 * @returns Expiration date or null if invalid
 */
export const getTokenExpiration = (token: string): Date | null => {
  const decoded = jwt.decode(token) as TokenPayload | null;
  if (!decoded?.exp) {
    return null;
  }
  return new Date(decoded.exp * 1000);
};

/**
 * Extract user ID from token
 * @param token - JWT token
 * @returns User ID or null if invalid
 */
export const getUserIdFromToken = (token: string): string | null => {
  const decoded = jwt.decode(token) as TokenPayload | null;
  return decoded?.id ?? null;
};

/**
 * Get token time until expiration in seconds
 * @param token - JWT token
 * @returns Seconds until expiration or null if invalid/expired
 */
export const getTokenTimeToExpiry = (token: string): number | null => {
  const decoded = jwt.decode(token) as TokenPayload | null;
  if (!decoded?.exp) {
    return null;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  const timeToExpiry = decoded.exp - currentTime;
  return timeToExpiry > 0 ? timeToExpiry : null;
};

/**
 * Validate JWT environment variables
 * @throws Error if required environment variables are missing
 */
export const validateJWTEnvironment = (): void => {
  const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required JWT environment variables: ${missingVars.join(', ')}`);
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
  }
};
