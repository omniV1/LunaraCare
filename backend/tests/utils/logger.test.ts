/**
 * Logger unit tests. Ensures the Winston logger is configured and
 * standard log methods exist and do not throw when invoked.
 */
import logger from '../../src/utils/logger';

describe('logger', () => {
  it('should be defined and have standard log methods', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should not throw when calling info', () => {
    expect(() => logger.info('test message')).not.toThrow();
  });

  it('should not throw when calling error', () => {
    expect(() => logger.error('test error')).not.toThrow();
  });
});
