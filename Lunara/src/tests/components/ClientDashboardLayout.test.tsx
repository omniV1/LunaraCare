import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ClientDashboardLayout } from '../../components/client/ClientDashboardLayout';
import type { NavItem } from '../../components/client/ClientDashboardLayout';

const mockLogout = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => ({ user: { firstName: 'Sarah' }, logout: mockLogout }),
}));

const navItems: NavItem[] = [
  { id: 'home', label: 'Home', icon: <svg data-testid="icon-home" /> },
  { id: 'appointments', label: 'Appointments', icon: <svg data-testid="icon-appt" />, badge: 3 },
  { id: 'messages', label: 'Messages', icon: <svg data-testid="icon-msg" /> },
];

const defaultProps = {
  navItems,
  activeTab: 'home',
  onTabChange: jest.fn(),
  children: <div data-testid="main-content">Dashboard content</div>,
};

describe('ClientDashboardLayout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders welcome message with user name', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    const welcomes = screen.getAllByText(/Welcome, Sarah/);
    expect(welcomes.length).toBeGreaterThanOrEqual(1);
  });

  it('renders nav items', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    const homeButtons = screen.getAllByText('Home');
    expect(homeButtons.length).toBeGreaterThanOrEqual(1);
    const apptButtons = screen.getAllByText('Appointments');
    expect(apptButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders children content', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard content')).toBeInTheDocument();
  });

  it('shows badge count for items with badges', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    const badges = screen.getAllByText('3');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onTabChange when nav item is clicked', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    const messagesButtons = screen.getAllByText('Messages');
    fireEvent.click(messagesButtons[0]);
    expect(defaultProps.onTabChange).toHaveBeenCalledWith('messages');
  });

  it('calls logout when logout button clicked', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    const logoutBtns = screen.getAllByText('Logout');
    fireEvent.click(logoutBtns[0]);
    expect(mockLogout).toHaveBeenCalled();
  });

  it('renders Lunara copyright', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    const copyrights = screen.getAllByText(/Lunara/);
    expect(copyrights.length).toBeGreaterThanOrEqual(1);
  });

  it('renders open menu button for mobile', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });

  it('opens drawer when hamburger clicked', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    expect(screen.getByLabelText('Close menu')).toBeInTheDocument();
  });

  it('closes drawer on Escape key', () => {
    render(<ClientDashboardLayout {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Open menu'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
  });
});
