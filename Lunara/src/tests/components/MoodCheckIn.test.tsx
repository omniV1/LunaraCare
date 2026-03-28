import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MoodCheckIn } from '../../components/client/MoodCheckIn';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockPost = jest.fn();
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => ({ post: mockPost }) },
}));

jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

jest.mock('../../components/client/MoodOrb', () => ({
  MoodOrb: ({ label }: { label: string }) => <div data-testid="mood-orb">{label}</div>,
}));

const { toast } = jest.requireMock('react-toastify');

describe('MoodCheckIn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders heading', () => {
    render(<MoodCheckIn />);
    expect(screen.getByText('How are you feeling?')).toBeInTheDocument();
  });

  it('renders all 5 mood options', () => {
    render(<MoodCheckIn />);
    expect(screen.getByText('Need support now')).toBeInTheDocument();
    expect(screen.getByText('Having a tough day')).toBeInTheDocument();
    expect(screen.getByText('Hanging in there')).toBeInTheDocument();
    expect(screen.getByText('Doing alright')).toBeInTheDocument();
    expect(screen.getByText('Doing well')).toBeInTheDocument();
  });

  it('renders the mood orb', () => {
    render(<MoodCheckIn />);
    expect(screen.getByTestId('mood-orb')).toBeInTheDocument();
  });

  it('shows submit button after selecting a mood', () => {
    render(<MoodCheckIn />);
    fireEvent.click(screen.getByText('Doing well'));
    expect(screen.getByText(/Check in as/)).toBeInTheDocument();
  });

  it('shows share-with-provider checkbox after selecting a mood', () => {
    render(<MoodCheckIn />);
    fireEvent.click(screen.getByText('Doing alright'));
    expect(screen.getByText('Share with my provider')).toBeInTheDocument();
  });

  it('submits check-in successfully', async () => {
    mockPost.mockResolvedValueOnce({});
    render(<MoodCheckIn />);

    fireEvent.click(screen.getByText('Doing well'));
    fireEvent.click(screen.getByText(/Check in as/));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/checkins', expect.objectContaining({
        moodScore: 10,
        sharedWithProvider: true,
      }));
    });
    expect(toast.success).toHaveBeenCalledWith('Check-in recorded!');
  });

  it('shows error toast on submit failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('fail'));
    render(<MoodCheckIn />);

    fireEvent.click(screen.getByText('Hanging in there'));
    fireEvent.click(screen.getByText(/Check in as/));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to record check-in');
    });
  });

  it('shows cooldown state after successful check-in', async () => {
    mockPost.mockResolvedValueOnce({});
    render(<MoodCheckIn />);

    fireEvent.click(screen.getByText('Doing well'));
    fireEvent.click(screen.getByText(/Check in as/));

    await waitFor(() => {
      expect(screen.getByText(/Check-in recorded/)).toBeInTheDocument();
    });
  });

  it('restores selected mood from localStorage', () => {
    localStorage.setItem('mood_selection_user-1', 'calm');
    render(<MoodCheckIn />);
    // The orb label should show the saved mood
    expect(screen.getByTestId('mood-orb')).toHaveTextContent('Doing alright');
  });
});
