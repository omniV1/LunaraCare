import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PersonalStep } from '../../components/intake/steps/PersonalStep';
import { BirthStep } from '../../components/intake/steps/BirthStep';
import type { StepProps } from '../../components/intake/intakeUtils';
import type { IntakeData } from '../../components/intake/intakeTypes';

function makeProps(data: Partial<IntakeData> = {}, errors: Record<string, string> = {}): StepProps {
  return {
    data: data as IntakeData,
    errors,
    update: jest.fn(),
    setData: jest.fn(),
  };
}

describe('PersonalStep', () => {
  it('renders partner name and phone fields', () => {
    render(<PersonalStep {...makeProps()} />);
    expect(screen.getByLabelText(/Partner.*support person name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Partner phone/)).toBeInTheDocument();
  });

  it('renders address fields', () => {
    render(<PersonalStep {...makeProps()} />);
    expect(screen.getByPlaceholderText('Street')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('ZIP')).toBeInTheDocument();
  });

  it('renders emergency contact fields', () => {
    render(<PersonalStep {...makeProps()} />);
    expect(screen.getByLabelText(/Emergency contact name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Emergency contact phone/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Relationship/)).toBeInTheDocument();
  });

  it('populates fields from data', () => {
    const data = {
      partnerName: 'John',
      partnerPhone: '555-1234',
      address: { street: '123 Main', city: 'Portland', state: 'OR', zipCode: '97201' },
      emergencyContact: { name: 'Mom', phone: '555-5678', relationship: 'Mother' },
    };
    render(<PersonalStep {...makeProps(data)} />);
    expect(screen.getByLabelText(/Partner.*support person name/)).toHaveValue('John');
    expect(screen.getByLabelText(/Partner phone/)).toHaveValue('555-1234');
    expect(screen.getByLabelText('City')).toHaveValue('Portland');
    expect(screen.getByLabelText(/Emergency contact name/)).toHaveValue('Mom');
  });

  it('calls update on field change', () => {
    const props = makeProps();
    render(<PersonalStep {...props} />);
    fireEvent.change(screen.getByLabelText(/Partner.*support person name/), { target: { value: 'Jane' } });
    expect(props.update).toHaveBeenCalledWith('partnerName', 'Jane');
  });

  it('calls update with nested path for address', () => {
    const props = makeProps();
    render(<PersonalStep {...props} />);
    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'Seattle' } });
    expect(props.update).toHaveBeenCalledWith('address.city', 'Seattle');
  });

  it('shows validation errors', () => {
    const props = makeProps({}, { partnerName: 'Name too long' });
    render(<PersonalStep {...props} />);
    expect(screen.getByText('Name too long')).toBeInTheDocument();
  });
});

describe('BirthStep', () => {
  it('renders intro text', () => {
    render(<BirthStep {...makeProps()} />);
    expect(screen.getByText(/Share what fits your story/)).toBeInTheDocument();
  });

  it('renders first baby select', () => {
    render(<BirthStep {...makeProps()} />);
    expect(screen.getByText('Is this your first birth?')).toBeInTheDocument();
  });

  it('renders number of children input', () => {
    render(<BirthStep {...makeProps()} />);
    expect(screen.getByText(/Number of children/)).toBeInTheDocument();
  });

  it('renders complications input', () => {
    render(<BirthStep {...makeProps()} />);
    expect(screen.getByText(/Current pregnancy complications/)).toBeInTheDocument();
  });

  it('renders birth experience section', () => {
    render(<BirthStep {...makeProps()} />);
    expect(screen.getByText('Most recent birth (optional)')).toBeInTheDocument();
    expect(screen.getByText('Birth type')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText(/Labor duration/)).toBeInTheDocument();
  });

  it('populates isFirstBaby from data', () => {
    render(<BirthStep {...makeProps({ isFirstBaby: true })} />);
    const select = screen.getByText('Is this your first birth?').closest('div')!.querySelector('select')!;
    expect(select.value).toBe('yes');
  });

  it('calls update on first baby change', () => {
    const props = makeProps();
    render(<BirthStep {...props} />);
    const select = screen.getByText('Is this your first birth?').closest('div')!.querySelector('select')!;
    fireEvent.change(select, { target: { value: 'no' } });
    expect(props.update).toHaveBeenCalledWith('isFirstBaby', false);
  });

  it('calls update for birth type change', () => {
    const props = makeProps();
    render(<BirthStep {...props} />);
    const select = screen.getByText('Birth type').closest('div')!.querySelector('select')!;
    fireEvent.change(select, { target: { value: 'cesarean' } });
    expect(props.update).toHaveBeenCalledWith('birthExperience.birthType', 'cesarean');
  });
});
