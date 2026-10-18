import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  migrateRemovedDefaultAlarms,
  MIGRATION_KEY_REMOVED_DEFAULT_ALARMS,
  REMOVED_DEFAULT_ALARM_IDS
} from './migrateRemovedDefaultAlarms';
import { DEFAULT_WORSHIP_ALARMS } from '../../utils/alarmUtils';
import { AlarmConfig } from '../../types';

describe('migrateRemovedDefaultAlarms - Idempotent Migration of Default Alarms', () => {
  const createMockStorage = (initialAlarms: AlarmConfig[] | null, initialFlags: Record<string, string> = {}) => {
    let alarms = initialAlarms;
    const flags: Record<string, string> = { ...initialFlags };

    return {
      getItem: (key: string) => flags[key] ?? null,
      setItem: (key: string, val: string) => { flags[key] = val; },
      getJSON: <T>(key: string, fallback: T): T => {
        if (key === 'salah_custom_alarms') return (alarms as unknown as T) ?? fallback;
        return fallback;
      },
      setJSON: (key: string, val: any) => {
        if (key === 'salah_custom_alarms') alarms = val;
      },
      getAlarms: () => alarms,
      getFlags: () => flags,
    };
  };

  test('1. Migration removes only alarm_before_salah and alarm_after_salah, keeping user-created alarms untouched', async () => {
    const userCustomAlarm: AlarmConfig = {
      id: 'alarm_user_quran_reminder',
      title: 'تنبيه قراءة ورد القرآن',
      enabled: true,
      type: 'fixed',
      time: '14:30',
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'reminder',
    };

    const initialAlarms: AlarmConfig[] = [
      {
        id: 'alarm_before_salah',
        title: 'تنبيه قبل الصلاة',
        enabled: true,
        type: 'prayer_relative',
        prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
        relation: 'before',
        offsetMinutes: 10,
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'hayya',
      },
      {
        id: 'alarm_after_salah',
        title: 'تنبيه بعد الصلاة (الأذكار والسنن)',
        enabled: true,
        type: 'prayer_relative',
        prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
        relation: 'after',
        offsetMinutes: 15,
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'salawat',
      },
      userCustomAlarm,
      {
        id: 'alarm_duha',
        title: 'صلاة الضحى (صلاة الأوابين)',
        enabled: true,
        type: 'prayer_relative',
        prayers: ['Sunrise'],
        relation: 'after',
        offsetMinutes: 15,
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'duaa',
      }
    ];

    const storage = createMockStorage(initialAlarms);
    const cancelledIds: string[] = [];
    const mockCancelAlarm = async (opts: { alarmId?: string }) => {
      if (opts.alarmId) cancelledIds.push(opts.alarmId);
      return true;
    };

    const result = await migrateRemovedDefaultAlarms({
      cancelAlarmFn: mockCancelAlarm,
      getStorageItem: storage.getItem,
      setStorageItem: storage.setItem,
      getJSONStorage: storage.getJSON,
      setJSONStorage: storage.setJSON,
      dispatchCustomAlarmsChanged: false,
    });

    assert.equal(result.migrated, true, 'Migration should report success');
    assert.equal(result.removedCount, 2, 'Exactly 2 default alarms should be removed');
    assert.equal(result.cancelledNative, true);

    const remaining = storage.getAlarms() || [];
    assert.equal(remaining.length, 2, 'Should have exactly 2 alarms remaining');
    assert.ok(remaining.some(a => a.id === userCustomAlarm.id), 'User custom alarm must be preserved untouched');
    assert.ok(remaining.some(a => a.id === 'alarm_duha'), 'Duha default alarm must be preserved');
    assert.ok(!remaining.some(a => a.id === 'alarm_before_salah'), 'alarm_before_salah must be deleted');
    assert.ok(!remaining.some(a => a.id === 'alarm_after_salah'), 'alarm_after_salah must be deleted');

    // OS Alarms cancelled by ID
    assert.ok(cancelledIds.includes('alarm_before_salah'), 'alarm_before_salah must be cancelled natively');
    assert.ok(cancelledIds.includes('alarm_after_salah'), 'alarm_after_salah must be cancelled natively');

    // Migration flag set LAST
    assert.equal(storage.getItem(MIGRATION_KEY_REMOVED_DEFAULT_ALARMS), 'true', 'Migration flag must be set');
  });

  test('2. Migration also removes and cancels pending snoozes of the two removed defaults, but keeps snoozes of user alarms', async () => {
    const userAlarmSnooze: AlarmConfig = {
      id: 'snooze_user_999',
      title: 'منبه مخصص (غفوة)',
      enabled: true,
      type: 'fixed',
      time: '15:05',
      days: [1],
      soundType: 'reminder',
      oneShot: true,
      snoozeOf: 'user_custom_alarm_1',
    };

    const beforeSalahSnooze: AlarmConfig = {
      id: 'snooze_before_salah_111',
      title: 'تنبيه قبل الصلاة (غفوة)',
      enabled: true,
      type: 'fixed',
      time: '12:05',
      days: [1],
      soundType: 'reminder',
      oneShot: true,
      snoozeOf: 'alarm_before_salah',
    };

    const afterSalahSnooze: AlarmConfig = {
      id: 'snooze_after_salah_222',
      title: 'تنبيه بعد الصلاة (غفوة)',
      enabled: true,
      type: 'fixed',
      time: '13:05',
      days: [1],
      soundType: 'reminder',
      oneShot: true,
      snoozeOf: 'alarm_after_salah',
    };

    const initialAlarms: AlarmConfig[] = [
      { id: 'alarm_before_salah', title: 'قبل الصلاة', enabled: true, type: 'prayer_relative', relation: 'before', offsetMinutes: 10, days: [0, 1], soundType: 'hayya' },
      beforeSalahSnooze,
      afterSalahSnooze,
      userAlarmSnooze,
    ];

    const storage = createMockStorage(initialAlarms);
    const cancelledIds: string[] = [];
    const mockCancelAlarm = async (opts: { alarmId?: string }) => {
      if (opts.alarmId) cancelledIds.push(opts.alarmId);
      return true;
    };

    const result = await migrateRemovedDefaultAlarms({
      cancelAlarmFn: mockCancelAlarm,
      getStorageItem: storage.getItem,
      setStorageItem: storage.setItem,
      getJSONStorage: storage.getJSON,
      setJSONStorage: storage.setJSON,
      dispatchCustomAlarmsChanged: false,
    });

    assert.equal(result.migrated, true);
    assert.equal(result.removedCount, 3, 'alarm_before_salah and both its snoozes removed');

    const remaining = storage.getAlarms() || [];
    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].id, 'snooze_user_999', 'Snooze of user custom alarm must be preserved');

    // Cancel calls must include the snooze IDs as well as main IDs
    assert.ok(cancelledIds.includes('alarm_before_salah'));
    assert.ok(cancelledIds.includes('alarm_after_salah'));
    assert.ok(cancelledIds.includes('snooze_before_salah_111'));
    assert.ok(cancelledIds.includes('snooze_after_salah_222'));
  });

  test('3. Migration is idempotent: second run is a no-op and does not modify storage or call cancel', async () => {
    const storage = createMockStorage([], { [MIGRATION_KEY_REMOVED_DEFAULT_ALARMS]: 'true' });
    let cancelCalled = false;
    const mockCancelAlarm = async () => {
      cancelCalled = true;
      return true;
    };

    const result = await migrateRemovedDefaultAlarms({
      cancelAlarmFn: mockCancelAlarm,
      getStorageItem: storage.getItem,
      setStorageItem: storage.setItem,
      getJSONStorage: storage.getJSON,
      setJSONStorage: storage.setJSON,
    });

    assert.equal(result.migrated, false, 'Should be a no-op when flag is already set');
    assert.equal(result.removedCount, 0);
    assert.equal(cancelCalled, false, 'No cancellation calls should be made if already migrated');
  });

  test('4. If cancelNativeAlarm fails or native is unavailable, migration flag is NOT set so it can retry', async () => {
    const storage = createMockStorage([
      { id: 'alarm_before_salah', title: 'قبل الصلاة', enabled: true, type: 'prayer_relative', relation: 'before', offsetMinutes: 10, days: [0], soundType: 'hayya' }
    ]);

    // Simulate native failure on second cancel
    let callCount = 0;
    const mockFailingCancel = async () => {
      callCount++;
      if (callCount === 2) return false; // second call fails
      return true;
    };

    const result = await migrateRemovedDefaultAlarms({
      cancelAlarmFn: mockFailingCancel,
      getStorageItem: storage.getItem,
      setStorageItem: storage.setItem,
      getJSONStorage: storage.getJSON,
      setJSONStorage: storage.setJSON,
      dispatchCustomAlarmsChanged: false,
    });

    assert.equal(result.migrated, false, 'Migration must report false if native cancel fails');
    assert.equal(result.cancelledNative, false);
    assert.equal(
      storage.getItem(MIGRATION_KEY_REMOVED_DEFAULT_ALARMS),
      null,
      'Migration flag MUST NOT be set if cancellation failed, allowing retry on next start'
    );
  });

  test('5. Restore-defaults (DEFAULT_WORSHIP_ALARMS) no longer recreates alarm_before_salah or alarm_after_salah', () => {
    assert.ok(Array.isArray(DEFAULT_WORSHIP_ALARMS), 'DEFAULT_WORSHIP_ALARMS must be an array');
    assert.equal(DEFAULT_WORSHIP_ALARMS.length, 4, 'DEFAULT_WORSHIP_ALARMS must contain exactly 4 alarms');

    const defaultIds = DEFAULT_WORSHIP_ALARMS.map(a => a.id);
    assert.ok(!defaultIds.includes('alarm_before_salah'), 'DEFAULT_WORSHIP_ALARMS must not contain alarm_before_salah');
    assert.ok(!defaultIds.includes('alarm_after_salah'), 'DEFAULT_WORSHIP_ALARMS must not contain alarm_after_salah');

    // Expected remaining worship defaults
    assert.deepEqual(defaultIds, [
      'alarm_duha',
      'alarm_morning_adhkar',
      'alarm_evening_adhkar',
      'alarm_qiyam',
    ]);
  });

  test('6. Exact prefix matching test (non-substring): only exact prefixes custom_alarm_before_salah_ and custom_alarm_after_salah_ match', () => {
    const matchesPrefix = (pKey: string, alarmId: string, snoozeOf?: string): boolean => {
      return whenMatch(alarmId, pKey, snoozeOf);
    };

    const whenMatch = (alarmId: string, pKey: string, snoozeOf?: string) => {
      if (alarmId === 'alarm_before_salah') {
        return pKey.startsWith('custom_alarm_before_salah_') ||
               pKey.startsWith('custom_snooze_alarm_before_salah_') ||
               snoozeOf === 'alarm_before_salah';
      }
      if (alarmId === 'alarm_after_salah') {
        return pKey.startsWith('custom_alarm_after_salah_') ||
               pKey.startsWith('custom_snooze_alarm_after_salah_') ||
               snoozeOf === 'alarm_after_salah';
      }
      return false;
    };

    // Correct target alarms match
    assert.ok(matchesPrefix('custom_alarm_before_salah_fajr_17000000', 'alarm_before_salah'));
    assert.ok(matchesPrefix('custom_alarm_after_salah_dhuhr_17000000', 'alarm_after_salah'));
    assert.ok(matchesPrefix('custom_snooze_alarm_before_salah_snooze_123_17000000', 'alarm_before_salah'));
    assert.ok(matchesPrefix('custom_snooze_alarm_after_salah_snooze_123_17000000', 'alarm_after_salah'));
    assert.ok(matchesPrefix('custom_snooze_legacy_17000000', 'alarm_before_salah', 'alarm_before_salah'));

    // Substrings in user alarm names MUST NOT MATCH
    assert.equal(matchesPrefix('custom_my_alarm_before_salah_test_17000000', 'alarm_before_salah'), false, 'Substrings must NOT match');
    assert.equal(matchesPrefix('custom_user_alarm_after_salah_test_17000000', 'alarm_after_salah'), false, 'Substrings must NOT match');
    assert.equal(matchesPrefix('custom_alarm_duha_sunrise_17000000', 'alarm_before_salah'), false);
    assert.equal(matchesPrefix('custom_alarm_morning_adhkar_17000000', 'alarm_after_salah'), false);
  });
});
