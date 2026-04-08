/**
 * @module types/auth
 * Authentication-related types consumed by the AuthContext and auth services.
 */
import { User } from './models';
import type { LoginCredentials, ClientRegistrationData } from './models';
export type { LoginCredentials, ClientRegistrationData } from './models';

/** Response payload returned by the login and MFA-verify endpoints. */
export interface AuthResponse {
  user: User;
  token: string; // access token
  requiresEmailVerification?: boolean;
}

/** Shape of the React AuthContext value exposed to consumers via `useAuth`. */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isProvider: boolean;
  isClient: boolean;
  clientLogin: (credentials: LoginCredentials) => Promise<AuthResponse>;
  providerLogin: (credentials: LoginCredentials) => Promise<AuthResponse>;
  verifyMfa: (mfaToken: string, code: string) => Promise<AuthResponse>;
  registerClient: (data: ClientRegistrationData) => Promise<void>;
  loginWithTokens: (accessToken: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  getDashboardRoute: (role: string) => string;
}
