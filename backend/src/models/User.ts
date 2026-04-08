/**
 * @module User
 * Central identity model for all LUNARA users (clients, providers, admins).
 * Maps to the MongoDB `users` collection.
 * Handles authentication (bcrypt passwords, Google OAuth, MFA/TOTP),
 * email verification, account locking, refresh-token rotation,
 * and role-based permission resolution. Extended by {@link Client}
 * and {@link Provider} profiles via a `userId` foreign key.
 */
import mongoose, { Document, Schema, Model } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcryptjs';

/** OAuth provider credentials (currently Google only). */
interface IOAuthProvider {
  provider: 'google'; // Which social login service
  providerId: string; // Their ID from that service
  email: string; // Email from that service
}

/** User profile sub-document (phone, timezone, preferences). */
interface IProfile {
  phone?: string;
  timezone: string;
  preferences: Record<string, unknown>;
}

/** A JWT refresh token with auto-expiry (7 days TTL via MongoDB). */
interface IRefreshToken {
  token: string;
  createdAt: Date;
}

/** User document with authentication state, profile, and security fields. */
export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'client' | 'provider' | 'admin';
  isEmailVerified: boolean;
  oauthProviders: IOAuthProvider[];
  profile: IProfile;
  lastLogin?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  mfaEnabled: boolean;
  mfaSecret?: string;
  mfaBackupCodes: string[];
  refreshTokens: IRefreshToken[];
  failedLoginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Intake / onboarding
  intakeCompleted?: boolean;
  intakeCompletedAt?: Date;

  // Virtual
  fullName: string;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  canLogin(): boolean;
  isLocked(): boolean;
  getPermissions(): string[];
}

/** Static helpers on the User model. */
export interface IUserModel extends Model<IUser> {
  /** Case-insensitive email look-up. */
  findByEmail(email: string): Promise<IUser | null>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated user ID
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           description: Hashed password (for email/password auth)
 *         role:
 *           type: string
 *           enum: [client, provider]
 *           description: User's role in the system
 *         isEmailVerified:
 *           type: boolean
 *           description: Whether the user's email has been verified
 *         oauthProviders:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [google]
 *               providerId:
 *                 type: string
 *               email:
 *                 type: string
 *         profile:
 *           type: object
 *           properties:
 *             phone:
 *               type: string
 *             timezone:
 *               type: string
 *             preferences:
 *               type: object
 *         lastLogin:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         intakeCompleted:
 *           type: boolean
 *           description: Whether the user has completed their intake form
 *         intakeCompletedAt:
 *           type: string
 *           format: date-time
 *           description: When the intake form was marked complete
 */

const userSchema = new Schema<IUser>(
  {
    // Basic Personal Information
    firstName: {
      type: String,
      required: [true, 'First name is required'], // REQUIRED field
      trim: true, // Remove extra spaces
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'], // REQUIRED field
      trim: true, // Remove extra spaces
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },

    // Authentication Information
    email: {
      type: String,
      required: [true, 'Email is required'], // REQUIRED field
      unique: true, // NO duplicates allowed
      lowercase: true, // Convert to lowercase
      trim: true, // Remove extra spaces
      validate: {
        validator: (value: string) => validator.isEmail(value || ''),
        message: 'Please enter a valid email',
      },
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password in API responses
    },

    // User Role - Determines permissions and app behavior
    role: {
      type: String,
      enum: {
        values: ['client', 'provider', 'admin'],
        message: 'Role must be client, provider, or admin',
      },
      required: [true, 'Role is required'], // REQUIRED field
      default: 'client', // Default to client if not specified
      // client = postpartum mothers seeking support
      // provider = doulas/specialists providing care
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    oauthProviders: [
      {
        provider: {
          type: String,
          enum: ['google'],
          required: true,
        },
        providerId: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: [true, 'Email is required'],
          unique: true, // This creates a unique index
          lowercase: true,
          trim: true,
          validate: {
            validator: (value: string) => validator.isEmail(value || ''),
            message: 'Please enter a valid email',
          },
        },
      },
    ],
    profile: {
      phone: {
        type: String,
        match: [/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'],
      },
      timezone: {
        type: String,
        default: 'America/Phoenix', // Default to Arizona timezone
      },
      preferences: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    lastLogin: {
      type: Date,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false,
    },
    mfaBackupCodes: {
      type: [String],
      select: false,
      default: [],
    },
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
          expires: '7d',
        },
      },
    ],
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    intakeCompleted: {
      type: Boolean,
      default: false,
    },
    intakeCompletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        // Remove sensitive fields from JSON output
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.mfaSecret;
        delete ret.mfaBackupCodes;
        delete ret.refreshTokens;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

/** @virtual fullName — concatenation of firstName and lastName. */
userSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

/**
 * Pre-save hook: hashes the password with bcrypt when modified.
 * Salt rounds default to 12 (~250ms); configurable via `BCRYPT_ROUNDS` env var.
 */
userSchema.pre<IUser>('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();

  try {
    // 12 rounds ≈ 250ms on modern hardware — balances brute-force resistance
    // with login latency. OWASP minimum is 10; configurable via env for load testing.
    const salt = await bcrypt.genSalt(Number.parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10));
    if (this.password) {
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

/**
 * Compare a plaintext password against this user's hashed password.
 * @param candidatePassword - The plaintext password to verify.
 * @returns `true` if the password matches; `false` otherwise or if no password is set.
 */
userSchema.methods.comparePassword = async function (
  this: IUser,
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

/** @returns `true` if the user's email has been verified. */
userSchema.methods.canLogin = function (this: IUser): boolean {
  return this.isEmailVerified;
};

/** @returns `true` if the account is temporarily locked due to failed login attempts. */
userSchema.methods.isLocked = function (this: IUser): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

/**
 * Resolve the list of permission strings granted to this user's role.
 * @returns Array of `"action:scope"` permission strings.
 */
userSchema.methods.getPermissions = function (this: IUser): string[] {
  const permissions: Record<string, string[]> = {
    client: [
      'read:own-profile',
      'update:own-profile',
      'create:messages',
      'read:own-messages',
      'create:appointments',
      'read:own-appointments',
      'create:checkins',
      'read:own-checkins',
      'read:resources',
    ],
    provider: [
      'read:own-profile',
      'update:own-profile',
      'read:clients',
      'update:clients',
      'create:messages',
      'read:messages',
      'create:appointments',
      'read:appointments',
      'update:appointments',
      'read:checkins',
      'create:care-plans',
      'update:care-plans',
      'create:blog-posts',
      'update:blog-posts',
      'read:analytics',
    ],
  };

  return permissions[this.role] || [];
};

// Static method to find user by email (case-insensitive)
userSchema.statics.findByEmail = function (email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() });
};

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ 'oauthProviders.providerId': 1, 'oauthProviders.provider': 1 });
userSchema.index({ createdAt: 1 });

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;
