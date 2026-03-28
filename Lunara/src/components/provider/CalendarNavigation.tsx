import React from 'react';

export interface CalendarNavigationProps {
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
}

export const CalendarNavigation: React.FC<CalendarNavigationProps> = ({
  monthLabel,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <button onClick={onPrevMonth} className="p-2 rounded-lg hover:bg-[#EDE8E0]/50 transition-colors" aria-label="Previous month">
          <svg className="w-5 h-5 text-dash-text-secondary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-dash-text-primary min-w-[200px] text-center">{monthLabel}</h2>
        <button onClick={onNextMonth} className="p-2 rounded-lg hover:bg-[#EDE8E0]/50 transition-colors" aria-label="Next month">
          <svg className="w-5 h-5 text-dash-text-secondary/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <button onClick={onGoToToday} className="text-sm font-medium px-3 py-1.5 rounded-lg bg-[#6B4D37]/5 text-[#6B4D37] hover:bg-[#6B4D37]/10 transition-colors">
        Today
      </button>
    </div>
  );
};
