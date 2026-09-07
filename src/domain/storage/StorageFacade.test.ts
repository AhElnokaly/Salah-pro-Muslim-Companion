import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { StorageFacade, CANONICAL_STORAGE_KEYS, LEGACY_STORAGE_KEYS } from './StorageFacade';

// Ensure in-memory localStorage mock exists in Node.js test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() { return store.size; },
  };
}

// IndexedDB is not available in the Node test runner — the async getters fall
// through it silently (idbGetItem rejects/returns fallback), which is exactly
// the path we want to exercise here: canonical empty -> idb empty -> legacy.

describe('StorageFacade Repository Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('canonical storage keys have stable prefixes and definitions', () => {
    assert.equal(CANONICAL_STORAGE_KEYS.SETTINGS, 'mc_settings');
    assert.equal(CANONICAL_STORAGE_KEYS.PRAYER_LOGS, 'mc_prayer_logs');
    assert.equal(CANONICAL_STORAGE_KEYS.PENDING_QADA, 'mc_pending_qada');
    assert.equal(CANONICAL_STORAGE_KEYS.VOLUNTARY_PRAYERS, 'mc_voluntary_prayer_logs');
    assert.equal(CANONICAL_STORAGE_KEYS.FASTING_LOGS, 'mc_fasting_logs');
    assert.equal(CANONICAL_STORAGE_KEYS.RAMADAN_QADA, 'mc_ramadan_qada');
    assert.equal(CANONICAL_STORAGE_KEYS.QURAN_SESSIONS, 'mc_quran_sessions');
    assert.equal(CANONICAL_STORAGE_KEYS.KHATMAT, 'mc_khatmat');
    assert.equal(CANONICAL_STORAGE_KEYS.DHIKR_LOGS, 'mc_dhikr_logs');
    assert.equal(CANONICAL_STORAGE_KEYS.CUSTOM_DUAS, 'mc_custom_duas');
  });

  test('returns fallback values safely when keys are missing or uninitialized', () => {
    const fallbackSettings = { cityName: 'Cairo', madhab: 'standard' };
    const result = StorageFacade.getSettings(fallbackSettings);
    assert.deepEqual(result, fallbackSettings);

    const emptyPrayerLogs = StorageFacade.getPrayerLogsSync({});
    assert.deepEqual(emptyPrayerLogs, {});

    const emptyQada = StorageFacade.getPendingQadaSync([]);
    assert.deepEqual(emptyQada, []);

    const emptyKhatmat = StorageFacade.getKhatmatSync([]);
    assert.deepEqual(emptyKhatmat, []);
  });

  test('persists and retrieves settings synchronously', () => {
    const customSettings = {
      cityName: 'Alexandria',
      calcMethod: 'Egypt',
      madhab: 'standard'
    };

    const saved = StorageFacade.saveSettings(customSettings);
    assert.ok(saved, 'saveSettings should return true');

    const retrieved = StorageFacade.getSettings({});
    assert.deepEqual(retrieved, customSettings);
  });

  // --- LOCK-16 candidate: legacy key fallback (fixes fix-state.md A.2 false DONE) ---
  describe('legacy hemmaty_* key fallback — real data recovery, not just empty defaults', () => {
    test('getPrayerLogs falls back to legacy key when mc_prayer_logs is empty', async () => {
      const legacyLogs = { '2026-01-01': { fajr: 'onTime' } };
      localStorage.setItem(LEGACY_STORAGE_KEYS.PRAYER_LOGS, JSON.stringify(legacyLogs));

      const result = await StorageFacade.getPrayerLogs<Record<string, unknown>>({});
      assert.deepEqual(result, legacyLogs, 'must recover real data from the legacy key, not return {}');
    });

    test('getQadaLedger falls back to legacy key', async () => {
      const legacyLedger = [{ prayer: 'Dhuhr', date: '2026-01-01' }];
      localStorage.setItem(LEGACY_STORAGE_KEYS.PENDING_QADA, JSON.stringify(legacyLedger));

      const result = await StorageFacade.getQadaLedger<unknown[]>([]);
      assert.deepEqual(result, legacyLedger);
    });

    test('getVoluntaryPrayers falls back to legacy key', async () => {
      const legacy = [{ type: 'Duha', date: '2026-01-01' }];
      localStorage.setItem(LEGACY_STORAGE_KEYS.VOLUNTARY_PRAYERS, JSON.stringify(legacy));

      const result = await StorageFacade.getVoluntaryPrayers<unknown[]>([]);
      assert.deepEqual(result, legacy);
    });

    test('getFastingLogs falls back to legacy key', async () => {
      const legacy = { '2026-01-01': { fasted: true } };
      localStorage.setItem(LEGACY_STORAGE_KEYS.FASTING_LOGS, JSON.stringify(legacy));

      const result = await StorageFacade.getFastingLogs<Record<string, unknown>>({});
      assert.deepEqual(result, legacy);
    });

    test('getRamadanQada falls back to legacy key', async () => {
      const legacy = { daysOwed: 5 };
      localStorage.setItem(LEGACY_STORAGE_KEYS.RAMADAN_QADA, JSON.stringify(legacy));

      const result = await StorageFacade.getRamadanQada<Record<string, unknown>>({});
      assert.deepEqual(result, legacy);
    });

    test('getQuranSessions falls back to legacy key', async () => {
      const legacy = [{ surah: 'Al-Baqarah', ayahs: 10 }];
      localStorage.setItem(LEGACY_STORAGE_KEYS.QURAN_SESSIONS, JSON.stringify(legacy));

      const result = await StorageFacade.getQuranSessions<unknown[]>([]);
      assert.deepEqual(result, legacy);
    });

    test('getKhatmat falls back to legacy key', async () => {
      const legacy = [{ id: 'k1', completedAt: '2026-01-01' }];
      localStorage.setItem(LEGACY_STORAGE_KEYS.KHATMAT, JSON.stringify(legacy));

      const result = await StorageFacade.getKhatmat<unknown[]>([]);
      assert.deepEqual(result, legacy);
    });

    test('getDhikrHistory falls back to legacy key', async () => {
      const legacy = { morning: { count: 33 } };
      localStorage.setItem(LEGACY_STORAGE_KEYS.DHIKR_LOGS, JSON.stringify(legacy));

      const result = await StorageFacade.getDhikrHistory<Record<string, unknown>>({});
      assert.deepEqual(result, legacy);
    });

    test('getCustomDuas falls back to legacy key', async () => {
      const legacy = [{ id: 'd1', text: 'رب اشرح لي صدري' }];
      localStorage.setItem(LEGACY_STORAGE_KEYS.CUSTOM_DUAS, JSON.stringify(legacy));

      const result = await StorageFacade.getCustomDuas<unknown[]>([]);
      assert.deepEqual(result, legacy);
    });

    test('canonical (mc_*) data takes priority over legacy data when both exist', async () => {
      localStorage.setItem(CANONICAL_STORAGE_KEYS.QURAN_SESSIONS, JSON.stringify([{ surah: 'new' }]));
      localStorage.setItem(LEGACY_STORAGE_KEYS.QURAN_SESSIONS, JSON.stringify([{ surah: 'old' }]));

      const result = await StorageFacade.getQuranSessions<unknown[]>([]);
      assert.deepEqual(result, [{ surah: 'new' }], 'canonical key must win over legacy when both are present');
    });
  });

  describe('auditLegacyKeys diagnostic', () => {
    test('flags a key that matches neither canonical nor known legacy names', () => {
      localStorage.setItem('some_unexpected_old_key', JSON.stringify({ foo: 'bar' }));
      const unrecognized = StorageFacade.auditLegacyKeys();
      assert.ok(unrecognized.includes('some_unexpected_old_key'));
    });

    test('does not flag known canonical or legacy keys', () => {
      localStorage.setItem(CANONICAL_STORAGE_KEYS.SETTINGS, JSON.stringify({}));
      localStorage.setItem(LEGACY_STORAGE_KEYS.DHIKR_LOGS, JSON.stringify({}));
      const unrecognized = StorageFacade.auditLegacyKeys();
      assert.ok(!unrecognized.includes(CANONICAL_STORAGE_KEYS.SETTINGS));
      assert.ok(!unrecognized.includes(LEGACY_STORAGE_KEYS.DHIKR_LOGS));
    });

    // Regression guard: a prefix-based check (k.startsWith('hemmaty_')) would
    // silently swallow a WRONG legacy key guess into "known" — the exact
    // failure mode this function exists to catch. Must stay exact-match only.
    test('does NOT swallow an unexpected hemmaty_*/mc_* key via prefix matching', () => {
      localStorage.setItem('hemmaty_daily_prayers', JSON.stringify({ wrongGuess: true }));
      localStorage.setItem('mc_unregistered_feature', JSON.stringify({ wrongGuess: true }));
      const unrecognized = StorageFacade.auditLegacyKeys();
      assert.ok(
        unrecognized.includes('hemmaty_daily_prayers'),
        'a hemmaty_-prefixed key not in LEGACY_STORAGE_KEYS must still be flagged'
      );
      assert.ok(
        unrecognized.includes('mc_unregistered_feature'),
        'an mc_-prefixed key not in CANONICAL_STORAGE_KEYS must still be flagged'
      );
    });

    test('does not flag other known real hemmaty_*/mc_* keys used by unrelated features', () => {
      localStorage.setItem('hemmaty_weather_cache', JSON.stringify({}));
      localStorage.setItem('mc_favorite_dhikrs', JSON.stringify([]));
      const unrecognized = StorageFacade.auditLegacyKeys();
      assert.ok(!unrecognized.includes('hemmaty_weather_cache'));
      assert.ok(!unrecognized.includes('mc_favorite_dhikrs'));
    });
  });
});
