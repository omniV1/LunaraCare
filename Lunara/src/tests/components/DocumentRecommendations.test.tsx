import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DocumentRecommendationsPanel } from '../../components/documents/DocumentRecommendations';
import type { DocumentRecommendations } from '../../services/recommendationService';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockGet = jest.fn();
jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => ({ get: mockGet }),
  },
}));

const mockCreateDocument = jest.fn();
jest.mock('../../services/documentService', () => ({
  documentService: {
    createDocument: (...args: unknown[]) => mockCreateDocument(...args),
  },
}));

const mockGetRecommendations = jest.fn();
jest.mock('../../services/recommendationService', () => ({
  RecommendationService: {
    getInstance: () => ({
      getDocumentRecommendations: mockGetRecommendations,
    }),
  },
}));

const { toast } = jest.requireMock('react-toastify');

// ── Helpers ──────────────────────────────────────────────────────────────────

const baseSuggestion = {
  type: 'feeding-log',
  title: 'Weekly Feeding Log',
  description: 'Track your feeding and pumping patterns',
  reason: 'Recommended for postpartum week 2',
  priority: 'high' as const,
};

function makeRecs(suggestions = [baseSuggestion], postpartumWeek = 2): DocumentRecommendations {
  return { suggestions, postpartumWeek } as DocumentRecommendations;
}

function setup(overrides: Partial<Parameters<typeof DocumentRecommendationsPanel>[0]> = {}) {
  const onDocumentCreated = jest.fn();
  const onRecommendationsUpdated = jest.fn();
  const props = {
    recommendations: makeRecs(),
    isClient: true,
    userRole: 'client',
    onDocumentCreated,
    onRecommendationsUpdated,
    ...overrides,
  };
  const utils = render(<DocumentRecommendationsPanel {...props} />);
  return { ...utils, onDocumentCreated, onRecommendationsUpdated };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('DocumentRecommendationsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockResolvedValue({ intake: null });
  });

  it('renders nothing when suggestions array is empty', () => {
    const { container } = setup({ recommendations: makeRecs([]) });
    expect(container.firstChild).toBeNull();
  });

  it('renders heading with postpartum week', () => {
    setup();
    expect(screen.getByText('Suggested Documents')).toBeInTheDocument();
    expect(screen.getByText(/Week 2/)).toBeInTheDocument();
  });

  it('renders suggestion card with title, description, reason, and priority', () => {
    setup();
    expect(screen.getByText('Weekly Feeding Log')).toBeInTheDocument();
    expect(screen.getByText('Track your feeding and pumping patterns')).toBeInTheDocument();
    expect(screen.getByText('Recommended for postpartum week 2')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('renders multiple suggestion cards', () => {
    const suggestions = [
      baseSuggestion,
      { ...baseSuggestion, type: 'mood-check-in', title: 'Mood Check-In', priority: 'medium' as const },
      { ...baseSuggestion, type: 'recovery-notes', title: 'Recovery Notes', priority: 'low' as const },
    ];
    setup({ recommendations: makeRecs(suggestions) });
    expect(screen.getByText('Weekly Feeding Log')).toBeInTheDocument();
    expect(screen.getByText('Mood Check-In')).toBeInTheDocument();
    expect(screen.getByText('Recovery Notes')).toBeInTheDocument();
  });

  it('creates document on button click', async () => {
    mockCreateDocument.mockResolvedValueOnce({});
    mockGetRecommendations.mockResolvedValueOnce(makeRecs([]));

    const { onDocumentCreated } = setup();

    fireEvent.click(screen.getByText('Create Document'));

    await waitFor(() => {
      expect(mockCreateDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Weekly Feeding Log',
          documentType: 'feeding-log',
          privacyLevel: 'client-and-provider',
        })
      );
    });
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining('Weekly Feeding Log')
    );
    expect(onDocumentCreated).toHaveBeenCalled();
  });

  it('shows "Creating..." while document is being created', async () => {
    let resolveCreate: (value: unknown) => void;
    mockCreateDocument.mockImplementation(() => new Promise(r => { resolveCreate = r; }));

    setup();
    fireEvent.click(screen.getByText('Create Document'));

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    resolveCreate!({});
    mockGetRecommendations.mockResolvedValueOnce(makeRecs([]));

    await waitFor(() => {
      expect(screen.getByText('Create Document')).toBeInTheDocument();
    });
  });

  it('shows error toast on creation failure', async () => {
    mockCreateDocument.mockRejectedValueOnce(new Error('Network error'));

    setup();
    fireEvent.click(screen.getByText('Create Document'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });

  it('shows fallback error message when error has no message', async () => {
    mockCreateDocument.mockRejectedValueOnce({});

    setup();
    fireEvent.click(screen.getByText('Create Document'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create template document');
    });
  });

  it('appends intake summary to notes when available', async () => {
    mockGet.mockResolvedValueOnce({
      intake: { feedingGoals: 'Exclusive breastfeeding', feedingPreferences: ['breast'] },
    });
    mockCreateDocument.mockResolvedValueOnce({});
    mockGetRecommendations.mockResolvedValueOnce(makeRecs([]));

    setup();
    fireEvent.click(screen.getByText('Create Document'));

    await waitFor(() => {
      expect(mockCreateDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: expect.stringContaining('From your intake: Goals: Exclusive breastfeeding'),
        })
      );
    });
  });

  it('refreshes recommendations after successful creation for client', async () => {
    const newRecs = makeRecs([], 3);
    mockCreateDocument.mockResolvedValueOnce({});
    mockGetRecommendations.mockResolvedValueOnce(newRecs);

    const { onRecommendationsUpdated } = setup();
    fireEvent.click(screen.getByText('Create Document'));

    await waitFor(() => {
      expect(mockGetRecommendations).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onRecommendationsUpdated).toHaveBeenCalledWith(newRecs);
    });
  });
});
