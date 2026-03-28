import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { MessageCenter } from '../../components/MessageCenter';

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn() },
}));

const mockUseAuth = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const socket = {
  connected: false,
  joinConversation: jest.fn(),
  sendMessage: jest.fn(),
  onNewMessage: jest.fn(),
};
jest.mock('../../hooks/useSocket', () => ({
  useSocket: () => socket,
}));

const api = {
  get: jest.fn(),
  post: jest.fn(),
};
jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => api,
  },
}));

describe('MessageCenter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 'me', firstName: 'Provider', lastName: 'One', email: 'p@test.com' },
    });
    socket.onNewMessage.mockImplementation(() => () => {});
    // JSDOM doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('loads clients, loads conversation when client selected, and sends via REST when not connected', async () => {
    api.get.mockImplementation((path: string) => {
      if (path === '/providers/me/clients') {
        return Promise.resolve([
          { _id: 'c1', userId: { _id: 'u1', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' } },
        ]);
      }
      if (path === '/messages/with/u1') {
        return Promise.resolve({
          conversationId: null,
          messages: [
            {
              _id: 'm1',
              conversationId: 'cx',
              sender: 'u1',
              receiver: 'me',
              content: 'Hi',
              createdAt: '2026-03-18T10:00:00.000Z',
            },
          ],
        });
      }
      throw new Error(`unexpected GET ${path}`);
    });
    api.post.mockResolvedValue({
      _id: 'm2',
      conversationId: 'cx',
      sender: 'me',
      receiver: 'u1',
      content: 'Hello back',
      createdAt: '2026-03-18T10:01:00.000Z',
    });

    render(<MessageCenter />);

    // Client appears in list
    expect(await screen.findByRole('heading', { name: 'My clients' })).toBeInTheDocument();
    const clientBtn = await screen.findByRole('button', { name: /Jane Doe/i });
    fireEvent.click(clientBtn);

    // Conversation message rendered
    expect(await screen.findByText('Hi')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Type a message…');
    fireEvent.change(input, { target: { value: 'Hello back' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/messages', { receiver: 'u1', content: 'Hello back' }),
    );
    expect(await screen.findByText('Hello back')).toBeInTheDocument();
  });

  it('shows toast when clients fail to load', async () => {
    api.get.mockRejectedValue(new Error('nope'));
    render(<MessageCenter />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load clients'));
  });
});

