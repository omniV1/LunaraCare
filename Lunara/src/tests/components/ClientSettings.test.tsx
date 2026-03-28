import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ClientSettings } from '../../components/client/ClientSettings';
import { useAuth } from '../../contexts/useAuth';
import { UserService } from '../../services/userService';
import { toast } from 'react-toastify';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('../../contexts/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../services/userService', () => ({
  UserService: {
    getInstance: jest.fn(),
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../components/PushNotificationToggle', () => ({
  PushNotificationToggle: () => <div data-testid="push-notification-toggle">PushNotificationToggle</div>,
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetInstance = UserService.getInstance as jest.Mock;

const defaultUser = {
  id: '1',
  email: 'jane@example.com',
  role: 'client' as const,
  firstName: 'Jane',
  lastName: 'Doe',
  mfaEnabled: false,
};

const defaultAuthValue = {
  user: defaultUser,
  isAuthenticated: true,
  loading: false,
  error: null,
  logout: jest.fn(),
  clientLogin: jest.fn(),
  providerLogin: jest.fn(),
  verifyMfa: jest.fn(),
  loginWithTokens: jest.fn(),
  registerClient: jest.fn(),
  clearError: jest.fn(),
  getDashboardRoute: jest.fn(),
  isProvider: false,
  isClient: true,
};

const buildMockService = (overrides: Record<string, jest.Mock> = {}) => ({
  getCurrentProfile: jest.fn().mockResolvedValue({
    user: { firstName: 'Jane', lastName: 'Doe' },
    profile: { babyBirthDate: '2025-06-15T00:00:00.000Z' },
  }),
  getPreferences: jest.fn().mockResolvedValue({
    preferences: {
      emailNotifications: true,
      appointmentReminders: true,
      messageAlerts: false,
      checkInReminders: true,
      loginAlerts: true,
    },
  }),
  updateProfile: jest.fn().mockResolvedValue({}),
  changePassword: jest.fn().mockResolvedValue({ message: 'ok' }),
  updatePreferences: jest.fn().mockResolvedValue({ message: 'ok', preferences: {} }),
  deleteAccount: jest.fn().mockResolvedValue({ message: 'ok' }),
  ...overrides,
});

const renderComponent = () =>
  render(
    <BrowserRouter>
      <ClientSettings />
    </BrowserRouter>,
  );

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ClientSettings', () => {
  let mockService: ReturnType<typeof buildMockService>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockService = buildMockService();
    mockGetInstance.mockReturnValue(mockService);
    mockUseAuth.mockReturnValue(defaultAuthValue);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // Rendering & loading state
  // -----------------------------------------------------------------------

  describe('rendering and loading state', () => {
    it('renders the page heading', async () => {
      renderComponent();
      expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });

    it('shows loading text while profile is being fetched', () => {
      // Make the profile promise hang
      mockService.getCurrentProfile.mockReturnValue(new Promise(() => {}));
      renderComponent();

      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('renders profile form with user data after fetching', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText('First Name')).toHaveValue('Jane');
      expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
      expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com');
      expect(screen.getByLabelText('Email')).toBeDisabled();
      expect(screen.getByLabelText('Delivery Date')).toHaveValue('2025-06-15');
    });

    it('renders all sidebar navigation buttons', async () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /Profile/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Password/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Notifications/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Security/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete Account/ })).toBeInTheDocument();
    });

    it('falls back to auth context values when profile fetch fails', async () => {
      mockService.getCurrentProfile.mockRejectedValue(new Error('Network error'));
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      // Should still show auth context defaults
      expect(screen.getByLabelText('First Name')).toHaveValue('Jane');
      expect(screen.getByLabelText('Last Name')).toHaveValue('Doe');
    });
  });

  // -----------------------------------------------------------------------
  // Profile section
  // -----------------------------------------------------------------------

  describe('profile section', () => {
    it('updates first name and last name fields', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      const firstNameInput = screen.getByLabelText('First Name');
      const lastNameInput = screen.getByLabelText('Last Name');

      fireEvent.change(firstNameInput, { target: { value: 'Alice' } });
      fireEvent.change(lastNameInput, { target: { value: 'Smith' } });

      expect(firstNameInput).toHaveValue('Alice');
      expect(lastNameInput).toHaveValue('Smith');
    });

    it('updates delivery date field', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      const dateInput = screen.getByLabelText('Delivery Date');
      fireEvent.change(dateInput, { target: { value: '2025-09-01' } });

      expect(dateInput).toHaveValue('2025-09-01');
    });

    it('saves profile successfully and shows toast', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockService.updateProfile).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
          babyBirthDate: '2025-06-15',
        });
      });

      expect(toast.success).toHaveBeenCalledWith('Profile updated');
    });

    it('shows error toast when first or last name is empty', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      fireEvent.change(screen.getByLabelText('First Name'), { target: { value: '   ' } });
      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('First and last name are required');
      });

      expect(mockService.updateProfile).not.toHaveBeenCalled();
    });

    it('shows error toast when profile save fails', async () => {
      mockService.updateProfile.mockRejectedValue({
        response: { data: { error: 'Server error' } },
      });

      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Server error');
      });
    });

    it('shows generic error when profile save fails without structured error', async () => {
      mockService.updateProfile.mockRejectedValue(new Error('Network failure'));

      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Network failure');
      });
    });

    it('shows "Saving..." text on the button while saving', async () => {
      let resolveUpdate!: () => void;
      mockService.updateProfile.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveUpdate = resolve;
        }),
      );

      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      await act(async () => {
        resolveUpdate();
      });

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Password section
  // -----------------------------------------------------------------------

  describe('password section', () => {
    const navigateToPassword = async () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Password/ }));
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
      });
    };

    it('renders password form fields when Password tab is active', async () => {
      await navigateToPassword();

      expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    });

    it('shows inline mismatch warning when passwords differ', async () => {
      await navigateToPassword();

      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewPass1' } });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'Different' } });

      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });

    it('disables submit button when fields are incomplete', async () => {
      await navigateToPassword();

      const submitBtn = screen.getByRole('button', { name: /Change Password/i });
      expect(submitBtn).toBeDisabled();
    });

    it('validates minimum password length', async () => {
      await navigateToPassword();

      fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1' } });
      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'Short1' } });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'Short1' } });

      fireEvent.submit(screen.getByLabelText('Current Password').closest('form')!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('New password must be at least 8 characters');
      });

      expect(mockService.changePassword).not.toHaveBeenCalled();
    });

    it('validates password complexity (uppercase, lowercase, number)', async () => {
      await navigateToPassword();

      fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1' } });
      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'alllowercase1' } });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'alllowercase1' } });

      fireEvent.submit(screen.getByLabelText('Current Password').closest('form')!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Password must contain uppercase, lowercase, and a number');
      });
    });

    it('validates password confirmation match', async () => {
      await navigateToPassword();

      fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1' } });
      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'ValidPass1' } });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'ValidPass2' } });

      fireEvent.submit(screen.getByLabelText('Current Password').closest('form')!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
      });
    });

    it('changes password successfully and triggers logout after delay', async () => {
      await navigateToPassword();

      fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1' } });
      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewValidPass1' } });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'NewValidPass1' } });

      fireEvent.submit(screen.getByLabelText('Current Password').closest('form')!);

      await waitFor(() => {
        expect(mockService.changePassword).toHaveBeenCalledWith('OldPass1', 'NewValidPass1');
        expect(toast.success).toHaveBeenCalledWith('Password changed. Please log in again.');
      });

      // Verify fields are cleared
      expect(screen.getByLabelText('Current Password')).toHaveValue('');
      expect(screen.getByLabelText('New Password')).toHaveValue('');
      expect(screen.getByLabelText('Confirm New Password')).toHaveValue('');

      // Logout should be called after the 1500ms timer
      expect(defaultAuthValue.logout).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(1500);
      });
      expect(defaultAuthValue.logout).toHaveBeenCalled();
    });

    it('shows error toast when password change fails', async () => {
      mockService.changePassword.mockRejectedValue({
        response: { data: { error: 'Current password is incorrect' } },
      });

      await navigateToPassword();

      fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'WrongPass1' } });
      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewValidPass1' } });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'NewValidPass1' } });

      fireEvent.submit(screen.getByLabelText('Current Password').closest('form')!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Current password is incorrect');
      });
    });

    it('shows "Changing..." on button while processing', async () => {
      let resolveChange!: () => void;
      mockService.changePassword.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveChange = resolve;
        }),
      );

      await navigateToPassword();

      fireEvent.change(screen.getByLabelText('Current Password'), { target: { value: 'OldPass1' } });
      fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'NewValidPass1' } });
      fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: 'NewValidPass1' } });

      fireEvent.submit(screen.getByLabelText('Current Password').closest('form')!);

      await waitFor(() => {
        expect(screen.getByText('Changing...')).toBeInTheDocument();
      });

      await act(async () => {
        resolveChange();
      });
    });
  });

  // -----------------------------------------------------------------------
  // Notifications section
  // -----------------------------------------------------------------------

  describe('notifications section', () => {
    const navigateToNotifications = async () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));
      await waitFor(() => {
        expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      });
    };

    it('shows loading text while preferences are being fetched', () => {
      mockService.getPreferences.mockReturnValue(new Promise(() => {}));
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));

      expect(screen.getByText('Loading preferences...')).toBeInTheDocument();
    });

    it('renders all preference toggles after fetching', async () => {
      await navigateToNotifications();

      await waitFor(() => {
        expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('Appointment Reminders')).toBeInTheDocument();
      expect(screen.getByText('Message Alerts')).toBeInTheDocument();
      expect(screen.getByText('Check-in Reminders')).toBeInTheDocument();
      expect(screen.getByText('Login Alerts')).toBeInTheDocument();
    });

    it('renders the PushNotificationToggle component', async () => {
      await navigateToNotifications();

      await waitFor(() => {
        expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('push-notification-toggle')).toBeInTheDocument();
    });

    it('toggles a preference and calls updatePreferences', async () => {
      await navigateToNotifications();

      await waitFor(() => {
        expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
      });

      // messageAlerts starts as false from mock, so toggling should set to true
      const switches = screen.getAllByRole('switch');
      // The order matches: emailNotifications, appointmentReminders, messageAlerts, checkInReminders, loginAlerts
      const messageAlertsSwitch = switches[2];

      expect(messageAlertsSwitch).toHaveAttribute('aria-checked', 'false');

      await act(async () => {
        fireEvent.click(messageAlertsSwitch);
      });

      await waitFor(() => {
        expect(mockService.updatePreferences).toHaveBeenCalledWith({ messageAlerts: true });
      });
    });

    it('reverts preference on API failure and shows error toast', async () => {
      mockService.updatePreferences.mockRejectedValue(new Error('Server error'));

      await navigateToNotifications();
      await waitFor(() => {
        expect(screen.queryByText('Loading preferences...')).not.toBeInTheDocument();
      });

      // emailNotifications starts as true; toggling should attempt to set false
      const switches = screen.getAllByRole('switch');
      const emailSwitch = switches[0];

      expect(emailSwitch).toHaveAttribute('aria-checked', 'true');

      await act(async () => {
        fireEvent.click(emailSwitch);
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update preference');
      });

      // The preference should be reverted back to true
      await waitFor(() => {
        expect(emailSwitch).toHaveAttribute('aria-checked', 'true');
      });
    });
  });

  // -----------------------------------------------------------------------
  // Security section
  // -----------------------------------------------------------------------

  describe('security section', () => {
    const navigateToSecurity = async () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Security/ }));
      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication (2FA)')).toBeInTheDocument();
      });
    };

    it('shows 2FA as Disabled when mfaEnabled is false', async () => {
      await navigateToSecurity();

      expect(screen.getByText('Disabled')).toBeInTheDocument();
      expect(screen.getByText('Add an extra layer of security to your account.')).toBeInTheDocument();
    });

    it('shows 2FA as Enabled when mfaEnabled is true', async () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthValue,
        user: { ...defaultUser, mfaEnabled: true },
      });

      await navigateToSecurity();

      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByText('Your account is protected with 2FA.')).toBeInTheDocument();
    });

    it('navigates to /settings/security when Manage 2FA is clicked', async () => {
      await navigateToSecurity();

      fireEvent.click(screen.getByText('Manage 2FA Settings'));

      expect(mockNavigate).toHaveBeenCalledWith('/settings/security');
    });
  });

  // -----------------------------------------------------------------------
  // Delete Account section
  // -----------------------------------------------------------------------

  describe('delete account section', () => {
    const navigateToDelete = async () => {
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Delete Account/ }));
      await waitFor(() => {
        expect(screen.getByText(/Permanently delete your account/)).toBeInTheDocument();
      });
    };

    it('renders the delete account form', async () => {
      await navigateToDelete();

      expect(screen.getByLabelText('Enter your password')).toBeInTheDocument();
      expect(screen.getByText('Permanently Delete Account')).toBeInTheDocument();
    });

    it('disables delete button until DELETE is typed and password provided', async () => {
      await navigateToDelete();

      const deleteBtn = screen.getByRole('button', { name: /Permanently Delete Account/i });
      expect(deleteBtn).toBeDisabled();

      fireEvent.change(screen.getByLabelText('Enter your password'), { target: { value: 'mypassword' } });
      expect(deleteBtn).toBeDisabled();

      fireEvent.change(screen.getByLabelText(/Type/), { target: { value: 'DELETE' } });
      expect(deleteBtn).not.toBeDisabled();
    });

    it('shows error if DELETE is not typed on submit', async () => {
      await navigateToDelete();

      fireEvent.change(screen.getByLabelText('Enter your password'), { target: { value: 'mypassword' } });
      fireEvent.change(screen.getByLabelText(/Type/), { target: { value: 'WRONG' } });

      fireEvent.submit(screen.getByLabelText('Enter your password').closest('form')!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please type DELETE to confirm');
      });
    });

    it('shows error if password is empty on submit', async () => {
      await navigateToDelete();

      fireEvent.change(screen.getByLabelText(/Type/), { target: { value: 'DELETE' } });

      fireEvent.submit(screen.getByLabelText(/Type/).closest('form')!);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Password is required');
      });
    });

    it('deletes account successfully and triggers logout', async () => {
      await navigateToDelete();

      fireEvent.change(screen.getByLabelText('Enter your password'), { target: { value: 'mypassword' } });
      fireEvent.change(screen.getByLabelText(/Type/), { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByRole('button', { name: /Permanently Delete Account/i }));

      await waitFor(() => {
        expect(mockService.deleteAccount).toHaveBeenCalledWith('mypassword');
        expect(toast.success).toHaveBeenCalledWith('Account deleted');
      });

      expect(defaultAuthValue.logout).not.toHaveBeenCalled();
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(defaultAuthValue.logout).toHaveBeenCalled();
    });

    it('shows error toast when account deletion fails', async () => {
      mockService.deleteAccount.mockRejectedValue({
        response: { data: { error: 'Incorrect password' } },
      });

      await navigateToDelete();

      fireEvent.change(screen.getByLabelText('Enter your password'), { target: { value: 'wrong' } });
      fireEvent.change(screen.getByLabelText(/Type/), { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByRole('button', { name: /Permanently Delete Account/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Incorrect password');
      });
    });

    it('shows "Deleting..." while deletion is in progress', async () => {
      let resolveDelete!: () => void;
      mockService.deleteAccount.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
      );

      await navigateToDelete();

      fireEvent.change(screen.getByLabelText('Enter your password'), { target: { value: 'mypassword' } });
      fireEvent.change(screen.getByLabelText(/Type/), { target: { value: 'DELETE' } });

      fireEvent.click(screen.getByRole('button', { name: /Permanently Delete Account/i }));

      await waitFor(() => {
        expect(screen.getByText('Deleting...')).toBeInTheDocument();
      });

      await act(async () => {
        resolveDelete();
      });

      await waitFor(() => {
        expect(screen.getByText('Permanently Delete Account')).toBeInTheDocument();
      });
    });

    it('lists the consequences of account deletion', async () => {
      await navigateToDelete();

      expect(screen.getByText('Delete your profile and personal information')).toBeInTheDocument();
      expect(screen.getByText('Remove all your documents and uploads')).toBeInTheDocument();
      expect(screen.getByText('Cancel any upcoming appointments')).toBeInTheDocument();
      expect(screen.getByText('Remove your message history')).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Section navigation
  // -----------------------------------------------------------------------

  describe('section navigation', () => {
    it('switches between sections when sidebar buttons are clicked', async () => {
      renderComponent();

      // Start on profile
      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      });

      // Navigate to password
      fireEvent.click(screen.getByRole('button', { name: /Password/ }));
      expect(screen.getByRole('heading', { name: 'Change Password' })).toBeInTheDocument();
      expect(screen.queryByText('Edit Profile')).not.toBeInTheDocument();

      // Navigate to notifications
      fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'Change Password' })).not.toBeInTheDocument();

      // Navigate to security
      fireEvent.click(screen.getByRole('button', { name: /Security/ }));
      await waitFor(() => {
        expect(screen.getByText('Two-Factor Authentication (2FA)')).toBeInTheDocument();
      });

      // Navigate to delete account
      fireEvent.click(screen.getByRole('button', { name: /Delete Account/ }));
      expect(screen.getByText(/Permanently delete your account/)).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  describe('edge cases', () => {
    it('handles user being null gracefully', async () => {
      mockUseAuth.mockReturnValue({
        ...defaultAuthValue,
        user: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText('Email')).toHaveValue('');
    });

    it('does not set babyBirthDate when profile has no birth date', async () => {
      mockService.getCurrentProfile.mockResolvedValue({
        user: { firstName: 'Jane', lastName: 'Doe' },
        profile: {},
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      expect(screen.getByLabelText('Delivery Date')).toHaveValue('');
    });

    it('omits babyBirthDate from save payload when not set', async () => {
      mockService.getCurrentProfile.mockResolvedValue({
        user: { firstName: 'Jane', lastName: 'Doe' },
        profile: {},
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockService.updateProfile).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
        });
      });
    });

    it('shows fallback error message when error has no structured data', async () => {
      mockService.updateProfile.mockRejectedValue({});

      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update profile');
      });
    });
  });
});
