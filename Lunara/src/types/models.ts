// ── Core user type (canonical source of truth) ──────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'provider' | 'client' | 'admin';
  mfaEnabled?: boolean;
  createdAt?: string;
}

// ── Authentication types ────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  registrationCode?: string;
}

export interface ProviderRegistrationData extends RegisterData {
  registrationCode: string;
}

export interface ClientRegistrationData extends RegisterData {
  providerId?: string;
}

// ── Support session types ───────────────────────────────────────────────────

export enum SupportSessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum SupportSessionType {
  INITIAL_CONSULTATION = 'INITIAL_CONSULTATION',
  FOLLOW_UP = 'FOLLOW_UP',
  EMERGENCY = 'EMERGENCY',
  ROUTINE = 'ROUTINE',
}

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

// ── Provider types ──────────────────────────────────────────────────────────

export interface CreateProviderRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  specialties?: string[];
  bio?: string;
}

export interface UpdateProviderRequest {
  firstName?: string;
  lastName?: string;
  specialties?: string[];
  bio?: string;
  availability?: { start: string; end: string }[];
}
