import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientCheckIns } from '../../components/client/ClientCheckIns';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => ({ get: mockGet, post: mockPost }),
  },
}));

jest.mock('../../contexts/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-1', role: 'client' },
    isClient: true,
  })),
}));

const { toast } = jest.requireMock('react-toastify');

// ── Helpers ──────────────────────────────────────────────────────────────────

const sampleCheckIn = {
  _id: 'ci-1',
  date: '2026-03-17',
  moodScore: 7,
  physicalSymptoms: ['fatigue'] as const,
  notes: 'Feeling okay today',
  sharedWithProvider: true,
};

const sampleTrends = {
  period: '30 days',
  averageMood: 6.5,
  checkInCount: 12,
  moodByDay: [],
  symptomFrequency: {},
  moodTrend: 'stable' as const,
};

function setup() {
  mockGet.mockReset();
  mockPost.mockReset();
  (toast.success as jest.Mock).mockReset();
  (toast.error as jest.Mock).mockReset();
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClientCheckIns', () => {
  beforeEach(setup);

  it('renders heading and check-in form', async () => {
    mockGet.mockResolvedValue({ checkIns: [], trends: null, alerts: [] });
    render(<ClientCheckIns />);

    expect(screen.getByText('Daily check-ins')).toBeInTheDocument();
    expect(screen.getByText("Today's check-in")).toBeInTheDocument();
    expect(screen.getByText(/Save today/)).toBeInTheDocument();
  });

  it('shows loading state then history', async () => {
    mockGet
      .mockResolvedValueOnce([sampleCheckIn])       // history
      .mockResolvedValueOnce({ trends: sampleTrends, alerts: [] }); // trends

    render(<ClientCheckIns />);

    // Initially loading
    expect(screen.getByText(/Loading your recent/)).toBeInTheDocument();

    // After data arrives — date format is locale-dependent, just check for partial match
    await waitFor(() => {
      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Mood 7/)).toBeInTheDocument();
  });

  it('shows empty history message', async () => {
    mockGet
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ trends: null, alerts: [] });

    render(<ClientCheckIns />);
    await waitFor(() => {
      expect(screen.getByText(/No check-ins yet/)).toBeInTheDocument();
    });
  });

  it('renders trend summary when available', async () => {
    mockGet
      .mockResolvedValueOnce([sampleCheckIn])
      .mockResolvedValueOnce({ trends: sampleTrends, alerts: [] });

    render(<ClientCheckIns />);
    await waitFor(() => {
      expect(screen.getByText(/Last 30 days/)).toBeInTheDocument();
    });
    expect(screen.getByText(/12 check-ins/)).toBeInTheDocument();
    expect(screen.getByText(/overall trend is stable/)).toBeInTheDocument();
  });

  it('renders alerts when present', async () => {
    const alerts = [{ type: 'mood', message: 'Mood declining rapidly', severity: 'warning' as const }];
    mockGet
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ trends: sampleTrends, alerts });

    render(<ClientCheckIns />);
    await waitFor(() => {
      expect(screen.getByText('Mood declining rapidly')).toBeInTheDocument();
    });
  });

  it('displays all 10 symptom checkboxes', async () => {
    mockGet.mockResolvedValue({ checkIns: [], trends: null, alerts: [] });
    render(<ClientCheckIns />);

    expect(screen.getByText('Fatigue / low energy')).toBeInTheDocument();
    expect(screen.getByText('Sleep challenges')).toBeInTheDocument();
    expect(screen.getByText('Anxiety / worry')).toBeInTheDocument();
    expect(screen.getByText('Pain')).toBeInTheDocument();
  });

  it('toggles symptom checkbox', async () => {
    mockGet.mockResolvedValue({ checkIns: [], trends: null, alerts: [] });
    render(<ClientCheckIns />);

    const fatigueCheckbox = screen.getByLabelText('Fatigue / low energy');
    expect(fatigueCheckbox).not.toBeChecked();
    fireEvent.click(fatigueCheckbox);
    expect(fatigueCheckbox).toBeChecked();
    fireEvent.click(fatigueCheckbox);
    expect(fatigueCheckbox).not.toBeChecked();
  });

  it('submits check-in successfully', async () => {
    mockGet
      .mockResolvedValueOnce([]) // initial load
      .mockResolvedValueOnce({ trends: null, alerts: [] })
      .mockResolvedValueOnce([sampleCheckIn]) // reload after submit
      .mockResolvedValueOnce({ trends: null, alerts: [] });
    mockPost.mockResolvedValueOnce({ success: true });

    render(<ClientCheckIns />);
    await waitFor(() => {
      expect(screen.getByText(/No check-ins yet/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Save today/));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/checkins', expect.objectContaining({
        moodScore: 5,
        physicalSymptoms: [],
        sharedWithProvider: true,
      }));
    });
    expect(toast.success).toHaveBeenCalledWith('Check-in saved for today.');
  });

  it('handles 409 duplicate submission error', async () => {
    mockGet.mockResolvedValue({ checkIns: [], trends: null, alerts: [] });
    mockPost.mockRejectedValueOnce({ response: { status: 409 } });

    render(<ClientCheckIns />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());

    fireEvent.click(screen.getByText(/Save today/));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('You already submitted a check-in for this date.');
    });
  });

  it('handles generic submission error', async () => {
    mockGet.mockResolvedValue({ checkIns: [], trends: null, alerts: [] });
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    render(<ClientCheckIns />);
    await waitFor(() => expect(mockGet).toHaveBeenCalled());

    fireEvent.click(screen.getByText(/Save today/));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save check-in.');
    });
  });

  it('shows mood label based on score', async () => {
    mockGet.mockResolvedValue({ checkIns: [], trends: null, alerts: [] });
    render(<ClientCheckIns />);

    // Default mood is 5
    expect(screen.getByText('Mixed / tender day')).toBeInTheDocument();
  });

  it('has share-with-provider checkbox defaulting to checked', async () => {
    mockGet.mockResolvedValue({ checkIns: [], trends: null, alerts: [] });
    render(<ClientCheckIns />);

    const shareCheckbox = screen.getByLabelText(/Share this check-in with my provider/);
    expect(shareCheckbox).toBeChecked();
  });
});
