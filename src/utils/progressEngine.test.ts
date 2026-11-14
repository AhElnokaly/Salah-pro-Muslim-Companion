import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateUnifiedProgress } from './progressEngine';
import { formatDateKey } from './prayerDayBoundary';
import type { PrayerLog, VoluntaryPrayerLog } from '../types';

describe('progressEngine — Sunnah & Rawatib calculation', () => {
  const todayKey = formatDateKey(new Date());

  const findSunnah = (result: ReturnType<typeof calculateUnifiedProgress>['daily']) => {
    const item = result.items.find((i) => i.id === 'sunnah');
    assert.ok(item, 'sunnah item must exist');
    return item;
  };

  test('1. Full 12 Rawatib rakahs equals 100% and displays target', () => {
    const prayerLogs: Record<string, Record<string, PrayerLog>> = {
      [todayKey]: {
        Fajr: { status: 'A', sunnahBefore: 2, sunnahAfter: 0 },
        Dhuhr: { status: 'A', sunnahBefore: 4, sunnahAfter: 2 },
        Asr: { status: 'A', sunnahBefore: 0, sunnahAfter: 0 },
        Maghrib: { status: 'A', sunnahBefore: 0, sunnahAfter: 2 },
        Isha: { status: 'A', sunnahBefore: 0, sunnahAfter: 2 },
      },
    };

    const res = calculateUnifiedProgress({
      prayerLogs,
      fastingLogs: {},
      dhikrLogs: {},
      voluntaryPrayerLogs: [],
    });

    const sunnah = findSunnah(res.daily);
    assert.equal(sunnah.onTimeValue, 12);
    assert.equal(sunnah.percentage, 100);
    assert.equal(sunnah.detailText, '12 من 12 ركعة');
  });

  test('2. Partial Rawatib (even without obligatory status A) counts accurately', () => {
    const prayerLogs: Record<string, Record<string, PrayerLog>> = {
      [todayKey]: {
        Fajr: { status: 'not_yet', sunnahBefore: 2 },
        Dhuhr: { status: 'B', sunnahBefore: 2 },
      },
    };

    const res = calculateUnifiedProgress({
      prayerLogs,
      fastingLogs: {},
      dhikrLogs: {},
    });

    const sunnah = findSunnah(res.daily);
    assert.equal(sunnah.onTimeValue, 4);
    assert.equal(sunnah.percentage, 33);
    assert.equal(sunnah.detailText, '4 من 12 ركعة');
  });

  test('3. No sunnah logged returns 0% and 0 من 12 ركعة', () => {
    const res = calculateUnifiedProgress({
      prayerLogs: {},
      fastingLogs: {},
      dhikrLogs: {},
      voluntaryPrayerLogs: [],
    });

    const sunnah = findSunnah(res.daily);
    assert.equal(sunnah.onTimeValue, 0);
    assert.equal(sunnah.percentage, 0);
    assert.equal(sunnah.detailText, '0 من 12 ركعة');
  });

  test('4. Exceeding 12 rakahs (>100%) is uncapped on sunnah item while overall caps each item at 100%', () => {
    const prayerLogs: Record<string, Record<string, PrayerLog>> = {
      [todayKey]: {
        Fajr: { status: 'A', sunnahBefore: 2 },
        Dhuhr: { status: 'A', sunnahBefore: 4, sunnahAfter: 2 },
        Asr: { status: 'A' },
        Maghrib: { status: 'A', sunnahAfter: 2 },
        Isha: { status: 'A', sunnahAfter: 2 },
      },
    };
    const voluntaryPrayerLogs: VoluntaryPrayerLog[] = [
      { id: 'v1', appPrayerDay: todayKey, type: 'duha', rakaat: 4 },
      { id: 'v2', appPrayerDay: todayKey, type: 'shafi', rakaat: 2 },
      { id: 'v3', appPrayerDay: todayKey, type: 'witr', rakaat: 1 },
    ];

    // Total sunnah = 12 + 4 + 2 + 1 = 19 rakahs => Math.round(19/12 * 100) = 158%
    const res = calculateUnifiedProgress({
      prayerLogs,
      fastingLogs: { [todayKey]: { date: todayKey, fasted: true, fastType: 'Sunnah' } },
      dhikrLogs: { [todayKey]: { morning: 100 } },
      quranSessions: [{ id: 'q1', date: todayKey, sessionType: 'read', unitType: 'pages', unitValue: 4 }],
      voluntaryPrayerLogs,
    });

    const sunnah = findSunnah(res.daily);
    assert.equal(sunnah.onTimeValue, 19);
    assert.equal(sunnah.percentage, 158);
    assert.equal(sunnah.detailText, '19 من 12 ركعة');
    // All 5 items are >= 100%, overall caps each at 100% => average must be 100%, not 112%
    assert.equal(res.daily.overallPercentage, 100);
  });

  test('5. No double counting when duha/qiyam/witr exist in both prayerLogs and voluntaryPrayerLogs, while shafi/taraweeh still count', () => {
    const prayerLogs: Record<string, Record<string, PrayerLog>> = {
      [todayKey]: {
        Duha: { status: 'A', extraRakahs: 4 },
        Qiyam: { status: 'A', extraRakahs: 2 },
        Witr: { status: 'A', extraRakahs: 1 },
      },
    };
    const voluntaryPrayerLogs: VoluntaryPrayerLog[] = [
      { id: 'v1', appPrayerDay: todayKey, type: 'duha', rakaat: 4 },
      { id: 'v2', appPrayerDay: todayKey, type: 'qiyam', rakaat: 2 },
      { id: 'v3', appPrayerDay: todayKey, type: 'witr', rakaat: 1 },
      { id: 'v4', appPrayerDay: todayKey, type: 'shafi', rakaat: 2 },
      { id: 'v5', appPrayerDay: todayKey, type: 'taraweeh', rakaat: 8 },
    ];

    // 4 + 2 + 1 + 2 + 8 = 17 (NOT 24)
    const res = calculateUnifiedProgress({
      prayerLogs,
      fastingLogs: {},
      dhikrLogs: {},
      voluntaryPrayerLogs,
    });

    const sunnah = findSunnah(res.daily);
    assert.equal(sunnah.onTimeValue, 17);
    assert.equal(sunnah.percentage, 142);
    assert.equal(sunnah.detailText, '17 من 12 ركعة');
  });

  test('6. Case-insensitive type matching prevents double counting across mixed casing', () => {
    const prayerLogs: Record<string, Record<string, PrayerLog>> = {
      [todayKey]: {
        DUHA: { status: 'A', extraRakahs: 4 },
        qiyam: { status: 'A', extraRakahs: 2 },
        WiTr: { status: 'A', extraRakahs: 3 },
      },
    };
    const voluntaryPrayerLogs: VoluntaryPrayerLog[] = [
      { id: 'c1', appPrayerDay: todayKey, type: 'duha', rakaat: 4 },
      { id: 'c2', appPrayerDay: todayKey, type: 'Qiyam' as any, rakaat: 2 },
      { id: 'c3', appPrayerDay: todayKey, type: 'witr', rakaat: 3 },
    ];

    // 4 + 2 + 3 = 9 (no double counting despite case differences)
    const res = calculateUnifiedProgress({
      prayerLogs,
      fastingLogs: {},
      dhikrLogs: {},
      voluntaryPrayerLogs,
    });

    const sunnah = findSunnah(res.daily);
    assert.equal(sunnah.onTimeValue, 9);
    assert.equal(sunnah.percentage, 75);
    assert.equal(sunnah.detailText, '9 من 12 ركعة');
  });

  test('7. Missing/malformed/negative fields do not crash and safely yield 0%', () => {
    const res = calculateUnifiedProgress({
      prayerLogs: {
        [todayKey]: {
          Fajr: { status: 'not_yet', sunnahBefore: undefined, sunnahAfter: -4 },
          Dhuhr: { status: 'A', sunnahBefore: Number.NaN },
        },
      },
      fastingLogs: {},
      dhikrLogs: {},
      voluntaryPrayerLogs: undefined,
    });

    const sunnah = findSunnah(res.daily);
    assert.equal(sunnah.onTimeValue, 0);
    assert.equal(sunnah.percentage, 0);
    assert.equal(sunnah.detailText, '0 من 12 ركعة');
  });

  test('8. Regression check: salah, dhikr, fasting, and quran retain identical calculation and unchanged detailText strings', () => {
    const res = calculateUnifiedProgress({
      prayerLogs: {
        [todayKey]: {
          Fajr: { status: 'A' },
          Dhuhr: { status: 'A' },
          Asr: { status: 'B' },
        },
      },
      fastingLogs: {
        [todayKey]: { date: todayKey, fasted: true, fastType: 'Sunnah' },
      },
      dhikrLogs: {
        [todayKey]: { morning: 50 },
      },
      quranSessions: [
        { id: 'q1', date: todayKey, sessionType: 'read', unitType: 'pages', unitValue: 4 },
      ],
    });

    const byId = Object.fromEntries(res.daily.items.map((i) => [i.id, i]));
    assert.equal(byId.salah.percentage, 60);
    assert.equal(byId.salah.detailText, '3/5 صلاة');

    assert.equal(byId.dhikr.percentage, 50);
    assert.equal(byId.dhikr.detailText, '50 ذكر وتسبيح');

    assert.equal(byId.fasting.percentage, 100);
    assert.equal(byId.fasting.detailText, '1 يوم صيام');

    assert.equal(byId.quran.percentage, 100);
    assert.equal(byId.quran.detailText, '4 صفحة مقروءة');
  });
});
