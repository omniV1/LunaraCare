import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MfaSetup from '../../components/security/MfaSetup';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockPost = jest.fn();
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => ({ post: mockPost }) },
}));

const { toast } = jest.requireMock('react-toastify');

describe('MfaSetup', () => {
  const onStatusChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Idle (not enabled) ---
  it('shows setup button when MFA is not enabled', () => {
    render(<MfaSetup mfaEnabled={false} onStatusChange={onStatusChange} />);
    expect(screen.getByText('Set Up Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByText(/Add an extra layer of security/)).toBeInTheDocument();
  });

  it('starts setup and shows QR code', async () => {
    mockPost.mockResolvedValueOnce({ qrCode: 'data:image/png;base64,QR', secret: 'MYSECRET' });
    render(<MfaSetup mfaEnabled={false} onStatusChange={onStatusChange} />);

    fireEvent.click(screen.getByText('Set Up Two-Factor Authentication'));

    await waitFor(() => {
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    });
    expect(screen.getByAltText('MFA QR Code')).toBeInTheDocument();
  });

  it('shows error when setup fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Server down'));
    render(<MfaSetup mfaEnabled={false} onStatusChange={onStatusChange} />);

    fireEvent.click(screen.getByText('Set Up Two-Factor Authentication'));

    await waitFor(() => {
      expect(screen.getByText('Server down')).toBeInTheDocument();
    });
  });

  // --- QR step ---
  it('confirms setup with code and shows backup codes', async () => {
    mockPost
      .mockResolvedValueOnce({ qrCode: 'data:qr', secret: 'SECRET' })
      .mockResolvedValueOnce({ backupCodes: ['CODE1', 'CODE2'] });

    render(<MfaSetup mfaEnabled={false} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByText('Set Up Two-Factor Authentication'));

    await waitFor(() => screen.getByText('Scan QR Code'));

    fireEvent.change(screen.getByLabelText(/Enter the 6-digit code/), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify & Enable'));

    await waitFor(() => {
      expect(screen.getByText('2FA Enabled')).toBeInTheDocument();
    });
    expect(screen.getByText('CODE1')).toBeInTheDocument();
    expect(screen.getByText('CODE2')).toBeInTheDocument();
    expect(onStatusChange).toHaveBeenCalledWith(true);
    expect(toast.success).toHaveBeenCalledWith('Two-factor authentication enabled!');
  });

  it('disables verify button when code is too short', async () => {
    mockPost.mockResolvedValueOnce({ qrCode: 'data:qr', secret: 'S' });
    render(<MfaSetup mfaEnabled={false} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByText('Set Up Two-Factor Authentication'));

    await waitFor(() => screen.getByText('Scan QR Code'));

    fireEvent.change(screen.getByLabelText(/Enter the 6-digit code/), { target: { value: '123' } });
    expect(screen.getByText('Verify & Enable')).toBeDisabled();
  });

  it('can cancel QR step', async () => {
    mockPost.mockResolvedValueOnce({ qrCode: 'data:qr', secret: 'S' });
    render(<MfaSetup mfaEnabled={false} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByText('Set Up Two-Factor Authentication'));

    await waitFor(() => screen.getByText('Scan QR Code'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByText('Set Up Two-Factor Authentication')).toBeInTheDocument();
  });

  // --- Enabled state ---
  it('shows enabled status when MFA is on', () => {
    render(<MfaSetup mfaEnabled={true} onStatusChange={onStatusChange} />);
    expect(screen.getByText(/enabled/)).toBeInTheDocument();
    expect(screen.getByText('Disable 2FA')).toBeInTheDocument();
  });

  it('shows disable form when clicking Disable 2FA', () => {
    render(<MfaSetup mfaEnabled={true} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByText('Disable 2FA'));
    expect(screen.getByPlaceholderText('Current password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Auth code/)).toBeInTheDocument();
    expect(screen.getByText('Confirm Disable')).toBeInTheDocument();
  });

  it('disables MFA successfully', async () => {
    mockPost.mockResolvedValueOnce({});
    render(<MfaSetup mfaEnabled={true} onStatusChange={onStatusChange} />);

    fireEvent.click(screen.getByText('Disable 2FA'));
    fireEvent.change(screen.getByPlaceholderText('Current password'), { target: { value: 'pass' } });
    fireEvent.change(screen.getByPlaceholderText(/Auth code/), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Confirm Disable'));

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith(false);
    });
    expect(toast.success).toHaveBeenCalledWith('Two-factor authentication disabled.');
  });

  it('shows error when disable fails', async () => {
    mockPost.mockRejectedValueOnce(new Error('Wrong password'));
    render(<MfaSetup mfaEnabled={true} onStatusChange={onStatusChange} />);

    fireEvent.click(screen.getByText('Disable 2FA'));
    fireEvent.change(screen.getByPlaceholderText('Current password'), { target: { value: 'bad' } });
    fireEvent.change(screen.getByPlaceholderText(/Auth code/), { target: { value: '000000' } });
    fireEvent.click(screen.getByText('Confirm Disable'));

    await waitFor(() => {
      expect(screen.getByText('Wrong password')).toBeInTheDocument();
    });
  });

  it('can cancel disable form', () => {
    render(<MfaSetup mfaEnabled={true} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByText('Disable 2FA'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.getByText('Disable 2FA')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Current password')).not.toBeInTheDocument();
  });

  // --- Backup codes step ---
  it('clicking Done after backup codes returns to idle', async () => {
    mockPost
      .mockResolvedValueOnce({ qrCode: 'data:qr', secret: 'S' })
      .mockResolvedValueOnce({ backupCodes: ['A1', 'B2'] });

    render(<MfaSetup mfaEnabled={false} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByText('Set Up Two-Factor Authentication'));
    await waitFor(() => screen.getByText('Scan QR Code'));

    fireEvent.change(screen.getByLabelText(/Enter the 6-digit code/), { target: { value: '123456' } });
    fireEvent.click(screen.getByText('Verify & Enable'));
    await waitFor(() => screen.getByText('2FA Enabled'));

    fireEvent.click(screen.getByText('Done'));
    // After Done, step resets — since mfaEnabled was false from props, it shows idle state
    expect(screen.getByText('Set Up Two-Factor Authentication')).toBeInTheDocument();
  });
});
