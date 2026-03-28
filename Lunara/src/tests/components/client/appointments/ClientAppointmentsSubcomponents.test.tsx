import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DayAppointmentList } from '../../../../components/client/appointments/DayAppointmentList';
import { ProposedTimeForm } from '../../../../components/client/appointments/ProposedTimeForm';
import { SlotBookingConfirmation } from '../../../../components/client/appointments/SlotBookingConfirmation';
import { AppointmentCalendar } from '../../../../components/client/appointments/AppointmentCalendar';

describe('ClientAppointments subcomponents', () => {
  it('DayAppointmentList shows empty state and renders appointments', () => {
    const { rerender } = render(<DayAppointmentList appointments={[]} providerName="Dr" />);
    expect(screen.getByText(/No appointments on this day/)).toBeInTheDocument();

    rerender(
      <DayAppointmentList
        providerName="Dr"
        appointments={[
          {
            _id: 'a1',
            startTime: '2026-03-18T10:00:00.000Z',
            endTime: '2026-03-18T11:00:00.000Z',
            status: 'confirmed',
            type: 'virtual',
          },
        ]}
      />,
    );
    expect(screen.getByText(/With Dr/)).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('ProposedTimeForm calls handlers and submit', () => {
    const onSubmit = jest.fn((e) => e.preventDefault());
    const onProposedDateChange = jest.fn();
    const onProposedStartChange = jest.fn();
    const onProposedEndChange = jest.fn();
    const onBookingTypeChange = jest.fn();
    const onBookingNotesChange = jest.fn();

    render(
      <ProposedTimeForm
        selectedDate={new Date('2026-03-18T00:00:00.000Z')}
        proposedDate=""
        proposedStart="10:00"
        proposedEnd="11:00"
        bookingType="virtual"
        bookingNotes=""
        requestingProposed={false}
        onProposedDateChange={onProposedDateChange}
        onProposedStartChange={onProposedStartChange}
        onProposedEndChange={onProposedEndChange}
        onBookingTypeChange={onBookingTypeChange}
        onBookingNotesChange={onBookingNotesChange}
        onSubmit={onSubmit}
      />,
    );

    const field = (label: string) => {
      const wrap = screen.getByText(label).closest('div');
      if (!wrap) throw new Error(`missing field wrapper for ${label}`);
      return wrap;
    };

    fireEvent.change(field('Date').querySelector('input[type="date"]') as HTMLInputElement, { target: { value: '2026-03-19' } });
    expect(onProposedDateChange).toHaveBeenCalledWith('2026-03-19');
    fireEvent.change(field('Start').querySelector('input[type="time"]') as HTMLInputElement, { target: { value: '09:00' } });
    expect(onProposedStartChange).toHaveBeenCalledWith('09:00');
    fireEvent.change(field('End').querySelector('input[type="time"]') as HTMLInputElement, { target: { value: '10:00' } });
    expect(onProposedEndChange).toHaveBeenCalledWith('10:00');
    fireEvent.change(field('Type').querySelector('select') as HTMLSelectElement, { target: { value: 'in_person' } });
    expect(onBookingTypeChange).toHaveBeenCalledWith('in_person');
    fireEvent.change(screen.getByPlaceholderText('e.g. topic or location'), { target: { value: 'n' } });
    expect(onBookingNotesChange).toHaveBeenCalledWith('n');
    fireEvent.submit(screen.getByRole('button', { name: 'Send Request' }).closest('form')!);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('SlotBookingConfirmation calls callbacks', () => {
    const onBookingTypeChange = jest.fn();
    const onBookingNotesChange = jest.fn();
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    render(
      <SlotBookingConfirmation
        selectedSlot={{ _id: 's1', date: '2026-03-18T00:00:00.000Z', startTime: '10:00', endTime: '11:00', isBooked: false }}
        providerName="Dr"
        bookingType="virtual"
        bookingNotes=""
        requesting={false}
        onBookingTypeChange={onBookingTypeChange}
        onBookingNotesChange={onBookingNotesChange}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />,
    );

    const typeWrap = screen.getByText('Type').closest('div');
    const select = typeWrap?.querySelector('select') as HTMLSelectElement | null;
    expect(select).toBeTruthy();
    fireEvent.change(select!, { target: { value: 'in_person' } });
    expect(onBookingTypeChange).toHaveBeenCalledWith('in_person');
    fireEvent.change(screen.getByPlaceholderText('e.g. topic or location'), { target: { value: 'x' } });
    expect(onBookingNotesChange).toHaveBeenCalledWith('x');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Request Appointment' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('AppointmentCalendar renders weekdays and responds to nav + date selection', () => {
    const onPrevMonth = jest.fn();
    const onNextMonth = jest.fn();
    const onGoToToday = jest.fn();
    const onSelectDate = jest.fn();

    render(
      <AppointmentCalendar
        currentMonth={new Date('2026-03-01T00:00:00.000Z')}
        selectedDate={null}
        appointments={[
          { _id: 'a1', startTime: '2026-03-10T10:00:00.000Z', endTime: '2026-03-10T11:00:00.000Z', status: 'requested' },
        ]}
        slots={[
          { _id: 's1', date: '2026-03-12T00:00:00.000Z', startTime: '09:00', endTime: '10:00', isBooked: false },
        ]}
        loadingData={false}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onGoToToday={onGoToToday}
        onSelectDate={onSelectDate}
      />,
    );

    expect(screen.getByText('Sun')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(onPrevMonth).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Next month'));
    expect(onNextMonth).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Today'));
    expect(onGoToToday).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '10' }));
    expect(onSelectDate).toHaveBeenCalledTimes(1);
  });
});

