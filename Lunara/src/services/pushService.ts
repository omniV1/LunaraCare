import { ApiClient } from '../api/apiClient';

// Web Push VAPID keys use URL-safe base64 (RFC 4648 §5), but the browser's
// PushManager.subscribe() expects a standard Uint8Array applicationServerKey.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface VapidResponse {
  success: boolean;
  data: { vapidPublicKey: string };
}

interface SubscribeResponse {
  success: boolean;
  message: string;
}

type BrowserNotificationPermission = 'default' | 'granted' | 'denied';

class PushNotificationService {
  private static instance: PushNotificationService;
  private api: ApiClient;

  private constructor() {
    this.api = ApiClient.getInstance();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  async getVapidPublicKey(): Promise<string> {
    const res = await this.api.get<VapidResponse>('/push/vapid-public-key');
    return res.data.vapidPublicKey;
  }

  async subscribe(): Promise<boolean> {
    if (!this.isSupported()) return false;

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const vapidPublicKey = await this.getVapidPublicKey();
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    });

    const json = subscription.toJSON();
    await this.api.post<SubscribeResponse>('/push/subscribe', {
      endpoint: json.endpoint,
      keys: json.keys,
    });

    return true;
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();

    await this.api.delete('/push/subscribe', {
      data: { endpoint },
    });
  }

  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async getPermissionState(): Promise<BrowserNotificationPermission> {
    return Notification.permission;
  }
}

export default PushNotificationService;
