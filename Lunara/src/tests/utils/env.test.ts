/**
 * Environment utility tests (Jest runs with process.env; Vite uses import.meta.env).
 * getEnvVar reads process.env first so these tests run without import.meta.
 */
import { getEnvVar, getCloudinaryCloudName } from '../../utils/env';

describe('env utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getEnvVar', () => {
    it('should return value from process.env if available', () => {
      process.env.TEST_VAR = 'test-value';
      expect(getEnvVar('TEST_VAR')).toBe('test-value');
    });

    it('should return undefined if variable does not exist', () => {
      delete process.env.TEST_VAR;
      expect(getEnvVar('TEST_VAR')).toBeUndefined();
    });

    it('should handle empty string values', () => {
      process.env.EMPTY_VAR = '';
      expect(getEnvVar('EMPTY_VAR')).toBe('');
    });
  });

  describe('getCloudinaryCloudName', () => {
    it('should return value from env if available', () => {
      process.env.VITE_CLOUDINARY_CLOUD_NAME = 'my-cloud';
      expect(getCloudinaryCloudName()).toBe('my-cloud');
    });

    it('should return default value if env variable is not set', () => {
      delete process.env.VITE_CLOUDINARY_CLOUD_NAME;
      expect(getCloudinaryCloudName()).toBe('your-cloud-name');
    });
  });
});
