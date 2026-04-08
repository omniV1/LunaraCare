/**
 * API-layer types used by services that talk to the backend.
 *
 * Core types (User, LoginCredentials, etc.) live in ./models.ts.
 * These types describe the shapes of specific API request/response payloads.
 */

/** Generic API response envelope wrapping a typed payload. */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

/** Pagination metadata returned alongside paginated lists. */
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
}

/** API response that wraps an array of items with pagination metadata. */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/** Common query-string parameters accepted by list/search endpoints. */
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

/** Empty request body — refresh token is sent via httpOnly cookie. */
export type RefreshTokenRequest = Record<string, never>;

/** Response from the token-refresh endpoint containing a new access token. */
export interface RefreshTokenResponse {
  token: string;
}

/** Extended user profile including postpartum-specific intake fields. */
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

/** Full appointment record as returned by the appointments API. */
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

/** Request payload for scheduling a new appointment. */
export interface CreateAppointmentRequest {
  clientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  location: string;
  notes?: string;
}

/** Request payload for updating an existing appointment's status or details. */
export interface UpdateAppointmentRequest {
  status?: 'scheduled' | 'completed' | 'cancelled';
  location?: string;
  notes?: string;
}

/** A single availability slot for a provider on a given day of the week. */
export interface ProviderAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/** Request payload for updating a provider's availability for a specific day. */
export interface UpdateAvailabilityRequest {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

/** Lightweight provider record embedded in appointment and client responses. */
export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  specialties?: string[];
}

/** A single message record in a conversation thread. */
export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Request payload for sending a new message to a recipient. */
export interface SendMessageRequest {
  recipientId: string;
  content: string;
}
