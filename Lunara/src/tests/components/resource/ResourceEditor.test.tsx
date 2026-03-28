import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { ResourceEditor } from '../../../components/resource/ResourceEditor';

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn() },
}));

const mockUseResource = jest.fn();
jest.mock('../../../contexts/useResource', () => ({
  useResource: () => mockUseResource(),
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

describe('ResourceEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates required fields and creates resource', async () => {
    const createResource = jest.fn().mockResolvedValue(undefined);
    const updateResource = jest.fn().mockResolvedValue(undefined);
    const loadResource = jest.fn().mockResolvedValue(undefined);
    const loadCategories = jest.fn().mockResolvedValue(undefined);
    const onSave = jest.fn();

    mockUseResource.mockReturnValue({
      selectedResource: null,
      loadResource,
      createResource,
      updateResource,
      categories: [{ id: 'c1', name: 'Cat' }],
      loadCategories,
      loading: false,
      error: null,
    });

    render(<ResourceEditor onSave={onSave} />);

    // initial effect
    await waitFor(() => expect(loadCategories).toHaveBeenCalled());

    // Bypass native `required` blocking by using whitespace values; component validates via `.trim()`
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Description *'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Content *'), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('button', { name: /Create Resource/i }).closest('form')!);
    expect(screen.getByText('Title is required')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'T' } });
    fireEvent.submit(screen.getByRole('button', { name: /Create Resource/i }).closest('form')!);
    expect(screen.getByText('Description is required')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Description *'), { target: { value: 'D' } });
    fireEvent.change(screen.getByLabelText('Content *'), { target: { value: 'C' } });
    fireEvent.submit(screen.getByRole('button', { name: /Create Resource/i }).closest('form')!);
    expect(screen.getByText('Category is required')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'c1' } });
    fireEvent.submit(screen.getByRole('button', { name: /Create Resource/i }).closest('form')!);

    await waitFor(() => expect(createResource).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(updateResource).not.toHaveBeenCalled();
  });

  it('updates resource when resourceId is provided', async () => {
    const createResource = jest.fn().mockResolvedValue(undefined);
    const updateResource = jest.fn().mockResolvedValue(undefined);
    const loadResource = jest.fn().mockResolvedValue(undefined);
    const loadCategories = jest.fn().mockResolvedValue(undefined);

    mockUseResource.mockReturnValue({
      selectedResource: {
        id: 'r1',
        title: 'Old',
        description: 'OldD',
        content: 'OldC',
        category: { id: 'c1', name: 'Cat' },
        tags: [],
        targetWeeks: [],
        targetPregnancyWeeks: [],
        difficulty: 'beginner',
        isPublished: false,
      },
      loadResource,
      createResource,
      updateResource,
      categories: [{ id: 'c1', name: 'Cat' }],
      loadCategories,
      loading: false,
      error: null,
    });

    render(<ResourceEditor resourceId="r1" />);
    await waitFor(() => expect(loadResource).toHaveBeenCalledWith('r1'));

    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'New' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Resource/i }));
    await waitFor(() => expect(updateResource).toHaveBeenCalledWith('r1', expect.objectContaining({ title: 'New' })));
    expect(createResource).not.toHaveBeenCalled();
  });

  it('shows toast when save throws', async () => {
    const createResource = jest.fn().mockRejectedValue(new Error('x'));
    mockUseResource.mockReturnValue({
      selectedResource: null,
      loadResource: jest.fn().mockResolvedValue(undefined),
      createResource,
      updateResource: jest.fn().mockResolvedValue(undefined),
      categories: [{ id: 'c1', name: 'Cat' }],
      loadCategories: jest.fn().mockResolvedValue(undefined),
      loading: false,
      error: null,
    });

    render(<ResourceEditor />);
    fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'T' } });
    fireEvent.change(screen.getByLabelText('Description *'), { target: { value: 'D' } });
    fireEvent.change(screen.getByLabelText('Content *'), { target: { value: 'C' } });
    fireEvent.change(screen.getByLabelText('Category *'), { target: { value: 'c1' } });
    fireEvent.click(screen.getByRole('button', { name: /Create Resource/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to save resource'));
  });
});

