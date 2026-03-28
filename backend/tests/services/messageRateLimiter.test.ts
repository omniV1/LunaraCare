import { describe, it, beforeEach, expect } from '@jest/globals';
import {
  isRateLimited,
  resetMessageRateLimiter,
  MESSAGE_WINDOW_MS,
  MESSAGE_MAX_PER_WINDOW,
} from '../../src/services/messageRateLimiter';

describe('messageRateLimiter', () => {
  const userId = 'user-123';

  beforeEach(() => {
    resetMessageRateLimiter();
  });

  it('allows first message and up to the max within the window', () => {
    const now = Date.now();
    let limited = false;

    for (let i = 0; i < MESSAGE_MAX_PER_WINDOW; i++) {
      limited = isRateLimited(userId, now);
      expect(limited).toBe(false);
    }
  });

  it('blocks when exceeding max messages within the window', () => {
    const now = Date.now();

    for (let i = 0; i < MESSAGE_MAX_PER_WINDOW; i++) {
      expect(isRateLimited(userId, now)).toBe(false);
    }

    // Next call in same window should be rate limited
    expect(isRateLimited(userId, now)).toBe(true);
  });

  it('resets after the window and allows messages again', () => {
    const start = Date.now();

    for (let i = 0; i < MESSAGE_MAX_PER_WINDOW; i++) {
      expect(isRateLimited(userId, start)).toBe(false);
    }
    expect(isRateLimited(userId, start)).toBe(true);

    const afterWindow = start + MESSAGE_WINDOW_MS + 1;
    expect(isRateLimited(userId, afterWindow)).toBe(false);
  });
});

