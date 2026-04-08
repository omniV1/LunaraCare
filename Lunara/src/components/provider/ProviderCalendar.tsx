/**
 * @module components/provider/ProviderCalendar
 * Full calendar view for providers: monthly grid with appointment dots,
 * availability slot management, day detail panel, and filterable list.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../api/apiClient';
import { useAuth } from '../../contexts/useAuth';
import type { Appointment, AvailabilitySlot } from './calendarTypes';
import {
  startOfMonth,
  endOfMonth,
  dateKey,
  clientName,
  formatDate,
  formatTime,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_BADGE,
} from './calendarTypes';

import { PendingApprovalsBanner } from './PendingApprovalsBanner';
import { CalendarNavigation } from './CalendarNavigation';
import { CalendarGrid } from './CalendarGrid';
import { DayDetailPanel } from './DayDetailPanel';

/** Calendar-centric appointment and availability manager for providers. */
export const ProviderCalendar: React.FC = () => {
  const { user } = useAuth();
  const api = ApiClient.getInstance();

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [slotSaving, setSlotSaving] = useState(false);
  const [listFilter, setListFilter] = useState<'all' | 'requested' | 'confirmed' | 'scheduled' | 'completed' | 'cancelled'>('all');

  const providerId = (user as unknown as Record<string, unknown>)?._id ?? user?.id;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  // ── Data fetching ──────────────────────────────────────────────────

  const fetchData = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!providerId) return;
    setLoading(true);
    try {
      const start = startOfMonth(currentMonth).toISOString();
      const end = endOfMonth(currentMonth).toISOString();
      const [appts, slots] = await Promise.all([
        api.get<Appointment[]>('/appointments/calendar', { startDate: start, endDate: end }),
        api.get<AvailabilitySlot[]>('/appointments/calendar/availability', { providerId, startDate: start, endDate: end }),
      ]);
      if (signal?.cancelled) return;
      setAppointments(appts ?? []);
      setAvailability(slots ?? []);
    } catch {
      if (signal?.cancelled) return;
      setAppointments([]);
      setAvailability([]);
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [api, currentMonth, providerId]);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchData(signal);
    return () => { signal.cancelled = true; };
  }, [fetchData]);

  // ── Appointment actions ────────────────────────────────────────────

  const handleConfirm = async (id: string) => {
    setActionId(id);
    try {
      await api.post(`/appointments/${id}/confirm`, {});
      toast.success('Appointment confirmed.');
      fetchData();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to confirm');
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setActionId(id);
    try {
      await api.post(`/appointments/${id}/cancel`, { reason: 'Declined by provider' });
      toast.success('Appointment declined.');
      fetchData();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to decline');
    } finally {
      setActionId(null);
    }
  };

  // ── Availability actions ──────────────────────────────────────────

  const handleAddSlot = async (slotStart: string, slotEnd: string): Promise<boolean> => {
    if (!selectedDate) return false;
    if (slotStart >= slotEnd) {
      toast.error('End time must be after start time');
      return false;
    }
    setSlotSaving(true);
    try {
      await api.post('/appointments/availability', {
        date: dateKey(selectedDate),
        startTime: slotStart,
        endTime: slotEnd,
        recurring: false,
      });
      toast.success('Availability slot added.');
      fetchData();
      return true;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to add slot');
      return false;
    } finally {
      setSlotSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    setActionId(slotId);
    try {
      await api.delete(`/appointments/availability/${slotId}`);
      toast.success('Slot removed.');
      fetchData();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? 'Failed to remove slot');
    } finally {
      setActionId(null);
    }
  };

  // ── Computed values ────────────────────────────────────────────────

  const apptMap = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const key = dateKey(new Date(appt.startTime));
      m.set(key, [...(m.get(key) ?? []), appt]);
    }
    return m;
  }, [appointments]);

  const slotMap = useMemo(() => {
    const m = new Map<string, AvailabilitySlot[]>();
    for (const slot of availability) {
      const key = dateKey(new Date(slot.date));
      m.set(key, [...(m.get(key) ?? []), slot]);
    }
    return m;
  }, [availability]);

  const selectedKey = selectedDate ? dateKey(selectedDate) : null;
  const selectedAppts = selectedKey ? (apptMap.get(selectedKey) ?? []) : [];
  const selectedSlots = selectedKey ? (slotMap.get(selectedKey) ?? []) : [];
  const pendingApprovals = appointments.filter((a) => a.status === 'requested');
  const filteredList = listFilter === 'all' ? appointments : appointments.filter((a) => a.status === listFilter);

  const prevMonth = () => { setCurrentMonth(new Date(year, month - 1, 1)); setSelectedDate(null); };
  const nextMonth = () => { setCurrentMonth(new Date(year, month + 1, 1)); setSelectedDate(null); };
  const goToToday = () => { const now = new Date(); setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedDate(now); };

  return (
    <div className="space-y-6">
      <PendingApprovalsBanner
        pendingApprovals={pendingApprovals}
        actionId={actionId}
        onConfirm={handleConfirm}
        onDecline={handleDecline}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <CalendarNavigation
            monthLabel={monthLabel}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onGoToToday={goToToday}
          />

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#6B4D37]/20 border-t-[#6B4D37] rounded-full animate-spin" />
                <span className="text-sm text-dash-text-secondary/60">Loading calendar...</span>
              </div>
            </div>
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              selectedDate={selectedDate}
              appointments={appointments}
              availability={availability}
              onSelectDate={(date) => setSelectedDate(date)}
            />
          )}
        </div>

        <div className="w-full lg:w-80 xl:w-96 shrink-0">
          <DayDetailPanel
            selectedDate={selectedDate}
            selectedAppts={selectedAppts}
            selectedSlots={selectedSlots}
            actionId={actionId}
            onConfirm={handleConfirm}
            onDecline={handleDecline}
            onAddSlot={handleAddSlot}
            onDeleteSlot={handleDeleteSlot}
            slotSaving={slotSaving}
          />
        </div>
      </div>

      {/* All Appointments List */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-dash-text-primary">All Appointments — {monthLabel}</h3>
            <p className="text-xs text-dash-text-secondary/60 mt-0.5">{appointments.length} total this month</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(['all', 'requested', 'confirmed', 'scheduled', 'completed', 'cancelled'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setListFilter(f)}
                className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors capitalize ${
                  listFilter === f
                    ? 'bg-[#6B4D37] text-white'
                    : 'bg-[#EDE8E0]/60 text-dash-text-secondary/80 hover:bg-[#EDE8E0]/50'
                }`}
              >
                {f === 'all' ? `All (${appointments.length})` : `${f} (${appointments.filter((a) => a.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center text-sm text-dash-text-secondary/40">Loading...</div>
        ) : filteredList.length === 0 ? (
          <div className="p-6 text-center text-sm text-dash-text-secondary/40 italic">No appointments{listFilter !== 'all' ? ` with status "${listFilter}"` : ''} this month.</div>
        ) : (
          <ul className="divide-y divide-dash-section-border">
            {filteredList.map((appt) => (
              <li key={appt._id} className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-[#EDE8E0]/50">
                <div className="flex items-start gap-3 min-w-0">
                  <span className={`mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full ${STATUS_COLORS[appt.status]}`} />
                  <div className="min-w-0">
                    <p className="font-medium text-dash-text-primary text-sm truncate">{clientName(appt)}</p>
                    <p className="text-xs text-dash-text-secondary/60 mt-0.5">
                      {formatDate(appt.startTime)} · {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                      {appt.type && ` · ${appt.type === 'virtual' ? 'Virtual' : 'In-person'}`}
                    </p>
                    {appt.notes && <p className="text-xs text-dash-text-secondary/40 mt-0.5 italic truncate">"{appt.notes}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${STATUS_BADGE[appt.status]}`}>
                    {STATUS_LABELS[appt.status]}
                  </span>
                  {appt.status === 'requested' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleConfirm(appt._id)}
                        disabled={actionId !== null}
                        className="px-3 py-1 text-xs font-medium bg-[#3F4E4F] text-white rounded hover:bg-[#2C3639] disabled:opacity-50"
                      >
                        {actionId === appt._id ? '...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(appt._id)}
                        disabled={actionId !== null}
                        className="px-3 py-1 text-xs font-medium border border-dash-border text-dash-text-secondary rounded hover:bg-[#EDE8E0]/50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProviderCalendar;
