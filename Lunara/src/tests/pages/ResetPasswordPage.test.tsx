import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import ResetPasswordPage from '../../pages/ResetPasswordPage';

jest.mock('../../components/layout/SimpleFooter', () => ({
  SimpleFooter: () => <div data-testid="footer" />,
}));

jest.mock('../../utils/getBaseApiUrl', () => ({
  getBaseApiUrl: () => 'http://api.test',
}));

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('shows invalid token state when token is missing', () => {
    render(
      <MemoryRouter initialEntries={['/reset-password']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );
    expect(screen.getByText('Invalid Reset Link')).toBeInTheDocument();
  });

  it('validates passwords and can reset successfully', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(
      <MemoryRouter initialEntries={['/reset-password?token=t1']}>
        <ResetPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'Short1' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'Short1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('at least 8 characters');

    fireEvent.change(screen.getByPlaceholderText('New Password'), { target: { value: 'ValidPass1' } });
    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'Mismatch1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');

    fireEvent.change(screen.getByPlaceholderText('Confirm Password'), { target: { value: 'ValidPass1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith('http://api.test/auth/reset-password', expect.any(Object)),
    );
    expect(await screen.findByText('Password Reset')).toBeInTheDocument();
  });
});
