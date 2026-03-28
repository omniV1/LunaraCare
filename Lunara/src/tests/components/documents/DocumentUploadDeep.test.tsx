/**
 * Deep tests for DocumentUpload – covers file selection, size/type validation,
 * auto-fill title from filename, tag management, required field validation,
 * internal upload flow, onUpload callback delegation, cancel button,
 * upload error handling with server details, upload button disabled state,
 * and file removal.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children, className }: any) => <div data-testid="card" className={className}>{children}</div>,
}));

jest.mock('../../../services/documentService', () => ({
  documentService: {
    uploadFile: jest.fn(),
    createDocument: jest.fn(),
  },
}));

import { documentService } from '../../../services/documentService';
import { DocumentUpload } from '../../../components/documents/DocumentUpload';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeFile(name: string, type = 'application/pdf', size = 1000) {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function selectFile(container: HTMLElement, file: File) {
  const input = getFileInput(container);
  fireEvent.change(input, { target: { files: [file] } });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DocumentUpload – deep tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---- File selection ----

  describe('file selection', () => {
    it('shows selected file name after selection', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('report.pdf'));

      expect(screen.getByText('report.pdf')).toBeInTheDocument();
    });

    it('auto-fills title from filename (without extension)', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('birth-plan-final.pdf'));

      expect((screen.getByLabelText('Title *') as HTMLInputElement).value).toBe('birth-plan-final');
    });

    it('does not overwrite manually entered title', () => {
      const { container } = render(<DocumentUpload />);

      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'My Custom Title' } });
      selectFile(container, makeFile('other.pdf'));

      expect((screen.getByLabelText('Title *') as HTMLInputElement).value).toBe('My Custom Title');
    });
  });

  // ---- File validation ----

  describe('file validation', () => {
    it('rejects files exceeding maxSize', () => {
      const { container } = render(<DocumentUpload maxSize={5} />);
      selectFile(container, makeFile('big.pdf', 'application/pdf', 6 * 1024 * 1024));

      expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
    });

    it('rejects files with unsupported type', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('script.exe', 'application/x-msdownload', 100));

      expect(screen.getByText(/File type not supported/)).toBeInTheDocument();
    });

    it('accepts PDF files', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('test.pdf', 'application/pdf', 500));

      expect(screen.queryByText(/File type not supported/)).not.toBeInTheDocument();
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    it('accepts image files (jpg, png)', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('photo.jpg', 'image/jpeg', 500));

      expect(screen.queryByText(/File type not supported/)).not.toBeInTheDocument();
      expect(screen.getByText('photo.jpg')).toBeInTheDocument();
    });

    it('accepts custom acceptedTypes', () => {
      const { container } = render(<DocumentUpload acceptedTypes={['.csv', '.xlsx']} />);
      selectFile(container, makeFile('data.csv', 'text/csv', 100));

      expect(screen.queryByText(/File type not supported/)).not.toBeInTheDocument();
    });

    it('uses default maxSize of 10MB', () => {
      const { container } = render(<DocumentUpload />);
      // 9MB should be fine
      selectFile(container, makeFile('ok.pdf', 'application/pdf', 9 * 1024 * 1024));
      expect(screen.queryByText(/File size must be less than/)).not.toBeInTheDocument();

      // 11MB should fail
      selectFile(container, makeFile('toobig.pdf', 'application/pdf', 11 * 1024 * 1024));
      expect(screen.getByText('File size must be less than 10MB')).toBeInTheDocument();
    });
  });

  // ---- Required field validation on submit ----

  describe('required field validation', () => {
    it('shows error when no file is selected', () => {
      const { container } = render(<DocumentUpload />);
      fireEvent.submit(container.querySelector('form')!);

      expect(screen.getByText('Please select a file to upload')).toBeInTheDocument();
    });

    it('shows error when title is empty', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('a.pdf'));
      // Clear auto-filled title
      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Other' } });
      fireEvent.submit(container.querySelector('form')!);

      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    it('shows error when category is empty', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('a.pdf'));
      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Doc' } });
      fireEvent.submit(container.querySelector('form')!);

      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });
  });

  // ---- Tag management ----

  describe('tag management', () => {
    it('adds a tag via Add button', () => {
      render(<DocumentUpload />);
      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      fireEvent.change(tagInput, { target: { value: 'urgent' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));

      expect(screen.getByText('urgent')).toBeInTheDocument();
      expect((tagInput as HTMLInputElement).value).toBe('');
    });

    it('adds a tag via Enter key', () => {
      render(<DocumentUpload />);
      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      fireEvent.change(tagInput, { target: { value: 'lab-results' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      expect(screen.getByText('lab-results')).toBeInTheDocument();
    });

    it('does not add duplicate tags', () => {
      render(<DocumentUpload />);
      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      fireEvent.change(tagInput, { target: { value: 'blood' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.change(tagInput, { target: { value: 'blood' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));

      expect(screen.getAllByText('blood')).toHaveLength(1);
    });

    it('removes a tag via × button', () => {
      render(<DocumentUpload />);
      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      fireEvent.change(tagInput, { target: { value: 'remove-me' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      expect(screen.getByText('remove-me')).toBeInTheDocument();

      fireEvent.click(screen.getByText('×'));
      expect(screen.queryByText('remove-me')).not.toBeInTheDocument();
    });
  });

  // ---- Internal upload flow ----

  describe('internal upload flow (no onUpload prop)', () => {
    it('uploads file and creates document successfully', async () => {
      (documentService.uploadFile as jest.Mock).mockResolvedValue({
        cloudinaryUrl: 'https://cdn.example.com/doc.pdf',
        originalFileName: 'report.pdf',
        fileSize: 1000,
      });
      (documentService.createDocument as jest.Mock).mockResolvedValue({});
      const onDocumentCreated = jest.fn();

      const { container } = render(<DocumentUpload onDocumentCreated={onDocumentCreated} />);
      selectFile(container, makeFile('report.pdf'));
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Medical Records' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(documentService.uploadFile).toHaveBeenCalled());
      await waitFor(() => expect(documentService.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'report',
          documentType: 'health-assessment',
          privacyLevel: 'client-and-provider',
        }),
      ));
      expect(toast.success).toHaveBeenCalledWith('Document uploaded successfully!');
      expect(onDocumentCreated).toHaveBeenCalledTimes(1);
    });

    it('maps category "Birth Plan" to documentType "other"', async () => {
      (documentService.uploadFile as jest.Mock).mockResolvedValue({
        cloudinaryUrl: 'u',
        originalFileName: 'plan.pdf',
        fileSize: 100,
      });
      (documentService.createDocument as jest.Mock).mockResolvedValue({});

      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('plan.pdf'));
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Birth Plan' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(documentService.createDocument).toHaveBeenCalledWith(
        expect.objectContaining({ documentType: 'other' }),
      ));
    });

    it('resets form after successful upload', async () => {
      (documentService.uploadFile as jest.Mock).mockResolvedValue({
        cloudinaryUrl: 'u',
        originalFileName: 'a.pdf',
        fileSize: 1,
      });
      (documentService.createDocument as jest.Mock).mockResolvedValue({});

      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('a.pdf'));
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Other' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      expect((screen.getByLabelText('Title *') as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText('Category *') as HTMLSelectElement).value).toBe('');
    });

    it('shows detailed error message on upload failure', async () => {
      (documentService.uploadFile as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: 'Upload rejected',
            error: 'File corrupt',
          },
        },
      });

      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('bad.pdf'));
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Other' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(screen.getByText(/Upload rejected.*File corrupt/)).toBeInTheDocument());
      expect(toast.error).toHaveBeenCalled();
    });
  });

  // ---- onUpload prop delegation ----

  describe('onUpload prop delegation', () => {
    it('calls onUpload with file and metadata instead of internal upload', async () => {
      const onUpload = jest.fn();
      const { container } = render(<DocumentUpload onUpload={onUpload} />);
      selectFile(container, makeFile('external.pdf'));
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Other' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(onUpload).toHaveBeenCalledWith(
        expect.any(File),
        expect.objectContaining({ title: 'external', category: 'Other' }),
      ));
      // Should NOT call internal service
      expect(documentService.uploadFile).not.toHaveBeenCalled();
    });
  });

  // ---- Cancel button ----

  describe('cancel button', () => {
    it('renders cancel button when onCancel is provided', () => {
      const onCancel = jest.fn();
      render(<DocumentUpload onCancel={onCancel} />);
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    });

    it('does not render cancel button when no onCancel', () => {
      render(<DocumentUpload />);
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
    });

    it('calls onCancel when cancel is clicked', () => {
      const onCancel = jest.fn();
      render(<DocumentUpload onCancel={onCancel} />);
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Upload button state ----

  describe('upload button state', () => {
    it('is disabled when no file is selected', () => {
      render(<DocumentUpload />);
      const btn = screen.getByRole('button', { name: 'Upload Document' });
      expect(btn).toBeDisabled();
    });

    it('is disabled when title is empty (even with file)', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('a.pdf'));
      // Clear auto-filled title
      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Other' } });

      const btn = screen.getByRole('button', { name: 'Upload Document' });
      expect(btn).toBeDisabled();
    });

    it('is disabled when category is empty', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('a.pdf'));

      const btn = screen.getByRole('button', { name: 'Upload Document' });
      expect(btn).toBeDisabled();
    });

    it('is enabled when file, title, and category are all set', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('a.pdf'));
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Other' } });

      const btn = screen.getByRole('button', { name: 'Upload Document' });
      expect(btn).not.toBeDisabled();
    });

    it('shows "Uploading..." during upload', async () => {
      let resolveUpload!: (v: any) => void;
      (documentService.uploadFile as jest.Mock).mockReturnValue(new Promise(r => { resolveUpload = r; }));

      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('a.pdf'));
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Other' } });
      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => expect(screen.getByText('Uploading...')).toBeInTheDocument());

      // Cleanup
      resolveUpload({ cloudinaryUrl: 'u', originalFileName: 'a.pdf', fileSize: 1 });
    });
  });

  // ---- File removal ----

  describe('file removal', () => {
    it('removes selected file via the remove button', () => {
      const { container } = render(<DocumentUpload />);
      selectFile(container, makeFile('removable.pdf'));
      expect(screen.getByText('removable.pdf')).toBeInTheDocument();

      const removeBtn = screen.getByRole('button', { name: 'Remove selected file' });
      fireEvent.click(removeBtn);

      expect(screen.queryByText('removable.pdf')).not.toBeInTheDocument();
    });
  });

  // ---- Category options ----

  describe('category options', () => {
    it('renders all expected categories', () => {
      render(<DocumentUpload />);
      const select = screen.getByLabelText('Category *') as HTMLSelectElement;
      const options = Array.from(select.options).map(o => o.value);

      expect(options).toContain('Medical Records');
      expect(options).toContain('Appointment Notes');
      expect(options).toContain('Lab Results');
      expect(options).toContain('Ultrasound Images');
      expect(options).toContain('Birth Plan');
      expect(options).toContain('Insurance Documents');
      expect(options).toContain('Other');
    });
  });
});
