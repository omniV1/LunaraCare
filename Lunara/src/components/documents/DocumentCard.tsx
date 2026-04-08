/**
 * @module components/documents/DocumentCard
 * Renders a single client document as a card with status badge, file list,
 * provider feedback, and action buttons (edit, view, submit, delete).
 */
import React from 'react';
import { documentService, ClientDocument } from '../../services/documentService';

/** Props for an individual document card in the documents list. */
export interface DocumentCardProps {
  document: ClientDocument;
  submitting: string | null;
  onEdit: (document: ClientDocument) => void;
  onView?: (document: ClientDocument) => void;
  onSubmitToProvider: (documentId: string) => void;
  onDelete: (documentId: string) => void;
}

/** Returns a Tailwind class string for the submission-status badge color. */
function getStatusBadgeClass(status: ClientDocument['submissionStatus']): string {
  switch (status) {
    case 'submitted-to-provider':
      return 'bg-yellow-100 text-yellow-800';
    case 'reviewed-by-provider':
      return 'bg-green-100 text-green-800';
    case 'completed':
      return 'bg-[#DED7CD]/50 text-[#4E1B00]';
    default:
      return 'bg-[#FAF7F2] text-[#4E1B00]';
  }
}

/** Renders a document card with metadata, attached files, and action buttons. */
export const DocumentCard: React.FC<DocumentCardProps> = ({
  document: doc,
  submitting,
  onEdit,
  onView,
  onSubmitToProvider,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#4E1B00]">{doc.title}</h3>
              <p className="text-sm text-[#6B4D37]/70 mt-1">
                {documentService.getDocumentTypeLabel(doc.documentType)}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(doc.submissionStatus)}`}
            >
              {documentService.getStatusLabel(doc.submissionStatus)}
            </span>
          </div>

          {/* Files */}
          {doc.files && doc.files.length > 0 && (
            <div className="mt-4 space-y-2">
              {doc.files.map(file => (
                <div
                  key={`${file.cloudinaryUrl}-${file.originalFileName}`}
                  className="flex items-center text-sm text-[#6B4D37]"
                >
                  <svg
                    className="w-5 h-5 mr-2 text-[#BCADA5]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>{file.originalFileName}</span>
                  <span className="ml-2 text-[#BCADA5]">
                    ({documentService.formatFileSize(file.fileSize)})
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {doc.notes && <p className="mt-3 text-sm text-[#6B4D37]">{doc.notes}</p>}

          {/* Submission details */}
          {doc.submissionData?.submittedDate && (
            <div className="mt-3 text-sm text-[#6B4D37]/70">
              <span>
                Submitted: {documentService.formatDate(doc.submissionData.submittedDate)}
              </span>
              {doc.submissionData.reviewedDate && (
                <span className="ml-4">
                  Reviewed: {documentService.formatDate(doc.submissionData.reviewedDate)}
                </span>
              )}
            </div>
          )}

          {/* Provider feedback */}
          {doc.submissionData?.providerFeedback && (
            <div className="mt-3 p-3 bg-[#FAF7F2] rounded-lg">
              <p className="text-sm font-medium text-[#4E1B00]">Provider Feedback:</p>
              <p className="text-sm text-[#4E1B00] mt-1">
                {doc.submissionData.providerFeedback}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="ml-4 flex flex-col space-y-2">
          {doc.submissionStatus === 'draft' && (
            <button
              onClick={() => onEdit(doc)}
              className="px-4 py-2 text-sm font-medium text-[#4E1B00] bg-[#FAF7F2] rounded-lg hover:bg-[#DED7CD]/40 transition-colors"
            >
              Edit
            </button>
          )}
          {doc.files && doc.files.length > 0 && (
            <button
              onClick={() => onView?.(doc)}
              className="px-4 py-2 text-sm font-medium text-[#4E1B00]/80 bg-[#FAF7F2] rounded-lg hover:bg-[#FAF7F2] transition-colors"
            >
              View
            </button>
          )}

          {doc.submissionStatus === 'draft' && (
            <button
              onClick={() => onSubmitToProvider(doc.id)}
              disabled={submitting === doc.id}
              className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              {submitting === doc.id ? 'Submitting...' : 'Submit to Provider'}
            </button>
          )}

          <button
            onClick={() => onDelete(doc.id)}
            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
