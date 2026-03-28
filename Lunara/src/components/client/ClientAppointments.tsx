import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../api/apiClient';
import type { Appointment, Slot } from './appointmentTypes';
import { STATUS_COLORS, STATUS_BADGE, STATUS_LABELS, dateKey, formatTime, formatDate } from './appointmentTypes';
import { ClientCalendarGrid } from './ClientCalendarGrid';
import { ClientDayDetailPanel } from './ClientDayDetailPanel';

export const ClientAppointments: React.FC = () => {
  const api = ApiClient.getInstance();

  // Provider / profile
  const [profile, setProfile] = useState<{
    assignedProvider?: { _id: string; firstName?: string; lastName?: string } | string;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Calendar data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Calendar navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Booking state
  const [bookingType, setBookingType] = useState<'virtual' | 'in_person'>('virtual');
  const [bookingNotes, setBookingNotes] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestingProposed, setRequestingProposed] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────

  const providerUserId =
    typeof profile?.assignedProvider === 'string'
      ? profile.assignedProvider
      : profile?.assignedProvider?._id;

  const providerName = (() => {
    const p = profile?.assignedProvider;
    if (!p || typeof p === 'string') return 'Your provider';
    return [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Your provider';
  })();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const apptMap = useMemo(() => {
    const m = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const key = dateKey(new Date(appt.startTime));
      m.set(key, [...(m.get(key) ?? []), appt]);
    }
    return m;
  }, [appointments]);

  const slotMap = useMemo(() => {
    const m = new Map<string, Slot[]>();
    for (const slot of slots) {
      const key = dateKey(new Date(slot.date));
      m.set(key, [...(m.get(key) ?? []), slot]);
    }
    return m;
  }, [slots]);

  const selectedKey = selectedDate ? dateKey(selectedDate) : null;
  const selectedAppts = selectedKey ? (apptMap.get(selectedKey) ?? []) : [];
  const selectedSlots = selectedKey ? (slotMap.get(selectedKey) ?? []) : [];

  // ── Data loading ─────────────────────────────────────────────────────────

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const data = await api.get<{ assignedProvider?: { _id: string; firstName?: string; lastName?: string } }>('/client/me');
      setProfile(data ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [api]);

  const loadData = useCallback(async () => {
    if (!providerUserId) return;
    setLoadingData(true);
    try {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString();

      const [apptData, slotData] = await Promise.all([
        api.get<Appointment[] | { data?: Appointment[] }>(`/appointments/upcoming?limit=100`),
        api.get<{ slots?: Slot[] }>(`/providers/${providerUserId}/availability?from=${from}&to=${to}`),
      ]);

      const apptList = Array.isArray(apptData) ? apptData : apptData.data ?? [];
      setAppointments(Array.isArray(apptList) ? apptList : []);
      setSlots(Array.isArray(slotData?.slots) ? slotData.slots : []);
    } catch {
      setAppointments([]);
      setSlots([]);
    } finally {
      setLoadingData(false);
    }
  }, [api, year, month, providerUserId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { if (providerUserId) loadData(); }, [loadData, providerUserId]);

  // ── Booking handlers ─────────────────────────────────────────────────────

  const handleBookSlot = async (slot: Slot) => {
    if (!providerUserId) return;
    setRequesting(true);
    try {
      await api.post('/appointments/request', {
        providerId: providerUserId,
        slotId: slot._id,
        type: bookingType,
        notes: bookingNotes.trim() || undefined,
      });
      toast.success('Appointment request sent. Your provider will confirm the time.');
      setBookingNotes('');
      loadData();
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(status === 409 ? 'That slot was just taken. Please choose another.' : (msg ?? 'Failed to request appointment'));
      if (status === 409) loadData();
    } finally {
      setRequesting(false);
    }
  };

  const handleRequestProposed = async (date: string, startTime: string, endTime: string) => {
    if (!providerUserId || !date || !startTime || !endTime) {
      toast.error('Please fill in date, start time, and end time.');
      return;
    }
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);
    if (end <= start) { toast.error('End time must be after start time.'); return; }
    setRequestingProposed(true);
    try {
      await api.post('/appointments/request-proposed', {
        providerId: providerUserId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        type: bookingType,
        notes: bookingNotes.trim() || undefined,
      });
      toast.success('Request sent. Your provider will approve or suggest another time.');
      setBookingNotes('');
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(message ?? 'Failed to send request.');
    } finally {
      setRequestingProposed(false);
    }
  };

  // ── Navigation ───────────────────────────────────────────────────────────

  const prevMonth = () => { setCurrentMonth(new Date(year, month - 1, 1)); setSelectedDate(null); };
  const nextMonth = () => { setCurrentMonth(new Date(year, month + 1, 1)); setSelectedDate(null); };
  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(now);
  };

  // ── Loading / no-provider states ─────────────────────────────────────────

  if (loadingProfile) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-[#6B4D37] border-t-transparent" />
      </div>
    );
  }

  if (!providerUserId) {
    return (
      <div className="p-6">
        <p className="text-[#6B4D37]">You don't have an assigned provider yet. Once one is assigned, you'll be able to book appointments here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors" aria-label="Previous month">
                <svg className="w-5 h-5 text-[#6B4D37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-[#4E1B00] min-w-[200px] text-center">{monthLabel}</h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors" aria-label="Next month">
                <svg className="w-5 h-5 text-[#6B4D37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <button onClick={goToToday} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[#FAF7F2] text-[#6B4D37] hover:bg-[#DED7CD]/40 transition-colors">
              Today
            </button>
          </div>

          {loadingData ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-4 border-[#DED7CD] border-t-[#6B4D37] rounded-full animate-spin" />
                <span className="text-sm text-[#6B4D37]/70">Loading calendar...</span>
              </div>
            </div>
          ) : (
            <ClientCalendarGrid
              year={year}
              month={month}
              selectedDate={selectedDate}
              appointments={appointments}
              slots={slots}
              onSelectDate={setSelectedDate}
            />
          )}
        </div>

        <div className="w-full lg:w-80 xl:w-96 shrink-0">
          <ClientDayDetailPanel
            selectedDate={selectedDate}
            selectedAppts={selectedAppts}
            selectedSlots={selectedSlots}
            providerName={providerName}
            bookingType={bookingType}
            bookingNotes={bookingNotes}
            requesting={requesting}
            requestingProposed={requestingProposed}
            onBookingTypeChange={setBookingType}
            onBookingNotesChange={setBookingNotes}
            onBookSlot={handleBookSlot}
            onRequestProposed={handleRequestProposed}
          />
        </div>
      </div>

      {/* All Upcoming Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-[#DED7CD]">
        <div className="px-4 sm:px-6 py-4 border-b border-[#DED7CD]">
          <h3 className="font-semibold text-[#4E1B00]">All Upcoming Appointments</h3>
          <p className="text-xs text-[#6B4D37]/70 mt-0.5">With {providerName}</p>
        </div>

        {loadingData ? (
          <div className="p-6 text-center text-sm text-[#BCADA5]">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#BCADA5] italic">No upcoming appointments.</div>
        ) : (
          <ul className="divide-y divide-[#DED7CD]">
            {appointments.map((appt) => (
              <li
                key={appt._id}
                onClick={() => {
                  const d = new Date(appt.startTime);
                  setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                  setSelectedDate(d);
                }}
                className="px-4 sm:px-6 py-3 flex items-start gap-3 hover:bg-[#FAF7F2] cursor-pointer transition-colors"
              >
                <span className={`mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full ${STATUS_COLORS[appt.status]}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#4E1B00]">{formatDate(appt.startTime)}</p>
                  <p className="text-xs text-[#6B4D37]/70 mt-0.5">
                    {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                    {appt.type && ` · ${appt.type === 'virtual' ? 'Virtual' : 'In-person'}`}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded shrink-0 ${STATUS_BADGE[appt.status]}`}>
                  {STATUS_LABELS[appt.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
