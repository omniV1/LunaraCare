import { ApiClient } from '../api/apiClient';

export interface FileAttachment {
  cloudinaryUrl: string;
  originalFileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  supabasePath?: string;
}

export interface SubmissionData {
  submittedDate?: string;
  reviewedDate?: string;
  providerNotes?: string;
  providerFeedback?: string;
}

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

export interface UpdateDocumentData {
  title?: string;
  notes?: string;
  formData?: Record<string, unknown>;
  files?: FileAttachment[];
}

export interface ReviewDocumentData {
  providerNotes?: string;
  providerFeedback?: string;
  status?: 'reviewed-by-provider' | 'completed';
}

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

export interface DocumentResponse {
  documents: ClientDocument[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class DocumentService {
  private readonly baseUrl = '/documents';
  private readonly apiClient = ApiClient.getInstance();

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

  async searchDocuments(
    query: string,
    filters?: Omit<DocumentFilters, 'search'>
  ): Promise<ClientDocument[] | DocumentResponse> {
    return this.getDocuments({ ...filters, search: query });
  }

  async getDocument(id: string): Promise<ClientDocument> {
    const response = await this.apiClient.get<ClientDocument>(`${this.baseUrl}/${id}`);
    return response as unknown as ClientDocument;
  }

  async createDocument(data: CreateDocumentData): Promise<ClientDocument> {
    const response = await this.apiClient.post<ClientDocument>(this.baseUrl, data);
    return response as unknown as ClientDocument;
  }

  async updateDocument(id: string, data: UpdateDocumentData): Promise<ClientDocument> {
    const response = await this.apiClient.put<ClientDocument>(`${this.baseUrl}/${id}`, data);
    return response as unknown as ClientDocument;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.apiClient.delete(`${this.baseUrl}/${id}`);
  }

  async submitDocument(id: string): Promise<{ message: string; document: ClientDocument }> {
    const response = await this.apiClient.post<{ message: string; document: ClientDocument }>(
      `${this.baseUrl}/${id}/submit`,
      {}
    );
    return response as unknown as { message: string; document: ClientDocument };
  }

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

  // Upload file to backend GridFS storage
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

  // Helper function to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper function to get document type label
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

  // Helper function to get status label
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Draft',
      'submitted-to-provider': 'Submitted',
      'reviewed-by-provider': 'Under Review',
      completed: 'Completed',
    };
    return labels[status] ?? status;
  }

  // Helper function to format date
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export const documentService = new DocumentService();
