/**
 * @module components/documents/DocumentSearchFilter
 * Reusable search bar and filter controls (type, status, date range)
 * for filtering document lists on both client and provider views.
 */
import React from 'react';
import { DocumentFilters } from '../../services/documentService';

/** Props for the document search and filter toolbar. */
export interface DocumentSearchFilterProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
  filters: DocumentFilters;
  onFilterChange: <K extends keyof DocumentFilters>(key: K, value: DocumentFilters[K]) => void;
  onClearFilters: () => void;
}

/** Renders search input and filter dropdowns for document type, status, and date. */
export const DocumentSearchFilter: React.FC<DocumentSearchFilterProps> = ({
  searchQuery,
  onSearchQueryChange,
  onSearch,
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6 min-w-0">
      <div className="space-y-4">
        <h3 className="text-base sm:text-lg font-semibold text-[#4E1B00]">Search & Filter Documents</h3>

        {/* Search Input */}
        <form onSubmit={onSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-4 min-w-0">
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchQueryChange(e.target.value)}
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
                onFilterChange(
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
                onFilterChange(
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
              onChange={e => onFilterChange('startDate', e.target.value)}
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
              onChange={e => onFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-[#CAC3BC] rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClearFilters}
            className="px-4 py-2 border border-[#CAC3BC] text-[#4E1B00]/80 rounded-md hover:bg-[#FAF7F2] transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};
