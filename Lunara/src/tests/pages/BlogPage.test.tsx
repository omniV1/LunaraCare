import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import BlogPage from '../../pages/BlogPage';

jest.mock('../../services/blogService', () => ({
  blogService: {
    getBlogPosts: jest.fn(),
    formatDate: jest.fn(() => 'DATE'),
  },
}));

import { blogService } from '../../services/blogService';

describe('BlogPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading then empty state', async () => {
    blogService.getBlogPosts.mockResolvedValue({ posts: [] });
    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Loading blog posts...')).toBeInTheDocument();
    expect(await screen.findByText(/No blog posts available yet/)).toBeInTheDocument();
  });

  it('renders posts when returned', async () => {
    blogService.getBlogPosts.mockResolvedValue({
      posts: [
        { id: '1', title: 'T', excerpt: 'one two', slug: 's', createdAt: '2026-01-01', publishDate: null },
      ],
    });
    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('T')).toBeInTheDocument();
    expect(screen.getByText('Read More')).toBeInTheDocument();
    await waitFor(() => expect(blogService.formatDate).toHaveBeenCalled());
  });

  it('shows error state on failure', async () => {
    blogService.getBlogPosts.mockRejectedValue(new Error('x'));
    render(
      <MemoryRouter>
        <BlogPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Failed to load blog posts')).toBeInTheDocument();
  });
});

