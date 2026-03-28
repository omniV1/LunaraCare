import React from 'react';
import { RichTextEditor } from '../ui/RichTextEditor';

export interface BlogContentEditorProps {
  content: string;
  onContentChange: (value: string) => void;
}

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
