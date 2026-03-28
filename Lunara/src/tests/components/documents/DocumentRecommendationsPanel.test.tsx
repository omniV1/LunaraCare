import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';
import type { DocumentRecommendations } from '../../../services/recommendationService';

import { DocumentRecommendationsPanel } from '../../../components/documents/DocumentRecommendationsPanel';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../services/documentService', () => ({
  documentService: { createDocument: jest.fn() },
}));

jest.mock('../../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => (globalThis as unknown as Record<string, unknown>).__docPanelApi,
  },
}));

jest.mock('../../../services/recommendationService', () => ({
  RecommendationService: {
    getInstance: () => (globalThis as unknown as Record<string, unknown>).__docPanelRecSvc,
  },
}));

import { documentService } from '../../../services/documentService';
import { ApiClient } from '../../../api/apiClient';
import { RecommendationService } from '../../../services/recommendationService';

describe('DocumentRecommendationsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as unknown as Record<string, unknown>).__docPanelApi = { get: jest.fn() };
    (globalThis as unknown as Record<string, unknown>).__docPanelRecSvc = { getDocumentRecommendations: jest.fn() };
  });

  it('renders suggestions and creates a template doc', async () => {
    const api = ApiClient.getInstance() as unknown as { get: jest.Mock };
    const recSvc = RecommendationService.getInstance() as unknown as { getDocumentRecommendations: jest.Mock };

    api.get.mockResolvedValue({ intake: { feedingGoals: 'goal', feedingPreferences: ['x'] } });
    (documentService.createDocument as jest.Mock).mockResolvedValue({});
    recSvc.getDocumentRecommendations.mockResolvedValue({ postpartumWeek: 1, suggestions: [] });

    const onCreated = jest.fn();
    const onRefreshed = jest.fn();

    render(
      <DocumentRecommendationsPanel
        recommendations={{
          postpartumWeek: 1,
          suggestions: [
            { type: 'feeding-log', title: 'S', description: 'D', reason: 'R', priority: 'high' },
          ],
        } as unknown as DocumentRecommendations}
        isClient={true}
        userRole="client"
        onDocumentCreated={onCreated}
        onRecommendationsRefreshed={onRefreshed}
      />,
    );

    expect(screen.getByText('Suggested Documents')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create Document' }));

    await waitFor(() => expect(documentService.createDocument).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
    expect(onCreated).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(onRefreshed).toHaveBeenCalled());
  });

  it('returns null when no suggestions', () => {
    const { container } = render(
      <DocumentRecommendationsPanel
        recommendations={{ postpartumWeek: 0, suggestions: [] } as unknown as DocumentRecommendations}
        isClient={true}
        userRole="client"
        onDocumentCreated={jest.fn()}
        onRecommendationsRefreshed={jest.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

