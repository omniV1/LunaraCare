/**
 * @module components/client/appointmentTypes
 * Shared TypeScript types, constants, and date helpers used across
 * the client appointment calendar and detail panels.
 */

/** Provider availability time slot. */
export interface Slot {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
}

/** A scheduled or requested appointment between client and provider. */
export interface Appointment {
  _id: string;
  startTime: string;
  endTime: string;
  status: 'requested' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled';
  type?: string;
  providerId?: { firstName?: string; lastName?: string };
}

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const STATUS_COLORS: Record<Appointment['status'], string> = {
  confirmed:  'bg-[#6B4D37]',
  scheduled:  'bg-[#A27B5C]',
  requested:  'bg-[#AA6641]',
  completed:  'bg-[#8C9A8C]',
  cancelled:  'bg-[#AA6641]/70',
};

export const STATUS_BADGE: Record<Appointment['status'], string> = {
  confirmed:  'bg-[#DED7CD]/50 text-[#4E1B00]',
  scheduled:  'bg-[#DED7CD]/50 text-[#4E1B00]',
  requested:  'bg-[#AA6641]/20 text-[#AA6641]',
  completed:  'bg-[#8C9A8C]/20 text-[#3F4E4F]',
  cancelled:  'bg-[#AA6641]/15 text-[#AA6641]',
};

export const STATUS_LABELS: Record<Appointment['status'], string> = {
  confirmed:  'Confirmed',
  scheduled:  'Scheduled',
  requested:  'Pending approval',
  completed:  'Completed',
  cancelled:  'Cancelled',
};

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
