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
export const supportSessionService = {
  getAllSessions: (): Promise<SupportSession[]> =>
    api.get<SupportSession[]>('/support-sessions'),

  getClientSessions: (clientId: string): Promise<SupportSession[]> =>
    api.get<SupportSession[]>(`/support-sessions/client/${clientId}`),

  getProviderSessions: (providerId: string): Promise<SupportSession[]> =>
    api.get<SupportSession[]>(`/support-sessions/provider/${providerId}`),

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

  deleteSession: (sessionId: string): Promise<void> =>
    api.delete<void>(`/support-sessions/${sessionId}`),

  updateSessionStatus: (
    sessionId: string,
    status: SupportSessionStatus
  ): Promise<SupportSession> =>
    api.put<SupportSession>(`/support-sessions/${sessionId}/status`, { status }),

  updateApprovalStatus: (
    sessionId: string,
    approvalStatus: ApprovalStatus
  ): Promise<SupportSession> =>
    api.put<SupportSession>(`/support-sessions/${sessionId}/approval`, { approvalStatus }),
};
