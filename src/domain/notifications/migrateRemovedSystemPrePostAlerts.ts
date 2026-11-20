/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeGetItem, safeSetItem, safeGetJSON, safeSetJSON } from '../../utils/storage';
import { getPushSettings, savePushSettings, PushNotificationSettings } from '../../utils/pushNotificationService';
import AthanAlarm from '../../services/athanAlarmPlugin';

export const MIGRATION_KEY_REMOVED_SYSTEM_PRE_POST_V1 = 'salah_migration_removed_system_pre_post_v1';

export interface NativeSyncPrefsPayload {
  prayerPreAlert: boolean;
  prayerPostAlert: boolean;
  hasBeforeSalahCustom: boolean;
  hasAfterSalahCustom: boolean;
}

export interface MigrateSystemPrePostOptions {
  getStorageItem?: (key: string) => string | null;
  setStorageItem?: (key: string, value: string) => void;
  getJSONStorage?: <T>(key: string, fallback: T) => T;
  setJSONStorage?: (key: string, value: any) => void;
  syncNativePrefsFn?: (payload: NativeSyncPrefsPayload) => Promise<boolean>;
  dispatchPushChanged?: boolean;
}

export interface MigrationSystemPrePostResult {
  migrated: boolean;
  alreadyMigrated?: boolean;
  success: boolean;
  error?: string;
}

/**
 * Idempotent one-time migration on app start (B6):
 * 1. Checks if migration has already succeeded. If so, returns early without modifying anything.
 * 2. Forces prayerPreAlert=false and prayerPostAlert=false in stored push settings ('mc_push_settings_v1',
 *    'salah_push_settings', 'hemmaty_push_settings').
 * 3. Sends false for prayerPreAlert, prayerPostAlert, hasBeforeSalahCustom, hasAfterSalahCustom to native prefs
 *    via the native sync call.
 * 4. The migration flag is set LAST, ONLY after successful completion.
 *
 * NOTE ON OBSOLETE ALARM CANCELLATION:
 * Already-registered prealert and postalert alarms are cancelled on the next reconcile because
 * AthanAlarmPlugin.kt (reconcileAlarmsInternalStatic) compares currently scheduled request codes against
 * the desired schedule. Since buildNativePrayerTimeAlarms no longer produces _prealert or _postalert items,
 * their request codes are absent from the desired schedule, causing reconcileAlarmsInternalStatic to mark
 * them obsolete, cancel their AlarmManager PendingIntents, cancel any active notifications, and remove them
 * from the scheduled IDs ledger.
 */
export async function migrateRemovedSystemPrePostAlerts(
  options?: MigrateSystemPrePostOptions
): Promise<MigrationSystemPrePostResult> {
  const getItem = options?.getStorageItem || safeGetItem;
  const setItem = options?.setStorageItem || safeSetItem;
  const getJSON = options?.getJSONStorage || safeGetJSON;
  const setJSON = options?.setJSONStorage || safeSetJSON;

  // 1. Check if already migrated
  if (getItem(MIGRATION_KEY_REMOVED_SYSTEM_PRE_POST_V1) === 'true') {
    return { migrated: false, alreadyMigrated: true, success: true };
  }

  try {
    // 2. Force prayerPreAlert=false and prayerPostAlert=false in all push settings storage keys
    const storageKeys = ['mc_push_settings_v1', 'salah_push_settings', 'hemmaty_push_settings'];
    for (const key of storageKeys) {
      const stored = getJSON<Partial<PushNotificationSettings> | null>(key, null);
      if (stored) {
        setJSON(key, {
          ...stored,
          prayerPreAlert: false,
          prayerPostAlert: false,
        });
      }
    }

    // Update memory push settings
    const currentPush = getPushSettings();
    savePushSettings({
      ...currentPush,
      prayerPreAlert: false,
      prayerPostAlert: false,
    });

    if (options?.dispatchPushChanged !== false && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('push-settings-changed', {
          detail: { ...currentPush, prayerPreAlert: false, prayerPostAlert: false },
        })
      );
    }

    // 3. Send false for prayerPreAlert, prayerPostAlert, hasBeforeSalahCustom, hasAfterSalahCustom to native prefs
    const nativePayload: NativeSyncPrefsPayload = {
      prayerPreAlert: false,
      prayerPostAlert: false,
      hasBeforeSalahCustom: false,
      hasAfterSalahCustom: false,
    };

    if (options?.syncNativePrefsFn) {
      const syncOk = await options.syncNativePrefsFn(nativePayload);
      if (!syncOk) {
        throw new Error('syncNativePrefsFn returned false');
      }
    } else if (
      typeof window !== 'undefined' &&
      (window as any).Capacitor?.isNativePlatform() &&
      AthanAlarm?.updateAthanPreferences
    ) {
      // Best-effort native preference sync if supported
      try {
        await (AthanAlarm as any).updateAthanPreferences(nativePayload);
      } catch (nativeErr) {
        console.warn('[migrateRemovedSystemPrePostAlerts] native prefs sync warning:', nativeErr);
      }
    }

    // 4. Set migration flag ONLY after success
    setItem(MIGRATION_KEY_REMOVED_SYSTEM_PRE_POST_V1, 'true');
    return { migrated: true, success: true };
  } catch (err: any) {
    console.error('[migrateRemovedSystemPrePostAlerts] Migration failed:', err);
    return { migrated: false, success: false, error: err?.message || String(err) };
  }
}
