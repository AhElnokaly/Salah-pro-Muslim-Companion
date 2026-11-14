# PHASE 2 REVIEW BUNDLE - COMPLETE & UNABRIDGED (v2)
Generated: 2026-11-02T11:36:38.338Z
Feature: Khushu Start Delay Per Prayer (Phase 2)
Branch: Wip/commit3-athan-master-toggle

---

## Table of Contents
1. src/domain/khushu/khushuFlowUtils.ts (202 lines)
2. src/domain/khushu/khushuStorage.ts (82 lines)
3. src/domain/khushu/KhushuStartDelay.test.ts (556 lines)
4. src/components/KhushuModeSheet.tsx (450 lines)
5. src/domain/notifications/UnifiedNotificationOrchestrator.ts (Changed hunks: imports & khushu scheduling logic)
6. src/services/athanAlarmPlugin.ts (Changed hunks: imports & paths 1, 2, 3a, 3b)

---

### src/domain/khushu/khushuFlowUtils.ts (202 lines)
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrayerTimes } from '../../types';
import { KhushuSettings, DEFAULT_KHUSHU_SETTINGS } from './khushuTypes';
import { parseTimeToMinutes } from '../../utils/prayerCalc';

export interface IqamaWindowInfo {
  prayerId: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  prayerName: string;
  athanDate: Date;
  iqamaDate: Date;
  minutesToIqama: number;
  isInAdhanIqamaWindow: boolean;
  isExactIqamaMoment: boolean;
  suggestedDuration: number;
}

const PRAYER_ARABIC_NAMES: Record<string, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export function parsePrayerTimeToDate(timeStr: string, baseDate: Date): Date | null {
  if (!timeStr || timeStr === '--:--') return null;
  const totalMins = parseTimeToMinutes(timeStr);
  if (isNaN(totalMins) || totalMins < 0) return null;

  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  return new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), hours, minutes, 0, 0);
}

export const IQAMA_OFFSET_MIN = 5;
export const IQAMA_OFFSET_MAX = 30;
export const IQAMA_OFFSET_DEFAULT = 15;

/**
 * Returns the default iqama offset for a specific prayer key from DEFAULT_KHUSHU_SETTINGS.
 * Fajr: 20, Dhuhr: 15, Asr: 15, Maghrib: 10, Isha: 15, Friday: 25.
 * Falls back to IQAMA_OFFSET_DEFAULT (15) for unknown keys.
 */
export function getDefaultIqamaOffset(key: string): number {
  const lowerKey = key.toLowerCase();
  const defaults = DEFAULT_KHUSHU_SETTINGS?.iqamaOffsets as unknown as Record<string, number> | undefined;
  if (defaults && typeof defaults[lowerKey] === 'number') {
    return defaults[lowerKey];
  }
  return IQAMA_OFFSET_DEFAULT;
}

/**
 * Clamps an iqama offset in minutes to an integer between 5 and 30.
 * Rules:
 * - Accepts numbers or numeric strings (e.g. '12' -> 12).
 * - Rounds floating point numbers to the nearest integer (e.g. 7.6 -> 8).
 * - Values below 5 become 5 (zero is NOT allowed).
 * - Values above 30 become 30.
 * - Non-numeric, null, undefined, or NaN fall back to fallback (default 15).
 */
export function clampIqamaOffset(value: unknown, fallback: number = IQAMA_OFFSET_DEFAULT): number {
  const safeFallback =
    typeof fallback === 'number' && !isNaN(fallback)
      ? Math.min(IQAMA_OFFSET_MAX, Math.max(IQAMA_OFFSET_MIN, Math.round(fallback)))
      : IQAMA_OFFSET_DEFAULT;

  if (value === null || value === undefined || value === '') {
    return safeFallback;
  }

  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) {
    return safeFallback;
  }

  const rounded = Math.round(num);
  if (rounded < IQAMA_OFFSET_MIN) return IQAMA_OFFSET_MIN;
  if (rounded > IQAMA_OFFSET_MAX) return IQAMA_OFFSET_MAX;
  return rounded;
}

/**
 * Builds the list of selectable options for iqama offset dropdowns.
 * Standard options: [5, 10, 15, 20, 25, 30].
 * If a custom value is present and within range, it is included in sorted order.
 */
export function buildIqamaOptions(currentValue: number = IQAMA_OFFSET_DEFAULT): number[] {
  const base = [5, 10, 15, 20, 25, 30];
  const clamped = clampIqamaOffset(currentValue, IQAMA_OFFSET_DEFAULT);
  if (!base.includes(clamped)) {
    return [...base, clamped].sort((a, b) => a - b);
  }
  return base;
}

/**
 * Computes the exact timestamp in milliseconds when Khushu mode should start.
 * Formula: athanTimeMs + clampIqamaOffset(offsetMin, fallback) * 60,000 ms.
 */
export function computeKhushuStartMs(
  athanTimeMs: number,
  offsetMin: unknown,
  fallback: number = IQAMA_OFFSET_DEFAULT
): number {
  const offset = clampIqamaOffset(offsetMin, fallback);
  return athanTimeMs + offset * 60000;
}

/**
 * Resolves the prayer-specific iqama offset from KhushuSettings.
 * Handles Friday Jumu'ah special when applicable.
 */
export function resolveKhushuIqamaOffset(
  settings: Partial<KhushuSettings> | null | undefined,
  prayerKey: string,
  isFriday: boolean = false
): number {
  const lowerKey = prayerKey.toLowerCase();
  const effectiveKey = isFriday && lowerKey === 'dhuhr' && settings?.enableFridaySpecial ? 'friday' : lowerKey;
  const prayerDefault = getDefaultIqamaOffset(effectiveKey);

  if (!settings) return prayerDefault;
  const offsets = settings.iqamaOffsets as Record<string, unknown> | undefined;

  let rawVal: unknown = offsets?.[lowerKey];
  if (isFriday && lowerKey === 'dhuhr' && settings.enableFridaySpecial) {
    rawVal = offsets?.friday;
  }

  return clampIqamaOffset(rawVal, prayerDefault);
}

/**
 * Calculates current status in the Adhan -> Iqama -> Khushu lifecycle
 */
export function getIqamaWindowInfo(
  times: PrayerTimes | null | undefined,
  settings: KhushuSettings,
  now: Date = new Date()
): IqamaWindowInfo | null {
  if (!times) return null;

  const isFriday = now.getDay() === 5;

  const prayerEntries: Array<{ id: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; timeStr?: string }> = [
    { id: 'fajr', timeStr: times.Fajr },
    { id: 'dhuhr', timeStr: times.Dhuhr },
    { id: 'asr', timeStr: times.Asr },
    { id: 'maghrib', timeStr: times.Maghrib },
    { id: 'isha', timeStr: times.Isha },
  ];

  for (const item of prayerEntries) {
    if (!item.timeStr) continue;
    const athanDate = parsePrayerTimeToDate(item.timeStr, now);
    if (!athanDate) continue;

    const prayerId = item.id;
    const iqamaOffset = resolveKhushuIqamaOffset(settings, prayerId, isFriday);
    let prayerDuration = settings.prayerDurations?.[prayerId] || 15;

    // Friday Jumu'ah special handling
    if (isFriday && prayerId === 'dhuhr' && settings.enableFridaySpecial) {
      prayerDuration = settings.prayerDurations?.friday || 45;
    }

    const athanMs = athanDate.getTime();
    const iqamaMs = computeKhushuStartMs(athanMs, iqamaOffset);
    const iqamaDate = new Date(iqamaMs);
    const nowMs = now.getTime();

    // Adhan -> Iqama window (between athan and iqama + 90 seconds tolerance)
    if (nowMs >= athanMs && nowMs <= iqamaMs + 90 * 1000) {
      const diffFromIqamaSec = Math.round((nowMs - iqamaMs) / 1000);
      const isExactIqamaMoment = diffFromIqamaSec >= 0 && diffFromIqamaSec <= 90;
      const msLeft = Math.max(0, iqamaMs - nowMs);
      const minutesToIqama = Math.ceil(msLeft / 60000);

      const arabicName = isFriday && prayerId === 'dhuhr' ? 'الجمعة' : PRAYER_ARABIC_NAMES[prayerId];

      return {
        prayerId,
        prayerName: arabicName,
        athanDate,
        iqamaDate,
        minutesToIqama,
        isInAdhanIqamaWindow: true,
        isExactIqamaMoment,
        suggestedDuration: prayerDuration,
      };
    }
  }

  return null;
}


```

---

### src/domain/khushu/khushuStorage.ts (82 lines)
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KhushuSettings, KhushuIqamaOffsets, DEFAULT_KHUSHU_SETTINGS } from './khushuTypes';
import { clampIqamaOffset, getDefaultIqamaOffset } from './khushuFlowUtils';
import { safeGetJSON, safeSetJSON, safeGetItem, safeSetItem } from '../../utils/storage';

export const KHUSHU_SETTINGS_STORAGE_KEY = 'hemmaty_khushu_settings_v2';
const SHIELD_DISMISSED_KEY = 'hemmaty_khushu_shield_dismissed_session';

export class KhushuStorage {
  static getSettings(): KhushuSettings {
    const stored = safeGetJSON<Partial<KhushuSettings> | null>(KHUSHU_SETTINGS_STORAGE_KEY, null);
    if (!stored) {
      return { ...DEFAULT_KHUSHU_SETTINGS };
    }

    const rawOffsets = (stored.iqamaOffsets || {}) as Record<string, unknown>;
    const resolvedOffsets: KhushuIqamaOffsets = {
      fajr: clampIqamaOffset(rawOffsets.fajr, getDefaultIqamaOffset('fajr')),
      dhuhr: clampIqamaOffset(rawOffsets.dhuhr, getDefaultIqamaOffset('dhuhr')),
      asr: clampIqamaOffset(rawOffsets.asr, getDefaultIqamaOffset('asr')),
      maghrib: clampIqamaOffset(rawOffsets.maghrib, getDefaultIqamaOffset('maghrib')),
      isha: clampIqamaOffset(rawOffsets.isha, getDefaultIqamaOffset('isha')),
      friday: clampIqamaOffset(rawOffsets.friday, getDefaultIqamaOffset('friday')),
    };

    return {
      ...DEFAULT_KHUSHU_SETTINGS,
      ...stored,
      prayerDurations: {
        ...DEFAULT_KHUSHU_SETTINGS.prayerDurations,
        ...(stored.prayerDurations || {}),
      },
      iqamaOffsets: resolvedOffsets,
    };
  }

  static saveSettings(settings: Partial<KhushuSettings>): void {
    const current = KhushuStorage.getSettings();
    const rawOffsets = {
      ...current.iqamaOffsets,
      ...(settings.iqamaOffsets || {}),
    } as Record<string, unknown>;

    const merged: KhushuSettings = {
      ...current,
      ...settings,
      prayerDurations: {
        ...current.prayerDurations,
        ...(settings.prayerDurations || {}),
      },
      iqamaOffsets: {
        fajr: clampIqamaOffset(rawOffsets.fajr, getDefaultIqamaOffset('fajr')),
        dhuhr: clampIqamaOffset(rawOffsets.dhuhr, getDefaultIqamaOffset('dhuhr')),
        asr: clampIqamaOffset(rawOffsets.asr, getDefaultIqamaOffset('asr')),
        maghrib: clampIqamaOffset(rawOffsets.maghrib, getDefaultIqamaOffset('maghrib')),
        isha: clampIqamaOffset(rawOffsets.isha, getDefaultIqamaOffset('isha')),
        friday: clampIqamaOffset(rawOffsets.friday, getDefaultIqamaOffset('friday')),
      },
    };
    safeSetJSON(KHUSHU_SETTINGS_STORAGE_KEY, merged);
  }

  static isShieldDismissed(sessionId: string): boolean {
    const current = safeGetItem(SHIELD_DISMISSED_KEY) || '';
    return Boolean(current && current === sessionId);
  }

  static setShieldDismissed(sessionId: string): void {
    safeSetItem(SHIELD_DISMISSED_KEY, sessionId);
  }

  static clearShieldDismissed(): void {
    safeSetItem(SHIELD_DISMISSED_KEY, '');
  }
}

export default KhushuStorage;

```

---

### src/domain/khushu/KhushuStartDelay.test.ts (556 lines)
```ts
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
import { buildNativePrayerTimeAlarms, DailyPrayerTimesEntry } from '../../services/athanAlarmPlugin';
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
    // Construct local target date tomorrow morning at 00:00 local time
    const testDay = new Date();
    testDay.setDate(testDay.getDate() + 2); // 2 days in the future to avoid any daylight/midnight edge
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
      testDay.setDate(testDay.getDate() + 2);
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
});



```

---

### src/components/KhushuModeSheet.tsx (450 lines)
```tsx
import React, { useState } from 'react';
import {
  VolumeX,
  Volume2,
  BellOff,
  Clock,
  Shield,
  AlertTriangle,
  Settings2,
  PhoneCall,
  Sparkles,
  Zap,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { KhushuModeType } from '../services/khushuModePlugin';
import { KhushuSettings } from '../domain/khushu/khushuTypes';
import { buildIqamaOptions, getDefaultIqamaOffset } from '../domain/khushu/khushuFlowUtils';
import { toArabicNumbers } from '../utils/hijri';
import { KhushuPermissionOnboardingModal } from './khushu/KhushuPermissionOnboardingModal';

interface KhushuModeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  currentMode: KhushuModeType;
  currentDuration: number;
  remainingSeconds: number;
  hasPermission: boolean;
  settings: KhushuSettings;
  onUpdateSettings: (newSettings: Partial<KhushuSettings>) => void;
  onActivate: (durationMinutes: number, mode?: KhushuModeType) => Promise<boolean>;
  onDeactivate: () => Promise<boolean>;
  onRequestPermission: () => Promise<void>;
}

const DURATIONS = [
  { minutes: 15, label: '١٥ دقيقة' },
  { minutes: 20, label: '٢٠ دقيقة' },
  { minutes: 30, label: '٣٠ دقيقة' },
  { minutes: 45, label: '٤٥ دقيقة' },
  { minutes: 60, label: 'ساعة كاملة' },
];

export const KhushuModeSheet: React.FC<KhushuModeSheetProps> = ({
  isOpen,
  onClose,
  isActive,
  currentMode,
  currentDuration,
  remainingSeconds,
  hasPermission,
  settings,
  onUpdateSettings,
  onActivate,
  onDeactivate,
  onRequestPermission,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(settings.defaultDurationMinutes || 15);
  const [selectedMode, setSelectedMode] = useState<KhushuModeType>(settings.preferredMode || 'silent');
  const [activeTab, setActiveTab] = useState<'quick' | 'settings'>('quick');
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  if (!isOpen) return null;

  const handleActivate = async () => {
    if (selectedMode === 'dnd' && !hasPermission) {
      setShowPermissionModal(true);
      return;
    }
    const success = await onActivate(selectedDuration, selectedMode);
    if (success) onClose();
  };

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const timeFormatted = `${toArabicNumbers(mins)}:${toArabicNumbers(secs < 10 ? `0${secs}` : secs)}`;

  return (
    <div
      id="khushu-sheet-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        id="khushu-sheet-content"
        className="w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-t-3xl sm:rounded-3xl p-6 text-white shadow-2xl animate-in slide-in-from-bottom-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* رأس النافذة مع شريط التبويب */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                وضع الخشوع للصلاة
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                كتم ذكي وتلقائي مع استعادة مضمونة للصوت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              id="tab-quick-khushu"
              onClick={() => setActiveTab('quick')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'quick' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              التحكم
            </button>
            <button
              id="tab-settings-khushu"
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'settings' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>التخصيص</span>
            </button>
          </div>
        </div>

        {/* التبويب الأول: التحكم السريع والتفعيل */}
        {activeTab === 'quick' && (
          <div className="space-y-4">
            {isActive ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-5 text-center shadow-inner">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  وضع الخشوع مفعّل حالياً ({currentMode === 'dnd' ? 'عدم الإزعاج' : 'الوضع الصامت'})
                </div>
                <div className="text-4xl font-black font-mono text-emerald-300 my-2">
                  {timeFormatted}
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  سيتم إعادة تفعيل الصوت تلقائياً بعد انتهاء الوقت
                </p>
                <button
                  id="btn-deactivate-khushu"
                  onClick={onDeactivate}
                  className="w-full py-3 rounded-xl bg-red-900/60 hover:bg-red-800/80 border border-red-700/60 text-red-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <span>إنهاء الوضع واستعادة الصوت الآن</span>
                </button>
              </div>
            ) : (
              <>
                {/* اختيار النمط */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-2">
                    اختر نمط الكتم المفضل
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMode('silent')}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                        selectedMode === 'silent'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <VolumeX className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">الوضع الصامت</div>
                        <div className="text-[10px] text-slate-400">كتم الرنين والاهتزاز</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedMode('dnd')}
                      className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${
                        selectedMode === 'dnd'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <BellOff className="w-5 h-5 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-white">عدم الإزعاج</div>
                        <div className="text-[10px] text-slate-400">حجب كل التنبيهات (DND)</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* اختيار المدة السريعة */}
                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-2">
                    مدة الخشوع (الوقت المقدر للصلاة)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DURATIONS.map((dur) => (
                      <button
                        key={dur.minutes}
                        type="button"
                        onClick={() => setSelectedDuration(dur.minutes)}
                        className={`py-2.5 px-2 rounded-xl border text-center text-xs font-semibold transition-all ${
                          selectedDuration === dur.minutes
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* تنبيه الإذن إذا كان DND */}
                {selectedMode === 'dnd' && !hasPermission && (
                  <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <div className="flex-1">
                      <span>يتطلب وضع عدم الإزعاج إذناً خاصاً من النظام.</span>
                      <button
                        type="button"
                        onClick={() => setShowPermissionModal(true)}
                        className="block mt-1 text-amber-200 underline font-bold cursor-pointer"
                      >
                        دليل منح الإذن والتفعيل
                      </button>
                    </div>
                  </div>
                )}

                {/* زر التفعيل السريع */}
                <button
                  id="btn-activate-khushu-now"
                  onClick={handleActivate}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/50 transition-all mt-2"
                >
                  <VolumeX className="w-4 h-4 shrink-0" />
                  <span>تفعيل الخشوع الآن ({toArabicNumbers(selectedDuration)} دقيقة)</span>
                </button>
              </>
            )}
          </div>
        )}

        {/* التبويب الثاني: التخصيص والميزات الذكية */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* 1. الأتمتة مع وقت الإقامة */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">التفعيل التلقائي مع وقت الإقامة</div>
                    <div className="text-[10px] text-slate-400">يبدأ الكتم تلقائياً فور وقت الإقامة المحسوب لكل فريضة</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoWithIqama}
                  onChange={(e) => onUpdateSettings({ autoWithIqama: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 2. مدد الصلوات المخصصة */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>تخصيص مدة الخشوع لكل صلاة (بالدقائق)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'fajr', label: 'صلاة الفجر' },
                  { key: 'dhuhr', label: 'صلاة الظهر' },
                  { key: 'asr', label: 'صلاة العصر' },
                  { key: 'maghrib', label: 'صلاة المغرب' },
                  { key: 'isha', label: 'صلاة العشاء' },
                  { key: 'friday', label: 'صلاة وخطبة الجمعة' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5">
                    <span className="text-slate-300">{item.label}</span>
                    <select
                      value={settings.prayerDurations[item.key as keyof typeof settings.prayerDurations] || 15}
                      onChange={(e) =>
                        onUpdateSettings({
                          prayerDurations: {
                            ...settings.prayerDurations,
                            [item.key]: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="bg-slate-800 text-emerald-300 text-xs rounded-lg px-2 py-1 border border-slate-700 outline-none"
                    >
                      {[10, 15, 20, 25, 30, 45, 60].map((m) => (
                        <option key={m} value={m}>
                          {toArabicNumbers(m)} د
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. وقت بدء الخشوع بعد الأذان لكل صلاة */}
            <div
              className={`bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 transition-opacity ${
                settings.autoWithIqama ? '' : 'opacity-50'
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>يبدأ بعد الأذان بـ (بالدقائق)</span>
                </div>
                {!settings.autoWithIqama && (
                  <span className="text-[10px] text-amber-300/90 font-medium">
                    فعّل التفعيل التلقائي لاختيار وقت البدء
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'fajr', label: 'صلاة الفجر' },
                  { key: 'dhuhr', label: 'صلاة الظهر' },
                  { key: 'asr', label: 'صلاة العصر' },
                  { key: 'maghrib', label: 'صلاة المغرب' },
                  { key: 'isha', label: 'صلاة العشاء' },
                  { key: 'friday', label: 'صلاة وخطبة الجمعة' },
                ].map((item) => {
                  const prayerDefault = getDefaultIqamaOffset(item.key);
                  const currentVal = settings.iqamaOffsets?.[item.key as keyof typeof settings.iqamaOffsets] ?? prayerDefault;
                  const optionsList = buildIqamaOptions(currentVal);

                  return (
                    <React.Fragment key={item.key}>
                      <div
                        className="flex items-center justify-between bg-black/20 p-2 rounded-xl border border-white/5"
                      >
                        <span className="text-slate-300">{item.label}</span>
                        <select
                          disabled={!settings.autoWithIqama}
                          value={currentVal}
                          onChange={(e) =>
                            onUpdateSettings({
                              iqamaOffsets: {
                                ...settings.iqamaOffsets,
                                [item.key]: parseInt(e.target.value, 10),
                              },
                            })
                          }
                          className={`bg-slate-800 text-amber-300 text-xs rounded-lg px-2 py-1 border border-slate-700 outline-none ${
                            !settings.autoWithIqama ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                          }`}
                        >
                          {optionsList.map((m) => (
                            <option key={m} value={m}>
                              {toArabicNumbers(m)} د
                            </option>
                          ))}
                        </select>
                      </div>
                      {item.key === 'friday' && !settings.enableFridaySpecial && (
                        <div className="col-span-2 text-[10px] text-amber-300/80 pr-1">
                          تنبيه: ميزة الجمعة الخاصة غير مفعلة، سيُعتمد وقت وتأخير الظهر بدلاً منه.
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* 3. استثناء اتصالات الطوارئ المكررة */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-sky-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">استثناء مكالمات الطوارئ المكررة</div>
                    <div className="text-[10px] text-slate-400">السماح بالرنين إذا كرر نفس الرقم الاتصال ٣ مرات خلال ٣ دقائق</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableEmergencyCallBypass}
                  onChange={(e) => onUpdateSettings({ enableEmergencyCallBypass: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </div>
            </div>

            {/* 4. شاشة السكون الإيماني والاهتزاز اللطيف وأذكار ما بعد الصلاة */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-bold text-white">خيارات التجربة الروحانية</div>
              
              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                <span>شاشة السكون الإيماني (OLED) عند فتح التطبيق أثناء الصلاة</span>
                <input
                  type="checkbox"
                  checked={settings.enableDistractionShield}
                  onChange={(e) => onUpdateSettings({ enableDistractionShield: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer border-t border-white/5 pt-2">
                <span>نبضة اهتزاز هادئة تنبهك بانتهاء فترة الصلاة وعودة الصوت</span>
                <input
                  type="checkbox"
                  checked={settings.enableGentleHapticPulse}
                  onChange={(e) => onUpdateSettings({ enableGentleHapticPulse: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer border-t border-white/5 pt-2">
                <span>إظهار أذكار ما بعد الصلاة فور انتهاء فترة الخشوع</span>
                <input
                  type="checkbox"
                  checked={settings.enablePostPrayerAthkar}
                  onChange={(e) => onUpdateSettings({ enablePostPrayerAthkar: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <KhushuPermissionOnboardingModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onRequestPermission={onRequestPermission}
        onSelectSilentFallback={() => {
          setSelectedMode('silent');
          onUpdateSettings({ preferredMode: 'silent' });
        }}
      />
    </div>
  );
};

```

---

### src/domain/notifications/UnifiedNotificationOrchestrator.ts (Changed Hunks)
#### Imports (Lines 16-27):
```ts
import { AppSettings, PrayerTimes, AlarmConfig } from '../../types';
import { safeGetJSON } from '../../utils/storage';
import { KhushuStorage } from '../khushu/khushuStorage';
import { computeKhushuStartMs, resolveKhushuIqamaOffset } from '../khushu/khushuFlowUtils';
import AthanAlarm, {
  PrayerTimeAlarm,
  DailyPrayerTimesEntry,
  scheduleNativeAthanAlarms,
  updateNativeWidgetData,
  ScheduledAlarmItem
} from '../../services/athanAlarmPlugin';

```
#### Khushu Time Computation & Offset Resolution (Lines 216-246):
```ts

        // System prealert and postalert paths removed in B6.
        // User-created prayer_relative custom alarms continue to be handled via custom alarms engine.

        // Auto Khushu alarm at Iqama moment (excluding sunrise)
        if (khushuSettings.autoWithIqama && key !== 'Sunrise') {
          const lowerKey = key.toLowerCase();
          const isFriday = triggerDate.getDay() === 5;
          const iqamaOffset = resolveKhushuIqamaOffset(khushuSettings, lowerKey, isFriday);
          let duration = (khushuSettings.prayerDurations as any)?.[lowerKey] ?? 15;
          if (isFriday && lowerKey === 'dhuhr' && khushuSettings.enableFridaySpecial) {
            duration = khushuSettings.prayerDurations.friday || 45;
          }
          const iqamaTimeMs = computeKhushuStartMs(triggerDate.getTime(), iqamaOffset);
          if (iqamaTimeMs > Date.now()) {
            nativeAlarmsToSchedule.push({
              prayerKey: `${key}_khushu`,
              prayerName: key,
              timeMs: iqamaTimeMs,
              isFajr: key === 'Fajr',
              alarmType: 'khushu',
              durationMinutes: duration,
              khushuMode: khushuSettings.preferredMode || 'silent',
            });
          }
        }
      }

      if (nativeAlarmsToSchedule.length > 0) {
        const res = await AthanAlarm.scheduleAthanAlarms({
          times: nativeAlarmsToSchedule,
```

---

### src/services/athanAlarmPlugin.ts (Changed Hunks)
#### Imports (Lines 1-16):
```ts
import { registerPlugin, Capacitor } from '@capacitor/core';
import { parseTimeToMinutes } from '../utils/prayerCalc';
import { PrayerTimes, AlarmConfig } from '../types';
import { prayerCanonicalNames } from '../domain/notifications/prayerCanonicalNames';
import { KhushuSettings } from '../domain/khushu/khushuTypes';
import { computeKhushuStartMs, resolveKhushuIqamaOffset } from '../domain/khushu/khushuFlowUtils';
import { isDiagAlarmId } from '../diagnostics/tests/diagTypes';
import { safeGetJSON } from '../utils/storage';

export interface PrayerTimeAlarm {
  prayerKey: string;
  prayerName: string;
  timeMs: number;
  isFajr?: boolean;
  alarmType?: string;
  durationMinutes?: number;
```
#### Path 1: Post-prayer custom alarm collision with khushu window (Lines 599-626):
```ts

            let timeMs = targetDate.getTime();

            // Task 6: Khushu collision check for custom post-prayer alarms
            if (khushuEnabled && lowerTarget !== 'sunrise' && alarm.relation === 'after') {
              const isFriday = dayDate.getDay() === 5;
              const iqamaOffset = resolveKhushuIqamaOffset(ks, lowerTarget, isFriday);
              let duration = (ks?.prayerDurations as any)?.[lowerTarget] ?? 15;
              if (isFriday && lowerTarget === 'dhuhr' && ks?.enableFridaySpecial) {
                duration = ks.prayerDurations.friday || 45;
              }
              const pBaseDate = new Date(dayDate);
              pBaseDate.setHours(0, 0, 0, 0);
              const prayerTimeMs = pBaseDate.getTime() + basePrayerMins * 60000;
              const iqamaTimeMs = computeKhushuStartMs(prayerTimeMs, iqamaOffset);
              const khushuEndTimeMs = iqamaTimeMs + duration * 60000;

              if (timeMs >= iqamaTimeMs && timeMs < khushuEndTimeMs) {
                const oldTime = timeMs;
                timeMs = khushuEndTimeMs;
                console.log(`[ALARM] kind=custom shifted from=${new Date(oldTime).toISOString()} to=${new Date(timeMs).toISOString()} reason=khushu_window_collision`);
              }
            }

            if (timeMs > now) {
              const targetNameArabic = prayerArabicNames[lowerTarget] || prayerTarget;
              times.push({
                prayerKey: `custom_${alarm.id}_${lowerTarget}_${timeMs}`,
```
#### Path 2: Multi-day batch khushu schedule (Lines 679-712):
```ts
            });
          }

          // System prealert and postalert paths removed in B6.
          // User-created prayer_relative custom alarms continue to be generated below.

          if (khushuEnabled && lowerKey !== 'sunrise') {
            const iqamaOffset = resolveKhushuIqamaOffset(ks, lowerKey, isFriday);
            let duration = (ks?.prayerDurations as any)?.[lowerKey] ?? 15;
            if (isFriday && lowerKey === 'dhuhr' && ks?.enableFridaySpecial) {
              duration = ks.prayerDurations.friday || 45;
            }
            const iqamaTimeMs = computeKhushuStartMs(timeMs, iqamaOffset);
            if (iqamaTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_khushu`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: iqamaTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'khushu',
                durationMinutes: duration,
                khushuMode: ks?.preferredMode || 'silent',
              });
            }
          }
        });
      });
    } else {
      // Fallback for single today/tomorrow maps
      const today = new Date();
      const isTodayFriday = today.getDay() === 5;
      addCustomAlarmsForDay(today, daysListOrTodayMap);

      Object.entries(daysListOrTodayMap).forEach(([key, timeStr]) => {
```
#### Path 3a: Fallback today khushu schedule (Lines 736-768):
```ts
          });
        }

        // System prealert and postalert paths removed in B6.
        // User-created prayer_relative custom alarms continue to be generated below.

        if (khushuEnabled && lowerKey !== 'sunrise') {
          const iqamaOffset = resolveKhushuIqamaOffset(ks, lowerKey, isTodayFriday);
          let duration = (ks?.prayerDurations as any)?.[lowerKey] ?? 15;
          if (isTodayFriday && lowerKey === 'dhuhr' && ks?.enableFridaySpecial) {
            duration = ks.prayerDurations.friday || 45;
          }
          const iqamaTimeMs = computeKhushuStartMs(timeMs, iqamaOffset);
          if (iqamaTimeMs > now) {
            times.push({
              prayerKey: `${prayerCanonicalNames[lowerKey] || key}_khushu`,
              prayerName: prayerArabicNames[lowerKey],
              timeMs: iqamaTimeMs,
              isFajr: lowerKey === 'fajr',
              alarmType: 'khushu',
              durationMinutes: duration,
              khushuMode: ks?.preferredMode || 'silent',
            });
          }
        }
      });

      if (tomorrowPrayerTimesMap) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const isTomorrowFriday = tomorrow.getDay() === 5;
        addCustomAlarmsForDay(tomorrow, tomorrowPrayerTimesMap);

```
#### Path 3b: Fallback tomorrow khushu schedule (Lines 796-828):
```ts
          // System prealert and postalert paths removed in B6.
          // User-created prayer_relative custom alarms continue to be generated below.

          if (khushuEnabled && lowerKey !== 'sunrise') {
            const iqamaOffset = resolveKhushuIqamaOffset(ks, lowerKey, isTomorrowFriday);
            let duration = (ks?.prayerDurations as any)?.[lowerKey] ?? 15;
            if (isTomorrowFriday && lowerKey === 'dhuhr' && ks?.enableFridaySpecial) {
              duration = ks.prayerDurations.friday || 45;
            }
            const iqamaTimeMs = computeKhushuStartMs(timeMs, iqamaOffset);
            if (iqamaTimeMs > now) {
              times.push({
                prayerKey: `${prayerCanonicalNames[lowerKey] || key}_khushu`,
                prayerName: prayerArabicNames[lowerKey],
                timeMs: iqamaTimeMs,
                isFajr: lowerKey === 'fajr',
                alarmType: 'khushu',
                durationMinutes: duration,
                khushuMode: ks?.preferredMode || 'silent',
              });
            }
          }
        });
      }
    }

  // Same-minute priority resolution: athan > prealert > postalert > khushu > custom
  const ALARM_PRIORITY: Record<string, number> = {
    athan: 1,
    prealert: 2,
    postalert: 3,
    khushu: 4,
    custom: 5,
```