import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientDayDetailPanel } from '../../components/client/ClientDayDetailPanel';
import type { Appointment, Slot } from '../../components/client/appointmentTypes';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSlot(overrides: Partial<Slot> = {}): Slot {
  return {
    _id: 'slot-1',
    date: '2026-03-18T00:00:00.000Z',
    startTime: '09:00',
    endTime: '10:00',
    ...overrides,
  } as Slot;
}

function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    _id: 'appt-1',
    startTime: '2026-03-18T10:00:00.000Z',
    endTime: '2026-03-18T11:00:00.000Z',
    status: 'confirmed',
    type: 'virtual',
    ...overrides,
  } as Appointment;
}

const defaultProps = {
  selectedDate: new Date(2026, 2, 18), // March 18, 2026
  selectedAppts: [] as Appointment[],
  selectedSlots: [] as Slot[],
  providerName: 'Dr. Smith',
  bookingType: 'virtual' as const,
  bookingNotes: '',
  requesting: false,
  requestingProposed: false,
  onBookingTypeChange: jest.fn(),
  onBookingNotesChange: jest.fn(),
  onBookSlot: jest.fn(),
  onRequestProposed: jest.fn(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClientDayDetailPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows placeholder when no date is selected', () => {
    render(<ClientDayDetailPanel {...defaultProps} selectedDate={null} />);
    expect(screen.getByText('Select a day to view or book')).toBeInTheDocument();
  });

  it('shows selected date in header', () => {
    render(<ClientDayDetailPanel {...defaultProps} />);
    // Should contain "Wednesday, March 18" (locale dependent, so just check partial)
    expect(screen.getByText(/March/)).toBeInTheDocument();
    expect(screen.getByText(/18/)).toBeInTheDocument();
  });

  it('shows "Request time" button', () => {
    render(<ClientDayDetailPanel {...defaultProps} />);
    expect(screen.getByText('Request time')).toBeInTheDocument();
  });

  it('toggles proposed-time form on "Request time" click', () => {
    render(<ClientDayDetailPanel {...defaultProps} />);

    fireEvent.click(screen.getByText('Request time'));
    expect(screen.getByText('Request a Specific Time')).toBeInTheDocument();
    expect(screen.getByText('Send Request')).toBeInTheDocument();

    // Click Cancel to hide
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Request a Specific Time')).not.toBeInTheDocument();
  });

  it('shows empty appointments message', () => {
    render(<ClientDayDetailPanel {...defaultProps} />);
    expect(screen.getByText('My Appointments (0)')).toBeInTheDocument();
    expect(screen.getByText('No appointments on this day')).toBeInTheDocument();
  });

  it('renders appointments when provided', () => {
    const appts = [makeAppt()];
    render(<ClientDayDetailPanel {...defaultProps} selectedAppts={appts} />);

    expect(screen.getByText('My Appointments (1)')).toBeInTheDocument();
    expect(screen.getByText(/With Dr. Smith/)).toBeInTheDocument();
  });

  it('shows empty slots message', () => {
    render(<ClientDayDetailPanel {...defaultProps} />);
    expect(screen.getByText('Available Times (0)')).toBeInTheDocument();
    expect(screen.getByText(/No open slots/)).toBeInTheDocument();
  });

  it('renders available slot buttons', () => {
    const slots = [makeSlot()];
    render(<ClientDayDetailPanel {...defaultProps} selectedSlots={slots} />);

    expect(screen.getByText('Available Times (1)')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 10:00')).toBeInTheDocument();
  });

  it('shows booking confirmation when slot is selected', () => {
    const slots = [makeSlot()];
    render(<ClientDayDetailPanel {...defaultProps} selectedSlots={slots} />);

    fireEvent.click(screen.getByText('09:00 – 10:00'));

    expect(screen.getByText('Confirm Booking')).toBeInTheDocument();
    expect(screen.getByText(/09:00 – 10:00 with Dr. Smith/)).toBeInTheDocument();
    expect(screen.getByText('Request Appointment')).toBeInTheDocument();
  });

  it('calls onBookSlot when confirming a slot', () => {
    const slot = makeSlot();
    render(<ClientDayDetailPanel {...defaultProps} selectedSlots={[slot]} />);

    fireEvent.click(screen.getByText('09:00 – 10:00'));
    fireEvent.click(screen.getByText('Request Appointment'));

    expect(defaultProps.onBookSlot).toHaveBeenCalledWith(slot);
  });

  it('hides booking confirmation on Back button', () => {
    const slots = [makeSlot()];
    render(<ClientDayDetailPanel {...defaultProps} selectedSlots={slots} />);

    fireEvent.click(screen.getByText('09:00 – 10:00'));
    expect(screen.getByText('Confirm Booking')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Back'));
    expect(screen.queryByText('Confirm Booking')).not.toBeInTheDocument();
  });

  it('submits proposed time form', () => {
    render(<ClientDayDetailPanel {...defaultProps} />);

    fireEvent.click(screen.getByText('Request time'));

    // Labels aren't linked via htmlFor, so query time inputs from the form
    const form = screen.getByText('Request a Specific Time').closest('form')!;
    const timeInputs = form.querySelectorAll('input[type="time"]');
    fireEvent.change(timeInputs[0], { target: { value: '14:00' } });
    fireEvent.change(timeInputs[1], { target: { value: '15:00' } });

    // Use fireEvent.submit to bypass HTML5 validation in jsdom
    fireEvent.submit(form);
    expect(defaultProps.onRequestProposed).toHaveBeenCalledWith(
      expect.any(String), // date
      '14:00',
      '15:00'
    );
  });

  it('shows "Sending..." when requestingProposed is true', () => {
    render(<ClientDayDetailPanel {...defaultProps} requestingProposed={true} />);

    fireEvent.click(screen.getByText('Request time'));
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });
});
