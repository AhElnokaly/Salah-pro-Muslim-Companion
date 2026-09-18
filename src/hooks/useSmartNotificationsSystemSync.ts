/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { 
  getSmartNotificationsSettings, 
  dispatchSmartNotification,
  SMART_NOTIFICATIONS_STORAGE_KEY 
} from '../domain/smartNotifications/smartNotificationService';
import { SmartNotificationsSettings } from '../domain/smartNotifications/smartNotificationTypes';
import AthanAlarm, { updateNativeWidgetData } from '../services/athanAlarmPlugin';
import { PrayerTimes } from '../types';
import { safeGetJSON, safeSetJSON } from '../utils/storage';

interface UseSmartNotificationsSystemSyncProps {
  cityName: string;
  hijriDateStr: string;
  nextPrayerNameArabic: string;
  nextPrayerTimeFormatted: string;
  remainingMsToNextPrayer: number;
  targetTimestampMs?: number;
  times?: Record<string, string> | PrayerTimes;
  dayNameArabic?: string;
  nextPrayerKey?: string;
  moonPhaseText?: string;
  currentTimeFormatted?: string;
  timeRemainingFormatted?: string;
  progressPercent?: number;
  isJumuah?: boolean;
}

const DISPATCHED_STORAGE_KEY = 'hemmaty_smart_notifications_dispatched_log';

interface DispatchedLog {
  readingDate?: string;
  listeningDate?: string;
  morningAdhkarDate?: string;
  eveningAdhkarDate?: string;
}

/**
 * Silent Background Hook:
 * Keeps the OS notification shade updated with ongoing prayer bar,
 * and schedules/dispatches smart notifications (Quran reading, listening, adhkar)
 * strictly via the device's actual notification shade / push system (NO in-app UI).
 */
export function useSmartNotificationsSystemSync({
  cityName,
  hijriDateStr,
  nextPrayerNameArabic,
  nextPrayerTimeFormatted,
  remainingMsToNextPrayer,
  targetTimestampMs,
  times,
  dayNameArabic,
  nextPrayerKey,
  moonPhaseText,
  currentTimeFormatted,
  timeRemainingFormatted,
  progressPercent,
  isJumuah,
}: UseSmartNotificationsSystemSyncProps) {
  const lastOngoingUpdateRef = useRef<number>(0);
  const settingsRef = useRef<SmartNotificationsSettings>(getSmartNotificationsSettings());

  // Listen to settings changes from the Settings Tab
  useEffect(() => {
    const handleSettingsChange = (e: Event) => {
      const customEv = e as CustomEvent<SmartNotificationsSettings>;
      if (customEv.detail) {
        settingsRef.current = customEv.detail;
      } else {
        settingsRef.current = getSmartNotificationsSettings();
      }

      // If user disabled ongoing prayer bar, immediately clear native ongoing notification
      if (!settingsRef.current.ongoingPrayerBar.enabled) {
        if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform() && AthanAlarm.updateOngoingPrayerNotification) {
          AthanAlarm.updateOngoingPrayerNotification({ enabled: false }).catch(() => {});
        }
      }
    };

    window.addEventListener('smart-notifications-settings-changed', handleSettingsChange);
    return () => {
      window.removeEventListener('smart-notifications-settings-changed', handleSettingsChange);
    };
  }, []);

  // 1. Ongoing Prayer Bar & Android Widget Update
  useEffect(() => {
    const updateOngoing = () => {
      const settings = settingsRef.current;
      
      // Update Android Native Widget (Homescreen)
      if (times && typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
        const hDate = dayNameArabic ? `${dayNameArabic} • ${hijriDateStr}` : hijriDateStr;
        updateNativeWidgetData(times, cityName, {
          hijriDate: hDate,
          moonPhase: moonPhaseText || '🌓 التربيع الأول',
          currentTime: currentTimeFormatted,
          nextPrayerTitle: `الصلاة القادمة: صلاة ${nextPrayerNameArabic}`,
          nextPrayerTime: nextPrayerTimeFormatted,
          remainingText: `⏳ متبقي: ${timeRemainingFormatted || ''}`,
          progressPercent: progressPercent ?? 80,
          activePrayer: (nextPrayerKey || 'dhuhr').toLowerCase(),
          isJumuah: Boolean(isJumuah),
        }).catch(() => {});
      }

      if (!settings.ongoingPrayerBar.enabled) return;

      const currentRemaining = targetTimestampMs
        ? Math.max(0, targetTimestampMs - Date.now())
        : remainingMsToNextPrayer;

      dispatchSmartNotification('ongoing_prayer', settings, {
        locationName: cityName,
        hijriDateStr,
        nextPrayerNameArabic,
        prayerTimeFormatted: nextPrayerTimeFormatted,
        remainingMs: currentRemaining,
        targetTimestamp: targetTimestampMs,
      }).catch((err) => {
        console.warn('[SmartNotificationsSystemSync] Ongoing update failed:', err);
      });
    };

    // Immediate update
    updateOngoing();

    // Regular interval to keep notification countdown accurate even without app re-render
    const interval = setInterval(updateOngoing, 20000);
    return () => clearInterval(interval);
  }, [
    cityName,
    hijriDateStr,
    nextPrayerNameArabic,
    nextPrayerTimeFormatted,
    remainingMsToNextPrayer,
    targetTimestampMs,
    times,
    dayNameArabic,
    nextPrayerKey,
    moonPhaseText,
    currentTimeFormatted,
    timeRemainingFormatted,
    progressPercent,
    isJumuah,
  ]);

  // 2. Periodic Time Watcher for Scheduled Reminders (Quran Reading, Listening, Adhkar)
  useEffect(() => {
    const checkScheduledSmartReminders = () => {
      const settings = settingsRef.current;
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      const dispatched = safeGetJSON<DispatchedLog>(DISPATCHED_STORAGE_KEY, {});

      // A. Quran Reading Portion
      if (settings.readingPortion.enabled && !settings.readingPortion.completedToday) {
        const targetTime = settings.readingPortion.scheduledTime || '17:00';
        if (currentTimeStr === targetTime && dispatched.readingDate !== todayStr) {
          dispatchSmartNotification('reading', settings, {});
          dispatched.readingDate = todayStr;
          safeSetJSON(DISPATCHED_STORAGE_KEY, dispatched);
        }
      }

      // B. Quran Listening Portion
      if (settings.listeningPortion.enabled) {
        const targetTime = settings.listeningPortion.scheduledTime || '20:00';
        if (currentTimeStr === targetTime && dispatched.listeningDate !== todayStr) {
          dispatchSmartNotification('listening', settings, {});
          dispatched.listeningDate = todayStr;
          safeSetJSON(DISPATCHED_STORAGE_KEY, dispatched);
        }
      }

      // C. Morning Adhkar
      if (settings.contextualAdhkar.enabled) {
        const morningTime = settings.contextualAdhkar.morningTime || '05:15';
        if (currentTimeStr === morningTime && dispatched.morningAdhkarDate !== todayStr) {
          dispatchSmartNotification('adhkar', settings, { adhkarType: 'morning' });
          dispatched.morningAdhkarDate = todayStr;
          safeSetJSON(DISPATCHED_STORAGE_KEY, dispatched);
        }

        // D. Evening Adhkar
        const eveningTime = settings.contextualAdhkar.eveningTime || '16:56';
        if (currentTimeStr === eveningTime && dispatched.eveningAdhkarDate !== todayStr) {
          dispatchSmartNotification('adhkar', settings, { adhkarType: 'evening' });
          dispatched.eveningAdhkarDate = todayStr;
          safeSetJSON(DISPATCHED_STORAGE_KEY, dispatched);
        }
      }
    };

    // Run check once on start, then every 30 seconds
    checkScheduledSmartReminders();
    const interval = setInterval(checkScheduledSmartReminders, 30000);

    return () => clearInterval(interval);
  }, []);

  // 3. Sync schedule with Service Worker for background wake-ups
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const syncWithServiceWorker = () => {
      const settings = settingsRef.current;
      navigator.serviceWorker.ready.then((reg) => {
        if (reg.active) {
          reg.active.postMessage({
            type: 'SYNC_SMART_SCHEDULE',
            payload: {
              readingPortion: settings.readingPortion,
              listeningPortion: settings.listeningPortion,
              contextualAdhkar: settings.contextualAdhkar,
            },
          });
        }
      }).catch(() => {});
    };

    syncWithServiceWorker();
  }, []);
}
