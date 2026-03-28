import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { toast } from 'react-toastify';

import LandingPage from '../../pages/LandingPage';

jest.mock('../../components/layout/SimpleHeader', () => ({ SimpleHeader: () => <div>header</div> }));
jest.mock('../../components/layout/SimpleFooter', () => ({ SimpleFooter: () => <div>footer</div> }));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('../../utils/getBaseApiUrl', () => ({
  getBaseApiUrl: () => 'http://base',
}));

describe('LandingPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders sections and toggles offerings accordion', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Lunara')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Client Login/i })).toHaveAttribute('href', '/login');

    const first = screen.getByRole('button', { name: /Birth & Recovery/i });
    fireEvent.click(first);
    expect(screen.getByText(/postpartum recovery/i)).toBeInTheDocument();
    fireEvent.click(first);
    expect(screen.queryByText(/postpartum recovery/i)).not.toBeInTheDocument();
  });

  it('submits inquiry form successfully', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'B' } });
    fireEvent.change(screen.getByPlaceholderText(/Phone Number/i), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText(/^Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Inquiry Type/i), { target: { value: 'birth' } });
    fireEvent.change(screen.getByLabelText(/Preferred Consultation Date/i), { target: { value: '2026-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /^Submit$/i }));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalled();
    expect(await screen.findByText(/Thank you for reaching out/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Submit Another Inquiry/i }));
    expect(screen.getByRole('button', { name: /^Submit$/i })).toBeInTheDocument();
  });

  it('shows toast error on failed submit', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ message: 'nope' }),
    }) as unknown as typeof fetch;

    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByPlaceholderText(/First Name/i), { target: { value: 'A' } });
    fireEvent.change(screen.getByPlaceholderText(/Last Name/i), { target: { value: 'B' } });
    fireEvent.change(screen.getByPlaceholderText(/Phone Number/i), { target: { value: '123' } });
    fireEvent.change(screen.getByPlaceholderText(/^Email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/Inquiry Type/i), { target: { value: 'birth' } });
    fireEvent.change(screen.getByLabelText(/Preferred Consultation Date/i), { target: { value: '2026-01-01' } });

    fireEvent.click(screen.getByRole('button', { name: /^Submit$/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('nope'));
  });
});
