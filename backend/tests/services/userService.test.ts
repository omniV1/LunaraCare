import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';
import type { IUser } from '../../src/models/User';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../src/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('../../src/models/Client', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('../../src/models/Provider', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('../../src/models/Message', () => ({
  __esModule: true,
  default: { deleteMany: jest.fn() },
}));

jest.mock('../../src/models/Appointment', () => ({
  __esModule: true,
  default: { deleteMany: jest.fn() },
}));

jest.mock('../../src/models/CheckIn', () => ({
  __esModule: true,
  default: { deleteMany: jest.fn() },
}));

jest.mock('../../src/models/ClientDocument', () => ({
  __esModule: true,
  default: { deleteMany: jest.fn() },
}));

jest.mock('../../src/models/CarePlan', () => ({
  __esModule: true,
  default: { deleteMany: jest.fn() },
}));

jest.mock('../../src/services/emailService', () => ({
  sendRawEmail: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
}));

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import User from '../../src/models/User';
import Client from '../../src/models/Client';
import Provider from '../../src/models/Provider';
import Message from '../../src/models/Message';
import Appointment from '../../src/models/Appointment';
import CheckIn from '../../src/models/CheckIn';
import ClientDocument from '../../src/models/ClientDocument';
import CarePlan from '../../src/models/CarePlan';
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getPreferences,
  updatePreferences,
} from '../../src/services/userService';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../src/utils/errors';

// ── Helpers ──────────────────────────────────────────────────────────────────

const oid = () => new mongoose.Types.ObjectId();

function fakeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: oid(),
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@test.com',
    role: 'client',
    profile: { preferences: {} },
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    ...overrides,
  } as unknown as IUser;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getProfile ──────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns user with client profile for client role', async () => {
      const user = fakeUser({ role: 'client' });
      const clientProfile = { _id: oid(), userId: user._id, status: 'active' };
      (Client.findOne as jest.Mock).mockImplementation(() => Promise.resolve(clientProfile));

      const result = await getProfile(user);
      expect(result.user).toBe(user);
      expect(result.profile).toBe(clientProfile);
    });

    it('returns user with provider profile for provider role', async () => {
      const user = fakeUser({ role: 'provider' });
      const providerProfile = { _id: oid(), userId: user._id };
      (Provider.findOne as jest.Mock).mockImplementation(() => Promise.resolve(providerProfile));

      const result = await getProfile(user);
      expect(result.profile).toBe(providerProfile);
    });

    it('returns null profile for unknown role', async () => {
      const user = fakeUser({ role: 'unknown' });

      const result = await getProfile(user);
      expect(result.profile).toBeNull();
    });
  });

  // ── updateProfile ───────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('updates firstName and lastName', async () => {
      const user = fakeUser({ role: 'provider' });
      (Provider.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

      const result = await updateProfile(user, { firstName: 'Updated', lastName: 'Name' });
      expect(user.firstName).toBe('Updated');
      expect(user.lastName).toBe('Name');
      expect(user.save).toHaveBeenCalled();
      expect(result.message).toBe('Profile updated successfully');
    });

    it('updates client date fields (babyBirthDate)', async () => {
      const user = fakeUser({ role: 'client' });
      const client = {
        babyBirthDate: undefined,
        dueDate: undefined,
        birthDate: undefined,
        save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
      };
      (Client.findOne as jest.Mock).mockImplementation(() => Promise.resolve(client));

      await updateProfile(user, { babyBirthDate: '2026-06-15' });
      expect(client.babyBirthDate).toBeInstanceOf(Date);
      expect(client.save).toHaveBeenCalled();
    });

    it('throws BadRequestError for invalid date', async () => {
      const user = fakeUser({ role: 'client' });
      const client = {
        babyBirthDate: undefined,
        dueDate: undefined,
        birthDate: undefined,
        save: jest.fn(),
      };
      (Client.findOne as jest.Mock).mockImplementation(() => Promise.resolve(client));

      await expect(
        updateProfile(user, { babyBirthDate: 'not-a-date' }),
      ).rejects.toThrow(BadRequestError);
    });
  });

  // ── changePassword ──────────────────────────────────────────────────────

  describe('changePassword', () => {
    it('throws NotFoundError when user not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockImplementation(() => Promise.resolve(null)),
      });

      await expect(changePassword(oid(), 'old', 'new')).rejects.toThrow(NotFoundError);
    });

    it('throws UnauthorizedError when current password is wrong', async () => {
      const mockUser = {
        comparePassword: jest.fn().mockImplementation(() => Promise.resolve(false)),
      };
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockImplementation(() => Promise.resolve(mockUser)),
      });

      await expect(changePassword(oid(), 'wrongPass', 'newPass')).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('changes password and clears refresh tokens on success', async () => {
      const mockSave = jest.fn().mockImplementation(() => Promise.resolve(undefined));
      const mockUser = {
        email: 'jane@test.com',
        firstName: 'Jane',
        password: 'old',
        refreshTokens: [{ token: 't1', createdAt: new Date() }],
        comparePassword: jest.fn().mockImplementation(() => Promise.resolve(true)),
        save: mockSave,
      };
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockImplementation(() => Promise.resolve(mockUser)),
      });

      const result = await changePassword(oid(), 'correctPass', 'newPass');
      expect(mockUser.password).toBe('newPass');
      expect(mockUser.refreshTokens).toEqual([]);
      expect(mockSave).toHaveBeenCalled();
      expect(result.message).toContain('Password changed');
    });
  });

  // ── deleteAccount ───────────────────────────────────────────────────────

  describe('deleteAccount', () => {
    it('throws NotFoundError when user not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockImplementation(() => Promise.resolve(null)),
      });

      await expect(deleteAccount(oid(), 'password')).rejects.toThrow(NotFoundError);
    });

    it('throws UnauthorizedError when password is wrong', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockImplementation(() => Promise.resolve({
          comparePassword: jest.fn().mockImplementation(() => Promise.resolve(false)),
        })),
      });

      await expect(deleteAccount(oid(), 'wrongPass')).rejects.toThrow(UnauthorizedError);
    });

    it('deletes client user and all associated data', async () => {
      const userId = oid();
      const mockUser = {
        _id: userId,
        email: 'jane@test.com',
        firstName: 'Jane',
        role: 'client',
        comparePassword: jest.fn().mockImplementation(() => Promise.resolve(true)),
      };
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockImplementation(() => Promise.resolve(mockUser)),
      });
      (Message.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (Appointment.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (CheckIn.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (ClientDocument.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (CarePlan.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (Client.deleteOne as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (User.deleteOne as jest.Mock).mockImplementation(() => Promise.resolve({}));

      const result = await deleteAccount(userId, 'correctPass');
      expect(result.message).toContain('Account deleted');
      expect(Message.deleteMany).toHaveBeenCalled();
      expect(Appointment.deleteMany).toHaveBeenCalled();
      expect(CheckIn.deleteMany).toHaveBeenCalled();
      expect(Client.deleteOne).toHaveBeenCalledWith({ userId });
      expect(User.deleteOne).toHaveBeenCalledWith({ _id: userId });
    });

    it('deletes provider user and provider profile', async () => {
      const userId = oid();
      const mockUser = {
        _id: userId,
        email: 'doc@test.com',
        firstName: 'Dr',
        role: 'provider',
        comparePassword: jest.fn().mockImplementation(() => Promise.resolve(true)),
      };
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockImplementation(() => Promise.resolve(mockUser)),
      });
      (Message.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (Appointment.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (CheckIn.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (ClientDocument.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (CarePlan.deleteMany as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (Provider.deleteOne as jest.Mock).mockImplementation(() => Promise.resolve({}));
      (User.deleteOne as jest.Mock).mockImplementation(() => Promise.resolve({}));

      await deleteAccount(userId, 'correctPass');
      expect(Provider.deleteOne).toHaveBeenCalledWith({ userId });
    });
  });

  // ── getPreferences ──────────────────────────────────────────────────────

  describe('getPreferences', () => {
    it('returns default preferences when none set', () => {
      const user = fakeUser({ profile: {} });
      const result = getPreferences(user);

      expect(result.preferences.emailNotifications).toBe(true);
      expect(result.preferences.appointmentReminders).toBe(true);
      expect(result.preferences.messageAlerts).toBe(true);
      expect(result.preferences.checkInReminders).toBe(true);
      expect(result.preferences.loginAlerts).toBe(true);
    });

    it('merges existing preferences with defaults', () => {
      const user = fakeUser({
        profile: {
          preferences: {
            notifications: { emailNotifications: false },
          },
        },
      });
      const result = getPreferences(user);

      expect(result.preferences.emailNotifications).toBe(false);
      expect(result.preferences.appointmentReminders).toBe(true);
    });
  });

  // ── updatePreferences ───────────────────────────────────────────────────

  describe('updatePreferences', () => {
    it('updates valid notification preferences', async () => {
      const user = fakeUser({
        profile: { preferences: {} },
      });

      const result = await updatePreferences(user, {
        emailNotifications: false,
        loginAlerts: false,
      });

      expect(result.message).toBe('Preferences updated');
      expect(user.save).toHaveBeenCalled();
    });

    it('ignores non-boolean values', async () => {
      const user = fakeUser({
        profile: { preferences: {} },
      });

      await updatePreferences(user, {
        emailNotifications: 'yes' as unknown as boolean,
        appointmentReminders: true,
      });

      // Only appointmentReminders should be applied since 'yes' is not boolean
      expect(user.save).toHaveBeenCalled();
    });
  });
});
