import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { toast } from 'react-toastify';

import { ClientMessageProvider } from '../../components/ClientMessageProvider';

jest.mock('react-toastify', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const mockUseAuth = jest.fn();
jest.mock('../../contexts/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

const socket = {
  connected: false,
  joinConversation: jest.fn(),
  sendMessage: jest.fn(() => false),
  onNewMessage: jest.fn(() => () => {}),
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

describe('ClientMessageProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'me' } });
    // JSDOM doesn't implement scrollIntoView
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('shows empty state when no provider is assigned', async () => {
    api.get.mockImplementation((path: string) => {
      if (path === '/client/me') return Promise.resolve({ assignedProvider: null });
      throw new Error(`unexpected GET ${path}`);
    });

    render(<ClientMessageProvider />);
    expect(await screen.findByText('No assigned provider')).toBeInTheDocument();
  });

  it('loads messages and sends via REST when sockets are not connected', async () => {
    api.get.mockImplementation((path: string) => {
      if (path === '/client/me') {
        return Promise.resolve({ assignedProvider: { _id: 'p1', firstName: 'Dr', lastName: 'Smith' } });
      }
      if (path === '/messages/for-me') {
        return Promise.resolve({
          messages: [
            {
              _id: 'm1',
              conversationId: 'c1',
              sender: { _id: 'p1', firstName: 'Dr', lastName: 'Smith' },
              receiver: 'me',
              content: 'Hello',
              createdAt: '2026-03-18T10:00:00.000Z',
            },
          ],
        });
      }
      throw new Error(`unexpected GET ${path}`);
    });
    api.post.mockResolvedValue({
      _id: 'm2',
      conversationId: 'c1',
      sender: 'me',
      receiver: { _id: 'p1' },
      content: 'Hi back',
      createdAt: '2026-03-18T10:01:00.000Z',
    });

    render(<ClientMessageProvider />);
    expect(await screen.findByText(/Message Dr Smith/)).toBeInTheDocument();
    expect(await screen.findByText('Hello')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Type a message…'), { target: { value: 'Hi back' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(api.post).toHaveBeenCalledWith('/messages', { receiver: 'p1', content: 'Hi back', conversationId: 'c1' }),
    );
    expect(await screen.findByText('Hi back')).toBeInTheDocument();
  });

  it('shows toast on profile load failure', async () => {
    api.get.mockRejectedValue(new Error('boom'));
    render(<ClientMessageProvider />);
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to load profile'));
  });
});

