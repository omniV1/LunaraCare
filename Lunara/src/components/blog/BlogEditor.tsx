import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import {
  blogService,
  CreateBlogPostData,
  UpdateBlogPostData,
  BlogPost,
} from '../../services/blogService';
import { useAuth } from '../../contexts/useAuth';
import { ApiClient } from '../../api/apiClient';
import { BlogAutoSaveStatus } from './BlogAutoSaveStatus';
import { BlogMetadataForm } from './BlogMetadataForm';
import { BlogFeaturedImage } from './BlogFeaturedImage';
import { BlogTagInput } from './BlogTagInput';
import { BlogActionButtons } from './BlogActionButtons';

// Lazy-load the content editor to keep Quill (~217 kB) out of the initial bundle
const BlogContentEditor = React.lazy(() =>
  import('./BlogContentEditor').then(mod => ({ default: mod.BlogContentEditor }))
);

interface BlogEditorProps {
  blogPost?: BlogPost;
  onSave?: (blogPost: BlogPost) => void;
  onCancel?: () => void;
}

export const BlogEditor: React.FC<BlogEditorProps> = ({ blogPost, onSave, onCancel }) => {
  const { user } = useAuth();

  // Debug logging
  // User auth state is tracked via AuthContext
  const [formData, setFormData] = useState<CreateBlogPostData>(() =>
    blogPost
      ? {
          title: blogPost.title,
          excerpt: blogPost.excerpt,
          content: blogPost.content,
          category: blogPost.category,
          tags: blogPost.tags,
          featuredImage: blogPost.featuredImage ?? '',
          isPublished: blogPost.isPublished,
        }
      : {
          title: '',
          excerpt: '',
          content: '',
          category: '',
          tags: [],
          featuredImage: '',
          isPublished: false,
        }
  );

  const [savedBlogPost, setSavedBlogPost] = useState<BlogPost | null>(blogPost ?? null);

  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(
    blogPost ? new Date(blogPost.lastSaved ?? blogPost.updatedAt) : null
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const isCreatingNew = !blogPost;

  // Auto-save timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !formData.title.trim() || !formData.content.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (blogPost || savedBlogPost) {
        // Update existing post
        const postToUpdate = blogPost || savedBlogPost;
        const updateData: UpdateBlogPostData = {
          id: postToUpdate!.id,
          ...formData,
        };
        const updatedPost = await blogService.updateBlogPost(updateData);
        setSavedBlogPost(updatedPost);
      } else {
        // Create new draft
        const newPost = await blogService.createBlogPost({
          ...formData,
          isPublished: false,
        });
        setSavedBlogPost(newPost);
      }
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (error: unknown) {
      // Auto-save failed silently - user can still manually save
      const errorMessage =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : undefined;
      toast.warning(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [formData, hasUnsavedChanges, blogPost, savedBlogPost]);

  // Set up auto-save timer
  useEffect(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (hasUnsavedChanges) {
      const timer = setTimeout(() => {
        autoSave();
      }, 30000); // Auto-save after 30 seconds of inactivity
      autoSaveTimerRef.current = timer;
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, hasUnsavedChanges, autoSave]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({ ...prev, content: value }));
    setHasUnsavedChanges(true);
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !(formData.tags ?? []).includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags ?? []), tagInput.trim()],
      }));
      setTagInput('');
      setHasUnsavedChanges(true);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags ?? []).filter(tag => tag !== tagToRemove),
    }));
    setHasUnsavedChanges(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      excerpt: '',
      content: '',
      category: '',
      tags: [],
      featuredImage: '',
      isPublished: false,
    });
    setHasUnsavedChanges(false);
    setTagInput('');
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    // Default behavior: reset form for new posts
    if (isCreatingNew) {
      resetForm();
    }
  };

  const handleCancelWithConfirmation = () => {
    if (hasUnsavedChanges) {
      const confirmed = globalThis.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmed) {
        return;
      }
    }

    handleCancel();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setImageUploading(true);
    try {
      // Upload to backend GridFS storage
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'blog/featured-images');

      const apiClient = ApiClient.getInstance();
      const result = await apiClient.post<{
        success: boolean;
        file: { fileId: string; url: string };
      }>('/files/upload', formDataUpload);

      setFormData(prev => ({
        ...prev,
        featuredImage: result.file.url,
      }));
      setHasUnsavedChanges(true);
      toast.success('Image uploaded successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      toast.error(`Failed to upload image: ${message}`);
    } finally {
      setImageUploading(false);
    }
  };

  const handleImageRemove = () => {
    setFormData(prev => ({ ...prev, featuredImage: '' }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user has permission to create blog posts
    if (user?.role !== 'provider') {
      toast.error('Only providers can create blog posts');
      return;
    }
    setIsLoading(true);

    try {
      if (!formData.title.trim()) {
        toast.error('Title is required');
        return;
      }

      if (!formData.excerpt.trim()) {
        toast.error('Excerpt is required');
        return;
      }

      if (!formData.content.trim()) {
        toast.error('Content is required');
        return;
      }

      if (!formData.category) {
        toast.error('Category is required');
        return;
      }

      let savedPost: BlogPost;

      if (blogPost || savedBlogPost) {
        // Update existing post
        const postToUpdate = blogPost || savedBlogPost;
        const updateData: UpdateBlogPostData = {
          id: postToUpdate!.id,
          ...formData,
        };
        savedPost = await blogService.updateBlogPost(updateData);
        setSavedBlogPost(savedPost);
        toast.success('Blog post updated successfully');
      } else {
        // Create new post
        savedPost = await blogService.createBlogPost(formData);
        setSavedBlogPost(savedPost);
        toast.success('Blog post created successfully');
      }

      setHasUnsavedChanges(false);
      onSave?.(savedPost);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : undefined;
      toast.error(message ?? 'Failed to save blog post');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    // Check if user has permission to create blog posts
    if (user?.role !== 'provider') {
      toast.error('Only providers can publish blog posts');
      return;
    }

    setIsLoading(true);
    try {
      const publishData = { ...formData, isPublished: true };
      let publishedPost: BlogPost;

      if (blogPost || savedBlogPost) {
        const postToUpdate = blogPost || savedBlogPost;
        const updateData: UpdateBlogPostData = {
          id: postToUpdate!.id,
          ...publishData,
        };
        publishedPost = await blogService.updateBlogPost(updateData);
        setSavedBlogPost(publishedPost);
      } else {
        publishedPost = await blogService.createBlogPost(publishData);
        setSavedBlogPost(publishedPost);
      }

      toast.success('Blog post published successfully');
      setHasUnsavedChanges(false);
      onSave?.(publishedPost);
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : undefined;
      toast.error(message ?? 'Failed to publish blog post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-dash-text-primary mb-2">
          {blogPost ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h2>

        <BlogAutoSaveStatus
          isSaving={isSaving}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <BlogMetadataForm
          title={formData.title}
          category={formData.category}
          excerpt={formData.excerpt}
          onChange={handleChange}
        />

        <BlogFeaturedImage
          featuredImage={formData.featuredImage ?? ''}
          imageUploading={imageUploading}
          onImageUpload={handleImageUpload}
          onImageRemove={handleImageRemove}
        />

        <BlogTagInput
          tags={formData.tags ?? []}
          tagInput={tagInput}
          onTagInputChange={setTagInput}
          onTagAdd={handleTagAdd}
          onTagRemove={handleTagRemove}
        />

        <Suspense fallback={<div className="h-[400px] bg-dash-card rounded-lg animate-pulse" />}>
          <BlogContentEditor
            content={formData.content}
            onContentChange={handleContentChange}
          />
        </Suspense>

        <BlogActionButtons
          isLoading={isLoading}
          isEditing={!!blogPost}
          onCancel={handleCancelWithConfirmation}
          onPublish={handlePublish}
        />
      </form>
    </div>
  );
};
