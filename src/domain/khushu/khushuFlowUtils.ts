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

