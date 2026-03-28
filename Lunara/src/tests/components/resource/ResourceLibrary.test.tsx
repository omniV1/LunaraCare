import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ResourceLibrary } from '../../../components/resource/ResourceLibrary';

const mockUseAuth = jest.fn();
jest.mock('../../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseResource = jest.fn();
jest.mock('../../../contexts/useResource', () => ({
  useResource: () => mockUseResource(),
}));

const recSvc = { getResourceRecommendations: jest.fn() };
jest.mock('../../../services/recommendationService', () => ({
  RecommendationService: { getInstance: () => recSvc },
}));

jest.mock('../../../components/ui/Card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
}));

describe('ResourceLibrary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    recSvc.getResourceRecommendations.mockResolvedValue({
      resources: [
        {
          id: 'rr1',
          title: 'Rec',
          description: 'Rec desc',
          difficulty: 'beginner',
          category: { name: 'Cat' },
        },
      ],
      postpartumWeek: 2,
      reason: 'Because',
    });
  });

  it('renders filters, loads resources, shows recommendations for client, and selects a resource', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'client' }, isProvider: false });
    const loadResources = jest.fn().mockResolvedValue(undefined);
    const loadCategories = jest.fn().mockResolvedValue(undefined);
    const onResourceSelect = jest.fn();

    mockUseResource.mockReturnValue({
      resources: [
        {
          id: 'r1',
          title: 'R1',
          description: 'D1',
          difficulty: 'beginner',
          createdAt: '2026-01-01',
          category: { id: 'c1', name: 'Cat' },
          author: { id: 'a1', firstName: 'A', lastName: 'B' },
        },
      ],
      categories: [{ id: 'c1', name: 'Cat' }],
      loadResources,
      loadCategories,
      loading: false,
      error: null,
    });

    render(<ResourceLibrary onResourceSelect={onResourceSelect} />);

    // initial effects
    await waitFor(() => expect(loadCategories).toHaveBeenCalled());
    await waitFor(() => expect(loadResources).toHaveBeenCalled());

    // Filters exist
    expect(screen.getByText('Filter Resources')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Search resources...'), { target: { value: 'q' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    // Changing category triggers filter update and loadResources via effect
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'c1' } });
    await waitFor(() => expect(loadResources).toHaveBeenCalled());

    // Recommendations section
    expect(await screen.findByText('Recommended for You')).toBeInTheDocument();
    expect(screen.getByText('Because')).toBeInTheDocument();
    expect(screen.getByText('Week 2')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Rec'));
    expect(onResourceSelect).toHaveBeenCalled();

    // Main list select
    fireEvent.click(screen.getByText('R1'));
    expect(onResourceSelect).toHaveBeenCalledTimes(2);
  });

  it('does not show recommendations for provider', async () => {
    mockUseAuth.mockReturnValue({ user: { role: 'provider' }, isProvider: true });
    mockUseResource.mockReturnValue({
      resources: [],
      categories: [],
      loadResources: jest.fn().mockResolvedValue(undefined),
      loadCategories: jest.fn().mockResolvedValue(undefined),
      loading: false,
      error: null,
    });

    render(<ResourceLibrary />);
    expect(screen.queryByText('Recommended for You')).not.toBeInTheDocument();
  });
});

