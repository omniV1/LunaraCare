/**
 * @module components/provider/tabs/BlogTab
 * Blog and resource management tab: create/edit posts, manage existing
 * posts, create resources, and browse the resource library.
 */
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { BlogManagement } from '../../blog/BlogManagement';
import { BlogEditor as BlogPostEditor } from '../../blog/BlogEditor';
import { ResourceEditor } from '../../resource/ResourceEditor';
import { ResourceLibrary } from '../../resource/ResourceLibrary';
import { ResourceViewModal } from '../../resource/ResourceViewModal';
import type { Resource } from '../../../services/resourceService';
import type { BlogPost } from '../../../services/blogService';

/** Tabbed blog post editor/manager combined with resource creation and library. */
export const BlogTab: React.FC = () => {
  const [blogSubTab, setBlogSubTab] = useState<'manage' | 'create'>('manage');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  return (
    <div className="space-y-6">
      {/* Blog Sub-tabs */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
          <div className="flex space-x-1 bg-[#EDE8E0]/60 rounded-lg p-1">
            <button
              onClick={() => setBlogSubTab('manage')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                blogSubTab === 'manage'
                  ? 'bg-dash-card text-dash-text-primary shadow-sm'
                  : 'text-dash-text-secondary/80 hover:text-dash-text-primary'
              }`}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Manage Posts
            </button>
            <button
              onClick={() => setBlogSubTab('create')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                blogSubTab === 'create'
                  ? 'bg-dash-card text-dash-text-primary shadow-sm'
                  : 'text-dash-text-secondary/80 hover:text-dash-text-primary'
              }`}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Post
            </button>
          </div>
        </div>
      </div>

      {/* Blog Content */}
      {blogSubTab === 'manage' ? (
        <BlogManagement
          onEditPost={post => {
            setEditingPost(post);
            setBlogSubTab('create');
          }}
          onCreatePost={() => setBlogSubTab('create')}
        />
      ) : (
        <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
          <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
            <h2 className="text-lg font-medium text-dash-text-primary">
              {editingPost ? `Edit: ${editingPost.title}` : 'Create New Blog Post'}
            </h2>
            <p className="text-sm text-dash-text-secondary/80 mt-1">
              Write and publish blog posts to share knowledge with your clients and the
              community.
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <BlogPostEditor
              blogPost={editingPost ?? undefined}
              onSave={() => {
                const wasEditing = !!editingPost;
                setEditingPost(null);
                toast.success(
                  wasEditing ? 'Blog post updated successfully' : 'Blog post created successfully'
                );
              }}
              onCancel={() => {
                setEditingPost(null);
                if (blogSubTab === 'create') {
                  setBlogSubTab('manage');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Resources Section (moved from separate tab) */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
          <h2 className="text-lg font-medium text-dash-text-primary">Create New Resource</h2>
        </div>
        <div className="p-4 sm:p-6">
          <ResourceEditor />
        </div>
      </div>
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        <div className="px-4 sm:px-6 py-4 border-b border-dash-section-border">
          <h2 className="text-lg font-medium text-dash-text-primary">Resource Library</h2>
        </div>
        <div className="p-4 sm:p-6">
          <ResourceLibrary onResourceSelect={setSelectedResource} />
        </div>
      </div>
      <ResourceViewModal resource={selectedResource} onClose={() => setSelectedResource(null)} />
    </div>
  );
};
