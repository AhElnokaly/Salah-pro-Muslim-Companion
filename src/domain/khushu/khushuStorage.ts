/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KhushuSettings, DEFAULT_KHUSHU_SETTINGS } from './khushuTypes';
import { safeGetJSON, safeSetJSON, safeGetItem, safeSetItem } from '../../utils/storage';

export const KHUSHU_SETTINGS_STORAGE_KEY = 'hemmaty_khushu_settings_v2';
const SHIELD_DISMISSED_KEY = 'hemmaty_khushu_shield_dismissed_session';

export class KhushuStorage {
  static getSettings(): KhushuSettings {
    const stored = safeGetJSON<KhushuSettings | null>(KHUSHU_SETTINGS_STORAGE_KEY, null);
    if (!stored) {
      return { ...DEFAULT_KHUSHU_SETTINGS };
    }
    return {
      ...DEFAULT_KHUSHU_SETTINGS,
      ...stored,
      prayerDurations: {
        ...DEFAULT_KHUSHU_SETTINGS.prayerDurations,
        ...(stored.prayerDurations || {}),
      },
      iqamaOffsets: {
        ...DEFAULT_KHUSHU_SETTINGS.iqamaOffsets,
        ...(stored.iqamaOffsets || {}),
      },
    };
  }

  static saveSettings(settings: KhushuSettings): void {
    safeSetJSON(KHUSHU_SETTINGS_STORAGE_KEY, settings);
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
