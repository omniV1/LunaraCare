import React, { useState } from 'react';
import type { Appointment, Slot } from './appointmentTypes';
import { STATUS_COLORS, STATUS_BADGE, STATUS_LABELS, dateKey, formatTime } from './appointmentTypes';

interface ClientDayDetailPanelProps {
  selectedDate: Date | null;
  selectedAppts: Appointment[];
  selectedSlots: Slot[];
  providerName: string;
  bookingType: 'virtual' | 'in_person';
  bookingNotes: string;
  requesting: boolean;
  requestingProposed: boolean;
  onBookingTypeChange: (type: 'virtual' | 'in_person') => void;
  onBookingNotesChange: (notes: string) => void;
  onBookSlot: (slot: Slot) => void;
  onRequestProposed: (date: string, startTime: string, endTime: string) => void;
}

export const ClientDayDetailPanel: React.FC<ClientDayDetailPanelProps> = React.memo(({
  selectedDate,
  selectedAppts,
  selectedSlots,
  providerName,
  bookingType,
  bookingNotes,
  requesting,
  requestingProposed,
  onBookingTypeChange,
  onBookingNotesChange,
  onBookSlot,
  onRequestProposed,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showProposed, setShowProposed] = useState(false);
  const [proposedDate, setProposedDate] = useState('');
  const [proposedStart, setProposedStart] = useState('');
  const [proposedEnd, setProposedEnd] = useState('');

  if (!selectedDate) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-[#DED7CD] gap-2">
        <svg className="w-8 h-8 text-[#BCADA5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-[#BCADA5]">Select a day to view or book</p>
      </div>
    );
  }

  const handleSubmitProposed = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDate = proposedDate || dateKey(selectedDate);
    onRequestProposed(effectiveDate, proposedStart, proposedEnd);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#DED7CD] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#DED7CD] bg-[#FAF7F2] flex items-center justify-between">
        <h3 className="font-semibold text-[#4E1B00] text-sm">
          {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
        </h3>
        <button
          type="button"
          onClick={() => {
            setShowProposed((v) => !v);
            setSelectedSlot(null);
            if (!showProposed && selectedDate) {
              setProposedDate(dateKey(selectedDate));
              setProposedStart('');
              setProposedEnd('');
            }
          }}
          className="text-xs font-medium px-2.5 py-1 rounded-md bg-[#FAF7F2] text-[#5a402e] hover:bg-[#DED7CD]/40 transition-colors"
        >
          {showProposed ? 'Cancel' : 'Request time'}
        </button>
      </div>

      <div className="divide-y divide-[#DED7CD] max-h-[calc(100vh-320px)] overflow-y-auto">
        {/* Proposed-time form */}
        {showProposed && (
          <form onSubmit={handleSubmitProposed} className="p-4 bg-[#FAF7F2]/60 space-y-3">
            <p className="text-xs font-semibold text-[#4E1B00] uppercase tracking-wider">Request a Specific Time</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#6B4D37] mb-1 block">Date</label>
                <input
                  type="date"
                  value={proposedDate || dateKey(selectedDate)}
                  onChange={(e) => setProposedDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  className="w-full text-sm border border-[#CAC3BC] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6B4D37]"
                />
              </div>
              <div>
                <label className="text-xs text-[#6B4D37] mb-1 block">Type</label>
                <select
                  value={bookingType}
                  onChange={(e) => onBookingTypeChange(e.target.value as 'virtual' | 'in_person')}
                  className="w-full text-sm border border-[#CAC3BC] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6B4D37]"
                >
                  <option value="virtual">Virtual</option>
                  <option value="in_person">In person</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#6B4D37] mb-1 block">Start</label>
                <input type="time" value={proposedStart} onChange={(e) => setProposedStart(e.target.value)} required className="w-full text-sm border border-[#CAC3BC] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6B4D37]" />
              </div>
              <div>
                <label className="text-xs text-[#6B4D37] mb-1 block">End</label>
                <input type="time" value={proposedEnd} onChange={(e) => setProposedEnd(e.target.value)} required className="w-full text-sm border border-[#CAC3BC] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6B4D37]" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6B4D37] mb-1 block">Notes (optional)</label>
              <textarea value={bookingNotes} onChange={(e) => onBookingNotesChange(e.target.value)} rows={2} placeholder="e.g. topic or location" className="w-full text-sm border border-[#CAC3BC] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6B4D37]" />
            </div>
            <button type="submit" disabled={requestingProposed} className="w-full py-2 text-sm font-medium bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e] disabled:opacity-50 transition-colors">
              {requestingProposed ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        )}

        {/* Slot booking confirmation */}
        {selectedSlot && !showProposed && (
          <div className="p-4 bg-[#8C9A8C]/60">
            <p className="text-xs font-semibold text-[#2C3639] uppercase tracking-wider mb-3">Confirm Booking</p>
            <p className="text-sm font-medium text-[#4E1B00] mb-3">
              {selectedSlot.startTime} – {selectedSlot.endTime} with {providerName}
            </p>
            <div className="space-y-3 mb-3">
              <div>
                <label className="text-xs text-[#6B4D37] mb-1 block">Type</label>
                <select value={bookingType} onChange={(e) => onBookingTypeChange(e.target.value as 'virtual' | 'in_person')} className="w-full text-sm border border-[#CAC3BC] rounded-md px-2 py-1.5">
                  <option value="virtual">Virtual</option>
                  <option value="in_person">In person</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#6B4D37] mb-1 block">Notes (optional)</label>
                <textarea value={bookingNotes} onChange={(e) => onBookingNotesChange(e.target.value)} rows={2} placeholder="e.g. topic or location" className="w-full text-sm border border-[#CAC3BC] rounded-md px-2 py-1.5" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setSelectedSlot(null); onBookingNotesChange(''); }} className="flex-1 py-2 text-xs font-medium border border-[#CAC3BC] text-[#4E1B00]/80 rounded-md hover:bg-[#FAF7F2]">
                Back
              </button>
              <button type="button" onClick={() => onBookSlot(selectedSlot)} disabled={requesting} className="flex-1 py-2 text-xs font-medium bg-[#3F4E4F] text-white rounded-md hover:bg-[#2C3639] disabled:opacity-50">
                {requesting ? 'Sending...' : 'Request Appointment'}
              </button>
            </div>
          </div>
        )}

        {/* Appointments for this day */}
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B4D37]/70 mb-3">
            My Appointments ({selectedAppts.length})
          </h4>
          {selectedAppts.length === 0 ? (
            <p className="text-sm text-[#BCADA5] italic">No appointments on this day</p>
          ) : (
            <ul className="space-y-2.5">
              {selectedAppts.map((appt) => (
                <li key={appt._id} className="rounded-lg p-3 bg-[#FAF7F2] border border-[#DED7CD]">
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 w-2.5 h-2.5 shrink-0 rounded-full ${STATUS_COLORS[appt.status]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#4E1B00]">With {providerName}</p>
                      <p className="text-xs text-[#6B4D37]/70 mt-0.5">{formatTime(appt.startTime)} – {formatTime(appt.endTime)}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${STATUS_BADGE[appt.status]}`}>
                          {STATUS_LABELS[appt.status]}
                        </span>
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

        {/* Available slots for this day */}
        <div className="p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6B4D37]/70 mb-3">
            Available Times ({selectedSlots.length})
          </h4>
          {selectedSlots.length === 0 ? (
            <p className="text-sm text-[#BCADA5] italic">No open slots — use "Request time" above</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedSlots.map((slot) => (
                <button
                  key={slot._id}
                  type="button"
                  onClick={() => { setSelectedSlot(slot); setShowProposed(false); onBookingNotesChange(''); }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                    selectedSlot?._id === slot._id
                      ? 'bg-[#3F4E4F] text-white border-[#3F4E4F]'
                      : 'bg-white text-[#4E1B00]/80 border-[#CAC3BC] hover:border-[#3F4E4F] hover:bg-[#8C9A8C]/10'
                  }`}
                >
                  {slot.startTime} – {slot.endTime}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
