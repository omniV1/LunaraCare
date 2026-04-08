/**
 * @module components/blog/BlogManagement
 * Provider-facing blog management dashboard — lists all posts with
 * search, category/tag/author filters, and publish/unpublish/delete actions.
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { blogService, BlogPost, BlogPostFilters } from '../../services/blogService';

/** Props for the blog management list view. */
interface BlogManagementProps {
  onEditPost?: (post: BlogPost) => void;
  onCreatePost?: () => void;
}

/** Renders the searchable, filterable blog post management table for providers. */
export const BlogManagement: React.FC<BlogManagementProps> = ({ onEditPost, onCreatePost }) => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<BlogPostFilters>({
    category: undefined,
    tag: undefined,
    author: undefined,
  });

  // Extract unique categories and tags for filter options
  const categories = Array.from(new Set(blogPosts.map(p => p.category))).sort((a, b) =>
    a.localeCompare(b)
  );

  



  const tags = Array.from(new Set(blogPosts.flatMap(p => p.tags ?? []))).sort((a, b) =>
    a.localeCompare(b)
  );
  const authors = Array.from(
    new Set(blogPosts.map(p => `${p.author.firstName} ${p.author.lastName}`))
  ).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await blogService.getAllBlogPosts();
        if (!cancelled) setBlogPosts(response.posts);
      } catch {
        if (!cancelled) setError('Failed to load blog posts');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const fetchAllPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await blogService.getAllBlogPosts();
      setBlogPosts(response.posts);
    } catch {
      setError('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (post: BlogPost) => {
    try {
      const newPublishStatus = !post.isPublished;
      const updatedPost = await blogService.updateBlogPost({
        id: post.id,
        isPublished: newPublishStatus,
        publishDate: newPublishStatus ? new Date() : undefined,
      });

      setBlogPosts(prev => prev.map(p => (p.id === post.id ? updatedPost : p)));

      toast.success(
        updatedPost.isPublished
          ? 'Blog post published successfully'
          : 'Blog post unpublished successfully'
      );
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : undefined;
      toast.error(message ?? 'Failed to update blog post');
    }
  };

  const handleDeletePost = async (post: BlogPost) => {
    if (
      !globalThis.confirm(
        `Are you sure you want to delete "${post.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await blogService.deleteBlogPost(post.id);
      setBlogPosts(prev => prev.filter(p => p.id !== post.id));
      toast.success('Blog post deleted successfully');
    } catch (error: unknown) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : error instanceof Error
            ? error.message
            : undefined;
      toast.error(message ?? 'Failed to delete blog post');
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      try {
        const response = await blogService.getBlogPosts({ ...filters, search: searchQuery.trim() });
        setBlogPosts(response.posts);
      } catch {
        toast.error('Failed to search blog posts');
      }
    } else {
      fetchAllPosts();
    }
  };

  const handleFilterChange = <K extends keyof BlogPostFilters>(key: K, value: BlogPostFilters[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value ?? undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: undefined,
      tag: undefined,
      author: undefined,
    });
    setSearchQuery('');
    fetchAllPosts();
  };

  const filteredPosts = blogPosts.filter(post => {
    // Status filter
    switch (filter) {
      case 'published':
        if (!post.isPublished) return false;
        break;
      case 'drafts':
        if (post.isPublished) return false;
        break;
      default:
        break;
    }

    // Category filter
    if (filters.category && post.category !== filters.category) {
      return false;
    }

    // Tag filter
    if (filters.tag && !post.tags?.includes(filters.tag)) {
      return false;
    }

    // Author filter (by name)
    if (filters.author) {
      const authorName = `${post.author.firstName} ${post.author.lastName}`;
      if (authorName !== filters.author) {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-dash-text-secondary/80">Loading blog posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600">{error}</div>
        <button
          onClick={fetchAllPosts}
          className="mt-2 px-4 py-2 bg-[#6B4D37] text-white rounded hover:bg-[#5a402e]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        <div className="px-6 py-4 border-b border-dash-section-border">
          <h2 className="text-lg font-medium text-dash-text-primary">Manage Blog Posts</h2>
          <p className="text-sm text-dash-text-secondary/80 mt-1">
            View, edit, publish, and manage your blog posts.
          </p>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search blog posts by title, excerpt, or content..."
              className="flex-1 px-3 py-2 border border-dash-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e] transition-colors"
            >
              Search
            </button>
          </form>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-[#EDE8E0]/60 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-dash-card text-dash-text-primary shadow-sm'
                  : 'text-dash-text-secondary/80 hover:text-dash-text-primary'
              }`}
            >
              All ({blogPosts.length})
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'published'
                  ? 'bg-dash-card text-dash-text-primary shadow-sm'
                  : 'text-dash-text-secondary/80 hover:text-dash-text-primary'
              }`}
            >
              Published ({blogPosts.filter(p => p.isPublished).length})
            </button>
            <button
              onClick={() => setFilter('drafts')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'drafts'
                  ? 'bg-dash-card text-dash-text-primary shadow-sm'
                  : 'text-dash-text-secondary/80 hover:text-dash-text-primary'
              }`}
            >
              Drafts ({blogPosts.filter(p => !p.isPublished).length})
            </button>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dash-section-border">
            <div>
              <label
                htmlFor="blog-category-filter"
                className="block text-sm font-medium text-dash-text-secondary mb-2"
              >
                Category
              </label>
              <select
                id="blog-category-filter"
                value={filters.category ?? ''}
                onChange={e => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-dash-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="blog-tag-filter"
                className="block text-sm font-medium text-dash-text-secondary mb-2"
              >
                Tag
              </label>
              <select
                id="blog-tag-filter"
                value={filters.tag ?? ''}
                onChange={e => handleFilterChange('tag', e.target.value)}
                className="w-full px-3 py-2 border border-dash-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              >
                <option value="">All Tags</option>
                {tags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="blog-author-filter"
                className="block text-sm font-medium text-dash-text-secondary mb-2"
              >
                Author
              </label>
              <select
                id="blog-author-filter"
                value={filters.author ?? ''}
                onChange={e => handleFilterChange('author', e.target.value)}
                className="w-full px-3 py-2 border border-dash-border rounded-md focus:outline-none focus:ring-2 focus:ring-[#6B4D37]"
              >
                <option value="">All Authors</option>
                {authors.map(author => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 border border-dash-border text-dash-text-secondary rounded-md hover:bg-[#EDE8E0]/50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Blog Posts List */}
      <div className="bg-dash-card rounded-2xl shadow-[var(--dash-card-shadow)] border border-dash-border">
        {filteredPosts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="text-dash-text-secondary/60 mb-4">
              {(() => {
                if (searchQuery || filters.category || filters.tag || filters.author) {
                  return 'No blog posts found matching your search or filters. Try adjusting your criteria.';
                }
                if (filter === 'all') {
                  return 'No blog posts found.';
                }
                if (filter === 'published') {
                  return 'No published posts yet.';
                }
                return 'No drafts found.';
              })()}
            </div>
            {filter === 'all' && !searchQuery && !filters.category && !filters.tag && !filters.author && onCreatePost && (
              <button
                onClick={onCreatePost}
                className="px-4 py-2 bg-[#6B4D37] text-white rounded-md hover:bg-[#5a402e] transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create your first post
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-dash-section-border">
            {filteredPosts.map(post => (
              <div key={post.id} className="px-6 py-4 hover:bg-[#EDE8E0]/50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-dash-text-primary truncate">{post.title}</h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          post.isPublished
                            ? 'bg-[#3F4E4F]/10 text-[#3F4E4F]'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <p className="text-sm text-dash-text-secondary/80 mb-2 line-clamp-2">{post.excerpt}</p>

                    <div className="flex items-center space-x-4 text-xs text-dash-text-secondary/60">
                      <span>Category: {post.category}</span>
                      <span>Created: {blogService.formatDate(post.createdAt)}</span>
                      {post.publishDate && (
                        <span>Published: {blogService.formatDate(post.publishDate)}</span>
                      )}
                      <span>Views: {post.viewCount ?? 0}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => onEditPost?.(post)}
                      className="px-3 py-1 text-sm bg-[#6B4D37]/10 text-[#6B4D37] rounded hover:bg-[#6B4D37]/20 transition-colors"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handlePublishToggle(post)}
                      className={`px-3 py-1 text-sm rounded transition-colors ${
                        post.isPublished
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-[#3F4E4F]/10 text-[#3F4E4F] hover:bg-[#3F4E4F]/20'
                      }`}
                    >
                      {post.isPublished ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                      onClick={() => handleDeletePost(post)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
