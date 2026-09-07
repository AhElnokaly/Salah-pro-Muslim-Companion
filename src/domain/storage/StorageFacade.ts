/**
 * StorageFacade: Multi-Tier Storage Architecture for Hemmaty
 * Handles separation between IndexedDB (heavy data/logs) and localStorage (light preferences).
 * Performs silent automatic migration and dual-tier sync between canonical keys.
 */

import { idbGetItem, idbSetItem } from '../../utils/indexedDBStorage';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';

export const CANONICAL_STORAGE_KEYS = {
  SETTINGS: 'mc_settings',
  PRAYER_LOGS: 'mc_prayer_logs',
  PENDING_QADA: 'mc_pending_qada',
  VOLUNTARY_PRAYERS: 'mc_voluntary_prayer_logs',
  FASTING_LOGS: 'mc_fasting_logs',
  RAMADAN_QADA: 'mc_ramadan_qada',
  QURAN_SESSIONS: 'mc_quran_sessions',
  KHATMAT: 'mc_khatmat',
  DHIKR_LOGS: 'mc_dhikr_logs',
  CUSTOM_DUAS: 'mc_custom_duas',
  ANALYTICS: 'rafiq_feature_analytics_v1',
} as const;

/**
 * Legacy (pre-migration) localStorage keys, kept only as a read fallback.
 * These were the keys used before the app switched to CANONICAL_STORAGE_KEYS (mc_*).
 * NEVER written to going forward — read-only fallback so no existing user data
 * is silently orphaned by the mc_* rename.
 */
export const LEGACY_STORAGE_KEYS = {
  SETTINGS: 'hemmaty_app_settings',
  PRAYER_LOGS: 'hemmaty_prayer_logs',
  PENDING_QADA: 'hemmaty_pending_qada',
  VOLUNTARY_PRAYERS: 'hemmaty_voluntary_prayer_logs',
  FASTING_LOGS: 'hemmaty_fasting_logs',
  RAMADAN_QADA: 'hemmaty_ramadan_qada',
  QURAN_SESSIONS: 'hemmaty_quran_sessions',
  KHATMAT: 'hemmaty_khatmat',
  DHIKR_LOGS: 'hemmaty_dhikr_logs',
  CUSTOM_DUAS: 'hemmaty_custom_duas',
} as const;

export class StorageFacade {
  private static isMigrated = false;

  /**
   * Diagnostic only — does not affect app behavior.
   * Scans every key actually present in localStorage and returns any key that
   * doesn't match a known canonical (mc_*) or known legacy (hemmaty_*) name.
   * Run this against a real device BEFORE trusting that the legacy fallback
   * list above is complete — an unrecognized key here means real user data
   * that this fallback list does NOT cover yet.
   *
   * IMPORTANT: matches by EXACT key name, never by prefix (startsWith). A
   * prefix check like `k.startsWith('hemmaty_')` would silently swallow an
   * unexpected legacy key name (e.g. a wrong guess like 'hemmaty_daily_prayers'
   * instead of 'hemmaty_prayer_logs') into "known" — defeating the entire
   * purpose of this function, which exists specifically to catch a wrong guess.
   */
  static auditLegacyKeys(): string[] {
    try {
      const storage = typeof localStorage !== 'undefined' ? localStorage : null;
      if (!storage) return [];

      const allKeys: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k) allKeys.push(k);
      }

      // Every key we currently know about, by exact name — never by prefix.
      // OTHER_KNOWN_KEYS covers real hemmaty_*/mc_* keys used by unrelated
      // features (weather cache, changelog, focus mode, dhikr favorites, etc.)
      // so they aren't flagged as false positives.
      const OTHER_KNOWN_KEYS = [
        'hemmaty_push_settings',
        'hemmaty_weather_cache',
        'hemmaty_last_seen_version',
        'hemmaty_local_snapshots',
        'hemmaty_focus_mode_state',
        'hemmaty_khushu_web_state',
        'mc_favorite_dhikr_categories',
        'mc_favorite_dhikrs',
      ];
      const knownExactKeys = new Set<string>([
        ...Object.values(CANONICAL_STORAGE_KEYS),
        ...Object.values(LEGACY_STORAGE_KEYS),
        ...OTHER_KNOWN_KEYS,
      ]);

      const unrecognized: string[] = [];
      for (const k of allKeys) {
        if (knownExactKeys.has(k)) continue;
        const val = storage.getItem(k);
        if (val !== null && val !== undefined && val.trim() !== '') {
          unrecognized.push(k);
        }
      }
      return unrecognized;
    } catch (err) {
      console.warn('[StorageFacade] auditLegacyKeys error:', err);
      return [];
    }
  }

  /**
   * Run silent migration from localStorage to IndexedDB for heavy collections
   */
  static async initAndMigrate(): Promise<void> {
    if (this.isMigrated || typeof window === 'undefined') return;

    try {
      const heavyKeys = [
        CANONICAL_STORAGE_KEYS.PRAYER_LOGS,
        CANONICAL_STORAGE_KEYS.PENDING_QADA,
        CANONICAL_STORAGE_KEYS.VOLUNTARY_PRAYERS,
        CANONICAL_STORAGE_KEYS.FASTING_LOGS,
        CANONICAL_STORAGE_KEYS.QURAN_SESSIONS,
        CANONICAL_STORAGE_KEYS.KHATMAT,
        CANONICAL_STORAGE_KEYS.DHIKR_LOGS,
        CANONICAL_STORAGE_KEYS.ANALYTICS,
      ];

      for (const key of heavyKeys) {
        const localData = safeGetJSON<unknown>(key, null);
        if (localData !== null) {
          // Write/backup to IndexedDB store
          await idbSetItem(key, localData);
        }
      }

      this.isMigrated = true;
    } catch (err) {
      console.warn('[StorageFacade] Silent migration warning:', err);
    }
  }

  // --- Generic Helpers ---
  static getItemSync<T>(key: string, fallback: T): T {
    return safeGetJSON<T>(key, fallback);
  }

  static async getItemAsync<T>(key: string, fallback: T): Promise<T> {
    await this.initAndMigrate();
    return idbGetItem<T>(key, fallback);
  }

  static async saveItem<T>(key: string, value: T): Promise<boolean> {
    return idbSetItem(key, value);
  }

  // --- Specialized Entity Stores with Multi-Tier Resilience ---

  // 1. Settings Store (localStorage preferred for instantaneous startup)
  static getSettings<T>(fallback: T): T {
    const data = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.SETTINGS, null as unknown as T);
    if (data !== null && data !== undefined) return data;
    return safeGetJSON<T>('hemmaty_app_settings', fallback);
  }

  static saveSettings<T>(settings: T): boolean {
    return safeSetJSON(CANONICAL_STORAGE_KEYS.SETTINGS, settings);
  }

  // 2. Prayer Logs Store
  static getPrayerLogsSync<T>(fallback: T): T {
    return safeGetJSON<T>(CANONICAL_STORAGE_KEYS.PRAYER_LOGS, fallback);
  }

  static async getPrayerLogs<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    const localData = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.PRAYER_LOGS, null as unknown as T);
    if (localData !== null && localData !== undefined && Object.keys(localData as object).length > 0) {
      return localData;
    }
    const idbData = await idbGetItem<T>(CANONICAL_STORAGE_KEYS.PRAYER_LOGS, null as unknown as T);
    if (idbData !== null && idbData !== undefined && Object.keys(idbData as object).length > 0) {
      return idbData;
    }
    return safeGetJSON<T>(LEGACY_STORAGE_KEYS.PRAYER_LOGS, fallback);
  }

  static async savePrayerLogs<T>(logs: T): Promise<boolean> {
    return idbSetItem(CANONICAL_STORAGE_KEYS.PRAYER_LOGS, logs);
  }

  // 3. Qada Ledger Store
  static getPendingQadaSync<T>(fallback: T): T {
    return safeGetJSON<T>(CANONICAL_STORAGE_KEYS.PENDING_QADA, fallback);
  }

  static async getQadaLedger<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    const localData = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.PENDING_QADA, null as unknown as T);
    if (localData !== null && localData !== undefined) return localData;
    const idbData = await idbGetItem<T>(CANONICAL_STORAGE_KEYS.PENDING_QADA, null as unknown as T);
    if (idbData !== null && idbData !== undefined) return idbData;
    return safeGetJSON<T>(LEGACY_STORAGE_KEYS.PENDING_QADA, fallback);
  }

  static async saveQadaLedger<T>(ledger: T): Promise<boolean> {
    return idbSetItem(CANONICAL_STORAGE_KEYS.PENDING_QADA, ledger);
  }

  // 4. Voluntary Prayers Store
  static getVoluntaryPrayersSync<T>(fallback: T): T {
    return safeGetJSON<T>(CANONICAL_STORAGE_KEYS.VOLUNTARY_PRAYERS, fallback);
  }

  static async getVoluntaryPrayers<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    const localData = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.VOLUNTARY_PRAYERS, null as unknown as T);
    if (localData !== null && localData !== undefined) return localData;
    const idbData = await idbGetItem<T>(CANONICAL_STORAGE_KEYS.VOLUNTARY_PRAYERS, null as unknown as T);
    if (idbData !== null && idbData !== undefined) return idbData;
    return safeGetJSON<T>(LEGACY_STORAGE_KEYS.VOLUNTARY_PRAYERS, fallback);
  }

  static async saveVoluntaryPrayers<T>(prayers: T): Promise<boolean> {
    return idbSetItem(CANONICAL_STORAGE_KEYS.VOLUNTARY_PRAYERS, prayers);
  }

  // 5. Fasting Logs Store
  static getFastingLogsSync<T>(fallback: T): T {
    return safeGetJSON<T>(CANONICAL_STORAGE_KEYS.FASTING_LOGS, fallback);
  }

  static async getFastingLogs<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    const localData = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.FASTING_LOGS, null as unknown as T);
    if (localData !== null && localData !== undefined) return localData;
    const idbData = await idbGetItem<T>(CANONICAL_STORAGE_KEYS.FASTING_LOGS, null as unknown as T);
    if (idbData !== null && idbData !== undefined) return idbData;
    return safeGetJSON<T>(LEGACY_STORAGE_KEYS.FASTING_LOGS, fallback);
  }

  static async saveFastingLogs<T>(logs: T): Promise<boolean> {
    return idbSetItem(CANONICAL_STORAGE_KEYS.FASTING_LOGS, logs);
  }

  // 6. Ramadan Qada Store
  static getRamadanQadaSync<T>(fallback: T): T {
    return safeGetJSON<T>(CANONICAL_STORAGE_KEYS.RAMADAN_QADA, fallback);
  }

  static async getRamadanQada<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    const localData = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.RAMADAN_QADA, null as unknown as T);
    if (localData !== null && localData !== undefined) return localData;
    const idbData = await idbGetItem<T>(CANONICAL_STORAGE_KEYS.RAMADAN_QADA, null as unknown as T);
    if (idbData !== null && idbData !== undefined) return idbData;
    return safeGetJSON<T>(LEGACY_STORAGE_KEYS.RAMADAN_QADA, fallback);
  }

  static async saveRamadanQada<T>(tracker: T): Promise<boolean> {
    return idbSetItem(CANONICAL_STORAGE_KEYS.RAMADAN_QADA, tracker);
  }

  // 7. Quran Sessions Store
  static getQuranSessionsSync<T>(fallback: T): T {
    return safeGetJSON<T>(CANONICAL_STORAGE_KEYS.QURAN_SESSIONS, fallback);
  }

  static async getQuranSessions<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    const localData = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.QURAN_SESSIONS, null as unknown as T);
    if (localData !== null && localData !== undefined) return localData;
    const idbData = await idbGetItem<T>(CANONICAL_STORAGE_KEYS.QURAN_SESSIONS, null as unknown as T);
    if (idbData !== null && idbData !== undefined) return idbData;
    return safeGetJSON<T>(LEGACY_STORAGE_KEYS.QURAN_SESSIONS, fallback);
  }

  static async saveQuranSessions<T>(sessions: T): Promise<boolean> {
    return idbSetItem(CANONICAL_STORAGE_KEYS.QURAN_SESSIONS, sessions);
  }

  // 8. Khatmat Store
  static getKhatmatSync<T>(fallback: T): T {
    return safeGetJSON<T>(CANONICAL_STORAGE_KEYS.KHATMAT, fallback);
  }

  static async getKhatmat<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    const localData = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.KHATMAT, null as unknown as T);
    if (localData !== null && localData !== undefined) return localData;
    const idbData = await idbGetItem<T>(CANONICAL_STORAGE_KEYS.KHATMAT, null as unknown as T);
    if (idbData !== null && idbData !== undefined) return idbData;
    return safeGetJSON<T>(LEGACY_STORAGE_KEYS.KHATMAT, fallback);
  }

  static async saveKhatmat<T>(khatmat: T): Promise<boolean> {
    return idbSetItem(CANONICAL_STORAGE_KEYS.KHATMAT, khatmat);
  }

  // 9. Dhikr History Store
  static getDhikrLogsSync<T>(fallback: T): T {
    return safeGetJSON<T>(CANONICAL_STORAGE_KEYS.DHIKR_LOGS, fallback);
  }

  static async getDhikrHistory<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    const localData = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.DHIKR_LOGS, null as unknown as T);
    if (localData !== null && localData !== undefined) return localData;
    const idbData = await idbGetItem<T>(CANONICAL_STORAGE_KEYS.DHIKR_LOGS, null as unknown as T);
    if (idbData !== null && idbData !== undefined) return idbData;
    return safeGetJSON<T>(LEGACY_STORAGE_KEYS.DHIKR_LOGS, fallback);
  }

  static async saveDhikrHistory<T>(history: T): Promise<boolean> {
    return idbSetItem(CANONICAL_STORAGE_KEYS.DHIKR_LOGS, history);
  }

  // 10. Custom Duas Store
  static getCustomDuasSync<T>(fallback: T): T {
    return safeGetJSON<T>(CANONICAL_STORAGE_KEYS.CUSTOM_DUAS, fallback);
  }

  static async getCustomDuas<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    const localData = safeGetJSON<T>(CANONICAL_STORAGE_KEYS.CUSTOM_DUAS, null as unknown as T);
    if (localData !== null && localData !== undefined) return localData;
    const idbData = await idbGetItem<T>(CANONICAL_STORAGE_KEYS.CUSTOM_DUAS, null as unknown as T);
    if (idbData !== null && idbData !== undefined) return idbData;
    return safeGetJSON<T>(LEGACY_STORAGE_KEYS.CUSTOM_DUAS, fallback);
  }

  static async saveCustomDuas<T>(duas: T): Promise<boolean> {
    return idbSetItem(CANONICAL_STORAGE_KEYS.CUSTOM_DUAS, duas);
  }
}
