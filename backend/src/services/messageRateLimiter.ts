// Anti-spam: 30 messages per 10s is well above normal typing speed but catches
// bots and runaway client bugs flooding the socket. Tuned from production logs.
export const MESSAGE_WINDOW_MS = 10_000;
export const MESSAGE_MAX_PER_WINDOW = 30;

type RateState = { count: number; windowStart: number };

// Internal in-memory state; simple per-process limiter
const messageRateByUser = new Map<string, RateState>();

export const resetMessageRateLimiter = (): void => {
  messageRateByUser.clear();
};

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

