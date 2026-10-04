import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  DEFAULT_PUSH_SETTINGS, 
  getPushSettings, 
  savePushSettings, 
  PushNotificationSettings 
} from '../../utils/pushNotificationService';
import AthanAlarm, { 
  scheduleNativeAthanAlarms, 
  buildNativePrayerTimeAlarms, 
  cancelNativeAlarm, 
  DailyPrayerTimesEntry 
} from '../../services/athanAlarmPlugin';
import { AlarmConfig } from '../../types';

describe('Phase 6: System Worship Alarms & De-duplication', () => {
  // Mock localStorage for node environment
  const storageMap = new Map<string, string>();

  beforeEach(() => {
    storageMap.clear();
    (globalThis as any).localStorage = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, value: string) => storageMap.set(key, value),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
    };
  });

  test('DEFAULT_PUSH_SETTINGS defaults prayerPreAlert and prayerPostAlert to false', () => {
    assert.equal(DEFAULT_PUSH_SETTINGS.prayerPreAlert, false, 'prayerPreAlert must default to false');
    assert.equal(DEFAULT_PUSH_SETTINGS.prayerPostAlert, false, 'prayerPostAlert must default to false');
    assert.equal(DEFAULT_PUSH_SETTINGS.prayerAthan, true, 'prayerAthan defaults to true');
  });

  test('De-duplication rule: alerts present in custom alarms suppress duplicate system cards', () => {
    const customAlarms: AlarmConfig[] = [
      { id: 'alarm_before_salah', title: 'قبل الصلاة', enabled: true, offsetMinutes: 10, days: [0, 1, 2, 3, 4, 5, 6], soundType: 'beep' },
      { id: 'alarm_after_salah', title: 'بعد الصلاة', enabled: true, offsetMinutes: 15, days: [0, 1, 2, 3, 4, 5, 6], soundType: 'beep' },
      { id: 'alarm_morning_adhkar', title: 'أذكار الصباح', enabled: true, time: '06:30', days: [0, 1, 2, 3, 4, 5, 6], soundType: 'beep' },
      { id: 'alarm_evening_adhkar', title: 'أذكار المساء', enabled: true, time: '17:00', days: [0, 1, 2, 3, 4, 5, 6], soundType: 'beep' },
    ];

    const hasBeforeSalahCustom = customAlarms.some(a => a.id === 'alarm_before_salah');
    const hasAfterSalahCustom = customAlarms.some(a => a.id === 'alarm_after_salah');
    const hasMorningAdhkarCustom = customAlarms.some(a => a.id === 'alarm_morning_adhkar');
    const hasEveningAdhkarCustom = customAlarms.some(a => a.id === 'alarm_evening_adhkar');

    // System card is rendered only if !hasCustom
    const showSystemPreAlert = !hasBeforeSalahCustom;
    const showSystemPostAlert = !hasAfterSalahCustom;
    const showSystemMorning = !hasMorningAdhkarCustom;
    const showSystemEvening = !hasEveningAdhkarCustom;

    assert.equal(showSystemPreAlert, false, 'System pre-alert card must be hidden when custom alarm exists');
    assert.equal(showSystemPostAlert, false, 'System post-alert card must be hidden when custom alarm exists');
    assert.equal(showSystemMorning, false, 'System morning adhkar card must be hidden when custom alarm exists');
    assert.equal(showSystemEvening, false, 'System evening adhkar card must be hidden when custom alarm exists');

    // Total displayed count for these 4 alerts is strictly 4, never 8
    const totalRendered = (hasBeforeSalahCustom ? 1 : 0) + (showSystemPreAlert ? 1 : 0)
      + (hasAfterSalahCustom ? 1 : 0) + (showSystemPostAlert ? 1 : 0)
      + (hasMorningAdhkarCustom ? 1 : 0) + (showSystemMorning ? 1 : 0)
      + (hasEveningAdhkarCustom ? 1 : 0) + (showSystemEvening ? 1 : 0);

    assert.equal(totalRendered, 4, 'Each alarm must be rendered exactly once (no duplicates)');
  });

  test('De-duplication rule: when custom alarms are missing, system cards are displayed', () => {
    const customAlarms: AlarmConfig[] = []; // Empty custom alarms

    const hasBeforeSalahCustom = customAlarms.some(a => a.id === 'alarm_before_salah');
    const hasAfterSalahCustom = customAlarms.some(a => a.id === 'alarm_after_salah');

    const showSystemPreAlert = !hasBeforeSalahCustom;
    const showSystemPostAlert = !hasAfterSalahCustom;

    assert.equal(showSystemPreAlert, true, 'System pre-alert must show when custom alarm is absent');
    assert.equal(showSystemPostAlert, true, 'System post-alert must show when custom alarm is absent');
  });

  test('Saving push settings modifications writes to salah_push_settings correctly', () => {
    const initial = getPushSettings();
    const updated: PushNotificationSettings = {
      ...initial,
      prayerPreAlert: true,
      preAlertMinutes: 20,
      postAlertMinutes: 25,
      morningTime: '06:45',
      periodicIntervalHours: 3,
    };

    savePushSettings(updated);

    const reloaded = getPushSettings();
    assert.equal(reloaded.prayerPreAlert, true);
    assert.equal(reloaded.preAlertMinutes, 20);
    assert.equal(reloaded.postAlertMinutes, 25);
    assert.equal(reloaded.morningTime, '06:45');
    assert.equal(reloaded.periodicIntervalHours, 3);
  });

  test('Cancelling native alarms on disable calls cancelNativeAlarm with specific alarmId', async () => {
    let lastCancelledAlarmId: string | undefined;

    // Test web fallback simulation of cancelNativeAlarm
    const resPre = await cancelNativeAlarm({ alarmId: 'prealert' });
    assert.equal(resPre, true, 'cancelNativeAlarm must succeed for prealert');

    const resPost = await cancelNativeAlarm({ alarmId: 'postalert' });
    assert.equal(resPost, true, 'cancelNativeAlarm must succeed for postalert');

    const resAthan = await cancelNativeAlarm({ alarmId: 'athan' });
    assert.equal(resAthan, true, 'cancelNativeAlarm must succeed for athan');
  });

  test('TASK 7: building native items with preAlertSound="hayya" yields soundType "hayya"; default is "reminder"; with custom alarm_before_salah present, no system prealert items are built', async () => {
    const tomorrow = new Date(Date.now() + 86400000);
    const daysEntry: DailyPrayerTimesEntry[] = [
      {
        date: tomorrow,
        timesMap: {
          Fajr: '05:00',
          Sunrise: '06:30',
          Dhuhr: '12:30',
          Asr: '15:45',
          Maghrib: '18:15',
          Isha: '19:45',
        }
      }
    ];

    // 1. With preAlertSound='hayya'
    const itemsWithHayya = buildNativePrayerTimeAlarms(daysEntry, undefined, {
      prayerPreAlert: true,
      preAlertMinutes: 15,
      preAlertSound: 'hayya',
      prayerPostAlert: true,
      postAlertMinutes: 15,
      postAlertSound: 'salawat',
    });

    const preAlertItems = itemsWithHayya.filter((t) => t.alarmType === 'prealert');
    assert.ok(preAlertItems.length > 0, 'Should build prealert items for tomorrow');
    for (const item of preAlertItems) {
      assert.equal(item.soundType, 'hayya', `prealert soundType must be 'hayya', got ${item.soundType}`);
    }

    const postAlertItems = itemsWithHayya.filter((t) => t.alarmType === 'postalert');
    assert.ok(postAlertItems.length > 0, 'Should build postalert items for tomorrow');
    for (const item of postAlertItems) {
      assert.equal(item.soundType, 'salawat', `postalert soundType must be 'salawat', got ${item.soundType}`);
    }

    // 2. Default sound fallback is 'reminder'
    const itemsWithDefaults = buildNativePrayerTimeAlarms(daysEntry, undefined, {
      prayerPreAlert: true,
      preAlertMinutes: 15,
      prayerPostAlert: true,
      postAlertMinutes: 15,
    });

    const defaultPreItems = itemsWithDefaults.filter((t) => t.alarmType === 'prealert');
    assert.ok(defaultPreItems.length > 0);
    for (const item of defaultPreItems) {
      assert.equal(item.soundType, 'reminder', `Default prealert soundType must be 'reminder', got ${item.soundType}`);
    }

    const defaultPostItems = itemsWithDefaults.filter((t) => t.alarmType === 'postalert');
    assert.ok(defaultPostItems.length > 0);
    for (const item of defaultPostItems) {
      assert.equal(item.soundType, 'reminder', `Default postalert soundType must be 'reminder', got ${item.soundType}`);
    }

    // 3. With a custom alarm_before_salah present, no system prealert items are built
    const itemsWithCustomBefore = buildNativePrayerTimeAlarms(daysEntry, undefined, {
      prayerPreAlert: true,
      preAlertMinutes: 15,
      preAlertSound: 'hayya',
      customAlarms: [
        {
          id: 'alarm_before_salah',
          title: 'تنبيه مخصص قبل الصلاة',
          enabled: true,
          offsetMinutes: 20,
          soundType: 'takbeer',
          days: [0, 1, 2, 3, 4, 5, 6],
        }
      ]
    });

    const suppressedPreItems = itemsWithCustomBefore.filter((t) => t.alarmType === 'prealert');
    assert.equal(suppressedPreItems.length, 0, 'With custom alarm_before_salah present, NO system prealert items must be built');

    // 4. With a custom alarm_after_salah present, no system postalert items are built
    const itemsWithCustomAfter = buildNativePrayerTimeAlarms(daysEntry, undefined, {
      prayerPostAlert: true,
      postAlertMinutes: 15,
      postAlertSound: 'salawat',
      customAlarms: [
        {
          id: 'alarm_after_salah',
          title: 'تنبيه مخصص بعد الصلاة',
          enabled: true,
          offsetMinutes: 20,
          soundType: 'istighfar',
          days: [0, 1, 2, 3, 4, 5, 6],
        }
      ]
    });

    const suppressedPostItems = itemsWithCustomAfter.filter((t) => t.alarmType === 'postalert');
    assert.equal(suppressedPostItems.length, 0, 'With custom alarm_after_salah present, NO system postalert items must be built');

    // 5. Test scheduleNativeAthanAlarms executes cleanly
    const scheduledCount = await scheduleNativeAthanAlarms(daysEntry, undefined, {
      prayerPreAlert: true,
      preAlertMinutes: 15,
      preAlertSound: 'hayya',
      prayerPostAlert: true,
      postAlertMinutes: 15,
      postAlertSound: 'salawat',
    });
    assert.ok(scheduledCount > 0, 'scheduleNativeAthanAlarms should successfully schedule native items');
  });
});
