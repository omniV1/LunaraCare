import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { PushNotificationToggle } from '../../components/PushNotificationToggle';

const mockPushService = {
  isSupported: jest.fn(),
  getPermissionState: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
};

jest.mock('../../services/pushService', () => ({
  __esModule: true,
  default: {
    getInstance: () => mockPushService,
  },
}));

function setServiceWorkerReady(hasSubscription: boolean) {
  const getSubscription = jest.fn().mockResolvedValue(hasSubscription ? { endpoint: 'e' } : null);
  (globalThis.navigator as unknown as Record<string, unknown>).serviceWorker = {
    ready: Promise.resolve({ pushManager: { getSubscription } }),
  };
  return { getSubscription };
}

describe('PushNotificationToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows unsupported message when push is not supported', () => {
    mockPushService.isSupported.mockReturnValue(false);
    render(<PushNotificationToggle />);
    expect(screen.getByText(/not supported/i)).toBeInTheDocument();
  });

  it('shows blocked message when permission is denied', async () => {
    mockPushService.isSupported.mockReturnValue(true);
    mockPushService.getPermissionState.mockResolvedValue('denied');
    setServiceWorkerReady(false);

    render(<PushNotificationToggle />);
    expect(await screen.findByText(/blocked/i)).toBeInTheDocument();
  });

  it('toggles subscription state and calls subscribe/unsubscribe', async () => {
    mockPushService.isSupported.mockReturnValue(true);
    mockPushService.getPermissionState.mockResolvedValue('default');
    // Sequence:
    // - mount refreshState: unsubscribed
    // - after subscribe: refreshState sees subscription
    // - after unsubscribe: refreshState can return null (not required for this assertion)
    const getSubscription = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ endpoint: 'e' })
      .mockResolvedValueOnce({ endpoint: 'e' })
      .mockResolvedValue(null);
    (globalThis.navigator as unknown as Record<string, unknown>).serviceWorker = {
      ready: Promise.resolve({ pushManager: { getSubscription } }),
    };

    render(<PushNotificationToggle />);

    const switchBtn = await screen.findByRole('switch');
    expect(switchBtn).toHaveAttribute('aria-checked', 'false');

    mockPushService.subscribe.mockResolvedValue(true);

    fireEvent.click(switchBtn);
    await waitFor(() => expect(mockPushService.subscribe).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(switchBtn).toHaveAttribute('aria-checked', 'true'));

    // Clicking again should call unsubscribe (subscribed should now be true)
    mockPushService.unsubscribe.mockResolvedValue(undefined);
    fireEvent.click(switchBtn);
    await waitFor(() => expect(mockPushService.unsubscribe).toHaveBeenCalledTimes(1));
  });
});

