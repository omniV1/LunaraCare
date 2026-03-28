import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { IntakeData } from '../../../../components/intake/intakeTypes';

import { PersonalStep } from '../../../../components/intake/steps/PersonalStep';
import { HealthStep } from '../../../../components/intake/steps/HealthStep';
import { FeedingStep } from '../../../../components/intake/steps/FeedingStep';

jest.mock('../../../../components/intake/intakeTypes', () => ({
  FEEDING_OPTIONS: [
    { value: 'breast', label: 'Breast' },
    { value: 'bottle', label: 'Bottle' },
  ],
}));

describe('intake steps', () => {
  it('PersonalStep calls update for nested fields', () => {
    const update = jest.fn();
    const { container } = render(
      <PersonalStep
        data={{ address: {}, emergencyContact: {} } as IntakeData}
        errors={{ partnerName: 'err' } as IntakeData}
        update={update}
      />,
    );
    const textInputs = Array.from(container.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    fireEvent.change(textInputs[0], { target: { value: 'P' } }); // partnerName
    fireEvent.change(screen.getByPlaceholderText('Street'), { target: { value: 'S' } });
    fireEvent.change(screen.getByPlaceholderText('ZIP'), { target: { value: '9' } });
    expect(update).toHaveBeenCalledWith('partnerName', 'P');
    expect(update).toHaveBeenCalledWith('address.street', 'S');
    expect(update).toHaveBeenCalledWith('address.zipCode', '9');
    expect(screen.getByText('err')).toBeInTheDocument();
  });

  it('HealthStep splits csv and toggles checkbox', () => {
    const update = jest.fn();
    const { container } = render(
      <HealthStep data={{ currentMedications: [], allergies: [] } as IntakeData} errors={{} as IntakeData} update={update} />,
    );
    const inputs = Array.from(container.querySelectorAll('input[type="text"]')) as HTMLInputElement[];
    fireEvent.change(inputs[0], { target: { value: 'a, b' } });
    fireEvent.change(inputs[1], { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('checkbox'));
    expect(update).toHaveBeenCalledWith('currentMedications', ['a', 'b']);
    expect(update).toHaveBeenCalledWith('allergies', ['x']);
    expect(update).toHaveBeenCalledWith('postpartumMoodConcerns', true);
  });

  it('FeedingStep updates challenges/goals and toggles preference', () => {
    const update = jest.fn();
    const setData = jest.fn((fn: (prev: IntakeData) => IntakeData) => fn({ feedingPreferences: [] }));
    render(<FeedingStep data={{ feedingPreferences: [] } as IntakeData} errors={{} as IntakeData} update={update} setData={setData} />);

    fireEvent.click(screen.getByLabelText('Breast'));
    expect(setData).toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText(/latch/i), { target: { value: 'latch' } });
    // Feeding goals is the textarea (no label association)
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[textareas.length - 1], { target: { value: 'goal' } });
    expect(update).toHaveBeenCalledWith('feedingChallenges', ['latch']);
    expect(update).toHaveBeenCalledWith('feedingGoals', 'goal');
  });
});

