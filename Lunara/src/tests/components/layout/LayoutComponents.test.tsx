import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

import { MainLayout } from '../../../components/layout/MainLayout';
import { SimpleFooter } from '../../../components/layout/SimpleFooter';
import { SimpleHeader } from '../../../components/layout/SimpleHeader';

const mockUseAuth = jest.fn();
jest.mock('../../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('layout components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      getDashboardRoute: () => '/client/dashboard',
    });
  });

  it('SimpleFooter renders legal links and year', () => {
    render(
      <MemoryRouter>
        <SimpleFooter fixed={false} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });

  it('SimpleHeader renders nav and toggles mobile menu', () => {
    render(
      <MemoryRouter>
        <SimpleHeader />
      </MemoryRouter>,
    );

    expect(screen.getByText('Lunara')).toBeInTheDocument();
    expect(screen.getAllByText('Blog').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Login').length).toBeGreaterThan(0);

    const btn = screen.getByRole('button', { name: 'Open menu' });
    fireEvent.click(btn);
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument();
  });

  it('SimpleHeader uses dashboard link when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { role: 'client' },
      getDashboardRoute: () => '/client/dashboard',
    });
    render(
      <MemoryRouter>
        <SimpleHeader />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
  });

  it('MainLayout composes header/footer and renders children', () => {
    render(
      <MemoryRouter>
        <MainLayout>
          <div>child</div>
        </MainLayout>
      </MemoryRouter>,
    );
    expect(screen.getByText('child')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Lunara')).toBeInTheDocument();
  });
});

