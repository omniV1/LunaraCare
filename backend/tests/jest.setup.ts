/**
 * Runs after each test file's environment is set up.
 * Clears timers from singletons so Jest can exit (no open handles).
 */
import { afterAll } from '@jest/globals';

afterAll(() => {
  // CacheService starts a setInterval when loaded (e.g. via cacheMiddleware.test)
  const cache = require('../src/services/cacheService').default;
  if (typeof cache.destroy === 'function') {
    cache.destroy();
  }
  // Stop appointment reminder scheduler if any test started it
  const { stopReminderScheduler } = require('../src/services/appointmentReminderService');
  stopReminderScheduler();
});
