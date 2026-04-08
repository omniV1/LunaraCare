/**
 * @module components/PushNotificationToggle
 * Toggle switch for subscribing/unsubscribing to browser push notifications.
 * Shows permission-denied or unsupported warnings when applicable.
 */
import { useState, useEffect, useCallback } from 'react';
import PushNotificationService from '../services/pushService';

type BrowserNotificationPermission = 'default' | 'granted' | 'denied';

/** Renders a push notification on/off toggle with permission state feedback. */
export function PushNotificationToggle() {
  const pushService = PushNotificationService.getInstance();
  const supported = pushService.isSupported();

  const [permission, setPermission] = useState<BrowserNotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshState = useCallback(async () => {
    if (!supported) return;
    const perm = await pushService.getPermissionState();
    setPermission(perm);

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();
    setSubscribed(!!sub);
  }, [supported, pushService]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await pushService.unsubscribe();
      } else {
        await pushService.subscribe();
      }
      await refreshState();
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Push notification toggle failed:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
        Push notifications are not supported in this browser.
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="rounded-lg border border-red-300 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">
          Push notifications are blocked
        </p>
        <p className="mt-1 text-xs text-red-600">
          You have denied notification permissions. To re-enable them, open your
          browser&apos;s site settings and allow notifications for this site.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">
          Push Notifications
        </p>
        <p className="text-xs text-gray-500">
          {subscribed
            ? 'You will receive push notifications.'
            : 'Enable to receive push notifications.'}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={subscribed}
        disabled={loading}
        onClick={handleToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
          subscribed ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            subscribed ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
