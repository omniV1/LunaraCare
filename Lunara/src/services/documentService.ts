/**
 * @module documentService
 * Service for client document lifecycle: CRUD, submission workflow,
 * provider review, file uploads via GridFS, and display helpers.
 */

import { ApiClient } from '../api/apiClient';

/** Metadata for a file stored in GridFS / Cloudinary. */
export interface FileAttachment {
  cloudinaryUrl: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  supabasePath?: string;
}

/** Tracks document submission and review timestamps/notes. */
export interface SubmissionData {
  submittedDate?: string;
  reviewedDate?: string;
  providerNotes?: string;
  providerFeedback?: string;
}

/** Full client document record including files, status, and metadata. */
export interface ClientDocument {
  id: string;
  title: string;
  documentType:
    | 'emotional-survey'
    | 'health-assessment'
    | 'personal-assessment'
    | 'feeding-log'
    | 'sleep-log'
    | 'mood-check-in'
    | 'recovery-notes'
    | 'other';
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignedProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  files: FileAttachment[];
  submissionStatus: 'draft' | 'submitted-to-provider' | 'reviewed-by-provider' | 'completed';
  submissionData?: SubmissionData;
  formData?: Record<string, unknown>;
  privacyLevel: 'client-only' | 'client-and-provider' | 'care-team';
  dueDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a new client document. */
export interface CreateDocumentData {
  title: string;
  documentType: string;
  files: FileAttachment[];
  assignedProvider?: string;
  formData?: Record<string, unknown>;
  privacyLevel?: string;
  dueDate?: string;
  notes?: string;
}

/** Payload for updating an existing client document. */
export interface UpdateDocumentData {
  title?: string;
  notes?: string;
  formData?: Record<string, unknown>;
  files?: FileAttachment[];
}

/** Payload for a provider reviewing a submitted document. */
export interface ReviewDocumentData {
  providerNotes?: string;
  providerFeedback?: string;
  status?: 'reviewed-by-provider' | 'completed';
}

/** Query filters for listing client documents. */
export interface DocumentFilters {
  documentType?:
    | 'emotional-survey'
    | 'health-assessment'
    | 'personal-assessment'
    | 'feeding-log'
    | 'sleep-log'
    | 'mood-check-in'
    | 'recovery-notes'
    | 'other';
  submissionStatus?: 'draft' | 'submitted-to-provider' | 'reviewed-by-provider' | 'completed';
  provider?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  page?: number;
}

/** Paginated document list response. */
export interface DocumentResponse {
  documents: ClientDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/** Encapsulates document API interactions and formatting helpers. */
class DocumentService {
  private readonly baseUrl = '/documents';
  private readonly apiClient = ApiClient.getInstance();

  /**
   * Lists client documents matching optional filters.
   * @param filters - Optional type, status, date, and pagination filters.
   * @returns Array of documents or a paginated response.
   */
  async getDocuments(filters?: DocumentFilters): Promise<ClientDocument[] | DocumentResponse> {
    const params = new URLSearchParams();

    if (filters?.documentType) params.append('documentType', filters.documentType);
    if (filters?.submissionStatus) params.append('submissionStatus', filters.submissionStatus);
    if (filters?.provider) params.append('provider', filters.provider);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.page) params.append('page', filters.page.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await this.apiClient.get<ClientDocument[] | DocumentResponse>(url);
    return response as unknown as ClientDocument[] | DocumentResponse;
  }

  /**
   * Searches documents by text query with optional additional filters.
   * @param query - Search text.
   * @param filters - Additional filters (excluding `search`).
   * @returns Matching documents.
   */
  async searchDocuments(
    query: string,
    filters?: Omit<DocumentFilters, 'search'>
  ): Promise<ClientDocument[] | DocumentResponse> {
    return this.getDocuments({ ...filters, search: query });
  }

  /**
   * Fetches a single document by ID.
   * @param id - Document identifier.
   * @returns The matching {@link ClientDocument}.
   */
  async getDocument(id: string): Promise<ClientDocument> {
    const response = await this.apiClient.get<ClientDocument>(`${this.baseUrl}/${id}`);
    return response as unknown as ClientDocument;
  }

  /**
   * Creates a new client document.
   * @param data - Document creation payload.
   * @returns The newly created {@link ClientDocument}.
   */
  async createDocument(data: CreateDocumentData): Promise<ClientDocument> {
    const response = await this.apiClient.post<ClientDocument>(this.baseUrl, data);
    return response as unknown as ClientDocument;
  }

  /**
   * Updates an existing client document.
   * @param id - Document identifier.
   * @param data - Partial update payload.
   * @returns The updated {@link ClientDocument}.
   */
  async updateDocument(id: string, data: UpdateDocumentData): Promise<ClientDocument> {
    const response = await this.apiClient.put<ClientDocument>(`${this.baseUrl}/${id}`, data);
    return response as unknown as ClientDocument;
  }

  /**
   * Deletes a client document.
   * @param id - Document identifier.
   */
  async deleteDocument(id: string): Promise<void> {
    await this.apiClient.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Submits a draft document to the assigned provider for review.
   * @param id - Document identifier.
   * @returns Confirmation message and updated document.
   */
  async submitDocument(id: string): Promise<{ message: string; document: ClientDocument }> {
    const response = await this.apiClient.post<{ message: string; document: ClientDocument }>(
      `${this.baseUrl}/${id}/submit`,
      {}
    );
    return response as unknown as { message: string; document: ClientDocument };
  }

  /**
   * Provider reviews a submitted document with notes/feedback.
   * @param id - Document identifier.
   * @param data - Review payload (notes, feedback, status).
   * @returns Confirmation message and updated document.
   */
  async reviewDocument(
    id: string,
    data: ReviewDocumentData
  ): Promise<{ message: string; document: ClientDocument }> {
    const response = await this.apiClient.post<{ message: string; document: ClientDocument }>(
      `${this.baseUrl}/${id}/review`,
      data
    );
    return response as unknown as { message: string; document: ClientDocument };
  }

  /**
   * Uploads a file to backend GridFS storage.
   * @param file - Browser File object to upload.
   * @returns {@link FileAttachment} metadata for the stored file.
   * @throws When the upload fails.
   */
  async uploadFile(file: File): Promise<FileAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'documents');

    try {
      const response = await this.apiClient.post<{
        success: boolean;
        file: {
          fileId: string;
          url: string;
          filename: string;
          contentType: string;
          size: number;
          uploadDate: string;
        };
      }>('/files/upload', formData);

      const result = response as unknown as {
        success: boolean;
        file: {
          fileId: string;
          url: string;
          filename: string;
          contentType: string;
          size: number;
          uploadDate: string;
        };
      };

      return {
        cloudinaryUrl: result.file.url, // GridFS URL via backend
        originalFileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        supabasePath: result.file.fileId, // Store GridFS fileId for deletion (reusing field name for compatibility)
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload file: ${message}`);
    }
  }

  /**
   * Formats a byte count into a human-readable size string.
   * @param bytes - File size in bytes.
   * @returns Formatted string (e.g. "1.5 MB").
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Maps a document type slug to a display label.
   * @param type - Document type key (e.g. `"emotional-survey"`).
   * @returns Human-readable label.
   */
  getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'emotional-survey': 'Emotional Wellness Survey',
      'health-assessment': 'Health Assessment',
      'personal-assessment': 'Personal Assessment',
      'feeding-log': 'Feeding & Pumping Log',
      'sleep-log': 'Sleep & Rest Log',
      'mood-check-in': 'Mood & Emotional Check-In',
      'recovery-notes': 'Recovery Milestones & Notes',
      other: 'Other',
      'progress-photo': 'Progress Photo', // legacy; no longer used for new documents
    };
    return labels[type] ?? type;
  }

  /**
   * Maps a submission status slug to a display label.
   * @param status - Status key (e.g. `"submitted-to-provider"`).
   * @returns Human-readable label.
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      'submitted-to-provider': 'Submitted',
      'reviewed-by-provider': 'Under Review',
      completed: 'Completed',
    };
    return labels[status] ?? status;
  }

  /**
   * Formats an ISO date string for display (e.g. "January 1, 2025").
   * @param dateString - ISO 8601 date string.
   * @returns Locale-formatted date string.
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

/** Pre-instantiated singleton document service. */
export const documentService = new DocumentService();
