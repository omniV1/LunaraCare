import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProviderClientCheckIns } from '../../components/provider/ProviderClientCheckIns';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockGet = jest.fn();
const mockApi = { get: mockGet };
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => mockApi },
}));

const { toast } = jest.requireMock('react-toastify');

const checkIns = [
  {
    _id: 'ci1',
    date: '2026-03-18T00:00:00Z',
    moodScore: 8,
    physicalSymptoms: ['fatigue', 'sleep_issues'],
    notes: 'Feeling better today',
    sharedWithProvider: true,
  },
  {
    _id: 'ci2',
    date: '2026-03-17T00:00:00Z',
    moodScore: 3,
    physicalSymptoms: [],
    sharedWithProvider: false,
  },
];

const trendsData = {
  trends: {
    period: '30d',
    averageMood: 6.5,
    checkInCount: 15,
    moodByDay: [],
    symptomFrequency: { fatigue: 8, sleep_issues: 5 },
    moodTrend: 'improving' as const,
  },
  alerts: [
    { type: 'mood_drop', message: 'Mood dropped below 4', severity: 'warning' as const },
  ],
};

const defaultProps = {
  clientUserId: 'user-1',
  clientName: 'Jane Doe',
  onClose: jest.fn(),
};

describe('ProviderClientCheckIns', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading spinner initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ProviderClientCheckIns {...defaultProps} />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders header with client name', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce(trendsData);
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Daily check-ins — Jane Doe/)).toBeInTheDocument();
    });
  });

  it('calls onClose when close button clicked', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce(trendsData);
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => screen.getByText(/Daily check-ins/));
    fireEvent.click(screen.getByLabelText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders trend summary', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce(trendsData);
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('6.5')).toBeInTheDocument();
    });
    expect(screen.getByText('improving')).toBeInTheDocument();
    expect(screen.getByText(/15 check-ins/)).toBeInTheDocument();
  });

  it('renders alert badges', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce(trendsData);
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Mood dropped below 4')).toBeInTheDocument();
    });
  });

  it('renders check-in entries with mood scores', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce(trendsData);
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Mood 8/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Lighter day/)).toBeInTheDocument();
    expect(screen.getByText(/Mood 3/)).toBeInTheDocument();
    expect(screen.getByText(/Very heavy day/)).toBeInTheDocument();
  });

  it('shows shared/private badges', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce(trendsData);
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Shared with you')).toBeInTheDocument();
    });
    expect(screen.getByText('Kept private')).toBeInTheDocument();
  });

  it('shows symptom badges', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce(trendsData);
    const { container } = render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Mood 8/)).toBeInTheDocument();
    });
    // Check for symptom badge elements rendered via physicalSymptoms
    const purpleBadges = container.querySelectorAll('.bg-purple-50');
    expect(purpleBadges.length).toBe(2); // fatigue and sleep_issues from first check-in
  });

  it('shows notes text', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce(trendsData);
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Feeling better today')).toBeInTheDocument();
    });
  });

  it('shows empty state when no check-ins', async () => {
    mockGet
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce({ trends: null, alerts: [] });
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/no check-ins on record/)).toBeInTheDocument();
    });
  });

  it('shows no-trends message when trends are null', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce({ trends: null, alerts: [] });
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Not enough check-ins yet/)).toBeInTheDocument();
    });
  });

  it('shows error toast on load failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('API down'));
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('renders symptom frequency in trends', async () => {
    mockGet
      .mockResolvedValueOnce(checkIns)
      .mockResolvedValueOnce(trendsData);
    render(<ProviderClientCheckIns {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText(/Most mentioned symptoms/)).toBeInTheDocument();
    });
  });
});
