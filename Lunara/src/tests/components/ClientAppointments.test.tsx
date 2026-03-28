import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientAppointments } from '../../components/client/ClientAppointments';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockApi = { get: mockGet, post: mockPost };
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => mockApi },
}));

jest.mock('../../components/client/ClientCalendarGrid', () => ({
  ClientCalendarGrid: ({ onSelectDate }: { onSelectDate: (d: Date) => void }) => (
    <div data-testid="calendar-grid">
      <button onClick={() => onSelectDate(new Date(2026, 2, 18))}>select-date</button>
    </div>
  ),
}));

jest.mock('../../components/client/ClientDayDetailPanel', () => ({
  ClientDayDetailPanel: (props: Record<string, unknown>) => (
    <div data-testid="day-detail">
      <span>{props.providerName as string}</span>
      <span>appts:{(props.selectedAppts as unknown[]).length}</span>
    </div>
  ),
}));

describe('ClientAppointments', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading spinner initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ClientAppointments />);
    // The loading spinner should be present (animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows no-provider message when profile has no provider', async () => {
    mockGet.mockResolvedValueOnce({ assignedProvider: undefined });
    render(<ClientAppointments />);
    await waitFor(() => {
      expect(screen.getByText(/don't have an assigned provider/)).toBeInTheDocument();
    });
  });

  it('renders calendar and day panel after loading', async () => {
    mockGet
      .mockResolvedValueOnce({ assignedProvider: { _id: 'p1', firstName: 'Dr', lastName: 'Smith' } })
      .mockResolvedValueOnce([]) // appointments
      .mockResolvedValueOnce({ slots: [] }); // availability

    render(<ClientAppointments />);
    await waitFor(() => {
      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
    });
    expect(screen.getByTestId('day-detail')).toBeInTheDocument();
    expect(screen.getByText('Dr Smith')).toBeInTheDocument();
  });

  it('shows provider name fallback when provider is string ID', async () => {
    mockGet
      .mockResolvedValueOnce({ assignedProvider: 'provider-id-string' })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ slots: [] });

    render(<ClientAppointments />);
    await waitFor(() => {
      expect(screen.getByText('Your provider')).toBeInTheDocument();
    });
  });

  it('shows "No upcoming appointments" when none exist', async () => {
    mockGet
      .mockResolvedValueOnce({ assignedProvider: { _id: 'p1', firstName: 'Dr', lastName: 'S' } })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ slots: [] });

    render(<ClientAppointments />);
    await waitFor(() => {
      expect(screen.getByText(/No upcoming appointments/)).toBeInTheDocument();
    });
  });

  it('renders upcoming appointments list', async () => {
    const appt = {
      _id: 'a1',
      startTime: '2026-03-18T10:00:00.000Z',
      endTime: '2026-03-18T11:00:00.000Z',
      status: 'confirmed',
      type: 'virtual',
    };
    mockGet
      .mockResolvedValueOnce({ assignedProvider: { _id: 'p1', firstName: 'Dr', lastName: 'S' } })
      .mockResolvedValueOnce([appt])
      .mockResolvedValueOnce({ slots: [] });

    render(<ClientAppointments />);
    await waitFor(() => {
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
    });
    expect(screen.getByText('All Upcoming Appointments')).toBeInTheDocument();
  });

  it('shows month navigation buttons', async () => {
    mockGet
      .mockResolvedValueOnce({ assignedProvider: { _id: 'p1', firstName: 'Dr', lastName: 'S' } })
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ slots: [] });

    render(<ClientAppointments />);
    await waitFor(() => {
      expect(screen.getByLabelText('Previous month')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Next month')).toBeInTheDocument();
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('handles profile load failure gracefully', async () => {
    mockGet.mockRejectedValueOnce(new Error('fail'));
    render(<ClientAppointments />);
    await waitFor(() => {
      expect(screen.getByText(/don't have an assigned provider/)).toBeInTheDocument();
    });
  });
});
