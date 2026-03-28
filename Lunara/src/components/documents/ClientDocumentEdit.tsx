import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  documentService,
  ClientDocument,
  FileAttachment,
} from '../../services/documentService';
import { DocumentUploadField } from './DocumentUploadField';

interface ClientDocumentEditProps {
  document: ClientDocument;
  onClose: () => void;
  onSaved: () => void;
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
const MAX_FILE_MB = 10;

export const ClientDocumentEdit: React.FC<ClientDocumentEditProps> = ({
  document,
  onClose,
  onSaved,
}) => {
  const [title, setTitle] = useState(document.title);
  const [notes, setNotes] = useState(document.notes ?? '');
  const [files, setFiles] = useState<FileAttachment[]>(document.files ?? []);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDraft = document.submissionStatus === 'draft';

  const handleAddFile = async () => {
    if (!newFile) return;
    setUploading(true);
    try {
      const attachment = await documentService.uploadFile(newFile);
      setFiles((prev) => [...prev, attachment]);
      setNewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success(`Added ${newFile.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await documentService.updateDocument(document.id, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        files,
      });
      toast.success('Document updated');
      onSaved();
      onClose();
    } catch (e: unknown) {
      const message =
        typeof e === 'object' && e !== null && 'response' in e
          ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
          : e instanceof Error
            ? e.message
            : undefined;
      toast.error(message ?? 'Failed to update document');
    } finally {
      setSaving(false);
    }
  };

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      return `File must be under ${MAX_FILE_MB}MB`;
    }
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.split(',').includes(ext)) {
      return `Accepted types: ${ACCEPTED_TYPES}`;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ maxHeight: '90dvh' }}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit document</h2>
          <p className="text-sm text-gray-500 mt-1">
            {documentService.getDocumentTypeLabel(document.documentType)} · Draft
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-4 overflow-y-auto space-y-4">
            <div>
              <label htmlFor="edit-doc-title" className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                id="edit-doc-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Document title"
                disabled={!isDraft}
              />
            </div>

            <div>
              <label htmlFor="edit-doc-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="edit-doc-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Optional notes"
                disabled={!isDraft}
              />
            </div>

            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">Files</p>
              {files.length > 0 && (
                <ul className="space-y-2 mb-3">
                  {files.map((file, index) => (
                    <li
                      key={`${file.originalFileName}-${index}`}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                    >
                      <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                        {file.originalFileName}
                        <span className="text-gray-400 ml-1">
                          ({documentService.formatFileSize(file.fileSize)})
                        </span>
                      </span>
                      {isDraft && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {isDraft && (
                <div className="space-y-2">
                  <DocumentUploadField
                    label="Add another file"
                    accept={ACCEPTED_TYPES}
                    file={newFile}
                    inputRef={fileInputRef}
                    onFileSelected={setNewFile}
                    validate={validateFile}
                    helperNote={`Accepted: ${ACCEPTED_TYPES} (max ${MAX_FILE_MB}MB)`}
                  />
                  {newFile && (
                    <button
                      type="button"
                      onClick={handleAddFile}
                      disabled={uploading}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {uploading ? 'Uploading…' : `Upload ${newFile.name}`}
                    </button>
                  )}
                </div>
              )}
              {!isDraft && files.length === 0 && (
                <p className="text-sm text-gray-500">No files. Only drafts can be edited.</p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !isDraft}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
