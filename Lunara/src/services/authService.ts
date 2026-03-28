// AuthService implementation

import { ApiClient } from '../api/apiClient';
import {
  User,
  LoginCredentials,
  ClientRegistrationData,
} from '../types/models';
import { AuthResponse } from '../types/auth';

interface RegisterResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export class MfaChallengeError extends Error {
  constructor(public readonly mfaToken: string) {
    super('MFA verification required');
    this.name = 'MfaChallengeError';
  }
}

export class AuthService {
  // Singleton pattern
  private static _instance: AuthService | null = null;

  private readonly api = ApiClient.getInstance();

  static getInstance(): AuthService {
    this._instance ??= new AuthService();
    return this._instance;
  }

  private constructor() {}

  // --- Public API --------------------------------------------------

  async registerClient(data: ClientRegistrationData): Promise<RegisterResult> {
    const res = await this.api.post<{ success: boolean; data: RegisterResult }>(
      '/auth/register',
      { ...data, role: 'client' }
    );
    return res.data;
  }

  async clientLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.login(credentials);
  }

  async providerLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.login(credentials);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    type LoginPayload = { user: User; accessToken: string };
    type LoginResponse = { data?: LoginPayload; mfaRequired?: boolean; mfaToken?: string } & Partial<LoginPayload>;
    const res = await this.api.post<LoginResponse>('/auth/login', credentials);

    // MFA challenge — user has 2FA enabled
    if (res.mfaRequired && res.mfaToken) {
      throw new MfaChallengeError(res.mfaToken);
    }

    const data = res.data ?? res;
    const { user, accessToken } = data;

    if (!user || !accessToken) {
      throw new Error('Invalid response from login endpoint');
    }

    // Refresh token is now set as an httpOnly cookie by the backend.
    return { user, token: accessToken };
  }

  async verifyMfa(mfaToken: string, code: string): Promise<AuthResponse> {
    type MfaPayload = { user: User; accessToken: string };
    type MfaResponse = { data?: MfaPayload } & Partial<MfaPayload>;
    const res = await this.api.post<MfaResponse>('/auth/mfa/verify', { mfaToken, code });

    const data = res.data ?? res;
    const { user, accessToken } = data;

    if (!user || !accessToken) {
      throw new Error('Invalid response from MFA verification');
    }

    // Refresh token is now set as an httpOnly cookie by the backend.
    return { user, token: accessToken };
  }

  async refreshToken(): Promise<string> {
    // Refresh token is sent automatically via httpOnly cookie.
    const res = await this.api.post<{
      success: boolean;
      data: { accessToken: string };
    }>('/auth/refresh', {});
    const newToken = res.data.accessToken;
    localStorage.setItem('token', newToken);
    return newToken;
  }

  async getCurrentUser(): Promise<User> {
    const res = await this.api.get<{ user: User }>('/users/profile');
    return res.user;
  }

  async logout(): Promise<void> {
    try {
      // Backend reads the refresh token from the httpOnly cookie and revokes it.
      await this.api.post('/auth/logout', {});
    } catch {
      // Best-effort: token cleared locally even if server call fails
    }

    localStorage.removeItem('token');
  }
}
