import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import ProviderDashboard from '../../pages/ProviderDashboard';

const mockUseAuth = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../components/provider/ProviderDashboardLayout', () => ({
  ProviderDashboardLayout: ({ navItems, activeTab, onTabChange, children }: any) => (
    <div>
      <div>active:{activeTab}</div>
      <div>
        {navItems.map((n: any) => (
          <button key={n.id} onClick={() => onTabChange(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
      <div data-testid="content">{children}</div>
    </div>
  ),
}));

jest.mock('../../components/provider/tabs/OverviewTab', () => ({
  OverviewTab: (props: any) => (
    <div>
      <div>overview</div>
      <button onClick={() => props.onNavigate('clients')}>go-clients</button>
      <button onClick={() => props.onShowScheduleModal()}>open-schedule</button>
    </div>
  ),
}));
jest.mock('../../components/provider/tabs/ClientsTab', () => ({
  ClientsTab: (props: any) => (
    <div>
      <div>clients</div>
      <button onClick={() => props.onEditClient('c1')}>edit</button>
      <button onClick={() => props.onCarePlan('cid', 'uid', 'Name')}>careplan</button>
    </div>
  ),
}));
jest.mock('../../components/provider/tabs/BlogTab', () => ({
  BlogTab: () => <div>blog</div>,
}));
jest.mock('../../components/provider/tabs/CreateProviderTab', () => ({
  CreateProviderTab: () => <div>create-provider</div>,
}));

jest.mock('../../components/provider/ProviderCalendar', () => ({
  ProviderCalendar: () => <div>calendar</div>,
}));
jest.mock('../../components/provider/ProviderProfileEdit', () => ({
  ProviderProfileEdit: () => <div>profile-edit</div>,
}));
jest.mock('../../components/PushNotificationToggle', () => ({
  PushNotificationToggle: () => <div>push-toggle</div>,
}));

jest.mock('../../components/client/ProviderClientProfileEdit', () => ({
  ProviderClientProfileEdit: ({ onClose }: any) => (
    <div>
      <div>edit-modal</div>
      <button onClick={onClose}>close-edit</button>
    </div>
  ),
}));
jest.mock('../../components/client/CarePlanManager', () => ({
  CarePlanManager: ({ onClose }: any) => (
    <div>
      <div>careplan-modal</div>
      <button onClick={onClose}>close-careplan</button>
    </div>
  ),
}));
jest.mock('../../components/ScheduleAppointmentModal', () => ({
  ScheduleAppointmentModal: ({ onClose }: any) => (
    <div>
      <div>schedule-modal</div>
      <button onClick={onClose}>close-schedule</button>
    </div>
  ),
}));
jest.mock('../../components/provider/ProviderClientCheckIns', () => ({
  ProviderClientCheckIns: ({ onClose }: any) => (
    <div>
      <div>checkins-modal</div>
      <button onClick={onClose}>close-checkins</button>
    </div>
  ),
}));

describe('ProviderDashboard', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { role: 'provider' },
      isProvider: true,
      registerClient: jest.fn(),
    });
  });

  it('switches tabs via layout + opens/closes modals', () => {
    render(<ProviderDashboard />);

    expect(screen.getByText('overview')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clients' }));
    expect(screen.getByText('clients')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'edit' }));
    expect(screen.getByText('edit-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close-edit' }));
    expect(screen.queryByText('edit-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'careplan' }));
    expect(screen.getByText('careplan-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close-careplan' }));

    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    fireEvent.click(screen.getByRole('button', { name: 'open-schedule' }));
    expect(screen.getByText('schedule-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'close-schedule' }));
  });
});

