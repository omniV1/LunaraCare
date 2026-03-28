import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthProvider from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/useAuth';
import { MemoryRouter } from 'react-router-dom';

// --- Mock react-toastify -------------------------------------------------------------
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

// --- Mock AuthService ----------------------------------------------------------------
jest.mock('../../services/authService', () => {
  const mockUser = {
    id: '1',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'CLIENT',
  };
  return {
    AuthService: {
      getInstance: () => ({
        registerClient: jest.fn().mockResolvedValue({
          user: mockUser,
          token: 'access123',
        }),
        clientLogin: jest.fn().mockResolvedValue({
          user: mockUser,
          token: 'access123',
        }),
        getCurrentUser: jest.fn().mockResolvedValue(mockUser),
        logout: jest.fn().mockImplementation(async () => {
          localStorage.removeItem('token');
        }),
      }),
    },
    MfaChallengeError: class MfaChallengeError extends Error {
      constructor(public readonly mfaToken: string) {
        super('MFA verification required');
        this.name = 'MfaChallengeError';
      }
    },
  };
});

// --- Helper component ----------------------------------------------------------------
function AuthStatus() {
  const { isAuthenticated, clientLogin, logout } = useAuth();
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Password123';
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'auth' : 'guest'}</span>
      <button onClick={() => clientLogin({ email: 'jane@example.com', password: TEST_PASSWORD })}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

// --------------------------------------------------------------------------------------

describe('AuthContext smoke flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('logs in and logs out successfully', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AuthStatus />
        </AuthProvider>
      </MemoryRouter>
    );

    // Initially guest
    expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');

    // Click login
    fireEvent.click(screen.getByText('login'));

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('auth');
    });

    // Access token saved (refresh token is now in httpOnly cookie, not localStorage)
    expect(localStorage.getItem('token')).toBe('access123');

    // Logout
    fireEvent.click(screen.getByText('logout'));
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('guest');
    });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
