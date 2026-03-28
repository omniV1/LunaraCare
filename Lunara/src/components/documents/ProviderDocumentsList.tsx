import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { documentService, ClientDocument, DocumentFilters } from '../../services/documentService';
import { ProviderDocumentReview } from './ProviderDocumentReview';

export const ProviderDocumentsList: React.FC = () => {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<ClientDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DocumentFilters>({
    documentType: undefined,
    submissionStatus: 'submitted-to-provider',
    startDate: undefined,
    endDate: undefined,
  });

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const result = await documentService.getDocuments(filters);
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
  }, [loadDocuments]);

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
      submissionStatus: 'submitted-to-provider',
      startDate: undefined,
      endDate: undefined,
    });
    setSearchQuery('');
    loadDocuments();
  };

  const handleReview = () => {
    setSelectedDocument(null);
    loadDocuments(); // Refresh the list
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B4D37]"></div>
      </div>
    );
  }

  if (selectedDocument) {
    return (
      <ProviderDocumentReview
        document={selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onUpdated={handleReview}
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 overflow-x-hidden w-full max-w-full">
      {/* Search and Filters */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-3 sm:p-6 min-w-0">
        <div className="space-y-4">
          <h3 className="text-base sm:text-lg font-semibold text-dash-text-primary">Search & Filter Client Documents</h3>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-4 min-w-0">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents..."
              className="min-w-0 flex-1 w-full sm:w-auto px-3 py-2 border border-dash-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
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
                htmlFor="provider-doc-type-filter"
                className="block text-sm font-medium text-dash-text-secondary mb-2"
              >
                Document Type
              </label>
              <select
                id="provider-doc-type-filter"
                value={filters.documentType ?? ''}
                onChange={e =>
                  handleFilterChange(
                    'documentType',
                    (e.target.value || undefined) as DocumentFilters['documentType']
                  )
                }
                className="w-full px-3 py-2 border border-dash-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              >
                <option value="">All Types</option>
                <option value="emotional-survey">Emotional Wellness Survey</option>
                <option value="health-assessment">Health Assessment</option>
                <option value="feeding-log">Feeding & Pumping Log</option>
                <option value="sleep-log">Sleep & Rest Log</option>
                <option value="mood-check-in">Mood & Emotional Check-In</option>
                <option value="recovery-notes">Recovery Milestones & Notes</option>
                <option value="personal-assessment">Personal Assessment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="provider-doc-status-filter"
                className="block text-sm font-medium text-dash-text-secondary mb-2"
              >
                Submission Status
              </label>
              <select
                id="provider-doc-status-filter"
                value={filters.submissionStatus ?? ''}
                onChange={e =>
                  handleFilterChange(
                    'submissionStatus',
                    (e.target.value || undefined) as DocumentFilters['submissionStatus']
                  )
                }
                className="w-full px-3 py-2 border border-dash-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
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
                htmlFor="provider-doc-start-date-filter"
                className="block text-sm font-medium text-dash-text-secondary mb-2"
              >
                Start Date
              </label>
              <input
                id="provider-doc-start-date-filter"
                type="date"
                value={filters.startDate ?? ''}
                onChange={e => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-dash-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              />
            </div>

            <div>
              <label
                htmlFor="provider-doc-end-date-filter"
                className="block text-sm font-medium text-dash-text-secondary mb-2"
              >
                End Date
              </label>
              <input
                id="provider-doc-end-date-filter"
                type="date"
                value={filters.endDate ?? ''}
                onChange={e => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-dash-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 border border-dash-border text-dash-text-secondary rounded-md hover:bg-[#EDE8E0]/50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Documents List */}
      {documents.length === 0 && !loading ? (
        <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-dash-text-secondary/40"
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
          <h3 className="mt-4 text-lg font-medium text-dash-text-primary">
            {filters.submissionStatus === 'submitted-to-provider'
              ? 'No documents pending review'
              : 'No documents found'}
          </h3>
          <p className="mt-2 text-sm text-dash-text-secondary/60">
            {searchQuery || filters.documentType || filters.submissionStatus
              ? 'Try adjusting your search or filters.'
              : "No submitted documents yet. Documents appear here after clients upload and submit them to you (Submit to Provider). The client must be on your My Clients list."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-dash-text-primary">Client Documents</h3>
              <p className="text-sm text-dash-text-secondary/60 mt-1">
                {documents.length} document{documents.length === 1 ? '' : 's'} found
              </p>
            </div>
          </div>

          {documents.map(doc => (
            <div
              key={doc.id}
              className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-dash-text-primary">{doc.title}</h4>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#3F4E4F]/10 text-[#3F4E4F]">
                      {documentService.getStatusLabel(doc.submissionStatus)}
                    </span>
                  </div>

                  <p className="text-sm text-dash-text-secondary/80 mb-3">
                    Type: {documentService.getDocumentTypeLabel(doc.documentType)}
                  </p>

                  {doc.notes && (
                    <p className="text-sm text-dash-text-secondary mb-3 bg-[#EDE8E0]/30 p-3 rounded-lg">
                      {doc.notes}
                    </p>
                  )}

                  {doc.files && doc.files.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-dash-text-secondary mb-2">Attached Files:</p>
                      <div className="space-y-2">
                        {doc.files.map((file, fileIdx) => {
                          const fileKeySuffix = file.originalFileName || `file-${fileIdx}`;
                          return (
                            <div
                              key={`${doc.id}-${fileKeySuffix}`}
                              className="flex items-center gap-2 text-sm text-dash-text-secondary/80"
                            >
                              <svg
                                className="w-5 h-5 text-dash-text-secondary/40"
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
                                <span className="text-dash-text-secondary/40">
                                ({documentService.formatFileSize(file.fileSize)})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {doc.submissionData?.submittedDate && (
                    <p className="text-sm text-dash-text-secondary/60">
                      Submitted: {documentService.formatDate(doc.submissionData.submittedDate)}
                    </p>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => setSelectedDocument(doc)}
                    className="px-6 py-3 bg-[#6B4D37] text-white rounded-lg hover:bg-[#5a402e] transition-colors font-semibold"
                  >
                    Review Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
