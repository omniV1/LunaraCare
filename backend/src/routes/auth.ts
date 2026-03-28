import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { isGoogleOAuthEnabled } from '../config/passport';
import rateLimit from 'express-rate-limit';
import { IUser } from '../models/User';
import { generateTokens } from '../utils/tokenUtils';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { APIError } from '../utils/errors';
import logger from '../utils/logger';
import {
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  verifyMfa,
  isMfaChallenge,
  addRefreshToken,
  RegisterInput,
} from '../services/authService';

const { body, validationResult } = require('express-validator');

// ── Refresh-token cookie helpers ───────────────────────────────────────────
// Refresh tokens are stored in an httpOnly cookie so they can't be exfiltrated
// via XSS. The cookie is scoped to /api/auth so it's only sent on auth endpoints.
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const REFRESH_COOKIE_OPTIONS: import('express').CookieOptions = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  // Cross-site in prod (frontend and backend on different domains); same-site
  // in dev (localhost ports are considered same-site).
  sameSite: IS_PRODUCTION ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches refresh token lifetime
};

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie('refreshToken', REFRESH_COOKIE_OPTIONS);
}

/** Read refresh token from httpOnly cookie, falling back to request body for
 *  backwards compatibility during the migration window. */
function getRefreshToken(req: Request): string | undefined {
  return req.cookies?.refreshToken || req.body?.refreshToken;
}

const router = express.Router();

// Tight limit on login/register/password-reset to slow credential-stuffing attacks.
// 5 attempts per 15-minute window per IP; standardHeaders exposes RateLimit-* headers
// so well-behaved clients can back off.
const sensitiveEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

interface LoginRequest {
  email: string;
  password: string;
}

interface TokenRefreshRequest {
  refreshToken: string;
}

interface EmailVerificationRequest {
  token: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "Password123"
 *               role:
 *                 type: string
 *                 enum: [client, provider]
 *                 example: "client"
 *               providerId:
 *                 type: string
 *                 description: Optional provider ID when registering a client (used when provider creates client account)
 *                 example: "60f7c2b8e1d2c8a1b8e1d2c8"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "60f7c2b8e1d2c8a1b8e1d2c8"
 *                     firstName:
 *                       type: string
 *                       example: "Jane"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     email:
 *                       type: string
 *                       example: "jane@example.com"
 *                     role:
 *                       type: string
 *                       example: "client"
 *                     isEmailVerified:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: object
 *                   example: { "email": "Must be a valid email address" }
 *                 message:
 *                   type: string
 *                   example: "Unable to register. Please try again or use a different email."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Failed to register user"
 */
const authenticate = passport.authenticate('jwt', { session: false });

router.post(
  '/register',
  authenticate,
  [
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Must be a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    body('role').isIn(['client', 'provider']).withMessage('Role must be either client or provider'),
    body('providerId').optional().trim(),
  ],
  async (
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    _next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: (() => {
            const errObj: Record<string, string> = {};
            for (const error of errors.array()) {
              errObj[error.param] = String(error.msg);
            }
            return errObj;
          })(),
        });
        return;
      }

      const input: RegisterInput = req.body;
      const result = await registerUser(input, req.user?.role);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error: unknown) {
      if (error instanceof APIError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.statusCode === 400 ? 'Registration failed' : error.message,
          message: error.statusCode === 400 ? error.message : undefined,
        });
        return;
      }

      logger.error('User registration failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to register user',
      });
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "60f7c2b8e1d2c8a1b8e1d2c8"
 *                         firstName:
 *                           type: string
 *                           example: "Jane"
 *                         lastName:
 *                           type: string
 *                           example: "Doe"
 *                         email:
 *                           type: string
 *                           example: "jane@example.com"
 *                         role:
 *                           type: string
 *                           example: "client"
 *                         isEmailVerified:
 *                           type: boolean
 *                           example: true
 *                         lastLogin:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-06-01T12:00:00.000Z"
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 errors:
 *                   type: object
 *                   example: { "email": "Must be a valid email address" }
 *       401:
 *         description: Invalid credentials or unverified email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid credentials"
 *                 message:
 *                   type: string
 *                   example: "Login failed"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Login failed"
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: 'Too many login attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/login',
  loginLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (
    req: Request<{}, ApiResponse, LoginRequest>,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: (() => {
            const errObj: Record<string, string> = {};
            for (const error of errors.array()) {
              errObj[error.param] = String(error.msg);
            }
            return errObj;
          })(),
        });
        return;
      }

      passport.authenticate(
        'local',
        { session: false },
        async (err: Error | null, user: IUser | false, info?: { message: string }): Promise<void> => {
          if (err) {
            logger.error('Passport authentication error', { message: err.message });
            res.status(500).json({
              success: false,
              error: 'Authentication error',
            });
            return;
          }

          try {
            const result = await loginUser(
              req.body.email,
              user,
              info,
              req.ip ?? 'Unknown'
            );

            if (isMfaChallenge(result)) {
              res.json({
                success: true,
                mfaRequired: true,
                mfaToken: result.mfaToken,
                message: 'MFA verification required',
              });
              return;
            }

            // Refresh token delivered via httpOnly cookie — never exposed to JS.
            setRefreshCookie(res, result.refreshToken);

            res.json({
              success: true,
              message: 'Login successful',
              data: {
                user: result.user,
                accessToken: result.accessToken,
              },
            });
          } catch (serviceError: unknown) {
            if (serviceError instanceof APIError) {
              const code = serviceError.statusCode;
              if (code === 401) {
                res.status(401).json({
                  success: false,
                  error: 'Invalid credentials',
                  message: serviceError.message,
                });
              } else if (code === 423) {
                res.status(423).json({
                  success: false,
                  error: 'Account temporarily locked',
                  message: serviceError.message,
                });
              } else {
                res.status(code).json({
                  success: false,
                  error: serviceError.message,
                });
              }
              return;
            }
            logger.error('Failed to update user login info:', serviceError);
            res.status(500).json({
              success: false,
              error: 'Login processing failed',
            });
          }
        }
      )(req, res, next);
    } catch (error: unknown) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Login failed',
      });
    }
  }
);

// ── Google OAuth ──────────────────────────────────────────────────────────────

const defaultRedirectOrigins = [
  process.env.FRONTEND_URL ?? 'https://www.lunaracare.org',
  'https://www.lunaracare.org',
  'https://lunaracare.org',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://lunara.onrender.com',
];
const allowedRedirectOrigins = new Set<string>(
  (process.env.CORS_ALLOWED_ORIGINS ?? defaultRedirectOrigins.join(','))
    .split(',')
    .map(o => o.trim())
    .filter(Boolean)
);

function getRedirectOrigin(stateOrigin: string | undefined): string {
  const fallback = process.env.FRONTEND_URL ?? 'https://www.lunaracare.org';
  if (!stateOrigin || typeof stateOrigin !== 'string') return fallback;
  const origin = stateOrigin.trim();
  if (allowedRedirectOrigins.has(origin)) return origin;
  try {
    const url = new URL(origin);
    if (
      url.protocol === 'https:' &&
      (url.hostname.endsWith('.vercel.app') ||
        url.hostname === 'lunaracare.org' ||
        url.hostname.endsWith('.lunaracare.org'))
    ) return origin;
  } catch {
    // invalid URL
  }
  return fallback;
}

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 */
function isAllowedRedirectOrigin(origin: string): boolean {
  if (allowedRedirectOrigins.has(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) return true;
    if (
      url.protocol === 'https:' &&
      (url.hostname === 'lunaracare.org' || url.hostname.endsWith('.lunaracare.org'))
    ) {
      return true;
    }
  } catch {
    // invalid
  }
  return false;
}

router.get('/google', (req: Request, res: Response, next: NextFunction) => {
  if (!isGoogleOAuthEnabled) {
    const redirectOrigin = (req.query.redirect_origin as string)?.trim();
    const base = redirectOrigin && isAllowedRedirectOrigin(redirectOrigin)
      ? redirectOrigin.trim()
      : (process.env.FRONTEND_URL ?? 'https://www.lunaracare.org');
    logger.warn('GET /auth/google: OAuth not configured on server');
    return res.redirect(`${base}/login?error=oauth_not_configured`);
  }
  const redirectOrigin = (req.query.redirect_origin as string)?.trim();
  const state = redirectOrigin && isAllowedRedirectOrigin(redirectOrigin) ? redirectOrigin : undefined;
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    ...(state && { state }),
  })(req, res, next);
});

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 */
router.get('/google/callback', (req: Request, res: Response, next: NextFunction) => {
  const q = req.query;
  const stateOrigin = (typeof q.state === 'string' && q.state) || undefined;
  const redirectBase = getRedirectOrigin(stateOrigin).replace(/\/+$/, '');

  if (typeof q.error === 'string' && q.error.length > 0) {
    const desc = typeof q.error_description === 'string' ? q.error_description : '';
    logger.warn('Google OAuth: error returned by Google on callback', {
      error: q.error,
      error_description: desc.slice(0, 500),
    });
    if (q.error === 'access_denied') {
      return res.redirect(`${redirectBase}/login?error=oauth_denied`);
    }
    return res.redirect(`${redirectBase}/login?error=oauth_failed`);
  }

  passport.authenticate('google', { session: false }, async (err: Error | null, user: IUser | false, info?: { message: string }) => {
    if (err) {
      // InternalOAuthError.toString() includes token endpoint status/body (e.g. redirect_uri_mismatch)
      logger.error(`Google OAuth: strategy error — ${err instanceof Error ? err.toString() : String(err)}`);
      return res.redirect(`${redirectBase}/login?error=oauth_failed`);
    }

    if (!user) {
      const msg = info?.message ?? '';
      let errorParam = 'oauth_failed';
      if (msg.includes('No account found')) errorParam = 'no_account';
      else if (msg.includes('verify your email')) errorParam = 'verify_email_first';
      else if (msg.includes('different Google account')) errorParam = 'google_mismatch';
      logger.warn(`Google OAuth: authentication failed (${errorParam})`, {
        infoMessage: msg || 'none',
      });
      return res.redirect(`${redirectBase}/login?error=${errorParam}`);
    }

    try {
      user.lastLogin = new Date();
      const { accessToken, refreshToken } = generateTokens({
        _id: String(user._id),
        email: user.email,
        role: user.role,
      });
      addRefreshToken(user, refreshToken);
      await user.save();

      logger.info('Google OAuth: sign-in success', { userId: String(user._id), email: user.email });

      // Refresh token set as httpOnly cookie — only accessToken goes via URL param.
      setRefreshCookie(res, refreshToken);

      const params = new URLSearchParams({
        token: accessToken,
        userId: String(user._id),
      });
      return res.redirect(`${redirectBase}/login?oauth=success&${params.toString()}`);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      return res.redirect(`${redirectBase}/login?error=oauth_failed`);
    }
  })(req, res, next);
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token (refresh token read from httpOnly cookie)
 *     tags: [Authentication]
 *     description: >
 *       Reads the refresh token from the `refreshToken` httpOnly cookie.
 *       Falls back to request body for backwards compatibility.
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Internal server error
 */
router.post(
  '/refresh',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false }),
  async (
    req: Request<{}, ApiResponse, TokenRefreshRequest>,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const oldRefreshToken = getRefreshToken(req);

      if (!oldRefreshToken) {
        logger.warn('Refresh: no refresh token in cookie or body');
        res.status(401).json({
          success: false,
          error: 'Refresh token required',
        });
        return;
      }

      const { accessToken, newRefreshToken } = await refreshTokens(oldRefreshToken);

      setRefreshCookie(res, newRefreshToken);

      res.json({
        success: true,
        data: {
          accessToken,
        },
      });
    } catch (error: unknown) {
      if (error instanceof APIError) {
        clearRefreshCookie(res);
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
        return;
      }
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  }
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and invalidate refresh token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logout successful
 *       500:
 *         description: Internal server error
 */
router.post(
  '/logout',
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    try {
      const refreshToken = getRefreshToken(req);

      await logoutUser(refreshToken);
      clearRefreshCookie(res);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error: unknown) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }
);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.post(
  '/verify-email',
  sensitiveEndpointLimiter,
  async (
    req: Request<{}, ApiResponse, EmailVerificationRequest>,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      await verifyEmail(req.body.token);

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error: unknown) {
      if (error instanceof APIError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.statusCode === 400 ? 'Invalid or expired token' : error.message,
          message: error.message,
        });
        return;
      }
      logger.error('Email verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Email verification failed',
      });
    }
  }
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       500:
 *         description: Internal server error
 */
router.post(
  '/forgot-password',
  sensitiveEndpointLimiter,
  [body('email').isEmail().normalizeEmail()],
  async (
    req: Request<{}, ApiResponse, ForgotPasswordRequest>,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      await forgotPassword(req.body.email);

      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
      });
    } catch (error: unknown) {
      logger.error('Forgot password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request',
      });
    }
  }
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Internal server error
 */
router.post(
  '/reset-password',
  sensitiveEndpointLimiter,
  [
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
  ],
  async (
    req: Request<{}, ApiResponse, ResetPasswordRequest>,
    res: Response<ApiResponse>
  ): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors: (() => {
            const errObj: Record<string, string> = {};
            for (const error of errors.array()) {
              errObj[error.param] = String(error.msg);
            }
            return errObj;
          })(),
        });
        return;
      }

      await resetPassword(req.body.token, req.body.password);

      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error: unknown) {
      if (error instanceof APIError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.statusCode === 400 ? 'Invalid or expired token' : error.message,
          message: error.message,
        });
        return;
      }
      logger.error('Password reset error:', error);
      res.status(500).json({
        success: false,
        error: 'Password reset failed',
      });
    }
  }
);

/**
 * POST /auth/mfa/verify
 * Complete login by verifying TOTP code after MFA challenge.
 */
router.post(
  '/mfa/verify',
  sensitiveEndpointLimiter,
  [
    body('mfaToken').isString().notEmpty().withMessage('MFA token required'),
    body('code').isString().notEmpty().withMessage('Verification code required'),
  ],
  async (req: Request, res: Response<ApiResponse>): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, error: 'Validation failed' });
      return;
    }

    try {
      const { mfaToken, code } = req.body;

      const result = await verifyMfa(mfaToken, code, req.ip ?? 'Unknown');

      setRefreshCookie(res, result.refreshToken);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error: unknown) {
      if (error instanceof APIError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message,
        });
        return;
      }
      logger.error('MFA verify error:', error);
      res.status(500).json({ success: false, error: 'MFA verification failed' });
    }
  }
);

export default router;
