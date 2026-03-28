import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import mongoose from 'mongoose';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../src/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndDelete: jest.fn(),
    updateOne: jest.fn(),
  },
}));

jest.mock('../../src/models/Client', () => {
  const MockClient = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
  }));
  return { __esModule: true, default: MockClient };
});

jest.mock('../../src/models/Provider', () => {
  const MockProvider = jest.fn().mockImplementation(() => ({
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
  }));
  return { __esModule: true, default: MockProvider };
});

jest.mock('../../src/services/emailService', () => ({
  sendEmail: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
}));

jest.mock('../../src/utils/tokenUtils', () => ({
  generateTokens: jest.fn().mockReturnValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: { sign: jest.fn().mockReturnValue('mock-mfa-token'), verify: jest.fn() },
}));

jest.mock('../../src/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), debug: jest.fn(), warn: jest.fn() },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import User, { IUser } from '../../src/models/User';
import { verifyRefreshToken } from '../../src/utils/tokenUtils';
import {
  addRefreshToken,
  MAX_SESSIONS,
  registerUser,
  loginUser,
  refreshTokens,
  logoutUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  isMfaChallenge,
} from '../../src/services/authService';
import { APIError } from '../../src/utils/errors';

// ── Helpers ──────────────────────────────────────────────────────────────────

const oid = () => new mongoose.Types.ObjectId();

function fakeUserDoc(overrides: Record<string, unknown> = {}) {
  const id = oid();
  const doc = {
    _id: id,
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@test.com',
    role: 'client',
    refreshTokens: [] as { token: string; createdAt: Date }[],
    isEmailVerified: true,
    mfaEnabled: false,
    failedLoginAttempts: 0,
    lockUntil: undefined,
    lastLogin: undefined,
    isLocked: jest.fn().mockReturnValue(false),
    canLogin: jest.fn().mockReturnValue(true),
    save: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
    ...overrides,
  };
  return Object.assign(doc as unknown as IUser, { _id: id });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── addRefreshToken ─────────────────────────────────────────────────────

  describe('addRefreshToken', () => {
    it('adds a token to the user', () => {
      const user = fakeUserDoc();
      addRefreshToken(user, 'token-1');
      expect(user.refreshTokens).toHaveLength(1);
      expect(user.refreshTokens[0].token).toBe('token-1');
    });

    it('evicts oldest token when over MAX_SESSIONS', () => {
      const user = fakeUserDoc();
      for (let i = 0; i < MAX_SESSIONS; i++) {
        addRefreshToken(user, `token-${i}`);
      }
      expect(user.refreshTokens).toHaveLength(MAX_SESSIONS);

      addRefreshToken(user, 'new-token');
      expect(user.refreshTokens).toHaveLength(MAX_SESSIONS);
      expect(user.refreshTokens[0].token).toBe('token-1');
      expect(user.refreshTokens[MAX_SESSIONS - 1].token).toBe('new-token');
    });
  });

  // ── registerUser ────────────────────────────────────────────────────────

  describe('registerUser', () => {
    it('throws APIError 403 when caller is not provider/admin', async () => {
      await expect(
        registerUser(
          { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'pass', role: 'client' },
          'client',
        ),
      ).rejects.toThrow(APIError);
      await expect(
        registerUser(
          { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'pass', role: 'client' },
          'client',
        ),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws APIError 403 when provider tries to create provider account', async () => {
      await expect(
        registerUser(
          { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'pass', role: 'provider' },
          'provider',
        ),
      ).rejects.toThrow(APIError);
      await expect(
        registerUser(
          { firstName: 'A', lastName: 'B', email: 'a@b.com', password: 'pass', role: 'provider' },
          'provider',
        ),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it('throws APIError 400 when email already exists', async () => {
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve({ email: 'exists@test.com' }));

      await expect(
        registerUser(
          { firstName: 'A', lastName: 'B', email: 'exists@test.com', password: 'pass', role: 'client' },
          'provider',
        ),
      ).rejects.toThrow(APIError);
      await expect(
        registerUser(
          { firstName: 'A', lastName: 'B', email: 'exists@test.com', password: 'pass', role: 'client' },
          'provider',
        ),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  // ── loginUser ───────────────────────────────────────────────────────────

  describe('loginUser', () => {
    it('throws APIError 401 when user is false (bad credentials)', async () => {
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(
        loginUser('bad@test.com', false, { message: 'Invalid' }, '127.0.0.1'),
      ).rejects.toThrow(APIError);
      await expect(
        loginUser('bad@test.com', false, { message: 'Invalid' }, '127.0.0.1'),
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('increments failedLoginAttempts on failed login', async () => {
      const targetUser = fakeUserDoc({ failedLoginAttempts: 3 });
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(targetUser));

      await expect(
        loginUser('target@test.com', false, { message: 'Invalid' }, '127.0.0.1'),
      ).rejects.toThrow(APIError);

      expect(targetUser.failedLoginAttempts).toBe(4);
      expect(targetUser.save).toHaveBeenCalled();
    });

    it('locks account after MAX_LOGIN_ATTEMPTS', async () => {
      const targetUser = fakeUserDoc({ failedLoginAttempts: 4 }); // Will become 5
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(targetUser));

      await expect(
        loginUser('target@test.com', false, undefined, '127.0.0.1'),
      ).rejects.toThrow(APIError);

      expect(targetUser.lockUntil).toBeInstanceOf(Date);
    });

    it('throws APIError 423 when account is locked', async () => {
      const user = fakeUserDoc({
        isLocked: jest.fn().mockReturnValue(true),
        lockUntil: new Date(Date.now() + 10 * 60 * 1000),
      });

      await expect(loginUser('l@t.com', user, undefined, '127.0.0.1')).rejects.toThrow(APIError);
      await expect(loginUser('l@t.com', user, undefined, '127.0.0.1')).rejects.toMatchObject({
        statusCode: 423,
      });
    });

    it('throws APIError 401 when email is not verified', async () => {
      const user = fakeUserDoc({
        isLocked: jest.fn().mockReturnValue(false),
        canLogin: jest.fn().mockReturnValue(false),
      });

      await expect(loginUser('l@t.com', user, undefined, '127.0.0.1')).rejects.toThrow(APIError);
      await expect(loginUser('l@t.com', user, undefined, '127.0.0.1')).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('returns MFA challenge when mfaEnabled is true', async () => {
      const user = fakeUserDoc({ mfaEnabled: true });

      const result = await loginUser('l@t.com', user, undefined, '127.0.0.1');
      expect(isMfaChallenge(result)).toBe(true);
    });

    it('returns tokens on successful login without MFA', async () => {
      const user = fakeUserDoc({ mfaEnabled: false });

      const result = await loginUser('l@t.com', user, undefined, '127.0.0.1');
      expect(isMfaChallenge(result)).toBe(false);
      if (!isMfaChallenge(result)) {
        expect(result.accessToken).toBe('mock-access-token');
        expect(result.refreshToken).toBe('mock-refresh-token');
        expect(result.user.email).toBe('jane@test.com');
      }
    });

    it('resets failedLoginAttempts on successful login', async () => {
      const user = fakeUserDoc({
        failedLoginAttempts: 3,
        lockUntil: new Date(),
        mfaEnabled: false,
      });

      await loginUser('l@t.com', user, undefined, '127.0.0.1');
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockUntil).toBeUndefined();
    });
  });

  // ── refreshTokens ──────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('throws APIError 401 when JWT verification fails', async () => {
      (verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(refreshTokens('bad-token')).rejects.toThrow(APIError);
      await expect(refreshTokens('bad-token')).rejects.toMatchObject({ statusCode: 401 });
    });

    it('throws APIError 401 when user not found', async () => {
      (verifyRefreshToken as jest.Mock).mockReturnValue({ id: 'missing' });
      (User.findById as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(refreshTokens('some-token')).rejects.toThrow(APIError);
    });

    it('revokes all sessions on token reuse detection', async () => {
      const user = fakeUserDoc({
        refreshTokens: [{ token: 'other-token', createdAt: new Date() }],
      });
      (verifyRefreshToken as jest.Mock).mockReturnValue({ id: user._id.toString() });
      (User.findById as jest.Mock).mockImplementation(() => Promise.resolve(user));

      await expect(refreshTokens('reused-token')).rejects.toThrow(APIError);
      expect(user.refreshTokens).toEqual([]);
      expect(user.save).toHaveBeenCalled();
    });

    it('rotates token successfully', async () => {
      const user = fakeUserDoc({
        refreshTokens: [{ token: 'valid-token', createdAt: new Date() }],
        email: 'jane@test.com',
        role: 'client',
      });
      (verifyRefreshToken as jest.Mock).mockReturnValue({ id: user._id.toString() });
      (User.findById as jest.Mock).mockImplementation(() => Promise.resolve(user));

      const result = await refreshTokens('valid-token');
      expect(result.accessToken).toBe('mock-access-token');
      expect(result.newRefreshToken).toBe('mock-refresh-token');
      expect(result.userId).toBe(user._id.toString());
    });
  });

  // ── logoutUser ──────────────────────────────────────────────────────────

  describe('logoutUser', () => {
    it('does nothing for undefined/empty token', async () => {
      await logoutUser(undefined);
      await logoutUser('');
      expect(User.findById).not.toHaveBeenCalled();
    });

    it('removes the refresh token from user', async () => {
      const user = fakeUserDoc({
        refreshTokens: [
          { token: 'keep-me', createdAt: new Date() },
          { token: 'remove-me', createdAt: new Date() },
        ],
      });
      (verifyRefreshToken as jest.Mock).mockReturnValue({ id: user._id.toString() });
      (User.findById as jest.Mock).mockImplementation(() => Promise.resolve(user));

      await logoutUser('remove-me');
      expect(user.refreshTokens).toHaveLength(1);
      expect(user.refreshTokens[0].token).toBe('keep-me');
    });

    it('falls back to DB search when JWT is expired', async () => {
      (verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw new Error('expired');
      });
      (User.updateOne as jest.Mock).mockImplementation(() => Promise.resolve({ modifiedCount: 1 }));

      await logoutUser('expired-token');
      expect(User.updateOne).toHaveBeenCalledWith(
        { 'refreshTokens.token': 'expired-token' },
        { $pull: { refreshTokens: { token: 'expired-token' } } },
      );
    });
  });

  // ── verifyEmail ─────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('throws APIError 400 when token is missing', async () => {
      await expect(verifyEmail(undefined)).rejects.toThrow(APIError);
      await expect(verifyEmail(undefined)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws APIError 400 when token is invalid/expired', async () => {
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(verifyEmail('invalid-token')).rejects.toThrow(APIError);
    });

    it('marks user as verified on valid token', async () => {
      const user = fakeUserDoc({
        isEmailVerified: false,
        emailVerificationToken: 'valid-token',
        emailVerificationExpires: new Date(Date.now() + 60000),
      });
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(user));

      await verifyEmail('valid-token');
      expect(user.isEmailVerified).toBe(true);
      expect(user.emailVerificationToken).toBeUndefined();
      expect(user.save).toHaveBeenCalled();
    });
  });

  // ── forgotPassword ──────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('does not throw when email does not exist (prevents leaking)', async () => {
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(forgotPassword('nonexistent@test.com')).resolves.toBeUndefined();
    });

    it('generates reset token and saves user', async () => {
      const user = fakeUserDoc();
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(user));

      await forgotPassword('jane@test.com');
      expect(user.passwordResetToken).toBeDefined();
      expect(user.passwordResetExpires).toBeInstanceOf(Date);
      expect(user.save).toHaveBeenCalled();
    });
  });

  // ── resetPassword ───────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('throws APIError 400 when token is invalid/expired', async () => {
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(null));

      await expect(resetPassword('bad-token', 'newPass')).rejects.toThrow(APIError);
      await expect(resetPassword('bad-token', 'newPass')).rejects.toMatchObject({ statusCode: 400 });
    });

    it('resets password and clears all sessions', async () => {
      const user = fakeUserDoc({
        refreshTokens: [{ token: 't1', createdAt: new Date() }],
      });
      (User.findOne as jest.Mock).mockImplementation(() => Promise.resolve(user));

      await resetPassword('valid-token', 'newPassword');
      expect(user.password).toBe('newPassword');
      expect(user.passwordResetToken).toBeUndefined();
      expect(user.refreshTokens).toEqual([]);
      expect(user.save).toHaveBeenCalled();
    });
  });

  // ── isMfaChallenge ──────────────────────────────────────────────────────

  describe('isMfaChallenge', () => {
    it('returns true for MFA challenge results', () => {
      expect(isMfaChallenge({ mfaRequired: true, mfaToken: 'tok' })).toBe(true);
    });

    it('returns false for login results', () => {
      expect(
        isMfaChallenge({
          user: { id: 'x', firstName: 'A', lastName: 'B', email: 'e', role: 'c', isEmailVerified: true, lastLogin: undefined, mfaEnabled: false },
          accessToken: 'at',
          refreshToken: 'rt',
        }),
      ).toBe(false);
    });
  });
});
