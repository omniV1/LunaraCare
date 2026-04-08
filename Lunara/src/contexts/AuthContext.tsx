/**
 * @module AuthContext
 * Provides application-wide authentication state and actions (login, logout,
 * registration, MFA) via React Context consumed through the {@link useAuth} hook.
 */

import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  User,
  LoginCredentials,
  ClientRegistrationData,
} from '../types/models';
import { AuthContextType, AuthResponse } from '../types/auth';
import { AuthService, MfaChallengeError } from '../services/authService';

/** Fast Refresh: context object is not a component; kept with provider for cohesion. */
// eslint-disable-next-line react-refresh/only-export-components -- context + provider module
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
const authService = AuthService.getInstance();

/**
 * Type guard that narrows an unknown value to a plain object.
 * @param v - Value to check.
 * @returns `true` when `v` is a non-null, non-array object.
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Extracts a human-readable message from an Axios-style error or falls back.
 * @param error - The caught error value.
 * @param fallback - Default message when no specific message is found.
 * @returns A user-facing error string.
 */
function getErrorMessage(error: unknown, fallback: string): string {
  if (isRecord(error) && isRecord(error.response) && isRecord(error.response.data)) {
    const msg = error.response.data.message;
    if (typeof msg === 'string') return msg;
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * Context provider that manages authentication lifecycle: auto-restoring
 * sessions on mount, handling login/logout/MFA, and cross-tab sync.
 * @param props.children - Child components that can access auth state via {@link useAuth}.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      const tokenAtStart = localStorage.getItem('token');
      try {
        if (tokenAtStart) {
          const user = await authService.getCurrentUser();
          if (!cancelled) {
            setUser(user);
            setLoading(false);
          }
        } else if (!cancelled) {
          setLoading(false);
        }
      } catch (err: unknown) {
        if (process.env.NODE_ENV === 'development' && err instanceof Error) {
          console.debug('Auth check failed (expected for missing/invalid token):', err.message);
        }
        if (!cancelled) {
          // Only clear if token hasn't changed (e.g. OAuth may have stored new tokens)
          const currentToken = localStorage.getItem('token');
          if (currentToken === tokenAtStart) {
            localStorage.removeItem('token');
          }
          setUser(null);
          setLoading(false);
        }
      }
    };
    checkAuth();

    const handleSessionExpired = () => {
      setUser(null);
      setError(null);
    };
    window.addEventListener('auth:session-expired', handleSessionExpired);

    // Sync logout across browser tabs via localStorage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue === null) {
        setUser(null);
        setError(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      cancelled = true;
      window.removeEventListener('auth:session-expired', handleSessionExpired);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleAuthResponse = useCallback((accessToken: string, user: User) => {
    if (!user?.id) {
      throw new Error('Invalid user data from authentication');
    }
    localStorage.setItem('token', accessToken);
    // Refresh token is now stored as an httpOnly cookie by the backend.
    window.dispatchEvent(new CustomEvent('auth:token-refreshed'));
    // Set loading to false in case checkAuth hasn't completed yet
    setLoading(false);
    setUser(user);
    setError(null);
  }, []);

  const registerClient = useCallback(async (data: ClientRegistrationData): Promise<void> => {
    try {
      await authService.registerClient(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Client registration failed'));
      throw error;
    }
  }, []);

  const providerLogin = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authService.providerLogin(credentials);
      handleAuthResponse(response.token, response.user);
      toast.success('Login successful! Welcome back.');
      return response;
    } catch (error: unknown) {
      if (error instanceof MfaChallengeError) throw error;
      toast.error(getErrorMessage(error, 'Login failed'));
      throw error;
    }
  }, [handleAuthResponse]);

  const clientLogin = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authService.clientLogin(credentials);
      handleAuthResponse(response.token, response.user);
      toast.success('Login successful! Welcome back.');
      return response;
    } catch (error: unknown) {
      if (error instanceof MfaChallengeError) throw error;
      toast.error(getErrorMessage(error, 'Login failed'));
      throw error;
    }
  }, [handleAuthResponse]);

  const verifyMfa = useCallback(async (mfaToken: string, code: string): Promise<AuthResponse> => {
    try {
      const response = await authService.verifyMfa(mfaToken, code);
      handleAuthResponse(response.token, response.user);
      toast.success('Login successful! Welcome back.');
      return response;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Verification failed'));
      throw error;
    }
  }, [handleAuthResponse]);

  const loginWithTokens = useCallback(async (accessToken: string) => {
    localStorage.setItem('token', accessToken);
    // Refresh token is already stored as an httpOnly cookie by the OAuth redirect.
    window.dispatchEvent(new CustomEvent('auth:token-refreshed'));
    try {
      const user = await authService.getCurrentUser();
      setUser(user);
      setLoading(false);
    } catch (err) {
      if (process.env.NODE_ENV === 'development' && err instanceof Error) {
        console.warn('[Auth] OAuth post-login failed (getCurrentUser):', err.message);
      }
      localStorage.removeItem('token');
      setLoading(false);
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setError(null);
    toast.info('You have been logged out.');
  }, []);

  const clearError = useCallback(() => setError(null), []);

  // Helper function to get the correct dashboard route based on user role
  const getDashboardRoute = useCallback((role: string): string => {
    switch (role) {
      case 'client':
        return '/client/dashboard';
      case 'provider':
        return '/provider/dashboard';
      default:
        return '/login';
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: !!user,
      isProvider: user?.role === 'provider',
      isClient: user?.role === 'client',
      registerClient,
      providerLogin,
      clientLogin,
      verifyMfa,
      loginWithTokens,
      logout,
      clearError,
      getDashboardRoute,
    }),
    [
      user,
      loading,
      error,
      registerClient,
      providerLogin,
      clientLogin,
      verifyMfa,
      loginWithTokens,
      logout,
      clearError,
      getDashboardRoute,
    ]
  );

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export default AuthProvider;
