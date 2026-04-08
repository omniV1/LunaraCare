/**
 * @module providerService
 * Singleton service for provider CRUD and availability schedule
 * management via the backend `/providers` endpoints.
 */

import { ApiClient } from '../api/apiClient';
import { format } from 'date-fns';
import { Provider, ProviderAvailability } from '../types/api';

/** Manages provider data and availability. */
export class ProviderService {
  private static instance: ProviderService;
  private readonly apiClient: ApiClient;

  private constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  /**
   * Returns the singleton ProviderService instance.
   * @returns The shared {@link ProviderService}.
   */
  public static getInstance(): ProviderService {
    if (!ProviderService.instance) {
      ProviderService.instance = new ProviderService();
    }
    return ProviderService.instance;
  }

  /**
   * Fetches all providers.
   * @returns Array of {@link Provider} objects.
   */
  async getProviders(): Promise<Provider[]> {
    return this.apiClient.get<Provider[]>('/providers');
  }

  /**
   * Fetches a single provider by ID.
   * @param id - Provider identifier.
   * @returns The matching {@link Provider}.
   */
  async getProvider(id: number): Promise<Provider> {
    return this.apiClient.get<Provider>(`/providers/${id}`);
  }

  /**
   * Fetches a provider's availability slots within a date range.
   * @param providerId - Provider identifier.
   * @param startDate - Range start.
   * @param endDate - Range end.
   * @returns Array of {@link ProviderAvailability} slots.
   */
  async getProviderAvailability(
    providerId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ProviderAvailability[]> {
    return this.apiClient.get<ProviderAvailability[]>(`/providers/${providerId}/availability`, {
      start: format(startDate, "yyyy-MM-dd'T'HH:mm:ss"),
      end: format(endDate, "yyyy-MM-dd'T'HH:mm:ss"),
    });
  }

  /**
   * Creates a new provider record.
   * @param provider - Partial provider data.
   * @returns The created {@link Provider}.
   */
  async create(provider: Partial<Provider>): Promise<Provider> {
    return this.apiClient.post<Provider>('/providers', provider);
  }

  /**
   * Updates an existing provider record.
   * @param id - Provider identifier.
   * @param provider - Partial update data.
   * @returns The updated {@link Provider}.
   */
  async update(id: string, provider: Partial<Provider>): Promise<Provider> {
    return this.apiClient.put<Provider>(`/providers/${id}`, provider);
  }

  /**
   * Deletes a provider by ID.
   * @param id - Provider identifier.
   */
  async delete(id: string): Promise<void> {
    await this.apiClient.delete(`/providers/${id}`);
  }
}
