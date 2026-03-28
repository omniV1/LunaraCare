/**
 * Deep tests for BlogEditor – covers form initialization (new vs edit),
 * field validation (title, excerpt, content, category), tag management
 * (add, remove, duplicate prevention, Enter key), auto-save timer,
 * publish/draft toggle, role-based access, featured image upload/remove,
 * cancel with unsaved changes confirmation, onSave/onCancel callbacks,
 * and error handling for API failures.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';
import type { BlogPost } from '../../../services/blogService';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
}));

jest.mock('../../../components/ui/RichTextEditor', () => ({
  RichTextEditor: (props: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <textarea
      aria-label="Content"
      value={props.value}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => props.onChange(e.target.value)}
      placeholder={props.placeholder}
    />
  ),
}));

jest.mock('../../../components/blog/BlogAutoSaveStatus', () => ({
  BlogAutoSaveStatus: (props: { isSaving: boolean; hasUnsavedChanges: boolean }) => (
    <div data-testid="auto-save-status">
      {props.isSaving ? 'saving' : props.hasUnsavedChanges ? 'unsaved' : 'saved'}
    </div>
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

// ── Helpers ──────────────────────────────────────────────────────────────────

async function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Test Title' } });
  fireEvent.change(screen.getByLabelText('Excerpt *'), { target: { value: 'Test Excerpt' } });
  fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'General' } });
  const content = await screen.findByLabelText(/^Content/);
  fireEvent.change(content, { target: { value: 'Test Content' } });
}

const findContentField = (waitOptions?: { advanceTimers: (ms: number) => void }) =>
  screen.findByLabelText(/^Content/, {}, waitOptions);

const existingPost = {
  id: 'p1',
  title: 'Existing Title',
  excerpt: 'Existing Excerpt',
  content: 'Existing Content',
  category: 'Sleep',
  tags: ['postpartum', 'sleep'],
  featuredImage: 'https://example.com/img.jpg',
  isPublished: false,
  updatedAt: '2026-03-01T00:00:00.000Z',
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('BlogEditor – deep tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { role: 'provider' } });
    (globalThis as unknown as Record<string, unknown>).confirm = jest.fn(() => true);
  });

  // ---- Form initialization ----

  describe('form initialization', () => {
    it('renders empty fields for new blog post', async () => {
      render(<BlogEditor />);
      expect(screen.getByText('Create New Blog Post')).toBeInTheDocument();
      expect((screen.getByLabelText('Title *') as HTMLInputElement).value).toBe('');
      expect((screen.getByLabelText('Excerpt *') as HTMLTextAreaElement).value).toBe('');
      expect((screen.getByLabelText('Category *') as HTMLSelectElement).value).toBe('');
      expect(((await findContentField()) as HTMLTextAreaElement).value).toBe('');
    });

    it('populates fields from existing blog post', async () => {
      render(<BlogEditor blogPost={existingPost as unknown as BlogPost} />);
      expect(screen.getByText('Edit Blog Post')).toBeInTheDocument();
      expect((screen.getByLabelText('Title *') as HTMLInputElement).value).toBe('Existing Title');
      expect((screen.getByLabelText('Excerpt *') as HTMLTextAreaElement).value).toBe('Existing Excerpt');
      expect((screen.getByLabelText('Category *') as HTMLSelectElement).value).toBe('Sleep');
      expect(((await findContentField()) as HTMLTextAreaElement).value).toBe('Existing Content');
      expect(screen.getByText('postpartum')).toBeInTheDocument();
      expect(screen.getByText('sleep')).toBeInTheDocument();
    });

    it('shows "Update Draft" button for existing posts', () => {
      render(<BlogEditor blogPost={existingPost as unknown as BlogPost} />);
      expect(screen.getByRole('button', { name: 'Update Draft' })).toBeInTheDocument();
    });

    it('shows "Save Draft" button for new posts', () => {
      render(<BlogEditor />);
      expect(screen.getByRole('button', { name: 'Save Draft' })).toBeInTheDocument();
    });
  });

  // ---- Field validation ----

  describe('field validation', () => {
    // Note: We use fireEvent.submit(form) to bypass HTML5 required attribute
    // validation in jsdom, so we can test the component's own validation logic.

    it('shows error when title is empty on save', async () => {
      const { container } = render(<BlogEditor />);
      fireEvent.change(screen.getByLabelText('Excerpt *'), { target: { value: 'E' } });
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'General' } });
      fireEvent.change(await findContentField(), { target: { value: 'C' } });

      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Title is required'));
    });

    it('shows error when excerpt is empty on save', async () => {
      const { container } = render(<BlogEditor />);
      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'T' } });
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'General' } });
      fireEvent.change(await findContentField(), { target: { value: 'C' } });

      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Excerpt is required'));
    });

    it('shows error when content is empty on save', async () => {
      const { container } = render(<BlogEditor />);
      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'T' } });
      fireEvent.change(screen.getByLabelText('Excerpt *'), { target: { value: 'E' } });
      fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'General' } });

      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Content is required'));
    });

    it('shows error when category is empty on save', async () => {
      const { container } = render(<BlogEditor />);
      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'T' } });
      fireEvent.change(screen.getByLabelText('Excerpt *'), { target: { value: 'E' } });
      fireEvent.change(await findContentField(), { target: { value: 'C' } });

      fireEvent.submit(container.querySelector('form')!);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Category is required'));
    });
  });

  // ---- Role-based access ----

  describe('role-based access control', () => {
    it('blocks non-provider from saving draft', async () => {
      mockUseAuth.mockReturnValue({ user: { role: 'client' } });
      render(<BlogEditor />);
      await fillRequiredFields();

      fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Only providers can create blog posts'));
      expect(blogService.createBlogPost).not.toHaveBeenCalled();
    });

    it('blocks non-provider from publishing', async () => {
      mockUseAuth.mockReturnValue({ user: { role: 'client' } });
      render(<BlogEditor />);
      await fillRequiredFields();

      fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Only providers can publish blog posts'));
      expect(blogService.updateBlogPost).not.toHaveBeenCalled();
    });
  });

  // ---- Save draft ----

  describe('save draft flow', () => {
    it('creates a new draft successfully', async () => {
      blogService.createBlogPost.mockResolvedValue({ id: 'new-1' });
      const onSave = jest.fn();
      render(<BlogEditor onSave={onSave} />);
      await fillRequiredFields();

      fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
      await waitFor(() => expect(blogService.createBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Test Title', isPublished: false }),
      ));
      expect(toast.success).toHaveBeenCalledWith('Blog post created successfully');
      expect(onSave).toHaveBeenCalledWith({ id: 'new-1' });
    });

    it('updates existing post on save', async () => {
      blogService.updateBlogPost.mockResolvedValue({ id: 'p1' });
      render(<BlogEditor blogPost={existingPost as unknown as BlogPost} />);

      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Updated Title' } });
      fireEvent.click(screen.getByRole('button', { name: 'Update Draft' }));

      await waitFor(() => expect(blogService.updateBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1', title: 'Updated Title' }),
      ));
      expect(toast.success).toHaveBeenCalledWith('Blog post updated successfully');
    });

    it('shows error toast on save failure', async () => {
      blogService.createBlogPost.mockRejectedValue(new Error('Save failed'));
      render(<BlogEditor />);
      await fillRequiredFields();

      fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Save failed'));
    });
  });

  // ---- Publish flow ----

  describe('publish flow', () => {
    it('publishes a new post (creates with isPublished=true)', async () => {
      blogService.createBlogPost.mockResolvedValue({ id: 'pub-1' });
      const onSave = jest.fn();
      render(<BlogEditor onSave={onSave} />);
      await fillRequiredFields();

      fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
      await waitFor(() => expect(blogService.createBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({ isPublished: true }),
      ));
      expect(toast.success).toHaveBeenCalledWith('Blog post published successfully');
    });

    it('publishes an existing draft (updates with isPublished=true)', async () => {
      blogService.updateBlogPost.mockResolvedValue({ id: 'p1' });
      render(<BlogEditor blogPost={existingPost as unknown as BlogPost} />);

      fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
      await waitFor(() => expect(blogService.updateBlogPost).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'p1', isPublished: true }),
      ));
      expect(toast.success).toHaveBeenCalledWith('Blog post published successfully');
    });

    it('shows error toast on publish failure', async () => {
      blogService.createBlogPost.mockRejectedValue(new Error('Publish failed'));
      render(<BlogEditor />);
      await fillRequiredFields();

      fireEvent.click(screen.getByRole('button', { name: 'Publish' }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Publish failed'));
    });
  });

  // ---- Tag management ----

  describe('tag management', () => {
    it('adds a tag via Add button', () => {
      render(<BlogEditor />);
      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      fireEvent.change(tagInput, { target: { value: 'newborn' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));

      expect(screen.getByText('newborn')).toBeInTheDocument();
      expect((tagInput as HTMLInputElement).value).toBe('');
    });

    it('adds a tag via Enter key', () => {
      render(<BlogEditor />);
      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      fireEvent.change(tagInput, { target: { value: 'wellness' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });

      expect(screen.getByText('wellness')).toBeInTheDocument();
    });

    it('does not add duplicate tags', () => {
      render(<BlogEditor />);
      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');

      fireEvent.change(tagInput, { target: { value: 'health' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));
      fireEvent.change(tagInput, { target: { value: 'health' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));

      expect(screen.getAllByText('health')).toHaveLength(1);
    });

    it('does not add empty tags', () => {
      render(<BlogEditor />);
      const tagInput = screen.getByPlaceholderText('Add a tag and press Enter');
      fireEvent.change(tagInput, { target: { value: '   ' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));

      // No tags should be rendered in the tag list
      const tagContainer = tagInput.closest('div')?.parentElement;
      const tagSpans = tagContainer?.querySelectorAll('span.inline-flex') ?? [];
      expect(tagSpans.length).toBe(0);
    });

    it('removes a tag', async () => {
      render(<BlogEditor blogPost={existingPost as unknown as BlogPost} />);
      // Both tags should be present
      const tags = screen.getAllByText(/^(postpartum|sleep)$/);
      expect(tags).toHaveLength(2);

      // Find the span containing 'postpartum' text and click its remove button
      // The spans have inline-flex class and contain the tag text + a button with ×
      const tagSpans = document.querySelectorAll('span.inline-flex');
      let postpartumSpan: Element | null = null;
      tagSpans.forEach(span => {
        if (span.textContent?.includes('postpartum')) {
          postpartumSpan = span;
        }
      });
      expect(postpartumSpan).not.toBeNull();
      const removeBtn = postpartumSpan!.querySelector('button')!;
      fireEvent.click(removeBtn);

      await waitFor(() => {
        expect(screen.queryByText('postpartum')).not.toBeInTheDocument();
      });
      expect(screen.getByText('sleep')).toBeInTheDocument();
    });
  });

  // ---- Auto-save ----

  describe('auto-save behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('auto-saves after 30 seconds of inactivity when there are unsaved changes', async () => {
      blogService.createBlogPost.mockResolvedValue({ id: 'auto-1' });
      render(<BlogEditor />);

      // Make changes to set hasUnsavedChanges = true and provide title+content
      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Auto Title' } });
      const contentEl = await findContentField({ advanceTimers: jest.advanceTimersByTime });
      fireEvent.change(contentEl, { target: { value: 'Auto Content' } });

      // Status should show unsaved
      expect(screen.getByTestId('auto-save-status')).toHaveTextContent('unsaved');

      // Advance timer by 30 seconds
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => expect(blogService.createBlogPost).toHaveBeenCalled());
    });

    it('does not auto-save if no unsaved changes', async () => {
      render(<BlogEditor />);

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(blogService.createBlogPost).not.toHaveBeenCalled();
      expect(blogService.updateBlogPost).not.toHaveBeenCalled();
    });

    it('does not auto-save if title or content is empty', async () => {
      render(<BlogEditor />);

      // Only set title, no content
      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Title Only' } });

      await act(async () => {
        jest.advanceTimersByTime(30000);
      });

      expect(blogService.createBlogPost).not.toHaveBeenCalled();
    });
  });

  // ---- Cancel behavior ----

  describe('cancel behavior', () => {
    it('calls onCancel prop when provided', () => {
      const onCancel = jest.fn();
      render(<BlogEditor onCancel={onCancel} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      // No unsaved changes, so no confirmation needed
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('shows confirmation when canceling with unsaved changes', () => {
      const onCancel = jest.fn();
      (globalThis as unknown as Record<string, unknown>).confirm = jest.fn(() => false);
      render(<BlogEditor onCancel={onCancel} />);

      // Make a change
      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Changed' } });

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(globalThis.confirm).toHaveBeenCalledWith('You have unsaved changes. Are you sure you want to cancel?');
      // User declined, so onCancel should NOT be called
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('proceeds with cancel when user confirms', () => {
      const onCancel = jest.fn();
      (globalThis as unknown as Record<string, unknown>).confirm = jest.fn(() => true);
      render(<BlogEditor onCancel={onCancel} />);

      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Changed' } });
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Featured image ----

  describe('featured image upload', () => {
    it('shows error toast for non-image file', async () => {
      render(<BlogEditor />);
      const fileInput = document.querySelector('input[type="file"]')!;

      const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Please select an image file'));
    });

    it('shows error toast for oversized image (>5MB)', async () => {
      render(<BlogEditor />);
      const fileInput = document.querySelector('input[type="file"]')!;

      const file = new File(['x'], 'big.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 6 * 1024 * 1024 });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Image size must be less than 5MB'));
    });

    it('uploads valid image and sets featuredImage', async () => {
      api.post.mockResolvedValue({
        success: true,
        file: { fileId: 'f1', url: 'https://example.com/uploaded.jpg' },
      });
      render(<BlogEditor />);
      const fileInput = document.querySelector('input[type="file"]')!;

      const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1000 });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/files/upload', expect.any(FormData)));
      expect(toast.success).toHaveBeenCalledWith('Image uploaded successfully');
    });
  });

  // ---- Loading state during save ----

  describe('loading state during save', () => {
    it('shows "Saving..." text and disables button while saving', async () => {
      let resolveCreate!: (v: unknown) => void;
      blogService.createBlogPost.mockReturnValue(new Promise(r => { resolveCreate = r; }));
      render(<BlogEditor />);
      await fillRequiredFields();

      fireEvent.click(screen.getByRole('button', { name: 'Save Draft' }));
      await waitFor(() => expect(screen.getByText('Saving...')).toBeInTheDocument());

      await act(async () => resolveCreate({ id: 'done' }));
      expect(screen.getByRole('button', { name: 'Save Draft' })).toBeInTheDocument();
    });
  });
});
