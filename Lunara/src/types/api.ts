/**
 * API-layer types used by services that talk to the backend.
 *
 * Core types (User, LoginCredentials, etc.) live in ./models.ts.
 * These types describe the shapes of specific API request/response payloads.
 */

// ── Generic response wrappers ───────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  startDate?: string;
  endDate?: string;
  providerId?: number;
}

// ── Auth response types ─────────────────────────────────────────────────────

// Refresh token is now sent via httpOnly cookie, no request body needed.
export type RefreshTokenRequest = Record<string, never>;

export interface RefreshTokenResponse {
  token: string;
}

// ── User / profile types ────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'provider' | 'admin';
  dueDate?: string;
  birthDate?: string;
  birthType?: 'NATURAL' | 'CSECTION';
  feedingStyle?: 'BREAST' | 'BOTTLE' | 'MIXED';
  birthLocation?: string;
  supportSystem?: string;
  concerns?: string;
  goals?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Appointment types ───────────────────────────────────────────────────────

export interface Appointment {
  id: string;
  clientId: string;
  providerId: string;
  provider: Provider;
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'requested';
  location: string;
  notes?: string;
}

export interface CreateAppointmentRequest {
  clientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
}

export interface UpdateAppointmentRequest {
  status?: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
}

// ── Provider types ──────────────────────────────────────────────────────────

export interface ProviderAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UpdateAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  specialties?: string[];
}

// ── Message types ───────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageRequest {
  recipientId: string;
  content: string;
}
