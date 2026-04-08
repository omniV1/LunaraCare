/**
 * @module types
 * Shared TypeScript interfaces and type aliases used across
 * controllers, middleware, and service layers.
 */

import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '../models/User';

/** Express request enriched with the authenticated user after JWT middleware. */
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/** Decoded JWT payload carrying user identity and role. */
export interface JWTPayload extends JwtPayload {
  id: string;
  email: string;
  role: 'client' | 'provider' | 'admin';
}

/**
 * Standard envelope for all JSON API responses.
 * @typeParam T - Shape of the `data` payload
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  mfaRequired?: boolean;
  mfaToken?: string;
}

/** Query-string parameters accepted by paginated list endpoints. */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * API response wrapper that includes pagination metadata.
 * @typeParam T - Shape of each item in the `data` array
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

/** Common fields present on every Mongoose document. */
export interface MongooseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Base user fields shared by both client and provider profiles. */
export interface UserBase extends MongooseDocument {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

/** Full client profile including pregnancy, postpartum, and preference data. */
export interface ClientDocument extends UserBase {
  role: 'client';
  dateOfBirth: Date;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    surgeries: string[];
  };
  pregnancyInfo: {
    dueDate: Date;
    isFirstTimeParent: boolean;
    numberOfChildren: number;
    birthPlan: string;
    preferredHospital: string;
  };
  postpartumInfo: {
    deliveryDate?: Date;
    deliveryType?: 'vaginal' | 'cesarean';
    babyGender?: 'male' | 'female' | 'other';
    babyWeight?: number;
    complications?: string[];
    breastfeedingGoals?: string;
  };
  preferences: {
    communicationMethod: 'phone' | 'text' | 'email' | 'app';
    availableHours: {
      start: string;
      end: string;
    };
    languages: string[];
    specialNeeds: string[];
  };
  currentProvider?: string;
  serviceHistory: string[];
  documents: {
    name: string;
    url: string;
    type: 'insurance' | 'medical' | 'identification' | 'other';
    uploadDate: Date;
  }[];
}

/** Full provider profile including credentials, services, availability, and earnings. */
export interface ProviderDocument extends UserBase {
  role: 'provider';
  businessName?: string;
  credentials: {
    certifications: string[];
    education: string[];
    licenses: string[];
    insurance: {
      provider: string;
      policyNumber: string;
      expirationDate: Date;
    };
  };
  experience: {
    yearsOfExperience: number;
    specializations: string[];
    birthsAttended: number;
    testimonials: {
      clientName: string;
      review: string;
      rating: number;
      date: Date;
    }[];
  };
  services: {
    prenatal: {
      offered: boolean;
      description: string;
      pricing: number;
    };
    labor: {
      offered: boolean;
      description: string;
      pricing: number;
    };
    postpartum: {
      offered: boolean;
      description: string;
      pricing: number;
    };
    additional: {
      name: string;
      description: string;
      pricing: number;
    }[];
  };
  availability: {
    schedule: {
      monday: { available: boolean; hours: { start: string; end: string } };
      tuesday: { available: boolean; hours: { start: string; end: string } };
      wednesday: { available: boolean; hours: { start: string; end: string } };
      thursday: { available: boolean; hours: { start: string; end: string } };
      friday: { available: boolean; hours: { start: string; end: string } };
      saturday: { available: boolean; hours: { start: string; end: string } };
      sunday: { available: boolean; hours: { start: string; end: string } };
    };
    onCall: boolean;
    maxClients: number;
    travelRadius: number;
  };
  pricing: {
    hourlyRate: number;
    packageRates: {
      name: string;
      description: string;
      price: number;
      duration: string;
    }[];
  };
  location: {
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    serviceAreas: string[];
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  background: {
    isBackgroundCheckComplete: boolean;
    backgroundCheckDate?: Date;
    references: {
      name: string;
      relationship: string;
      phone: string;
      email: string;
    }[];
  };
  rating: {
    average: number;
    count: number;
  };
  isVerified: boolean;
  documents: {
    name: string;
    url: string;
    type: 'certification' | 'license' | 'insurance' | 'background_check' | 'other';
    uploadDate: Date;
    isVerified: boolean;
  }[];
  clients: string[];
  earnings: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  bankingInfo?: {
    accountHolderName: string;
    routingNumber: string;
    accountNumber: string;
    bankName: string;
  };
}

/** Appointment record linking a client to a provider at a scheduled time. */
export interface AppointmentDocument extends MongooseDocument {
  client: string;
  provider: string;
  type: 'consultation' | 'prenatal' | 'labor' | 'postpartum' | 'follow_up';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduledDate: Date;
  duration: number;
  location: {
    type: 'home' | 'hospital' | 'birth_center' | 'virtual';
    address?: string;
    notes?: string;
  };
  notes?: string;
  cost: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  cancellationReason?: string;
  feedback?: {
    clientRating: number;
    clientComments: string;
    providerNotes: string;
  };
}

/** Single message within a conversation thread. */
export interface MessageDocument extends MongooseDocument {
  conversation: string;
  sender: string;
  receiver: string;
  message: string;
  type: 'text' | 'image' | 'file' | 'appointment_request' | 'system';
  readStatus: boolean;
  readAt?: Date;
  attachments?: {
    filename: string;
    url: string;
    type: string;
    size: number;
  }[];
}

/** Conversation thread between two or more participants. */
export interface ConversationDocument extends MongooseDocument {
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  type: 'direct' | 'group';
}

/** Allowed user roles within the application. */
export type UserRole = 'client' | 'provider';
/** Categories of appointments a client can schedule. */
export type AppointmentType = 'consultation' | 'prenatal' | 'labor' | 'postpartum' | 'follow_up';
/** Lifecycle states an appointment passes through. */
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';
/** Payment states for an appointment's billing record. */
export type PaymentStatus = 'pending' | 'paid' | 'refunded';
/** Classification of uploaded user documents. */
export type DocumentType =
  | 'certification'
  | 'license'
  | 'insurance'
  | 'background_check'
  | 'medical'
  | 'identification'
  | 'other';
