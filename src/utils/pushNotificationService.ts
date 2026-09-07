/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeSetItem, safeGetJSON, safeSetJSON } from './storage';
import { parseTimeToMinutes } from './prayerCalc';
import { requestNotificationPermission as requestNativeNotificationPermission } from '../services/athanAlarmPlugin';

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
  const saved = safeGetJSON<Partial<PushNotificationSettings> | null>(SETTINGS_STORAGE_KEY, null);
  if (saved) {
    return { ...DEFAULT_PUSH_SETTINGS, ...saved };
  }
  return DEFAULT_PUSH_SETTINGS;
}

/**
 * Save push settings
 */
export function savePushSettings(settings: PushNotificationSettings): void {
  safeSetJSON(SETTINGS_STORAGE_KEY, settings);
}

/**
 * Check if current time is inside quiet hours
 */
export function isInQuietHours(settings: PushNotificationSettings = getPushSettings()): boolean {
  if (!settings.quietHours) return false;

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const startMin = parseTimeToMinutes(settings.quietStart || '23:00');
  const endMin = parseTimeToMinutes(settings.quietEnd || '04:30');

  if (startMin > endMin) {
    // Overnight quiet hours, e.g. 23:00 to 04:30
    return currentMin >= startMin || currentMin < endMin;
  } else {
    return currentMin >= startMin && currentMin < endMin;
  }
}

/**
 * Request notification permission from browser or native Android environment
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  // First, if running in native Android / Capacitor container, request POST_NOTIFICATIONS
  try {
    const nativeGranted = await requestNativeNotificationPermission();
    if (nativeGranted && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        await registerServiceWorker();
        return 'granted';
      }
    }
  } catch (nativeErr) {
    console.warn('[PushService]: Native permission check error:', nativeErr);
  }

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

import { AppSettings } from '../types';
import { syncUpcomingPrayerSchedule } from './prayerScheduleSync';

/**
 * Sync calculated prayer schedule with Service Worker for background notifications when browser is minimized/closed
 */
export async function syncPrayerScheduleWithSW(settings: AppSettings): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  try {
    let reg: ServiceWorkerRegistration | null | undefined = await navigator.serviceWorker.getRegistration();
    if (!reg) {
      reg = await registerServiceWorker();
    }
    if (!reg) return;

    // Register periodic sync if supported
    if (reg.periodicSync) {
      try {
        const tags = await reg.periodicSync.getTags();
        if (!tags.includes('prayer-check')) {
          await reg.periodicSync.register('prayer-check', {
            minInterval: 15 * 60 * 1000 // Every 15 mins
          });
        }
      } catch (e) {
        // Periodic sync permission may not be granted, fallback to SW internal timer
      }
    }

    const schedule = syncUpcomingPrayerSchedule(settings);
    const sw = reg.active || navigator.serviceWorker.controller;
    
    if (sw) {
      sw.postMessage({
        type: 'SYNC_PRAYER_SCHEDULE',
        payload: {
          schedule,
          cityName: settings.cityName || 'القاهرة',
          adhanEnabled: settings.adhanEnabled || {}
        }
      });
      console.log('[PushService] Synced prayer schedule to SW:', schedule.length, 'items');
    }
  } catch (err) {
    console.error('[PushService] Failed to sync prayer schedule with SW:', err);
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
 * Display a notification safely across Mobile/Android (Chrome/PWA) and Desktop browsers.
 * Uses ServiceWorkerRegistration.showNotification() when available, with a resilient fallback
 * that prevents "Failed to construct 'Notification': Illegal constructor" crashes on Android.
 */
export async function showAppNotification(
  title: string,
  options?: NotificationOptions & { soundType?: string; url?: string }
): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions: NotificationOptions = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    ...options,
  };

  // 1. Try Service Worker showNotification first (Mandatory for Android Chrome & Mobile PWAs)
  if ('serviceWorker' in navigator) {
    try {
      let reg: ServiceWorkerRegistration | undefined = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<undefined>((r) => setTimeout(() => r(undefined), 2000))
        ]) as ServiceWorkerRegistration | undefined;
      }

      if (reg && typeof reg.showNotification === 'function') {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
    } catch (swErr) {
      console.warn('[PushNotification] SW showNotification error:', swErr);
    }
  }

  // 2. Fallback to desktop window Notification constructor
  try {
    new Notification(title, defaultOptions);
    return true;
  } catch (winNotifErr) {
    // On Android Chrome, 'new Notification()' throws TypeError: Illegal constructor.
    console.warn('[PushNotification] Window Notification constructor not supported on this platform:', winNotifErr);
    return false;
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

  const defaultOptions: NotificationOptions & { soundType?: string; url?: string; vibrate?: number | number[] } = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'ar',
    vibrate: settings.vibrateEnabled ? [200, 100, 200] : undefined,
    ...options,
  };

  try {
    const shown = await showAppNotification(title, defaultOptions);
    if (shown) {
      triggerNotificationSound(options?.soundType, settings);
    }
    return shown;
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
