import { ApiClient } from '../api/apiClient';
import {
  Appointment,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  PaginatedResponse,
  QueryParams,
  ProviderAvailability,
  UpdateAvailabilityRequest,
} from '../types/api';

export interface Provider {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

/**
 * Service for handling appointment and availability related operations
 */
export class AppointmentService {
  private static instance: AppointmentService;
  private readonly apiClient: ApiClient;

  private constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  public static getInstance(): AppointmentService {
    if (!AppointmentService.instance) {
      AppointmentService.instance = new AppointmentService();
    }
    return AppointmentService.instance;
  }

  /**
   * Create a new appointment
   * @param request - Appointment creation request
   * @returns Created appointment
   */
  public async createAppointment(request: CreateAppointmentRequest): Promise<Appointment> {
    return this.apiClient.post<Appointment>('/appointments', request);
  }

  /**
   * Get appointment by ID
   * @param id - Appointment ID
   * @returns Appointment details
   */
  public async getAppointment(id: number): Promise<Appointment> {
    return this.apiClient.get<Appointment>(`/appointments/${id}`);
  }

  /**
   * Update appointment details
   * @param id - Appointment ID
   * @param request - Partial appointment updates
   * @returns Updated appointment
   */
  public async updateAppointment(
    id: number,
    request: UpdateAppointmentRequest
  ): Promise<Appointment> {
    return this.apiClient.patch<Appointment>(`/appointments/${id}`, request);
  }

  /**
   * Cancel an appointment
   * @param id - Appointment ID
   * @returns void
   */
  public async cancelAppointment(id: number): Promise<void> {
    await this.apiClient.patch(`/appointments/${id}`, { status: 'CANCELLED' });
  }

  /**
   * Complete an appointment
   * @param id - Appointment ID
   * @returns void
   */
  public async completeAppointment(id: number): Promise<void> {
    await this.apiClient.patch(`/appointments/${id}`, { status: 'COMPLETED' });
  }

  /**
   * Get appointments for the current user (provider or client)
   * @param params - Query parameters for pagination and filtering
   * @returns Paginated list of appointments
   */
  public async getMyAppointments(params: QueryParams): Promise<PaginatedResponse<Appointment>> {
    const queryString = this.buildQueryString(params);
    return this.apiClient.get<PaginatedResponse<Appointment>>(`/appointments/me${queryString}`);
  }

  /**
   * Get upcoming appointments for the current user
   * @param limit - Number of appointments to return
   * @returns List of upcoming appointments
   */
  public async getUpcomingAppointments(limit: number = 5): Promise<Appointment[]> {
    return this.apiClient.get<Appointment[]>(`/appointments/upcoming?limit=${limit}`);
  }

  /**
   * Check provider availability for a specific time slot
   * @param providerId - Provider ID
   * @param startTime - Start time
   * @param endTime - End time
   * @returns Whether the time slot is available
   */
  public async checkAvailability(
    providerId: number,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const response = await this.apiClient.get<{ available: boolean }>(
      `/appointments/check-availability`,
      {
        providerId,
        startTime,
        endTime,
      }
    );
    return response.available;
  }

  /**
   * Get provider's availability schedule
   * @param providerId - Provider ID
   * @returns List of availability slots
   */
  public async getProviderAvailability(providerId: number): Promise<ProviderAvailability[]> {
    return this.apiClient.get<ProviderAvailability[]>(`/providers/${providerId}/availability`);
  }

  /**
   * Update provider's availability
   * @param providerId - Provider ID
   * @param availability - Updated availability settings
   */
  public async updateProviderAvailability(
    providerId: number,
    availability: UpdateAvailabilityRequest
  ): Promise<ProviderAvailability> {
    return this.apiClient.put<ProviderAvailability>(
      `/providers/${providerId}/availability`,
      availability
    );
  }

  /**
   * Get available time slots for a provider
   * @param providerId - Provider ID
   * @param date - Target date
   * @returns List of available time slots
   */
  public async getAvailableTimeSlots(
    providerId: number,
    date: string
  ): Promise<{ startTime: string; endTime: string }[]> {
    return this.apiClient.get<{ startTime: string; endTime: string }[]>(
      `/providers/${providerId}/available-slots?date=${date}`
    );
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
