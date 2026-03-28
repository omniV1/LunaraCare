import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';
import type { CreateResourceData, UpdateResourceData } from '../../services/resourceService';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn() },
}));

const svc = {
  getResources: jest.fn(),
  getResource: jest.fn(),
  createResource: jest.fn(),
  updateResource: jest.fn(),
  deleteResource: jest.fn(),
  searchResources: jest.fn(),
  getPublishedResources: jest.fn(),
  getResourcesByCategory: jest.fn(),
  getResourcesByDifficulty: jest.fn(),
  getResourcesForWeeks: jest.fn(),
};

jest.mock('../../services/resourceService', () => ({
  ResourceService: { getInstance: () => svc },
}));

import { useResourceOperations } from '../../hooks/useResourceOperations';

function Harness({ handleError }: { handleError: (error: unknown, operation: string) => void }) {
  const ops = useResourceOperations(handleError);
  return (
    <div>
      <div data-testid="count">{ops.resources.length}</div>
      <div data-testid="selected">{ops.selectedResource?.id ?? 'none'}</div>
      <button onClick={() => ops.loadResources()}>load</button>
      <button onClick={() => ops.loadResource('r1')}>loadOne</button>
      <button onClick={() => ops.createResource({ title: 't' } as unknown as CreateResourceData)}>create</button>
      <button onClick={() => ops.updateResource('r1', { title: 'u' } as unknown as UpdateResourceData)}>update</button>
      <button onClick={() => ops.deleteResource('r1')}>delete</button>
      <button onClick={() => ops.searchResources('q')}>search</button>
      <button onClick={() => ops.loadPublishedResources()}>published</button>
      <button onClick={() => ops.loadResourcesByCategory('c1')}>byCat</button>
      <button onClick={() => ops.loadResourcesByDifficulty('beginner')}>byDiff</button>
      <button onClick={() => ops.loadResourcesForWeeks([1, 2])}>byWeeks</button>
    </div>
  );
}

describe('useResourceOperations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads resources and supports CRUD paths', async () => {
    const handleError = jest.fn();
    svc.getResources.mockResolvedValue([{ id: 'r1' }]);
    svc.getResource.mockResolvedValue({ id: 'r1' });
    svc.createResource.mockResolvedValue({ id: 'r2' });
    svc.updateResource.mockResolvedValue({ id: 'r1', title: 'u' });
    svc.deleteResource.mockResolvedValue(undefined);
    svc.searchResources.mockResolvedValue([{ id: 'r3' }]);
    svc.getPublishedResources.mockResolvedValue([{ id: 'r4' }]);
    svc.getResourcesByCategory.mockResolvedValue([{ id: 'r5' }]);
    svc.getResourcesByDifficulty.mockResolvedValue([{ id: 'r6' }]);
    svc.getResourcesForWeeks.mockResolvedValue([{ id: 'r7' }]);

    render(<Harness handleError={handleError} />);

    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('loadOne'));
    await waitFor(() => expect(screen.getByTestId('selected')).toHaveTextContent('r1'));

    fireEvent.click(screen.getByText('create'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Resource created successfully!'));

    fireEvent.click(screen.getByText('update'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Resource updated successfully!'));

    fireEvent.click(screen.getByText('delete'));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Resource deleted successfully!'));

    fireEvent.click(screen.getByText('search'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('published'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('byCat'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('byDiff'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));

    fireEvent.click(screen.getByText('byWeeks'));
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('1'));
  });

  it('calls handleError and resets resources on load failure', async () => {
    const handleError = jest.fn();
    svc.getResources.mockRejectedValue(new Error('x'));
    render(<Harness handleError={handleError} />);

    fireEvent.click(screen.getByText('load'));
    await waitFor(() => expect(handleError).toHaveBeenCalled());
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });
});
