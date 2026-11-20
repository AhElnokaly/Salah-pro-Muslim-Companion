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
