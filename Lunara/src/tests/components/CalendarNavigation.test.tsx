import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalendarNavigation } from '../../components/provider/CalendarNavigation';

describe('CalendarNavigation', () => {
  const defaultProps = {
    monthLabel: 'March 2026',
    onPrevMonth: jest.fn(),
    onNextMonth: jest.fn(),
    onGoToToday: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders month label', () => {
    render(<CalendarNavigation {...defaultProps} />);
    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('calls onPrevMonth when previous button clicked', () => {
    render(<CalendarNavigation {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Previous month'));
    expect(defaultProps.onPrevMonth).toHaveBeenCalledTimes(1);
  });

  it('calls onNextMonth when next button clicked', () => {
    render(<CalendarNavigation {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Next month'));
    expect(defaultProps.onNextMonth).toHaveBeenCalledTimes(1);
  });

  it('calls onGoToToday when Today button clicked', () => {
    render(<CalendarNavigation {...defaultProps} />);
    fireEvent.click(screen.getByText('Today'));
    expect(defaultProps.onGoToToday).toHaveBeenCalledTimes(1);
  });
});
