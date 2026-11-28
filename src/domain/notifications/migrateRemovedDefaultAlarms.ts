/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlarmConfig } from '../../types';
import { safeGetJSON, safeSetJSON, safeGetItem, safeSetItem } from '../../utils/storage';
import { cancelNativeAlarm } from '../../services/athanAlarmPlugin';

export const MIGRATION_KEY_REMOVED_DEFAULT_ALARMS = 'salah_migration_removed_pre_post_defaults_v1';
export const REMOVED_DEFAULT_ALARM_IDS = ['alarm_before_salah', 'alarm_after_salah'] as const;

export interface MigrationResult {
  migrated: boolean;
  removedCount: number;
  cancelledNative: boolean;
}

export interface MigrateOptions {
  cancelAlarmFn?: (options: { alarmId?: string; requestCode?: number }) => Promise<boolean>;
  getStorageItem?: (key: string) => string | null;
  setStorageItem?: (key: string, value: string) => void;
  getJSONStorage?: <T>(key: string, fallback: T) => T;
  setJSONStorage?: (key: string, value: any) => void;
  dispatchCustomAlarmsChanged?: boolean;
}

/**
 * One-time idempotent migration on app start:
 * 1. Checks if migration has already succeeded. If so, returns early without modifying anything.
 * 2. Deletes any stored alarm in 'salah_custom_alarms' matching the two default IDs:
 *    - 'alarm_before_salah'
 *    - 'alarm_after_salah'
 *    - as well as any pending snoozes where snoozeOf is one of those two IDs.
 *    Keeps all user-created alarms and other default alarms (Duha, morning/evening adhkar, Qiyam) untouched.
 * 3. Cancels their OS AlarmManager entries, removes them from the ledger, and cancels their notifications
 *    via cancelNativeAlarm (matching exact key prefix custom_alarm_before_salah_ / custom_alarm_after_salah_
 *    and custom_snooze_alarm_before_salah_ / custom_snooze_alarm_after_salah_).
 * 4. Cancels any pending snoozes of these two alarms.
 * 5. Sets the migration flag LAST, ONLY after both cancelNativeAlarm calls succeed. If native is
 *    unavailable or a call fails, the flag is NOT set so it retries on the next start.
 */
export async function migrateRemovedDefaultAlarms(options?: MigrateOptions): Promise<MigrationResult> {
  const getItem = options?.getStorageItem || safeGetItem;
  const setItem = options?.setStorageItem || safeSetItem;
  const getJSON = options?.getJSONStorage || safeGetJSON;
  const setJSON = options?.setJSONStorage || safeSetJSON;
  const cancelFn = options?.cancelAlarmFn || cancelNativeAlarm;

  // 1. Check if already migrated
  if (getItem(MIGRATION_KEY_REMOVED_DEFAULT_ALARMS) === 'true') {
    return { migrated: false, removedCount: 0, cancelledNative: true };
  }

  // 2. Read stored custom alarms
  const storedAlarms = getJSON<AlarmConfig[] | null>('salah_custom_alarms', null);
  let removedCount = 0;
  const pendingSnoozeIdsToCancel: string[] = [];

  if (storedAlarms && Array.isArray(storedAlarms)) {
    const cleaned = storedAlarms.filter(a => {
      const isTargetDefault = a.id === 'alarm_before_salah' || a.id === 'alarm_after_salah';
      const isTargetSnooze = Boolean(
        a.snoozeOf && (a.snoozeOf === 'alarm_before_salah' || a.snoozeOf === 'alarm_after_salah')
      );

      if (isTargetDefault) {
        removedCount++;
        return false;
      }

      if (isTargetSnooze) {
        removedCount++;
        if (a.id) {
          pendingSnoozeIdsToCancel.push(a.id);
        }
        return false;
      }

      // Keep user alarms and all other defaults untouched
      return true;
    });

    if (removedCount > 0) {
      setJSON('salah_custom_alarms', cleaned);
      if (options?.dispatchCustomAlarmsChanged !== false && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: cleaned }));
      }
    }
  }

  // 3. Cancel OS alarms and notifications
  // Must succeed for BOTH default IDs before setting flag
  let preSuccess = false;
  let postSuccess = false;

  try {
    preSuccess = await cancelFn({ alarmId: 'alarm_before_salah' });
  } catch (err) {
    console.warn('[migrateRemovedDefaultAlarms] Failed cancelling alarm_before_salah:', err);
    preSuccess = false;
  }

  try {
    postSuccess = await cancelFn({ alarmId: 'alarm_after_salah' });
  } catch (err) {
    console.warn('[migrateRemovedDefaultAlarms] Failed cancelling alarm_after_salah:', err);
    postSuccess = false;
  }

  // Also cancel any explicit pending snooze IDs found in stored alarms
  for (const snoozeId of pendingSnoozeIdsToCancel) {
    try {
      await cancelFn({ alarmId: snoozeId });
    } catch {
      // Ignore individual snooze failure if main cancel succeeded
    }
  }

  // Dismiss any browser web notifications if applicable
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations?.().then(regs => {
          regs.forEach(reg => {
            reg.getNotifications?.().then(notifications => {
              notifications.forEach(n => {
                if (
                  n.tag?.includes('alarm_before_salah') ||
                  n.tag?.includes('alarm_after_salah') ||
                  n.tag?.includes('prealert') ||
                  n.tag?.includes('postalert')
                ) {
                  n.close();
                }
              });
            });
          });
        }).catch(() => {});
      }
    } catch {
      // best-effort web notification dismissal
    }
  }

  // 4. Set migration flag LAST only if both cancel calls succeeded
  const allCancelled = Boolean(preSuccess && postSuccess);
  if (allCancelled) {
    setItem(MIGRATION_KEY_REMOVED_DEFAULT_ALARMS, 'true');
    return {
      migrated: true,
      removedCount,
      cancelledNative: true
    };
  }

  // If native cancel failed or was unavailable, do not set flag so it retries on next start
  return {
    migrated: false,
    removedCount,
    cancelledNative: false
  };
}
