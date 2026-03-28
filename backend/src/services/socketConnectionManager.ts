import type { Socket } from 'socket.io';

/**
 * Lightweight in-memory connection manager for Socket.io.
 * Tracks which sockets belong to which authenticated user IDs.
 *
 * This is intentionally simple and stateless across restarts.
 * If we later need horizontal scaling, we can swap this for a Redis-backed adapter
 * without changing the public API surface.
 */
class SocketConnectionManager {
  /** Map of userId -> set of active socket IDs */
  private readonly userSockets = new Map<string, Set<string>>();

  /** Map of socketId -> userId */
  private readonly socketUsers = new Map<string, string>();

  /**
   * Register a socket as belonging to a user.
   */
  addConnection(userId: string, socket: Socket): void {
    const existing = this.userSockets.get(userId) ?? new Set<string>();
    existing.add(socket.id);
    this.userSockets.set(userId, existing);
    this.socketUsers.set(socket.id, userId);
  }

  /**
   * Remove a socket from tracking; if it was the user's last socket, clean them up.
   */
  removeConnection(socketId: string): void {
    const userId = this.socketUsers.get(socketId);
    if (!userId) return;

    this.socketUsers.delete(socketId);

    const sockets = this.userSockets.get(userId);
    if (!sockets) return;

    sockets.delete(socketId);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
    } else {
      this.userSockets.set(userId, sockets);
    }
  }

  /**
   * Get all active socket IDs for a given user.
   */
  getUserSockets(userId: string): string[] {
    const sockets = this.userSockets.get(userId);
    return sockets ? Array.from(sockets) : [];
  }
}

export const socketConnectionManager = new SocketConnectionManager();

