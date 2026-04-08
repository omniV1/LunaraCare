/**
 * @module recommendationService
 * Singleton service for fetching personalised resource and document
 * recommendations based on the client's postpartum progress.
 */

import { ApiClient } from '../api/apiClient';
import { Resource } from './resourceService';

/** Personalised resource recommendations for a client's postpartum week. */
export interface ResourceRecommendation {
  resources: Resource[];
  postpartumWeek: number;
  reason: string;
}

/** A single document template suggestion with priority and reasoning. */
export interface DocumentRecommendation {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  recommendedWeek: number;
  reason: string;
}

/** Collection of document suggestions with client context. */
export interface DocumentRecommendations {
  suggestions: DocumentRecommendation[];
  postpartumWeek: number;
  submittedTypes: string[];
}

/** Fetches personalised recommendations from the backend. */
export class RecommendationService {
  private static _instance: RecommendationService | null = null;
  private readonly api = ApiClient.getInstance();

  /**
   * Returns the singleton RecommendationService instance.
   * @returns The shared {@link RecommendationService}.
   */
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
