import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../contexts/useAuth';

// Mock the useAuth hook
jest.mock('../../contexts/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock the Spinner component
jest.mock('../../components/ui/Spinner', () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>,
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('ProtectedRoute', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log for cleaner test output
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should show spinner when loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: true,
      error: null,
      logout: jest.fn(),
      clientLogin: jest.fn(),
      providerLogin: jest.fn(),
      verifyMfa: jest.fn(),
      loginWithTokens: jest.fn(),
      registerClient: jest.fn(),
      clearError: jest.fn(),
      getDashboardRoute: jest.fn(),
      isProvider: false,
      isClient: false,
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['client']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      logout: jest.fn(),
      clientLogin: jest.fn(),
      providerLogin: jest.fn(),
      verifyMfa: jest.fn(),
      loginWithTokens: jest.fn(),
      registerClient: jest.fn(),
      clearError: jest.fn(),
      getDashboardRoute: jest.fn(),
      isProvider: false,
      isClient: false,
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['client']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user is authenticated and has correct role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'client@test.com',
        role: 'client',
        firstName: 'John',
        lastName: 'Doe',
      },
      isAuthenticated: true,
      loading: false,
      error: null,
      logout: jest.fn(),
      clientLogin: jest.fn(),
      providerLogin: jest.fn(),
      verifyMfa: jest.fn(),
      loginWithTokens: jest.fn(),
      registerClient: jest.fn(),
      clearError: jest.fn(),
      getDashboardRoute: jest.fn(),
      isProvider: false,
      isClient: false,
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['client']}>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect client to client dashboard when accessing provider route', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'client@test.com',
        role: 'client',
        firstName: 'John',
        lastName: 'Doe',
      },
      isAuthenticated: true,
      loading: false,
      error: null,
      logout: jest.fn(),
      clientLogin: jest.fn(),
      providerLogin: jest.fn(),
      verifyMfa: jest.fn(),
      loginWithTokens: jest.fn(),
      registerClient: jest.fn(),
      clearError: jest.fn(),
      getDashboardRoute: jest.fn(),
      isProvider: false,
      isClient: false,
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['provider']}>
        <div>Provider Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Provider Content')).not.toBeInTheDocument();
  });

  it('should redirect provider to provider dashboard when accessing client route', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'provider@test.com',
        role: 'provider',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      isAuthenticated: true,
      loading: false,
      error: null,
      logout: jest.fn(),
      clientLogin: jest.fn(),
      providerLogin: jest.fn(),
      verifyMfa: jest.fn(),
      loginWithTokens: jest.fn(),
      registerClient: jest.fn(),
      clearError: jest.fn(),
      getDashboardRoute: jest.fn(),
      isProvider: false,
      isClient: false,
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['client']}>
        <div>Client Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Client Content')).not.toBeInTheDocument();
  });

  it('should allow provider to access provider routes', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        email: 'provider@test.com',
        role: 'provider',
        firstName: 'Provider',
        lastName: 'User',
      },
      isAuthenticated: true,
      loading: false,
      error: null,
      logout: jest.fn(),
      clientLogin: jest.fn(),
      providerLogin: jest.fn(),
      verifyMfa: jest.fn(),
      loginWithTokens: jest.fn(),
      registerClient: jest.fn(),
      clearError: jest.fn(),
      getDashboardRoute: jest.fn(),
      isProvider: false,
      isClient: false,
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['provider']}>
        <div>Provider Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Provider Content')).toBeInTheDocument();
  });
});
