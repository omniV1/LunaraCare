/**
 * @module components/blog/BlogAutoSaveStatus
 * Displays real-time auto-save feedback (saving spinner, last-saved timestamp,
 * unsaved-changes warning) inside the blog editor header.
 */
import React from 'react';

/** Props controlling the visual state of the auto-save indicator. */
export interface BlogAutoSaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
}

/** Renders the auto-save status indicator for the blog editor. */
export const BlogAutoSaveStatus: React.FC<BlogAutoSaveStatusProps> = ({
  isSaving,
  lastSaved,
  hasUnsavedChanges,
}) => {
  return (
    <div className="flex items-center gap-4 text-sm text-dash-text-secondary/80">
      {isSaving && (
        <span className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#6B4D37] border-t-transparent rounded-full animate-spin"></div>
          Auto-saving...
        </span>
      )}
      {lastSaved && !isSaving && <span>Last saved: {lastSaved.toLocaleTimeString()}</span>}
      {hasUnsavedChanges && !isSaving && (
        <span className="text-orange-600">Unsaved changes</span>
      )}
    </div>
  );
};
