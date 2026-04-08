/**
 * @module components/blog/BlogTagInput
 * Tag management widget for blog posts — lets the provider type a tag,
 * add it on Enter/click, and remove existing tags via pill badges.
 */
import React from 'react';

/** Props for the blog tag input and tag-list display. */
export interface BlogTagInputProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onTagAdd: () => void;
  onTagRemove: (tag: string) => void;
}

/** Renders the tag text input, Add button, and removable tag pills. */
export const BlogTagInput: React.FC<BlogTagInputProps> = ({
  tags,
  tagInput,
  onTagInputChange,
  onTagAdd,
  onTagRemove,
}) => {
  return (
    <div>
      <label htmlFor="tagInput" className="block text-sm font-medium text-dash-text-secondary mb-2">
        Tags
      </label>
      <div className="flex gap-2 mb-2">
        <input
          id="tagInput"
          type="text"
          value={tagInput}
          onChange={e => onTagInputChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onTagAdd();
            }
          }}
          className="flex-1 px-4 py-3 border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4D37] focus:border-[#6B4D37]"
          placeholder="Add a tag and press Enter"
        />
        <button
          type="button"
          onClick={onTagAdd}
          className="px-6 py-3 bg-[#6B4D37] text-white rounded-lg hover:bg-[#5a402e] focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center px-3 py-1 bg-[#6B4D37]/10 text-[#4E1B00] rounded-full text-sm"
          >
            {tag}
            <button
              type="button"
              onClick={() => onTagRemove(tag)}
              className="ml-2 text-[#6B4D37] hover:text-[#4E1B00]"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};
