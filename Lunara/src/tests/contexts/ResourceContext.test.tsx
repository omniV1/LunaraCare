import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ResourceContext, ResourceProvider } from '../../contexts/ResourceContext';

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn() },
}));

const mockUseAuth = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const resourceOps = {
  resources: [],
  selectedResource: null,
  loading: false,
  loadResources: jest.fn().mockResolvedValue(undefined),
  loadResource: jest.fn().mockResolvedValue(undefined),
  createResource: jest.fn().mockResolvedValue(undefined),
  updateResource: jest.fn().mockResolvedValue(undefined),
  deleteResource: jest.fn().mockResolvedValue(undefined),
  searchResources: jest.fn().mockResolvedValue(undefined),
  loadPublishedResources: jest.fn().mockResolvedValue(undefined),
  loadResourcesByCategory: jest.fn().mockResolvedValue(undefined),
  loadResourcesByDifficulty: jest.fn().mockResolvedValue(undefined),
  loadResourcesForWeeks: jest.fn().mockResolvedValue(undefined),
  setSelectedResource: jest.fn(),
};

const categoryOps = {
  categories: [],
  selectedCategory: null,
  loading: false,
  loadCategories: jest.fn().mockResolvedValue(undefined),
  loadCategory: jest.fn().mockResolvedValue(undefined),
  createCategory: jest.fn().mockResolvedValue(undefined),
  updateCategory: jest.fn().mockResolvedValue(undefined),
  deleteCategory: jest.fn().mockResolvedValue(undefined),
  setSelectedCategory: jest.fn(),
};

jest.mock('../../hooks/useResourceOperations', () => ({
  useResourceOperations: () => resourceOps,
}));
jest.mock('../../hooks/useCategoryOperations', () => ({
  useCategoryOperations: () => categoryOps,
}));

function Consumer() {
  const ctx = React.useContext(ResourceContext);
  return <div>{ctx?.loading ? 'loading' : 'ready'}</div>;
}

describe('ResourceProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads initial data when authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    render(
      <ResourceProvider>
        <Consumer />
      </ResourceProvider>,
    );

    await waitFor(() => expect(resourceOps.loadResources).toHaveBeenCalled());
    await waitFor(() => expect(categoryOps.loadCategories).toHaveBeenCalled());
    expect(screen.getByText('ready')).toBeInTheDocument();
  });

  it('does not load initial data when not authenticated', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    render(
      <ResourceProvider>
        <Consumer />
      </ResourceProvider>,
    );

    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument());
    expect(resourceOps.loadResources).not.toHaveBeenCalled();
    expect(categoryOps.loadCategories).not.toHaveBeenCalled();
  });
});

