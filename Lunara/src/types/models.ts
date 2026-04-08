/**
 * @module types/models
 * Core domain models and enums shared across the LUNARA frontend.
 * This is the canonical source of truth for User, auth, and session types.
 */

/** Core user model — the single source of truth for user shape across the app. */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'provider' | 'client' | 'admin';
  mfaEnabled?: boolean;
  createdAt?: string;
}

/** Email + password pair used for authentication. */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Base registration payload shared by client and provider sign-up flows. */
export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  registrationCode?: string;
}

/** Provider sign-up payload; requires a registration code for authorization. */
export interface ProviderRegistrationData extends RegisterData {
  registrationCode: string;
}

/** Client sign-up payload; optionally linked to an existing provider. */
export interface ClientRegistrationData extends RegisterData {
  providerId?: string;
}

/** Lifecycle status of a support session (appointment). */
export enum SupportSessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

/** Provider approval state for a client-requested session. */
export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/** Classification of a support session by its purpose. */
export enum SupportSessionType {
  INITIAL_CONSULTATION = 'INITIAL_CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  ROUTINE = 'ROUTINE',
}

/** Full support session (appointment) record as returned by the API. */
export interface SupportSession {
  id: string;
  provider: { id: string; name: string };
  client: { id: string; name: string };
  startTime: string;
  endTime: string;
  status: SupportSessionStatus;
  approvalStatus: ApprovalStatus;
  sessionType: SupportSessionType;
  notes?: string;
  followUpNotes?: string;
  cancellationReason?: string;
  location: string;
}

/** Request payload for creating a new provider account. */
export interface CreateProviderRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  specialties?: string[];
  bio?: string;
}

/** Request payload for updating an existing provider's profile. */
export interface UpdateProviderRequest {
  firstName?: string;
  lastName?: string;
  specialties?: string[];
  bio?: string;
  availability?: { start: string; end: string }[];
}
