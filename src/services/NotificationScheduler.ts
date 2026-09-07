import AthanAlarm from './athanAlarmPlugin';
import { sendPushNotification } from '../utils/pushNotificationService';
import { prayerCanonicalNames } from '../domain/notifications/prayerCanonicalNames';

export interface ScheduleNotificationParams {
  id: number | string;
  title: string;
  body: string;
  triggerAt: Date | number; // Date object or timestamp
  tag?: string;
  soundName?: string;
  extraData?: Record<string, unknown>;
}

export class NotificationScheduler {
  private static activeWebTimeouts = new Map<string | number, ReturnType<typeof setTimeout>>();

  /**
   * Schedule a notification across available native/browser mechanisms
   */
  static async schedule(params: ScheduleNotificationParams): Promise<boolean> {
    const timestamp = typeof params.triggerAt === 'number' ? params.triggerAt : params.triggerAt.getTime();
    const now = Date.now();

    if (timestamp <= now) {
      console.warn('[NotificationScheduler] Cannot schedule notification in the past:', params.title);
      return false;
    }

    try {
      // 1. Android Native Alarm Plugin via Capacitor
      if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
        const rawTag = params.tag || 'custom';
        const prayerKey = prayerCanonicalNames[rawTag.toLowerCase()] || rawTag;
        await AthanAlarm.scheduleAthanAlarms({
          times: [
            {
              prayerKey,
              prayerName: params.title,
              timeMs: timestamp,
            },
          ],
        });
        return true;
      }

      // 2. Fallback to ServiceWorker or Timeout scheduling in web
      const delayMs = timestamp - now;
      if (delayMs > 0 && delayMs < 2147483647) { // Max 32-bit timeout limit
        // Cancel existing web timeout if any
        if (this.activeWebTimeouts.has(params.id)) {
          clearTimeout(this.activeWebTimeouts.get(params.id)!);
          this.activeWebTimeouts.delete(params.id);
        }

        const timer = setTimeout(() => {
          this.activeWebTimeouts.delete(params.id);
          this.triggerImmediate({
            title: params.title,
            body: params.body,
            tag: params.tag,
          });
        }, delayMs);

        this.activeWebTimeouts.set(params.id, timer);
        return true;
      }

      return false;
    } catch (err) {
      console.error('[NotificationScheduler] Error scheduling notification:', err);
      return false;
    }
  }

  /**
   * Trigger an immediate notification safely across desktop and mobile
   */
  static async triggerImmediate(options: { title: string; body: string; tag?: string; icon?: string }): Promise<void> {
    await sendPushNotification(options.title, {
      body: options.body,
      tag: options.tag,
      icon: options.icon || '/icon-192.png',
    });
  }

  /**
   * Cancel a scheduled notification or specific alarm
   */
  static async cancel(id: number | string): Promise<boolean> {
    try {
      // Cancel Web Timeout if active
      if (this.activeWebTimeouts.has(id)) {
        clearTimeout(this.activeWebTimeouts.get(id)!);
        this.activeWebTimeouts.delete(id);
      }
      const stringId = String(id);
      if (this.activeWebTimeouts.has(stringId)) {
        clearTimeout(this.activeWebTimeouts.get(stringId)!);
        this.activeWebTimeouts.delete(stringId);
      }

      if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform()) {
        const numericId = typeof id === 'number' ? id : parseInt(id, 10);
        if (!isNaN(numericId)) {
          await AthanAlarm.cancelAlarm({ requestCode: numericId });
        } else {
          await AthanAlarm.cancelAlarm({ alarmId: String(id) });
        }
      }
      return true;
    } catch (err) {
      console.error('[NotificationScheduler] Error canceling notification:', err);
      return false;
    }
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

