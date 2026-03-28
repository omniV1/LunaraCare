import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { InviteClient } from '../../../components/provider/InviteClient';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const api = { post: jest.fn() };
jest.mock('../../../api/apiClient', () => ({
  ApiClient: { getInstance: () => api },
}));

describe('InviteClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('opens the invite form and validates inputs', () => {
    render(<InviteClient />);
    fireEvent.click(screen.getByText('Invite New Client'));

    // Fill required fields with whitespace/invalid so native `required` doesn't block submit,
    // but component-level validation still fails.
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: '   ' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'bad-email' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Send Invite' }).closest('form')!);

    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Last name is required')).toBeInTheDocument();
    expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
  });

  it('submits invite and calls onInvited', async () => {
    api.post.mockResolvedValue({});
    const onInvited = jest.fn();
    render(<InviteClient onInvited={onInvited} />);
    fireEvent.click(screen.getByText('Invite New Client'));

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/providers/invite-client', { firstName: 'A', lastName: 'B', email: 'a@b.com' }),
    );
    expect(toast.success).toHaveBeenCalled();
    expect(onInvited).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Invite New Client')).toBeInTheDocument();
  });

  it('shows toast error on failure', async () => {
    api.post.mockRejectedValue(new Error('nope'));
    render(<InviteClient />);
    fireEvent.click(screen.getByText('Invite New Client'));
    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('nope'));
  });
});

