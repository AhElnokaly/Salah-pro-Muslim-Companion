/**
 * Alarm Reconciliation Service
 * Compares desired upcoming prayer alarms with scheduled state and updates accordingly.
 */

import { UnifiedNotificationOrchestrator } from '../domain/notifications/UnifiedNotificationOrchestrator';
import { NotificationScheduler } from './NotificationScheduler';
import { calculatePrayerTimes, parseTimeToMinutes, getTimezoneOffsetForLocation } from '../utils/prayerCalc';
import { AppSettings, PrayerTimes } from '../types';

export interface ReconciliationStatus {
  lastReconciledAt: string;
  scheduledCount: number;
  missingCount: number;
  obsoleteCount: number;
  retainedCount: number;
  success: boolean;
}

export class AlarmReconciliationService {
  /**
   * Reconciles current alarms for today and tomorrow with true state diffing
   */
  static async reconcileAlarms(settings: AppSettings): Promise<ReconciliationStatus> {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const getLocalFormattedDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const todayStr = getLocalFormattedDate(now);
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowStr = getLocalFormattedDate(tomorrow);

    const lat = settings.latitude ?? 30.0444;
    const lng = settings.longitude ?? 31.2357;
    const calcMethod = settings.calcMethod ?? 'Egypt';
    const madhab = settings.madhab ?? 'standard';
    const offsets = settings.prayerOffsets ?? {};

    const todayTzOffset = getTimezoneOffsetForLocation(now, settings.timezoneId);
    const tomorrowTzOffset = getTimezoneOffsetForLocation(tomorrow, settings.timezoneId);

    const todayTimes = calculatePrayerTimes(
      now,
      lat,
      lng,
      todayTzOffset,
      calcMethod,
      madhab,
      offsets
    );

    const tomorrowTimes = calculatePrayerTimes(
      tomorrow,
      lat,
      lng,
      tomorrowTzOffset,
      calcMethod,
      madhab,
      offsets
    );

    const desiredAlarms: Array<{ key: string; name: string; timeMs: number; dateStr: string }> = [];

    const processTimes = (dateObj: Date, dateStr: string, times: PrayerTimes) => {
      const keys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      for (const key of keys) {
        if (!settings.adhanEnabled?.[key] || !times[key]) continue;
        const timeStr = times[key];
        const minutes = parseTimeToMinutes(timeStr);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const triggerDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), hours, mins, 0, 0);

        if (!isNaN(triggerDate.getTime()) && triggerDate.getTime() > now.getTime()) {
          desiredAlarms.push({
            key,
            name: key,
            timeMs: triggerDate.getTime(),
            dateStr,
          });
        }
      }
    };

    processTimes(now, todayStr, todayTimes);
    processTimes(tomorrow, tomorrowStr, tomorrowTimes);

    try {
      // 1. Fetch currently active scheduled alarms from native layer
      const scheduledState = await UnifiedNotificationOrchestrator.getScheduledAlarms();
      const currentAlarms = scheduledState.alarms || [];

      // 2. Compute Real Diff: Missing, Obsolete, and Retained
      // Match by prayerKey and time within 60-second window
      let retainedCount = 0;
      let missingCount = 0;

      for (const desired of desiredAlarms) {
        const isMatched = currentAlarms.some(curr => 
          curr.prayerKey.toLowerCase() === desired.key.toLowerCase() &&
          Math.abs(curr.timeMs - desired.timeMs) < 60000
        );
        if (isMatched) {
          retainedCount++;
        } else {
          missingCount++;
        }
      }

      let obsoleteCount = 0;
      for (const curr of currentAlarms) {
        const isStillDesired = desiredAlarms.some(desired => 
          desired.key.toLowerCase() === curr.prayerKey.toLowerCase() &&
          Math.abs(desired.timeMs - curr.timeMs) < 60000
        );
        if (!isStillDesired) {
          obsoleteCount++;
        }
      }

      // 3. Execute reconciliation through Unified Notification Orchestrator
      const enabledPrayers = (settings.adhanEnabled || {}) as Record<string, boolean>;
      await UnifiedNotificationOrchestrator.syncAllNotificationChannels(
        settings,
        todayStr,
        todayTimes,
        enabledPrayers
      );
      await UnifiedNotificationOrchestrator.syncAllNotificationChannels(
        settings,
        tomorrowStr,
        tomorrowTimes,
        enabledPrayers
      );

      return {
        lastReconciledAt: new Date().toISOString(),
        scheduledCount: desiredAlarms.length,
        missingCount,
        obsoleteCount,
        retainedCount,
        success: true,
      };
    } catch (err) {
      console.error('[AlarmReconciliationService] Reconciliation error:', err);
      return {
        lastReconciledAt: new Date().toISOString(),
        scheduledCount: 0,
        missingCount: desiredAlarms.length,
        obsoleteCount: 0,
        retainedCount: 0,
        success: false,
      };
    }
  }

  /**
   * Schedules a single test alarm after specified delay in seconds
   */
  static async scheduleTestAlarm(seconds = 60): Promise<boolean> {
    const triggerAt = Date.now() + seconds * 1000;
    try {
      // Reserved test-alarm ID range [1,999] — never use for real prayer alarms (those use [1000, 10000999] via getDeterministicRequestCode).
      return await NotificationScheduler.schedule({
        id: 1,
        title: 'تجربة الأذان',
        body: 'تنبيه الأذان التجريبي يعمل بنجاح!',
        triggerAt,
        tag: 'Test',
      });
    } catch (err) {
      console.error('[AlarmReconciliationService] Test alarm error:', err);
      return false;
    }
  }
}
