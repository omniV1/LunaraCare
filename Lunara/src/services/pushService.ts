/**
 * @module pushService
 * Singleton service for Web Push notification subscription management.
 * Handles VAPID key retrieval, service worker registration, and
 * subscribe/unsubscribe flows via the backend `/push` endpoints.
 */

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

/** Response shape from the VAPID public key endpoint. */
interface VapidResponse {
  success: boolean;
  data: { vapidPublicKey: string };
}

/** Response shape from the push subscription endpoint. */
interface SubscribeResponse {
  success: boolean;
  message: string;
}

/** Browser Notification permission states. */
type BrowserNotificationPermission = 'default' | 'granted' | 'denied';

/** Manages Web Push notification lifecycle. */
class PushNotificationService {
  private static instance: PushNotificationService;
  private api: ApiClient;

  private constructor() {
    this.api = ApiClient.getInstance();
  }

  /**
   * Returns the singleton PushNotificationService instance.
   * @returns The shared {@link PushNotificationService}.
   */
  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Fetches the server's VAPID public key used for push subscription.
   * @returns The VAPID public key string.
   */
  async getVapidPublicKey(): Promise<string> {
    const res = await this.api.get<VapidResponse>('/push/vapid-public-key');
    return res.data.vapidPublicKey;
  }

  /**
   * Registers a service worker and subscribes the browser to push notifications.
   * @returns `true` on success, `false` if push is not supported.
   */
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

  /**
   * Unsubscribes the browser from push notifications and removes the
   * subscription from the server.
   */
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

  /**
   * Checks whether the browser supports push notifications.
   * @returns `true` if Service Worker and PushManager APIs are available.
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Returns the current browser notification permission state.
   * @returns `"default"`, `"granted"`, or `"denied"`.
   */
  async getPermissionState(): Promise<BrowserNotificationPermission> {
    return Notification.permission;
  }
}

export default PushNotificationService;
