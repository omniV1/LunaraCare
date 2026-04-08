/**
 * @module supportSessionService
 * Pre-wired service for support session CRUD and status transitions.
 * Backend routes do not exist yet; this service will function once they are implemented.
 */

import { ApiClient } from '../api/apiClient';
import {
  SupportSession,
  SupportSessionStatus,
  ApprovalStatus,
  SupportSessionType,
} from '../types/models';

const api = ApiClient.getInstance();

/**
 * Support session service.
 * NOTE: Backend routes for /support-sessions do not exist yet.
 * This service is pre-wired and will work once the routes are implemented.
 */
/**
 * Object-literal service with methods for support session management.
 * Each method maps to a planned backend REST endpoint.
 */
export const supportSessionService = {
  /**
   * Fetches all support sessions.
   * @returns Array of {@link SupportSession} objects.
   */
  getAllSessions: (): Promise<SupportSession[]> =>
    api.get<SupportSession[]>('/support-sessions'),

  /**
   * Fetches sessions for a specific client.
   * @param clientId - Client user identifier.
   * @returns Array of the client's sessions.
   */
  getClientSessions: (clientId: string): Promise<SupportSession[]> =>
    api.get<SupportSession[]>(`/support-sessions/client/${clientId}`),

  /**
   * Fetches sessions for a specific provider.
   * @param providerId - Provider user identifier.
   * @returns Array of the provider's sessions.
   */
  getProviderSessions: (providerId: string): Promise<SupportSession[]> =>
    api.get<SupportSession[]>(`/support-sessions/provider/${providerId}`),

  /**
   * Creates a new support session.
   * @param sessionData - Session details (participants, times, type, location).
   * @returns The newly created {@link SupportSession}.
   */
  createSession: (sessionData: {
    clientId: string;
    providerId: string;
    startTime: string;
    endTime: string;
    sessionType: SupportSessionType;
    notes?: string;
    location: string;
  }): Promise<SupportSession> =>
    api.post<SupportSession>('/support-sessions', sessionData),

  /**
   * Updates an existing support session.
   * @param sessionId - Session identifier.
   * @param updateData - Partial update payload.
   * @returns The updated {@link SupportSession}.
   */
  updateSession: (
    sessionId: string,
    updateData: Partial<{
      startTime: string;
      endTime: string;
      status: SupportSessionStatus;
      approvalStatus: ApprovalStatus;
      notes: string;
      followUpNotes: string;
      cancellationReason: string;
      location: string;
    }>
  ): Promise<SupportSession> =>
    api.put<SupportSession>(`/support-sessions/${sessionId}`, updateData),

  /**
   * Deletes a support session.
   * @param sessionId - Session identifier.
   */
  deleteSession: (sessionId: string): Promise<void> =>
    api.delete<void>(`/support-sessions/${sessionId}`),

  /**
   * Updates only the status of a support session.
   * @param sessionId - Session identifier.
   * @param status - New session status.
   * @returns The updated {@link SupportSession}.
   */
  updateSessionStatus: (
    sessionId: string,
    status: SupportSessionStatus
  ): Promise<SupportSession> =>
    api.put<SupportSession>(`/support-sessions/${sessionId}/status`, { status }),

  /**
   * Updates only the approval status of a support session.
   * @param sessionId - Session identifier.
   * @param approvalStatus - New approval status.
   * @returns The updated {@link SupportSession}.
   */
  updateApprovalStatus: (
    sessionId: string,
    approvalStatus: ApprovalStatus
  ): Promise<SupportSession> =>
    api.put<SupportSession>(`/support-sessions/${sessionId}/approval`, { approvalStatus }),
};
