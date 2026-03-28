import mongoose from 'mongoose';
import crypto from 'crypto';
import AvailabilitySlot from '../models/AvailabilitySlot';
import Provider, { IProviderDocument } from '../models/Provider';
import Client from '../models/Client';
import User, { IUser } from '../models/User';
import Appointment from '../models/Appointment';
import CheckIn from '../models/CheckIn';
import Message from '../models/Message';
import Resources from '../models/Resources';
import BlogPost from '../models/BlogPost';
import { sendRawEmail } from './emailService';
import logger from '../utils/logger';
import { NotFoundError, ConflictError } from '../utils/errors';

// ── Constants ────────────────────────────────────────────────────────────────

/** Map frontend certification labels to backend enum values. */
const CERT_LABEL_TO_ENUM: Record<string, string> = {
  'DONA Birth Doula': 'DONA_Birth_Doula',
  'DONA Postpartum Doula': 'DONA_Postpartum_Doula',
  'CAPPA Postpartum Doula': 'CAPPA_Postpartum_Doula',
  'ToLabor Doula': 'ToLabor_Birth_Doula',
  'ProDoula Postpartum Doula': 'ProDoula_Postpartum_Doula',
  'Lactation Consultant (IBCLC)': 'Lactation_Consultant_IBCLC',
  'Childbirth Educator': 'Childbirth_Educator',
  'Prenatal Yoga Instructor': 'Prenatal_Yoga_Instructor',
  'Infant Massage Instructor': 'Infant_Massage_Instructor',
  'Other': 'Other',
};

// ── Input / Result types ─────────────────────────────────────────────────────

export interface UpdateProviderProfileInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  certifications?: string[];
  specialties?: string[];
  services?: string[];
  yearsExperience?: number;
  languages?: string[];
  serviceAreas?: string[];
  contactInfo?: {
    businessPhone?: string;
    businessEmail?: string;
    website?: string;
    socialMedia?: {
      instagram?: string;
      facebook?: string;
      linkedin?: string;
    };
  };
  isAcceptingClients?: boolean;
  maxClients?: number;
}

export interface AvailabilitySlotInput {
  date: string;
  startTime: string;
  endTime: string;
  recurring?: boolean;
  dayOfWeek?: number;
}

export interface InviteClientInput {
  email: string;
  firstName: string;
  lastName: string;
}

export interface ProviderAnalytics {
  totalClients: number;
  activeClients: number;
  completedClients: number;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  upcomingAppointments: number;
  averageCheckInMood: number | null;
  totalMessages: number;
  totalResources: number;
  totalBlogPosts: number;
  recentActivity: unknown[];
}

// ── Service functions ────────────────────────────────────────────────────────

/**
 * Get or create the current provider's profile.
 */
export async function getMyProfile(userId: mongoose.Types.ObjectId): Promise<IProviderDocument> {
  let provider = await Provider.findOne({ userId }).populate('userId', 'firstName lastName email');
  if (!provider) {
    provider = new Provider({ userId, status: 'active' });
    await provider.save();
    await provider.populate('userId', 'firstName lastName email');
  } else if (provider.status !== 'active') {
    provider.status = 'active';
    await provider.save();
  }
  return provider;
}

/**
 * Update the current provider's profile and optional user name.
 *
 * @throws NotFoundError -- provider profile not found
 */
export async function updateMyProfile(
  userId: mongoose.Types.ObjectId,
  data: UpdateProviderProfileInput,
): Promise<IProviderDocument> {
  const provider = await Provider.findOne({ userId });
  if (!provider) {
    throw new NotFoundError('Provider profile not found');
  }

  const {
    firstName,
    lastName,
    bio,
    certifications,
    specialties,
    services,
    yearsExperience,
    languages,
    serviceAreas,
    contactInfo,
    isAcceptingClients,
    maxClients,
  } = data;

  if (firstName !== undefined || lastName !== undefined) {
    const u = await User.findById(userId);
    if (u) {
      if (firstName !== undefined) u.firstName = firstName;
      if (lastName !== undefined) u.lastName = lastName;
      await u.save();
    }
  }

  if (!provider.professionalInfo) provider.set('professionalInfo', {});
  if (bio !== undefined) provider.professionalInfo.bio = bio;
  if (certifications !== undefined) {
    const mapped = certifications.map(
      (c: string) => CERT_LABEL_TO_ENUM[c] || (c.includes(' ') ? c.replace(/\s+/g, '_') : c),
    );
    provider.set('professionalInfo.certifications', mapped);
  }
  if (specialties !== undefined) provider.professionalInfo.specialties = specialties as typeof provider.professionalInfo.specialties;
  if (yearsExperience !== undefined) provider.professionalInfo.yearsExperience = yearsExperience;
  if (languages !== undefined) provider.professionalInfo.languages = Array.isArray(languages) ? languages : [];
  if (services !== undefined) provider.services = services as typeof provider.services;
  if (serviceAreas !== undefined) provider.serviceAreas = serviceAreas;
  if (contactInfo !== undefined) {
    if (!provider.contactInfo) provider.set('contactInfo', {});
    if (contactInfo.businessPhone !== undefined) provider.contactInfo.businessPhone = contactInfo.businessPhone;
    if (contactInfo.businessEmail !== undefined) provider.contactInfo.businessEmail = contactInfo.businessEmail;
    if (contactInfo.website !== undefined) provider.contactInfo.website = contactInfo.website;
    if (contactInfo.socialMedia) {
      if (!provider.contactInfo.socialMedia) provider.set('contactInfo.socialMedia', {});
      const sm = provider.contactInfo.socialMedia!;
      if (contactInfo.socialMedia.instagram !== undefined) sm.instagram = contactInfo.socialMedia.instagram;
      if (contactInfo.socialMedia.facebook !== undefined) sm.facebook = contactInfo.socialMedia.facebook;
      if (contactInfo.socialMedia.linkedin !== undefined) sm.linkedin = contactInfo.socialMedia.linkedin;
    }
  }
  if (isAcceptingClients !== undefined) provider.availability.isAcceptingClients = isAcceptingClients;
  if (maxClients !== undefined) provider.availability.maxClients = maxClients;

  await provider.save();
  await provider.populate('userId', 'firstName lastName email');
  return provider;
}

/**
 * Get clients assigned to the current provider.
 */
export async function getMyClients(
  providerId: mongoose.Types.ObjectId,
): Promise<InstanceType<typeof Client>[]> {
  const clients = await Client.find({ assignedProvider: providerId })
    .populate('userId', 'firstName lastName email')
    .populate('assignedProvider', 'firstName lastName email')
    .sort({ createdAt: -1 });
  return clients;
}

/**
 * List all active providers (with aggregation for display names).
 */
export async function listProviders(
  currentUserId: mongoose.Types.ObjectId | undefined,
  currentUserRole: string | undefined,
): Promise<Record<string, unknown>[]> {
  // Ensure current provider exists
  if (currentUserId && currentUserRole === 'provider') {
    let myProvider = await Provider.findOne({ userId: currentUserId });
    if (!myProvider) {
      myProvider = new Provider({ userId: currentUserId, status: 'active' });
      await myProvider.save();
    } else if (myProvider.status !== 'active') {
      myProvider.status = 'active';
      await myProvider.save();
    }
  }

  const userCollection = User.collection.name;
  const aggregated = await Provider.aggregate([
    {
      $match: {
        $or: [
          { status: 'active' },
          ...(currentUserId ? [{ userId: currentUserId }] : []),
        ],
      },
    },
    { $limit: 200 },
    {
      $lookup: {
        from: userCollection,
        localField: 'userId',
        foreignField: '_id',
        as: 'userDoc',
      },
    },
    { $unwind: { path: '$userDoc', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        userId: {
          $cond: {
            if: { $eq: [{ $type: '$userDoc' }, 'object'] },
            then: {
              _id: '$userDoc._id',
              firstName: '$userDoc.firstName',
              lastName: '$userDoc.lastName',
              email: '$userDoc.email',
            },
            else: '$userId',
          },
        },
        _displayNamePart: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ['$userDoc.firstName', ''] },
                ' ',
                { $ifNull: ['$userDoc.lastName', ''] },
              ],
            },
          },
        },
        providerUserId: { $ifNull: ['$userDoc._id', '$userId'] },
      },
    },
    {
      $addFields: {
        displayName: {
          $cond: {
            if: { $gt: [{ $strLenCP: '$_displayNamePart' }, 0] },
            then: '$_displayNamePart',
            else: { $ifNull: ['$userDoc.email', 'Unknown'] },
          },
        },
      },
    },
    { $unset: ['_displayNamePart', 'userDoc'] },
  ]);

  const normalized = aggregated.map(
    (p: {
      displayName?: string;
      providerUserId?: { toString(): string };
      userId?: { toString(): string };
      _id?: { toString(): string };
      [key: string]: unknown;
    }) => ({
      ...p,
      displayName: p.displayName || 'Unknown',
      providerUserId:
        p.providerUserId?.toString?.() ?? p.userId?.toString?.() ?? p._id?.toString?.(),
    }),
  );

  return normalized;
}

/**
 * Get provider availability slots for a date range.
 */
export async function getAvailability(
  providerId: string,
  fromDate: Date | undefined,
  toDate: Date | undefined,
): Promise<{
  providerId: string;
  from: Date;
  to: Date;
  slots: InstanceType<typeof AvailabilitySlot>[];
}> {
  const now = new Date();
  const rawFrom = fromDate ?? now;
  const from = new Date(rawFrom.getFullYear(), rawFrom.getMonth(), rawFrom.getDate());

  const defaultTo = new Date(now);
  defaultTo.setDate(defaultTo.getDate() + 30);
  const to = toDate ?? defaultTo;

  const slots = await AvailabilitySlot.find({
    providerId,
    date: { $gte: from, $lte: to },
    isBooked: false,
  }).sort({ date: 1, startTime: 1 });

  return { providerId, from, to, slots };
}

/**
 * Create availability slots for a provider.
 */
export async function createAvailabilitySlots(
  providerId: string,
  slots: AvailabilitySlotInput[],
): Promise<InstanceType<typeof AvailabilitySlot>[]> {
  const slotsData = slots.map((s) => ({
    providerId,
    date: new Date(s.date),
    startTime: s.startTime,
    endTime: s.endTime,
    recurring: s.recurring ?? false,
    dayOfWeek: s.dayOfWeek,
    isBooked: false,
  }));

  const created = await AvailabilitySlot.insertMany(slotsData);
  return created as unknown as InstanceType<typeof AvailabilitySlot>[];
}

/**
 * Create a client account and send an invite email.
 *
 * @throws ConflictError -- email already exists
 */
export async function inviteClient(
  data: InviteClientInput,
  provider: IUser,
): Promise<{ id: unknown; email: string; firstName: string; lastName: string }> {
  const { email, firstName, lastName } = data;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new ConflictError('A user with this email already exists');
  }

  const inviteToken = crypto.randomBytes(32).toString('hex');
  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.toLowerCase(),
    role: 'client',
    password: crypto.randomBytes(32).toString('hex'),
    isEmailVerified: true,
    passwordResetToken: inviteToken,
    passwordResetExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await Client.create({ userId: user._id });

  const setupUrl = `${process.env.FRONTEND_URL}/reset-password?token=${inviteToken}`;
  const providerName = `${provider.firstName ?? ''} ${provider.lastName ?? ''}`.trim();

  sendRawEmail({
    to: email.toLowerCase(),
    subject: 'LUNARA - You\'ve Been Invited!',
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #4e1b00;">
        <h2 style="color: #4e1b00;">Welcome to Lunara, ${firstName}!</h2>
        <p>${providerName} has invited you to join Lunara as a client.</p>
        <p>Click the link below to set your password and access your dashboard:</p>
        <p style="margin: 24px 0;">
          <a href="${setupUrl}" style="display: inline-block; padding: 12px 28px; background: #4e1b00; color: #fff; text-decoration: none; border-radius: 8px; font-size: 16px;">
            Set Up My Account
          </a>
        </p>
        <p style="font-size: 13px; color: #888;">This link expires in 7 days. After setting your password you can also sign in with Google.</p>
        <p style="margin-top: 32px;">— The Lunara Team</p>
      </div>
    `,
    text: `Welcome to Lunara, ${firstName}! ${providerName} has invited you. Set your password here: ${setupUrl} (expires in 7 days).`,
  }).catch((err: unknown) => logger.error('Invite email failed:', err));

  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

/**
 * Get analytics dashboard data for the current provider.
 */
export async function getAnalytics(
  providerId: mongoose.Types.ObjectId,
): Promise<ProviderAnalytics> {
  const now = new Date();

  const clients = await Client.find({ assignedProvider: providerId });
  const clientUserIds = clients.map((c) => c.userId);

  const [
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    upcomingAppointments,
    moodAgg,
    totalMessages,
    totalResources,
    totalBlogPosts,
    recentActivity,
  ] = await Promise.all([
    Appointment.countDocuments({ providerId }),
    Appointment.countDocuments({ providerId, status: 'completed' }),
    Appointment.countDocuments({ providerId, status: 'cancelled' }),
    Appointment.countDocuments({
      providerId,
      startTime: { $gt: now },
      status: { $in: ['scheduled', 'confirmed', 'requested'] },
    }),
    CheckIn.aggregate([
      { $match: { userId: { $in: clientUserIds } } },
      { $group: { _id: null, avgMood: { $avg: '$mood' } } },
    ]),
    Message.countDocuments({ sender: providerId }),
    Resources.countDocuments({ author: providerId }),
    BlogPost.countDocuments({ author: providerId }),
    Appointment.find({ providerId })
      .sort({ startTime: -1 })
      .limit(10)
      .populate('clientId', 'firstName lastName email')
      .populate('providerId', 'firstName lastName email'),
  ]);

  return {
    totalClients: clients.length,
    activeClients: clients.filter((c) => c.status === 'active').length,
    completedClients: clients.filter((c) => c.status === 'completed').length,
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    upcomingAppointments,
    averageCheckInMood: moodAgg.length > 0 ? (moodAgg[0] as { avgMood: number }).avgMood : null,
    totalMessages,
    totalResources,
    totalBlogPosts,
    recentActivity,
  };
}
