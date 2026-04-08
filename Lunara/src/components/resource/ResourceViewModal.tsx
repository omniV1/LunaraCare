/**
 * @module components/resource/ResourceViewModal
 * Modal overlay for viewing a single resource's content, metadata, and download link.
 * Tracks view/download interactions for the recommendation engine.
 */
import React, { useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Resource } from '../../services/resourceService';
import { getBaseApiUrl } from '../../utils/getBaseApiUrl';
import { ApiClient } from '../../api/apiClient';

/**
 * Decode HTML entities (e.g. &lt; to <) so pre-escaped content renders as HTML.
 * Uses a throwaway DOM element because there's no native decoding API.
 * The SSR guard (`typeof document`) prevents crashes during server-side rendering.
 */
function decodeHtmlEntities(html: string): string {
  if (typeof document === 'undefined') return html;
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.innerHTML;
}

/** Props for {@link ResourceViewModal}. */
interface ResourceViewModalProps {
  resource: Resource | null;
  onClose: () => void;
}

/**
 * Modal to view a single resource: title, description, content, and a link to open/download the file if fileUrl is set.
 */
export const ResourceViewModal: React.FC<ResourceViewModalProps> = ({ resource, onClose }) => {
  // Track resource views for recommendation engine; fire-and-forget so
  // analytics failures never break the UI for the user.
  useEffect(() => {
    if (!resource?.id) return;
    ApiClient.getInstance()
      .post('/interactions', { resourceId: resource.id, interactionType: 'view' })
      .catch(err => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[ResourceViewModal] Failed to track view interaction:', err);
        }
      });
  }, [resource?.id]);

  if (!resource) return null;

  const baseUrl = getBaseApiUrl();
  const fileUrl = resource.fileUrl
    ? resource.fileUrl.startsWith('http')
      ? resource.fileUrl
      : `${baseUrl.replace(/\/api\/?$/, '')}${resource.fileUrl.startsWith('/') ? '' : '/'}${resource.fileUrl}`
    : null;

  return (
    <div className="fixed inset-0 bg-[#4E1B00]/50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col" style={{ maxHeight: '90dvh' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DED7CD]">
          <h2 className="text-xl font-semibold text-[#4E1B00]">{resource.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#BCADA5] hover:text-[#6B4D37] p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
          {resource.category?.name && (
            <p className="text-sm text-[#6B4D37]/70">
              Category: <span className="font-medium text-[#4E1B00]/80">{resource.category.name}</span>
            </p>
          )}
          {resource.description && (
            <div>
              <h3 className="text-sm font-medium text-[#4E1B00]/80 mb-1">Description</h3>
              <p className="text-[#6B4D37] whitespace-pre-wrap">{resource.description}</p>
            </div>
          )}
          {resource.content && (
            <div>
              <h3 className="text-sm font-medium text-[#4E1B00]/80 mb-1">Content</h3>
              <div
                className="text-[#6B4D37] prose prose-sm max-w-none prose-headings:text-[#4E1B00] prose-p:text-[#6B4D37] prose-li:text-[#6B4D37] prose-strong:text-[#4E1B00]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(decodeHtmlEntities(resource.content)) }}
              />
            </div>
          )}
          {fileUrl && (
            <div className="pt-2">
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  ApiClient.getInstance()
                    .post('/interactions', { resourceId: resource.id, interactionType: 'download' })
                    .catch(err => {
                      if (process.env.NODE_ENV === 'development') {
                        console.warn('[ResourceViewModal] Failed to track download interaction:', err);
                      }
                    });
                }}
                className="inline-flex items-center px-4 py-2 bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e] transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                View / Download file
              </a>
            </div>
          )}
          {!resource.content && !fileUrl && (
            <p className="text-[#6B4D37]/70 text-sm">No additional content or file for this resource.</p>
          )}
        </div>
      </div>
    </div>
  );
};
