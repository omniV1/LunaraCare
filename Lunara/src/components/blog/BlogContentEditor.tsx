/**
 * @module components/blog/BlogContentEditor
 * Wraps the RichTextEditor (Quill) for blog post body content,
 * lazy-loaded by BlogEditor to keep the initial bundle small.
 */
import React from 'react';
import { RichTextEditor } from '../ui/RichTextEditor';

/** Props for the blog rich-text content editor. */
export interface BlogContentEditorProps {
  content: string;
  onContentChange: (value: string) => void;
}

/** Renders the rich-text editor field for the blog post body. */
export const BlogContentEditor: React.FC<BlogContentEditorProps> = ({
  content,
  onContentChange,
}) => {
  return (
    <div>
      <label htmlFor="content" className="block text-sm font-medium text-dash-text-secondary mb-2">
        Content *
      </label>
      <RichTextEditor
        value={content}
        onChange={onContentChange}
        placeholder="Write your blog post content here..."
        height={400}
      />
    </div>
  );
};
