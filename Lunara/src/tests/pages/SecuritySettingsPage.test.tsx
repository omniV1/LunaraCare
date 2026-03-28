import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import SecuritySettingsPage from '../../pages/SecuritySettingsPage';

const mockUseAuth = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../components/security/MfaSetup', () => (props: any) => (
  <div>
    <div>mfa:{String(props.mfaEnabled)}</div>
    <button onClick={() => props.onStatusChange(true)}>enable</button>
  </div>
));

describe('SecuritySettingsPage', () => {
  it('links back to provider dashboard and toggles MFA state', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'provider', mfaEnabled: false } });
    render(
      <MemoryRouter>
        <SecuritySettingsPage />
      </MemoryRouter>,
    );

    const back = screen.getByRole('link', { name: /Back to Dashboard/i });
    expect(back).toHaveAttribute('href', '/provider/dashboard');

    expect(screen.getByText('mfa:false')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'enable' }));
    expect(screen.getByText('mfa:true')).toBeInTheDocument();
  });

  it('links back to client dashboard when client', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'client', mfaEnabled: true } });
    render(
      <MemoryRouter>
        <SecuritySettingsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Back to Dashboard/i })).toHaveAttribute('href', '/client/dashboard');
  });
});

