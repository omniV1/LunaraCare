/**
 * supportSessionService.test.ts
 * Unit tests for supportSessionService. ApiClient is mocked so we assert
 * on request paths and payloads without hitting a real API.
 */
import { SupportSessionType, SupportSessionStatus, ApprovalStatus } from '../../types/models';

const mockApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => mockApi,
  },
}));

// Import after mock is set up
import { supportSessionService } from '../../services/supportSessionService';

describe('supportSessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllSessions', () => {
    it('fetches all sessions', async () => {
      const sessions = [{ id: '1', clientId: 'c1', providerId: 'p1' }];
      mockApi.get.mockResolvedValue(sessions);

      const result = await supportSessionService.getAllSessions();

      expect(mockApi.get).toHaveBeenCalledWith('/support-sessions');
      expect(result).toEqual(sessions);
    });
  });

  describe('getClientSessions', () => {
    it('fetches sessions for client', async () => {
      mockApi.get.mockResolvedValue([]);

      await supportSessionService.getClientSessions('client-1');

      expect(mockApi.get).toHaveBeenCalledWith('/support-sessions/client/client-1');
    });
  });

  describe('getProviderSessions', () => {
    it('fetches sessions for provider', async () => {
      mockApi.get.mockResolvedValue([]);

      await supportSessionService.getProviderSessions('provider-1');

      expect(mockApi.get).toHaveBeenCalledWith('/support-sessions/provider/provider-1');
    });
  });

  describe('createSession', () => {
    it('posts session data', async () => {
      const data = {
        clientId: 'c1',
        providerId: 'p1',
        startTime: '2024-01-01T10:00:00',
        endTime: '2024-01-01T11:00:00',
        sessionType: SupportSessionType.INITIAL_CONSULTATION,
        location: 'Office',
      };
      const created = { id: 's1', ...data };
      mockApi.post.mockResolvedValue(created);

      const result = await supportSessionService.createSession(data);

      expect(mockApi.post).toHaveBeenCalledWith('/support-sessions', data);
      expect(result).toEqual(created);
    });
  });

  describe('updateSession', () => {
    it('puts update to session id', async () => {
      const update = { notes: 'Updated' };
      mockApi.put.mockResolvedValue({ id: 's1', ...update });

      await supportSessionService.updateSession('s1', update);

      expect(mockApi.put).toHaveBeenCalledWith('/support-sessions/s1', update);
    });
  });

  describe('deleteSession', () => {
    it('deletes by id', async () => {
      mockApi.delete.mockResolvedValue(undefined);

      await supportSessionService.deleteSession('s1');

      expect(mockApi.delete).toHaveBeenCalledWith('/support-sessions/s1');
    });
  });

  describe('updateSessionStatus', () => {
    it('puts status', async () => {
      mockApi.put.mockResolvedValue({ id: 's1', status: 'completed' });

      const result = await supportSessionService.updateSessionStatus('s1', SupportSessionStatus.COMPLETED);

      expect(mockApi.put).toHaveBeenCalledWith('/support-sessions/s1/status', {
        status: SupportSessionStatus.COMPLETED,
      });
      expect(result.status).toBe('completed');
    });
  });

  describe('updateApprovalStatus', () => {
    it('puts approval status', async () => {
      mockApi.put.mockResolvedValue({ id: 's1', approvalStatus: 'approved' });

      const result = await supportSessionService.updateApprovalStatus('s1', ApprovalStatus.APPROVED);

      expect(mockApi.put).toHaveBeenCalledWith('/support-sessions/s1/approval', {
        approvalStatus: ApprovalStatus.APPROVED,
      });
      expect(result.approvalStatus).toBe('approved');
    });
  });
});
