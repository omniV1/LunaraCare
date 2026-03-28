import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PendingApprovalsBanner } from '../../components/provider/PendingApprovalsBanner';
import type { Appointment } from '../../components/provider/calendarTypes';

function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    _id: 'appt-1',
    clientId: { _id: 'c1', firstName: 'Jane', lastName: 'Doe', email: 'j@t.com' },
    providerId: { _id: 'p1', firstName: 'Dr', lastName: 'S', email: 'd@t.com' },
    startTime: '2026-03-18T10:00:00.000Z',
    endTime: '2026-03-18T11:00:00.000Z',
    status: 'requested',
    type: 'virtual',
    ...overrides,
  } as Appointment;
}

describe('PendingApprovalsBanner', () => {
  const onConfirm = jest.fn();
  const onDecline = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders nothing when no pending approvals', () => {
    const { container } = render(
      <PendingApprovalsBanner pendingApprovals={[]} actionId={null} onConfirm={onConfirm} onDecline={onDecline} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders count and singular text for one appointment', () => {
    render(
      <PendingApprovalsBanner pendingApprovals={[makeAppt()]} actionId={null} onConfirm={onConfirm} onDecline={onDecline} />
    );
    expect(screen.getByText('1 appointment awaiting approval')).toBeInTheDocument();
  });

  it('pluralizes for multiple appointments', () => {
    const appts = [makeAppt({ _id: 'a1' }), makeAppt({ _id: 'a2' })];
    render(
      <PendingApprovalsBanner pendingApprovals={appts} actionId={null} onConfirm={onConfirm} onDecline={onDecline} />
    );
    expect(screen.getByText('2 appointments awaiting approval')).toBeInTheDocument();
  });

  it('displays client name', () => {
    render(
      <PendingApprovalsBanner pendingApprovals={[makeAppt()]} actionId={null} onConfirm={onConfirm} onDecline={onDecline} />
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('displays appointment notes', () => {
    render(
      <PendingApprovalsBanner
        pendingApprovals={[makeAppt({ notes: 'Need to discuss feeding' })]}
        actionId={null}
        onConfirm={onConfirm}
        onDecline={onDecline}
      />
    );
    expect(screen.getByText(/Need to discuss feeding/)).toBeInTheDocument();
  });

  it('calls onConfirm with appointment id', () => {
    render(
      <PendingApprovalsBanner pendingApprovals={[makeAppt()]} actionId={null} onConfirm={onConfirm} onDecline={onDecline} />
    );
    fireEvent.click(screen.getByText('Approve'));
    expect(onConfirm).toHaveBeenCalledWith('appt-1');
  });

  it('calls onDecline with appointment id', () => {
    render(
      <PendingApprovalsBanner pendingApprovals={[makeAppt()]} actionId={null} onConfirm={onConfirm} onDecline={onDecline} />
    );
    fireEvent.click(screen.getByText('Decline'));
    expect(onDecline).toHaveBeenCalledWith('appt-1');
  });

  it('disables buttons when an action is in progress', () => {
    render(
      <PendingApprovalsBanner pendingApprovals={[makeAppt()]} actionId="appt-1" onConfirm={onConfirm} onDecline={onDecline} />
    );
    // When actionId matches, approve text becomes '...'
    expect(screen.getByText('...')).toBeInTheDocument();
    expect(screen.getByText('Decline')).toBeDisabled();
  });
});
