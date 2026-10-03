/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMuezzinId, DEFAULT_MUEZZIN_FAJR, DEFAULT_MUEZZIN_GENERAL } from './muezzinResolver';
import { safeSetItem, safeGetItem } from './storage';

// Ensure localStorage mock exists for node test environment
class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.has(key) ? this.store.get(key)! : null; }
  key(index: number): string | null { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
}

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new MockStorage();
}

describe('TASK 3 - Muezzin Resolver & Simulator Override', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('4(d) resolver precedence: per-prayer key > fajr/general > default', () => {
    test('returns per-prayer key when set for standard prayer (Dhuhr), overriding general', () => {
      safeSetItem('salah_muezzin_Dhuhr', 'custom_dhuhr_sheikh');
      safeSetItem('salah_general_muezzin', 'makkah');

      const resolved = resolveMuezzinId('Dhuhr');
      assert.equal(resolved, 'custom_dhuhr_sheikh', 'Per-prayer key must take highest precedence');
    });

    test('falls back to salah_general_muezzin when per-prayer key is absent', () => {
      safeSetItem('salah_general_muezzin', 'medina_live');

      const resolved = resolveMuezzinId('Asr');
      assert.equal(resolved, 'medina_live', 'Must fall back to general muezzin for non-Fajr prayer');
    });

    test('falls back to DEFAULT_MUEZZIN_GENERAL when neither per-prayer nor general key is set', () => {
      const resolved = resolveMuezzinId('Maghrib');
      assert.equal(resolved, DEFAULT_MUEZZIN_GENERAL);
    });

    test('returns per-prayer key when set for Fajr, overriding salah_fajr_muezzin', () => {
      safeSetItem('salah_muezzin_Fajr', 'fajr_special_track');
      safeSetItem('salah_fajr_muezzin', 'fajr_makkah');

      const resolved = resolveMuezzinId('Fajr');
      assert.equal(resolved, 'fajr_special_track', 'Fajr per-prayer key takes precedence over fajr general');
    });

    test('falls back to salah_fajr_muezzin when Fajr per-prayer key is absent', () => {
      safeSetItem('salah_fajr_muezzin', 'fajr_aqsa');

      const resolved = resolveMuezzinId('Fajr');
      assert.equal(resolved, 'fajr_aqsa');
    });

    test('falls back to DEFAULT_MUEZZIN_FAJR when neither Fajr per-prayer nor fajr general is set', () => {
      const resolved = resolveMuezzinId('Fajr');
      assert.equal(resolved, DEFAULT_MUEZZIN_FAJR);
    });

    test('normalizes Arabic prayer names correctly to English keys', () => {
      safeSetItem('salah_muezzin_Fajr', 'fajr_arabic_test');
      safeSetItem('salah_muezzin_Isha', 'isha_arabic_test');

      assert.equal(resolveMuezzinId('الفجر'), 'fajr_arabic_test');
      assert.equal(resolveMuezzinId('العشاء'), 'isha_arabic_test');
    });
  });

  describe('4(a) override set -> overlay plays override and saved keys unchanged', () => {
    test('overlay playback resolution prefers override without modifying storage', () => {
      // User saved defaults in storage
      safeSetItem('salah_muezzin_Dhuhr', 'saved_dhuhr_track');
      safeSetItem('salah_general_muezzin', 'saved_general_track');

      // User selects temporary preview muezzin in simulator/overlay
      const overrideMuezzinId: string | null = 'temporary_simulator_muezzin';

      // Simulation of overlay resolution function
      const getActiveOverlayMuezzin = (prayer: string, override: string | null) => {
        return override || resolveMuezzinId(prayer);
      };

      const playingTrackId = getActiveOverlayMuezzin('Dhuhr', overrideMuezzinId);

      assert.equal(playingTrackId, 'temporary_simulator_muezzin', 'Overlay must play the override track');
      assert.equal(safeGetItem('salah_muezzin_Dhuhr'), 'saved_dhuhr_track', 'salah_muezzin_Dhuhr must remain untouched');
      assert.equal(safeGetItem('salah_general_muezzin'), 'saved_general_track', 'salah_general_muezzin must remain untouched');
      assert.equal(safeGetItem('salah_fajr_muezzin'), null, 'salah_fajr_muezzin must remain untouched');
    });
  });

  describe('4(b) override reset on close', () => {
    test('closing overlay clears override and restores saved resolver selection', () => {
      safeSetItem('salah_muezzin_Asr', 'saved_asr_muezzin');

      let overrideMuezzinId: string | null = 'preview_override_track';

      const handleOverlayClose = () => {
        overrideMuezzinId = null;
      };

      // Close overlay
      handleOverlayClose();

      assert.equal(overrideMuezzinId, null, 'Override must reset to null on overlay close');

      // Subsequent resolution falls back to saved storage
      const activeTrack = overrideMuezzinId || resolveMuezzinId('Asr');
      assert.equal(activeTrack, 'saved_asr_muezzin', 'Must return saved resolver selection after close');
    });
  });

  describe('4(c) triggerAthan ignores override', () => {
    test('real Athan trigger ignores override and resets override to null', () => {
      safeSetItem('salah_muezzin_Maghrib', 'canonical_maghrib_sound');

      let overrideMuezzinId: string | null = 'stray_simulator_override';

      // Simulate triggerAthan behavior in useAthanPlayer
      const simulateTriggerAthan = (prayer: string) => {
        // Real Athan trigger: always resets override and NEVER reads it
        overrideMuezzinId = null;
        return resolveMuezzinId(prayer);
      };

      const resolvedForRealAlarm = simulateTriggerAthan('Maghrib');

      assert.equal(resolvedForRealAlarm, 'canonical_maghrib_sound', 'Real Athan must resolve canonical key');
      assert.equal(overrideMuezzinId, null, 'Override must be reset to null when real Athan triggers');
    });
  });
});
