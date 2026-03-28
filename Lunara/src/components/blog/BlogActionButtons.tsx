import React from 'react';

export interface BlogActionButtonsProps {
  isLoading: boolean;
  isEditing: boolean;
  onCancel: () => void;
  onPublish: () => void;
}

export const BlogActionButtons: React.FC<BlogActionButtonsProps> = ({
  isLoading,
  isEditing,
  onCancel,
  onPublish,
}) => {
  return (
    <div className="flex justify-between pt-6 border-t border-dash-section-border">
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-3 bg-[#EDE8E0]/60 text-dash-text-secondary rounded-lg hover:bg-[#EDE8E0]/80 focus:outline-none focus:ring-2 focus:ring-[#6B4D37] transition-colors"
      >
        Cancel
      </button>

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={onPublish}
          disabled={isLoading}
          className="px-6 py-3 bg-[#3F4E4F] text-white rounded-lg hover:bg-[#2C3639] focus:outline-none focus:ring-2 focus:ring-[#3F4E4F] disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Publishing...' : 'Publish'}
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-[#6B4D37] text-white rounded-lg hover:bg-[#5a402e] focus:outline-none focus:ring-2 focus:ring-[#6B4D37] disabled:opacity-50 transition-colors"
        >
          {(() => {
            if (isLoading) return 'Saving...';
            return isEditing ? 'Update Draft' : 'Save Draft';
          })()}
        </button>
      </div>
    </div>
  );
};
