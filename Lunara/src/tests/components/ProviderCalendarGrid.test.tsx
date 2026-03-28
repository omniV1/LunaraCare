import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalendarGrid } from '../../components/provider/CalendarGrid';
import type { Appointment, AvailabilitySlot } from '../../components/provider/calendarTypes';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    _id: 'appt-1',
    clientId: { _id: 'c1', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
    providerId: { _id: 'p1', firstName: 'Dr', lastName: 'Smith', email: 'dr@test.com' },
    startTime: '2026-03-15T10:00:00.000Z',
    endTime: '2026-03-15T11:00:00.000Z',
    status: 'confirmed',
    ...overrides,
  } as Appointment;
}

function makeSlot(overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot {
  return {
    _id: 'slot-1',
    date: '2026-03-20T00:00:00.000Z',
    startTime: '09:00',
    endTime: '10:00',
    isBooked: false,
    recurring: false,
    ...overrides,
  };
}

const defaultProps = {
  year: 2026,
  month: 2, // March
  selectedDate: null,
  appointments: [] as Appointment[],
  availability: [] as AvailabilitySlot[],
  onSelectDate: jest.fn(),
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('CalendarGrid (Provider)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders weekday headers', () => {
    render(<CalendarGrid {...defaultProps} />);
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('renders all days of the month', () => {
    render(<CalendarGrid {...defaultProps} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
  });

  it('calls onSelectDate when day is clicked', () => {
    const onSelectDate = jest.fn();
    render(<CalendarGrid {...defaultProps} onSelectDate={onSelectDate} />);

    fireEvent.click(screen.getByText('10'));
    expect(onSelectDate).toHaveBeenCalledTimes(1);
    expect((onSelectDate.mock.calls[0][0] as Date).getDate()).toBe(10);
  });

  it('shows slot count on days with availability', () => {
    render(<CalendarGrid {...defaultProps} availability={[makeSlot()]} />);
    expect(screen.getByText('1 slot')).toBeInTheDocument();
  });

  it('pluralizes slot count', () => {
    const slots = [
      makeSlot({ _id: 's1' }),
      makeSlot({ _id: 's2', startTime: '11:00', endTime: '12:00' }),
    ];
    render(<CalendarGrid {...defaultProps} availability={slots} />);
    expect(screen.getByText('2 slots')).toBeInTheDocument();
  });

  it('shows appointment dots', () => {
    const { container } = render(
      <CalendarGrid {...defaultProps} appointments={[makeAppt()]} />
    );
    const dots = container.querySelectorAll('.rounded-full.w-2.h-2');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('shows pending approval indicator for requested appointments', () => {
    const appt = makeAppt({ status: 'requested' });
    const { container } = render(
      <CalendarGrid {...defaultProps} appointments={[appt]} />
    );
    const pendingDot = container.querySelector('[title="Pending approval"]');
    expect(pendingDot).toBeInTheDocument();
  });

  it('renders legend with all statuses plus availability', () => {
    render(<CalendarGrid {...defaultProps} />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Requested')).toBeInTheDocument();
    expect(screen.getByText('Has availability')).toBeInTheDocument();
    expect(screen.getByText('Pending approval')).toBeInTheDocument();
  });
});
