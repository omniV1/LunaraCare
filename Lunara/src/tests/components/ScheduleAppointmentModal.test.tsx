import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { ScheduleAppointmentModal } from '../../components/ScheduleAppointmentModal';

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const api = {
  get: jest.fn(),
  post: jest.fn(),
};
jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => api,
  },
}));

describe('ScheduleAppointmentModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(<ScheduleAppointmentModal open={false} onClose={jest.fn()} />);
    expect(screen.queryByText('Schedule Appointment')).not.toBeInTheDocument();
  });

  it('loads options on open and schedules an appointment', async () => {
    api.get.mockImplementation((path: string) => {
      if (path === '/client?all=1') {
        return Promise.resolve([{ _id: 'c1', userId: { _id: 'u1', firstName: 'Jane', lastName: 'Doe' } }]);
      }
      if (path === '/providers') {
        return Promise.resolve([{ _id: 'p1', userId: { _id: 'u2', firstName: 'Dr', lastName: 'Smith' } }]);
      }
      throw new Error(`unexpected GET ${path}`);
    });
    api.post.mockResolvedValue({ success: true });

    const onClose = jest.fn();
    const onScheduled = jest.fn();
    render(<ScheduleAppointmentModal open={true} onClose={onClose} onScheduled={onScheduled} />);

    // wait for selects to populate
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/providers'));
    await screen.findByText('Select client');

    const field = (label: string) => {
      const wrap = screen.getByText(label).closest('div');
      if (!wrap) throw new Error(`missing field wrapper for ${label}`);
      return wrap;
    };

    fireEvent.change(within(field('Client')).getByRole('combobox'), { target: { value: 'u1' } });
    fireEvent.change(within(field('Provider')).getByRole('combobox'), { target: { value: 'u2' } });
    const startInput = field('Start').querySelector('input[type="datetime-local"]') as HTMLInputElement | null;
    const endInput = field('End').querySelector('input[type="datetime-local"]') as HTMLInputElement | null;
    expect(startInput).toBeTruthy();
    expect(endInput).toBeTruthy();
    fireEvent.change(startInput!, { target: { value: '2026-03-19T10:00' } });
    fireEvent.change(endInput!, { target: { value: '2026-03-19T11:00' } });
    fireEvent.change(within(field('Notes (optional)')).getByRole('textbox'), { target: { value: 'n' } });

    fireEvent.click(screen.getByRole('button', { name: 'Schedule' }));

    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(onScheduled).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows toast on option load failure', async () => {
    api.get.mockRejectedValue(new Error('boom'));
    render(<ScheduleAppointmentModal open={true} onClose={jest.fn()} />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load clients or providers'));
  });
});

