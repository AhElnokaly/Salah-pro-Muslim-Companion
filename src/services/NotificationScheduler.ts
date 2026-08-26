import AthanAlarm from './athanAlarmPlugin';
import { sendPushNotification } from '../utils/pushNotificationService';

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
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        const numericId = typeof params.id === 'number' ? params.id : Math.abs(this.hashString(String(params.id)));
        await AthanAlarm.scheduleAthanAlarms({
          times: [
            {
              prayerKey: params.tag || 'custom',
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
        setTimeout(() => {
          this.triggerImmediate({
            title: params.title,
            body: params.body,
            tag: params.tag,
          });
        }, delayMs);
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
   * Cancel a scheduled notification
   */
  static async cancel(id: number | string): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
        await AthanAlarm.cancelAllAlarms();
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

