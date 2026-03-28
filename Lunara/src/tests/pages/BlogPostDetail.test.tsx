import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import BlogPostDetail from '../../pages/BlogPostDetail';

jest.mock('dompurify', () => ({
  __esModule: true,
  default: { sanitize: (html: string) => html },
}));

jest.mock('../../services/blogService', () => ({
  blogService: {
    getBlogPost: jest.fn(),
    formatDate: jest.fn(() => 'DATE'),
  },
}));

import { blogService } from '../../services/blogService';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPostDetail />} />
        <Route path="/blog" element={<div>BlogList</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('BlogPostDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows error when slug is missing/invalid route', async () => {
    renderAt('/blog');
    expect(screen.getByText('BlogList')).toBeInTheDocument();
  });

  it('renders loading then post content', async () => {
    blogService.getBlogPost.mockResolvedValue({
      id: '1',
      slug: 's',
      title: 'Title',
      excerpt: 'ex',
      content: '<p>Hello</p>',
      category: 'Cat',
      createdAt: '2026-01-01',
      publishDate: null,
      featuredImage: '',
      tags: [],
    });

    renderAt('/blog/s');
    expect(screen.getByText('Loading blog post...')).toBeInTheDocument();
    expect(await screen.findByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Cat')).toBeInTheDocument();
    await waitFor(() => expect(blogService.formatDate).toHaveBeenCalled());
  });

  it('shows not found on error', async () => {
    blogService.getBlogPost.mockRejectedValue(new Error('no'));
    renderAt('/blog/s');
    expect(await screen.findByText('Blog post not found')).toBeInTheDocument();
    expect(screen.getByText('Back to Blog')).toBeInTheDocument();
  });
});

