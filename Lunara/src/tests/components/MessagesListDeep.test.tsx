/**
 * Deep tests for MessagesList – covers rendering, loading/error states,
 * realtime websocket messages, deduplication, clear all notifications,
 * clear failure handling, polling interval, date sorting, read/unread
 * badge display, message type distinctions (system vs user), and
 * appointment-type detection.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

let onNewMessageCb: ((payload: any) => void) | null = null;
jest.mock('../../hooks/useSocket', () => ({
  useSocket: () => ({
    onNewMessage: (cb: any) => {
      onNewMessageCb = cb;
      return () => { onNewMessageCb = null; };
    },
  }),
}));

const api = {
  get: jest.fn(),
  put: jest.fn(),
};
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => api },
}));

import { MessagesList } from '../../components/MessagesList';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeMessage(overrides: Record<string, any> = {}) {
  return {
    _id: 'm1',
    conversationId: 'c1',
    sender: { firstName: 'Jane', lastName: 'Doe' },
    receiver: 'me',
    content: 'Hello world',
    read: false,
    createdAt: '2026-03-18T10:00:00.000Z',
    ...overrides,
  };
}

function setupApiForMessages(messages: any[], unreadCount?: number) {
  api.get.mockImplementation((path: string) => {
    if (path === '/messages/unread') return Promise.resolve(messages);
    if (path === '/messages/unread/count') return Promise.resolve({ count: unreadCount ?? messages.length });
    return Promise.reject(new Error(`unexpected GET ${path}`));
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MessagesList – deep tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    onNewMessageCb = null;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ---- Loading state ----

  describe('loading state', () => {
    it('shows spinner while loading messages', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // never resolves
      const { container } = render(<MessagesList />);
      expect(container.querySelector('.animate-spin')).toBeTruthy();
    });
  });

  // ---- Empty state ----

  describe('empty state', () => {
    it('renders "No notifications yet" when no messages exist', async () => {
      setupApiForMessages([]);
      render(<MessagesList />);
      expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
      expect(screen.getByText(/Document submissions and alerts will appear here/)).toBeInTheDocument();
    });

    it('does not show the unread badge or clear button when empty', async () => {
      setupApiForMessages([]);
      render(<MessagesList />);
      await screen.findByText('No notifications yet');
      expect(screen.queryByText(/New/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Clear all notifications' })).not.toBeInTheDocument();
    });
  });

  // ---- Rendering messages ----

  describe('rendering messages', () => {
    it('displays message content and sender name', async () => {
      setupApiForMessages([makeMessage()]);
      render(<MessagesList />);
      expect(await screen.findByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('shows unread badge with correct count', async () => {
      setupApiForMessages([makeMessage(), makeMessage({ _id: 'm2', content: 'Second' })], 2);
      render(<MessagesList />);
      expect(await screen.findByText('2 New')).toBeInTheDocument();
    });

    it('shows NEW tag on unread messages', async () => {
      setupApiForMessages([makeMessage({ read: false })]);
      render(<MessagesList />);
      expect(await screen.findByText('NEW')).toBeInTheDocument();
    });

    it('does not show NEW tag on read messages', async () => {
      setupApiForMessages([makeMessage({ read: true })], 0);
      render(<MessagesList />);
      await screen.findByText('Hello world');
      expect(screen.queryByText('NEW')).not.toBeInTheDocument();
    });

    it('sorts messages by date (newest first)', async () => {
      setupApiForMessages([
        makeMessage({ _id: 'old', content: 'Old message', createdAt: '2026-01-01T00:00:00.000Z' }),
        makeMessage({ _id: 'new', content: 'New message', createdAt: '2026-03-20T00:00:00.000Z' }),
      ]);
      render(<MessagesList />);
      await screen.findByText('Old message');
      const items = screen.getAllByText(/message/i);
      // "New message" should appear before "Old message" in the DOM
      const newIdx = items.findIndex(el => el.textContent === 'New message');
      const oldIdx = items.findIndex(el => el.textContent === 'Old message');
      expect(newIdx).toBeLessThan(oldIdx);
    });

    it('shows "System" for messages with string sender', async () => {
      setupApiForMessages([makeMessage({ sender: 'system-id' })]);
      render(<MessagesList />);
      expect(await screen.findByText('System')).toBeInTheDocument();
    });

    it('identifies system-type messages and shows Document badge', async () => {
      setupApiForMessages([makeMessage({ type: 'system', content: 'Document submitted' })]);
      render(<MessagesList />);
      expect(await screen.findByText('Document')).toBeInTheDocument();
    });

    it('identifies appointment-type system messages', async () => {
      setupApiForMessages([
        makeMessage({
          type: 'system',
          content: 'Your appointment has been confirmed',
          title: 'Appointment Update',
        }),
      ]);
      render(<MessagesList />);
      expect(await screen.findByText('Appointment')).toBeInTheDocument();
    });
  });

  // ---- Realtime / socket messages ----

  describe('realtime messages via websocket', () => {
    it('prepends new unread messages and increments count', async () => {
      setupApiForMessages([makeMessage()], 1);
      render(<MessagesList />);
      await screen.findByText('Hello world');

      await act(async () => {
        onNewMessageCb?.({
          id: 'm-new',
          conversationId: 'c1',
          sender: 'system',
          receiver: 'me',
          content: 'New notification',
          createdAt: '2026-03-20T12:00:00.000Z',
          read: false,
          type: 'system',
        });
      });

      expect(await screen.findByText('New notification')).toBeInTheDocument();
      expect(screen.getByText('2 New')).toBeInTheDocument();
    });

    it('deduplicates messages by ID', async () => {
      setupApiForMessages([makeMessage()], 1);
      render(<MessagesList />);
      await screen.findByText('Hello world');

      // Send duplicate with same ID
      await act(async () => {
        onNewMessageCb?.({
          id: 'm1', // same as existing
          conversationId: 'c1',
          sender: 'system',
          receiver: 'me',
          content: 'Hello world',
          createdAt: '2026-03-18T10:00:00.000Z',
          read: false,
        });
      });

      // Should still only have one "Hello world"
      const matches = screen.getAllByText('Hello world');
      expect(matches).toHaveLength(1);
    });

    it('ignores read messages from websocket', async () => {
      setupApiForMessages([makeMessage()], 1);
      render(<MessagesList />);
      await screen.findByText('Hello world');

      await act(async () => {
        onNewMessageCb?.({
          id: 'm-read',
          conversationId: 'c1',
          sender: 'system',
          receiver: 'me',
          content: 'Read message',
          createdAt: '2026-03-20T12:00:00.000Z',
          read: true, // read = true → should be ignored
        });
      });

      expect(screen.queryByText('Read message')).not.toBeInTheDocument();
    });
  });

  // ---- Clear all notifications ----

  describe('clear all notifications', () => {
    it('calls API, clears messages and count, calls onNotificationCleared', async () => {
      setupApiForMessages([makeMessage()], 1);
      api.put.mockResolvedValue({});
      const onCleared = jest.fn();
      render(<MessagesList onNotificationCleared={onCleared} />);
      await screen.findByText('Hello world');

      fireEvent.click(screen.getByRole('button', { name: 'Clear all notifications' }));

      await waitFor(() => expect(api.put).toHaveBeenCalledWith('/messages/read-all', {}));
      expect(onCleared).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('All notifications cleared');
      // After clearing, should show empty state
      expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
    });

    it('shows error toast when clear fails', async () => {
      setupApiForMessages([makeMessage()], 1);
      api.put.mockRejectedValue(new Error('server error'));
      render(<MessagesList />);
      await screen.findByText('Hello world');

      fireEvent.click(screen.getByRole('button', { name: 'Clear all notifications' }));
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to clear notifications'));
      // Messages should still be visible
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });
  });

  // ---- Error handling ----

  describe('error handling', () => {
    it('shows toast on initial load failure', async () => {
      api.get.mockRejectedValue(new Error('network'));
      render(<MessagesList />);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load messages'));
    });

    it('handles non-array response gracefully', async () => {
      api.get.mockImplementation((path: string) => {
        if (path === '/messages/unread') return Promise.resolve(null);
        if (path === '/messages/unread/count') return Promise.resolve({ count: 0 });
        return Promise.reject(new Error(`unexpected GET ${path}`));
      });
      render(<MessagesList />);
      expect(await screen.findByText('No notifications yet')).toBeInTheDocument();
    });
  });

  // ---- Polling interval ----

  describe('polling', () => {
    it('re-fetches messages every 10 seconds', async () => {
      setupApiForMessages([]);
      render(<MessagesList />);
      await screen.findByText('No notifications yet');

      const initialCalls = api.get.mock.calls.length;

      // Advance 10 seconds for one poll cycle
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      // Should have additional calls from the interval
      expect(api.get.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});
