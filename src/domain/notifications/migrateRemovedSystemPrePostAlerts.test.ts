/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  migrateRemovedSystemPrePostAlerts,
  MIGRATION_KEY_REMOVED_SYSTEM_PRE_POST_V1,
} from './migrateRemovedSystemPrePostAlerts';
import { buildNativePrayerTimeAlarms, DailyPrayerTimesEntry } from '../../services/athanAlarmPlugin';

describe('B6 - migrateRemovedSystemPrePostAlerts & Pre/Post Alert Removal', () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const sampleEntry: DailyPrayerTimesEntry = {
    date: tomorrow,
    timesMap: {
      fajr: '05:00',
      sunrise: '06:30',
      dhuhr: '12:00',
      asr: '15:30',
      maghrib: '18:00',
      isha: '19:30',
    },
  };

  test('Requirement 1: No _prealert or _postalert item is produced even with stored flags true', () => {
    const alarms = buildNativePrayerTimeAlarms([sampleEntry], undefined, {
      prayerPreAlert: true,
      preAlertMinutes: 15,
      preAlertSound: 'hayya',
      prayerPostAlert: true,
      postAlertMinutes: 20,
      postAlertSound: 'salawat',
    });

    const preAlerts = alarms.filter(a => a.alarmType === 'prealert' || a.prayerKey.includes('_prealert'));
    const postAlerts = alarms.filter(a => a.alarmType === 'postalert' || a.prayerKey.includes('_postalert'));

    assert.equal(preAlerts.length, 0, 'No _prealert items must be produced even with prayerPreAlert=true');
    assert.equal(postAlerts.length, 0, 'No _postalert items must be produced even with prayerPostAlert=true');

    // Athan items must still exist
    const athanItems = alarms.filter(a => a.alarmType === 'athan');
    assert.ok(athanItems.length > 0, 'Athan items must still be produced');
  });

  test('Requirement 2: The migration is idempotent, forces push settings false, syncs native prefs, and sets flag only on success', async () => {
    const memoryStore = new Map<string, string>();
    let nativeSyncPayload: any = null;
    let nativeSyncCallCount = 0;

    // Seed storage with pre-alert and post-alert set to true
    const initialSettings = {
      enabled: true,
      prayerAthan: true,
      prayerPreAlert: true,
      preAlertMinutes: 15,
      prayerPostAlert: true,
      postAlertMinutes: 20,
    };
    memoryStore.set('mc_push_settings_v1', JSON.stringify(initialSettings));
    memoryStore.set('salah_push_settings', JSON.stringify(initialSettings));
    memoryStore.set('hemmaty_push_settings', JSON.stringify(initialSettings));

    const options = {
      getStorageItem: (key: string) => memoryStore.get(key) || null,
      setStorageItem: (key: string, val: string) => memoryStore.set(key, val),
      getJSONStorage: <T>(key: string, fallback: T): T => {
        const raw = memoryStore.get(key);
        if (!raw) return fallback;
        try {
          return JSON.parse(raw) as T;
        } catch {
          return fallback;
        }
      },
      setJSONStorage: (key: string, val: any) => memoryStore.set(key, JSON.stringify(val)),
      syncNativePrefsFn: async (payload: any) => {
        nativeSyncCallCount++;
        nativeSyncPayload = payload;
        return true;
      },
      dispatchPushChanged: false,
    };

    // First migration run: must succeed and apply changes
    const run1 = await migrateRemovedSystemPrePostAlerts(options);
    assert.equal(run1.migrated, true, 'First run must migrate');
    assert.equal(run1.success, true);
    assert.equal(nativeSyncCallCount, 1, 'Must invoke native sync once');
    assert.deepEqual(nativeSyncPayload, {
      prayerPreAlert: false,
      prayerPostAlert: false,
      hasBeforeSalahCustom: false,
      hasAfterSalahCustom: false,
    }, 'Must send false for all 4 flags to native prefs');

    // Verify stored settings were forced to false
    for (const key of ['mc_push_settings_v1', 'salah_push_settings', 'hemmaty_push_settings']) {
      const stored = JSON.parse(memoryStore.get(key)!);
      assert.equal(stored.prayerPreAlert, false, `${key} prayerPreAlert must be false`);
      assert.equal(stored.prayerPostAlert, false, `${key} prayerPostAlert must be false`);
    }

    // Verify flag was set
    assert.equal(memoryStore.get(MIGRATION_KEY_REMOVED_SYSTEM_PRE_POST_V1), 'true');

    // Second migration run (idempotency check): must return early without resyncing
    const run2 = await migrateRemovedSystemPrePostAlerts(options);
    assert.equal(run2.migrated, false, 'Second run must not re-migrate');
    assert.equal(run2.alreadyMigrated, true);
    assert.equal(nativeSyncCallCount, 1, 'Native sync must NOT be called again on second run');
  });

  test('Requirement 2 (failure resilience): If native sync fails, the migration flag is NOT set', async () => {
    const memoryStore = new Map<string, string>();

    const options = {
      getStorageItem: (key: string) => memoryStore.get(key) || null,
      setStorageItem: (key: string, val: string) => memoryStore.set(key, val),
      getJSONStorage: <T>(key: string, fallback: T): T => {
        const raw = memoryStore.get(key);
        return raw ? JSON.parse(raw) : fallback;
      },
      setJSONStorage: (key: string, val: any) => memoryStore.set(key, JSON.stringify(val)),
      syncNativePrefsFn: async () => false, // Simulate failure
      dispatchPushChanged: false,
    };

    const res = await migrateRemovedSystemPrePostAlerts(options);
    assert.equal(res.migrated, false);
    assert.equal(res.success, false);
    assert.equal(
      memoryStore.get(MIGRATION_KEY_REMOVED_SYSTEM_PRE_POST_V1),
      undefined,
      'Migration flag must NOT be set when native sync fails'
    );
  });

  test('Requirement 3: A user-created prayer_relative before/after alarm still produces items', () => {
    const customAlarms = [
      {
        id: 'user_relative_before_dhuhr',
        title: 'الاستعداد للظهر',
        enabled: true,
        type: 'prayer_relative' as const,
        relation: 'before' as const,
        prayers: ['Dhuhr'] as any,
        offsetMinutes: 15,
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'takbeer' as const,
      },
      {
        id: 'user_relative_after_maghrib',
        title: 'أذكار ما بعد المغرب',
        enabled: true,
        type: 'prayer_relative' as const,
        relation: 'after' as const,
        prayers: ['Maghrib'] as any,
        offsetMinutes: 10,
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'salawat' as const,
      },
    ];

    const alarms = buildNativePrayerTimeAlarms([sampleEntry], undefined, {
      customAlarms,
    });

    const userBeforeItem = alarms.find(
      a => a.alarmType === 'custom' && a.prayerKey.includes('user_relative_before_dhuhr')
    );
    const userAfterItem = alarms.find(
      a => a.alarmType === 'custom' && a.prayerKey.includes('user_relative_after_maghrib')
    );

    assert.ok(userBeforeItem, 'User relative before-prayer custom alarm must produce an alarm item');
    assert.equal(userBeforeItem.soundType, 'takbeer');
    // Dhuhr is 12:00, 15m before => 11:45
    const expectedBeforeMs = new Date(tomorrow).setHours(11, 45, 0, 0);
    assert.equal(userBeforeItem.timeMs, expectedBeforeMs);

    assert.ok(userAfterItem, 'User relative after-prayer custom alarm must produce an alarm item');
    assert.equal(userAfterItem.soundType, 'salawat');
    // Maghrib is 18:00, 10m after => 18:10
    const expectedAfterMs = new Date(tomorrow).setHours(18, 10, 0, 0);
    assert.equal(userAfterItem.timeMs, expectedAfterMs);
  });
});
