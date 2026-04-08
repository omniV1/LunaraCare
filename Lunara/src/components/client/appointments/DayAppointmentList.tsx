/**
 * @module components/client/appointments/DayAppointmentList
 * Lists a client's appointments for a selected day with status badges,
 * time ranges, and virtual/in-person indicators.
 */
import React from 'react';
import { Appointment, STATUS_COLORS, formatTime } from './types';
import { AppointmentStatusBadge } from './AppointmentStatusBadge';

/** Props for the day appointment list. */
export interface DayAppointmentListProps {
  appointments: Appointment[];
  providerName: string;
}

/** Renders a list of client appointments for a single selected day. */
export const DayAppointmentList: React.FC<DayAppointmentListProps> = ({ appointments, providerName }) => (
  <div className="p-4">
    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B4D37]/70 mb-3">
      My Appointments ({appointments.length})
    </h4>
    {appointments.length === 0 ? (
      <p className="text-sm text-[#BCADA5] italic">No appointments on this day</p>
    ) : (
      <ul className="space-y-2.5">
        {appointments.map((appt) => (
          <li key={appt._id} className="rounded-lg p-3 bg-[#FAF7F2] border border-[#DED7CD]">
            <div className="flex items-start gap-2">
              <span className={`mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full ${STATUS_COLORS[appt.status]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#4E1B00]">With {providerName}</p>
                <p className="text-xs text-[#6B4D37]/70 mt-0.5">{formatTime(appt.startTime)} – {formatTime(appt.endTime)}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <AppointmentStatusBadge status={appt.status} />
                  {appt.type && (
                    <span className="text-[10px] text-[#BCADA5]">
                      {appt.type === 'virtual' ? '\u{1F5A5} Virtual' : '\u{1F4CD} In-person'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);
