import { getPdfValidationError } from '../../components/documents/fileValidation';

describe('fileValidation', () => {
  describe('getPdfValidationError', () => {
    it('should return null for valid PDF file', () => {
      const validFile = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });
      // Mock size to be under 10MB
      Object.defineProperty(validFile, 'size', { value: 5 * 1024 * 1024 });

      const result = getPdfValidationError(validFile);

      expect(result).toBeNull();
    });

    it('should return error for non-PDF file', () => {
      const invalidFile = new File(['content'], 'test.docx', {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const result = getPdfValidationError(invalidFile);

      expect(result).toBe('Please upload a PDF file');
    });

    it('should return error for file larger than 10MB', () => {
      const largeFile = new File(['content'], 'large.pdf', {
        type: 'application/pdf',
      });
      // Mock size to be over 10MB
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 });

      const result = getPdfValidationError(largeFile);

      expect(result).toBe('File size must be less than 10MB');
    });

    it('should return error for exactly 10MB+ 1 byte', () => {
      const largeFile = new File(['content'], 'large.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(largeFile, 'size', { value: 10 * 1024 * 1024 + 1 });

      const result = getPdfValidationError(largeFile);

      expect(result).toBe('File size must be less than 10MB');
    });

    it('should accept exactly 10MB file', () => {
      const validFile = new File(['content'], 'exact.pdf', {
        type: 'application/pdf',
      });
      Object.defineProperty(validFile, 'size', { value: 10 * 1024 * 1024 });

      const result = getPdfValidationError(validFile);

      expect(result).toBeNull();
    });

    it('should handle empty PDF file', () => {
      const emptyFile = new File([], 'empty.pdf', {
        type: 'application/pdf',
      });

      const result = getPdfValidationError(emptyFile);

      expect(result).toBeNull();
    });

    it('should handle various PDF MIME types', () => {
      // Test types that contain 'pdf'
      const validPdfTypes = ['application/pdf', 'application/x-pdf'];

      validPdfTypes.forEach(type => {
        const file = new File(['content'], 'test.pdf', { type });
        Object.defineProperty(file, 'size', { value: 1024 });
        const result = getPdfValidationError(file);
        expect(result).toBeNull();
      });

      // Test type that doesn't contain 'pdf'
      const invalidFile = new File(['content'], 'test.pdf', {
        type: 'application/acrobat',
      });
      Object.defineProperty(invalidFile, 'size', { value: 1024 });
      expect(getPdfValidationError(invalidFile)).toBe('Please upload a PDF file');
    });
  });
});
