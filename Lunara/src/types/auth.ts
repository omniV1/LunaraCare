import { User } from './models';
import type { LoginCredentials, ClientRegistrationData } from './models';
export type { LoginCredentials, ClientRegistrationData } from './models';

export interface AuthResponse {
  user: User;
  token: string; // access token
  requiresEmailVerification?: boolean;
}

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
