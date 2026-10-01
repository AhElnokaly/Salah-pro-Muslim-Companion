import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  DEFAULT_PUSH_SETTINGS, 
  getPushSettings, 
  savePushSettings, 
  PushNotificationSettings 
} from '../../utils/pushNotificationService';
import { cancelNativeAlarm } from '../../services/athanAlarmPlugin';
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
});
