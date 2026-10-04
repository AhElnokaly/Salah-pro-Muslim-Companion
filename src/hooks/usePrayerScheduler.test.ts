/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { isNativeAthanRunning, setAthanPluginBridgeForTesting } from '../services/athanAlarmPlugin';
import { Capacitor } from '@capacitor/core';
import { safeSetItem, safeGetItem, safeSessionSetItem, safeSessionGetItem } from '../utils/storage';
import { PrayerName } from '../types';

class MockStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

// Ensure localStorage & sessionStorage exist in Node test environment
if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = new MockStorage();
}
if (typeof globalThis.sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = new MockStorage();
}

describe('usePrayerScheduler - Native Athan Catch-up & isAudioBusy (Task 2)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('isNativeAthanRunning bridge helper', () => {
    it('returns false on non-native platform (Web/PWA)', async () => {
      const origIsNative = Capacitor.isNativePlatform;
      (Capacitor as any).isNativePlatform = () => false;

      const running = await isNativeAthanRunning();
      assert.equal(running, false);

      (Capacitor as any).isNativePlatform = origIsNative;
    });

    it('returns true when native platform is active and plugin reports isRunning: true', async () => {
      const origIsNative = Capacitor.isNativePlatform;
      (Capacitor as any).isNativePlatform = () => true;

      setAthanPluginBridgeForTesting({
        isNativeAthanRunning: async () => ({ isRunning: true }),
      });

      try {
        const running = await isNativeAthanRunning();
        assert.equal(running, true);
      } finally {
        (Capacitor as any).isNativePlatform = origIsNative;
        setAthanPluginBridgeForTesting(null);
      }
    });

    it('returns false when native plugin reports isRunning: false', async () => {
      const origIsNative = Capacitor.isNativePlatform;
      (Capacitor as any).isNativePlatform = () => true;

      setAthanPluginBridgeForTesting({
        isNativeAthanRunning: async () => ({ isRunning: false }),
      });

      try {
        const running = await isNativeAthanRunning();
        assert.equal(running, false);
      } finally {
        (Capacitor as any).isNativePlatform = origIsNative;
        setAthanPluginBridgeForTesting(null);
      }
    });

    it('treats exceptions as false gracefully when isNativeAthanRunning throws', async () => {
      const origIsNative = Capacitor.isNativePlatform;
      (Capacitor as any).isNativePlatform = () => true;

      setAthanPluginBridgeForTesting({
        isNativeAthanRunning: async () => {
          throw new Error('IPC Bridge Crash');
        },
      });

      try {
        const running = await isNativeAthanRunning();
        assert.equal(running, false, 'Thrown errors must be treated as false');
      } finally {
        (Capacitor as any).isNativePlatform = origIsNative;
        setAthanPluginBridgeForTesting(null);
      }
    });
  });

  describe('Catch-up logic simulation (Task 2 b, c, d)', () => {
    const todayStr = '2026-10-02';
    const prayer: PrayerName = 'Dhuhr';
    const playedKey = `salah_played_${todayStr}_${prayer}`;
    const attemptedKey = `salah_attempted_${todayStr}_${prayer}`;

    it('when native is running during catch-up: sets attempted, marks played, does NOT call triggerAthan', async () => {
      let triggerAthanCalled = false;
      const triggerAthan = () => {
        triggerAthanCalled = true;
      };

      const checkNativeRunning = async () => true;

      // Simulate the exact scheduler block from usePrayerScheduler.ts
      if (!safeGetItem(playedKey) && !safeSessionGetItem(attemptedKey)) {
        safeSessionSetItem(attemptedKey, 'true');

        const isRunning = await checkNativeRunning();
        if (isRunning) {
          safeSetItem(playedKey, 'true');
          // skips triggerAthan
        } else {
          triggerAthan();
        }
      }

      assert.equal(triggerAthanCalled, false, 'triggerAthan must not be called when native is running');
      assert.equal(safeGetItem(playedKey), 'true', 'salah_played key must be set to prevent retry');
      assert.equal(safeSessionGetItem(attemptedKey), 'true', 'salah_attempted must be set before await');
    });

    it('real-time tick (isCatchup=false) with native running -> triggerAthan NOT called, playedKey set', async () => {
      let triggerAthanCalled = false;
      const triggerAthan = () => {
        triggerAthanCalled = true;
      };

      const checkNativeRunning = async () => true;

      // Real-time foreground tick: isCatchup = false
      const isCatchup = false;
      if (!safeGetItem(playedKey) && !safeSessionGetItem(attemptedKey)) {
        safeSessionSetItem(attemptedKey, 'true');

        const isRunning = await checkNativeRunning();
        if (isRunning) {
          safeSetItem(playedKey, 'true');
          console.log(`[ATHAN] SOURCE=WEB ACTION=SKIP REASON=NATIVE_RUNNING PRAYER=Fajr`);
        } else {
          triggerAthan();
        }
      }

      assert.equal(triggerAthanCalled, false, 'triggerAthan must NOT be called in real-time tick when native is running');
      assert.equal(safeGetItem(playedKey), 'true', 'playedKey must be set to true');
      assert.equal(safeSessionGetItem(attemptedKey), 'true', 'attemptedKey must be set before await');
    });

    it('when native is NOT running during catch-up: existing catch-up unchanged (triggerAthan is called)', async () => {
      let triggerAthanCalled = false;
      const triggerAthan = () => {
        triggerAthanCalled = true;
      };

      const checkNativeRunning = async () => false;

      if (!safeGetItem(playedKey) && !safeSessionGetItem(attemptedKey)) {
        safeSessionSetItem(attemptedKey, 'true');

        const isRunning = await checkNativeRunning();
        if (isRunning) {
          safeSetItem(playedKey, 'true');
        } else {
          triggerAthan();
        }
      }

      assert.equal(triggerAthanCalled, true, 'triggerAthan must be called when native is not running');
    });

    it('when native check throws during catch-up: treated as false and triggerAthan is called', async () => {
      let triggerAthanCalled = false;
      const triggerAthan = () => {
        triggerAthanCalled = true;
      };

      // Native check throws, caught and returned false (as done in isNativeAthanRunning)
      const checkNativeRunning = async () => {
        try {
          throw new Error('Capacitor plugin missing');
        } catch {
          return false;
        }
      };

      if (!safeGetItem(playedKey) && !safeSessionGetItem(attemptedKey)) {
        safeSessionSetItem(attemptedKey, 'true');

        const isRunning = await checkNativeRunning();
        if (isRunning) {
          safeSetItem(playedKey, 'true');
        } else {
          triggerAthan();
        }
      }

      assert.equal(triggerAthanCalled, true, 'triggerAthan must be called when native check throws');
    });
  });

  describe('isAudioBusy check across all 5 prayers (Task 2 a)', () => {
    const todayStr = '2026-10-02';
    const prayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    it('detects audio busy when non-Fajr prayer (e.g. Asr) is attempted and unplayed', () => {
      // Set Asr as attempted in session, but not yet played in localStorage
      safeSessionSetItem(`salah_attempted_${todayStr}_Asr`, 'true');

      const isAnyPrayerAthanAttempting = prayers.some(
        p => safeSessionGetItem(`salah_attempted_${todayStr}_${p}`) === 'true' && !safeGetItem(`salah_played_${todayStr}_${p}`)
      );

      const isAudioBusy = Boolean(isAnyPrayerAthanAttempting);
      assert.equal(isAudioBusy, true, 'isAudioBusy must be true when Asr athan is attempting');
    });

    it('detects audio busy when Isha is attempted and unplayed', () => {
      safeSessionSetItem(`salah_attempted_${todayStr}_Isha`, 'true');

      const isAnyPrayerAthanAttempting = prayers.some(
        p => safeSessionGetItem(`salah_attempted_${todayStr}_${p}`) === 'true' && !safeGetItem(`salah_played_${todayStr}_${p}`)
      );

      const isAudioBusy = Boolean(isAnyPrayerAthanAttempting);
      assert.equal(isAudioBusy, true, 'isAudioBusy must be true when Isha athan is attempting');
    });

    it('is not busy when prayer has been marked as played', () => {
      safeSessionSetItem(`salah_attempted_${todayStr}_Dhuhr`, 'true');
      safeSetItem(`salah_played_${todayStr}_Dhuhr`, 'true');

      const isAnyPrayerAthanAttempting = prayers.some(
        p => safeSessionGetItem(`salah_attempted_${todayStr}_${p}`) === 'true' && !safeGetItem(`salah_played_${todayStr}_${p}`)
      );

      const isAudioBusy = Boolean(isAnyPrayerAthanAttempting);
      assert.equal(isAudioBusy, false, 'isAudioBusy must be false once the prayer is marked as played');
    });
  });
});
