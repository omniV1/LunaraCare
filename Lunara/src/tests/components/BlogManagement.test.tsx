import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BlogManagement } from '../../components/blog/BlogManagement';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockGetAllBlogPosts = jest.fn();
const mockGetBlogPosts = jest.fn();
const mockUpdateBlogPost = jest.fn();
const mockDeleteBlogPost = jest.fn();

jest.mock('../../services/blogService', () => ({
  blogService: {
    getAllBlogPosts: (...args: unknown[]) => mockGetAllBlogPosts(...args),
    getBlogPosts: (...args: unknown[]) => mockGetBlogPosts(...args),
    updateBlogPost: (...args: unknown[]) => mockUpdateBlogPost(...args),
    deleteBlogPost: (...args: unknown[]) => mockDeleteBlogPost(...args),
    formatDate: (d: string) => new Date(d).toLocaleDateString(),
  },
}));

const posts = [
  {
    id: 'p1',
    title: 'Self-Care Tips',
    excerpt: 'Tips for new moms',
    content: 'Full content here',
    category: 'wellness',
    tags: ['self-care', 'postpartum'],
    author: { firstName: 'Jane', lastName: 'Doe' },
    isPublished: true,
    publishDate: '2026-03-10T00:00:00Z',
    createdAt: '2026-03-01T00:00:00Z',
    viewCount: 42,
  },
  {
    id: 'p2',
    title: 'Sleep Guide Draft',
    excerpt: 'A guide to infant sleep',
    content: 'Draft content',
    category: 'education',
    tags: ['sleep'],
    author: { firstName: 'Jane', lastName: 'Doe' },
    isPublished: false,
    createdAt: '2026-03-05T00:00:00Z',
    viewCount: 0,
  },
];

describe('BlogManagement', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading state initially', () => {
    mockGetAllBlogPosts.mockReturnValue(new Promise(() => {}));
    render(<BlogManagement />);
    expect(screen.getByText('Loading blog posts...')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', async () => {
    mockGetAllBlogPosts.mockRejectedValueOnce(new Error('fail'));
    render(<BlogManagement />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load blog posts')).toBeInTheDocument();
    });
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders posts after successful load', async () => {
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts });
    render(<BlogManagement />);
    await waitFor(() => {
      expect(screen.getByText('Self-Care Tips')).toBeInTheDocument();
    });
    expect(screen.getByText('Sleep Guide Draft')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('shows filter tabs with counts', async () => {
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts });
    render(<BlogManagement />);
    await waitFor(() => {
      expect(screen.getByText('All (2)')).toBeInTheDocument();
    });
    expect(screen.getByText('Published (1)')).toBeInTheDocument();
    expect(screen.getByText('Drafts (1)')).toBeInTheDocument();
  });

  it('filters by published tab', async () => {
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts });
    render(<BlogManagement />);
    await waitFor(() => screen.getByText('Self-Care Tips'));
    fireEvent.click(screen.getByText('Published (1)'));
    expect(screen.getByText('Self-Care Tips')).toBeInTheDocument();
    expect(screen.queryByText('Sleep Guide Draft')).not.toBeInTheDocument();
  });

  it('filters by drafts tab', async () => {
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts });
    render(<BlogManagement />);
    await waitFor(() => screen.getByText('Self-Care Tips'));
    fireEvent.click(screen.getByText('Drafts (1)'));
    expect(screen.queryByText('Self-Care Tips')).not.toBeInTheDocument();
    expect(screen.getByText('Sleep Guide Draft')).toBeInTheDocument();
  });

  it('shows category and post details', async () => {
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts });
    render(<BlogManagement />);
    await waitFor(() => {
      expect(screen.getByText('Category: wellness')).toBeInTheDocument();
    });
    expect(screen.getByText('Views: 42')).toBeInTheDocument();
  });

  it('calls onEditPost when Edit clicked', async () => {
    const onEditPost = jest.fn();
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts });
    render(<BlogManagement onEditPost={onEditPost} />);
    await waitFor(() => screen.getByText('Self-Care Tips'));
    const editBtns = screen.getAllByText('Edit');
    fireEvent.click(editBtns[0]);
    expect(onEditPost).toHaveBeenCalledWith(posts[0]);
  });

  it('toggles publish status', async () => {
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts });
    mockUpdateBlogPost.mockResolvedValueOnce({ ...posts[0], isPublished: false });
    render(<BlogManagement />);
    await waitFor(() => screen.getByText('Self-Care Tips'));
    const unpublishBtn = screen.getAllByText('Unpublish')[0];
    fireEvent.click(unpublishBtn);
    await waitFor(() => {
      expect(mockUpdateBlogPost).toHaveBeenCalledWith(expect.objectContaining({
        id: 'p1',
        isPublished: false,
      }));
    });
  });

  it('renders search input and button', async () => {
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts });
    render(<BlogManagement />);
    await waitFor(() => screen.getByText('Manage Blog Posts'));
    expect(screen.getByPlaceholderText(/Search blog posts/)).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  it('renders filter selects', async () => {
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts });
    render(<BlogManagement />);
    await waitFor(() => screen.getByText('Manage Blog Posts'));
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Tag')).toBeInTheDocument();
    expect(screen.getByLabelText('Author')).toBeInTheDocument();
  });

  it('shows empty state when no posts', async () => {
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts: [] });
    render(<BlogManagement />);
    await waitFor(() => {
      expect(screen.getByText('No blog posts found.')).toBeInTheDocument();
    });
  });

  it('shows create button when no posts and onCreatePost provided', async () => {
    const onCreatePost = jest.fn();
    mockGetAllBlogPosts.mockResolvedValueOnce({ posts: [] });
    render(<BlogManagement onCreatePost={onCreatePost} />);
    await waitFor(() => {
      expect(screen.getByText('Create your first post')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Create your first post'));
    expect(onCreatePost).toHaveBeenCalled();
  });
});
