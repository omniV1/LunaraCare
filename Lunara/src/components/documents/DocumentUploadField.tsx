import React from 'react';
import { toast } from 'react-toastify';

interface DocumentUploadFieldProps {
  label: string;
  accept?: string;
  file: File | null;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileSelected: (file: File | null) => void;
  validate?: (file: File) => string | null;
  helperNote?: string;
}

export const DocumentUploadField: React.FC<DocumentUploadFieldProps> = ({
  label,
  accept = '.pdf',
  file,
  inputRef,
  onFileSelected,
  validate,
  helperNote,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const selectedFile = e.target.files?.[0] ?? null;
    if (!selectedFile) {
      onFileSelected(null);
      return;
    }
    if (validate) {
      const err = validate(selectedFile);
      if (err) {
        toast.error(err);
        return;
      }
    }
    onFileSelected(selectedFile);
  };

  return (
    <div>
      <label htmlFor="file" className="block text-sm font-medium text-[#4E1B00]/80 mb-2">
        {label}
      </label>
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        className="w-full text-left border-2 border-dashed border-[#CAC3BC] rounded-2xl p-6 hover:border-[#6B4D37] transition-colors relative bg-[#FAF7F2]/50"
        onClick={() => inputRef.current?.click()}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          id="file"
          type="file"
          ref={inputRef}
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {!file && (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-[#BCADA5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm text-[#6B4D37]">
              <span className="text-[#6B4D37] font-medium underline underline-offset-2">Click to upload</span> or drag and drop
            </p>
            {helperNote && <p className="text-xs text-[#6B4D37]/70 mt-1">{helperNote}</p>}
          </div>
        )}
        {file && (
          <div className="p-4 bg-[#DED7CD]/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#4E1B00]/80">
                  <span className="font-medium">Selected file:</span> {file.name}
                </p>
              </div>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onFileSelected(null);
                }}
                className="text-[#AA6641] hover:text-[#4E1B00]"
                aria-label="Remove selected file"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
