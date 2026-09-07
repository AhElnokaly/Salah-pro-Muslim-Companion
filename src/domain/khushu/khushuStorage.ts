import { KhushuSettings, DEFAULT_KHUSHU_SETTINGS } from './khushuTypes';

export const KHUSHU_SETTINGS_STORAGE_KEY = 'hemmaty_khushu_extended_settings';
export const KHUSHU_SHIELD_DISMISSED_KEY = 'hemmaty_khushu_shield_dismissed';

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

export class KhushuStorage {
  static getSettings(): KhushuSettings {
    const storage = getStorage();
    if (!storage) {
      return DEFAULT_KHUSHU_SETTINGS;
    }
    try {
      const raw = storage.getItem(KHUSHU_SETTINGS_STORAGE_KEY);
      if (!raw) return DEFAULT_KHUSHU_SETTINGS;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_KHUSHU_SETTINGS,
        ...parsed,
        prayerDurations: {
          ...DEFAULT_KHUSHU_SETTINGS.prayerDurations,
          ...(parsed.prayerDurations || {}),
        },
        iqamaOffsets: {
          ...DEFAULT_KHUSHU_SETTINGS.iqamaOffsets,
          ...(parsed.iqamaOffsets || {}),
        },
      };
    } catch {
      return DEFAULT_KHUSHU_SETTINGS;
    }
  }

  static saveSettings(settings: KhushuSettings): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(KHUSHU_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('[KhushuStorage] Failed to save settings:', e);
    }
  }

  static isShieldDismissed(activeSessionId: string): boolean {
    const storage = getStorage();
    if (!storage) return false;
    try {
      const stored = storage.getItem(KHUSHU_SHIELD_DISMISSED_KEY);
      return stored === activeSessionId;
    } catch {
      return false;
    }
  }

  static setShieldDismissed(activeSessionId: string): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(KHUSHU_SHIELD_DISMISSED_KEY, activeSessionId);
    } catch {
      // safe ignore
    }
  }

  static clearShieldDismissed(): void {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.removeItem(KHUSHU_SHIELD_DISMISSED_KEY);
    } catch {
      // safe ignore
    }
  }
}
