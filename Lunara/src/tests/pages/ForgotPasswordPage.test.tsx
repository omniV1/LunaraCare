import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import ForgotPasswordPage from '../../pages/ForgotPasswordPage';

jest.mock('../../components/layout/SimpleFooter', () => ({
  SimpleFooter: () => <div data-testid="footer" />,
}));

jest.mock('../../utils/getBaseApiUrl', () => ({
  getBaseApiUrl: () => 'http://api.test',
}));

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('submits email and shows success state', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith('http://api.test/auth/forgot-password', expect.any(Object)),
    );
    expect(await screen.findByText('Check your email')).toBeInTheDocument();
  });

  it('shows error on failed submit', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'nope' }),
    });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'a@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('nope');
  });
});
