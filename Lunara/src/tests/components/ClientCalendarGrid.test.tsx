import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientCalendarGrid } from '../../components/client/ClientCalendarGrid';
import type { Appointment, Slot } from '../../components/client/appointmentTypes';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    _id: 'appt-1',
    startTime: '2026-03-15T10:00:00.000Z',
    endTime: '2026-03-15T11:00:00.000Z',
    status: 'confirmed',
    type: 'virtual',
    ...overrides,
  } as Appointment;
}

function makeSlot(overrides: Partial<Slot> = {}): Slot {
  return {
    _id: 'slot-1',
    date: '2026-03-20T00:00:00.000Z',
    startTime: '09:00',
    endTime: '10:00',
    ...overrides,
  } as Slot;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClientCalendarGrid', () => {
  const defaultProps = {
    year: 2026,
    month: 2, // March (0-indexed)
    selectedDate: null,
    appointments: [] as Appointment[],
    slots: [] as Slot[],
    onSelectDate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all weekday headers', () => {
    render(<ClientCalendarGrid {...defaultProps} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('renders correct number of days for March 2026', () => {
    render(<ClientCalendarGrid {...defaultProps} />);
    // March 2026 has 31 days
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('calls onSelectDate when a day is clicked', () => {
    const onSelectDate = jest.fn();
    render(<ClientCalendarGrid {...defaultProps} onSelectDate={onSelectDate} />);

    fireEvent.click(screen.getByText('15'));
    expect(onSelectDate).toHaveBeenCalledTimes(1);
    const calledDate = onSelectDate.mock.calls[0][0] as Date;
    expect(calledDate.getDate()).toBe(15);
    expect(calledDate.getMonth()).toBe(2); // March
  });

  it('shows appointment status dots on days with appointments', () => {
    const appt = makeAppointment();
    const { container } = render(
      <ClientCalendarGrid {...defaultProps} appointments={[appt]} />
    );

    // Should have a dot with the confirmed status color
    const dots = container.querySelectorAll('.rounded-full.w-2.h-2');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('shows open slot count on days with slots', () => {
    const slot = makeSlot();
    render(<ClientCalendarGrid {...defaultProps} slots={[slot]} />);

    expect(screen.getByText('1 open')).toBeInTheDocument();
  });

  it('shows multiple slot count', () => {
    const slots = [
      makeSlot({ _id: 'slot-1' }),
      makeSlot({ _id: 'slot-2', startTime: '11:00', endTime: '12:00' }),
      makeSlot({ _id: 'slot-3', startTime: '14:00', endTime: '15:00' }),
    ];
    render(<ClientCalendarGrid {...defaultProps} slots={slots} />);

    expect(screen.getByText('3 open')).toBeInTheDocument();
  });

  it('shows +N indicator when more than 4 appointments on a day', () => {
    const appts = Array.from({ length: 6 }, (_, i) =>
      makeAppointment({
        _id: `appt-${i}`,
        startTime: `2026-03-15T${10 + i}:00:00.000Z`,
        endTime: `2026-03-15T${11 + i}:00:00.000Z`,
      })
    );
    render(<ClientCalendarGrid {...defaultProps} appointments={appts} />);
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renders status legend', () => {
    render(<ClientCalendarGrid {...defaultProps} />);
    expect(screen.getByText('Available slots')).toBeInTheDocument();
  });
});
