/**
 * @module components/provider/DayDetailPanel
 * Side panel for a selected calendar day showing the day's appointments
 * with approve/decline actions, and availability slots with add/delete controls.
 */
import React, { useState } from 'react';
import {
  Appointment,
  AvailabilitySlot,
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_BADGE,
  clientName,
  formatTime,
} from './calendarTypes';

/** Props for the provider day detail panel. */
export interface DayDetailPanelProps {
  selectedDate: Date | null;
  selectedAppts: Appointment[];
  selectedSlots: AvailabilitySlot[];
  actionId: string | null;
  onConfirm: (id: string) => void;
  onDecline: (id: string) => void;
  onAddSlot: (slotStart: string, slotEnd: string) => Promise<boolean>;
  onDeleteSlot: (slotId: string) => void;
  slotSaving: boolean;
}

/** Day sidebar with appointment cards, approve/decline actions, and availability slot management. */
export const DayDetailPanel: React.FC<DayDetailPanelProps> = ({
  selectedDate,
  selectedAppts,
  selectedSlots,
  actionId,
  onConfirm,
  onDecline,
  onAddSlot,
  onDeleteSlot,
  slotSaving,
}) => {
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [slotStart, setSlotStart] = useState('09:00');
  const [slotEnd, setSlotEnd] = useState('10:00');

  const handleAddSlot = async () => {
    const success = await onAddSlot(slotStart, slotEnd);
    if (success) {
      setShowAddSlot(false);
      setSlotStart('09:00');
      setSlotEnd('10:00');
    }
  };

  // Reset form when selected date changes
  // (parent resets by unmounting/remounting via key, or we handle inline)

  if (!selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-dash-border gap-2">
        <svg className="w-8 h-8 text-dash-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-dash-text-secondary/40">Select a day to view details</p>
      </div>
    );
  }

  return (
    <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border overflow-hidden">
      <div className="px-4 py-3 border-b border-dash-section-border bg-[#EDE8E0]/30 flex items-center justify-between">
        <h3 className="font-semibold text-dash-text-primary text-sm">
          {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <button
          type="button"
          onClick={() => setShowAddSlot((v) => !v)}
          className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#3F4E4F]/10 text-[#3F4E4F] hover:bg-[#3F4E4F]/20 transition-colors"
        >
          {showAddSlot ? 'Cancel' : '+ Add slot'}
        </button>
      </div>

      <div className="divide-y divide-dash-section-border max-h-[calc(100vh-320px)] overflow-y-auto">

        {/* Add slot form */}
        {showAddSlot && (
          <div className="p-4 bg-[#3F4E4F]/5">
            <p className="text-xs font-semibold text-[#3F4E4F] mb-3 uppercase tracking-wider">New Availability Slot</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-dash-text-secondary/80 mb-1 block">Start</label>
                <input
                  type="time"
                  value={slotStart}
                  onChange={(e) => setSlotStart(e.target.value)}
                  className="w-full text-sm border border-dash-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3F4E4F] focus:border-[#3F4E4F]"
                />
              </div>
              <div>
                <label className="text-xs text-dash-text-secondary/80 mb-1 block">End</label>
                <input
                  type="time"
                  value={slotEnd}
                  onChange={(e) => setSlotEnd(e.target.value)}
                  className="w-full text-sm border border-dash-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#3F4E4F] focus:border-[#3F4E4F]"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleAddSlot}
              disabled={slotSaving}
              className="w-full py-2 text-sm font-medium bg-[#3F4E4F] text-white rounded-md hover:bg-[#2C3639] disabled:opacity-50 transition-colors"
            >
              {slotSaving ? 'Saving...' : 'Save Slot'}
            </button>
          </div>
        )}

        {/* Appointments section */}
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary/60 mb-3">
            Appointments ({selectedAppts.length})
          </h4>
          {selectedAppts.length === 0 ? (
            <p className="text-sm text-dash-text-secondary/40 italic">No appointments</p>
          ) : (
            <ul className="space-y-2.5">
              {selectedAppts.map((appt) => (
                <li key={appt._id} className="rounded-lg p-3 bg-[#EDE8E0]/30 border border-dash-section-border">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full ${STATUS_COLORS[appt.status]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-dash-text-primary truncate">{clientName(appt)}</p>
                      <p className="text-xs text-dash-text-secondary/60 mt-0.5">{formatTime(appt.startTime)} – {formatTime(appt.endTime)}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${STATUS_BADGE[appt.status]}`}>
                          {STATUS_LABELS[appt.status]}
                        </span>
                        {appt.type && (
                          <span className="text-[10px] text-dash-text-secondary/40">
                            {appt.type === 'virtual' ? '\u{1F5A5} Virtual' : '\u{1F4CD} In-person'}
                          </span>
                        )}
                      </div>
                      {appt.status === 'requested' && (
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => onConfirm(appt._id)}
                            disabled={actionId !== null}
                            className="flex-1 py-1 text-xs font-medium bg-[#3F4E4F] text-white rounded hover:bg-[#2C3639] disabled:opacity-50"
                          >
                            {actionId === appt._id ? '...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onDecline(appt._id)}
                            disabled={actionId !== null}
                            className="flex-1 py-1 text-xs font-medium border border-dash-border text-dash-text-secondary rounded hover:bg-[#EDE8E0]/50 disabled:opacity-50"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Availability section */}
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-dash-text-secondary/60 mb-3">
            Availability ({selectedSlots.length})
          </h4>
          {selectedSlots.length === 0 ? (
            <p className="text-sm text-dash-text-secondary/40 italic">No slots — click "+ Add slot" above</p>
          ) : (
            <ul className="space-y-1.5">
              {selectedSlots.map((slot) => (
                <li key={slot._id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-[#3F4E4F]/5 border border-[#3F4E4F]/20">
                  <div>
                    <span className="text-sm font-medium text-dash-text-secondary">{slot.startTime} – {slot.endTime}</span>
                    <span className={`ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${slot.isBooked ? 'bg-[#EDE8E0]/60 text-dash-text-secondary/80' : 'bg-[#3F4E4F]/10 text-[#3F4E4F]'}`}>
                      {slot.isBooked ? 'Booked' : 'Open'}
                    </span>
                  </div>
                  {!slot.isBooked && (
                    <button
                      type="button"
                      onClick={() => onDeleteSlot(slot._id)}
                      disabled={actionId === slot._id}
                      className="p-1 text-dash-text-secondary/40 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Remove slot"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
