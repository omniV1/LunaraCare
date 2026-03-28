import { ApiClient } from '../../api/apiClient';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { SupportSessionStatus, ApprovalStatus, SupportSessionType } from '../../types/models';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Support Session API', () => {
  const apiClient = ApiClient.getInstance();
  const baseUrl = process.env.VITE_API_BASE_URL;

  describe('getSessions', () => {
    const mockSessions = [
      {
        id: 1,
        startTime: '2024-03-20T10:00:00',
        endTime: '2024-03-20T11:00:00',
        providerId: 1,
        clientId: 2,
        status: SupportSessionStatus.SCHEDULED,
        approvalStatus: ApprovalStatus.PENDING,
        sessionType: SupportSessionType.INITIAL_CONSULTATION,
        location: 'Virtual',
        notes: 'Initial meeting notes',
        followUpNotes: null,
        cancellationReason: null,
      },
    ];

    it('should fetch provider sessions', async () => {
      const providerId = 1;

      server.use(
        rest.get(`${baseUrl}/providers/${providerId}/sessions`, (_req, res, ctx) => {
          return res(ctx.json(mockSessions));
        })
      );

      const result = await apiClient.get(`/providers/${providerId}/sessions`);
      expect(result).toEqual(mockSessions);
    });

    it('should fetch client sessions', async () => {
      const clientId = 2;

      server.use(
        rest.get(`${baseUrl}/clients/${clientId}/sessions`, (_req, res, ctx) => {
          return res(ctx.json(mockSessions));
        })
      );

      const result = await apiClient.get(`/clients/${clientId}/sessions`);
      expect(result).toEqual(mockSessions);
    });
  });

  describe('updateSessionStatus', () => {
    const sessionId = 1;
    const mockUpdate = {
      status: SupportSessionStatus.COMPLETED,
    };

    it('should update session status', async () => {
      server.use(
        rest.patch(`${baseUrl}/sessions/${sessionId}/status`, async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(mockUpdate);
          return res(ctx.json({ ...mockUpdate, id: sessionId }));
        })
      );

      const result = await apiClient.patch(`/sessions/${sessionId}/status`, mockUpdate);
      expect(result).toEqual({ ...mockUpdate, id: sessionId });
    });

    it('should handle invalid status transitions', async () => {
      server.use(
        rest.patch(`${baseUrl}/sessions/${sessionId}/status`, (_req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              message: 'Invalid status transition',
            })
          );
        })
      );

      await expect(apiClient.patch(`/sessions/${sessionId}/status`, mockUpdate)).rejects.toThrow();
    });
  });

  describe('updateApprovalStatus', () => {
    const sessionId = 1;
    const mockUpdate = {
      approvalStatus: ApprovalStatus.APPROVED,
    };

    it('should update approval status', async () => {
      server.use(
        rest.patch(`${baseUrl}/sessions/${sessionId}/approval`, async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(mockUpdate);
          return res(ctx.json({ ...mockUpdate, id: sessionId }));
        })
      );

      const result = await apiClient.patch(`/sessions/${sessionId}/approval`, mockUpdate);
      expect(result).toEqual({ ...mockUpdate, id: sessionId });
    });
  });

  describe('updateSessionNotes', () => {
    const sessionId = 1;
    const mockNotes = {
      notes: 'Updated session notes',
      followUpNotes: 'Follow-up actions required',
    };

    it('should update session notes', async () => {
      server.use(
        rest.patch(`${baseUrl}/sessions/${sessionId}/notes`, async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(mockNotes);
          return res(ctx.json({ ...mockNotes, id: sessionId }));
        })
      );

      const result = await apiClient.patch(`/sessions/${sessionId}/notes`, mockNotes);
      expect(result).toEqual({ ...mockNotes, id: sessionId });
    });
  });

  describe('cancelSession', () => {
    const sessionId = 1;
    const mockCancellation = {
      cancellationReason: 'Schedule conflict',
    };

    it('should cancel a session', async () => {
      server.use(
        rest.post(`${baseUrl}/sessions/${sessionId}/cancel`, async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(mockCancellation);
          return res(
            ctx.json({
              id: sessionId,
              status: SupportSessionStatus.CANCELLED,
              ...mockCancellation,
            })
          );
        })
      );

      const result = await apiClient.post(`/sessions/${sessionId}/cancel`, mockCancellation);
      expect(result).toEqual({
        id: sessionId,
        status: SupportSessionStatus.CANCELLED,
        ...mockCancellation,
      });
    });

    it('should handle cancellation time limit', async () => {
      server.use(
        rest.post(`${baseUrl}/sessions/${sessionId}/cancel`, (_req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              message: 'Cannot cancel session within 24 hours of start time',
            })
          );
        })
      );

      await expect(
        apiClient.post(`/sessions/${sessionId}/cancel`, mockCancellation)
      ).rejects.toThrow();
    });
  });
});
