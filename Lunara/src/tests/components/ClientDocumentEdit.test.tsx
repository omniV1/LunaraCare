import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientDocumentEdit } from '../../components/documents/ClientDocumentEdit';
import type { ClientDocument } from '../../services/documentService';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockUpdateDocument = jest.fn();
const mockUploadFile = jest.fn();

jest.mock('../../services/documentService', () => ({
  documentService: {
    updateDocument: (...args: unknown[]) => mockUpdateDocument(...args),
    uploadFile: (...args: unknown[]) => mockUploadFile(...args),
    getDocumentTypeLabel: (type: string) => type,
    formatFileSize: (size: number) => `${Math.round(size / 1024)}KB`,
  },
}));

jest.mock('../../components/documents/DocumentUploadField', () => ({
  DocumentUploadField: ({ onFileSelected }: { onFileSelected: (f: File | null) => void }) => (
    <input
      data-testid="file-input"
      type="file"
      onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
    />
  ),
}));

const { toast } = jest.requireMock('react-toastify');

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDocument(overrides: Partial<ClientDocument> = {}): ClientDocument {
  return {
    id: 'doc-1',
    title: 'Test Document',
    documentType: 'feeding-log',
    submissionStatus: 'draft',
    notes: 'Some notes',
    files: [
      {
        cloudinaryUrl: 'https://example.com/file.pdf',
        originalFileName: 'file.pdf',
        fileSize: 102400,
        mimeType: 'application/pdf',
      },
    ],
    createdAt: '2026-03-01',
    updatedAt: '2026-03-01',
    ...overrides,
  } as ClientDocument;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClientDocumentEdit', () => {
  const onClose = jest.fn();
  const onSaved = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal with title and notes populated', () => {
    render(<ClientDocumentEdit document={makeDocument()} onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByText('Edit document')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Document')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Some notes')).toBeInTheDocument();
  });

  it('shows existing files', () => {
    render(<ClientDocumentEdit document={makeDocument()} onClose={onClose} onSaved={onSaved} />);
    expect(screen.getByText('file.pdf')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<ClientDocumentEdit document={makeDocument()} onClose={onClose} onSaved={onSaved} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('validates title is required', async () => {
    render(<ClientDocumentEdit document={makeDocument()} onClose={onClose} onSaved={onSaved} />);

    const titleInput = screen.getByDisplayValue('Test Document');
    fireEvent.change(titleInput, { target: { value: '' } });
    fireEvent.click(screen.getByText('Save changes'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Title is required');
    });
    expect(mockUpdateDocument).not.toHaveBeenCalled();
  });

  it('saves document successfully', async () => {
    mockUpdateDocument.mockResolvedValueOnce({});
    render(<ClientDocumentEdit document={makeDocument()} onClose={onClose} onSaved={onSaved} />);

    fireEvent.click(screen.getByText('Save changes'));

    await waitFor(() => {
      expect(mockUpdateDocument).toHaveBeenCalledWith('doc-1', expect.objectContaining({
        title: 'Test Document',
        notes: 'Some notes',
      }));
    });
    expect(toast.success).toHaveBeenCalledWith('Document updated');
    expect(onSaved).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error toast on save failure', async () => {
    mockUpdateDocument.mockRejectedValueOnce(new Error('Server error'));
    render(<ClientDocumentEdit document={makeDocument()} onClose={onClose} onSaved={onSaved} />);

    fireEvent.click(screen.getByText('Save changes'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Server error');
    });
  });

  it('removes a file from the list', () => {
    render(<ClientDocumentEdit document={makeDocument()} onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByText('file.pdf')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Remove'));
    expect(screen.queryByText('file.pdf')).not.toBeInTheDocument();
  });

  it('disables editing for non-draft documents', () => {
    const doc = makeDocument({ submissionStatus: 'submitted-to-provider' });
    render(<ClientDocumentEdit document={doc} onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByDisplayValue('Test Document')).toBeDisabled();
    expect(screen.getByDisplayValue('Some notes')).toBeDisabled();
    expect(screen.getByText('Save changes')).toBeDisabled();
  });
});
