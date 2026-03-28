import React from 'react';
import { Slot } from './types';

export interface SlotBookingConfirmationProps {
  selectedSlot: Slot;
  providerName: string;
  bookingType: 'virtual' | 'in_person';
  bookingNotes: string;
  requesting: boolean;
  onBookingTypeChange: (value: 'virtual' | 'in_person') => void;
  onBookingNotesChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SlotBookingConfirmation: React.FC<SlotBookingConfirmationProps> = ({
  selectedSlot,
  providerName,
  bookingType,
  bookingNotes,
  requesting,
  onBookingTypeChange,
  onBookingNotesChange,
  onCancel,
  onConfirm,
}) => (
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
      <button type="button" onClick={onCancel} className="flex-1 py-2 text-xs font-medium border border-[#CAC3BC] text-[#4E1B00]/80 rounded-md hover:bg-[#FAF7F2]">
        Back
      </button>
      <button type="button" onClick={onConfirm} disabled={requesting} className="flex-1 py-2 text-xs font-medium bg-[#3F4E4F] text-white rounded-md hover:bg-[#2C3639] disabled:opacity-50">
        {requesting ? 'Sending...' : 'Request Appointment'}
      </button>
    </div>
  </div>
);
