import {
  startOfMonth,
  endOfMonth,
  isSameDay,
  formatTime,
  dateKey,
  clientName,
} from '../../components/provider/calendarTypes';
import type { Appointment } from '../../components/provider/calendarTypes';

describe('calendarTypes helpers', () => {
  describe('startOfMonth', () => {
    it('returns first day of the month at midnight', () => {
      const d = new Date(2026, 2, 15);
      const result = startOfMonth(d);
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(2);
      expect(result.getHours()).toBe(0);
    });
  });

  describe('endOfMonth', () => {
    it('returns last day of month at 23:59:59.999', () => {
      const d = new Date(2026, 2, 1); // March
      const result = endOfMonth(d);
      expect(result.getDate()).toBe(31);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
    });

    it('handles February in non-leap year', () => {
      const d = new Date(2025, 1, 1); // Feb 2025
      const result = endOfMonth(d);
      expect(result.getDate()).toBe(28);
    });

    it('handles February in leap year', () => {
      const d = new Date(2024, 1, 1); // Feb 2024
      const result = endOfMonth(d);
      expect(result.getDate()).toBe(29);
    });
  });

  describe('isSameDay', () => {
    it('returns true for same day', () => {
      const a = new Date(2026, 2, 18, 10, 0);
      const b = new Date(2026, 2, 18, 22, 30);
      expect(isSameDay(a, b)).toBe(true);
    });

    it('returns false for different days', () => {
      const a = new Date(2026, 2, 18);
      const b = new Date(2026, 2, 19);
      expect(isSameDay(a, b)).toBe(false);
    });

    it('returns false for different months', () => {
      const a = new Date(2026, 1, 18);
      const b = new Date(2026, 2, 18);
      expect(isSameDay(a, b)).toBe(false);
    });
  });

  describe('formatTime', () => {
    it('formats an ISO time string', () => {
      const result = formatTime('2026-03-18T14:30:00.000Z');
      // Locale-dependent, just check it returns a string
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('dateKey', () => {
    it('returns YYYY-MM-DD format', () => {
      expect(dateKey(new Date(2026, 2, 5))).toBe('2026-03-05');
    });

    it('pads single-digit months and days', () => {
      expect(dateKey(new Date(2026, 0, 1))).toBe('2026-01-01');
    });

    it('handles December', () => {
      expect(dateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
    });
  });

  describe('clientName', () => {
    it('returns full name when both parts present', () => {
      const appt = {
        clientId: { _id: 'c1', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
      } as Appointment;
      expect(clientName(appt)).toBe('Jane Doe');
    });

    it('returns first name only if no last name', () => {
      const appt = {
        clientId: { _id: 'c1', firstName: 'Jane', lastName: '', email: 'jane@test.com' },
      } as Appointment;
      expect(clientName(appt)).toBe('Jane');
    });

    it('returns email if no names', () => {
      const appt = {
        clientId: { _id: 'c1', firstName: '', lastName: '', email: 'jane@test.com' },
      } as Appointment;
      expect(clientName(appt)).toBe('jane@test.com');
    });

    it('returns "Client" if no clientId', () => {
      const appt = { clientId: null } as unknown as Appointment;
      expect(clientName(appt)).toBe('Client');
    });
  });
});
