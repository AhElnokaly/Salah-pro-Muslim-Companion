/**
 * StorageFacade: Multi-Tier Storage Architecture for Hemmaty
 * Handles separation between IndexedDB (heavy data/logs) and localStorage (light preferences).
 * Performs silent automatic migration from legacy localStorage keys to IndexedDB on first load.
 */

import { idbGetItem, idbSetItem } from '../../utils/indexedDBStorage';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';

export class StorageFacade {
  private static isMigrated = false;

  /**
   * Run silent migration from localStorage to IndexedDB for heavy collections
   */
  static async initAndMigrate(): Promise<void> {
    if (this.isMigrated || typeof window === 'undefined') return;

    try {
      const heavyKeys = [
        'hemmaty_prayer_logs',
        'hemmaty_qada_ledger',
        'hemmaty_quran_sessions',
        'hemmaty_adhkar_history',
        'hemmaty_analytics_events',
      ];

      for (const key of heavyKeys) {
        const legacyData = safeGetJSON<any>(key, null);
        if (legacyData !== null) {
          // Write to IndexedDB store
          await idbSetItem(key, legacyData);
        }
      }

      this.isMigrated = true;
    } catch (err) {
      console.warn('[StorageFacade] Silent migration warning:', err);
    }
  }

  // --- Specialized Stores ---

  // 1. Settings Store (localStorage preferred for synchronous initial state)
  static getSettings<T>(fallback: T): T {
    return safeGetJSON<T>('hemmaty_app_settings', fallback);
  }

  static saveSettings<T>(settings: T): void {
    safeSetJSON('hemmaty_app_settings', settings);
  }

  // 2. Prayer Logs Store (IndexedDB + async fallback)
  static async getPrayerLogs<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    return idbGetItem<T>('hemmaty_prayer_logs', fallback);
  }

  static async savePrayerLogs<T>(logs: T): Promise<boolean> {
    return idbSetItem('hemmaty_prayer_logs', logs);
  }

  // 3. Qada Ledger Store (IndexedDB + async fallback)
  static async getQadaLedger<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    return idbGetItem<T>('hemmaty_qada_ledger', fallback);
  }

  static async saveQadaLedger<T>(ledger: T): Promise<boolean> {
    return idbSetItem('hemmaty_qada_ledger', ledger);
  }

  // 4. Quran Sessions Store
  static async getQuranSessions<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    return idbGetItem<T>('hemmaty_quran_sessions', fallback);
  }

  static async saveQuranSessions<T>(sessions: T): Promise<boolean> {
    return idbSetItem('hemmaty_quran_sessions', sessions);
  }

  // 5. Dhikr History Store
  static async getDhikrHistory<T>(fallback: T): Promise<T> {
    await this.initAndMigrate();
    return idbGetItem<T>('hemmaty_adhkar_history', fallback);
  }

  static async saveDhikrHistory<T>(history: T): Promise<boolean> {
    return idbSetItem('hemmaty_adhkar_history', history);
  }
}
