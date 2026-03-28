import { ApiClient } from '../../api/apiClient';
import { fetchAppointments, fetchProviderAvailability } from '../../services/api';
import { Appointment, ProviderAvailability } from '../../types/api';

jest.mock('../../api/apiClient', () => {
  return {
    ApiClient: {
      getInstance: jest.fn(),
    },
  };
});

jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    // Simple mock for format function
    if (date instanceof Date) {
      if (formatStr === 'yyyy-MM-dd') {
        return date.toISOString().split('T')[0];
      }
    }
    return date;
  }),
}));

describe('api service', () => {
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    } as unknown as jest.Mocked<ApiClient>;
    (ApiClient.getInstance as jest.Mock).mockReturnValue(mockApiClient);
  });

  describe('fetchAppointments', () => {
    it('should fetch appointments for a date range', async () => {
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          providerId: '1',
          clientId: '2',
          provider: { id: '1', firstName: 'Provider', lastName: 'One', role: 'provider' },
          startTime: '2024-01-01T10:00:00Z',
          endTime: '2024-01-01T11:00:00Z',
          status: 'scheduled',
          location: 'Test Location',
        },
      ];
      mockApiClient.get.mockResolvedValue(mockAppointments);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await fetchAppointments(startDate, endDate);

      expect(mockApiClient.get).toHaveBeenCalled();
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/appointments/calendar?')
      );
      expect(result).toEqual(mockAppointments);
    });

    it('should format dates correctly in query string', async () => {
      mockApiClient.get.mockResolvedValue([]);

      const startDate = new Date('2024-02-15');
      const endDate = new Date('2024-02-29');
      await fetchAppointments(startDate, endDate);

      const callArg = mockApiClient.get.mock.calls[0][0];
      expect(callArg).toContain('startDate');
      expect(callArg).toContain('endDate');
    });
  });

  describe('fetchProviderAvailability', () => {
    it('should fetch provider availability for a date range', async () => {
      const mockAvailability: ProviderAvailability[] = [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      ];
      mockApiClient.get.mockResolvedValue(mockAvailability);

      const providerId = 1;
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const result = await fetchProviderAvailability(providerId, startDate, endDate);

      expect(mockApiClient.get).toHaveBeenCalled();
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining(`/providers/${providerId}/availability/calendar?`)
      );
      expect(result).toEqual(mockAvailability);
    });

    it('should include provider ID in the endpoint', async () => {
      mockApiClient.get.mockResolvedValue([]);

      const providerId = 42;
      const startDate = new Date('2024-03-01');
      const endDate = new Date('2024-03-31');
      await fetchProviderAvailability(providerId, startDate, endDate);

      const callArg = mockApiClient.get.mock.calls[0][0];
      expect(callArg).toContain('/providers/42/availability');
    });

    it('should format dates correctly in query string', async () => {
      mockApiClient.get.mockResolvedValue([]);

      const providerId = 1;
      const startDate = new Date('2024-04-01');
      const endDate = new Date('2024-04-30');
      await fetchProviderAvailability(providerId, startDate, endDate);

      const callArg = mockApiClient.get.mock.calls[0][0];
      expect(callArg).toContain('startDate');
      expect(callArg).toContain('endDate');
    });
  });
});
