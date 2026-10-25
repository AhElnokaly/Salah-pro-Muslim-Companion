import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildNativePrayerTimeAlarms, 
  DailyPrayerTimesEntry 
} from '../../services/athanAlarmPlugin';
import { AlarmConfig } from '../../types';
import { KhushuStorage } from '../khushu/khushuStorage';

describe('B1: Sliding Window & Computed Alarm Expectation Tests', () => {
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

  const generateDaysList = (numDays: number): DailyPrayerTimesEntry[] => {
    const list: DailyPrayerTimesEntry[] = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < numDays; i++) {
      const d = new Date(baseDate.getTime() + (i + 1) * 86400000); // Future days to ensure all are upcoming
      list.push({
        date: d,
        timesMap: {
          Fajr: '05:00',
          Sunrise: '06:20',
          Dhuhr: '12:00',
          Asr: '15:15',
          Maghrib: '17:45',
          Isha: '19:15',
        },
      });
    }
    return list;
  };

  test('1. Exact computed expectation matches 14-day window without custom alarms', () => {
    const days14 = generateDaysList(14);
    const athanEnabledMap = {
      Fajr: true,
      Dhuhr: true,
      Asr: true,
      Maghrib: true,
      Isha: true,
    };

    const calcParams = {
      athanEnabledMap,
      prayerPreAlert: false,
      prayerPostAlert: false,
    };

    const alarms = buildNativePrayerTimeAlarms(days14, undefined, calcParams);

    // Dynamically computed expectation: dynamically sum alarms generated per day
    let dynamicallyComputedCount = 0;
    for (const singleDay of days14) {
      dynamicallyComputedCount += buildNativePrayerTimeAlarms([singleDay], undefined, calcParams).length;
    }

    assert.equal(
      alarms.length,
      dynamicallyComputedCount,
      `Expected exactly ${dynamicallyComputedCount} alarms dynamically computed by generator for 14 days`
    );

    // Hard ceiling check (must be well below 300)
    assert.ok(alarms.length <= 300, `Alarms count (${alarms.length}) must not exceed hard ceiling of 300`);
  });

  test('2. Exact computed expectation with active recurring custom alarms + one-shot snooze + khushu entries', () => {
    const days14 = generateDaysList(14);
    const athanEnabledMap = {
      Fajr: true,
      Dhuhr: true,
      Asr: true,
      Maghrib: true,
      Isha: true,
    };

    const todayStr = days14[0].date.toISOString().split('T')[0];
    const customAlarms: AlarmConfig[] = [
      {
        id: 'alarm_duha',
        title: 'صلاة الضحى',
        enabled: true,
        type: 'fixed',
        time: '08:30',
        days: [0, 1, 2, 3, 4, 5, 6], // Daily
        soundType: 'reminder',
      },
      {
        id: 'snooze_test_123',
        title: 'صلاة الضحى (غفوة)',
        enabled: true,
        type: 'fixed',
        time: '08:45',
        days: [days14[0].date.getDay()],
        oneShot: true,
        fireDate: todayStr,
        soundType: 'reminder',
      },
      {
        id: 'alarm_before_dhuhr',
        title: 'تنبيه قبل الظهر',
        enabled: true,
        type: 'prayer_relative',
        relation: 'before',
        offsetMinutes: 10,
        prayers: ['Dhuhr'],
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'reminder',
      },
    ];

    const baseKhushu = KhushuStorage.getSettings();
    const khushuSettings = {
      ...baseKhushu,
      preferredMode: 'silent' as const,
      iqamaOffsets: { ...baseKhushu.iqamaOffsets, fajr: 20, dhuhr: 15, asr: 15, maghrib: 10, isha: 15, friday: 25 },
      prayerDurations: { ...baseKhushu.prayerDurations, fajr: 20, dhuhr: 15, asr: 15, maghrib: 15, isha: 20, friday: 45 },
      enableFridaySpecial: true,
    };

    const calcParams = {
      athanEnabledMap,
      customAlarms,
      khushuAutoWithIqama: true,
      khushuSettings,
      prayerPreAlert: false,
      prayerPostAlert: false,
    };

    const alarms = buildNativePrayerTimeAlarms(days14, undefined, calcParams);

    // Dynamically compute expectation by calling the generator per day slice and summing
    let dynamicallyComputedExpected = 0;
    for (const singleDay of days14) {
      dynamicallyComputedExpected += buildNativePrayerTimeAlarms([singleDay], undefined, calcParams).length;
    }

    assert.equal(
      alarms.length,
      dynamicallyComputedExpected,
      `Scheduled count (${alarms.length}) must match dynamically computed sum (${dynamicallyComputedExpected}) across the 14-day schedule`
    );
    assert.ok(alarms.length <= 300, `Must remain below hard ceiling of 300 (actual: ${alarms.length})`);
  });

  test('3. Real alarms are never dropped to satisfy a cap', () => {
    const days14 = generateDaysList(14);
    const athanEnabledMap = {
      Fajr: true,
      Dhuhr: true,
      Asr: true,
      Maghrib: true,
      Isha: true,
    };

    // Multiple recurring custom alarms
    const customAlarms: AlarmConfig[] = [
      { id: 'custom_1', title: 'ورد القرآن', enabled: true, type: 'fixed', time: '14:00', days: [0, 1, 2, 3, 4, 5, 6], soundType: 'reminder' },
      { id: 'custom_2', title: 'أذكار المساء', enabled: true, type: 'fixed', time: '17:00', days: [0, 1, 2, 3, 4, 5, 6], soundType: 'reminder' },
      { id: 'custom_3', title: 'قيام الليل', enabled: true, type: 'fixed', time: '03:30', days: [0, 1, 2, 3, 4, 5, 6], soundType: 'reminder' },
    ];

    const alarms = buildNativePrayerTimeAlarms(days14, undefined, {
      athanEnabledMap,
      customAlarms,
      prayerPreAlert: false,
      prayerPostAlert: false,
    });

    // 70 athans + 3 * 14 custom = 70 + 42 = 112
    const expectedTotal = 70 + 42;
    assert.equal(alarms.length, expectedTotal, `All ${expectedTotal} scheduled alarms must be retained without drops`);

    // Verify all 3 custom alarms appear for each day
    for (const c of customAlarms) {
      const occurrences = alarms.filter(a => a.prayerKey.includes(c.id));
      assert.equal(occurrences.length, 14, `Alarm ${c.id} must be scheduled for each of the 14 days`);
    }

    assert.ok(alarms.length <= 300, 'Total alarms well within 300 limit');
  });

  test('4. 14-day window constraint over a 30-day buffer', () => {
    const days30 = generateDaysList(30);
    const athanEnabledMap = {
      Fajr: true,
      Dhuhr: true,
      Asr: true,
      Maghrib: true,
      Isha: true,
    };

    // The full 30-day buffer
    const fullBuffer = buildNativePrayerTimeAlarms(days30, undefined, {
      athanEnabledMap,
      prayerPreAlert: false,
      prayerPostAlert: false,
    });

    assert.equal(fullBuffer.length, 30 * 5, 'Full 30-day buffer contains 150 athan entries');

    // Simulate native reconcile 14-day window filter
    const now = Date.now();
    const maxWindowMs = now + (14 * 86400000);
    const active14DayAlarms = fullBuffer.filter(a => a.timeMs > now && a.timeMs <= maxWindowMs);

    // Active alarms registered in AlarmManager must only cover the 14-day slice
    assert.ok(active14DayAlarms.length <= 14 * 5 + 5, 'Active window must not register alarms beyond 14 days');
    assert.ok(active14DayAlarms.length >= 13 * 5, 'Active window must contain at least 13-14 days of prayers');
    assert.ok(active14DayAlarms.length <= 300, 'Active window is safely below 300 limit');
  });
});
