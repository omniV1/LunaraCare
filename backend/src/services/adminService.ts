/**
 * @module services/adminService
 * Administrative operations for managing provider accounts.
 * Handles provider creation with User + Provider profile setup
 * and triggers email verification on registration.
 */

import crypto from 'node:crypto';
import User from '../models/User';
import Provider from '../models/Provider';
import { sendEmail } from './emailService';
import logger from '../utils/logger';
import { ConflictError } from '../utils/errors';

// ── Input / Result types ─────────────────────────────────────────────────────

/** Fields required to create a new provider account. */
export interface CreateProviderInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/** Sanitised provider data returned after successful creation. */
export interface CreateProviderResult {
  id: unknown;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Create a new provider user, associated Provider profile, and send a
 * verification email.
 *
 * @param data - Provider registration fields
 * @returns Sanitised provider record (no password or tokens)
 * @throws ConflictError — user with this email already exists
 */
export async function createProvider(
  data: CreateProviderInput
): Promise<CreateProviderResult> {
  const { firstName, lastName, email, password } = data;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ConflictError('User with this email already exists.');
  }

  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const user = new User({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role: 'provider',
    isEmailVerified: process.env.SKIP_EMAIL_VERIFICATION === 'true',
    emailVerificationToken,
    emailVerificationExpires,
  });

  await user.save();

  try {
    const providerProfile = new Provider({
      userId: user._id,
      status: 'active',
    });
    await providerProfile.save();
  } catch (profileError) {
    await User.findByIdAndDelete(user._id);
    throw profileError;
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
    // Non-fatal: user can still verify later — but log so ops can fix SMTP
    logger.error('Failed to send provider verification email:', emailError);
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
