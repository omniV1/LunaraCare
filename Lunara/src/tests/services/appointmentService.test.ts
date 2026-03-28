import { ApiClient } from '../../api/apiClient';
import { AppointmentService } from '../../services/appointmentService';
import {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  PaginatedResponse,
  QueryParams,
  ProviderAvailability,
  UpdateAvailabilityRequest,
} from '../../types/api';

jest.mock('../../api/apiClient', () => {
  return {
    ApiClient: {
      getInstance: jest.fn(),
    },
  };
});

describe('AppointmentService', () => {
  let appointmentService: AppointmentService;
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
    // Reset singleton
    (AppointmentService as unknown as Record<string, unknown>).instance = null;
    appointmentService = AppointmentService.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = AppointmentService.getInstance();
      const instance2 = AppointmentService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createAppointment', () => {
    it('should create a new appointment', async () => {
      const request: CreateAppointmentRequest = {
        providerId: '1',
        clientId: '2',
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T11:00:00Z',
        location: 'Test Location',
        notes: 'Test appointment',
      };
      const mockAppointment: Appointment = {
        id: '1',
        ...request,
        provider: { id: '1', firstName: 'Provider', lastName: 'One', role: 'provider' },
        status: 'scheduled',
      };
      mockApiClient.post.mockResolvedValue(mockAppointment);

      const result = await appointmentService.createAppointment(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/appointments', request);
      expect(result).toEqual(mockAppointment);
    });
  });

  describe('getAppointment', () => {
    it('should get appointment by ID', async () => {
      const mockAppointment: Appointment = {
        id: '1',
        providerId: '1',
        clientId: '2',
        provider: { id: '1', firstName: 'Provider', lastName: 'One', role: 'provider' },
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T11:00:00Z',
        status: 'scheduled',
        location: 'Test Location',
      };
      mockApiClient.get.mockResolvedValue(mockAppointment);

      const result = await appointmentService.getAppointment(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/appointments/1');
      expect(result).toEqual(mockAppointment);
    });
  });

  describe('updateAppointment', () => {
    it('should update an appointment', async () => {
      const request: UpdateAppointmentRequest = {
        notes: 'Updated notes',
      };
      const mockAppointment: Appointment = {
        id: '1',
        providerId: '1',
        clientId: '2',
        provider: { id: '1', firstName: 'Provider', lastName: 'One', role: 'provider' },
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T11:00:00Z',
        status: 'scheduled',
        location: 'Test Location',
        notes: 'Updated notes',
      };
      mockApiClient.patch.mockResolvedValue(mockAppointment);

      const result = await appointmentService.updateAppointment(1, request);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/appointments/1', request);
      expect(result).toEqual(mockAppointment);
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel an appointment', async () => {
      mockApiClient.patch.mockResolvedValue(undefined);

      await appointmentService.cancelAppointment(1);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/appointments/1', { status: 'CANCELLED' });
    });
  });

  describe('completeAppointment', () => {
    it('should complete an appointment', async () => {
      mockApiClient.patch.mockResolvedValue(undefined);

      await appointmentService.completeAppointment(1);

      expect(mockApiClient.patch).toHaveBeenCalledWith('/appointments/1', { status: 'COMPLETED' });
    });
  });

  describe('getMyAppointments', () => {
    it('should get appointments for current user with query params', async () => {
      const mockResponse: PaginatedResponse<Appointment> = {
        status: 200,
        data: [
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
        ],
        meta: { currentPage: 1, pageSize: 10, totalCount: 1, totalPages: 1 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const params: QueryParams = { page: 1, pageSize: 10 };
      const result = await appointmentService.getMyAppointments(params);

      expect(mockApiClient.get).toHaveBeenCalledWith('/appointments/me?page=1&pageSize=10');
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty query params', async () => {
      const mockResponse: PaginatedResponse<Appointment> = {
        status: 200,
        data: [],
        meta: { currentPage: 1, pageSize: 10, totalCount: 0, totalPages: 0 },
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await appointmentService.getMyAppointments({});

      expect(mockApiClient.get).toHaveBeenCalledWith('/appointments/me');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUpcomingAppointments', () => {
    it('should get upcoming appointments with default limit', async () => {
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

      const result = await appointmentService.getUpcomingAppointments();

      expect(mockApiClient.get).toHaveBeenCalledWith('/appointments/upcoming?limit=5');
      expect(result).toEqual(mockAppointments);
    });

    it('should get upcoming appointments with custom limit', async () => {
      const mockAppointments: Appointment[] = [];
      mockApiClient.get.mockResolvedValue(mockAppointments);

      const result = await appointmentService.getUpcomingAppointments(10);

      expect(mockApiClient.get).toHaveBeenCalledWith('/appointments/upcoming?limit=10');
      expect(result).toEqual(mockAppointments);
    });
  });

  describe('checkAvailability', () => {
    it('should check if time slot is available', async () => {
      mockApiClient.get.mockResolvedValue({ available: true });

      const result = await appointmentService.checkAvailability(
        1,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );

      expect(mockApiClient.get).toHaveBeenCalledWith('/appointments/check-availability', {
        providerId: 1,
        startTime: '2024-01-01T10:00:00Z',
        endTime: '2024-01-01T11:00:00Z',
      });
      expect(result).toBe(true);
    });

    it('should return false if time slot is not available', async () => {
      mockApiClient.get.mockResolvedValue({ available: false });

      const result = await appointmentService.checkAvailability(
        1,
        '2024-01-01T10:00:00Z',
        '2024-01-01T11:00:00Z'
      );

      expect(result).toBe(false);
    });
  });

  describe('getProviderAvailability', () => {
    it('should get provider availability schedule', async () => {
      const mockAvailability: ProviderAvailability[] = [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
        },
      ];
      mockApiClient.get.mockResolvedValue(mockAvailability);

      const result = await appointmentService.getProviderAvailability(1);

      expect(mockApiClient.get).toHaveBeenCalledWith('/providers/1/availability');
      expect(result).toEqual(mockAvailability);
    });
  });

  describe('updateProviderAvailability', () => {
    it('should update provider availability', async () => {
      const request: UpdateAvailabilityRequest = {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      };
      const mockAvailability: ProviderAvailability = {
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '17:00',
      };
      mockApiClient.put.mockResolvedValue(mockAvailability);

      const result = await appointmentService.updateProviderAvailability(1, request);

      expect(mockApiClient.put).toHaveBeenCalledWith('/providers/1/availability', request);
      expect(result).toEqual(mockAvailability);
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should get available time slots for a provider', async () => {
      const mockSlots = [
        { startTime: '09:00', endTime: '10:00' },
        { startTime: '10:00', endTime: '11:00' },
      ];
      mockApiClient.get.mockResolvedValue(mockSlots);

      const result = await appointmentService.getAvailableTimeSlots(1, '2024-01-01');

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/providers/1/available-slots?date=2024-01-01'
      );
      expect(result).toEqual(mockSlots);
    });
  });

  describe('buildQueryString', () => {
    it('should build query string with all params', () => {
      const params: QueryParams = {
        page: 1,
        pageSize: 10,
        sortBy: 'date',
        sortOrder: 'desc',
        search: 'test',
      };
      const queryString = (appointmentService as unknown as { buildQueryString(params: QueryParams): string }).buildQueryString(params);
      expect(queryString).toBe('?page=1&pageSize=10&sortBy=date&sortOrder=desc&search=test');
    });

    it('should build query string with partial params', () => {
      const params: QueryParams = { page: 2, sortBy: 'name' };
      const queryString = (appointmentService as unknown as { buildQueryString(params: QueryParams): string }).buildQueryString(params);
      expect(queryString).toBe('?page=2&sortBy=name');
    });

    it('should return empty string for no params', () => {
      const params: QueryParams = {};
      const queryString = (appointmentService as unknown as { buildQueryString(params: QueryParams): string }).buildQueryString(params);
      expect(queryString).toBe('');
    });
  });
});
