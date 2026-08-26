/**
 * Alarm Reconciliation Service
 * Compares desired upcoming prayer alarms with scheduled state and updates accordingly.
 */

import AthanAlarm from './athanAlarmPlugin';
import { AlarmIdentifier } from '../domain/notifications/AlarmIdentifier';
import { calculatePrayerTimes } from '../utils/prayerCalc';
import { AppSettings, PrayerTimes } from '../types';

export interface ReconciliationStatus {
  lastReconciledAt: string;
  scheduledCount: number;
  missingCount: number;
  obsoleteCount: number;
  success: boolean;
}

export class AlarmReconciliationService {
  /**
   * Reconciles current alarms for today and tomorrow
   */
  static async reconcileAlarms(settings: AppSettings): Promise<ReconciliationStatus> {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const todayTimes = calculatePrayerTimes(
      now,
      settings.latitude,
      settings.longitude,
      0,
      settings.calcMethod,
      settings.madhab
    );

    const tomorrowTimes = calculatePrayerTimes(
      tomorrow,
      settings.latitude,
      settings.longitude,
      0,
      settings.calcMethod,
      settings.madhab
    );

    const desiredAlarms: Array<{ key: string; name: string; timeMs: number; dateStr: string }> = [];

    const processTimes = (dateStr: string, times: PrayerTimes) => {
      const keys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      for (const key of keys) {
        if (!settings.adhanEnabled?.[key] || !times[key]) continue;
        const [hours, mins] = times[key].split(':').map(Number);
        const triggerDate = new Date(`${dateStr}T${times[key]}:00`);
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

    processTimes(todayStr, todayTimes);
    processTimes(tomorrowStr, tomorrowTimes);

    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        const timesForNative = desiredAlarms.map((item) => ({
          prayerKey: item.key,
          prayerName: item.name,
          timeMs: item.timeMs,
          isFajr: item.key === 'Fajr',
        }));

        await AthanAlarm.scheduleAthanAlarms({
          times: timesForNative,
          lat: settings.latitude,
          lng: settings.longitude,
          calcMethod: settings.calcMethod,
          madhab: settings.madhab,
        });
      }

      return {
        lastReconciledAt: new Date().toISOString(),
        scheduledCount: desiredAlarms.length,
        missingCount: 0,
        obsoleteCount: 0,
        success: true,
      };
    } catch (err) {
      console.error('[AlarmReconciliationService] Reconciliation error:', err);
      return {
        lastReconciledAt: new Date().toISOString(),
        scheduledCount: 0,
        missingCount: desiredAlarms.length,
        obsoleteCount: 0,
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
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        await AthanAlarm.scheduleAthanAlarms({
          times: [
            {
              prayerKey: 'Test',
              prayerName: 'تجربة الأذان',
              timeMs: triggerAt,
            },
          ],
        });
        return true;
      } else if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          setTimeout(() => {
            new Notification('تجربة الأذان - هِمَّتِي', {
              body: 'تنبيه الأذان التجريبي يعمل بنجاح!',
              icon: '/icon-192.png',
            });
          }, seconds * 1000);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('[AlarmReconciliationService] Test alarm error:', err);
      return false;
    }
  }
}
