/**
 * NotificationPlanner: Unified Source of Truth for Prayer Notifications & Alarms
 */

import { AlarmIdentifier } from './AlarmIdentifier';
import { NotificationScheduler } from '../../services/NotificationScheduler';
import { PrayerTimes } from '../../types';

export interface ScheduledPrayerNotification {
  id: number;
  prayerKey: string;
  prayerName: string;
  triggerAt: Date;
  dateStr: string;
}

export class NotificationPlanner {
  /**
   * Plan and schedule all notifications for a given day's prayer times
   */
  static async scheduleDailyPrayers(
    dateStr: string,
    prayerTimes: PrayerTimes,
    enabledPrayers: Record<string, boolean>
  ): Promise<ScheduledPrayerNotification[]> {
    const scheduledList: ScheduledPrayerNotification[] = [];

    const keys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    for (const key of keys) {
      if (!enabledPrayers[key] || !prayerTimes[key]) continue;

      const timeParts = prayerTimes[key].split(':');
      if (timeParts.length < 2) continue;

      const triggerDate = new Date(`${dateStr}T${prayerTimes[key]}:00`);
      if (isNaN(triggerDate.getTime())) continue;

      const numericId = AlarmIdentifier.generateId(dateStr, key);

      const scheduledItem: ScheduledPrayerNotification = {
        id: numericId,
        prayerKey: key,
        prayerName: key,
        triggerAt: triggerDate,
        dateStr,
      };

      const success = await NotificationScheduler.schedule({
        id: numericId,
        title: `حين صلاة ${key}`,
        body: `حان الآن موعد صلاة ${key}`,
        triggerAt: triggerDate,
        tag: key,
      });

      if (success) {
        scheduledList.push(scheduledItem);
      }
    }

    return scheduledList;
  }
}
