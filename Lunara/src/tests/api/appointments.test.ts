import { ApiClient } from '../../api/apiClient';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { SupportSessionType } from '../../types/models';

const server = setupServer();
const BASE_URL = 'http://localhost:8080'; // Hardcode base URL for tests

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());

describe('Appointment Scheduling API', () => {
  const apiClient = ApiClient.getInstance();

  describe('listProviders', () => {
    const mockProviders = [
      {
        id: 1,
        firstName: 'John',
        lastName: 'Smith',
        role: 'THERAPIST',
      },
      {
        id: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'COUNSELOR',
      },
    ];

    it('should fetch list of available providers', async () => {
      server.use(
        rest.get(`${BASE_URL}/providers`, (_req, res, ctx) => {
          return res(ctx.json(mockProviders));
        })
      );

      const result = await apiClient.get('/providers');
      expect(result).toEqual(mockProviders);
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get(`${BASE_URL}/providers`, (_req, res, ctx) => {
          return res(
            ctx.status(500),
            ctx.json({
              status: 500,
              message: 'Internal server error',
              error: 'Server Error',
            })
          );
        })
      );

      await expect(apiClient.get('/providers')).rejects.toThrow();
    });
  });

  describe('createAppointment', () => {
    const mockAppointment = {
      clientId: 1,
      providerId: 2,
      startTime: '2024-03-20T10:00:00',
      endTime: '2024-03-20T11:00:00',
      sessionType: SupportSessionType.INITIAL_CONSULTATION,
      location: 'Virtual',
    };

    it('should create a new appointment', async () => {
      server.use(
        rest.post(`${BASE_URL}/appointments`, async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(mockAppointment);
          return res(ctx.status(201), ctx.json({ ...mockAppointment, id: 1 }));
        })
      );

      const result = await apiClient.post('/appointments', mockAppointment);
      expect(result).toEqual({ ...mockAppointment, id: 1 });
    });

    it('should handle validation errors', async () => {
      const invalidAppointment = { ...mockAppointment, startTime: 'invalid-date' };

      server.use(
        rest.post(`${BASE_URL}/appointments`, (_req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              message: 'Validation failed',
              errors: ['Invalid date format for startTime'],
            })
          );
        })
      );

      await expect(apiClient.post('/appointments', invalidAppointment)).rejects.toThrow();
    });

    it('should handle provider unavailability', async () => {
      server.use(
        rest.post(`${BASE_URL}/appointments`, (_req, res, ctx) => {
          return res(
            ctx.status(409),
            ctx.json({
              message: 'Provider is not available at the requested time',
            })
          );
        })
      );

      await expect(apiClient.post('/appointments', mockAppointment)).rejects.toThrow();
    });
  });
});
