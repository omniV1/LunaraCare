import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { DashboardStatsSection } from '../../../../components/provider/tabs/DashboardStatsSection';
import { QuickActionsSection } from '../../../../components/provider/tabs/QuickActionsSection';
import { CheckInsReviewSection } from '../../../../components/provider/tabs/CheckInsReviewSection';
import { UpcomingAppointmentsSection } from '../../../../components/provider/tabs/UpcomingAppointmentsSection';
import type { CheckinReviewItem, ActivityItem } from '../../../../pages/providerDashboardUtils';
import { CreateClientModal } from '../../../../components/provider/tabs/CreateClientModal';

jest.mock('react-toastify', () => ({
  toast: { info: jest.fn(), error: jest.fn(), success: jest.fn() },
}));

jest.mock('../../../../components/ui/Skeleton', () => ({
  DashboardStatSkeleton: () => <div>skeleton</div>,
}));

describe('provider tab sections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as unknown as Record<string, unknown>).crypto = { getRandomValues: (arr: Uint32Array) => { arr[0] = 4; return arr; } };
  });

  it('DashboardStatsSection shows skeleton then stats + notification badge', () => {
    const onNavigate = jest.fn();
    const { rerender } = render(
      <DashboardStatsSection
        stats={{ totalClients: 0, upcomingAppointments: 0, pendingCheckins: 0, pendingAppointmentRequests: 0 }}
        statsLoading={true}
        notificationCount={0}
        onNavigate={onNavigate}
      />,
    );
    expect(screen.getAllByText('skeleton').length).toBeGreaterThan(0);

    rerender(
      <DashboardStatsSection
        stats={{ totalClients: 3, upcomingAppointments: 0, pendingCheckins: 2, pendingAppointmentRequests: 0 }}
        statsLoading={false}
        notificationCount={5}
        onNavigate={onNavigate}
      />,
    );
    expect(screen.getByText('Active Clients:')).toBeInTheDocument();
    fireEvent.click(screen.getByTitle('Notifications'));
    expect(onNavigate).toHaveBeenCalledWith('overview');
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('QuickActionsSection routes or toasts depending on role', () => {
    const onCreateClient = jest.fn();
    const onShowScheduleModal = jest.fn();
    const onNavigate = jest.fn();

    render(
      <QuickActionsSection
        user={{ role: 'client' }}
        onCreateClient={onCreateClient}
        onShowScheduleModal={onShowScheduleModal}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Create Client/i }));
    expect(onCreateClient).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Schedule Appointment/i }));
    expect(toast.info).toHaveBeenCalled();

    render(
      <QuickActionsSection
        user={{ role: 'provider' }}
        onCreateClient={onCreateClient}
        onShowScheduleModal={onShowScheduleModal}
        onNavigate={onNavigate}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: /Schedule Appointment/i }).at(-1)!);
    expect(onShowScheduleModal).toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('button', { name: /View Clients/i }).at(-1)!);
    expect(onNavigate).toHaveBeenCalledWith('clients');
  });

  it('CheckInsReviewSection handles empty and actions', () => {
    const onDetail = jest.fn();
    const onMark = jest.fn();
    const { rerender } = render(
      <CheckInsReviewSection checkinsNeedingReview={[]} checkinsLoading={false} onCheckinsDetail={onDetail} onMarkReviewed={onMark} />,
    );
    expect(screen.getByText(/No check-ins need your review/i)).toBeInTheDocument();

    rerender(
      <CheckInsReviewSection
        checkinsNeedingReview={[{ clientName: 'N', clientUserId: 'u1', lastCheckIn: new Date().toISOString(), alerts: [{ type: 'mood', message: 'm', severity: 'warning' }] } as CheckinReviewItem]}
        checkinsLoading={false}
        onCheckinsDetail={onDetail}
        onMarkReviewed={onMark}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /View details/i }));
    expect(onDetail).toHaveBeenCalledWith('u1', 'N');
    fireEvent.click(screen.getByRole('button', { name: /Mark reviewed/i }));
    expect(onMark).toHaveBeenCalledWith('u1');
    expect(screen.getByText('m')).toBeInTheDocument();
  });

  it('UpcomingAppointmentsSection renders appointment list', () => {
    render(<UpcomingAppointmentsSection recentActivity={[]} activityLoading={false} />);
    expect(screen.getByText(/No upcoming appointments/i)).toBeInTheDocument();

    render(
      <UpcomingAppointmentsSection
        activityLoading={false}
        recentActivity={[{ type: 'appointment', label: 'Upcoming: A', subtitle: 'S', date: new Date().toISOString() } as ActivityItem]}
      />,
    );
    expect(screen.getByText('Upcoming: A')).toBeInTheDocument();
    expect(screen.getByText('S')).toBeInTheDocument();
  });

  it('CreateClientModal validates and submits (autogenerates password)', async () => {
    const registerClient = jest.fn().mockResolvedValue({});
    const onClose = jest.fn();
    const { container } = render(<CreateClientModal userId="p1" registerClient={registerClient} onClose={onClose} />);
    const form = container.querySelector('form')!;

    // Use submit event to bypass native input validity checks in JSDOM
    fireEvent.submit(form);
    expect(toast.error).toHaveBeenCalledWith('First name is required');

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.submit(form);

    // Password empty triggers info
    await waitFor(() => expect(toast.info).toHaveBeenCalled());
    expect(registerClient).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'A', lastName: 'B', email: 'a@b.com', providerId: 'p1' }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });
});

