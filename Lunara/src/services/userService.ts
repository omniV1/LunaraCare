/**
 * @module userService
 * Singleton service for user profile management, password changes,
 * account deletion, and notification preference operations.
 */

import { ApiClient } from '../api/apiClient';
import { UserProfile, PaginatedResponse, QueryParams } from '../types/api';
import { User } from '../types/user';

/** User notification preference flags. */
export interface NotificationPreferences {
  emailNotifications: boolean;
  appointmentReminders: boolean;
  messageAlerts: boolean;
  checkInReminders: boolean;
  loginAlerts: boolean;
}

/**
 * Service for handling user-related operations
 */
export class UserService {
  private static instance: UserService;
  private readonly api: ApiClient;

  private constructor() {
    this.api = ApiClient.getInstance();
  }

  /**
   * Get singleton instance of UserService
   */
  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Get current user's profile
   * @returns User profile
   */
  public async getCurrentProfile(): Promise<UserProfile> {
    return this.api.get<UserProfile>('/users/profile');
  }

  /**
   * Update current user's profile
   * @param profile - Updated profile data
   * @returns Updated user profile
   */
  public async updateProfile(
    profile: Partial<UserProfile> & { babyBirthDate?: string }
  ): Promise<UserProfile> {
    return this.api.put<UserProfile>('/users/profile', profile);
  }

  /**
   * Get user by ID
   * @param id - User ID
   * @returns User profile
   */
  public async getUserById(id: number): Promise<UserProfile> {
    return this.api.get<UserProfile>(`/users/${id}`);
  }

  /**
   * Get list of users with pagination
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of users
   */
  public async getUsers(params: QueryParams): Promise<PaginatedResponse<UserProfile>> {
    const queryString = this.buildQueryString(params);
    return this.api.get<PaginatedResponse<UserProfile>>(`/users${queryString}`);
  }

  /**
   * Get list of providers
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of providers
   */
  public async getProviders(params: QueryParams): Promise<PaginatedResponse<UserProfile>> {
    const queryString = this.buildQueryString(params);
    return this.api.get<PaginatedResponse<UserProfile>>(`/users/providers${queryString}`);
  }

  /**
   * Get list of clients
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of clients
   */
  public async getClients(params: QueryParams): Promise<PaginatedResponse<User>> {
    const queryString = this.buildQueryString(params);
    return this.api.get<PaginatedResponse<User>>(`/users/clients${queryString}`);
  }

  /**
   * Changes the authenticated user's password.
   * @param currentPassword - The user's current password for verification.
   * @param newPassword - The new password to set.
   * @returns Confirmation message.
   */
  public async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.api.post<{ message: string }>('/users/change-password', { currentPassword, newPassword });
  }

  /**
   * Permanently deletes the authenticated user's account.
   * @param password - Current password for confirmation.
   * @returns Confirmation message.
   */
  public async deleteAccount(password: string): Promise<{ message: string }> {
    return this.api.delete<{ message: string }>('/users/account', { data: { password } });
  }

  /**
   * Fetches the authenticated user's notification preferences.
   * @returns Object containing {@link NotificationPreferences}.
   */
  public async getPreferences(): Promise<{ preferences: NotificationPreferences }> {
    return this.api.get<{ preferences: NotificationPreferences }>('/users/preferences');
  }

  /**
   * Updates the authenticated user's notification preferences.
   * @param prefs - Partial preference updates.
   * @returns Confirmation message and the full updated preferences.
   */
  public async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<{ message: string; preferences: NotificationPreferences }> {
    return this.api.put<{ message: string; preferences: NotificationPreferences }>('/users/preferences', prefs);
  }

  /**
   * Build query string from parameters
   * @param params - Query parameters
   * @returns Formatted query string
   */
  private buildQueryString(params: QueryParams): string {
    const queryParams = new URLSearchParams();

    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString());
    }
    if (params.sortBy) {
      queryParams.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      queryParams.append('sortOrder', params.sortOrder);
    }
    if (params.search) {
      queryParams.append('search', params.search);
    }

    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }
}
