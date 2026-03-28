/**
 * documentService.test.ts
 * Unit tests for the document service: CRUD, submit/review, file helpers.
 * ApiClient is mocked so all tests run without a real backend.
 */
import type { ApiClient as _ApiClient } from '../../api/apiClient';
import type {
  ClientDocument,
  DocumentFilters,
  CreateDocumentData,
  UpdateDocumentData,
  ReviewDocumentData,
} from '../../services/documentService';

const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
} as unknown as jest.Mocked<_ApiClient>;

jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => mockApiClient,
  },
}));

import { documentService } from '../../services/documentService';

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDocuments', () => {
    it('fetches all documents when no filters', async () => {
      const mockDocs: ClientDocument[] = [];
      mockApiClient.get.mockResolvedValue(mockDocs);

      const result = await documentService.getDocuments();

      expect(mockApiClient.get).toHaveBeenCalledWith('/documents');
      expect(result).toEqual(mockDocs);
    });

    it('appends filter params to URL', async () => {
      mockApiClient.get.mockResolvedValue([]);
      const filters: DocumentFilters = {
        documentType: 'personal-assessment',
        submissionStatus: 'submitted-to-provider',
        page: 1,
        limit: 10,
      };

      await documentService.getDocuments(filters);

      const url = mockApiClient.get.mock.calls[0][0];
      expect(url).toMatch(/^\/documents\?/);
      expect(url).toContain('documentType=personal-assessment');
      expect(url).toContain('submissionStatus=submitted-to-provider');
      expect(url).toContain('page=1');
      expect(url).toContain('limit=10');
    });
  });

  describe('searchDocuments', () => {
    it('calls getDocuments with search query', async () => {
      mockApiClient.get.mockResolvedValue([]);

      await documentService.searchDocuments('test query', { limit: 5 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('search=test+query')
      );
      expect(mockApiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('limit=5')
      );
    });
  });

  describe('getDocument', () => {
    it('fetches a single document by id', async () => {
      const doc = { id: 'doc1', title: 'Test', documentType: 'other', files: [], submissionStatus: 'draft', privacyLevel: 'client-only', uploadedBy: { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com' }, createdAt: '', updatedAt: '' } as ClientDocument;
      mockApiClient.get.mockResolvedValue(doc);

      const result = await documentService.getDocument('doc1');

      expect(mockApiClient.get).toHaveBeenCalledWith('/documents/doc1');
      expect(result).toEqual(doc);
    });
  });

  describe('createDocument', () => {
    it('posts create payload', async () => {
      const data: CreateDocumentData = {
        title: 'New Doc',
        documentType: 'personal-assessment',
        files: [],
      };
      const created = { ...data, id: 'new1', documentType: 'personal-assessment', files: [], submissionStatus: 'draft', uploadedBy: { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com' }, createdAt: '', updatedAt: '' } as unknown as ClientDocument;
      mockApiClient.post.mockResolvedValue(created);

      const result = await documentService.createDocument(data);

      expect(mockApiClient.post).toHaveBeenCalledWith('/documents', data);
      expect(result).toEqual(created);
    });
  });

  describe('updateDocument', () => {
    it('puts update payload', async () => {
      const data: UpdateDocumentData = { title: 'Updated', notes: 'note' };
      const updated = { id: 'doc1', title: 'Updated', notes: 'note', documentType: 'other', files: [], submissionStatus: 'draft', privacyLevel: 'client-only', uploadedBy: { id: 'u1', firstName: 'A', lastName: 'B', email: 'a@b.com' }, createdAt: '', updatedAt: '' } as ClientDocument;
      mockApiClient.put.mockResolvedValue(updated);

      const result = await documentService.updateDocument('doc1', data);

      expect(mockApiClient.put).toHaveBeenCalledWith('/documents/doc1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteDocument', () => {
    it('deletes by id', async () => {
      mockApiClient.delete.mockResolvedValue(undefined);

      await documentService.deleteDocument('doc1');

      expect(mockApiClient.delete).toHaveBeenCalledWith('/documents/doc1');
    });
  });

  describe('submitDocument', () => {
    it('posts to submit endpoint', async () => {
      const msg = { message: 'Submitted', document: {} as ClientDocument };
      mockApiClient.post.mockResolvedValue(msg);

      const result = await documentService.submitDocument('doc1');

      expect(mockApiClient.post).toHaveBeenCalledWith('/documents/doc1/submit', {});
      expect(result).toEqual(msg);
    });
  });

  describe('reviewDocument', () => {
    it('posts review data', async () => {
      const data: ReviewDocumentData = { providerFeedback: 'Good', status: 'reviewed-by-provider' };
      const msg = { message: 'Reviewed', document: {} as ClientDocument };
      mockApiClient.post.mockResolvedValue(msg);

      const result = await documentService.reviewDocument('doc1', data);

      expect(mockApiClient.post).toHaveBeenCalledWith('/documents/doc1/review', data);
      expect(result).toEqual(msg);
    });
  });

  describe('uploadFile', () => {
    it('posts FormData to /files/upload and returns FileAttachment', async () => {
      const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      mockApiClient.post.mockResolvedValue({
        success: true,
        file: {
          fileId: 'f1',
          url: 'https://example.com/files/f1',
          filename: 'test.pdf',
          contentType: 'application/pdf',
          size: 7,
          uploadDate: new Date().toISOString(),
        },
      });

      const result = await documentService.uploadFile(file);

      expect(mockApiClient.post).toHaveBeenCalledWith('/files/upload', expect.any(FormData));
      expect(result).toEqual({
        cloudinaryUrl: 'https://example.com/files/f1',
        originalFileName: 'test.pdf',
        fileType: 'application/pdf',
        fileSize: 7,
        uploadDate: expect.any(String),
        supabasePath: 'f1',
      });
    });

    it('throws with message when upload fails', async () => {
      const file = new File(['x'], 'a.txt', { type: 'text/plain' });
      mockApiClient.post.mockRejectedValue(new Error('Network error'));

      await expect(documentService.uploadFile(file)).rejects.toThrow(
        'Failed to upload file: Network error'
      );
    });

    it('throws with "Unknown error" when error is not Error instance', async () => {
      const file = new File(['x'], 'a.txt', { type: 'text/plain' });
      mockApiClient.post.mockRejectedValue('string error');

      await expect(documentService.uploadFile(file)).rejects.toThrow(
        'Failed to upload file: Unknown error'
      );
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(documentService.formatFileSize(0)).toBe('0 Bytes');
      expect(documentService.formatFileSize(500)).toBe('500 Bytes');
      expect(documentService.formatFileSize(1024)).toBe('1 KB');
      expect(documentService.formatFileSize(1536)).toBe('1.5 KB');
      expect(documentService.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(documentService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('getDocumentTypeLabel', () => {
    it('returns label for known type', () => {
      expect(documentService.getDocumentTypeLabel('emotional-survey')).toBe('Emotional Wellness Survey');
      expect(documentService.getDocumentTypeLabel('personal-assessment')).toBe('Personal Assessment');
      expect(documentService.getDocumentTypeLabel('other')).toBe('Other');
    });
    it('returns type as-is for unknown', () => {
      expect(documentService.getDocumentTypeLabel('unknown')).toBe('unknown');
    });
  });

  describe('getStatusLabel', () => {
    it('returns label for known status', () => {
      expect(documentService.getStatusLabel('draft')).toBe('Draft');
      expect(documentService.getStatusLabel('submitted-to-provider')).toBe('Submitted');
      expect(documentService.getStatusLabel('reviewed-by-provider')).toBe('Under Review');
      expect(documentService.getStatusLabel('completed')).toBe('Completed');
    });
    it('returns status as-is for unknown', () => {
      expect(documentService.getStatusLabel('unknown')).toBe('unknown');
    });
  });

  describe('formatDate', () => {
    it('formats date string', () => {
      const out = documentService.formatDate('2024-06-15T00:00:00.000Z');
      expect(out).toMatch(/June/);
      expect(out).toMatch(/1[45]/); // 14 or 15 depending on timezone (UTC midnight → local)
      expect(out).toMatch(/2024/);
    });
  });
});
