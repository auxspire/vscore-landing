/** Web push subscription helpers (Phase 3). */

const PUSH_KEY = 'vscor_push_subscription';

export async function registerWebPush(vapidPublicKey?: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub && vapidPublicKey) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });
    }
    if (sub) {
      localStorage.setItem(PUSH_KEY, JSON.stringify(sub.toJSON()));
      return true;
    }
  } catch {
    // User denied or unsupported
  }
  return false;
}

export function getStoredPushSubscription(): PushSubscriptionJSON | null {
  try {
    const raw = localStorage.getItem(PUSH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function syncPushSubscriptionToCloud(
  userId: string,
  accessToken: string,
  functionsUrl: string,
): Promise<void> {
  const sub = getStoredPushSubscription();
  if (!sub) return;
  await fetch(`${functionsUrl}/push/subscribe`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId, subscription: sub }),
  }).catch(() => {});
}

/** Register (if permitted) then sync subscription to cloud. */
export async function ensurePushSynced(
  userId: string,
  accessToken: string,
  functionsUrl: string,
  vapidPublicKey?: string,
): Promise<void> {
  await registerWebPush(vapidPublicKey);
  await syncPushSubscriptionToCloud(userId, accessToken, functionsUrl);
}
