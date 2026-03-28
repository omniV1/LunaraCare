import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProviderDashboardLayout } from '../../components/provider/ProviderDashboardLayout';
import type { NavItem } from '../../components/provider/ProviderDashboardLayout';

const mockLogout = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({ user: { firstName: 'Dr. Kim' }, logout: mockLogout }),
}));

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg data-testid="icon-dash" /> },
  { id: 'clients', label: 'Clients', icon: <svg data-testid="icon-clients" />, badge: 5 },
  { id: 'calendar', label: 'Calendar', icon: <svg data-testid="icon-cal" /> },
];

const defaultProps = {
  navItems,
  activeTab: 'dashboard',
  onTabChange: jest.fn(),
  children: <div data-testid="provider-content">Provider content</div>,
};

describe('ProviderDashboardLayout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders welcome message with user name', () => {
    render(<ProviderDashboardLayout {...defaultProps} />);
    const welcomes = screen.getAllByText(/Welcome, Dr. Kim/);
    expect(welcomes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders nav items', () => {
    render(<ProviderDashboardLayout {...defaultProps} />);
    const dashButtons = screen.getAllByText('Dashboard');
    expect(dashButtons.length).toBeGreaterThanOrEqual(1);
    const clientButtons = screen.getAllByText('Clients');
    expect(clientButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders children content', () => {
    render(<ProviderDashboardLayout {...defaultProps} />);
    expect(screen.getByTestId('provider-content')).toBeInTheDocument();
    expect(screen.getByText('Provider content')).toBeInTheDocument();
  });

  it('shows badge count for items with badges', () => {
    render(<ProviderDashboardLayout {...defaultProps} />);
    const badges = screen.getAllByText('5');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onTabChange when nav item is clicked', () => {
    render(<ProviderDashboardLayout {...defaultProps} />);
    const calButtons = screen.getAllByText('Calendar');
    fireEvent.click(calButtons[0]);
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('calendar');
  });

  it('calls logout when logout button clicked', () => {
    render(<ProviderDashboardLayout {...defaultProps} />);
    const logoutBtns = screen.getAllByText('Logout');
    fireEvent.click(logoutBtns[0]);
    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders open menu button for mobile', () => {
    render(<ProviderDashboardLayout {...defaultProps} />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('opens and closes drawer', () => {
    render(<ProviderDashboardLayout {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('renders Lunara copyright', () => {
    render(<ProviderDashboardLayout {...defaultProps} />);
    const copyrights = screen.getAllByText(/Lunara/);
    expect(copyrights.length).toBeGreaterThanOrEqual(1);
  });
});
