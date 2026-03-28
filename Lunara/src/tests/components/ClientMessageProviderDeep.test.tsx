/**
 * Deep tests for ClientMessageProvider – covers profile loading, no-provider
 * empty state, message rendering with bubble alignment, sending via REST and
 * socket, optimistic temp messages, realtime deduplication, error handling,
 * send button disabled states, and connection status indicator.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const mockUseAuth = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

let onNewMessageCb: ((payload: any) => void) | null = null;
const socket = {
  connected: false,
  joinConversation: jest.fn(),
  sendMessage: jest.fn(() => false),
  onNewMessage: jest.fn((cb: any) => {
    onNewMessageCb = cb;
    return () => { onNewMessageCb = null; };
  }),
};
jest.mock('../../hooks/useSocket', () => ({
  useSocket: () => socket,
}));

const api = {
  get: jest.fn(),
  post: jest.fn(),
};
jest.mock('../../api/apiClient', () => ({
  ApiClient: { getInstance: () => api },
}));

import { ClientMessageProvider } from '../../components/ClientMessageProvider';

// ── Helpers ──────────────────────────────────────────────────────────────────

const provider = { _id: 'p1', firstName: 'Dr', lastName: 'Smith', email: 'dr@example.com' };

function setupProfile(assignedProvider: any = provider) {
  api.get.mockImplementation((path: string) => {
    if (path === '/client/me') return Promise.resolve({ assignedProvider });
    if (path === '/messages/for-me') return Promise.resolve({ messages: [] });
    return Promise.reject(new Error(`unexpected GET ${path}`));
  });
}

function setupWithMessages(messages: any[]) {
  api.get.mockImplementation((path: string) => {
    if (path === '/client/me') return Promise.resolve({ assignedProvider: provider });
    if (path === '/messages/for-me') return Promise.resolve({ messages });
    return Promise.reject(new Error(`unexpected GET ${path}`));
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ClientMessageProvider – deep tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onNewMessageCb = null;
    mockUseAuth.mockReturnValue({ user: { id: 'me' } });
    Element.prototype.scrollIntoView = jest.fn();
    socket.connected = false;
    socket.sendMessage.mockReturnValue(false);
  });

  // ---- Loading states ----

  describe('loading states', () => {
    it('shows spinner while profile is loading', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // never resolves
      const { container } = render(<ClientMessageProvider />);
      expect(container.querySelector('.animate-spin')).toBeTruthy();
    });

    it('shows conversation spinner while messages load', async () => {
      api.get.mockImplementation((path: string) => {
        if (path === '/client/me') return Promise.resolve({ assignedProvider: provider });
        if (path === '/messages/for-me') return new Promise(() => {}); // never resolves
        return Promise.reject(new Error(`unexpected GET ${path}`));
      });
      const { container } = render(<ClientMessageProvider />);
      // After profile loads, conversation spinner shows
      await waitFor(() => {
        const spinners = container.querySelectorAll('.animate-spin');
        expect(spinners.length).toBeGreaterThan(0);
      });
    });
  });

  // ---- No provider assigned ----

  describe('no provider assigned', () => {
    it('shows "No assigned provider" message', async () => {
      setupProfile(null);
      render(<ClientMessageProvider />);
      expect(await screen.findByText('No assigned provider')).toBeInTheDocument();
      expect(screen.getByText(/assigned provider yet/)).toBeInTheDocument();
    });

    it('shows "No assigned provider" when profile returns undefined', async () => {
      api.get.mockImplementation((path: string) => {
        if (path === '/client/me') return Promise.resolve({ assignedProvider: undefined });
        if (path === '/messages/for-me') return Promise.resolve({ messages: [] });
        return Promise.reject(new Error(`unexpected GET ${path}`));
      });
      render(<ClientMessageProvider />);
      await waitFor(() => {
        // Component should show the message input area since undefined provider
        // behaves as no provider assigned, OR it may show the provider UI
        // depending on how the component handles undefined vs null.
        // Looking at the source: setProvider(data?.assignedProvider ?? null)
        // so undefined becomes null → shows "No assigned provider"
        expect(screen.getByText('No assigned provider')).toBeInTheDocument();
      });
    });
  });

  // ---- Rendering messages ----

  describe('message rendering', () => {
    it('displays provider name in header', async () => {
      setupWithMessages([]);
      render(<ClientMessageProvider />);
      expect(await screen.findByText(/Message Dr Smith/)).toBeInTheDocument();
    });

    it('renders existing messages from API', async () => {
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1', firstName: 'Dr', lastName: 'Smith' },
          receiver: 'me',
          content: 'How are you feeling?',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);
      render(<ClientMessageProvider />);
      expect(await screen.findByText('How are you feeling?')).toBeInTheDocument();
      expect(screen.getByText('Dr Smith')).toBeInTheDocument();
    });

    it('labels own messages as "You"', async () => {
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: 'me',
          receiver: { _id: 'p1' },
          content: 'I feel great',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);
      render(<ClientMessageProvider />);
      expect(await screen.findByText('You')).toBeInTheDocument();
    });

    it('joins existing conversation rooms', async () => {
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1' },
          receiver: 'me',
          content: 'Msg',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);
      render(<ClientMessageProvider />);
      await screen.findByText('Msg');
      expect(socket.joinConversation).toHaveBeenCalledWith('c1');
    });
  });

  // ---- Connection status ----

  describe('connection status indicator', () => {
    it('shows "Connecting" when socket is not connected', async () => {
      socket.connected = false;
      setupWithMessages([]);
      render(<ClientMessageProvider />);
      expect(await screen.findByText('Connecting…')).toBeInTheDocument();
    });

    it('shows "Connected" when socket is connected', async () => {
      socket.connected = true;
      setupWithMessages([]);
      render(<ClientMessageProvider />);
      expect(await screen.findByText('Connected')).toBeInTheDocument();
    });
  });

  // ---- Sending messages ----

  describe('sending messages', () => {
    it('sends via REST when socket is not connected', async () => {
      socket.connected = false;
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1' },
          receiver: 'me',
          content: 'Hello',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);
      api.post.mockResolvedValue({
        _id: 'm2',
        conversationId: 'c1',
        sender: 'me',
        receiver: { _id: 'p1' },
        content: 'Reply',
        createdAt: '2026-03-18T10:01:00.000Z',
      });

      render(<ClientMessageProvider />);
      await screen.findByText('Hello');

      fireEvent.change(screen.getByPlaceholderText('Type a message…'), { target: { value: 'Reply' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/messages', {
          receiver: 'p1',
          content: 'Reply',
          conversationId: 'c1',
        }),
      );
      expect(await screen.findByText('Reply')).toBeInTheDocument();
    });

    it('sends via socket when connected and conversation exists', async () => {
      socket.connected = true;
      socket.sendMessage.mockReturnValue(true);
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1' },
          receiver: 'me',
          content: 'Hello',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);

      render(<ClientMessageProvider />);
      await screen.findByText('Hello');

      fireEvent.change(screen.getByPlaceholderText('Type a message…'), { target: { value: 'Socket msg' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() => expect(socket.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'c1',
          sender: 'me',
          receiver: 'p1',
          message: 'Socket msg',
        }),
      ));
      // Optimistic temp message should appear
      expect(await screen.findByText('Socket msg')).toBeInTheDocument();
    });

    it('clears input after sending', async () => {
      socket.connected = false;
      setupWithMessages([]);
      api.post.mockResolvedValue({
        _id: 'm2',
        conversationId: 'c-new',
        sender: 'me',
        receiver: { _id: 'p1' },
        content: 'First message',
        createdAt: '2026-03-18T10:01:00.000Z',
      });

      render(<ClientMessageProvider />);
      await screen.findByText(/Message Dr Smith/);

      const input = screen.getByPlaceholderText('Type a message…');
      fireEvent.change(input, { target: { value: 'First message' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() => expect((input as HTMLInputElement).value).toBe(''));
    });

    it('restores input text on send failure', async () => {
      socket.connected = false;
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1' },
          receiver: 'me',
          content: 'Hello',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);
      api.post.mockRejectedValue(new Error('network error'));

      render(<ClientMessageProvider />);
      await screen.findByText('Hello');

      const input = screen.getByPlaceholderText('Type a message…');
      fireEvent.change(input, { target: { value: 'Failed msg' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect((input as HTMLInputElement).value).toBe('Failed msg');
    });

    it('does not send empty or whitespace-only messages', async () => {
      setupWithMessages([]);
      render(<ClientMessageProvider />);
      await screen.findByText(/Message Dr Smith/);

      const sendBtn = screen.getByRole('button', { name: 'Send' });
      expect(sendBtn).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText('Type a message…'), { target: { value: '   ' } });
      expect(sendBtn).toBeDisabled();
    });

    it('disables send button while sending (shows "Sending...")', async () => {
      socket.connected = false;
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1' },
          receiver: 'me',
          content: 'Hello',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);
      let resolvePost!: (v: any) => void;
      api.post.mockReturnValue(new Promise(r => { resolvePost = r; }));

      render(<ClientMessageProvider />);
      await screen.findByText('Hello');

      fireEvent.change(screen.getByPlaceholderText('Type a message…'), { target: { value: 'Wait' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));

      await waitFor(() => expect(screen.getByText('Sending…')).toBeInTheDocument());

      await act(async () =>
        resolvePost({
          _id: 'm2',
          conversationId: 'c1',
          sender: 'me',
          receiver: 'p1',
          content: 'Wait',
          createdAt: new Date().toISOString(),
        }),
      );

      expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
    });
  });

  // ---- Realtime messages ----

  describe('realtime socket messages', () => {
    it('adds new incoming messages from provider', async () => {
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1' },
          receiver: 'me',
          content: 'First',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);
      render(<ClientMessageProvider />);
      await screen.findByText('First');

      await act(async () => {
        onNewMessageCb?.({
          id: 'm-rt',
          conversationId: 'c1',
          sender: 'p1',
          receiver: 'me',
          content: 'Realtime msg',
          createdAt: '2026-03-18T11:00:00.000Z',
          read: false,
        });
      });

      expect(await screen.findByText('Realtime msg')).toBeInTheDocument();
    });

    it('deduplicates messages with the same ID', async () => {
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1' },
          receiver: 'me',
          content: 'Unique',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);
      render(<ClientMessageProvider />);
      await screen.findByText('Unique');

      await act(async () => {
        onNewMessageCb?.({
          id: 'm1',
          conversationId: 'c1',
          sender: 'p1',
          receiver: 'me',
          content: 'Unique',
          createdAt: '2026-03-18T10:00:00.000Z',
          read: false,
        });
      });

      expect(screen.getAllByText('Unique')).toHaveLength(1);
    });

    it('ignores messages not for current user', async () => {
      setupWithMessages([]);
      render(<ClientMessageProvider />);
      await screen.findByText(/Message Dr Smith/);

      await act(async () => {
        onNewMessageCb?.({
          id: 'm-other',
          conversationId: 'c-other',
          sender: 'someone',
          receiver: 'someone-else',
          content: 'Not for me',
          createdAt: '2026-03-18T10:00:00.000Z',
          read: false,
        });
      });

      expect(screen.queryByText('Not for me')).not.toBeInTheDocument();
    });

    it('replaces optimistic temp message when server echoes via socket', async () => {
      socket.connected = true;
      socket.sendMessage.mockReturnValue(true);
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1' },
          receiver: 'me',
          content: 'Hello',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);

      render(<ClientMessageProvider />);
      await screen.findByText('Hello');

      // Send optimistic message
      fireEvent.change(screen.getByPlaceholderText('Type a message…'), { target: { value: 'Optimistic' } });
      fireEvent.click(screen.getByRole('button', { name: 'Send' }));
      await screen.findByText('Optimistic');

      // Server echoes back the same message
      await act(async () => {
        onNewMessageCb?.({
          id: 'm-server',
          conversationId: 'c1',
          sender: 'me',
          receiver: 'p1',
          content: 'Optimistic',
          createdAt: new Date().toISOString(),
          read: false,
        });
      });

      // Should have exactly one copy of the message
      expect(screen.getAllByText('Optimistic')).toHaveLength(1);
    });
  });

  // ---- Error handling ----

  describe('error handling', () => {
    it('shows toast on profile load failure', async () => {
      api.get.mockRejectedValue(new Error('boom'));
      render(<ClientMessageProvider />);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load profile'));
    });

    it('shows toast on message load failure', async () => {
      api.get.mockImplementation((path: string) => {
        if (path === '/client/me') return Promise.resolve({ assignedProvider: provider });
        if (path === '/messages/for-me') return Promise.reject(new Error('msg error'));
        return Promise.reject(new Error(`unexpected GET ${path}`));
      });
      render(<ClientMessageProvider />);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load messages'));
    });
  });

  // ---- Form submission via Enter key ----

  describe('form submission via enter', () => {
    it('sends message on form submit', async () => {
      socket.connected = false;
      setupWithMessages([
        {
          _id: 'm1',
          conversationId: 'c1',
          sender: { _id: 'p1' },
          receiver: 'me',
          content: 'Hello',
          createdAt: '2026-03-18T10:00:00.000Z',
        },
      ]);
      api.post.mockResolvedValue({
        _id: 'm2',
        conversationId: 'c1',
        sender: 'me',
        receiver: 'p1',
        content: 'Enter msg',
        createdAt: new Date().toISOString(),
      });

      render(<ClientMessageProvider />);
      await screen.findByText('Hello');

      const input = screen.getByPlaceholderText('Type a message…');
      fireEvent.change(input, { target: { value: 'Enter msg' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() =>
        expect(api.post).toHaveBeenCalledWith('/messages', expect.objectContaining({ content: 'Enter msg' })),
      );
    });
  });
});
