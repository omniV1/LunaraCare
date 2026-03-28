import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntakeProgressHeader } from '../../components/intake/IntakeProgressHeader';
import type { StepId } from '../../components/intake/intakeValidation';

const STEPS: StepId[] = ['personal', 'birth', 'feeding', 'support', 'health'];

const defaultProps = {
  steps: STEPS,
  step: 'personal' as StepId,
  stepIndex: 0,
  progressPct: 20,
  saveStatus: 'idle' as const,
  lastSavedAt: null,
  onStepChange: jest.fn(),
};

describe('IntakeProgressHeader', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders step label and number', () => {
    render(<IntakeProgressHeader {...defaultProps} />);
    expect(screen.getByText(/Step 1 of 5: Personal/)).toBeInTheDocument();
  });

  it('renders progress percentage', () => {
    render(<IntakeProgressHeader {...defaultProps} progressPct={60} />);
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('shows "Saving..." when saveStatus is saving', () => {
    render(<IntakeProgressHeader {...defaultProps} saveStatus="saving" />);
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  it('shows saved time when saveStatus is saved', () => {
    const lastSaved = new Date(2026, 2, 18, 14, 30);
    render(<IntakeProgressHeader {...defaultProps} saveStatus="saved" lastSavedAt={lastSaved} />);
    expect(screen.getByText(/Saved/)).toBeInTheDocument();
  });

  it('shows error when saveStatus is error', () => {
    render(<IntakeProgressHeader {...defaultProps} saveStatus="error" />);
    expect(screen.getByText(/Save failed/)).toBeInTheDocument();
  });

  it('renders mobile step selector', () => {
    render(<IntakeProgressHeader {...defaultProps} />);
    const select = screen.getByLabelText('Select step');
    expect(select).toBeInTheDocument();
  });

  it('calls onStepChange when mobile selector changes', () => {
    render(<IntakeProgressHeader {...defaultProps} />);
    const select = screen.getByLabelText('Select step');
    fireEvent.change(select, { target: { value: 'birth' } });
    expect(defaultProps.onStepChange).toHaveBeenCalledWith('birth');
  });

  it('renders all steps in mobile selector', () => {
    render(<IntakeProgressHeader {...defaultProps} />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveTextContent('1. Personal');
    expect(options[4]).toHaveTextContent('5. Health');
  });
});
