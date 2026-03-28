import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { AppointmentStatusBadge } from '../../../../components/client/appointments/AppointmentStatusBadge';

describe('AppointmentStatusBadge', () => {
  it('renders correct label for status', () => {
    render(<AppointmentStatusBadge status="requested" />);
    expect(screen.getByText('Pending approval')).toBeInTheDocument();

    render(<AppointmentStatusBadge status="confirmed" />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });
});

