import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import { documentService } from '../../services/documentService';
import { Card } from '../ui/Card';
import { DocumentUploadField } from './DocumentUploadField';

interface DocumentMetadata {
  title: string;
  description: string;
  category: string;
  tags: string[];
}

interface DocumentUploadProps {
  onUpload?: (file: File, metadata: DocumentMetadata) => void;
  onCancel?: () => void;
  onDocumentCreated?: () => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  onCancel,
  onDocumentCreated,
  maxSize = 10,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'],
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    title: '',
    description: '',
    category: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  // Drag handlers removed with shared field; state removed
  // (reintroduce if drag-and-drop is added back)
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Medical Records',
    'Appointment Notes',
    'Lab Results',
    'Ultrasound Images',
    'Birth Plan',
    'Insurance Documents',
    'Other',
  ];

  const handleFileSelect = (selectedFile: File) => {
    setError('');

    // Check file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Check file type
    const fileExtension = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      setError(`File type not supported. Accepted types: ${acceptedTypes.join(', ')}`);
      return;
    }

    setFile(selectedFile);

    // Auto-fill title if empty
    if (!metadata.title) {
      setMetadata(prev => ({
        ...prev,
        title: selectedFile.name.replace(/\.[^/.]+$/, ''), // Remove file extension
      }));
    }
  };

  // Removed drag handlers (now handled within shared upload)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !metadata.tags.includes(tagInput.trim())) {
      setMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!metadata.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!metadata.category) {
      setError('Category is required');
      return;
    }

    // If onUpload prop is provided, use it
    if (onUpload) {
      onUpload(file, metadata);
      return;
    }

    // Otherwise, handle upload internally
    setUploading(true);
    setError('');

    try {
      const fileAttachment = await documentService.uploadFile(file);

      // Map category to documentType
      const documentTypeMap: Record<string, string> = {
        'Medical Records': 'health-assessment',
        'Lab Results': 'health-assessment',
        'Appointment Notes': 'health-assessment',
        'Ultrasound Images': 'other',
        'Birth Plan': 'other',
        'Insurance Documents': 'other',
        Other: 'other',
      };

      await documentService.createDocument({
        title: metadata.title,
        documentType: documentTypeMap[metadata.category] ?? 'other',
        files: [fileAttachment],
        notes: metadata.description,
        privacyLevel: 'client-and-provider',
      });

      toast.success('Document uploaded successfully!');

      // Notify parent that a document was created
      onDocumentCreated?.();

      // Reset form
      setFile(null);
      setMetadata({
        title: '',
        description: '',
        category: '',
        tags: [],
      });
      setTagInput('');
    } catch (error: unknown) {
      const data =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: Record<string, unknown> } }).response?.data
          : undefined;
      const errorDetails =
        (data && (data.error ?? data.details)) ??
        (error instanceof Error ? error.message : undefined) ??
        'Failed to upload document';
      const errorMessage =
        (data && typeof data.message === 'string' ? data.message : undefined) ?? 'Failed to upload document';
      setError(`${errorMessage}: ${String(errorDetails)}`);
      toast.error(`${errorMessage}: ${String(errorDetails)}`);
    } finally {
      setUploading(false);
    }
  };

  // Removed local formatFileSize; DocumentUploadField handles basic display

  return (
    <Card className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-sage-800 mb-6">Upload Document</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* File Upload Area (shared) */}
        <DocumentUploadField
          label="Upload Document *"
          accept={acceptedTypes.join(',')}
          file={file}
          inputRef={fileInputRef}
          onFileSelected={f => {
            if (f) handleFileSelect(f);
            else setFile(null);
          }}
          helperNote={`Accepted: ${acceptedTypes.join(', ')} (max ${maxSize}MB)`}
        />

        {/* Metadata Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-sage-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={metadata.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="Enter document title"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-sage-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={metadata.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
              placeholder="Brief description of the document"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-sage-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={metadata.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="docTagsInput" className="block text-sm font-medium text-sage-700 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                id="docTagsInput"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAdd();
                  }
                }}
                className="flex-1 px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500"
                placeholder="Add a tag and press Enter"
              />
              <button
                type="button"
                onClick={handleTagAdd}
                className="px-4 py-2 bg-sage-500 text-white rounded-md hover:bg-sage-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-sage-100 text-sage-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemove(tag)}
                    className="ml-2 text-sage-600 hover:text-sage-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons - always visible */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-[#CAC3BC] text-[#4E1B00]/80 rounded-lg hover:bg-[#FAF7F2] transition-colors"
            >
              Cancel
            </button>
          )}

          {/* Upload button - always visible, changes color based on validation */}
          <button
            type="submit"
            disabled={!file || !metadata.title.trim() || !metadata.category || uploading}
            className="px-8 py-3 rounded-lg font-semibold text-lg transition-all min-w-[180px] bg-[#6B4D37] text-white hover:bg-[#5a402e] disabled:bg-[#CAC3BC] disabled:text-[#6B4D37]/50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </form>
    </Card>
  );
};
