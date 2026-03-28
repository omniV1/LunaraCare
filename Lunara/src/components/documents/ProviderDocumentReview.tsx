import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { ApiClient } from '../../api/apiClient';
import { documentService, ClientDocument } from '../../services/documentService';

interface ProviderDocumentReviewProps {
  document: ClientDocument;
  onClose?: () => void;
  onUpdated?: () => void;
}

export const ProviderDocumentReview: React.FC<ProviderDocumentReviewProps> = ({
  document,
  onClose,
  onUpdated,
}) => {
  const [providerNotes, setProviderNotes] = useState('');
  const [providerFeedback, setProviderFeedback] = useState('');
  const [status, setStatus] = useState<'reviewed-by-provider' | 'completed'>(
    'reviewed-by-provider'
  );
  const [reviewing, setReviewing] = useState(false);
  const [viewingFile, setViewingFile] = useState<string | null>(null);

  const handleViewFile = async (file: { cloudinaryUrl: string; supabasePath?: string; originalFileName?: string }) => {
    const fileId = file.supabasePath || (file.cloudinaryUrl.split('/').filter(Boolean).pop() ?? '');
    if (!fileId) {
      toast.error('Cannot open file');
      return;
    }
    setViewingFile(fileId);
    try {
      const api = ApiClient.getInstance();
      const blob = await api.getBlob(`/files/${fileId}`);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Delay revocation so the new tab has time to load the blob before the URL expires
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      toast.error('Failed to load file. You may need to sign in again.');
    } finally {
      setViewingFile(null);
    }
  };

  const handleReview = async () => {
    if (!providerFeedback.trim()) {
      toast.error('Please provide feedback for the client');
      return;
    }

    setReviewing(true);
    try {
      await documentService.reviewDocument(document.id, {
        providerNotes,
        providerFeedback,
        status,
      });

      toast.success('Review submitted successfully! Client has been notified.');
      onUpdated?.();
      onClose?.();
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message ?? 'Failed to submit review');
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Document</h2>
        <p className="text-gray-600">{document.title}</p>
        <div className="mt-4 flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              document.submissionStatus === 'submitted-to-provider'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            {documentService.getStatusLabel(document.submissionStatus)}
          </span>
          {document.uploadedBy && (
            <span className="text-sm text-gray-500">
              From: {document.uploadedBy.firstName} {document.uploadedBy.lastName}
            </span>
          )}
        </div>
      </div>

      {/* Document Files */}
      {document.files && document.files.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Attached Files</h3>
          <div className="space-y-3">
            {document.files.map(file => (
              <div
                key={`${file.cloudinaryUrl}-${file.originalFileName}`}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-8 h-8 text-gray-400"
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
                  <div>
                    <p className="font-medium text-gray-900">{file.originalFileName}</p>
                    <p className="text-sm text-gray-500">
                      {documentService.formatFileSize(file.fileSize)} • {file.fileType}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleViewFile(file)}
                  disabled={viewingFile !== null}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {viewingFile === (file.supabasePath || file.cloudinaryUrl.split('/').pop()) ? 'Opening…' : 'View'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Client Notes */}
      {document.notes && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Client Notes</h3>
          <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{document.notes}</p>
        </div>
      )}

      {/* Provider Notes (internal) */}
      <div className="mb-6">
        <label htmlFor="providerNotes" className="block text-sm font-medium text-gray-700 mb-2">
          Internal Notes (Optional)
        </label>
        <textarea
          id="providerNotes"
          value={providerNotes}
          onChange={e => setProviderNotes(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Add internal notes that only you can see..."
        />
      </div>

      {/* Provider Feedback (for client) */}
      <div className="mb-6">
        <label htmlFor="providerFeedback" className="block text-sm font-medium text-gray-700 mb-2">
          Feedback for Client *
        </label>
        <textarea
          id="providerFeedback"
          value={providerFeedback}
          onChange={e => setProviderFeedback(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Provide feedback that the client will see..."
          required
        />
        <p className="mt-2 text-sm text-gray-500">
          This feedback will be shared with the client and they will receive a notification.
        </p>
      </div>

      {/* Status */}
      <div className="mb-6">
        <label htmlFor="reviewStatus" className="block text-sm font-medium text-gray-700 mb-2">
          Review Status
        </label>
        <select
          id="reviewStatus"
          value={status}
          onChange={e => setStatus(e.target.value as 'reviewed-by-provider' | 'completed')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="reviewed-by-provider">Under Review</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          onClick={onClose}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleReview}
          disabled={reviewing || !providerFeedback.trim()}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {reviewing ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
};
