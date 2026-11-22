/**
 * Alarm Reconciliation Service
 * Read-only diagnostics inspection over app-recorded alarm state via getAlarmDiagnostics().
 */

import { getAlarmDiagnostics } from './athanAlarmPlugin';
import { NotificationScheduler } from './NotificationScheduler';
import { AppSettings } from '../types';

export interface ReconciliationStatus {
  lastReconciledAt: string;
  savedCount: number;
  scheduledCount: number;
  success: boolean;
}

export class AlarmReconciliationService {
  /**
   * Reads current app-recorded alarm counts (read-only, never writes or reschedules alarms).
   * - savedCount: future entries in getAlarmDiagnostics().savedAlarms
   * - scheduledCount: future entries with isCurrentlyScheduled === true
   */
  static async reconcileAlarms(_settings?: AppSettings): Promise<ReconciliationStatus> {
    try {
      const diag = await getAlarmDiagnostics();
      const nowMs = Date.now();
      const savedAlarms = Array.isArray(diag?.savedAlarms) ? diag.savedAlarms : [];
      const futureSaved = savedAlarms.filter(
        (alarm) => typeof alarm.timeMs === 'number' && alarm.timeMs > nowMs
      );

      const savedCount = futureSaved.length;
      const scheduledCount = futureSaved.filter((alarm) => Boolean(alarm.isCurrentlyScheduled)).length;

      return {
        lastReconciledAt: new Date().toISOString(),
        savedCount,
        scheduledCount,
        success: true,
      };
    } catch (err) {
      console.error('[AlarmReconciliationService] Diagnostics read error:', err);
      return {
        lastReconciledAt: new Date().toISOString(),
        savedCount: 0,
        scheduledCount: 0,
        success: false,
      };
    }
  }

  /**
   * @deprecated Disabled in Commit 1 UI until Commit 2 adds safe mode: 'merge' scheduling.
   * Schedules a single test alarm after specified delay in seconds.
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
