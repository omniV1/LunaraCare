import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
}));

jest.mock('../../../components/ui/RichTextEditor', () => ({
  RichTextEditor: (props: any) => (
    <textarea
      aria-label="Content"
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    />
  ),
}));

const mockUseAuth = jest.fn();
jest.mock('../../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const blogService = {
  createBlogPost: jest.fn(),
  updateBlogPost: jest.fn(),
};
jest.mock('../../../services/blogService', () => ({
  blogService,
}));

const api = { post: jest.fn() };
jest.mock('../../../api/apiClient', () => ({
  ApiClient: { getInstance: () => api },
}));

import { BlogEditor } from '../../../components/blog/BlogEditor';

describe('BlogEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { role: 'provider' } });
  });

  it('creates a draft and then publishes', async () => {
    blogService.createBlogPost.mockResolvedValueOnce({ id: 'p1' }); // draft
    blogService.updateBlogPost.mockResolvedValueOnce({ id: 'p1' }); // publish update

    render(<BlogEditor />);

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'T' } });
    fireEvent.change(screen.getByLabelText('Excerpt *'), { target: { value: 'E' } });
    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'General' } });
    const contentInput = await screen.findByLabelText(/^Content/);
    fireEvent.change(contentInput, { target: { value: 'C' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    await waitFor(() => expect(blogService.createBlogPost).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith('Blog post created successfully');

    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(blogService.updateBlogPost).toHaveBeenCalledTimes(1));
    expect(toast.success).toHaveBeenCalledWith('Blog post published successfully');
  });

  it('blocks non-provider save/publish', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'client' } });
    render(<BlogEditor />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

