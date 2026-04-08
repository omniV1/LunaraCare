/**
 * @module useSocket
 * React hook for managing a Socket.io connection to the LUNARA real-time
 * messaging server. Handles auth-token lifecycle and reconnection.
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from '../utils/getBaseApiUrl';

/** Payload shape emitted by the server on the `new_message` event. */
export interface NewMessagePayload {
  id: string;
  conversationId: string;
  sender: string;
  receiver: string;
  content: string;
  type?: string;
  read: boolean;
  createdAt: string;
}

/**
 * Creates and returns a new Socket.io client authenticated with the given JWT.
 * @param token - JWT access token sent in the socket `auth` payload.
 * @returns A connected Socket.io client instance.
 */
function connectSocket(token: string) {
  const socketUrl = getSocketUrl();
  return io(socketUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });
}

/**
 * Hook that establishes and maintains a Socket.io connection for real-time messaging.
 * Automatically reconnects when the auth token is refreshed or changed in another tab.
 * @returns `connected` status flag and helper functions: `joinConversation`, `sendMessage`, `onNewMessage`.
 */
export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const socket = connectSocket(token);
    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_user_room');
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socketRef.current = socket;

    let currentToken = token;

    const reconnectWithNewToken = () => {
      const newToken = localStorage.getItem('token');
      if (!newToken || newToken === currentToken) return;
      currentToken = newToken;
      const oldSocket = socketRef.current;
      if (oldSocket) {
        oldSocket.removeAllListeners();
        oldSocket.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
      const newSocket = connectSocket(newToken);
      newSocket.on('connect', () => {
        setConnected(true);
        newSocket.emit('join_user_room');
      });
      newSocket.on('disconnect', () => setConnected(false));
      newSocket.on('connect_error', () => setConnected(false));
      socketRef.current = newSocket;
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue && e.newValue !== currentToken) {
        reconnectWithNewToken();
      }
    };

    window.addEventListener('auth:token-refreshed', reconnectWithNewToken);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth:token-refreshed', reconnectWithNewToken);
      window.removeEventListener('storage', handleStorageChange);
      const current = socketRef.current;
      if (current) {
        current.removeAllListeners();
        current.disconnect();
      }
      socketRef.current = null;
      setConnected(false);
    };
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit('join_conversation', conversationId);
  }, []);

  const sendMessage = useCallback(
    (payload: { conversationId: string; sender: string; receiver: string; message: string }) => {
      if (!socketRef.current?.connected) return false;
      socketRef.current.emit('send_message', {
        ...payload,
        type: 'text',
      });
      return true;
    },
    []
  );

  const onNewMessage = useCallback((callback: (payload: NewMessagePayload) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on('new_message', callback);
    return () => socket.off('new_message', callback);
  }, []);

  return { connected, joinConversation, sendMessage, onNewMessage };
}
