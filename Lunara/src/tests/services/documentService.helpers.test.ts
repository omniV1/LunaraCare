/**
 * DocumentService helper methods unit tests.
 * Covers pure formatting/label methods that do not call the API:
 * formatFileSize, getDocumentTypeLabel, getStatusLabel, formatDate.
 * API methods (getDocuments, createDocument, etc.) are covered separately
 * or via integration tests.
 */
import { documentService } from '../../services/documentService';

describe('DocumentService helpers', () => {
  describe('formatFileSize', () => {
    it('returns "0 Bytes" for zero', () => {
      expect(documentService.formatFileSize(0)).toBe('0 Bytes');
    });

    it('formats bytes correctly', () => {
      expect(documentService.formatFileSize(1)).toBe('1 Bytes');
      expect(documentService.formatFileSize(500)).toBe('500 Bytes');
      expect(documentService.formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('formats KB correctly', () => {
      expect(documentService.formatFileSize(1024)).toBe('1 KB');
      expect(documentService.formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats MB and GB correctly', () => {
      expect(documentService.formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(documentService.formatFileSize(2048 * 1024)).toBe('2 MB');
      expect(documentService.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('getDocumentTypeLabel', () => {
    it('returns known labels for document types', () => {
      expect(documentService.getDocumentTypeLabel('emotional-survey')).toBe(
        'Emotional Wellness Survey'
      );
      expect(documentService.getDocumentTypeLabel('health-assessment')).toBe('Health Assessment');
      expect(documentService.getDocumentTypeLabel('feeding-log')).toBe('Feeding & Pumping Log');
      expect(documentService.getDocumentTypeLabel('personal-assessment')).toBe(
        'Personal Assessment'
      );
      expect(documentService.getDocumentTypeLabel('other')).toBe('Other');
    });

    it('returns the type string as-is when unknown', () => {
      expect(documentService.getDocumentTypeLabel('unknown-type')).toBe('unknown-type');
    });
  });

  describe('getStatusLabel', () => {
    it('returns known labels for statuses', () => {
      expect(documentService.getStatusLabel('draft')).toBe('Draft');
      expect(documentService.getStatusLabel('submitted-to-provider')).toBe('Submitted');
      expect(documentService.getStatusLabel('reviewed-by-provider')).toBe('Under Review');
      expect(documentService.getStatusLabel('completed')).toBe('Completed');
    });

    it('returns the status string as-is when unknown', () => {
      expect(documentService.getStatusLabel('unknown-status')).toBe('unknown-status');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date string to en-US long format', () => {
      const result = documentService.formatDate('2024-06-15');
      expect(result).toMatch(/June 1[45], 2024/); // 14 or 15 depending on timezone
    });

    it('handles ISO datetime strings', () => {
      const result = documentService.formatDate('2024-01-01T12:00:00.000Z');
      expect(result).toMatch(/January 1, 2024/);
    });
  });
});
