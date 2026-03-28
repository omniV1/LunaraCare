import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../contexts/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/authService', () => ({
  MfaChallengeError: class MfaChallengeError extends Error {
    mfaToken: string;
    constructor(mfaToken: string) {
      super('MFA required');
      this.mfaToken = mfaToken;
    }
  },
}));

jest.mock('../../utils/getBaseApiUrl', () => ({
  getBaseApiUrl: () => 'http://localhost:3000',
  getGoogleOAuthStartUrl: (origin: string) =>
    `http://localhost:3000/auth/google?redirect_origin=${encodeURIComponent(origin)}`,
}));

jest.mock('../../components/layout/SimpleFooter', () => ({
  SimpleFooter: () => <div data-testid="footer" />,
}));

import LoginPage from '../../pages/LoginPage';
import { useAuth } from '../../contexts/useAuth';
import { MfaChallengeError } from '../../services/authService';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const defaultAuth = {
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  clientLogin: jest.fn(),
  providerLogin: jest.fn(),
  verifyMfa: jest.fn(),
  loginWithTokens: jest.fn(),
  logout: jest.fn(),
  clearError: jest.fn(),
  getDashboardRoute: jest.fn(() => '/dashboard'),
  registerClient: jest.fn(),
  isProvider: false,
  isClient: false,
};

function renderLogin(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <LoginPage />
    </MemoryRouter>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuth);
  });

  it('renders login form with email and password fields', () => {
    renderLogin();
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  it('renders enter button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /enter/i })).toBeInTheDocument();
  });

  it('updates email and password fields', () => {
    renderLogin();
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('mypassword');
  });

  it('calls clientLogin on form submit', async () => {
    const clientLogin = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ ...defaultAuth, clientLogin });

    renderLogin();
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pass123' } });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(clientLogin).toHaveBeenCalledWith({ email: 'test@test.com', password: 'pass123' });
    });
  });

  it('shows MFA form when MfaChallengeError is thrown', async () => {
    const clientLogin = jest.fn().mockRejectedValue(new MfaChallengeError('mfa-token-123'));
    mockUseAuth.mockReturnValue({ ...defaultAuth, clientLogin });

    renderLogin();
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 't@t.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'pass' } });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(screen.getByText(/Two-Factor Authentication/)).toBeInTheDocument();
    });
  });

  it('redirects authenticated users to dashboard', () => {
    mockUseAuth.mockReturnValue({
      ...defaultAuth,
      isAuthenticated: true,
      user: { id: '1', email: 'a@b.com', role: 'client', firstName: 'A', lastName: 'B', mfaEnabled: false },
    });

    renderLogin();
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('displays auth error message', () => {
    mockUseAuth.mockReturnValue({ ...defaultAuth, error: 'Invalid credentials' });
    renderLogin();
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('clears error on submit', async () => {
    const clearError = jest.fn();
    const clientLogin = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ ...defaultAuth, clearError, clientLogin });

    renderLogin();
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 't@t.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'p' } });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(clearError).toHaveBeenCalled();
    });
  });
});
