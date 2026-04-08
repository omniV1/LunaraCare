/**
 * @module providerDashboardUtils
 * Shared types and helpers used across ProviderDashboard tab components.
 */

/** Minimal user shape returned by populated or unpopulated Mongoose refs. */
export type UserLike = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

/** A client record as returned by the provider-facing client list endpoint. */
export interface ProviderClientItem {
  _id?: string;
  id?: string;
  createdAt?: string;
  userId?: UserLike | string;
  user?: UserLike | string;
  assignedProvider?: UserLike | string;
}

/** Aggregate counts shown on the provider dashboard overview. */
export interface DashboardStats {
  totalClients: number;
  upcomingAppointments: number;
  pendingCheckins: number;
  pendingAppointmentRequests: number;
}

/** A client check-in summary surfaced in the provider's review queue. */
export interface CheckinReviewItem {
  clientName?: string;
  clientUserId?: string;
  clientId?: string;
  lastCheckIn?: string;
  alerts?: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }>;
}

/** Minimal appointment shape used for dashboard activity feeds. */
export interface AppointmentLike {
  startTime?: string;
  clientId?: UserLike | string;
}

/** Minimal document shape used for dashboard activity feeds. */
export interface DocumentLike {
  title?: string;
  createdAt?: string;
  submissionData?: { submittedDate?: string };
  uploadedBy?: UserLike | string;
}

/** Normalised activity-feed entry displayed in the provider overview. */
export interface ActivityItem {
  type: string;
  date: string;
  label: string;
  subtitle?: string;
}

/** Form payload for registering a new client from the provider dashboard. */
export interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

/**
 * Type guard: checks whether a value is a non-null, non-array plain object.
 * @param v - Value to inspect.
 * @returns `true` if `v` is a plain object.
 */
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Extracts a user ID from a value that may be a string ObjectId or a populated user object.
 * @param v - A bare ObjectId string or a user-like object with `_id` / `id`.
 * @returns The extracted ID string, or an empty string if unresolvable.
 */
export function getUserId(v: unknown): string {
  if (typeof v === 'string') return v;
  if (!isRecord(v)) return '';
  const raw = v._id ?? v.id;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  return raw != null ? String(raw) : '';
}

/**
 * Extracts a display name (and optional email) from a value that may be
 * a populated user object or an unresolvable reference.
 * @param v - A user-like object or unknown value.
 * @returns An object with `name` (falls back to "Unknown") and optional `email`.
 */
export function getUserName(v: unknown): { name: string; email?: string } {
  if (!isRecord(v)) return { name: 'Unknown' };
  const u = v as UserLike;
  const first = u.firstName ?? '';
  const last = u.lastName ?? '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  return { name: full || u.email || 'Unknown', email: u.email };
}

/**
 * Safely extracts `response.data` from an Axios-style error object.
 * @param error - The caught error value.
 * @returns The nested `response.data` payload, or `undefined`.
 */
export function getErrorResponseData(error: unknown): unknown {
  if (!isRecord(error)) return undefined;
  const response = error.response;
  if (!isRecord(response)) return undefined;
  return response.data;
}
