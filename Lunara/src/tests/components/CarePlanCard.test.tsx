import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CarePlanCard } from '../../components/client/CarePlanCard';
import type { CarePlan } from '../../components/client/CarePlanCard';

function makePlan(overrides: Partial<CarePlan> = {}): CarePlan {
  return {
    _id: 'plan-1',
    title: 'Postpartum Recovery',
    description: 'A recovery plan',
    status: 'active',
    progress: 40,
    sections: [
      {
        _id: 'sec-1',
        title: 'Physical Recovery',
        description: 'Body recovery milestones',
        milestones: [
          { _id: 'm1', title: 'Rest', description: 'Get sleep', weekOffset: 1, category: 'physical', status: 'completed', notes: 'Going well' },
          { _id: 'm2', title: 'Walk daily', description: 'Light exercise', weekOffset: 2, category: 'self_care', status: 'pending' },
        ],
      },
    ],
    ...overrides,
  };
}

const defaultProps = {
  plan: makePlan(),
  isExpanded: false,
  onToggleExpand: jest.fn(),
  onMilestoneUpdate: jest.fn().mockResolvedValue(undefined),
  onPlanStatusUpdate: jest.fn().mockResolvedValue(undefined),
  onSavePlanEdits: jest.fn().mockResolvedValue(undefined),
  updatingMilestone: null,
  updatingStatus: null,
  savingPlan: null,
};

describe('CarePlanCard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders plan title and status', () => {
    render(<CarePlanCard {...defaultProps} />);
    expect(screen.getByText('Postpartum Recovery')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('shows progress bar and count', () => {
    render(<CarePlanCard {...defaultProps} />);
    expect(screen.getByText('1/2 · 40%')).toBeInTheDocument();
  });

  it('calls onToggleExpand when header is clicked', () => {
    render(<CarePlanCard {...defaultProps} />);
    fireEvent.click(screen.getByText('Postpartum Recovery'));
    expect(defaultProps.onToggleExpand).toHaveBeenCalled();
  });

  it('does not show body when collapsed', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={false} />);
    expect(screen.queryByText('Physical Recovery')).not.toBeInTheDocument();
  });

  it('shows sections and milestones when expanded', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('Physical Recovery')).toBeInTheDocument();
    expect(screen.getByText('Rest')).toBeInTheDocument();
    expect(screen.getByText('Walk daily')).toBeInTheDocument();
  });

  it('shows milestone category badge', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('physical')).toBeInTheDocument();
    expect(screen.getByText('self care')).toBeInTheDocument();
  });

  it('shows milestone notes', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('Note: Going well')).toBeInTheDocument();
  });

  it('shows milestone description', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('Get sleep')).toBeInTheDocument();
  });

  it('shows plan description when expanded', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('A recovery plan')).toBeInTheDocument();
  });

  it('shows status buttons for each milestone', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    const pendingBtns = screen.getAllByText('Pending');
    expect(pendingBtns.length).toBeGreaterThanOrEqual(2);
  });

  it('calls onMilestoneUpdate when status button clicked', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    // Click "Skipped" button for first milestone
    const skippedBtns = screen.getAllByText('Skipped');
    fireEvent.click(skippedBtns[0]);
    expect(defaultProps.onMilestoneUpdate).toHaveBeenCalledWith('plan-1', 'm1', 'skipped');
  });

  it('shows status select and calls onPlanStatusUpdate', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'paused' } });
    expect(defaultProps.onPlanStatusUpdate).toHaveBeenCalledWith('plan-1', 'paused');
  });

  it('shows "No sections yet." for empty plan', () => {
    const emptyPlan = makePlan({ sections: [] });
    render(<CarePlanCard {...defaultProps} plan={emptyPlan} isExpanded={true} />);
    expect(screen.getByText('No sections yet.')).toBeInTheDocument();
  });

  it('enters edit mode when Edit plan clicked', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    fireEvent.click(screen.getByText('Edit plan'));
    expect(screen.getByDisplayValue('Postpartum Recovery')).toBeInTheDocument();
    expect(screen.getByText('Save changes')).toBeInTheDocument();
  });

  it('can cancel editing', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    fireEvent.click(screen.getByText('Edit plan'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Save changes')).not.toBeInTheDocument();
  });

  it('calls onSavePlanEdits when Save clicked', async () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    fireEvent.click(screen.getByText('Edit plan'));
    fireEvent.click(screen.getByText('Save changes'));
    await waitFor(() => {
      expect(defaultProps.onSavePlanEdits).toHaveBeenCalledWith('plan-1', expect.objectContaining({
        title: 'Postpartum Recovery',
      }));
    });
  });

  it('can add a section in edit mode', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    fireEvent.click(screen.getByText('Edit plan'));
    fireEvent.click(screen.getByText('+ Add section'));
    expect(screen.getByDisplayValue('New section')).toBeInTheDocument();
  });

  it('can add a milestone in edit mode', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    fireEvent.click(screen.getByText('Edit plan'));
    fireEvent.click(screen.getByText('+ Add milestone'));
    expect(screen.getByDisplayValue('New milestone')).toBeInTheDocument();
  });

  it('shows Saving… when savingPlan matches', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} savingPlan="plan-1" />);
    fireEvent.click(screen.getByText('Edit plan'));
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('shows week offset for milestones', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    expect(screen.getByText('Week 1')).toBeInTheDocument();
    expect(screen.getByText('Week 2')).toBeInTheDocument();
  });

  it('line-through style on completed milestone title', () => {
    render(<CarePlanCard {...defaultProps} isExpanded={true} />);
    const restSpan = screen.getByText('Rest');
    expect(restSpan.className).toContain('line-through');
  });
});
