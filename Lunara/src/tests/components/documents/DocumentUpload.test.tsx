import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { DocumentUpload } from '../../../components/documents/DocumentUpload';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

jest.mock('../../../services/documentService', () => ({
  documentService: {
    uploadFile: jest.fn(),
    createDocument: jest.fn(),
  },
}));

import { documentService } from '../../../services/documentService';

function makeFile(name: string, type = 'application/pdf', size = 1000) {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('DocumentUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates missing file/title/category and uploads successfully', async () => {
    const onDocumentCreated = jest.fn();
    documentService.uploadFile.mockResolvedValue({ cloudinaryUrl: 'u', originalFileName: 'a.pdf', fileSize: 1 });
    documentService.createDocument.mockResolvedValue({});

    const { container } = render(<DocumentUpload onDocumentCreated={onDocumentCreated} />);
    const form = container.querySelector('form')!;

    // Submit with no file
    fireEvent.submit(form);
    expect(screen.getByText('Please select a file to upload')).toBeInTheDocument();

    // Select file via hidden input
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('a.pdf')] } });

    // Empty category should error
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'T' } });
    fireEvent.submit(form);
    expect(screen.getByText('Category is required')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Other' } });
    fireEvent.submit(form);

    await waitFor(() => expect(documentService.uploadFile).toHaveBeenCalled());
    await waitFor(() => expect(documentService.createDocument).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Document uploaded successfully!');
    expect(onDocumentCreated).toHaveBeenCalledTimes(1);
  });

  it('uses onUpload prop when provided', async () => {
    const onUpload = jest.fn();
    const { container } = render(<DocumentUpload onUpload={onUpload} />);
    const form = container.querySelector('form')!;
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [makeFile('a.pdf')] } });
    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'Other' } });
    fireEvent.submit(form);
    await waitFor(() => expect(onUpload).toHaveBeenCalled());
  });
});

