import { ApiClient } from '../api/apiClient';
import { format } from 'date-fns';
import { Provider, ProviderAvailability } from '../types/api';

export class ProviderService {
  private static instance: ProviderService;
  private readonly apiClient: ApiClient;

  private constructor() {
    this.apiClient = ApiClient.getInstance();
  }

  public static getInstance(): ProviderService {
    if (!ProviderService.instance) {
      ProviderService.instance = new ProviderService();
    }
    return ProviderService.instance;
  }

  async getProviders(): Promise<Provider[]> {
    return this.apiClient.get<Provider[]>('/providers');
  }

  async getProvider(id: number): Promise<Provider> {
    return this.apiClient.get<Provider>(`/providers/${id}`);
  }

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

  async create(provider: Partial<Provider>): Promise<Provider> {
    return this.apiClient.post<Provider>('/providers', provider);
  }

  async update(id: string, provider: Partial<Provider>): Promise<Provider> {
    return this.apiClient.put<Provider>(`/providers/${id}`, provider);
  }

  async delete(id: string): Promise<void> {
    await this.apiClient.delete(`/providers/${id}`);
  }
}
