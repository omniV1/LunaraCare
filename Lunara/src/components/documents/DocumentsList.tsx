import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { documentService, ClientDocument, DocumentFilters } from '../../services/documentService';
import {
  RecommendationService,
  DocumentRecommendations,
} from '../../services/recommendationService';
import { useAuth } from '../../contexts/useAuth';
import { ClientDocumentEdit } from './ClientDocumentEdit';
import { DocumentRecommendationsPanel } from './DocumentRecommendations';

interface DocumentsListProps {
  onView?: (document: ClientDocument, filePath?: string) => void;
  onRefresh?: () => void;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ onView, onRefresh }) => {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>({
    documentType: undefined,
    submissionStatus: undefined,
    startDate: undefined,
    endDate: undefined,
  });
  const [documentRecommendations, setDocumentRecommendations] =
    useState<DocumentRecommendations | null>(null);
  const [editingDocument, setEditingDocument] = useState<ClientDocument | null>(null);
  const { user, isClient } = useAuth();

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await documentService.getDocuments(filters);
      // Handle both array and paginated response
      if (Array.isArray(result)) {
        setDocuments(result);
      } else {
        setDocuments(result.documents);
      }
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadDocuments();
  }, [filters, loadDocuments]);

  useEffect(() => {
    if (isClient && user?.role === 'client') {
      RecommendationService.getInstance()
        .getDocumentRecommendations()
        .then(recs => {
          setDocumentRecommendations(recs);
        })
        .catch(() => {
          // Recommendations are non-critical, silently fail
        });
    }
  }, [isClient, user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const result = await documentService.searchDocuments(searchQuery.trim(), filters);
      if (Array.isArray(result)) {
        setDocuments(result);
      } else {
        setDocuments(result.documents);
      }
    } else {
      loadDocuments();
    }
  };

  const handleFilterChange = <K extends keyof DocumentFilters>(key: K, value: DocumentFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value ?? undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({
      documentType: undefined,
      submissionStatus: undefined,
      startDate: undefined,
      endDate: undefined,
    });
    setSearchQuery('');
    loadDocuments();
  };

  const handleSubmitToProvider = async (documentId: string) => {
    if (!globalThis.confirm('Submit this document to your provider for review?')) {
      return;
    }

    setSubmitting(documentId);
    try {
      await documentService.submitDocument(documentId);
      toast.success('Document submitted successfully!');
      await loadDocuments();
      onRefresh?.();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message ?? 'Failed to submit document');
    } finally {
      setSubmitting(null);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!globalThis.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await documentService.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      await loadDocuments();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B4D37]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden w-full max-w-full">
      {/* Document Recommendations (for clients) */}
      {isClient && documentRecommendations && (
        <DocumentRecommendationsPanel
          recommendations={documentRecommendations}
          isClient={isClient}
          userRole={user?.role}
          onDocumentCreated={() => {
            loadDocuments();
            onRefresh?.();
          }}
          onRecommendationsUpdated={setDocumentRecommendations}
        />
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 min-w-0">
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-[#4E1B00]">Search & Filter Documents</h3>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-4 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents by title or notes..."
              className="min-w-0 flex-1 w-full sm:w-auto px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e] transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="doc-type-filter"
                className="block text-sm font-medium text-[#4E1B00]/80 mb-2"
              >
                Document Type
              </label>
              <select
                id="doc-type-filter"
                value={filters.documentType ?? ''}
                onChange={e =>
                  handleFilterChange(
                    'documentType',
                    (e.target.value || undefined) as DocumentFilters['documentType']
                  )
                }
                className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              >
                <option value="">All Types</option>
                <option value="emotional-survey">Emotional Wellness Survey</option>
                <option value="health-assessment">Health Assessment</option>
                <option value="personal-assessment">Personal Assessment</option>
                <option value="feeding-log">Feeding & Pumping Log</option>
                <option value="sleep-log">Sleep & Rest Log</option>
                <option value="mood-check-in">Mood & Emotional Check-In</option>
                <option value="recovery-notes">Recovery Milestones & Notes</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="doc-status-filter"
                className="block text-sm font-medium text-[#4E1B00]/80 mb-2"
              >
                Submission Status
              </label>
              <select
                id="doc-status-filter"
                value={filters.submissionStatus ?? ''}
                onChange={e =>
                  handleFilterChange(
                    'submissionStatus',
                    (e.target.value || undefined) as DocumentFilters['submissionStatus']
                  )
                }
                className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted-to-provider">Submitted</option>
                <option value="reviewed-by-provider">Reviewed</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="doc-start-date-filter"
                className="block text-sm font-medium text-[#4E1B00]/80 mb-2"
              >
                Start Date
              </label>
              <input
                id="doc-start-date-filter"
                type="date"
                value={filters.startDate ?? ''}
                onChange={e => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              />
            </div>

            <div>
              <label
                htmlFor="doc-end-date-filter"
                className="block text-sm font-medium text-[#4E1B00]/80 mb-2"
              >
                End Date
              </label>
              <input
                id="doc-end-date-filter"
                type="date"
                value={filters.endDate ?? ''}
                onChange={e => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 border border-[#CAC3BC] text-[#4E1B00]/80 rounded-md hover:bg-[#FAF7F2] transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 && !loading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-[#BCADA5]"
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
          <h3 className="mt-4 text-lg font-medium text-[#4E1B00]">No documents found</h3>
          <p className="mt-2 text-sm text-[#6B4D37]/70">
            {searchQuery || filters.documentType || filters.submissionStatus
              ? 'Try adjusting your search or filters.'
              : 'Upload your first document to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
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
                      className={`px-3 py-1 rounded-full text-xs font-medium ${(() => {
                        switch (doc.submissionStatus) {
                          case 'submitted-to-provider':
                            return 'bg-yellow-100 text-yellow-800';
                          case 'reviewed-by-provider':
                            return 'bg-green-100 text-green-800';
                          case 'completed':
                            return 'bg-[#DED7CD]/50 text-[#4E1B00]';
                          default:
                            return 'bg-[#FAF7F2] text-[#4E1B00]';
                        }
                      })()}`}
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
                      onClick={() => setEditingDocument(doc)}
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
                      onClick={() => handleSubmitToProvider(doc.id)}
                      disabled={submitting === doc.id}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                    >
                      {submitting === doc.id ? 'Submitting...' : 'Submit to Provider'}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingDocument && (
        <ClientDocumentEdit
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSaved={() => {
            loadDocuments();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};
