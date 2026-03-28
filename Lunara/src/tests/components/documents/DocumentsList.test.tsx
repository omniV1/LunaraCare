import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { DocumentsList } from '../../../components/documents/DocumentsList';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockUseAuth = jest.fn();
jest.mock('../../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../services/documentService', () => ({
  documentService: {
    getDocuments: jest.fn(),
    searchDocuments: jest.fn(),
    submitDocument: jest.fn(),
    deleteDocument: jest.fn(),
    getDocumentTypeLabel: jest.fn((t: string) => t),
    getSubmissionStatusLabel: jest.fn((s: string) => s),
    getStatusLabel: jest.fn((s: string) => s),
  },
}));

jest.mock('../../../services/recommendationService', () => ({
  RecommendationService: { getInstance: () => (globalThis as unknown as Record<string, unknown>).__docsListRecSvc },
}));

import { documentService } from '../../../services/documentService';
import { RecommendationService } from '../../../services/recommendationService';

jest.mock('../../../components/documents/ClientDocumentEdit', () => ({
  ClientDocumentEdit: () => <div data-testid="edit" />,
}));
jest.mock('../../../components/documents/DocumentRecommendations', () => ({
  DocumentRecommendationsPanel: () => <div data-testid="recs" />,
}));

describe('DocumentsList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as unknown as Record<string, unknown>).confirm = jest.fn(() => true);
    (globalThis as unknown as Record<string, unknown>).__docsListRecSvc = {
      getDocumentRecommendations: jest.fn().mockResolvedValue({ postpartumWeek: 1, suggestions: [] }),
    };
  });

  it('loads documents, searches, submits and deletes', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'client' }, isClient: true });
    const recSvc = RecommendationService.getInstance() as unknown as { getDocumentRecommendations: jest.Mock };
    recSvc.getDocumentRecommendations.mockResolvedValue({ postpartumWeek: 1, suggestions: [] });
    documentService.getDocuments.mockResolvedValue([{ id: 'd1', title: 'Doc', submissionStatus: 'draft', files: [] }]);
    documentService.searchDocuments.mockResolvedValue([{ id: 'd2', title: 'Doc2', submissionStatus: 'draft', files: [] }]);
    documentService.submitDocument.mockResolvedValue({});

    const onRefresh = jest.fn();
    render(<DocumentsList onRefresh={onRefresh} />);

    await waitFor(() => expect(documentService.getDocuments).toHaveBeenCalled());
    expect(await screen.findByRole('heading', { name: 'Search & Filter Documents' })).toBeInTheDocument();
    expect(screen.getByText('Doc')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Search documents/), { target: { value: 'q' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    const doc2Title = await screen.findByText('Doc2');
    let doc2Card: HTMLElement | null = doc2Title as HTMLElement;
    while (doc2Card) {
      const hasSubmit = !!within(doc2Card).queryByRole('button', { name: /Submit to Provider/i });
      if (hasSubmit) break;
      doc2Card = doc2Card.parentElement;
    }
    if (!doc2Card) throw new Error('Could not find Doc2 card container');

    const submitButtons = within(doc2Card).getAllByRole('button', { name: /Submit to Provider/i });
    fireEvent.click(submitButtons[submitButtons.length - 1]);
    await waitFor(() => expect(documentService.submitDocument).toHaveBeenCalledWith('d2'));
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows toast on load failure', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'client' }, isClient: false });
    documentService.getDocuments.mockRejectedValue(new Error('x'));
    render(<DocumentsList />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load documents'));
  });
});

