import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedingStep } from '../../components/intake/steps/FeedingStep';
import { HealthStep } from '../../components/intake/steps/HealthStep';
import { SupportStep } from '../../components/intake/steps/SupportStep';
import type { StepProps } from '../../components/intake/intakeUtils';
import type { IntakeData } from '../../components/intake/intakeTypes';

function makeProps(data: Partial<IntakeData> = {}): StepProps {
  return {
    data: data as IntakeData,
    errors: {},
    update: jest.fn(),
    setData: jest.fn(),
  };
}

describe('FeedingStep', () => {
  it('renders feeding method checkboxes', () => {
    render(<FeedingStep {...makeProps()} />);
    expect(screen.getByText('Breastfeeding')).toBeInTheDocument();
    expect(screen.getByText('Formula')).toBeInTheDocument();
    expect(screen.getByText('Combination')).toBeInTheDocument();
    expect(screen.getByText('Pumping')).toBeInTheDocument();
  });

  it('shows checked state for selected feeding preferences', () => {
    const props = makeProps({ feedingPreferences: ['breastfeeding'] });
    render(<FeedingStep {...props} />);
    const checkbox = screen.getByText('Breastfeeding').previousElementSibling as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('calls setData when toggling a checkbox', () => {
    const props = makeProps();
    render(<FeedingStep {...props} />);
    fireEvent.click(screen.getByText('Pumping'));
    expect(props.setData).toHaveBeenCalled();
  });

  it('renders feeding challenges input', () => {
    render(<FeedingStep {...makeProps()} />);
    expect(screen.getByLabelText(/Feeding challenges/)).toBeInTheDocument();
  });

  it('calls update on challenges change', () => {
    const props = makeProps();
    render(<FeedingStep {...props} />);
    fireEvent.change(screen.getByLabelText(/Feeding challenges/), { target: { value: 'latch, supply' } });
    expect(props.update).toHaveBeenCalledWith('feedingChallenges', ['latch', 'supply']);
  });

  it('renders feeding goals textarea', () => {
    render(<FeedingStep {...makeProps()} />);
    expect(screen.getByLabelText(/Feeding goals/)).toBeInTheDocument();
  });
});

describe('HealthStep', () => {
  it('renders medication and allergy inputs', () => {
    render(<HealthStep {...makeProps()} />);
    expect(screen.getByLabelText(/Current medications/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Allergies/)).toBeInTheDocument();
  });

  it('renders medical history input', () => {
    render(<HealthStep {...makeProps()} />);
    expect(screen.getByLabelText(/Medical history/)).toBeInTheDocument();
  });

  it('renders mental health textarea', () => {
    render(<HealthStep {...makeProps()} />);
    expect(screen.getByLabelText(/Mental health history/)).toBeInTheDocument();
  });

  it('renders mood concerns checkbox', () => {
    render(<HealthStep {...makeProps()} />);
    expect(screen.getByText(/concerns about my mood/)).toBeInTheDocument();
  });

  it('shows checked mood concerns when true', () => {
    const props = makeProps({ postpartumMoodConcerns: true });
    render(<HealthStep {...props} />);
    const checkbox = screen.getByRole('checkbox', { name: /concerns about my mood/ }) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('calls update on medications change', () => {
    const props = makeProps();
    render(<HealthStep {...props} />);
    fireEvent.change(screen.getByLabelText(/Current medications/), { target: { value: 'vitamin D' } });
    expect(props.update).toHaveBeenCalledWith('currentMedications', ['vitamin D']);
  });

  it('calls update on mood concerns toggle', () => {
    const props = makeProps();
    render(<HealthStep {...props} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /concerns about my mood/ }));
    expect(props.update).toHaveBeenCalledWith('postpartumMoodConcerns', true);
  });
});

describe('SupportStep', () => {
  it('renders all support need checkboxes', () => {
    render(<SupportStep {...makeProps()} />);
    expect(screen.getByText('Breastfeeding support')).toBeInTheDocument();
    expect(screen.getByText('Newborn care')).toBeInTheDocument();
    expect(screen.getByText('Emotional support')).toBeInTheDocument();
    expect(screen.getByText('Sleep guidance')).toBeInTheDocument();
  });

  it('calls setData when toggling support need', () => {
    const props = makeProps();
    render(<SupportStep {...props} />);
    fireEvent.click(screen.getByText('Newborn care'));
    expect(props.setData).toHaveBeenCalled();
  });

  it('renders additional support textarea', () => {
    render(<SupportStep {...makeProps()} />);
    expect(screen.getByText(/Other support needs/)).toBeInTheDocument();
  });

  it('renders postpartum goals and concerns inputs', () => {
    render(<SupportStep {...makeProps()} />);
    expect(screen.getByText(/Postpartum goals/)).toBeInTheDocument();
    expect(screen.getByText(/Concerns or fears/)).toBeInTheDocument();
  });

  it('renders expectations textarea', () => {
    render(<SupportStep {...makeProps()} />);
    expect(screen.getByText(/What do you hope to get from support/)).toBeInTheDocument();
  });

  it('renders previous doula experience checkbox', () => {
    render(<SupportStep {...makeProps()} />);
    expect(screen.getByText(/postpartum support before/)).toBeInTheDocument();
  });

  it('calls update on expectations change', () => {
    const props = makeProps();
    render(<SupportStep {...props} />);
    const textarea = screen.getByText(/What do you hope to get from support/).closest('div')!.querySelector('textarea')!;
    fireEvent.change(textarea, { target: { value: 'gentle guidance' } });
    expect(props.update).toHaveBeenCalledWith('expectations', 'gentle guidance');
  });
});
