import { ApiClient } from '../../api/apiClient';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { format } from 'date-fns';

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Calendar API', () => {
  const apiClient = ApiClient.getInstance();
  const baseUrl = process.env.VITE_API_BASE_URL;

  describe('fetchAppointments', () => {
    const mockAppointments = [
      {
        id: 1,
        startTime: '2024-03-20T10:00:00',
        endTime: '2024-03-20T11:00:00',
        providerId: 1,
        providerName: 'Dr. Smith',
        status: 'SCHEDULED',
        location: 'Virtual',
      },
    ];

    it('should fetch appointments for a given date range', async () => {
      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-03-31');

      server.use(
        rest.get(`${baseUrl}/appointments`, (req, res, ctx) => {
          const queryStartDate = req.url.searchParams.get('startDate');
          const queryEndDate = req.url.searchParams.get('endDate');

          expect(queryStartDate).toBe(format(startDate, 'yyyy-MM-dd'));
          expect(queryEndDate).toBe(format(endDate, 'yyyy-MM-dd'));

          return res(ctx.json(mockAppointments));
        })
      );

      const result = await apiClient.get('/appointments', {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });

      expect(result).toEqual(mockAppointments);
    });

    it('should handle API errors gracefully', async () => {
      server.use(
        rest.get(`${baseUrl}/appointments`, (_req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
        })
      );

      await expect(apiClient.get('/appointments')).rejects.toThrow();
    });
  });

  describe('fetchProviderAvailability', () => {
    const mockAvailability = [
      {
        providerId: 1,
        providerName: 'Dr. Smith',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      },
    ];

    it('should fetch provider availability for a given date range', async () => {
      const providerId = 1;
      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-03-31');

      server.use(
        rest.get(`${baseUrl}/providers/${providerId}/availability`, (req, res, ctx) => {
          const queryStartDate = req.url.searchParams.get('startDate');
          const queryEndDate = req.url.searchParams.get('endDate');

          expect(queryStartDate).toBe(format(startDate, 'yyyy-MM-dd'));
          expect(queryEndDate).toBe(format(endDate, 'yyyy-MM-dd'));

          return res(ctx.json(mockAvailability));
        })
      );

      const result = await apiClient.get(`/providers/${providerId}/availability`, {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });

      expect(result).toEqual(mockAvailability);
    });

    it('should handle API errors gracefully', async () => {
      const providerId = 1;

      server.use(
        rest.get(`${baseUrl}/providers/${providerId}/availability`, (_req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: 'Internal server error' }));
        })
      );

      await expect(apiClient.get(`/providers/${providerId}/availability`)).rejects.toThrow();
    });
  });
});
