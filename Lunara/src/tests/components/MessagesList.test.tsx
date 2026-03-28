import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { MessagesList } from '../../components/MessagesList';

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

let onNewMessageCb: ((payload: any) => void) | null = null;
jest.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({
    onNewMessage: (cb: any) => {
      onNewMessageCb = cb;
      return () => {
        onNewMessageCb = null;
      };
    },
  }),
}));

const api = {
  get: jest.fn(),
  put: jest.fn(),
};
jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => api,
  },
}));

describe('MessagesList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    onNewMessageCb = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders empty state when there are no messages', async () => {
    api.get.mockImplementation((path: string) => {
      if (path === '/messages/unread') return Promise.resolve([]);
      if (path === '/messages/unread/count') return Promise.resolve({ count: 0 });
      throw new Error(`unexpected GET ${path}`);
    });

    render(<MessagesList />);

    expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
  });

  it('shows unread badge, handles realtime unread messages, and clears all', async () => {
    api.get.mockImplementation((path: string) => {
      if (path === '/messages/unread') {
        return Promise.resolve([
          {
            _id: 'm1',
            conversationId: 'c1',
            sender: { firstName: 'Jane', lastName: 'Doe' },
            receiver: 'x',
            content: 'Hello',
            read: false,
            createdAt: '2026-03-18T10:00:00.000Z',
          },
        ]);
      }
      if (path === '/messages/unread/count') return Promise.resolve({ count: 1 });
      throw new Error(`unexpected GET ${path}`);
    });
    api.put.mockResolvedValue({});

    const cleared = jest.fn();
    render(<MessagesList onNotificationCleared={cleared} />);

    expect(await screen.findByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('1 New')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();

    // Realtime unread message should prepend and increment count
    await act(async () => {
      onNewMessageCb?.({
        id: 'm2',
        conversationId: 'c1',
        sender: 'system',
        receiver: 'x',
        content: 'Appointment confirmed',
        createdAt: '2026-03-18T11:00:00.000Z',
        read: false,
        type: 'system',
      });
    });

    expect(await screen.findByText('Appointment confirmed')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear all notifications' }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/messages/read-all', {}));
    expect(cleared).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith('All notifications cleared');
  });

  it('shows toast on load failure without crashing', async () => {
    api.get.mockRejectedValue(new Error('boom'));
    render(<MessagesList />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load messages'));
  });
});

