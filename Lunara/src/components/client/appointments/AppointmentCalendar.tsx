import React, { useMemo } from 'react';
import {
  Appointment,
  Slot,
  WEEKDAYS,
  STATUS_COLORS,
  STATUS_LABELS,
  dateKey,
  isSameDay,
} from './types';

export interface AppointmentCalendarProps {
  currentMonth: Date;
  selectedDate: Date | null;
  appointments: Appointment[];
  slots: Slot[];
  loadingData: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  onSelectDate: (date: Date) => void;
}

export const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({
  currentMonth,
  selectedDate,
  appointments,
  slots,
  loadingData,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  onSelectDate,
}) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Build day-keyed maps
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

  const monthLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="flex-1 min-w-0">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={onPrevMonth} className="p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors" aria-label="Previous month">
            <svg className="w-5 h-5 text-[#6B4D37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-[#4E1B00] min-w-[200px] text-center">{monthLabel}</h2>
          <button onClick={onNextMonth} className="p-2 rounded-lg hover:bg-[#FAF7F2] transition-colors" aria-label="Next month">
            <svg className="w-5 h-5 text-[#6B4D37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button onClick={onGoToToday} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[#FAF7F2] text-[#6B4D37] hover:bg-[#DED7CD]/40 transition-colors">
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
        <div className="bg-white rounded-xl shadow-sm border border-[#DED7CD] overflow-hidden">
          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b border-[#DED7CD]">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#6B4D37]/70">
                {day}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[80px] sm:min-h-[96px] border-b border-r border-[#DED7CD] bg-[#FAF7F2]/50" />;
              }
              const cellDate = new Date(year, month, day);
              const key = dateKey(cellDate);
              const dayAppts = apptMap.get(key) ?? [];
              const daySlots = slotMap.get(key) ?? [];
              const isToday = isSameDay(cellDate, today);
              const isSelected = selectedDate !== null && isSameDay(cellDate, selectedDate);

              return (
                <button
                  key={key}
                  onClick={() => onSelectDate(cellDate)}
                  className={`
                    relative min-h-[80px] sm:min-h-[96px] p-1.5 sm:p-2 text-left
                    border-b border-r border-[#DED7CD] transition-colors
                    focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#6B4D37]
                    ${daySlots.length > 0 ? 'bg-[#8C9A8C]/40' : 'bg-white'}
                    ${isSelected ? 'ring-2 ring-inset ring-[#6B4D37] bg-[#FAF7F2]/50' : ''}
                    hover:bg-[#FAF7F2]
                  `}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full ${isToday ? 'bg-[#6B4D37] text-white' : 'text-[#4E1B00]/80'}`}>
                    {day}
                  </span>
                  {/* Appointment dots */}
                  {dayAppts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {dayAppts.slice(0, 4).map((appt) => (
                        <span key={appt._id} className={`w-2 h-2 rounded-full ${STATUS_COLORS[appt.status]}`} title={STATUS_LABELS[appt.status]} />
                      ))}
                      {dayAppts.length > 4 && <span className="text-[10px] text-[#BCADA5]">+{dayAppts.length - 4}</span>}
                    </div>
                  )}
                  {/* Available slots badge */}
                  {daySlots.length > 0 && (
                    <span className="absolute bottom-1 right-1 text-[10px] font-medium text-[#3F4E4F]">
                      {daySlots.length} open
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      {!loadingData && (
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-[#6B4D37]/70">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              {STATUS_LABELS[status as Appointment['status']]}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#8C9A8C]/20 border border-[#8C9A8C]" />
            Available slots
          </span>
        </div>
      )}
    </div>
  );
};
