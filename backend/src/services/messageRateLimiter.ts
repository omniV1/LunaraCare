/**
 * @module services/messageRateLimiter
 * Simple per-process sliding-window rate limiter for Socket.io messages.
 * Prevents spam and runaway client bugs from flooding the messaging
 * subsystem. Tuned for 30 messages per 10-second window.
 */

/** Sliding window duration in milliseconds. */
export const MESSAGE_WINDOW_MS = 10_000;

/** Maximum messages allowed within the window before throttling. */
export const MESSAGE_MAX_PER_WINDOW = 30;

type RateState = { count: number; windowStart: number };

const messageRateByUser = new Map<string, RateState>();

/** Clear all rate-limit state (useful in tests). */
export const resetMessageRateLimiter = (): void => {
  messageRateByUser.clear();
};

/**
 * Check whether a user has exceeded the message rate limit.
 *
 * @param userId - User to check
 * @param now - Current timestamp (default Date.now(), injectable for tests)
 * @returns true if the user should be throttled
 */
export const isRateLimited = (userId: string, now: number = Date.now()): boolean => {
  const current = messageRateByUser.get(userId);

  if (!current || now - current.windowStart > MESSAGE_WINDOW_MS) {
    messageRateByUser.set(userId, { count: 1, windowStart: now });
    return false;
  }

  const nextCount = current.count + 1;
  if (nextCount > MESSAGE_MAX_PER_WINDOW) {
    current.count = nextCount;
    messageRateByUser.set(userId, current);
    return true;
  }

  current.count = nextCount;
  messageRateByUser.set(userId, current);
  return false;
};

