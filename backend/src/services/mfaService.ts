import crypto from 'node:crypto';
import { TOTP, Secret } from 'otpauth';
import QRCode from 'qrcode';
import User from '../models/User';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors';
import mongoose from 'mongoose';

// ── Constants ────────────────────────────────────────────────────────────────

const ISSUER = 'LUNARA';

// ── Helpers ──────────────────────────────────────────────────────────────────

function createTOTP(secret: string, email: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}

function generateBackupCodes(): string[] {
  return Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}

// ── Result types ─────────────────────────────────────────────────────────────

export interface MfaSetupResult {
  secret: string;
  qrCode: string;
  otpauthUrl: string;
}

export interface MfaConfirmResult {
  message: string;
  backupCodes: string[];
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Generate a TOTP secret and return a QR code. Does NOT enable MFA yet.
 *
 * @throws BadRequestError — MFA is already enabled
 */
export async function setupMfa(
  userId: mongoose.Types.ObjectId,
  email: string,
  mfaEnabled: boolean
): Promise<MfaSetupResult> {
  if (mfaEnabled) {
    throw new BadRequestError('MFA is already enabled. Disable it first to reconfigure.');
  }

  const secret = new Secret({ size: 20 });
  const totp = new TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  const otpauthUrl = totp.toString();
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  await User.findByIdAndUpdate(userId, { mfaSecret: secret.base32 });

  return {
    secret: secret.base32,
    qrCode: qrCodeDataUrl,
    otpauthUrl,
  };
}

/**
 * Verify a TOTP code to confirm MFA setup, then enable MFA and return backup codes.
 *
 * @throws BadRequestError — MFA already enabled, no secret found, or invalid code
 */
export async function confirmMfaSetup(
  userId: mongoose.Types.ObjectId,
  mfaEnabled: boolean,
  code: string
): Promise<MfaConfirmResult> {
  if (mfaEnabled) {
    throw new BadRequestError('MFA is already enabled');
  }

  const fullUser = await User.findById(userId).select('+mfaSecret');
  if (!fullUser?.mfaSecret) {
    throw new BadRequestError('Call /mfa/setup first to generate a secret');
  }

  const totp = createTOTP(fullUser.mfaSecret, fullUser.email);
  const delta = totp.validate({ token: code, window: 1 });

  if (delta === null) {
    throw new BadRequestError('Invalid code. Make sure your authenticator app is synced.');
  }

  const backupCodes = generateBackupCodes();
  const hashedCodes = backupCodes.map((c) =>
    crypto.createHash('sha256').update(c).digest('hex')
  );

  fullUser.mfaEnabled = true;
  fullUser.mfaBackupCodes = hashedCodes;
  await fullUser.save();

  return { message: 'MFA enabled successfully', backupCodes };
}

/**
 * Disable MFA after verifying the user's password and a TOTP/backup code.
 *
 * @throws BadRequestError  — MFA is not enabled
 * @throws NotFoundError    — user not found
 * @throws UnauthorizedError — invalid password or verification code
 */
export async function disableMfa(
  userId: mongoose.Types.ObjectId,
  mfaEnabled: boolean,
  password: string,
  code: string
): Promise<{ message: string }> {
  if (!mfaEnabled) {
    throw new BadRequestError('MFA is not enabled');
  }

  const fullUser = await User.findById(userId).select('+password +mfaSecret +mfaBackupCodes');
  if (!fullUser) {
    throw new NotFoundError('User not found');
  }

  const passwordValid = await fullUser.comparePassword(password);
  if (!passwordValid) {
    throw new UnauthorizedError('Invalid password');
  }

  let codeValid = false;

  // Try TOTP first
  if (fullUser.mfaSecret && code.length === 6) {
    const totp = createTOTP(fullUser.mfaSecret, fullUser.email);
    const delta = totp.validate({ token: code, window: 1 });
    codeValid = delta !== null;
  }

  // Try backup code
  if (!codeValid) {
    const hashedInput = crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
    const backupIndex = fullUser.mfaBackupCodes.indexOf(hashedInput);
    if (backupIndex !== -1) {
      codeValid = true;
      fullUser.mfaBackupCodes.splice(backupIndex, 1);
    }
  }

  if (!codeValid) {
    throw new UnauthorizedError('Invalid verification code');
  }

  fullUser.mfaEnabled = false;
  fullUser.mfaSecret = undefined;
  fullUser.mfaBackupCodes = [];
  await fullUser.save();

  return { message: 'MFA disabled successfully' };
}
