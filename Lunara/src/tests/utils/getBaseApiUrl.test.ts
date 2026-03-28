import { getBaseApiUrl } from '../../utils/getBaseApiUrl';

describe('getBaseApiUrl', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return value from process.env.VITE_API_BASE_URL if available', () => {
    process.env.VITE_API_BASE_URL = 'http://localhost:8080';
    expect(getBaseApiUrl()).toBe('http://localhost:8080');
  });

  it('should return default /api if no env variable is set', () => {
    delete process.env.VITE_API_BASE_URL;
    expect(getBaseApiUrl()).toBe('/api');
  });

  it('should handle custom API URLs', () => {
    process.env.VITE_API_BASE_URL = 'https://api.example.com';
    expect(getBaseApiUrl()).toBe('https://api.example.com');
  });
});

describe('getGoogleOAuthStartUrl', () => {
  it('strips trailing slashes from base and encodes origin', async () => {
    process.env.VITE_API_BASE_URL = 'https://api.example.com/api/';
    jest.resetModules();
    const { getGoogleOAuthStartUrl } = await import('../../utils/getBaseApiUrl');
    expect(getGoogleOAuthStartUrl('https://www.example.com')).toBe(
      'https://api.example.com/api/auth/google?redirect_origin=https%3A%2F%2Fwww.example.com'
    );
  });
});
