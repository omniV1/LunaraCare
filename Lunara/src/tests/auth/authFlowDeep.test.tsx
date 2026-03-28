/**
 * Deep tests for AuthContext – covers login/logout state transitions,
 * provider vs client role helpers, loading states, token persistence,
 * error handling, session-expired event, cross-tab logout, MFA flow,
 * and getDashboardRoute routing logic.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockUser = {
  id: '1',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'client' as const,
};

const mockProviderUser = {
  id: '2',
  email: 'doc@example.com',
  firstName: 'Dr',
  lastName: 'Smith',
  role: 'provider' as const,
};

const mockRegisterClient = jest.fn();
const mockClientLogin = jest.fn();
const mockProviderLogin = jest.fn();
const mockGetCurrentUser = jest.fn();
const mockLogout = jest.fn();
const mockVerifyMfa = jest.fn();

class MockMfaChallengeError extends Error {
  public readonly mfaToken: string;
  constructor(mfaToken: string) {
    super('MFA verification required');
    this.name = 'MfaChallengeError';
    this.mfaToken = mfaToken;
  }
}

jest.mock('../../services/authService', () => ({
  AuthService: {
    getInstance: () => ({
      registerClient: (...args: unknown[]) => mockRegisterClient(...args),
      clientLogin: (...args: unknown[]) => mockClientLogin(...args),
      providerLogin: (...args: unknown[]) => mockProviderLogin(...args),
      getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
      logout: (...args: unknown[]) => mockLogout(...args),
      verifyMfa: (...args: unknown[]) => mockVerifyMfa(...args),
    }),
  },
  MfaChallengeError: MockMfaChallengeError,
}));

// Must import AFTER mocks
import AuthProvider from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/useAuth';

// ── Helper components ────────────────────────────────────────────────────────

function AuthStatus() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="auth-status">{auth.isAuthenticated ? 'auth' : 'guest'}</span>
      <span data-testid="loading">{auth.loading ? 'loading' : 'ready'}</span>
      <span data-testid="role">{auth.user?.role ?? 'none'}</span>
      <span data-testid="is-provider">{String(auth.isProvider)}</span>
      <span data-testid="is-client">{String(auth.isClient)}</span>
      <span data-testid="error">{auth.error ?? ''}</span>
      <span data-testid="dashboard-client">{auth.getDashboardRoute('client')}</span>
      <span data-testid="dashboard-provider">{auth.getDashboardRoute('provider')}</span>
      <span data-testid="dashboard-unknown">{auth.getDashboardRoute('admin')}</span>
    </div>
  );
}

function LoginActions() {
  const { clientLogin, providerLogin, logout, verifyMfa, clearError, registerClient } = useAuth();
  const TEST_PASSWORD = 'Password123';
  return (
    <div>
      <button onClick={() => clientLogin({ email: 'jane@example.com', password: TEST_PASSWORD }).catch(() => {})}>
        client-login
      </button>
      <button onClick={() => providerLogin({ email: 'doc@example.com', password: TEST_PASSWORD }).catch(() => {})}>
        provider-login
      </button>
      <button onClick={logout}>logout</button>
      <button onClick={() => verifyMfa('mfa-token', '123456').catch(() => {})}>verify-mfa</button>
      <button onClick={clearError}>clear-error</button>
      <button
        onClick={() =>
          registerClient({
            email: 'new@example.com',
            firstName: 'New',
            lastName: 'User',
            password: TEST_PASSWORD,
          }).catch(() => {})
        }
      >
        register
      </button>
    </div>
  );
}

// ── Wrapper ──────────────────────────────────────────────────────────────────

function renderWithAuth(ui: React.ReactElement = <><AuthStatus /><LoginActions /></>) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('AuthContext – deep tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Default: no token so checkAuth skips getCurrentUser
    mockGetCurrentUser.mockResolvedValue(mockUser);
    mockLogout.mockImplementation(async () => {
      localStorage.removeItem('token');
    });
  });

  // ---- Initial loading & hydration ----

  describe('initial loading state', () => {
    it('does not render children while loading (loading gate)', async () => {
      // Put a token so checkAuth fires getCurrentUser, which we never resolve
      localStorage.setItem('token', 'stale');
      let resolve!: (v: typeof mockUser) => void;
      mockGetCurrentUser.mockReturnValue(new Promise(r => { resolve = r; }));

      const { container } = render(
        <MemoryRouter>
          <AuthProvider>
            <span data-testid="child">child</span>
          </AuthProvider>
        </MemoryRouter>,
      );

      // Children not rendered until loading finishes
      expect(container.querySelector('[data-testid="child"]')).toBeNull();

      // Resolve
      await act(async () => resolve(mockUser));
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('starts as guest when no token exists in localStorage', async () => {
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));
      expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');
    });

    it('hydrates user from token in localStorage on mount', async () => {
      localStorage.setItem('token', 'existing');
      mockGetCurrentUser.mockResolvedValue(mockUser);
      renderWithAuth();

      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('auth'));
      expect(screen.getByTestId('role')).toHaveTextContent('client');
    });

    it('clears stale token and becomes guest when getCurrentUser fails', async () => {
      localStorage.setItem('token', 'bad-token');
      mockGetCurrentUser.mockRejectedValue(new Error('401'));
      renderWithAuth();

      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('guest'));
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  // ---- Login flows ----

  describe('client login', () => {
    it('sets user state, persists token, and shows success toast', async () => {
      mockClientLogin.mockResolvedValue({ user: mockUser, token: 'access123', accessToken: 'access123' });
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByText('client-login'));
      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('auth'));

      expect(localStorage.getItem('token')).toBe('access123');
      expect(screen.getByTestId('is-client')).toHaveTextContent('true');
      expect(screen.getByTestId('is-provider')).toHaveTextContent('false');
      expect(toast.success).toHaveBeenCalledWith('Login successful! Welcome back.');
    });

    it('shows error toast on login failure', async () => {
      mockClientLogin.mockRejectedValue(new Error('Invalid credentials'));
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByText('client-login'));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid credentials'));
      expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');
    });

    it('shows server error message from response.data.message', async () => {
      const serverError = {
        response: { data: { message: 'Account locked' } },
      };
      mockClientLogin.mockRejectedValue(serverError);
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByText('client-login'));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Account locked'));
    });
  });

  describe('provider login', () => {
    it('sets provider role flags correctly', async () => {
      mockProviderLogin.mockResolvedValue({ user: mockProviderUser, token: 'prov-token', accessToken: 'prov-token' });
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByText('provider-login'));
      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('auth'));

      expect(screen.getByTestId('is-provider')).toHaveTextContent('true');
      expect(screen.getByTestId('is-client')).toHaveTextContent('false');
      expect(screen.getByTestId('role')).toHaveTextContent('provider');
    });

    it('re-throws MfaChallengeError without showing error toast', async () => {
      mockProviderLogin.mockRejectedValue(new MockMfaChallengeError('mfa-tok-123'));
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByText('provider-login'));
      // MFA errors are NOT toasted – they're caught by the calling component
      await waitFor(() => expect(toast.error).not.toHaveBeenCalled());
    });
  });

  // ---- MFA verification ----

  describe('MFA verification', () => {
    it('authenticates after successful MFA', async () => {
      mockVerifyMfa.mockResolvedValue({ user: mockUser, token: 'mfa-tok', accessToken: 'mfa-tok' });
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByText('verify-mfa'));
      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('auth'));
      expect(localStorage.getItem('token')).toBe('mfa-tok');
      expect(toast.success).toHaveBeenCalledWith('Login successful! Welcome back.');
    });

    it('shows error toast on MFA failure', async () => {
      mockVerifyMfa.mockRejectedValue(new Error('Invalid code'));
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByText('verify-mfa'));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid code'));
    });
  });

  // ---- Logout ----

  describe('logout', () => {
    it('clears user state and token, shows info toast', async () => {
      mockClientLogin.mockResolvedValue({ user: mockUser, token: 'tok', accessToken: 'tok' });
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      // Log in first
      fireEvent.click(screen.getByText('client-login'));
      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('auth'));

      // Now log out
      fireEvent.click(screen.getByText('logout'));
      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('guest'));
      expect(screen.getByTestId('is-client')).toHaveTextContent('false');
      expect(screen.getByTestId('is-provider')).toHaveTextContent('false');
      expect(toast.info).toHaveBeenCalledWith('You have been logged out.');
    });
  });

  // ---- Session expired event ----

  describe('session-expired event', () => {
    it('clears user state when auth:session-expired is dispatched', async () => {
      localStorage.setItem('token', 'tok');
      mockGetCurrentUser.mockResolvedValue(mockUser);
      renderWithAuth();

      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('auth'));

      act(() => {
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      });

      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('guest'));
    });
  });

  // ---- Cross-tab logout via storage event ----

  describe('cross-tab logout via StorageEvent', () => {
    it('clears user state when token is removed from another tab', async () => {
      localStorage.setItem('token', 'tok');
      mockGetCurrentUser.mockResolvedValue(mockUser);
      renderWithAuth();

      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('auth'));

      // Simulate another tab removing the token
      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', { key: 'token', newValue: null }),
        );
      });

      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('guest'));
    });

    it('ignores storage events for unrelated keys', async () => {
      localStorage.setItem('token', 'tok');
      mockGetCurrentUser.mockResolvedValue(mockUser);
      renderWithAuth();

      await waitFor(() => expect(screen.getByTestId('auth-status')).toHaveTextContent('auth'));

      act(() => {
        window.dispatchEvent(
          new StorageEvent('storage', { key: 'theme', newValue: 'dark' }),
        );
      });

      // Should remain authenticated
      expect(screen.getByTestId('auth-status')).toHaveTextContent('auth');
    });
  });

  // ---- getDashboardRoute ----

  describe('getDashboardRoute', () => {
    it('returns correct routes for each role', async () => {
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      expect(screen.getByTestId('dashboard-client')).toHaveTextContent('/client/dashboard');
      expect(screen.getByTestId('dashboard-provider')).toHaveTextContent('/provider/dashboard');
      expect(screen.getByTestId('dashboard-unknown')).toHaveTextContent('/login');
    });
  });

  // ---- Registration ----

  describe('registerClient', () => {
    it('calls authService.registerClient', async () => {
      mockRegisterClient.mockResolvedValue({ id: '3' });
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByText('register'));
      await waitFor(() => expect(mockRegisterClient).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' }),
      ));
    });

    it('shows toast error on registration failure', async () => {
      mockRegisterClient.mockRejectedValue(new Error('Email taken'));
      renderWithAuth();
      await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('ready'));

      fireEvent.click(screen.getByText('register'));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Email taken'));
    });
  });

  // ---- useAuth outside provider ----

  describe('useAuth outside provider', () => {
    it('throws when used outside AuthProvider', () => {
      // Suppress React error boundary console output
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      function Bad() {
        useAuth();
        return null;
      }
      expect(() => render(<Bad />)).toThrow('useAuth must be used within an AuthProvider');
      spy.mockRestore();
    });
  });
});
