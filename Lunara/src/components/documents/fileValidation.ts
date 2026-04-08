/**
 * @module components/documents/fileValidation
 * Client-side file validation helpers for document uploads.
 */

/** Returns an error message if the file is not a PDF or exceeds 10 MB, otherwise null. */
export const getPdfValidationError = (selectedFile: File): string | null => {
  if (!selectedFile.type.includes('pdf')) {
    return 'Please upload a PDF file';
  }
  if (selectedFile.size > 10 * 1024 * 1024) {
    return 'File size must be less than 10MB';
  }
  return null;
};
