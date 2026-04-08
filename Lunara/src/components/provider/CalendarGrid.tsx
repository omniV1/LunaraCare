/**
 * @module components/provider/CalendarGrid
 * Monthly calendar grid for the provider calendar view. Renders day cells
 * with appointment status dots, availability slot counts, and pending indicators.
 */
import React, { useMemo } from 'react';
import {
  Appointment,
  AvailabilitySlot,
  WEEKDAYS,
  STATUS_COLORS,
  STATUS_LABELS,
  dateKey,
  isSameDay,
  formatTime,
} from './calendarTypes';

/** Props for the provider calendar grid component. */
export interface CalendarGridProps {
  year: number;
  month: number;
  selectedDate: Date | null;
  appointments: Appointment[];
  availability: AvailabilitySlot[];
  onSelectDate: (date: Date) => void;
}

/** Grid of day cells with appointment dots, slot badges, and pending-approval indicator. */
export const CalendarGrid: React.FC<CalendarGridProps> = React.memo(({
  year,
  month,
  selectedDate,
  appointments,
  availability,
  onSelectDate,
}) => {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

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

  return (
    <>
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-dash-section-border">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-dash-text-secondary/60">
              {day}
            </div>
          ))}
        </div>
        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="min-h-[80px] sm:min-h-[96px] border-b border-r border-dash-section-border bg-[#EDE8E0]/30" />;
            }
            const cellDate = new Date(year, month, day);
            const key = dateKey(cellDate);
            const dayAppts = apptMap.get(key) ?? [];
            const daySlots = slotMap.get(key) ?? [];
            const isToday = isSameDay(cellDate, today);
            const isSelected = selectedDate !== null && isSameDay(cellDate, selectedDate);
            const hasPending = dayAppts.some((a) => a.status === 'requested');

            return (
              <button
                key={key}
                onClick={() => onSelectDate(cellDate)}
                className={`
                  relative min-h-[80px] sm:min-h-[96px] p-1.5 sm:p-2 text-left
                  border-b border-r border-dash-section-border transition-colors
                  focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#6B4D37]
                  ${daySlots.length > 0 ? 'bg-[#3F4E4F]/5' : 'bg-dash-card'}
                  ${isSelected ? 'ring-2 ring-inset ring-[#6B4D37] bg-[#6B4D37]/5' : ''}
                  hover:bg-[#EDE8E0]/50
                `}
              >
                <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${isToday ? 'bg-[#6B4D37] text-white' : 'text-dash-text-secondary'}`}>
                  {day}
                </span>
                {dayAppts.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {dayAppts.slice(0, 4).map((appt) => (
                      <span key={appt._id} className={`w-2 h-2 rounded-full ${STATUS_COLORS[appt.status]}`} title={`${STATUS_LABELS[appt.status]} – ${formatTime(appt.startTime)}`} />
                    ))}
                    {dayAppts.length > 4 && <span className="text-[10px] text-dash-text-secondary/40">+{dayAppts.length - 4}</span>}
                  </div>
                )}
                {daySlots.length > 0 && (
                  <span className="absolute bottom-1 right-1 text-[10px] font-medium text-[#3F4E4F]">
                    {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                  </span>
                )}
                {hasPending && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#AA6641] rounded-full" title="Pending approval" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-dash-text-secondary/60">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {STATUS_LABELS[status as Appointment['status']]}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#3F4E4F]/10 border border-[#3F4E4F]/20" />
          Has availability
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#AA6641]" />
          Pending approval
        </span>
      </div>
    </>
  );
});
