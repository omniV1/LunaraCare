/**
 * @module authService
 * Handles all authentication operations (login, registration, MFA, token
 * refresh, logout) for the LUNARA frontend via the backend `/auth` endpoints.
 */

import { ApiClient } from '../api/apiClient';
import {
  User,
  LoginCredentials,
  ClientRegistrationData,
} from '../types/models';
import { AuthResponse } from '../types/auth';

/** Subset of user fields returned after a successful registration. */
interface RegisterResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

/**
 * Thrown when a login attempt requires MFA verification.
 * Contains the temporary `mfaToken` the client must send back with the TOTP code.
 */
export class MfaChallengeError extends Error {
  constructor(public readonly mfaToken: string) {
    super('MFA verification required');
    this.name = 'MfaChallengeError';
  }
}

/**
 * Singleton service encapsulating all authentication API calls.
 */
export class AuthService {
  private static _instance: AuthService | null = null;

  private readonly api = ApiClient.getInstance();

  /**
   * Returns the singleton AuthService instance.
   * @returns The shared {@link AuthService}.
   */
  static getInstance(): AuthService {
    this._instance ??= new AuthService();
    return this._instance;
  }

  private constructor() {}

  // --- Public API --------------------------------------------------

  /**
   * Registers a new client account.
   * @param data - Client registration fields (name, email, password, etc.).
   * @returns The created user's basic profile data.
   */
  async registerClient(data: ClientRegistrationData): Promise<RegisterResult> {
    const res = await this.api.post<{ success: boolean; data: RegisterResult }>(
      '/auth/register',
      { ...data, role: 'client' }
    );
    return res.data;
  }

  /**
   * Authenticates a client user.
   * @param credentials - Email and password.
   * @returns Auth response containing user and access token.
   * @throws {MfaChallengeError} When MFA verification is required.
   */
  async clientLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.login(credentials);
  }

  /**
   * Authenticates a provider user.
   * @param credentials - Email and password.
   * @returns Auth response containing user and access token.
   * @throws {MfaChallengeError} When MFA verification is required.
   */
  async providerLogin(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.login(credentials);
  }

  /**
   * Core login flow shared by client and provider login methods.
   * @param credentials - Email and password.
   * @returns Auth response with user data and access token.
   * @throws {MfaChallengeError} When the account has 2FA enabled.
   */
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

  /**
   * Completes MFA verification after a login challenge.
   * @param mfaToken - Temporary token received from the login challenge.
   * @param code - TOTP code from the user's authenticator app.
   * @returns Auth response with user data and access token.
   */
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

  /**
   * Requests a new access token using the httpOnly refresh-token cookie.
   * @returns The new access token string.
   */
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

  /**
   * Fetches the currently authenticated user's profile.
   * @returns The authenticated {@link User}.
   */
  async getCurrentUser(): Promise<User> {
    const res = await this.api.get<{ user: User }>('/users/profile');
    return res.user;
  }

  /**
   * Logs out the user by revoking the refresh token on the server
   * and clearing the local access token.
   */
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
