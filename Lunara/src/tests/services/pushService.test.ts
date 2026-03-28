import { Buffer } from 'node:buffer';
import PushNotificationService from '../../services/pushService';

const api = {
  get: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../../api/apiClient', () => ({
  ApiClient: {
    getInstance: () => api,
  },
}));

interface MockRegistration {
  pushManager: {
    subscribe: jest.Mock;
    getSubscription: jest.Mock;
  };
}

function mockPushEnv() {
  const subscription = {
    endpoint: 'https://push.example/1',
    toJSON: () => ({ endpoint: 'https://push.example/1', keys: { p256dh: 'k1', auth: 'k2' } }),
    unsubscribe: jest.fn().mockResolvedValue(true),
  };

  const registration: MockRegistration = {
    pushManager: {
      subscribe: jest.fn().mockResolvedValue(subscription),
      getSubscription: jest.fn().mockResolvedValue(subscription),
    },
  };

  const serviceWorkerMock = {
    register: jest.fn().mockResolvedValue(registration),
    ready: Promise.resolve(registration),
  };

  Object.defineProperty(navigator, 'serviceWorker', {
    value: serviceWorkerMock,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'PushManager', {
    value: function PushManager() {},
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'Notification', {
    value: { permission: 'default' },
    writable: true,
    configurable: true,
  });

  return { registration, subscription };
}

describe('PushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('isSupported returns true when SW + PushManager exist', () => {
    mockPushEnv();
    const svc = PushNotificationService.getInstance();
    expect(svc.isSupported()).toBe(true);
  });

  it('subscribes and posts subscription to API', async () => {
    const { registration } = mockPushEnv();
    const svc = PushNotificationService.getInstance();
    api.get.mockResolvedValue({ success: true, data: { vapidPublicKey: 'AQAB' } });
    api.post.mockResolvedValue({ success: true, message: 'ok' });

    // atob is used for base64 conversion
    Object.defineProperty(globalThis, 'atob', {
      value: (b64: string) => Buffer.from(b64, 'base64').toString('binary'),
      writable: true,
      configurable: true,
    });

    const ok = await svc.subscribe();
    expect(ok).toBe(true);
    expect((navigator.serviceWorker.register as jest.Mock)).toHaveBeenCalledWith('/sw.js');
    expect(registration.pushManager.subscribe).toHaveBeenCalled();
    expect(api.post).toHaveBeenCalledWith('/push/subscribe', {
      endpoint: 'https://push.example/1',
      keys: { p256dh: 'k1', auth: 'k2' },
    });
  });

  it('unsubscribe no-ops when no subscription exists', async () => {
    mockPushEnv();
    const svc = PushNotificationService.getInstance();

    const registration = await navigator.serviceWorker.ready as unknown as MockRegistration;
    registration.pushManager.getSubscription.mockResolvedValueOnce(null);

    await svc.unsubscribe();
    expect(api.delete).not.toHaveBeenCalled();
  });

  it('unsubscribe deletes endpoint after browser unsubscribe', async () => {
    const { subscription } = mockPushEnv();
    const svc = PushNotificationService.getInstance();
    api.delete.mockResolvedValue({});

    await svc.unsubscribe();
    expect(subscription.unsubscribe).toHaveBeenCalled();
    expect(api.delete).toHaveBeenCalledWith('/push/subscribe', { data: { endpoint: subscription.endpoint } });
  });
});

