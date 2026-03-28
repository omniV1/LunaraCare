import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CarePlanManager } from '../../components/client/CarePlanManager';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
const mockPatch = jest.fn();
const mockApi = { get: mockGet, post: mockPost, put: mockPut, patch: mockPatch };
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => mockApi },
}));

jest.mock('../../components/client/CarePlanCard', () => ({
  CarePlanCard: ({ plan, isExpanded, onToggleExpand }: { plan: { _id: string; title: string }; isExpanded: boolean; onToggleExpand: () => void }) => (
    <div data-testid={`care-plan-${plan._id}`}>
      <span>{plan.title}</span>
      <span>{isExpanded ? 'expanded' : 'collapsed'}</span>
      <button onClick={onToggleExpand}>toggle</button>
    </div>
  ),
}));

const { toast } = jest.requireMock('react-toastify');

const plans = [
  { _id: 'cp1', title: 'Recovery Plan', status: 'active', progress: 50, sections: [] },
  { _id: 'cp2', title: 'Wellness Plan', status: 'active', progress: 20, sections: [] },
];

const templates = [
  { _id: 't1', name: 'Standard Recovery', description: 'A standard plan' },
];

const defaultProps = {
  clientId: 'client-doc-1',
  clientUserId: 'user-1',
  clientName: 'Jane Doe',
  onClose: jest.fn(),
};

describe('CarePlanManager', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows loading state initially', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<CarePlanManager {...defaultProps} />);
    expect(screen.getByText('Loading care plans…')).toBeInTheDocument();
  });

  it('renders care plans after loading', async () => {
    mockGet
      .mockResolvedValueOnce({ carePlans: plans })
      .mockResolvedValueOnce(templates);
    render(<CarePlanManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Recovery Plan')).toBeInTheDocument();
    });
    expect(screen.getByText('Wellness Plan')).toBeInTheDocument();
  });

  it('shows header with client name', async () => {
    mockGet
      .mockResolvedValueOnce({ carePlans: plans })
      .mockResolvedValueOnce(templates);
    render(<CarePlanManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Care Plans')).toBeInTheDocument();
    });
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    mockGet
      .mockResolvedValueOnce({ carePlans: plans })
      .mockResolvedValueOnce(templates);
    render(<CarePlanManager {...defaultProps} />);
    await waitFor(() => screen.getByText('Recovery Plan'));
    fireEvent.click(screen.getByLabelText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('shows empty state when no plans', async () => {
    mockGet
      .mockResolvedValueOnce({ carePlans: [] })
      .mockResolvedValueOnce(templates);
    render(<CarePlanManager {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('No care plans yet')).toBeInTheDocument();
    });
  });

  it('shows "+ New Care Plan" button for providers', async () => {
    mockGet
      .mockResolvedValueOnce({ carePlans: plans })
      .mockResolvedValueOnce(templates);
    render(<CarePlanManager {...defaultProps} />);
    await waitFor(() => screen.getByText('Recovery Plan'));
    expect(screen.getByText('+ New Care Plan')).toBeInTheDocument();
  });

  it('hides create button in own view mode', async () => {
    mockGet.mockResolvedValueOnce({ carePlans: plans });
    render(<CarePlanManager {...defaultProps} isOwnView={true} />);
    await waitFor(() => screen.getByText('Recovery Plan'));
    expect(screen.queryByText('+ New Care Plan')).not.toBeInTheDocument();
  });

  it('toggles create form', async () => {
    mockGet
      .mockResolvedValueOnce({ carePlans: plans })
      .mockResolvedValueOnce(templates);
    render(<CarePlanManager {...defaultProps} />);
    await waitFor(() => screen.getByText('Recovery Plan'));
    fireEvent.click(screen.getByText('+ New Care Plan'));
    expect(screen.getByText('Create Plan')).toBeInTheDocument();
    expect(screen.getByText(/New Care Plan for Jane Doe/)).toBeInTheDocument();
  });

  it('creates a care plan', async () => {
    mockGet
      .mockResolvedValueOnce({ carePlans: [] })
      .mockResolvedValueOnce(templates);
    mockPost.mockResolvedValueOnce({ carePlan: { _id: 'new-1', title: 'My Plan', status: 'active', progress: 0, sections: [] } });
    render(<CarePlanManager {...defaultProps} />);
    await waitFor(() => screen.getByText('No care plans yet'));

    fireEvent.click(screen.getByText('+ New Care Plan'));
    fireEvent.change(screen.getByPlaceholderText(/Postpartum Recovery/), { target: { value: 'My Plan' } });
    fireEvent.click(screen.getByText('Create Plan'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/care-plans', expect.objectContaining({ title: 'My Plan' }));
    });
    expect(toast.success).toHaveBeenCalledWith('Care plan created');
  });

  it('shows error toast on load failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('fail'));
    render(<CarePlanManager {...defaultProps} />);
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load care plans');
    });
  });

  it('expands first plan by default', async () => {
    mockGet
      .mockResolvedValueOnce({ carePlans: plans })
      .mockResolvedValueOnce(templates);
    render(<CarePlanManager {...defaultProps} />);
    await waitFor(() => screen.getByText('Recovery Plan'));
    expect(screen.getByTestId('care-plan-cp1')).toHaveTextContent('expanded');
    expect(screen.getByTestId('care-plan-cp2')).toHaveTextContent('collapsed');
  });

  it('shows own view empty message for clients', async () => {
    mockGet.mockResolvedValueOnce({ carePlans: [] });
    render(<CarePlanManager {...defaultProps} isOwnView={true} />);
    await waitFor(() => {
      expect(screen.getByText('Your provider has not added any care plans yet.')).toBeInTheDocument();
    });
  });
});
