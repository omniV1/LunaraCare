import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DayDetailPanel } from '../../components/provider/DayDetailPanel';
import type { Appointment, AvailabilitySlot } from '../../components/provider/calendarTypes';

function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    _id: 'appt-1',
    clientId: { _id: 'c1', firstName: 'Jane', lastName: 'Doe', email: 'j@t.com' },
    providerId: { _id: 'p1', firstName: 'Dr', lastName: 'S', email: 'd@t.com' },
    startTime: '2026-03-18T10:00:00.000Z',
    endTime: '2026-03-18T11:00:00.000Z',
    status: 'confirmed',
    type: 'virtual',
    ...overrides,
  } as Appointment;
}

function makeSlot(overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot {
  return {
    _id: 'slot-1',
    date: '2026-03-18T00:00:00.000Z',
    startTime: '09:00',
    endTime: '10:00',
    isBooked: false,
    recurring: false,
    ...overrides,
  };
}

const defaultProps = {
  selectedDate: new Date(2026, 2, 18),
  selectedAppts: [] as Appointment[],
  selectedSlots: [] as AvailabilitySlot[],
  actionId: null,
  onConfirm: jest.fn(),
  onDecline: jest.fn(),
  onAddSlot: jest.fn().mockResolvedValue(true),
  onDeleteSlot: jest.fn(),
  slotSaving: false,
};

describe('DayDetailPanel (Provider)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows placeholder when no date selected', () => {
    render(<DayDetailPanel {...defaultProps} selectedDate={null} />);
    expect(screen.getByText('Select a day to view details')).toBeInTheDocument();
  });

  it('shows date in header', () => {
    render(<DayDetailPanel {...defaultProps} />);
    expect(screen.getByText(/March/)).toBeInTheDocument();
  });

  it('shows "+ Add slot" button', () => {
    render(<DayDetailPanel {...defaultProps} />);
    expect(screen.getByText('+ Add slot')).toBeInTheDocument();
  });

  it('toggles add slot form', () => {
    render(<DayDetailPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Add slot'));
    expect(screen.getByText('New Availability Slot')).toBeInTheDocument();
    expect(screen.getByText('Save Slot')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('New Availability Slot')).not.toBeInTheDocument();
  });

  it('calls onAddSlot when saving a slot', async () => {
    render(<DayDetailPanel {...defaultProps} />);
    fireEvent.click(screen.getByText('+ Add slot'));
    fireEvent.click(screen.getByText('Save Slot'));

    await waitFor(() => {
      expect(defaultProps.onAddSlot).toHaveBeenCalledWith('09:00', '10:00');
    });
  });

  it('shows empty appointments message', () => {
    render(<DayDetailPanel {...defaultProps} />);
    expect(screen.getByText('Appointments (0)')).toBeInTheDocument();
    expect(screen.getByText('No appointments')).toBeInTheDocument();
  });

  it('renders appointment details', () => {
    render(<DayDetailPanel {...defaultProps} selectedAppts={[makeAppt()]} />);
    expect(screen.getByText('Appointments (1)')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('shows approve/decline for requested appointments', () => {
    const appt = makeAppt({ status: 'requested' });
    render(<DayDetailPanel {...defaultProps} selectedAppts={[appt]} />);
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Decline')).toBeInTheDocument();
  });

  it('calls onConfirm when Approve clicked', () => {
    const appt = makeAppt({ status: 'requested' });
    render(<DayDetailPanel {...defaultProps} selectedAppts={[appt]} />);
    fireEvent.click(screen.getByText('Approve'));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('appt-1');
  });

  it('calls onDecline when Decline clicked', () => {
    const appt = makeAppt({ status: 'requested' });
    render(<DayDetailPanel {...defaultProps} selectedAppts={[appt]} />);
    fireEvent.click(screen.getByText('Decline'));
    expect(defaultProps.onDecline).toHaveBeenCalledWith('appt-1');
  });

  it('shows empty availability message', () => {
    render(<DayDetailPanel {...defaultProps} />);
    expect(screen.getByText('Availability (0)')).toBeInTheDocument();
    expect(screen.getByText(/No slots/)).toBeInTheDocument();
  });

  it('renders slot with time range and status', () => {
    render(<DayDetailPanel {...defaultProps} selectedSlots={[makeSlot()]} />);
    expect(screen.getByText('Availability (1)')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 10:00')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows Booked badge for booked slots', () => {
    render(<DayDetailPanel {...defaultProps} selectedSlots={[makeSlot({ isBooked: true })]} />);
    expect(screen.getByText('Booked')).toBeInTheDocument();
  });

  it('calls onDeleteSlot for open slots', () => {
    render(<DayDetailPanel {...defaultProps} selectedSlots={[makeSlot()]} />);
    fireEvent.click(screen.getByTitle('Remove slot'));
    expect(defaultProps.onDeleteSlot).toHaveBeenCalledWith('slot-1');
  });

  it('shows "Saving..." when slotSaving is true', () => {
    render(<DayDetailPanel {...defaultProps} slotSaving={true} />);
    fireEvent.click(screen.getByText('+ Add slot'));
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });
});
