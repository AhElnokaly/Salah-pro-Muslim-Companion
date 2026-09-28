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
import { syncPrayerScheduleWithSW, getPushSettings } from '../../utils/pushNotificationService';
import { syncUpcomingPrayerSchedule } from '../../utils/prayerScheduleSync';
import { AppSettings, PrayerTimes, AlarmConfig } from '../../types';
import { KhushuStorage } from '../khushu/khushuStorage';
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
    days60List: DailyPrayerTimesEntry[],
    customAlarms?: AlarmConfig[]
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
        const pushSettings = getPushSettings();
        const preAlertEnabled = settings.prayerPreAlert ?? pushSettings.prayerPreAlert ?? true;
        const preAlertMins = settings.preAlertMinutes ?? pushSettings.preAlertMinutes ?? 15;
        const postAlertEnabled = settings.prayerPostAlert ?? pushSettings.prayerPostAlert ?? true;
        const postAlertMins = settings.postAlertMinutes ?? pushSettings.postAlertMinutes ?? 15;
        const khushuSettings = KhushuStorage.getSettings();

        let resolvedCustomAlarms = customAlarms;
        if (!resolvedCustomAlarms && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('salah_custom_alarms');
            if (raw) resolvedCustomAlarms = JSON.parse(raw);
          } catch (e) {
            console.warn('[NotificationOrchestrator] Error reading custom alarms:', e);
          }
        }

        const reconcileRes = await scheduleNativeAthanAlarms(days60List as any, undefined, {
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
          prayerPreAlert: preAlertEnabled,
          preAlertMinutes: preAlertMins,
          prayerPostAlert: postAlertEnabled,
          postAlertMinutes: postAlertMins,
          khushuAutoWithIqama: khushuSettings.autoWithIqama,
          khushuSettings,
          customAlarms: resolvedCustomAlarms,
        });
        scheduledCount = reconcileRes?.scheduledCount ?? 0;
        addedCount = reconcileRes?.addedCount ?? 0;
        removedCount = reconcileRes?.removedCount ?? 0;
        retainedCount = reconcileRes?.retainedCount ?? 0;

        // 3. Update Native Android Widget
        const currentTimes = days60List[0]?.timesMap || (days60List[0] as any)?.prayers;
        if (currentTimes) {
          const pinned = settings.pinnedWidget;
          await updateNativeWidgetData(currentTimes, settings.cityName || 'مواقيت الصلاة', {
            theme: pinned?.theme,
            widgetTheme: pinned?.theme,
            clockStyle: pinned?.clockStyle,
            showMoonPhase: pinned?.showMoonPhase,
            prayerDisplay: pinned?.prayerDisplay,
            showDate: pinned?.showDate,
            showDhikr: pinned?.showDhikr,
            showSubhaBtn: pinned?.showSubhaBtn,
            showKhushuBtn: pinned?.showKhushuBtn,
            showProgressBar: pinned?.showProgressBar,
            cardSize: pinned?.cardSize,
            pinnedWidget: pinned,
          }).catch(err => {
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
      const pushSettings = getPushSettings();
      const preAlertEnabled = settings.prayerPreAlert ?? pushSettings.prayerPreAlert ?? true;
      const preAlertMins = settings.preAlertMinutes ?? pushSettings.preAlertMinutes ?? 15;
      const postAlertEnabled = settings.prayerPostAlert ?? pushSettings.prayerPostAlert ?? true;
      const postAlertMins = settings.postAlertMinutes ?? pushSettings.postAlertMinutes ?? 15;
      const khushuSettings = KhushuStorage.getSettings();

      for (const key of keys) {
        if (!enabledPrayers[key] || !prayerTimes[key as keyof PrayerTimes]) continue;

        const timeStr = prayerTimes[key as keyof PrayerTimes];
        const [hours, minutes] = (timeStr || '').split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) continue;

        const [y, m, d] = dateStr.split('-').map(Number);
        const triggerDate = new Date(y, m - 1, d, hours, minutes, 0, 0);

        if (triggerDate.getTime() > Date.now()) {
          nativeAlarmsToSchedule.push({
            prayerKey: key,
            prayerName: key,
            timeMs: triggerDate.getTime(),
            isFajr: key === 'Fajr',
          });
        }

        // Pre-alert alarm before prayer time (excluding sunrise)
        if (preAlertEnabled && key !== 'Sunrise') {
          const preAlertTimeMs = triggerDate.getTime() - preAlertMins * 60000;
          if (preAlertTimeMs > Date.now()) {
            nativeAlarmsToSchedule.push({
              prayerKey: `${key}_prealert`,
              prayerName: key,
              timeMs: preAlertTimeMs,
              isFajr: key === 'Fajr',
              alarmType: 'prealert',
            });
          }
        }

        // Post-alert worship & adhkar reminder after prayer time (excluding sunrise)
        if (postAlertEnabled && key !== 'Sunrise') {
          const postAlertTimeMs = triggerDate.getTime() + postAlertMins * 60000;
          if (postAlertTimeMs > Date.now()) {
            nativeAlarmsToSchedule.push({
              prayerKey: `${key}_postalert`,
              prayerName: key,
              timeMs: postAlertTimeMs,
              isFajr: key === 'Fajr',
              alarmType: 'postalert',
            });
          }
        }

        // Auto Khushu alarm at Iqama moment (excluding sunrise)
        if (khushuSettings.autoWithIqama && key !== 'Sunrise') {
          const lowerKey = key.toLowerCase();
          const isFriday = triggerDate.getDay() === 5;
          let iqamaOffset = (khushuSettings.iqamaOffsets as any)?.[lowerKey] ?? 15;
          let duration = (khushuSettings.prayerDurations as any)?.[lowerKey] ?? 15;
          if (isFriday && lowerKey === 'dhuhr' && khushuSettings.enableFridaySpecial) {
            iqamaOffset = khushuSettings.iqamaOffsets.friday || 25;
            duration = khushuSettings.prayerDurations.friday || 45;
          }
          const iqamaTimeMs = triggerDate.getTime() + iqamaOffset * 60000;
          if (iqamaTimeMs > Date.now()) {
            nativeAlarmsToSchedule.push({
              prayerKey: `${key}_khushu`,
              prayerName: key,
              timeMs: iqamaTimeMs,
              isFajr: key === 'Fajr',
              alarmType: 'khushu',
              durationMinutes: duration,
              khushuMode: khushuSettings.preferredMode || 'silent',
            });
          }
        }
      }

      if (nativeAlarmsToSchedule.length > 0) {
        const res = await AthanAlarm.scheduleAthanAlarms({
          times: nativeAlarmsToSchedule,
          prayerPreAlert: preAlertEnabled,
          preAlertMinutes: preAlertMins,
          prayerPostAlert: postAlertEnabled,
          postAlertMinutes: postAlertMins,
          khushuAutoWithIqama: khushuSettings.autoWithIqama,
          khushuMode: khushuSettings.preferredMode || 'silent',
        });
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
