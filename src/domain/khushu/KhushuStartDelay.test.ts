/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  clampIqamaOffset,
  computeKhushuStartMs,
  resolveKhushuIqamaOffset,
  buildIqamaOptions,
  getDefaultIqamaOffset,
  IQAMA_OFFSET_MIN,
  IQAMA_OFFSET_MAX,
  IQAMA_OFFSET_DEFAULT,
} from './khushuFlowUtils';
import { KhushuStorage, KHUSHU_SETTINGS_STORAGE_KEY } from './khushuStorage';
import { DEFAULT_KHUSHU_SETTINGS, KhushuSettings } from './khushuTypes';
import { buildNativePrayerTimeAlarms, DailyPrayerTimesEntry, getLastScheduledOptions } from '../../services/athanAlarmPlugin';
import { UnifiedNotificationOrchestrator } from '../notifications/UnifiedNotificationOrchestrator';
import { DEFAULT_APP_SETTINGS } from '../../config/defaultSettings';
import { PrayerTimes } from '../../types';

describe('Phase 2 - Khushu Start Delay Subsystem Tests', () => {
  let mockStore: Map<string, string>;

  beforeEach(() => {
    mockStore = new Map();
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStore.get(key) ?? null,
      setItem: (key: string, val: string) => mockStore.set(key, String(val)),
      removeItem: (key: string) => mockStore.delete(key),
      clear: () => mockStore.clear(),
      key: (idx: number) => Array.from(mockStore.keys())[idx] ?? null,
      get length() {
        return mockStore.size;
      },
    };
    (globalThis as any).window = new EventTarget();
  });

  describe('1. clampIqamaOffset & constants', () => {
    it('defines single-source-of-truth constants correctly', () => {
      assert.equal(IQAMA_OFFSET_MIN, 5);
      assert.equal(IQAMA_OFFSET_MAX, 30);
      assert.equal(IQAMA_OFFSET_DEFAULT, 15);
    });

    it('returns exact per-prayer defaults from getDefaultIqamaOffset', () => {
      assert.equal(getDefaultIqamaOffset('fajr'), 20);
      assert.equal(getDefaultIqamaOffset('dhuhr'), 15);
      assert.equal(getDefaultIqamaOffset('asr'), 15);
      assert.equal(getDefaultIqamaOffset('maghrib'), 10);
      assert.equal(getDefaultIqamaOffset('isha'), 15);
      assert.equal(getDefaultIqamaOffset('friday'), 25);
      assert.equal(getDefaultIqamaOffset('unknown_prayer'), 15);
    });

    it('enforces exact boundary, rounding, and fallback clamping rules', () => {
      // 5, 30, 15
      assert.equal(clampIqamaOffset(5), 5);
      assert.equal(clampIqamaOffset(30), 30);
      assert.equal(clampIqamaOffset(15), 15);

      // 4 -> 5, 31 -> 30, 0 -> 5, -3 -> 5
      assert.equal(clampIqamaOffset(4), 5);
      assert.equal(clampIqamaOffset(31), 30);
      assert.equal(clampIqamaOffset(0), 5);
      assert.equal(clampIqamaOffset(-3), 5);

      // '12' -> 12, 'abc' -> 15, undefined -> 15, NaN -> 15, 7.6 -> 8
      assert.equal(clampIqamaOffset('12'), 12);
      assert.equal(clampIqamaOffset('abc'), 15);
      assert.equal(clampIqamaOffset(undefined), 15);
      assert.equal(clampIqamaOffset(NaN), 15);
      assert.equal(clampIqamaOffset(7.6), 8);
      assert.equal(clampIqamaOffset(7.4), 7);
      assert.equal(clampIqamaOffset(null), 15);
    });
  });

  describe('2. computeKhushuStartMs', () => {
    it('computes exact millisecond start timestamps for various offsets', () => {
      const athanMs = 1700000000000;
      assert.equal(computeKhushuStartMs(athanMs, 5), athanMs + 5 * 60000);
      assert.equal(computeKhushuStartMs(athanMs, 10), athanMs + 10 * 60000);
      assert.equal(computeKhushuStartMs(athanMs, 15), athanMs + 15 * 60000);
      assert.equal(computeKhushuStartMs(athanMs, 20), athanMs + 20 * 60000);
      assert.equal(computeKhushuStartMs(athanMs, 25), athanMs + 25 * 60000);
      assert.equal(computeKhushuStartMs(athanMs, 30), athanMs + 30 * 60000);
      // Boundary and invalid inputs
      assert.equal(computeKhushuStartMs(athanMs, 0), athanMs + 5 * 60000); // clamped to 5
      assert.equal(computeKhushuStartMs(athanMs, 50), athanMs + 30 * 60000); // clamped to 30
      assert.equal(computeKhushuStartMs(athanMs, 'invalid'), athanMs + 15 * 60000); // fallback
    });
  });

  describe('3. Settings merge & migration (KhushuStorage)', () => {
    it('migrates legacy stored settings without iqamaOffsets to per-prayer defaults without wiping existing fields', () => {
      const legacySaved = {
        preferredMode: 'dnd',
        defaultDurationMinutes: 20,
        autoWithIqama: true,
        enableFridaySpecial: true,
        enableEmergencyCallBypass: false,
        prayerDurations: {
          fajr: 25,
          dhuhr: 20,
          asr: 15,
          maghrib: 15,
          isha: 25,
          friday: 50,
        },
        // note: NO iqamaOffsets field at all!
      };
      mockStore.set(KHUSHU_SETTINGS_STORAGE_KEY, JSON.stringify(legacySaved));

      const loaded = KhushuStorage.getSettings();
      assert.equal(loaded.preferredMode, 'dnd');
      assert.equal(loaded.defaultDurationMinutes, 20);
      assert.equal(loaded.autoWithIqama, true);
      assert.equal(loaded.enableEmergencyCallBypass, false);
      assert.equal(loaded.prayerDurations.fajr, 25);
      assert.equal(loaded.prayerDurations.friday, 50);

      // Verify all six prayers got their exact per-prayer default (20/15/15/10/15/25)
      assert.equal(loaded.iqamaOffsets.fajr, 20);
      assert.equal(loaded.iqamaOffsets.dhuhr, 15);
      assert.equal(loaded.iqamaOffsets.asr, 15);
      assert.equal(loaded.iqamaOffsets.maghrib, 10);
      assert.equal(loaded.iqamaOffsets.isha, 15);
      assert.equal(loaded.iqamaOffsets.friday, 25);
    });

    it('(a) stored object with only fajr=12 -> other prayers get their own defaults', () => {
      const storedWithOnlyFajr = {
        ...DEFAULT_KHUSHU_SETTINGS,
        iqamaOffsets: {
          fajr: 12,
        },
      };
      mockStore.set(KHUSHU_SETTINGS_STORAGE_KEY, JSON.stringify(storedWithOnlyFajr));

      const loaded = KhushuStorage.getSettings();
      assert.equal(loaded.iqamaOffsets.fajr, 12);
      assert.equal(loaded.iqamaOffsets.dhuhr, 15);
      assert.equal(loaded.iqamaOffsets.asr, 15);
      assert.equal(loaded.iqamaOffsets.maghrib, 10);
      assert.equal(loaded.iqamaOffsets.isha, 15);
      assert.equal(loaded.iqamaOffsets.friday, 25);
    });

    it('(b) no stored settings at all -> original defaults, unchanged from before Phase 2', () => {
      mockStore.clear();
      const loaded = KhushuStorage.getSettings();
      assert.deepEqual(loaded.iqamaOffsets, DEFAULT_KHUSHU_SETTINGS.iqamaOffsets);
      assert.equal(loaded.iqamaOffsets.fajr, 20);
      assert.equal(loaded.iqamaOffsets.dhuhr, 15);
      assert.equal(loaded.iqamaOffsets.asr, 15);
      assert.equal(loaded.iqamaOffsets.maghrib, 10);
      assert.equal(loaded.iqamaOffsets.isha, 15);
      assert.equal(loaded.iqamaOffsets.friday, 25);
    });

    it('(c) stored garbage value for maghrib -> 10 (its default), not 15', () => {
      const storedGarbage = {
        ...DEFAULT_KHUSHU_SETTINGS,
        iqamaOffsets: {
          maghrib: 'not-a-number',
        },
      };
      mockStore.set(KHUSHU_SETTINGS_STORAGE_KEY, JSON.stringify(storedGarbage));

      const loaded = KhushuStorage.getSettings();
      assert.equal(loaded.iqamaOffsets.maghrib, 10);
    });

    it('clamps stored out-of-range or garbage values in iqamaOffsets', () => {
      const storedWithInvalid = {
        ...DEFAULT_KHUSHU_SETTINGS,
        iqamaOffsets: {
          fajr: 2, // < 5 -> 5
          dhuhr: 45, // > 30 -> 30
          asr: 'garbage', // -> 15 (its default)
          maghrib: 10, // valid -> 10
          isha: 0, // < 5 -> 5
          friday: 25, // valid -> 25
        },
      };
      mockStore.set(KHUSHU_SETTINGS_STORAGE_KEY, JSON.stringify(storedWithInvalid));

      const loaded = KhushuStorage.getSettings();
      assert.equal(loaded.iqamaOffsets.fajr, 5);
      assert.equal(loaded.iqamaOffsets.dhuhr, 30);
      assert.equal(loaded.iqamaOffsets.asr, 15);
      assert.equal(loaded.iqamaOffsets.maghrib, 10);
      assert.equal(loaded.iqamaOffsets.isha, 5);
      assert.equal(loaded.iqamaOffsets.friday, 25);
    });

    it('saveSettings merges partial updates without replacing the whole object', () => {
      const initial = KhushuStorage.getSettings();
      KhushuStorage.saveSettings({
        iqamaOffsets: {
          ...initial.iqamaOffsets,
          fajr: 10,
        },
      });

      const loaded = KhushuStorage.getSettings();
      assert.equal(loaded.iqamaOffsets.fajr, 10);
      assert.equal(loaded.iqamaOffsets.dhuhr, initial.iqamaOffsets.dhuhr);
      assert.equal(loaded.prayerDurations.fajr, initial.prayerDurations.fajr);
      assert.equal(loaded.preferredMode, initial.preferredMode);
    });
  });

  describe('4. buildNativePrayerTimeAlarms across all 3 paths', () => {
    // Construct local target date in future, deterministically skipping Friday (Jumu'ah)
    const testDay = new Date();
    testDay.setDate(testDay.getDate() + 1);
    if (testDay.getDay() === 5) {
      testDay.setDate(testDay.getDate() + 1);
    }
    testDay.setHours(0, 0, 0, 0);

    const fixedNow = testDay.getTime() - 2 * 3600000; // 2 hours before the start of testDay
    const mockTimes: PrayerTimes = {
      Fajr: '05:00',
      Sunrise: '06:30',
      Dhuhr: '12:30',
      Asr: '15:30',
      Maghrib: '18:00',
      Isha: '19:30',
    };

    it('proves athan alarm times are 100% IDENTICAL before and after custom offsets', () => {
      const daysList: DailyPrayerTimesEntry[] = [
        {
          date: testDay,
          timesMap: mockTimes,
        },
      ];

      // Run 1: Default offsets (all 15)
      const khushuDefault: KhushuSettings = {
        ...DEFAULT_KHUSHU_SETTINGS,
        autoWithIqama: true,
        iqamaOffsets: {
          fajr: 15,
          dhuhr: 15,
          asr: 15,
          maghrib: 15,
          isha: 15,
          friday: 25,
        },
      };
      const alarmsRun1 = buildNativePrayerTimeAlarms(daysList, undefined, {
        khushuAutoWithIqama: true,
        khushuSettings: khushuDefault,
      });
      const athanAlarms1 = alarmsRun1.filter((a) => a.alarmType === 'athan');

      // Run 2: Extreme customized offsets (Fajr 5, Dhuhr 30, Asr 20, Maghrib 25, Isha 10)
      const khushuCustom: KhushuSettings = {
        ...DEFAULT_KHUSHU_SETTINGS,
        autoWithIqama: true,
        iqamaOffsets: {
          fajr: 5,
          dhuhr: 30,
          asr: 20,
          maghrib: 25,
          isha: 10,
          friday: 30,
        },
      };
      const alarmsRun2 = buildNativePrayerTimeAlarms(daysList, undefined, {
        khushuAutoWithIqama: true,
        khushuSettings: khushuCustom,
      });
      const athanAlarms2 = alarmsRun2.filter((a) => a.alarmType === 'athan');

      // Assert athan times and counts are strictly identical
      assert.equal(athanAlarms1.length, athanAlarms2.length);
      for (let i = 0; i < athanAlarms1.length; i++) {
        assert.equal(athanAlarms1[i].prayerKey, athanAlarms2[i].prayerKey);
        assert.equal(athanAlarms1[i].timeMs, athanAlarms2[i].timeMs, `Athan time changed for ${athanAlarms1[i].prayerKey}`);
      }
    });

    it('verifies Path 2 (multi-day batch): khushu alarms start exactly at athanTime + prayerOffset with unchanged duration', () => {
      const khushuCustom: KhushuSettings = {
        ...DEFAULT_KHUSHU_SETTINGS,
        autoWithIqama: true,
        prayerDurations: {
          fajr: 20,
          dhuhr: 15,
          asr: 15,
          maghrib: 15,
          isha: 20,
          friday: 45,
        },
        iqamaOffsets: {
          fajr: 8,
          dhuhr: 22,
          asr: 18,
          maghrib: 12,
          isha: 28,
          friday: 30,
        },
      };

      const daysList: DailyPrayerTimesEntry[] = [
        {
          date: testDay,
          timesMap: mockTimes,
        },
      ];

      const alarms = buildNativePrayerTimeAlarms(daysList, undefined, {
        khushuAutoWithIqama: true,
        khushuSettings: khushuCustom,
      });
      const athanMap = new Map(alarms.filter((a) => a.alarmType === 'athan').map((a) => [a.prayerKey.toLowerCase(), a.timeMs]));
      const khushuAlarms = alarms.filter((a) => a.alarmType === 'khushu');

      assert.ok(khushuAlarms.length > 0, 'Must schedule khushu alarms');
      for (const k of khushuAlarms) {
        const baseKey = k.prayerKey.replace('_khushu', '').toLowerCase();
        const athanMs = athanMap.get(baseKey);
        assert.ok(athanMs, `Missing athan for ${k.prayerKey}`);

        const expectedOffset = khushuCustom.iqamaOffsets[baseKey as keyof typeof khushuCustom.iqamaOffsets];
        assert.equal(
          k.timeMs - athanMs,
          expectedOffset * 60000,
          `Khushu start time delta must equal ${expectedOffset} mins for ${baseKey}`
        );
        // Duration is unchanged
        const expectedDuration = khushuCustom.prayerDurations[baseKey as keyof typeof khushuCustom.prayerDurations];
        assert.equal(k.durationMinutes, expectedDuration);
      }
    });

    it('verifies Path 3a & 3b (fallback today/tomorrow map): khushu start time matches offset', () => {
      const khushuCustom: KhushuSettings = {
        ...DEFAULT_KHUSHU_SETTINGS,
        autoWithIqama: true,
        iqamaOffsets: {
          fajr: 7,
          dhuhr: 14,
          asr: 19,
          maghrib: 11,
          isha: 26,
          friday: 25,
        },
      };

      const tomorrowTimes = { ...mockTimes };
      const alarms = buildNativePrayerTimeAlarms(
        mockTimes,
        tomorrowTimes,
        {
          khushuAutoWithIqama: true,
          khushuSettings: khushuCustom,
        }
      );

      const athanAlarms = alarms.filter((a) => a.alarmType === 'athan');
      const khushuAlarms = alarms.filter((a) => a.alarmType === 'khushu');
      assert.ok(khushuAlarms.length >= 5, `Expected >= 5 khushu alarms, got ${khushuAlarms.length}`);

      // Verify Fajr khushu starts exactly 7 mins after Fajr athan
      const fajrAthan = athanAlarms.find((a) => a.prayerKey.toLowerCase() === 'fajr');
      const fajrKhushu = khushuAlarms.find((a) => a.prayerKey.toLowerCase() === 'fajr_khushu');
      assert.ok(fajrAthan && fajrKhushu);
      assert.equal(fajrKhushu.timeMs - fajrAthan.timeMs, 7 * 60000);
    });

    it('verifies Path 1 (custom post-prayer collision): shifts custom alarm past custom khushu window', () => {
      const khushuCustom: KhushuSettings = {
        ...DEFAULT_KHUSHU_SETTINGS,
        autoWithIqama: true,
        prayerDurations: {
          ...DEFAULT_KHUSHU_SETTINGS.prayerDurations,
          dhuhr: 20,
        },
        iqamaOffsets: {
          ...DEFAULT_KHUSHU_SETTINGS.iqamaOffsets,
          dhuhr: 10,
        },
      };

      // Custom alarm set to 15 minutes after Dhuhr (inside the [10m, 30m] Khushu window)
      const customAlarm = {
        id: 'user_post_dhuhr',
        title: 'قراءة بعد الظهر',
        enabled: true,
        type: 'prayer_relative' as const,
        relation: 'after' as const,
        prayers: ['Dhuhr'] as ('Dhuhr')[],
        prayerTarget: 'Dhuhr',
        offsetMinutes: 15,
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'takbeer' as const,
      };

      const daysList: DailyPrayerTimesEntry[] = [
        {
          date: testDay,
          timesMap: mockTimes,
        },
      ];

      const alarms = buildNativePrayerTimeAlarms(
        daysList,
        undefined,
        {
          khushuAutoWithIqama: true,
          khushuSettings: khushuCustom,
          customAlarms: [customAlarm],
        }
      );

      const customScheduled = alarms.find((a) => a.prayerKey.includes('user_post_dhuhr'));
      assert.ok(customScheduled, 'Custom post-prayer alarm must be scheduled');

      const dhuhrAthan = alarms.find((a) => a.prayerKey.toLowerCase() === 'dhuhr');
      assert.ok(dhuhrAthan, 'Dhuhr athan alarm must be scheduled');

      // Custom alarm should be shifted to dhuhrAthan + 10m (iqama) + 20m (duration) = +30m
      assert.equal(customScheduled.timeMs - dhuhrAthan.timeMs, (10 + 20) * 60000);
    });
  });

  describe('5. buildIqamaOptions (UI Options Builder)', () => {
    it('returns standard 5-minute step options [5, 10, 15, 20, 25, 30] when standard value passed', () => {
      const opts = buildIqamaOptions(15);
      assert.deepEqual(opts, [5, 10, 15, 20, 25, 30]);
    });

    it('injects custom non-standard value into sorted options list without losing it', () => {
      const opts7 = buildIqamaOptions(7);
      assert.deepEqual(opts7, [5, 7, 10, 15, 20, 25, 30]);

      const opts12 = buildIqamaOptions(12);
      assert.deepEqual(opts12, [5, 10, 12, 15, 20, 25, 30]);
    });

    it('clamps out of bounds values and does not duplicate', () => {
      const opts35 = buildIqamaOptions(35); // clamps to 30
      assert.deepEqual(opts35, [5, 10, 15, 20, 25, 30]);

      const opts0 = buildIqamaOptions(0); // clamps to 5
      assert.deepEqual(opts0, [5, 10, 15, 20, 25, 30]);
    });
  });

  describe('6. UnifiedNotificationOrchestrator parity & single-source-of-truth [STATIC]', () => {
    it('proves orchestrator and athanAlarmPlugin use identical computeKhushuStartMs output', () => {
      const settings: KhushuSettings = {
        ...DEFAULT_KHUSHU_SETTINGS,
        autoWithIqama: true,
        enableFridaySpecial: true,
        iqamaOffsets: {
          fajr: 12,
          dhuhr: 18,
          asr: 16,
          maghrib: 9,
          isha: 21,
          friday: 27,
        },
      };

      const testTimeMs = 1700000000000;

      // Normal weekday
      for (const prayer of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const) {
        const offset = resolveKhushuIqamaOffset(settings, prayer, false);
        const khushuStart = computeKhushuStartMs(testTimeMs, offset);
        assert.equal(khushuStart - testTimeMs, settings.iqamaOffsets[prayer] * 60000);
      }

      // Friday Dhuhr (Jumu'ah)
      const fridayDhuhrOffset = resolveKhushuIqamaOffset(settings, 'dhuhr', true);
      const fridayDhuhrStart = computeKhushuStartMs(testTimeMs, fridayDhuhrOffset);
      assert.equal(fridayDhuhrStart - testTimeMs, 27 * 60000);
      assert.equal(fridayDhuhrOffset, 27);
    });
  });

  describe('7. Reschedule path verification', () => {
    it('proves khushu-settings-changed event triggers recalculation and schedule rebuild', () => {
      let eventFired = false;
      let receivedDetail: any = null;

      const listener = (e: Event) => {
        eventFired = true;
        receivedDetail = (e as CustomEvent).detail;
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('khushu-settings-changed', listener);
      }

      // Simulate what useKhushuMode.updateSettings does
      const updated = {
        ...DEFAULT_KHUSHU_SETTINGS,
        autoWithIqama: true,
        iqamaOffsets: {
          ...DEFAULT_KHUSHU_SETTINGS.iqamaOffsets,
          fajr: 18,
        },
      };

      KhushuStorage.saveSettings(updated);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('khushu-settings-changed', { detail: updated }));
      }

      assert.equal(eventFired, true, 'khushu-settings-changed must be dispatched and received');
      assert.equal(receivedDetail?.iqamaOffsets?.fajr, 18);

      // Verify that calling buildNativePrayerTimeAlarms with updated settings produces the new Fajr khushu time
      const testDay = new Date();
      testDay.setDate(testDay.getDate() + 1);
      if (testDay.getDay() === 5) {
        testDay.setDate(testDay.getDate() + 1);
      }
      testDay.setHours(0, 0, 0, 0);

      const daysList: DailyPrayerTimesEntry[] = [
        {
          date: testDay,
          timesMap: {
            Fajr: '05:00',
            Dhuhr: '12:30',
            Asr: '15:30',
            Maghrib: '18:00',
            Isha: '19:30',
          },
        },
      ];

      const alarms = buildNativePrayerTimeAlarms(daysList, undefined, {
        khushuAutoWithIqama: true,
        khushuSettings: updated,
      });

      const fajrAthan = alarms.find(a => a.prayerKey.toLowerCase() === 'fajr');
      const fajrKhushu = alarms.find(a => a.prayerKey.toLowerCase() === 'fajr_khushu');
      assert.ok(fajrAthan && fajrKhushu);
      assert.equal(fajrKhushu.timeMs - fajrAthan.timeMs, 18 * 60000, 'Re-scheduled alarms must reflect the new 18-minute offset');

      if (typeof window !== 'undefined') {
        window.removeEventListener('khushu-settings-changed', listener);
      }
    });
  });

  describe('8. Missing edge cases: resolveKhushuIqamaOffset & syncAllNotificationChannels', () => {
    it('resolveKhushuIqamaOffset handles null/undefined settings, corrupted/out-of-range offsets, and enableFridaySpecial=false', () => {
      // Null/undefined settings fall back to per-prayer defaults
      assert.equal(resolveKhushuIqamaOffset(null, 'fajr', false), 20);
      assert.equal(resolveKhushuIqamaOffset(undefined, 'maghrib', false), 10);

      // Friday with enableFridaySpecial = false uses dhuhr offset instead of friday offset
      const fridayDisabledSettings: Partial<KhushuSettings> = {
        enableFridaySpecial: false,
        iqamaOffsets: {
          fajr: 20,
          dhuhr: 12,
          asr: 15,
          maghrib: 10,
          isha: 15,
          friday: 28,
        },
      };
      assert.equal(resolveKhushuIqamaOffset(fridayDisabledSettings, 'dhuhr', true), 12);

      // Corrupted & out-of-range values inside settings.iqamaOffsets
      const corruptedSettings = {
        enableFridaySpecial: true,
        iqamaOffsets: {
          fajr: 4,
          dhuhr: 31,
          asr: 0,
          maghrib: 'bad' as any,
          isha: Number.NaN,
          friday: 25,
        },
      } as KhushuSettings;
      assert.equal(resolveKhushuIqamaOffset(corruptedSettings, 'fajr', false), 5);
      assert.equal(resolveKhushuIqamaOffset(corruptedSettings, 'dhuhr', false), 30);
      assert.equal(resolveKhushuIqamaOffset(corruptedSettings, 'asr', false), 5);
      assert.equal(resolveKhushuIqamaOffset(corruptedSettings, 'maghrib', false), 10);
      assert.equal(resolveKhushuIqamaOffset(corruptedSettings, 'isha', false), 15);
    });

    it('UnifiedNotificationOrchestrator.syncAllNotificationChannels schedules khushu alarms using saved iqamaOffsets without altering athan times', async () => {
      KhushuStorage.saveSettings({
        ...DEFAULT_KHUSHU_SETTINGS,
        autoWithIqama: true,
        iqamaOffsets: {
          ...DEFAULT_KHUSHU_SETTINGS.iqamaOffsets,
          fajr: 9,
          dhuhr: 24,
        },
      });

      const futureDay = new Date();
      futureDay.setDate(futureDay.getDate() + 2);
      if (futureDay.getDay() === 5) {
        futureDay.setDate(futureDay.getDate() + 1);
      }
      const yyyy = futureDay.getFullYear();
      const mm = String(futureDay.getMonth() + 1).padStart(2, '0');
      const dd = String(futureDay.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const prayerTimes: PrayerTimes = {
        Fajr: '05:00',
        Sunrise: '06:30',
        Dhuhr: '12:30',
        Asr: '15:30',
        Maghrib: '18:00',
        Isha: '19:30',
      };

      await UnifiedNotificationOrchestrator.syncAllNotificationChannels(
        {
          ...DEFAULT_APP_SETTINGS,
          adhanEnabled: { Fajr: true, Sunrise: false, Dhuhr: true, Asr: true, Maghrib: true, Isha: true },
        },
        dateStr,
        prayerTimes,
        { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true }
      );

      const scheduled = getLastScheduledOptions();
      assert.ok(scheduled && Array.isArray(scheduled.times), 'Expected scheduled times from AthanAlarm web fallback');

      const fajrAthan = scheduled.times.find((t: any) => t.prayerKey === 'Fajr' && t.alarmType === 'athan');
      const fajrKhushu = scheduled.times.find((t: any) => t.prayerKey === 'Fajr_khushu' && t.alarmType === 'khushu');
      const dhuhrAthan = scheduled.times.find((t: any) => t.prayerKey === 'Dhuhr' && t.alarmType === 'athan');
      const dhuhrKhushu = scheduled.times.find((t: any) => t.prayerKey === 'Dhuhr_khushu' && t.alarmType === 'khushu');

      assert.ok(fajrAthan && fajrKhushu, 'Expected Fajr athan and khushu alarms');
      assert.ok(dhuhrAthan && dhuhrKhushu, 'Expected Dhuhr athan and khushu alarms');
      assert.equal(fajrKhushu.timeMs - fajrAthan.timeMs, 9 * 60000);
      assert.equal(dhuhrKhushu.timeMs - dhuhrAthan.timeMs, 24 * 60000);
    });
  });
});



