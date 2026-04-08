/**
 * @module components/blog/BlogFeaturedImage
 * Featured-image picker for blog posts — handles upload input, preview
 * thumbnail with remove button, and an uploading spinner.
 */
import React from 'react';

/** Props for the featured-image upload/preview section. */
export interface BlogFeaturedImageProps {
  featuredImage: string;
  imageUploading: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageRemove: () => void;
}

/** Renders the featured image file input, preview, and upload progress. */
export const BlogFeaturedImage: React.FC<BlogFeaturedImageProps> = ({
  featuredImage,
  imageUploading,
  onImageUpload,
  onImageRemove,
}) => {
  return (
    <div>
      <label htmlFor="featuredImage" className="block text-sm font-medium text-dash-text-secondary mb-2">
        Featured Image
      </label>
      <div className="space-y-4">
        <input
          type="file"
          id="featuredImage"
          accept="image/*"
          onChange={onImageUpload}
          disabled={imageUploading}
          className="block w-full text-sm text-dash-text-secondary/60 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#6B4D37]/5 file:text-[#6B4D37] hover:file:bg-[#6B4D37]/10"
        />
        {featuredImage && (
          <div className="relative">
            <img
              src={featuredImage}
              alt="Featured"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={onImageRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
        {imageUploading && (
          <div className="flex items-center gap-2 text-[#6B4D37]">
            <div className="w-4 h-4 border-2 border-[#6B4D37] border-t-transparent rounded-full animate-spin"></div>
            Uploading image...
          </div>
        )}
      </div>
    </div>
  );
};
