import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Keep App test lightweight: cover routing structure without pulling in full page trees
jest.mock('../contexts/AuthContext', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));
jest.mock('../contexts/ResourceContext', () => ({
  __esModule: true,
  default: ({ children }: any) => <>{children}</>,
}));
jest.mock('../components/layout/MainLayout', () => ({
  MainLayout: ({ children }: any) => <div data-testid="layout">{children}</div>,
}));
jest.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toasts" />,
}));

jest.mock('../pages/LandingPage', () => ({ __esModule: true, default: () => <div>Landing</div> }));
jest.mock('../pages/BlogPage', () => ({ __esModule: true, default: () => <div>Blog</div> }));
jest.mock('../pages/BlogPostDetail', () => ({ __esModule: true, default: () => <div>BlogDetail</div> }));
jest.mock('../pages/LoginPage', () => ({ __esModule: true, default: () => <div>Login</div> }));
jest.mock('../pages/ForgotPasswordPage', () => ({ __esModule: true, default: () => <div>Forgot</div> }));
jest.mock('../pages/ResetPasswordPage', () => ({ __esModule: true, default: () => <div>Reset</div> }));
jest.mock('../pages/VerifyEmailPage', () => ({ __esModule: true, default: () => <div>Verify</div> }));
jest.mock('../pages/ProviderDashboard', () => ({ __esModule: true, default: () => <div>ProviderDash</div> }));
jest.mock('../pages/ClientDashboard', () => ({ __esModule: true, default: () => <div>ClientDash</div> }));
jest.mock('../pages/SecuritySettingsPage', () => ({ __esModule: true, default: () => <div>SecuritySettings</div> }));

// ProtectedRoute already has dedicated tests; here we just allow passthrough
jest.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: any) => <>{children}</>,
}));

import App from '../App';

describe('App', () => {
  afterEach(() => cleanup());

  it('renders landing page at /', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    // React.lazy components resolve asynchronously
    await waitFor(() => expect(screen.getByText('Landing')).toBeInTheDocument());
    expect(screen.getByTestId('toasts')).toBeInTheDocument();
  });

  it('renders blog routes inside layout', async () => {
    window.history.pushState({}, '', '/blog');
    const first = render(<App />);
    await waitFor(() => expect(screen.getByText('Blog')).toBeInTheDocument());
    expect(screen.getAllByTestId('layout').length).toBeGreaterThan(0);
    first.unmount();

    window.history.pushState({}, '', '/blog/some-slug');
    render(<App />);
    await waitFor(() => expect(screen.getByText('BlogDetail')).toBeInTheDocument());
    expect(screen.getAllByTestId('layout').length).toBeGreaterThan(0);
  });

  it('renders login and verify pages', async () => {
    window.history.pushState({}, '', '/login');
    const first = render(<App />);
    await waitFor(() => expect(screen.getByText('Login')).toBeInTheDocument());
    first.unmount();

    window.history.pushState({}, '', '/verify-email');
    render(<App />);
    await waitFor(() => expect(screen.getByText('Verify')).toBeInTheDocument());
  });
});

