import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';
import type { CreateCategoryData, UpdateCategoryData } from '../../services/resourceService';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn() },
}));

const svc = {
  getCategories: jest.fn(),
  getCategory: jest.fn(),
  createCategory: jest.fn(),
  updateCategory: jest.fn(),
  deleteCategory: jest.fn(),
};

jest.mock('../../services/resourceService', () => ({
  ResourceService: { getInstance: () => svc },
}));

import { useCategoryOperations } from '../../hooks/useCategoryOperations';

function Harness({ handleError }: { handleError: (error: unknown, operation: string) => void }) {
  const ops = useCategoryOperations(handleError);
  return (
    <div>
      <div data-testid="count">{ops.categories.length}</div>
      <div data-testid="selected">{ops.selectedCategory?.id ?? 'none'}</div>
      <button onClick={() => ops.loadCategories()}>load</button>
      <button onClick={() => ops.loadCategory('c1')}>loadOne</button>
      <button onClick={() => ops.createCategory({ name: 'n' } as CreateCategoryData)}>create</button>
      <button onClick={() => ops.updateCategory('c1', { name: 'u' } as UpdateCategoryData)}>update</button>
      <button onClick={() => ops.deleteCategory('c1')}>delete</button>
    </div>
  );
}

describe('useCategoryOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses fallback categories when service returns empty', async () => {
    const handleError = jest.fn();
    svc.getCategories.mockResolvedValue([]);
    render(<Harness handleError={handleError} />);
    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(Number(screen.getByTestId('count').textContent)).toBeGreaterThan(0));
  });

  it('loads categories and supports CRUD paths', async () => {
    const handleError = jest.fn();
    svc.getCategories.mockResolvedValue([{ id: 'c1' }]);
    svc.getCategory.mockResolvedValue({ id: 'c1' });
    svc.createCategory.mockResolvedValue({ id: 'c2' });
    svc.updateCategory.mockResolvedValue({ id: 'c1', name: 'u' });
    svc.deleteCategory.mockResolvedValue(undefined);

    render(<Harness handleError={handleError} />);
    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('loadOne'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('c1'));

    fireEvent.click(screen.getByText('create'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Category created successfully!'));

    fireEvent.click(screen.getByText('update'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Category updated successfully!'));

    fireEvent.click(screen.getByText('delete'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Category deleted successfully!'));
  });

  it('calls handleError and uses fallback on load failure', async () => {
    const handleError = jest.fn();
    svc.getCategories.mockRejectedValue(new Error('x'));
    render(<Harness handleError={handleError} />);
    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(handleError).toHaveBeenCalled());
    expect(Number(screen.getByTestId('count').textContent)).toBeGreaterThan(0);
  });
});
