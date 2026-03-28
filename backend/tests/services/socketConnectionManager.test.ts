import { describe, it, expect, beforeEach } from '@jest/globals';

// Re-import a fresh module for each test by using a factory approach
// We test the class logic by importing the singleton
import { socketConnectionManager } from '../../src/services/socketConnectionManager';

function fakeSocket(id: string): any {
  return { id };
}

describe('socketConnectionManager', () => {
  beforeEach(() => {
    // Clean up any lingering state by removing known sockets
    // The manager doesn't expose a clear(), so we rely on test isolation
  });

  it('addConnection registers a user socket', () => {
    const socket = fakeSocket('sock-1');
    socketConnectionManager.addConnection('user-A', socket);

    const sockets = socketConnectionManager.getUserSockets('user-A');
    expect(sockets).toContain('sock-1');
  });

  it('tracks multiple sockets for the same user', () => {
    socketConnectionManager.addConnection('user-B', fakeSocket('sock-2'));
    socketConnectionManager.addConnection('user-B', fakeSocket('sock-3'));

    const sockets = socketConnectionManager.getUserSockets('user-B');
    expect(sockets).toContain('sock-2');
    expect(sockets).toContain('sock-3');
    expect(sockets).toHaveLength(2);
  });

  it('removeConnection removes a socket and cleans up last socket', () => {
    socketConnectionManager.addConnection('user-C', fakeSocket('sock-4'));
    socketConnectionManager.removeConnection('sock-4');

    expect(socketConnectionManager.getUserSockets('user-C')).toHaveLength(0);
  });

  it('removeConnection keeps other sockets for the same user', () => {
    socketConnectionManager.addConnection('user-D', fakeSocket('sock-5'));
    socketConnectionManager.addConnection('user-D', fakeSocket('sock-6'));
    socketConnectionManager.removeConnection('sock-5');

    const sockets = socketConnectionManager.getUserSockets('user-D');
    expect(sockets).toEqual(['sock-6']);
  });

  it('removeConnection is safe for unknown socketId', () => {
    expect(() => socketConnectionManager.removeConnection('unknown')).not.toThrow();
  });

  it('getUserSockets returns empty array for unknown user', () => {
    expect(socketConnectionManager.getUserSockets('nobody')).toEqual([]);
  });
});
