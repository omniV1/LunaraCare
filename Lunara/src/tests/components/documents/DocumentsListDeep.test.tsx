/**
 * Deep tests for DocumentsList – covers loading state, empty state,
 * document rendering with status badges, search, filters, clear filters,
 * submit-to-provider with confirmation, delete with confirmation,
 * delete-cancelled flow, edit button (draft only), view button (files present),
 * provider feedback display, recommendations panel for clients,
 * and error handling.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

// ── Mocks ────────────────────────────────────────────────────────────────────

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
    formatFileSize: jest.fn((s: number) => `${s}B`),
    formatDate: jest.fn((d: string) => d),
  },
}));

const mockRecSvc = {
  getDocumentRecommendations: jest.fn().mockResolvedValue({ postpartumWeek: 1, suggestions: [] }),
};
jest.mock('../../../services/recommendationService', () => ({
  RecommendationService: { getInstance: () => mockRecSvc },
}));

jest.mock('../../../components/documents/ClientDocumentEdit', () => ({
  ClientDocumentEdit: (props: { document: { title: string }; onClose: () => void; onSaved: () => void }) => (
    <div data-testid="edit-modal">
      <span>{props.document.title}</span>
      <button onClick={props.onClose}>Close Edit</button>
      <button onClick={props.onSaved}>Save Edit</button>
    </div>
  ),
}));
jest.mock('../../../components/documents/DocumentRecommendations', () => ({
  DocumentRecommendationsPanel: () => <div data-testid="recs-panel">Recommendations</div>,
}));

import { documentService } from '../../../services/documentService';
import { DocumentsList } from '../../../components/documents/DocumentsList';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDoc(overrides: Record<string, any> = {}) {
  return {
    id: 'd1',
    title: 'Test Doc',
    documentType: 'health-assessment',
    submissionStatus: 'draft',
    files: [{ cloudinaryUrl: 'url', originalFileName: 'file.pdf', fileSize: 1024 }],
    notes: 'Some notes',
    createdAt: '2026-03-18T00:00:00.000Z',
    updatedAt: '2026-03-18T00:00:00.000Z',
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DocumentsList – deep tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { role: 'client' }, isClient: true });
    (globalThis as unknown as Record<string, unknown>).confirm = jest.fn(() => true);
  });

  // ---- Loading state ----

  describe('loading state', () => {
    it('shows spinner while loading', () => {
      (documentService.getDocuments as jest.Mock).mockReturnValue(new Promise(() => {}));
      const { container } = render(<DocumentsList />);
      expect(container.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  // ---- Empty state ----

  describe('empty state', () => {
    it('shows "No documents found" with upload prompt when no docs exist', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([]);
      render(<DocumentsList />);
      expect(await screen.findByText('No documents found')).toBeInTheDocument();
      expect(screen.getByText(/Upload your first document to get started/)).toBeInTheDocument();
    });

    it('shows filter-adjustment hint when empty with active filters', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([]);
      render(<DocumentsList />);
      await screen.findByText('No documents found');

      // Apply a filter
      fireEvent.change(screen.getByLabelText('Document Type'), { target: { value: 'other' } });

      // Re-fetches automatically, mock returns empty again
      (documentService.getDocuments as jest.Mock).mockResolvedValue([]);
      await waitFor(() =>
        expect(screen.getByText(/Try adjusting your search or filters/)).toBeInTheDocument(),
      );
    });
  });

  // ---- Document rendering ----

  describe('document rendering', () => {
    it('displays document title and type label', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      render(<DocumentsList />);
      expect(await screen.findByText('Test Doc')).toBeInTheDocument();
      expect(screen.getByText('health-assessment')).toBeInTheDocument();
    });

    it('displays status badge via getStatusLabel', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc({ submissionStatus: 'submitted-to-provider' })]);
      render(<DocumentsList />);
      expect(await screen.findByText('submitted-to-provider')).toBeInTheDocument();
    });

    it('displays file names and sizes', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      render(<DocumentsList />);
      expect(await screen.findByText('file.pdf')).toBeInTheDocument();
      expect(screen.getByText('(1024B)')).toBeInTheDocument();
    });

    it('displays notes when present', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc({ notes: 'Important note' })]);
      render(<DocumentsList />);
      expect(await screen.findByText('Important note')).toBeInTheDocument();
    });

    it('displays provider feedback when present', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([
        makeDoc({
          submissionStatus: 'reviewed-by-provider',
          submissionData: {
            submittedDate: '2026-03-18',
            reviewedDate: '2026-03-19',
            providerFeedback: 'Looks good!',
          },
        }),
      ]);
      render(<DocumentsList />);
      expect(await screen.findByText('Provider Feedback:')).toBeInTheDocument();
      expect(screen.getByText('Looks good!')).toBeInTheDocument();
    });

    it('shows submission and review dates', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([
        makeDoc({
          submissionData: {
            submittedDate: '2026-03-18',
            reviewedDate: '2026-03-19',
          },
        }),
      ]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');
      expect(screen.getByText(/Submitted:/)).toBeInTheDocument();
      expect(screen.getByText(/Reviewed:/)).toBeInTheDocument();
    });
  });

  // ---- Action buttons visibility ----

  describe('action buttons', () => {
    it('shows Edit and Submit buttons for draft documents', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc({ submissionStatus: 'draft' })]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Submit to Provider' })).toBeInTheDocument();
    });

    it('does not show Edit or Submit for submitted documents', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([
        makeDoc({ submissionStatus: 'submitted-to-provider' }),
      ]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Submit to Provider' })).not.toBeInTheDocument();
    });

    it('shows View button when files exist', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');
      expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
    });

    it('does not show View button when no files', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc({ files: [] })]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');
      expect(screen.queryByRole('button', { name: 'View' })).not.toBeInTheDocument();
    });

    it('always shows Delete button', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([
        makeDoc({ submissionStatus: 'completed' }),
      ]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  // ---- Submit to provider ----

  describe('submit to provider', () => {
    it('submits document and refreshes list', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc({ id: 'd1' })]);
      (documentService.submitDocument as jest.Mock).mockResolvedValue({});
      const onRefresh = jest.fn();
      render(<DocumentsList onRefresh={onRefresh} />);
      await screen.findByText('Test Doc');

      fireEvent.click(screen.getByRole('button', { name: 'Submit to Provider' }));
      expect(globalThis.confirm).toHaveBeenCalledWith('Submit this document to your provider for review?');

      await waitFor(() => expect(documentService.submitDocument).toHaveBeenCalledWith('d1'));
      expect(toast.success).toHaveBeenCalledWith('Document submitted successfully!');
      expect(onRefresh).toHaveBeenCalled();
    });

    it('does not submit when user declines confirmation', async () => {
      (globalThis as unknown as Record<string, unknown>).confirm = jest.fn(() => false);
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc({ id: 'd1' })]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');

      fireEvent.click(screen.getByRole('button', { name: 'Submit to Provider' }));
      expect(documentService.submitDocument).not.toHaveBeenCalled();
    });

    it('shows error toast on submit failure', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      (documentService.submitDocument as jest.Mock).mockRejectedValue(new Error('fail'));
      render(<DocumentsList />);
      await screen.findByText('Test Doc');

      fireEvent.click(screen.getByRole('button', { name: 'Submit to Provider' }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to submit document'));
    });
  });

  // ---- Delete ----

  describe('delete document', () => {
    it('deletes document with confirmation and refreshes list', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      (documentService.deleteDocument as jest.Mock).mockResolvedValue({});
      render(<DocumentsList />);
      await screen.findByText('Test Doc');

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      expect(globalThis.confirm).toHaveBeenCalledWith('Are you sure you want to delete this document?');

      await waitFor(() => expect(documentService.deleteDocument).toHaveBeenCalledWith('d1'));
      expect(toast.success).toHaveBeenCalledWith('Document deleted successfully');
    });

    it('does not delete when user declines confirmation', async () => {
      (globalThis as unknown as Record<string, unknown>).confirm = jest.fn(() => false);
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      expect(documentService.deleteDocument).not.toHaveBeenCalled();
    });

    it('shows error toast on delete failure', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      (documentService.deleteDocument as jest.Mock).mockRejectedValue(new Error('fail'));
      render(<DocumentsList />);
      await screen.findByText('Test Doc');

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to delete document'));
    });
  });

  // ---- Search ----

  describe('search', () => {
    it('searches documents and displays results', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      (documentService.searchDocuments as jest.Mock).mockResolvedValue([
        makeDoc({ id: 'd2', title: 'Search Result' }),
      ]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');

      fireEvent.change(screen.getByPlaceholderText(/Search documents/), { target: { value: 'query' } });
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      expect(await screen.findByText('Search Result')).toBeInTheDocument();
      expect(documentService.searchDocuments).toHaveBeenCalledWith('query', expect.any(Object));
    });

    it('reloads all documents when search query is empty', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');

      fireEvent.change(screen.getByPlaceholderText(/Search documents/), { target: { value: '' } });
      fireEvent.click(screen.getByRole('button', { name: 'Search' }));

      // Should call getDocuments again (not searchDocuments)
      await waitFor(() => {
        // Initial load + reload = at least 2 calls
        expect((documentService.getDocuments as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // ---- Filters ----

  describe('filters', () => {
    it('applies document type filter', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([]);
      render(<DocumentsList />);
      await screen.findByText('No documents found');

      fireEvent.change(screen.getByLabelText('Document Type'), { target: { value: 'other' } });

      await waitFor(() => {
        const lastCall = (documentService.getDocuments as jest.Mock).mock.calls.slice(-1)[0];
        expect(lastCall[0]).toMatchObject({ documentType: 'other' });
      });
    });

    it('applies submission status filter', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([]);
      render(<DocumentsList />);
      await screen.findByText('No documents found');

      fireEvent.change(screen.getByLabelText('Submission Status'), { target: { value: 'draft' } });

      await waitFor(() => {
        const lastCall = (documentService.getDocuments as jest.Mock).mock.calls.slice(-1)[0];
        expect(lastCall[0]).toMatchObject({ submissionStatus: 'draft' });
      });
    });

    it('clears all filters', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([]);
      render(<DocumentsList />);
      await screen.findByText('No documents found');

      // Set a filter
      fireEvent.change(screen.getByLabelText('Document Type'), { target: { value: 'other' } });
      await waitFor(() => expect((documentService.getDocuments as jest.Mock).mock.calls.length).toBeGreaterThan(1));

      // Clear
      fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));

      await waitFor(() => {
        const lastCall = (documentService.getDocuments as jest.Mock).mock.calls.slice(-1)[0];
        expect(lastCall[0]).toMatchObject({
          documentType: undefined,
          submissionStatus: undefined,
        });
      });
    });
  });

  // ---- Edit modal ----

  describe('edit modal', () => {
    it('opens edit modal when Edit is clicked for draft doc', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      render(<DocumentsList />);
      await screen.findByText('Test Doc');

      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
    });

    it('closes edit modal and refreshes on save', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue([makeDoc()]);
      const onRefresh = jest.fn();
      render(<DocumentsList onRefresh={onRefresh} />);
      await screen.findByText('Test Doc');

      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
      fireEvent.click(screen.getByText('Save Edit'));

      // After save, edit modal should be gone and docs reloaded
      await waitFor(() => expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument());
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  // ---- Recommendations panel ----

  describe('recommendations panel', () => {
    it('shows recommendations panel for client users', async () => {
      mockUseAuth.mockReturnValue({ user: { role: 'client' }, isClient: true });
      (documentService.getDocuments as jest.Mock).mockResolvedValue([]);
      render(<DocumentsList />);
      await screen.findByText('No documents found');
      expect(screen.getByTestId('recs-panel')).toBeInTheDocument();
    });

    it('does not show recommendations panel for provider users', async () => {
      mockUseAuth.mockReturnValue({ user: { role: 'provider' }, isClient: false });
      (documentService.getDocuments as jest.Mock).mockResolvedValue([]);
      render(<DocumentsList />);
      await screen.findByText('No documents found');
      expect(screen.queryByTestId('recs-panel')).not.toBeInTheDocument();
    });
  });

  // ---- Error handling ----

  describe('error handling', () => {
    it('shows toast on document load failure', async () => {
      (documentService.getDocuments as jest.Mock).mockRejectedValue(new Error('fail'));
      render(<DocumentsList />);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load documents'));
    });
  });

  // ---- View callback ----

  describe('view callback', () => {
    it('calls onView with the document when View is clicked', async () => {
      const doc = makeDoc();
      (documentService.getDocuments as jest.Mock).mockResolvedValue([doc]);
      const onView = jest.fn();
      render(<DocumentsList onView={onView} />);
      await screen.findByText('Test Doc');

      fireEvent.click(screen.getByRole('button', { name: 'View' }));
      expect(onView).toHaveBeenCalledWith(doc);
    });
  });

  // ---- Paginated response handling ----

  describe('paginated response handling', () => {
    it('handles paginated response shape (object with documents array)', async () => {
      (documentService.getDocuments as jest.Mock).mockResolvedValue({
        documents: [makeDoc({ title: 'Paginated Doc' })],
        total: 1,
      });
      render(<DocumentsList />);
      expect(await screen.findByText('Paginated Doc')).toBeInTheDocument();
    });
  });
});
