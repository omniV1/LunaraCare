import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useResource } from '../../contexts/useResource';
import { Card } from '../ui/Card';
import { CreateResourceData } from '../../services/resourceService';

interface ResourceEditorProps {
  resourceId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export const ResourceEditor: React.FC<ResourceEditorProps> = ({ resourceId, onSave, onCancel }) => {
  const {
    selectedResource,
    loadResource,
    createResource,
    updateResource,
    categories,
    loadCategories,
    loading,
    error,
  } = useResource();

  const [formData, setFormData] = useState<CreateResourceData>({
    title: '',
    description: '',
    content: '',
    category: '',
    tags: [],
    targetWeeks: [],
    targetPregnancyWeeks: [],
    difficulty: 'beginner',
    isPublished: false,
  });
  const [formError, setFormError] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadCategories();
    if (resourceId) {
      loadResource(resourceId);
    }
  }, [resourceId, loadCategories, loadResource]);

  useEffect(() => {
    if (selectedResource) {
      setFormData({
        title: selectedResource.title,
        description: selectedResource.description,
        content: selectedResource.content,
        category: selectedResource.category.id,
        tags: selectedResource.tags,
        targetWeeks: selectedResource.targetWeeks,
        targetPregnancyWeeks: selectedResource.targetPregnancyWeeks,
        difficulty: selectedResource.difficulty,
        isPublished: selectedResource.isPublished,
      });
    }
  }, [selectedResource]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError('');
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !(formData.tags ?? []).includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags ?? []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags ?? []).filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.title.trim()) {
      setFormError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setFormError('Description is required');
      return;
    }

    if (!formData.content.trim()) {
      setFormError('Content is required');
      return;
    }

    if (!formData.category) {
      setFormError('Category is required');
      return;
    }

    try {
      if (resourceId) {
        await updateResource(resourceId, formData);
      } else {
        await createResource(formData);
      }
      onSave?.();
    } catch {
      toast.error('Failed to save resource');
    }
  };

  if (loading && resourceId) {
    return (
      <Card className="p-6 sm:p-8 text-center">
        <div className="text-sage-600">Loading...</div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
      <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-sage-800 mb-4 sm:mb-6">
            {resourceId ? 'Edit Resource' : 'Create New Resource'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-sage-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-2 min-h-[44px] border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 text-base"
              placeholder="Enter resource title"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-sage-700 mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-2 min-h-[44px] border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 text-base"
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-sage-700 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2.5 sm:py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 text-base min-h-[88px]"
            placeholder="Brief description of the resource"
            required
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-sage-700 mb-2">
            Content *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={8}
            className="w-full px-3 py-2.5 sm:py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 text-base min-h-[180px] sm:min-h-[240px]"
            placeholder="Write your resource content here..."
            required
          />
        </div>

        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-sage-700 mb-2">
            Difficulty Level
          </label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full sm:max-w-xs px-3 py-2.5 sm:py-2 min-h-[44px] border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 text-base"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="resource-target-pregnancy-weeks"
              className="block text-sm font-medium text-sage-700 mb-2"
            >
              Target Pregnancy Weeks
            </label>
            <p className="text-xs text-sage-600 mb-1.5">Tap to select multiple</p>
            <select
              id="resource-target-pregnancy-weeks"
              multiple
              value={(formData.targetPregnancyWeeks ?? []).map(String)}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, opt => parseInt(opt.value, 10));
                setFormData(prev => ({ ...prev, targetPregnancyWeeks: selected }));
              }}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[120px] sm:min-h-[140px] bg-white text-base touch-manipulation"
            >
              {Array.from({ length: 42 }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="resource-target-postpartum-weeks"
              className="block text-sm font-medium text-sage-700 mb-2"
            >
              Target Postpartum Weeks
            </label>
            <p className="text-xs text-sage-600 mb-1.5">Tap to select multiple</p>
            <select
              id="resource-target-postpartum-weeks"
              multiple
              value={(formData.targetWeeks ?? []).map(String)}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions, opt => parseInt(opt.value, 10));
                setFormData(prev => ({ ...prev, targetWeeks: selected }));
              }}
              className="w-full px-3 py-2 border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 min-h-[120px] sm:min-h-[140px] bg-white text-base touch-manipulation"
            >
              {Array.from({ length: 52 }, (_, i) => i + 1).map(week => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="resource-tags-input"
            className="block text-sm font-medium text-sage-700 mb-2"
          >
            Tags
          </label>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <input
              id="resource-tags-input"
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTagAdd();
                }
              }}
              className="flex-1 px-3 py-2.5 sm:py-2 min-h-[44px] border border-sage-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 text-base"
              placeholder="Add a tag and press Enter"
            />
            <button
              type="button"
              onClick={handleTagAdd}
              className="px-4 py-2.5 sm:py-2 min-h-[44px] bg-sage-500 text-white rounded-md hover:bg-sage-600 touch-manipulation"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(formData.tags ?? []).map(tag => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1.5 sm:py-1 min-h-[32px] bg-sage-100 text-sage-800 rounded-full text-sm"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="ml-2 p-1 min-w-[28px] min-h-[28px] text-sage-600 hover:text-sage-800 touch-manipulation"
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 min-h-[44px]">
          <input
            type="checkbox"
            id="isPublished"
            name="isPublished"
            checked={formData.isPublished}
            onChange={e => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
            className="h-5 w-5 shrink-0 text-sage-600 focus:ring-sage-500 border-sage-300 rounded touch-manipulation"
          />
          <label htmlFor="isPublished" className="block text-sm text-sage-700 cursor-pointer">
            Publish this resource
          </label>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t border-sage-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 sm:py-2 border border-sage-300 text-sage-700 rounded-md hover:bg-sage-50 transition-colors touch-manipulation"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 sm:py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md z-10 relative touch-manipulation"
          >
            {(() => {
              if (loading) return 'Saving...';
              return resourceId ? 'Update Resource' : 'Create Resource';
            })()}
          </button>
        </div>
      </form>
    </Card>
  );
};
