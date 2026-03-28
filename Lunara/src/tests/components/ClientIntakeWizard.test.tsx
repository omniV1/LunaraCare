import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientIntakeWizard } from '../../components/intake/ClientIntakeWizard';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPatch = jest.fn();
const mockApi = { get: mockGet, post: mockPost, patch: mockPatch };
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => mockApi },
}));

jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

// Mock the step components to keep tests focused on the wizard
jest.mock('../../components/intake/steps/PersonalStep', () => ({
  PersonalStep: () => <div data-testid="personal-step">PersonalStep</div>,
}));
jest.mock('../../components/intake/steps/BirthStep', () => ({
  BirthStep: () => <div data-testid="birth-step">BirthStep</div>,
}));
jest.mock('../../components/intake/steps/FeedingStep', () => ({
  FeedingStep: () => <div data-testid="feeding-step">FeedingStep</div>,
}));
jest.mock('../../components/intake/steps/SupportStep', () => ({
  SupportStep: () => <div data-testid="support-step">SupportStep</div>,
}));
jest.mock('../../components/intake/steps/HealthStep', () => ({
  HealthStep: () => <div data-testid="health-step">HealthStep</div>,
}));

const { toast } = jest.requireMock('react-toastify');

describe('ClientIntakeWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows loading spinner initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<ClientIntakeWizard />);
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders wizard heading and first step after loading', async () => {
    mockGet.mockResolvedValueOnce({ intake: {}, intakeCompleted: false });
    render(<ClientIntakeWizard />);
    await waitFor(() => {
      expect(screen.getByText('Intake & onboarding')).toBeInTheDocument();
    });
    expect(screen.getByText(/Step 1 of 5: Personal/)).toBeInTheDocument();
    expect(screen.getByTestId('personal-step')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('shows navigation buttons', async () => {
    mockGet.mockResolvedValueOnce({ intake: {}, intakeCompleted: false });
    render(<ClientIntakeWizard />);
    await waitFor(() => screen.getByText('Intake & onboarding'));
    expect(screen.getByText('Back')).toBeDisabled();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Save draft')).toBeInTheDocument();
    expect(screen.getByText('Submit intake')).toBeInTheDocument();
  });

  it('navigates to next step when Next clicked', async () => {
    mockGet.mockResolvedValueOnce({ intake: {}, intakeCompleted: false });
    render(<ClientIntakeWizard />);
    await waitFor(() => screen.getByText('Intake & onboarding'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
    expect(screen.getByTestId('birth-step')).toBeInTheDocument();
  });

  it('navigates back when Back clicked', async () => {
    mockGet.mockResolvedValueOnce({ intake: {}, intakeCompleted: false });
    render(<ClientIntakeWizard />);
    await waitFor(() => screen.getByText('Intake & onboarding'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText(/Step 1 of 5/)).toBeInTheDocument();
  });

  it('saves draft when Save draft clicked', async () => {
    mockGet.mockResolvedValueOnce({ intake: {}, intakeCompleted: false });
    mockPost.mockResolvedValueOnce({});
    render(<ClientIntakeWizard />);
    await waitFor(() => screen.getByText('Intake & onboarding'));
    fireEvent.click(screen.getByText('Save draft'));
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/intake', expect.objectContaining({ isComplete: false }));
    });
    expect(toast.success).toHaveBeenCalledWith('Draft saved.');
  });

  it('shows intake completed message when already submitted', async () => {
    mockGet.mockResolvedValueOnce({ intake: {}, intakeCompleted: true });
    render(<ClientIntakeWizard />);
    await waitFor(() => {
      expect(screen.getByText(/submitted your intake/)).toBeInTheDocument();
    });
  });

  it('shows error toast on load failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('fail'));
    render(<ClientIntakeWizard />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load intake form');
    });
  });

  it('updates progress percentage as steps advance', async () => {
    mockGet.mockResolvedValueOnce({ intake: {}, intakeCompleted: false });
    render(<ClientIntakeWizard />);
    await waitFor(() => screen.getByText('20%'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('40%')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('disables Next on last step', async () => {
    mockGet.mockResolvedValueOnce({ intake: {}, intakeCompleted: false });
    render(<ClientIntakeWizard />);
    await waitFor(() => screen.getByText('Intake & onboarding'));
    // Navigate to last step
    fireEvent.click(screen.getByText('Next')); // step 2
    fireEvent.click(screen.getByText('Next')); // step 3
    fireEvent.click(screen.getByText('Next')); // step 4
    fireEvent.click(screen.getByText('Next')); // step 5
    expect(screen.getByText(/Step 5 of 5/)).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeDisabled();
  });
});
