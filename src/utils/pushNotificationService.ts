/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PushNotificationSettings {
  enabled: boolean;
  prayerAthan: boolean;
  prayerPreAlert: boolean;
  preAlertMinutes: number; // e.g., 10 or 15 mins before Athan
  adhkarMorning: boolean;
  morningTime: string; // "07:00"
  adhkarEvening: boolean;
  eveningTime: string; // "16:30"
  adhkarPeriodic: boolean;
  periodicIntervalHours: number; // e.g. 2
  fridayKahf: boolean;
  sleepAdhkar: boolean;
  sleepTime: string; // "22:30"
  quietHours: boolean;
  quietStart: string; // "23:00"
  quietEnd: string; // "04:30"
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

export const DEFAULT_PUSH_SETTINGS: PushNotificationSettings = {
  enabled: true,
  prayerAthan: true,
  prayerPreAlert: true,
  preAlertMinutes: 15,
  adhkarMorning: true,
  morningTime: '07:00',
  adhkarEvening: true,
  eveningTime: '16:30',
  adhkarPeriodic: true,
  periodicIntervalHours: 2,
  fridayKahf: true,
  sleepAdhkar: true,
  sleepTime: '22:30',
  quietHours: true,
  quietStart: '23:00',
  quietEnd: '04:30',
  soundEnabled: true,
  vibrateEnabled: true,
};

const SETTINGS_STORAGE_KEY = 'mc_push_settings_v1';

/**
 * Read saved push settings
 */
export function getPushSettings(): PushNotificationSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_PUSH_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading push settings', e);
  }
  return DEFAULT_PUSH_SETTINGS;
}

/**
 * Save push settings
 */
export function savePushSettings(settings: PushNotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving push settings', e);
  }
}

/**
 * Check if current time is inside quiet hours
 */
export function isInQuietHours(settings: PushNotificationSettings = getPushSettings()): boolean {
  if (!settings.quietHours) return false;

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const [sH, sM] = settings.quietStart.split(':').map(Number);
  const [eH, eM] = settings.quietEnd.split(':').map(Number);

  const startMin = sH * 60 + sM;
  const endMin = eH * 60 + eM;

  if (startMin > endMin) {
    // Overnight quiet hours, e.g. 23:00 to 04:30
    return currentMin >= startMin || currentMin < endMin;
  } else {
    return currentMin >= startMin && currentMin < endMin;
  }
}

/**
 * Request notification permission from browser
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await registerServiceWorker();
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Register Service Worker for background push / offline support
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[PushService] Service Worker registered successfully:', reg);
    return reg;
  } catch (err) {
    console.error('[PushService] SW registration failed:', err);
    return null;
  }
}

/**
 * Trigger a Push Notification via Service Worker or Native Notification API
 */
export async function sendPushNotification(
  title: string,
  options?: NotificationOptions & { soundType?: string; url?: string }
): Promise<boolean> {
  const settings = getPushSettings();
  
  if (!settings.enabled) return false;
  if (isInQuietHours(settings)) {
    console.log('[PushService] Notification suppressed due to quiet hours');
    return false;
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions: any = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: settings.vibrateEnabled ? [200, 100, 200] : undefined,
    ...options,
  };

  try {
    // Try via Service Worker first for better background support
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        triggerNotificationSound(options?.soundType, settings);
        return true;
      }
    }

    // Fallback to Window Notification API
    new Notification(title, defaultOptions);
    triggerNotificationSound(options?.soundType, settings);
    return true;
  } catch (e) {
    console.error('[PushService] Error triggering notification:', e);
    return false;
  }
}

/**
 * Trigger notification audio feedback
 */
function triggerNotificationSound(soundType?: string, settings: PushNotificationSettings = getPushSettings()) {
  if (!settings.soundEnabled) return;

  try {
    let soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav'; // Soft chime
    if (soundType === 'athan') {
      soundUrl = 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
    }

    const audio = new Audio(soundUrl);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch (e) {
    console.error('Audio play error', e);
  }
}
