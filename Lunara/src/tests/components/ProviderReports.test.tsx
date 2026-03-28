import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProviderReports } from '../../components/provider/ProviderReports';

const mockGet = jest.fn();
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => ({ get: mockGet }) },
}));

jest.mock('../../components/ui/Skeleton', () => ({
  DashboardStatSkeleton: () => <div data-testid="stat-skeleton" />,
}));

const analyticsData = {
  totalClients: 25,
  activeClients: 18,
  completedClients: 5,
  totalAppointments: 100,
  completedAppointments: 60,
  cancelledAppointments: 10,
  upcomingAppointments: 20,
  averageCheckInMood: 7.5,
  totalMessages: 350,
  totalResources: 12,
  totalBlogPosts: 8,
  recentActivity: [
    { _id: 'a1', clientId: { firstName: 'Jane', lastName: 'Doe' }, startTime: '2026-03-18T10:00:00Z', status: 'completed', type: 'virtual' },
    { _id: 'a2', clientId: { firstName: 'Amy', lastName: 'Lee' }, startTime: '2026-03-17T14:00:00Z', status: 'requested' },
  ],
};

describe('ProviderReports', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading skeletons initially', () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<ProviderReports />);
    expect(screen.getAllByTestId('stat-skeleton').length).toBe(4);
  });

  it('shows error state on fetch failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('Unable to load reports')).toBeInTheDocument();
    });
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders stat cards after successful load', async () => {
    mockGet.mockResolvedValueOnce(analyticsData);
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('Total Clients')).toBeInTheDocument();
    });
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Active Clients')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Completed Clients')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Appointments')).toBeInTheDocument();
    // 20 appears in both stat card and metrics row, so check there's at least one
    const twenties = screen.getAllByText('20');
    expect(twenties.length).toBeGreaterThanOrEqual(1);
  });

  it('renders appointment breakdown section', async () => {
    mockGet.mockResolvedValueOnce(analyticsData);
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('Appointment Breakdown')).toBeInTheDocument();
    });
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders engagement metrics', async () => {
    mockGet.mockResolvedValueOnce(analyticsData);
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('Engagement Metrics')).toBeInTheDocument();
    });
    expect(screen.getByText('Messages Sent')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
    expect(screen.getByText('Resources')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Blog Posts')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders mood indicator with Good label for high mood', async () => {
    mockGet.mockResolvedValueOnce(analyticsData);
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('7.5')).toBeInTheDocument();
    });
    expect(screen.getByText('Good')).toBeInTheDocument();
  });

  it('renders Moderate label for medium mood', async () => {
    mockGet.mockResolvedValueOnce({ ...analyticsData, averageCheckInMood: 5.5 });
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('Moderate')).toBeInTheDocument();
    });
  });

  it('renders Needs attention for low mood', async () => {
    mockGet.mockResolvedValueOnce({ ...analyticsData, averageCheckInMood: 3.0 });
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('Needs attention')).toBeInTheDocument();
    });
  });

  it('renders No data when mood is null', async () => {
    mockGet.mockResolvedValueOnce({ ...analyticsData, averageCheckInMood: null });
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders recent activity with client names', async () => {
    mockGet.mockResolvedValueOnce(analyticsData);
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('Recent Appointments')).toBeInTheDocument();
    });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Amy Lee')).toBeInTheDocument();
  });

  it('shows activity status badges', async () => {
    mockGet.mockResolvedValueOnce(analyticsData);
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
    });
    expect(screen.getByText('requested')).toBeInTheDocument();
  });

  it('shows empty activity message when no recent activity', async () => {
    mockGet.mockResolvedValueOnce({ ...analyticsData, recentActivity: [] });
    render(<ProviderReports />);
    await waitFor(() => {
      expect(screen.getByText('No appointment activity yet.')).toBeInTheDocument();
    });
  });
});
