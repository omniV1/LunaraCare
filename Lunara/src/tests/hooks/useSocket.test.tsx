import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useSocket } from '../../hooks/useSocket';

type SocketEventHandler = (...args: unknown[]) => void;
type HandlerMap = Record<string, SocketEventHandler[]>;

function makeFakeSocket() {
  const handlers: HandlerMap = {};
  const socket: any = {
    connected: false,
    on: (event: string, cb: SocketEventHandler) => {
      handlers[event] = handlers[event] ?? [];
      handlers[event].push(cb);
      return socket;
    },
    off: (event: string, cb: SocketEventHandler) => {
      handlers[event] = (handlers[event] ?? []).filter((h) => h !== cb);
      return socket;
    },
    emit: jest.fn(),
    removeAllListeners: jest.fn(() => {
      Object.keys(handlers).forEach((k) => (handlers[k] = []));
    }),
    disconnect: jest.fn(),
    __trigger: (event: string, ...args: any[]) => {
      (handlers[event] ?? []).forEach((cb) => cb(...args));
    },
  };
  return socket;
}

const fakeSocket = makeFakeSocket();

jest.mock('socket.io-client', () => ({
  io: () => fakeSocket,
}));

jest.mock('../../utils/getBaseApiUrl', () => ({
  getSocketUrl: () => 'http://socket.test',
}));

function Harness() {
  const { connected } = useSocket();
  return <div>{connected ? 'connected' : 'disconnected'}</div>;
}

describe('useSocket', () => {
  beforeEach(() => {
    localStorage.clear();
    fakeSocket.connected = false;
    (fakeSocket.emit as jest.Mock).mockClear();
    fakeSocket.removeAllListeners.mockClear();
    fakeSocket.disconnect.mockClear();
  });

  it('stays disconnected when no token exists', () => {
    render(<Harness />);
    expect(screen.getByText('disconnected')).toBeInTheDocument();
  });

  it('connects and joins user room when token exists', () => {
    localStorage.setItem('token', 't1');
    render(<Harness />);

    act(() => {
      fakeSocket.connected = true;
      fakeSocket.__trigger('connect');
    });

    expect(screen.getByText('connected')).toBeInTheDocument();
    expect(fakeSocket.emit).toHaveBeenCalledWith('join_user_room');
  });
});

