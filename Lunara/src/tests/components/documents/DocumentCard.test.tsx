import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { DocumentCard } from '../../../components/documents/DocumentCard';

jest.mock('../../../services/documentService', () => ({
  documentService: {
    getDocumentTypeLabel: jest.fn(() => 'TypeLabel'),
    getStatusLabel: jest.fn((s: any) => String(s)),
    formatFileSize: jest.fn(() => '1 KB'),
    formatDate: jest.fn(() => 'Jan 1'),
  },
}));

function makeDoc(overrides: any = {}) {
  return {
    id: 'd1',
    title: 'Doc',
    documentType: 'other',
    submissionStatus: 'draft',
    files: [
      {
        cloudinaryUrl: 'u',
        originalFileName: 'a.pdf',
        fileSize: 123,
      },
    ],
    notes: 'n',
    submissionData: { submittedDate: '2026-01-01', reviewedDate: '2026-01-02', providerFeedback: 'fb' },
    ...overrides,
  };
}

describe('DocumentCard', () => {
  it('renders document details and triggers actions', () => {
    const onEdit = jest.fn();
    const onView = jest.fn();
    const onSubmitToProvider = jest.fn();
    const onDelete = jest.fn();

    render(
      <DocumentCard
        document={makeDoc()}
        submitting={null}
        onEdit={onEdit}
        onView={onView}
        onSubmitToProvider={onSubmitToProvider}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Doc')).toBeInTheDocument();
    expect(screen.getByText('TypeLabel')).toBeInTheDocument();
    expect(screen.getByText('a.pdf')).toBeInTheDocument();
    expect(screen.getByText('Provider Feedback:')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalled();
    fireEvent.click(screen.getByText('View'));
    expect(onView).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Submit to Provider'));
    expect(onSubmitToProvider).toHaveBeenCalledWith('d1');
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('d1');
  });
});

