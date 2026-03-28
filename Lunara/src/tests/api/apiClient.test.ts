import { ApiClient } from '../../api/apiClient';

// We'll test the singleton behavior and structure of the class
describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = ApiClient.getInstance();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ApiClient.getInstance();
      const instance2 = ApiClient.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should have required HTTP methods', () => {
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
      expect(typeof apiClient.patch).toBe('function');
    });
  });

  describe('HTTP methods structure', () => {
    it('should define get method', () => {
      expect(apiClient.get).toBeDefined();
    });

    it('should define post method', () => {
      expect(apiClient.post).toBeDefined();
    });

    it('should define put method', () => {
      expect(apiClient.put).toBeDefined();
    });

    it('should define delete method', () => {
      expect(apiClient.delete).toBeDefined();
    });

    it('should define patch method', () => {
      expect(apiClient.patch).toBeDefined();
    });
  });
});
