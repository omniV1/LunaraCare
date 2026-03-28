import React from 'react';
import { dateKey } from './types';

export interface ProposedTimeFormProps {
  selectedDate: Date;
  proposedDate: string;
  proposedStart: string;
  proposedEnd: string;
  bookingType: 'virtual' | 'in_person';
  bookingNotes: string;
  requestingProposed: boolean;
  onProposedDateChange: (value: string) => void;
  onProposedStartChange: (value: string) => void;
  onProposedEndChange: (value: string) => void;
  onBookingTypeChange: (value: 'virtual' | 'in_person') => void;
  onBookingNotesChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProposedTimeForm: React.FC<ProposedTimeFormProps> = ({
  selectedDate,
  proposedDate,
  proposedStart,
  proposedEnd,
  bookingType,
  bookingNotes,
  requestingProposed,
  onProposedDateChange,
  onProposedStartChange,
  onProposedEndChange,
  onBookingTypeChange,
  onBookingNotesChange,
  onSubmit,
}) => (
  <form onSubmit={onSubmit} className="p-4 bg-[#FAF7F2]/60 space-y-3">
    <p className="text-xs font-semibold text-[#4E1B00] uppercase tracking-wider">Request a Specific Time</p>
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-xs text-[#6B4D37] mb-1 block">Date</label>
        <input
          type="date"
          value={proposedDate || dateKey(selectedDate)}
          onChange={(e) => onProposedDateChange(e.target.value)}
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
        <input type="time" value={proposedStart} onChange={(e) => onProposedStartChange(e.target.value)} required className="w-full text-sm border border-[#CAC3BC] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6B4D37]" />
      </div>
      <div>
        <label className="text-xs text-[#6B4D37] mb-1 block">End</label>
        <input type="time" value={proposedEnd} onChange={(e) => onProposedEndChange(e.target.value)} required className="w-full text-sm border border-[#CAC3BC] rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6B4D37]" />
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
);
