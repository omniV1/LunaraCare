import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProviderDocumentsList } from '../../components/documents/ProviderDocumentsList';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockGetDocuments = jest.fn();
const mockSearchDocuments = jest.fn();

jest.mock('../../services/documentService', () => ({
  documentService: {
    getDocuments: (...args: unknown[]) => mockGetDocuments(...args),
    searchDocuments: (...args: unknown[]) => mockSearchDocuments(...args),
    getStatusLabel: (s: string) => s === 'submitted-to-provider' ? 'Submitted' : s,
    getDocumentTypeLabel: (t: string) => t === 'emotional-survey' ? 'Emotional Wellness Survey' : t,
    formatDate: (d: string) => new Date(d).toLocaleDateString(),
    formatFileSize: (s: number) => `${(s / 1024).toFixed(1)} KB`,
  },
}));

jest.mock('../../components/documents/ProviderDocumentReview', () => ({
  ProviderDocumentReview: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="document-review">
      <button onClick={onClose}>close-review</button>
    </div>
  ),
}));

const { toast } = jest.requireMock('react-toastify');

const docs = [
  {
    id: 'doc1',
    title: 'Emotional Survey - Jane',
    documentType: 'emotional-survey',
    submissionStatus: 'submitted-to-provider',
    notes: 'Please review ASAP',
    files: [{ originalFileName: 'survey.pdf', fileSize: 51200 }],
    submissionData: { submittedDate: '2026-03-15T00:00:00Z' },
  },
  {
    id: 'doc2',
    title: 'Health Assessment - Amy',
    documentType: 'health-assessment',
    submissionStatus: 'submitted-to-provider',
    notes: '',
    files: [],
  },
];

describe('ProviderDocumentsList', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading spinner initially', () => {
    mockGetDocuments.mockReturnValue(new Promise(() => {}));
    render(<ProviderDocumentsList />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders documents after loading', async () => {
    mockGetDocuments.mockResolvedValueOnce({ documents: docs });
    render(<ProviderDocumentsList />);
    await waitFor(() => {
      expect(screen.getByText('Emotional Survey - Jane')).toBeInTheDocument();
    });
    expect(screen.getByText('Health Assessment - Amy')).toBeInTheDocument();
    expect(screen.getByText('2 documents found')).toBeInTheDocument();
  });

  it('shows document notes', async () => {
    mockGetDocuments.mockResolvedValueOnce({ documents: docs });
    render(<ProviderDocumentsList />);
    await waitFor(() => {
      expect(screen.getByText('Please review ASAP')).toBeInTheDocument();
    });
  });

  it('shows file info', async () => {
    mockGetDocuments.mockResolvedValueOnce({ documents: docs });
    render(<ProviderDocumentsList />);
    await waitFor(() => {
      expect(screen.getByText('survey.pdf')).toBeInTheDocument();
    });
  });

  it('shows empty state when no documents', async () => {
    mockGetDocuments.mockResolvedValueOnce({ documents: [] });
    render(<ProviderDocumentsList />);
    await waitFor(() => {
      expect(screen.getByText('No documents pending review')).toBeInTheDocument();
    });
  });

  it('renders search and filter controls', async () => {
    mockGetDocuments.mockResolvedValueOnce({ documents: docs });
    render(<ProviderDocumentsList />);
    await waitFor(() => screen.getByText('Emotional Survey - Jane'));
    expect(screen.getByPlaceholderText('Search documents...')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Document Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Submission Status')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });

  it('opens review when Review Now clicked', async () => {
    mockGetDocuments.mockResolvedValueOnce({ documents: docs });
    render(<ProviderDocumentsList />);
    await waitFor(() => screen.getByText('Emotional Survey - Jane'));
    const reviewBtns = screen.getAllByText('Review Now');
    fireEvent.click(reviewBtns[0]);
    expect(screen.getByTestId('document-review')).toBeInTheDocument();
  });

  it('shows error toast on load failure', async () => {
    mockGetDocuments.mockRejectedValueOnce(new Error('fail'));
    render(<ProviderDocumentsList />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load documents');
    });
  });

  it('shows Review Now button for each document', async () => {
    mockGetDocuments.mockResolvedValueOnce({ documents: docs });
    render(<ProviderDocumentsList />);
    await waitFor(() => screen.getByText('Emotional Survey - Jane'));
    const reviewBtns = screen.getAllByText('Review Now');
    expect(reviewBtns.length).toBe(2);
  });
});
