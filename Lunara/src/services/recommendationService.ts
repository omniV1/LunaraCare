import { ApiClient } from '../api/apiClient';
import { Resource } from './resourceService';

export interface ResourceRecommendation {
  resources: Resource[];
  postpartumWeek: number;
  reason: string;
}

export interface DocumentRecommendation {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  recommendedWeek: number;
  reason: string;
}

export interface DocumentRecommendations {
  suggestions: DocumentRecommendation[];
  postpartumWeek: number;
  submittedTypes: string[];
}

export class RecommendationService {
  private static _instance: RecommendationService | null = null;
  private readonly api = ApiClient.getInstance();

  static getInstance(): RecommendationService {
    this._instance ??= new RecommendationService();
    return this._instance;
  }

  private constructor() {}

  /**
   * Get personalized resource recommendations based on client's postpartum week
   */
  async getResourceRecommendations(): Promise<ResourceRecommendation> {
    const res = await this.api.get<ResourceRecommendation | { data?: ResourceRecommendation }>(
      '/recommendations/resources'
    );
    return (res && typeof res === 'object' && 'data' in res ? (res as { data?: ResourceRecommendation }).data : res) as ResourceRecommendation;
  }

  /**
   * Get document template suggestions based on client's progress
   */
  async getDocumentRecommendations(): Promise<DocumentRecommendations> {
    const res = await this.api.get<DocumentRecommendations | { data?: DocumentRecommendations }>(
      '/recommendations/documents'
    );
    return (res && typeof res === 'object' && 'data' in res ? (res as { data?: DocumentRecommendations }).data : res) as DocumentRecommendations;
  }
}
