/**
 * @module services/userService
 * Authenticated user self-service operations: profile retrieval/update,
 * password change, account deletion with cascading data cleanup, and
 * notification preference management.
 */

import mongoose from 'mongoose';
import User, { IUser } from '../models/User';
import Client, { IClientDocument } from '../models/Client';
import Provider, { IProviderDocument } from '../models/Provider';
import Message from '../models/Message';
import Appointment from '../models/Appointment';
import CheckIn from '../models/CheckIn';
import ClientDocument from '../models/ClientDocument';
import CarePlan from '../models/CarePlan';
import { sendRawEmail } from './emailService';
import logger from '../utils/logger';
import { UnauthorizedError, NotFoundError, BadRequestError } from '../utils/errors';

// ── Types ────────────────────────────────────────────────────────────────────

type RoleProfile = IClientDocument | IProviderDocument | null;

/** User document paired with their role-specific profile (Client or Provider). */
export interface ProfileResponse {
  user: IUser;
  profile: RoleProfile;
}

/** Mutable fields when updating a user's profile. */
export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  profile?: Record<string, unknown>;
  babyBirthDate?: string;
  dueDate?: string;
  birthDate?: string;
}

/** Result after a successful profile update. */
export interface UpdateProfileResult {
  message: string;
  user: IUser;
  profile: RoleProfile;
}

interface ClientDateUpdates {
  babyBirthDate?: string;
  dueDate?: string;
  birthDate?: string;
}

/** Per-channel notification preferences stored in the user profile. */
export interface NotificationPreferences {
  emailNotifications: boolean;
  appointmentReminders: boolean;
  messageAlerts: boolean;
  checkInReminders: boolean;
  loginAlerts: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const validateAndSetDate = (dateString: string): Date | null => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const updateClientDates = (client: IClientDocument, updates: ClientDateUpdates): string | null => {
  if (updates.babyBirthDate) {
    const birthDate = validateAndSetDate(updates.babyBirthDate);
    if (!birthDate) {
      return 'Invalid date format for babyBirthDate';
    }
    client.babyBirthDate = birthDate;
    logger.debug('Updated babyBirthDate:', {
      input: updates.babyBirthDate,
      converted: birthDate,
      iso: birthDate.toISOString(),
    });
  }
  if (updates.dueDate) {
    const dueDate = validateAndSetDate(updates.dueDate);
    if (!dueDate) {
      return 'Invalid date format for dueDate';
    }
    client.dueDate = dueDate;
  }
  if (updates.birthDate) {
    const birthDate = validateAndSetDate(updates.birthDate);
    if (!birthDate) {
      return 'Invalid date format for birthDate';
    }
    client.birthDate = birthDate;
  }
  return null;
};

const getRoleProfile = async (
  role: string,
  userId: mongoose.Types.ObjectId,
): Promise<RoleProfile> => {
  if (role === 'client') {
    return await Client.findOne({ userId });
  }
  if (role === 'provider' || role === 'admin') {
    return await Provider.findOne({ userId });
  }
  return null;
};

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Get the current user's profile with role-specific data.
 *
 * @param user - Authenticated user document
 * @returns User and their role-specific profile (Client or Provider)
 */
export async function getProfile(user: IUser): Promise<ProfileResponse> {
  const userId = user._id;
  let roleProfile: RoleProfile = null;
  if (user.role === 'client') {
    roleProfile = await Client.findOne({ userId });
  } else if (user.role === 'provider' || user.role === 'admin') {
    roleProfile = await Provider.findOne({ userId });
  }
  return {
    user,
    profile: roleProfile,
  };
}

/**
 * Update the current user's profile.
 *
 * @param user - Authenticated user document
 * @param updates - Fields to update (name, profile, dates)
 * @returns Success message with updated user and profile
 * @throws BadRequestError -- invalid date format
 */
export async function updateProfile(
  user: IUser,
  updates: UpdateProfileInput,
): Promise<UpdateProfileResult> {
  if (updates.firstName) user.firstName = updates.firstName;
  if (updates.lastName) user.lastName = updates.lastName;
  if (updates.profile) {
    user.profile = { ...user.profile, ...updates.profile } as typeof user.profile;
  }
  await user.save();

  if (user.role === 'client') {
    const client = await Client.findOne({ userId: user._id });
    if (client) {
      const dateError = updateClientDates(client, updates);
      if (dateError) {
        throw new BadRequestError(dateError);
      }
      await client.save();
      logger.debug('Client saved with babyBirthDate:', client.babyBirthDate);
    }
  }

  const roleProfile = await getRoleProfile(user.role, user._id as mongoose.Types.ObjectId);

  return {
    message: 'Profile updated successfully',
    user,
    profile: roleProfile,
  };
}

/**
 * Change the user's password, revoke all sessions, and send notification email.
 *
 * @param userId - User's ObjectId
 * @param currentPassword - Current password for re-authentication
 * @param newPassword - New password to set
 * @returns Success message
 * @throws NotFoundError -- user not found
 * @throws UnauthorizedError -- current password is incorrect
 */
export async function changePassword(
  userId: mongoose.Types.ObjectId,
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const fullUser = await User.findById(userId).select('+password');
  if (!fullUser) {
    throw new NotFoundError('User not found');
  }

  const isMatch = await fullUser.comparePassword(currentPassword);
  if (!isMatch) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  fullUser.password = newPassword;
  fullUser.refreshTokens = [];
  await fullUser.save();

  sendRawEmail({
    to: fullUser.email,
    subject: 'LUNARA - Password Changed',
    html: `<p>Hello ${fullUser.firstName},</p><p>Your password was just changed. If you did not do this, please <a href="${process.env.FRONTEND_URL}/forgot-password">reset your password</a> immediately.</p><p>— LUNARA</p>`,
    text: `Hello ${fullUser.firstName}, your password was just changed. If you did not do this, visit ${process.env.FRONTEND_URL}/forgot-password to reset it.`,
  }).catch((err: unknown) => logger.debug('Password change email failed:', err));

  return { message: 'Password changed successfully. Please log in again.' };
}

/**
 * Delete a user account permanently, removing all associated data.
 *
 * @param userId - User's ObjectId
 * @param password - Current password for confirmation
 * @returns Success message
 * @throws NotFoundError -- user not found
 * @throws UnauthorizedError -- password is incorrect
 */
export async function deleteAccount(
  userId: mongoose.Types.ObjectId,
  password: string,
): Promise<{ message: string }> {
  const fullUser = await User.findById(userId).select('+password');
  if (!fullUser) {
    throw new NotFoundError('User not found');
  }

  const isMatch = await fullUser.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Password is incorrect');
  }

  const uid = fullUser._id;

  await Promise.all([
    Message.deleteMany({ $or: [{ sender: uid }, { receiver: uid }] }),
    Appointment.deleteMany({ $or: [{ clientId: uid }, { providerId: uid }] }),
    CheckIn.deleteMany({ userId: uid }),
    ClientDocument.deleteMany({ userId: uid }),
    CarePlan.deleteMany({ $or: [{ clientId: uid }, { providerId: uid }] }),
  ]);

  if (fullUser.role === 'client') {
    await Client.deleteOne({ userId: uid });
  } else if (fullUser.role === 'provider') {
    await Provider.deleteOne({ userId: uid });
  }

  await User.deleteOne({ _id: uid });

  sendRawEmail({
    to: fullUser.email,
    subject: 'LUNARA - Account Deleted',
    html: `<p>Hello ${fullUser.firstName},</p><p>Your LUNARA account has been permanently deleted as requested. All your data has been removed.</p><p>If you did not request this, please contact support immediately.</p><p>— LUNARA</p>`,
    text: `Hello ${fullUser.firstName}, your LUNARA account has been permanently deleted. If you did not request this, contact support immediately.`,
  }).catch((err: unknown) => logger.debug('Account deletion email failed:', err));

  return { message: 'Account deleted successfully' };
}

/**
 * Get notification preferences.
 *
 * @param user - Authenticated user document
 * @returns Current notification preference settings with defaults applied
 */
export function getPreferences(user: IUser): { preferences: NotificationPreferences } {
  const defaults: NotificationPreferences = {
    emailNotifications: true,
    appointmentReminders: true,
    messageAlerts: true,
    checkInReminders: true,
    loginAlerts: true,
  };

  return {
    preferences: {
      ...defaults,
      ...(user.profile?.preferences?.notifications as Partial<NotificationPreferences> ?? {}),
    },
  };
}

/**
 * Update notification preferences.
 *
 * @param user - Authenticated user document
 * @param updates - Preference toggles to change
 * @returns Success message and the updated preferences
 */
export async function updatePreferences(
  user: IUser,
  updates: Partial<NotificationPreferences>,
): Promise<{ message: string; preferences: Record<string, boolean> }> {
  const allowed: (keyof NotificationPreferences)[] = [
    'emailNotifications',
    'appointmentReminders',
    'messageAlerts',
    'checkInReminders',
    'loginAlerts',
  ];
  const validUpdates: Record<string, boolean> = {};
  for (const key of allowed) {
    if (typeof updates[key] === 'boolean') validUpdates[key] = updates[key];
  }

  const existing = user.profile?.preferences ?? {};
  user.profile = {
    ...user.profile,
    preferences: {
      ...existing,
      notifications: { ...(existing.notifications as Record<string, boolean> ?? {}), ...validUpdates },
    },
  } as typeof user.profile;
  await user.save();

  return {
    message: 'Preferences updated',
    preferences: user.profile.preferences.notifications as Record<string, boolean>,
  };
}
