/**
 * UnifiedNotificationOrchestrator: High-level Coordinator for Native & Web Notifications
 * 
 * Provides a single clean entrypoint for:
 * 1. Synchronizing 30-day prayer schedules for background Service Workers.
 * 2. Scheduling Native Alarms on Android with deterministic request codes.
 * 3. Individual alarm cancellation without flushing the entire day.
 * 4. In-app spiritual toasts & web notification dispatches.
 */

import { AlarmIdentifier } from './AlarmIdentifier';
import { NotificationScheduler } from '../../services/NotificationScheduler';
import { syncPrayerScheduleWithSW } from '../../utils/pushNotificationService';
import { syncUpcomingPrayerSchedule } from '../../utils/prayerScheduleSync';
import { AppSettings, PrayerTimes } from '../../types';
import AthanAlarm, {
  PrayerTimeAlarm,
  DailyPrayerTimesEntry,
  scheduleNativeAthanAlarms,
  updateNativeWidgetData,
  ScheduledAlarmItem
} from '../../services/athanAlarmPlugin';

export interface OrchestratedAlarm {
  id: number;
  prayerKey: string;
  triggerAt: Date;
  dateStr: string;
}

export interface OrchestrationResult {
  scheduledCount: number;
  addedCount: number;
  removedCount: number;
  retainedCount: number;
  webSynced: boolean;
}

export class UnifiedNotificationOrchestrator {
  /**
   * Primary Single-Ingress coordinator for all prayer alarms & notifications:
   * 1. Syncs 30-day schedule for offline Service Worker & localStorage.
   * 2. Reconciles exact Android AlarmManager native alarms (adding missing, removing obsolete, retaining unchanged).
   * 3. Syncs current prayer times with native Home Screen Widget.
   */
  static async orchestratePrayerAlarms(
    settings: AppSettings,
    days60List: DailyPrayerTimesEntry[]
  ): Promise<OrchestrationResult> {
    let webSynced = false;
    let scheduledCount = 0;
    let addedCount = 0;
    let removedCount = 0;
    let retainedCount = 0;

    // 1. Sync PWA / Service Worker schedule
    try {
      syncUpcomingPrayerSchedule(settings);
      await syncPrayerScheduleWithSW(settings);
      webSynced = true;
    } catch (err) {
      console.warn('[NotificationOrchestrator] SW/Web Sync warning:', err);
    }

    // 2. Reconcile Native Android Alarms
    try {
      if (days60List && days60List.length > 0) {
        const userTz = settings.timezoneId || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined);
        scheduledCount = await scheduleNativeAthanAlarms(days60List, undefined, {
          lat: settings.latitude,
          lng: settings.longitude,
          calcMethod: settings.calcMethod,
          madhab: settings.madhab,
          timeZoneId: userTz,
          fajrOffset: settings.prayerOffsets?.Fajr || 0,
          dhuhrOffset: settings.prayerOffsets?.Dhuhr || 0,
          asrOffset: settings.prayerOffsets?.Asr || 0,
          maghribOffset: settings.prayerOffsets?.Maghrib || 0,
          ishaOffset: settings.prayerOffsets?.Isha || 0,
        });

        // 3. Update Native Android Widget
        const currentTimes = days60List[0]?.timesMap;
        if (currentTimes) {
          await updateNativeWidgetData(currentTimes, settings.cityName || 'مواقيت الصلاة').catch(err => {
            console.warn('[NotificationOrchestrator] Native widget update error:', err);
          });
        }
      }
    } catch (err) {
      console.warn('[NotificationOrchestrator] Native Alarm orchestration warning:', err);
    }

    return {
      scheduledCount,
      addedCount,
      removedCount,
      retainedCount,
      webSynced,
    };
  }

  /**
   * Sync complete prayer notification state across both Native (Android) and Web (PWA / SW)
   */
  static async syncAllNotificationChannels(
    settings: AppSettings,
    dateStr: string,
    prayerTimes: PrayerTimes,
    enabledPrayers: Record<string, boolean>
  ): Promise<{ nativeScheduled: number; webSynced: boolean }> {
    let nativeScheduledCount = 0;
    let webSynced = false;

    // 1. Sync 30-day schedule in localStorage & Service Worker
    try {
      syncUpcomingPrayerSchedule(settings);
      await syncPrayerScheduleWithSW(settings);
      webSynced = true;
    } catch (err) {
      console.warn('[NotificationOrchestrator] SW/Web Sync warning:', err);
    }

    // 2. Schedule Native Alarms on Android with deterministic IDs
    try {
      const keys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      const nativeAlarmsToSchedule: PrayerTimeAlarm[] = [];

      for (const key of keys) {
        if (!enabledPrayers[key] || !prayerTimes[key as keyof PrayerTimes]) continue;

        const timeStr = prayerTimes[key as keyof PrayerTimes];
        const [hours, minutes] = (timeStr || '').split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) continue;

        const [y, m, d] = dateStr.split('-').map(Number);
        const triggerDate = new Date(y, m - 1, d, hours, minutes, 0, 0);

        if (triggerDate.getTime() <= Date.now()) continue;

        nativeAlarmsToSchedule.push({
          prayerKey: key,
          prayerName: key,
          timeMs: triggerDate.getTime(),
          isFajr: key === 'Fajr',
        });
      }

      if (nativeAlarmsToSchedule.length > 0) {
        const res = await AthanAlarm.scheduleAthanAlarms({ times: nativeAlarmsToSchedule });
        nativeScheduledCount = res.scheduledCount;
      }
    } catch (err) {
      console.warn('[NotificationOrchestrator] Native Alarm sync warning:', err);
    }

    return {
      nativeScheduled: nativeScheduledCount,
      webSynced,
    };
  }

  /**
   * Cancel an individual prayer alarm cleanly using its deterministic ID
   */
  static async cancelPrayerAlarm(prayerKey: string, timeMs: number): Promise<boolean> {
    const numericId = AlarmIdentifier.generateId(prayerKey, timeMs);
    try {
      return await NotificationScheduler.cancel(numericId);
    } catch (err) {
      console.error('[NotificationOrchestrator] Failed to cancel alarm:', err);
      return false;
    }
  }

  /**
   * Get list of currently active scheduled alarms from native layer
   */
  static async getScheduledAlarms(): Promise<{ alarms: ScheduledAlarmItem[]; count: number }> {
    try {
      return await AthanAlarm.getScheduledAlarms();
    } catch (err) {
      console.warn('[NotificationOrchestrator] getScheduledAlarms warning:', err);
      return { alarms: [], count: 0 };
    }
  }
}
