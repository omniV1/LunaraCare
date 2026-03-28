import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { TOTP, Secret } from 'otpauth';
import User, { IUser } from '../models/User';
import Client from '../models/Client';
import Provider from '../models/Provider';
import { sendEmail } from './emailService';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils';
import logger from '../utils/logger';
import { JWTPayload } from '../types';
import { APIError } from '../utils/errors';

// ── Business-rule constants ──────────────────────────────────────────────────

/** Cap concurrent sessions per user — oldest tokens are evicted FIFO. */
export const MAX_SESSIONS = 5;

/** Number of consecutive bad passwords before the account is locked. */
export const MAX_LOGIN_ATTEMPTS = 5;

/** How long an account stays locked after too many failed logins (15 min). */
export const LOCK_DURATION_MS = 15 * 60 * 1000;

// ── Shared helpers ───────────────────────────────────────────────────────────

/** Push a refresh token onto the user document, evicting the oldest if over MAX_SESSIONS. */
export function addRefreshToken(user: IUser, token: string): void {
  user.refreshTokens.push({ token, createdAt: new Date() });
  while (user.refreshTokens.length > MAX_SESSIONS) {
    user.refreshTokens.shift();
  }
}

// ── Return types ─────────────────────────────────────────────────────────────

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'client' | 'provider';
  providerId?: string;
}

export interface RegisterResult {
  id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
}

export interface LoginResult {
  user: {
    id: unknown;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
    lastLogin: Date | undefined;
    mfaEnabled: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export interface MfaChallengeResult {
  mfaRequired: true;
  mfaToken: string;
}

export interface RefreshResult {
  accessToken: string;
  newRefreshToken: string;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Register a new user, create the role-specific profile, and send a
 * verification email.
 *
 * @throws APIError 403 — caller lacks permissions
 * @throws APIError 400 — user already exists / profile creation failed
 */
export async function registerUser(
  input: RegisterInput,
  callerRole: string | undefined
): Promise<RegisterResult> {
  // Only providers and admins can create accounts
  if (callerRole !== 'provider' && callerRole !== 'admin') {
    throw new APIError('Only providers and admins can create accounts', 403);
  }

  const { firstName, lastName, email, password, role, providerId } = input;

  // Providers can only create client accounts; only admins can create providers
  if (callerRole === 'provider' && role !== 'client') {
    throw new APIError('Providers can only create client accounts', 403);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    // Do not reveal if user exists for security
    throw new APIError('Unable to register. Please try again or use a different email.', 400);
  }

  // Create email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Create new user
  const user = new User({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role,
    isEmailVerified: process.env.SKIP_EMAIL_VERIFICATION === 'true',
    emailVerificationToken,
    emailVerificationExpires,
  });

  await user.save();

  // Create role-specific profile
  try {
    if (role === 'client') {
      const clientData: {
        userId: typeof user._id;
        assignedProvider?: string;
        onboardingSteps?: {
          profileCreated: boolean;
          intakeCompleted: boolean;
          providerAssigned: boolean;
          firstContactMade: boolean;
          careplanAssigned: boolean;
        };
      } = {
        userId: user._id,
      };

      // If providerId is provided, assign the provider to the client
      if (providerId) {
        const providerUser = await User.findById(providerId);
        if (providerUser && providerUser.role === 'provider') {
          clientData.assignedProvider = providerId;
          clientData.onboardingSteps = {
            profileCreated: true,
            intakeCompleted: false,
            providerAssigned: true,
            firstContactMade: false,
            careplanAssigned: false,
          };
        }
      }

      const clientProfile = new Client(clientData);
      await clientProfile.save();
    } else if (role === 'provider') {
      const providerProfile = new Provider({
        userId: user._id,
        status: 'active',
      });
      await providerProfile.save();
    }
  } catch (profileError: unknown) {
    logger.error('Failed to create user profile:', profileError);
    // Rollback user creation
    await User.findByIdAndDelete(user._id);
    throw new APIError('Failed to create user profile', 500);
  }

  // Send verification email (non-blocking)
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}`;
    await sendEmail({
      to: user.email,
      subject: 'Welcome to LUNARA - Verify Your Email',
      template: 'welcome',
      data: {
        firstName: user.firstName,
        verificationUrl,
      },
    });
  } catch (emailError: unknown) {
    logger.error(
      'Failed to send verification email (user was still created). Check SMTP env and provider logs above.',
      emailError
    );
    // Don't fail registration if email fails
  }

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
  };
}

/**
 * Authenticate a user with passport-local credentials.  Returns either full
 * login tokens or an MFA challenge token.
 *
 * The caller (route) must run passport.authenticate('local') first and pass
 * the resulting user (or null) plus the `info` bag.
 *
 * @throws APIError 500 — passport strategy error
 * @throws APIError 401 — invalid credentials / email not verified
 * @throws APIError 423 — account locked
 */
export async function loginUser(
  email: string,
  user: IUser | false,
  info: { message: string } | undefined,
  ipAddress: string
): Promise<LoginResult | MfaChallengeResult> {
  if (!user) {
    // Increment failed attempts for the email if user exists
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (targetUser) {
      targetUser.failedLoginAttempts = (targetUser.failedLoginAttempts || 0) + 1;
      if (targetUser.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        targetUser.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        logger.warn('Account locked due to too many failed attempts', {
          email: targetUser.email,
          attempts: targetUser.failedLoginAttempts,
        });
      }
      await targetUser.save();
    }
    throw new APIError(info?.message ?? 'Login failed', 401);
  }

  // Check if account is locked
  if (user.isLocked()) {
    const minutesLeft = Math.ceil(((user.lockUntil?.getTime() ?? 0) - Date.now()) / 60000);
    throw new APIError(
      `Too many failed login attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
      423
    );
  }

  // Check if email is verified (unless OAuth user)
  if (!user.canLogin()) {
    throw new APIError('Please verify your email address before logging in', 401);
  }

  // Reset failed login attempts on successful auth
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
  }

  // Check if MFA is enabled
  if (user.mfaEnabled) {
    const mfaToken = jwt.sign(
      { userId: user._id, purpose: 'mfa-challenge' },
      process.env.JWT_SECRET!,
      { algorithm: 'HS256', expiresIn: '5m' }
    );

    return {
      mfaRequired: true,
      mfaToken,
    };
  }

  user.lastLogin = new Date();

  const { accessToken, refreshToken } = generateTokens({
    _id: String(user._id),
    email: user.email,
    role: user.role,
  });

  addRefreshToken(user, refreshToken);
  await user.save();

  // Send login notification email (non-blocking)
  sendEmail({
    to: user.email,
    template: 'login-notification',
    data: {
      firstName: user.firstName,
      loginTime: new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' }),
      ipAddress,
      resetUrl: `${process.env.FRONTEND_URL}/forgot-password`,
    },
  }).catch((emailErr: unknown) => {
    logger.debug('Login notification email failed (non-critical):', emailErr);
  });

  return {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      mfaEnabled: user.mfaEnabled ?? false,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Rotate a refresh token: verify the old one, revoke it, and issue a fresh
 * access + refresh pair.
 *
 * @returns new tokens
 * @throws APIError 401 — token invalid / not found / reuse detected
 */
export async function refreshTokens(
  oldRefreshToken: string
): Promise<RefreshResult & { userId: string }> {
  let decoded: JWTPayload;
  try {
    decoded = verifyRefreshToken(oldRefreshToken) as JWTPayload;
  } catch (jwtErr) {
    logger.warn('Refresh token JWT invalid', {
      reason: jwtErr instanceof Error ? jwtErr.message : String(jwtErr),
    });
    throw new APIError('Invalid refresh token', 401);
  }

  const user = await User.findById(decoded.id);

  if (!user) {
    logger.warn('Refresh: user not found in DB', { userId: decoded.id });
    throw new APIError('Invalid refresh token', 401);
  }

  // Check if refresh token exists in user's tokens
  const tokenIndex = user.refreshTokens.findIndex(
    (t: { token: string; createdAt: Date }) => t.token === oldRefreshToken
  );
  if (tokenIndex === -1) {
    // Possible token reuse after rotation — potential theft. Revoke all sessions.
    user.refreshTokens = [];
    await user.save();
    logger.warn('Refresh token reuse detected, all sessions revoked', {
      userId: String(user._id),
    });
    throw new APIError('Refresh token not found — all sessions revoked for security', 401);
  }

  // Rotate: remove the old token and issue a new pair
  user.refreshTokens.splice(tokenIndex, 1);

  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    _id: String(user._id),
    email: user.email,
    role: user.role,
  });

  addRefreshToken(user, newRefreshToken);
  await user.save();

  return { accessToken, newRefreshToken, userId: String(user._id) };
}

/**
 * Revoke a single refresh token (logout).
 * If the token is expired / invalid the function still tries to remove it from
 * the database.
 */
export async function logoutUser(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken || typeof refreshToken !== 'string') {
    return; // Nothing to revoke
  }

  let userId: string | undefined;

  try {
    const decoded = verifyRefreshToken(refreshToken) as JWTPayload;
    userId = decoded.id;
  } catch {
    // Token expired or invalid — still remove it if it exists in DB
  }

  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (t: { token: string; createdAt: Date }) => t.token !== refreshToken
      );
      await user.save();
    }
  } else {
    // Fallback: search all users for this refresh token and remove it
    await User.updateOne(
      { 'refreshTokens.token': refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );
  }
}

/**
 * Validate an email-verification token and mark the user as verified.
 *
 * @throws APIError 400 — token missing / invalid / expired
 */
export async function verifyEmail(token: string | undefined): Promise<void> {
  if (!token) {
    throw new APIError('Token required', 400);
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new APIError('Email verification token is invalid or has expired', 400);
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
}

/**
 * Generate a password-reset token and email it to the user.
 * Always succeeds from the caller's perspective (to avoid leaking whether
 * an email is registered).
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email });

  if (!user) {
    return; // Do not reveal if email exists
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save();

  // Send password reset email
  try {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: 'LUNARA - Password Reset Request',
      template: 'password-reset',
      data: {
        firstName: user.firstName,
        resetUrl,
      },
    });
  } catch (emailError: unknown) {
    logger.error('Failed to send password reset email:', emailError);
  }
}

/**
 * Validate a password-reset token, update the password, and clear all
 * existing sessions for security.
 *
 * @throws APIError 400 — token invalid / expired
 */
export async function resetPassword(token: string, password: string): Promise<void> {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new APIError('Password reset token is invalid or has expired', 400);
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Clear all refresh tokens for security
  user.refreshTokens = [];
  await user.save();
}

/**
 * Verify a TOTP code (or backup code) for MFA and, if valid, complete the
 * login flow by issuing tokens.
 *
 * @throws APIError 401 — MFA session expired / invalid code
 */
export async function verifyMfa(
  mfaToken: string,
  code: string,
  ipAddress: string
): Promise<LoginResult> {
  let decoded: { userId: string; purpose: string };
  try {
    decoded = jwt.verify(mfaToken, process.env.JWT_SECRET!, {
      algorithms: ['HS256'],
    }) as { userId: string; purpose: string };
  } catch {
    throw new APIError('MFA session expired. Please log in again.', 401);
  }

  if (decoded.purpose !== 'mfa-challenge') {
    throw new APIError('Invalid MFA token', 401);
  }

  const user = await User.findById(decoded.userId).select('+mfaSecret +mfaBackupCodes');
  if (!user || !user.mfaEnabled) {
    throw new APIError('Invalid MFA session', 401);
  }

  let codeValid = false;

  // Try TOTP code (6 digits)
  if (user.mfaSecret && /^\d{6}$/.test(code)) {
    const totp = new TOTP({
      issuer: 'LUNARA',
      label: user.email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(user.mfaSecret),
    });
    const delta = totp.validate({ token: code, window: 1 });
    codeValid = delta !== null;
  }

  // Try backup code (8-char hex)
  if (!codeValid) {
    const hashedInput = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
    const backupIndex = user.mfaBackupCodes.indexOf(hashedInput);
    if (backupIndex !== -1) {
      codeValid = true;
      user.mfaBackupCodes.splice(backupIndex, 1);
    }
  }

  if (!codeValid) {
    throw new APIError('Invalid verification code', 401);
  }

  // MFA passed — complete login
  user.lastLogin = new Date();
  const { accessToken, refreshToken } = generateTokens({
    _id: String(user._id),
    email: user.email,
    role: user.role,
  });
  addRefreshToken(user, refreshToken);
  await user.save();

  sendEmail({
    to: user.email,
    template: 'login-notification',
    data: {
      firstName: user.firstName,
      loginTime: new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' }),
      ipAddress,
      resetUrl: `${process.env.FRONTEND_URL}/forgot-password`,
    },
  }).catch((emailErr: unknown) => {
    logger.debug('Login notification email failed (non-critical):', emailErr);
  });

  return {
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      mfaEnabled: user.mfaEnabled ?? false,
    },
    accessToken,
    refreshToken,
  };
}

/** Type guard: distinguishes a full login from an MFA challenge. */
export function isMfaChallenge(
  result: LoginResult | MfaChallengeResult
): result is MfaChallengeResult {
  return (result as MfaChallengeResult).mfaRequired === true;
}
