/**
 * @module components/provider/calendarTypes
 * Shared TypeScript types, status color maps, and date/time helpers
 * for the provider calendar and its sub-components.
 */

/** User document populated by Mongoose on appointment queries. */
export interface PopulatedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Provider-side appointment with populated client and provider user refs. */
export interface Appointment {
  _id: string;
  clientId: PopulatedUser;
  providerId: PopulatedUser;
  startTime: string;
  endTime: string;
  status: 'requested' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled';
  type?: 'virtual' | 'in_person';
  notes?: string;
}

/** A provider's bookable time slot on a given date. */
export interface AvailabilitySlot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  recurring: boolean;
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const STATUS_COLORS: Record<Appointment['status'], string> = {
  completed: 'bg-[#3F4E4F]',
  confirmed: 'bg-[#6B4D37]',
  scheduled: 'bg-[#6B4D37]',
  requested: 'bg-[#AA6641]',
  cancelled: 'bg-red-400',
};

export const STATUS_LABELS: Record<Appointment['status'], string> = {
  completed: 'Completed',
  confirmed: 'Confirmed',
  scheduled: 'Scheduled',
  requested: 'Requested',
  cancelled: 'Cancelled',
};

export const STATUS_BADGE: Record<Appointment['status'], string> = {
  completed: 'bg-[#3F4E4F]/10 text-[#3F4E4F]',
  confirmed: 'bg-[#6B4D37]/10 text-[#6B4D37]',
  scheduled: 'bg-[#6B4D37]/10 text-[#6B4D37]',
  requested: 'bg-[#AA6641]/10 text-[#AA6641]',
  cancelled: 'bg-red-100 text-red-700',
};

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function clientName(appt: Appointment): string {
  if (!appt.clientId) return 'Client';
  return [appt.clientId.firstName, appt.clientId.lastName].filter(Boolean).join(' ') || appt.clientId.email || 'Client';
}
