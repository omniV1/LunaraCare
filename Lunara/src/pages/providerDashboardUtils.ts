/** Shared types and helpers used across ProviderDashboard tab components. */

export type UserLike = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

export interface ProviderClientItem {
  _id?: string;
  id?: string;
  createdAt?: string;
  userId?: UserLike | string;
  user?: UserLike | string;
  assignedProvider?: UserLike | string;
}

export interface DashboardStats {
  totalClients: number;
  upcomingAppointments: number;
  pendingCheckins: number;
  pendingAppointmentRequests: number;
}

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

export interface AppointmentLike {
  startTime?: string;
  clientId?: UserLike | string;
}

export interface DocumentLike {
  title?: string;
  createdAt?: string;
  submissionData?: { submittedDate?: string };
  uploadedBy?: UserLike | string;
}

export interface ActivityItem {
  type: string;
  date: string;
  label: string;
  subtitle?: string;
}

export interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// Defensive helpers for API responses that may return populated user objects
// or bare ObjectId strings depending on the endpoint and Mongoose .populate() usage.
export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function getUserId(v: unknown): string {
  if (typeof v === 'string') return v;
  if (!isRecord(v)) return '';
  const raw = v._id ?? v.id;
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number') return String(raw);
  return raw != null ? String(raw) : '';
}

export function getUserName(v: unknown): { name: string; email?: string } {
  if (!isRecord(v)) return { name: 'Unknown' };
  const u = v as UserLike;
  const first = u.firstName ?? '';
  const last = u.lastName ?? '';
  const full = [first, last].filter(Boolean).join(' ').trim();
  return { name: full || u.email || 'Unknown', email: u.email };
}

export function getErrorResponseData(error: unknown): unknown {
  if (!isRecord(error)) return undefined;
  const response = error.response;
  if (!isRecord(response)) return undefined;
  return response.data;
}
