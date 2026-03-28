import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import VerifyEmailPage from '../../pages/VerifyEmailPage';

jest.mock('../../components/layout/SimpleFooter', () => ({
  SimpleFooter: () => <div data-testid="footer" />,
}));

jest.mock('../../utils/getBaseApiUrl', () => ({
  getBaseApiUrl: () => 'http://api.test',
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('shows error when token is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/verify-email']}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Verification Failed')).toBeInTheDocument();
    expect(screen.getByText(/No verification token provided/)).toBeInTheDocument();
  });

  it('verifies token successfully', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=t1']}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Verifying your email/)).toBeInTheDocument();
    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith('http://api.test/auth/verify-email', expect.any(Object)),
    );
    expect(await screen.findByText('Verified!')).toBeInTheDocument();
  });

  it('handles server error response', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'expired' }),
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=t1']}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Verification Failed')).toBeInTheDocument();
    expect(screen.getByText('expired')).toBeInTheDocument();
  });
});
