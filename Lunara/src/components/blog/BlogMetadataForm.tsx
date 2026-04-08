/**
 * @module components/blog/BlogMetadataForm
 * Title, category, and excerpt fields for the blog editor form.
 * Uses the shared BLOG_CATEGORIES constant for the category dropdown.
 */
import React from 'react';
import { BLOG_CATEGORIES } from './blogCategories';

/** Props for the blog post metadata fields (title, category, excerpt). */
export interface BlogMetadataFormProps {
  title: string;
  category: string;
  excerpt: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

/** Renders the title input, category selector, and excerpt textarea. */
export const BlogMetadataForm: React.FC<BlogMetadataFormProps> = ({
  title,
  category,
  excerpt,
  onChange,
}) => {
  return (
    <>
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-dash-text-secondary mb-2">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={title}
          onChange={onChange}
          className="w-full px-4 py-3 border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4D37] focus:border-[#6B4D37]"
          placeholder="Enter blog post title"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-dash-text-secondary mb-2">
          Category *
        </label>
        <select
          id="category"
          name="category"
          value={category}
          onChange={onChange}
          className="w-full px-4 py-3 border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4D37] focus:border-[#6B4D37]"
          required
        >
          <option value="">Select a category</option>
          {BLOG_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-dash-text-secondary mb-2">
          Excerpt *
        </label>
        <textarea
          id="excerpt"
          name="excerpt"
          value={excerpt}
          onChange={onChange}
          rows={3}
          className="w-full px-4 py-3 border border-dash-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B4D37] focus:border-[#6B4D37]"
          placeholder="Brief summary of the blog post"
          required
        />
      </div>
    </>
  );
};
