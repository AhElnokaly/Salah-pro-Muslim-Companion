/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { isNativeAthanRunning, setAthanPluginBridgeForTesting } from '../services/athanAlarmPlugin';
import { Capacitor } from '@capacitor/core';
import { safeSetItem, safeGetItem, safeSessionSetItem, safeSessionGetItem } from '../utils/storage';
import { AlarmConfig, PrayerName, RelativePrayerTarget } from '../types';
import { buildCustomAlarmNativeKey, RingDiagnosticEvent } from '../services/athanAlarmPlugin';
import {
  PendingCustomAlarmItem,
  resolveAndDispatchPendingCustomAlarms,
  RING_DIAG_READ_TIMEOUT_MS,
} from './customAlarmReplayGuard';

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

  describe('AT-DUP-REPLAY: no JS replay of custom alarm that already fired natively', () => {
    const salawatAlarm: AlarmConfig = {
      id: 'custom_alarm_1794234903378',
      title: 'صلاة على النبي',
      enabled: true,
      type: 'prayer_relative',
      prayers: ['Dhuhr'],
      relation: 'before',
      offsetMinutes: 15,
      offsetUnit: 'minutes',
      days: [0, 1, 2, 3, 4, 5, 6],
      soundType: 'salawat',
      notifyMode: 'both',
    };

    function makePending(
      alarm: AlarmConfig,
      checkDate: Date,
      targetPrayer?: RelativePrayerTarget,
      prayerTimeStr?: string,
      priority: number = 850
    ): PendingCustomAlarmItem {
      const yyyy = checkDate.getFullYear();
      const mm = String(checkDate.getMonth() + 1).padStart(2, '0');
      const dd = String(checkDate.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;
      const triggeredKey = targetPrayer
        ? `salah_triggered_${alarm.id}_${targetPrayer}_${todayStr}`
        : `salah_triggered_${alarm.id}_${todayStr}`;
      return { alarm, targetPrayer, prayerTimeStr, triggeredKey, priority };
    }

    it('suppresses JS replay when native custom_notif_post fired 79.5 s earlier (device log replay) and logs js_replay_suppressed', async () => {
      // Exact local date where Dhuhr = 11:51 and before-15m scheduled at 11:36:00
      const appOpenDate = new Date(2026, 10, 20, 11, 37, 19, 748);
      const scheduledBase = new Date(2026, 10, 20, 11, 36, 0, 0);
      const scheduledMs = scheduledBase.getTime();
      const nativeKey = `custom_custom_alarm_1794234903378_dhuhr_${scheduledMs}`;

      const nativeLogs: RingDiagnosticEvent[] = [
        {
          timeMs: scheduledMs + 224,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: nativeKey,
          stage: 'custom_notif_post',
          details: 'soundType=salawat, notifyMode=both, channelId=salah_custom_alarms_salawat, isKhushuActive=false, silent=false',
        },
        {
          timeMs: scheduledMs + 50,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: nativeKey,
          stage: 'receiver_on_receive',
          details: 'requestCode=4242, soundType=salawat, notifyMode=both',
        },
      ];

      const dispatched: Array<{ alarmId: string; role: string }> = [];
      const loggedDiag: RingDiagnosticEvent[] = [];
      const inFlightKeys = new Set<string>();
      const item = makePending(salawatAlarm, appOpenDate, 'Dhuhr', '11:51');

      const result = await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [item],
        checkDate: appOpenDate,
        inFlightKeys,
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => nativeLogs,
        logDiag: (ev) => loggedDiag.push(ev),
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem, role) => dispatched.push({ alarmId: dispItem.alarm.id, role }),
      });

      assert.equal(dispatched.length, 0, 'JS must NOT dispatch or play sound again');
      assert.equal(result.playable.length, 0);
      assert.equal(result.suppressed.length, 1);
      assert.equal(safeGetItem(item.triggeredKey), 'true');
      assert.equal(loggedDiag.length, 1);
      assert.equal(loggedDiag[0].stage, 'js_replay_suppressed');
      assert.equal(loggedDiag[0].alarmId, salawatAlarm.id);
      assert.ok(loggedDiag[0].details?.includes(`matchedKey=${nativeKey}`));
    });

    it('does NOT suppress when app opens before scheduled time and plays normally when due', async () => {
      const checkBefore = new Date(2026, 10, 20, 11, 35, 0, 0);
      const checkAtDue = new Date(2026, 10, 20, 11, 36, 5, 0);

      // Suppose a previous day's fire exists in the log, NOT today's scheduled timestamp
      const yesterdayMs = new Date(2026, 10, 19, 11, 36, 0, 0).getTime();
      const nativeLogs: RingDiagnosticEvent[] = [
        {
          timeMs: yesterdayMs + 100,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: buildCustomAlarmNativeKey({ alarmId: salawatAlarm.id, timeMs: yesterdayMs, targetPrayer: 'dhuhr' }),
          stage: 'custom_notif_post',
          details: 'soundType=salawat, notifyMode=both, silent=false',
        },
      ];

      const dispatched: string[] = [];
      const loggedDiag: RingDiagnosticEvent[] = [];
      const inFlightKeys = new Set<string>();

      // Before scheduled time: scheduler has 0 pending items (diff < 0), no suppression recorded
      const beforeResult = await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [] as PendingCustomAlarmItem[],
        checkDate: checkBefore,
        inFlightKeys,
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => nativeLogs,
        logDiag: (ev) => loggedDiag.push(ev),
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatched.push(dispItem.alarm.id),
      });
      assert.equal(beforeResult.suppressed.length, 0);

      // At due time without a native fire for today: plays normally
      const dueItem = makePending(salawatAlarm, checkAtDue, 'Dhuhr', '11:51');
      const dueResult = await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [dueItem],
        checkDate: checkAtDue,
        inFlightKeys,
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => nativeLogs,
        logDiag: (ev) => loggedDiag.push(ev),
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatched.push(dispItem.alarm.id),
      });

      assert.deepEqual(dispatched, [salawatAlarm.id]);
      assert.equal(dueResult.suppressed.length, 0);
      assert.equal(loggedDiag.length, 0);
    });

    it('matches per alarm (not per minute): two different custom alarms at the same minute both play, or only the natively-fired one is suppressed', async () => {
      const checkAtDue = new Date(2026, 10, 20, 11, 36, 20, 0);
      const scheduledMs = new Date(2026, 10, 20, 11, 36, 0, 0).getTime();

      const otherAlarmSameMinute: AlarmConfig = {
        ...salawatAlarm,
        id: 'custom_alarm_other_8888',
        title: 'ذكر آخر',
        type: 'fixed',
        prayers: undefined,
        time: '11:36',
      };

      const itemA = makePending(salawatAlarm, checkAtDue, 'Dhuhr', '11:51', 850);
      const itemB = makePending(otherAlarmSameMinute, checkAtDue, undefined, undefined, 450);

      // 1) Neither fired natively -> both dispatched (primary + secondary)
      const dispatchedBoth: Array<{ id: string; role: string }> = [];
      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [itemA, itemB],
        checkDate: checkAtDue,
        inFlightKeys: new Set<string>(),
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => [],
        logDiag: () => {},
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem, role) => dispatchedBoth.push({ id: dispItem.alarm.id, role }),
      });
      assert.equal(dispatchedBoth.length, 2);

      // 2) Reset localStorage; only Alarm A fired natively -> Alarm A suppressed, Alarm B still plays as primary_audible!
      localStorage.clear();
      const dispatchedPartial: Array<{ id: string; role: string }> = [];
      const nativeOnlyA: RingDiagnosticEvent[] = [
        {
          timeMs: scheduledMs + 150,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: buildCustomAlarmNativeKey({ alarmId: salawatAlarm.id, timeMs: scheduledMs, targetPrayer: 'dhuhr' }),
          stage: 'custom_notif_post',
          details: 'soundType=salawat, silent=false',
        },
      ];
      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [itemA, itemB],
        checkDate: checkAtDue,
        inFlightKeys: new Set<string>(),
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => nativeOnlyA,
        logDiag: () => {},
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem, role) => dispatchedPartial.push({ id: dispItem.alarm.id, role }),
      });

      assert.deepEqual(dispatchedPartial, [{ id: otherAlarmSameMinute.id, role: 'primary_audible' }]);
    });

    it('same alarm on the next day (same base id, different scheduled timestamp) plays normally', async () => {
      const day1ScheduledMs = new Date(2026, 10, 20, 11, 36, 0, 0).getTime();
      const day2OpenDate = new Date(2026, 10, 21, 11, 37, 10, 0);

      const day1NativeLogs: RingDiagnosticEvent[] = [
        {
          timeMs: day1ScheduledMs + 224,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: buildCustomAlarmNativeKey({ alarmId: salawatAlarm.id, timeMs: day1ScheduledMs, targetPrayer: 'dhuhr' }),
          stage: 'custom_notif_post',
          details: 'soundType=salawat, notifyMode=both, silent=false',
        },
      ];

      const dispatched: string[] = [];
      const itemDay2 = makePending(salawatAlarm, day2OpenDate, 'Dhuhr', '11:51');

      const res = await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [itemDay2],
        checkDate: day2OpenDate,
        inFlightKeys: new Set<string>(),
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => day1NativeLogs,
        logDiag: () => {},
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatched.push(dispItem.alarm.id),
      });

      assert.deepEqual(dispatched, [salawatAlarm.id]);
      assert.equal(res.suppressed.length, 0);
    });

    it('native silent=true fire (Khushu) still counts as a native fire and suppresses JS replay', async () => {
      const appOpenDate = new Date(2026, 10, 20, 11, 37, 5, 0);
      const scheduledMs = new Date(2026, 10, 20, 11, 36, 0, 0).getTime();
      const nativeKey = buildCustomAlarmNativeKey({
        alarmId: salawatAlarm.id,
        timeMs: scheduledMs,
        targetPrayer: 'dhuhr',
      });

      const nativeLogs: RingDiagnosticEvent[] = [
        {
          timeMs: scheduledMs + 180,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: nativeKey,
          stage: 'custom_notif_post',
          details: 'soundType=salawat, notifyMode=both, channelId=salah_custom_alarms_silent, isKhushuActive=true, silent=true',
        },
      ];

      const dispatched: string[] = [];
      const loggedDiag: RingDiagnosticEvent[] = [];
      const item = makePending(salawatAlarm, appOpenDate, 'Dhuhr', '11:51');

      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [item],
        checkDate: appOpenDate,
        inFlightKeys: new Set<string>(),
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => nativeLogs,
        logDiag: (ev) => loggedDiag.push(ev),
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatched.push(dispItem.alarm.id),
      });

      assert.equal(dispatched.length, 0);
      assert.equal(loggedDiag.length, 1);
      assert.equal(loggedDiag[0].stage, 'js_replay_suppressed');
    });

    it('receiver_on_receive only (without custom_notif_post) does NOT suppress JS playback', async () => {
      const appOpenDate = new Date(2026, 10, 20, 11, 37, 5, 0);
      const scheduledMs = new Date(2026, 10, 20, 11, 36, 0, 0).getTime();
      const nativeKey = buildCustomAlarmNativeKey({
        alarmId: salawatAlarm.id,
        timeMs: scheduledMs,
        targetPrayer: 'dhuhr',
      });

      const receiverOnlyLogs: RingDiagnosticEvent[] = [
        {
          timeMs: scheduledMs + 50,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: nativeKey,
          stage: 'receiver_on_receive',
          details: 'requestCode=4242, soundType=salawat',
        },
      ];

      const dispatched: string[] = [];
      const item = makePending(salawatAlarm, appOpenDate, 'Dhuhr', '11:51');

      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [item],
        checkDate: appOpenDate,
        inFlightKeys: new Set<string>(),
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => receiverOnlyLogs,
        logDiag: () => {},
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatched.push(dispItem.alarm.id),
      });

      assert.deepEqual(dispatched, [salawatAlarm.id]);
    });

    it('fails open and plays when getRingDiagnosticLog throws or exceeds 500ms timeout', async () => {
      assert.equal(RING_DIAG_READ_TIMEOUT_MS, 500);
      const appOpenDate = new Date(2026, 10, 20, 11, 37, 5, 0);

      // 1) Throw -> plays
      const dispatchedOnThrow: string[] = [];
      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [makePending(salawatAlarm, appOpenDate, 'Dhuhr', '11:51')],
        checkDate: appOpenDate,
        inFlightKeys: new Set<string>(),
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => {
          throw new Error('SharedPreferences read failure');
        },
        logDiag: () => {},
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatchedOnThrow.push(dispItem.alarm.id),
      });
      assert.deepEqual(dispatchedOnThrow, [salawatAlarm.id]);

      // 2) Timeout -> plays
      localStorage.clear();
      const dispatchedOnTimeout: string[] = [];
      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [makePending(salawatAlarm, appOpenDate, 'Dhuhr', '11:51')],
        checkDate: appOpenDate,
        inFlightKeys: new Set<string>(),
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: () => new Promise<RingDiagnosticEvent[]>(() => {}),
        logDiag: () => {},
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatchedOnTimeout.push(dispItem.alarm.id),
        timeoutMs: 25,
      });
      assert.deepEqual(dispatchedOnTimeout, [salawatAlarm.id]);
    });

    it('suppresses snooze alarm replay using snooze key format', async () => {
      const checkDate = new Date(2026, 10, 20, 11, 41, 15, 0);
      const scheduledMs = new Date(2026, 10, 20, 11, 41, 0, 0).getTime();
      const snoozeAlarm: AlarmConfig = {
        id: 'snooze_1795167660000',
        snoozeOf: 'custom_alarm_1794234903378',
        title: 'صلاة على النبي (غفوة)',
        enabled: true,
        type: 'fixed',
        oneShot: true,
        fireDate: '2026-11-20',
        time: '11:41',
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'salawat',
        notifyMode: 'both',
      };

      const expectedSnoozeKey = `custom_snooze_${snoozeAlarm.snoozeOf}_${snoozeAlarm.id}_${scheduledMs}`;
      const nativeLogs: RingDiagnosticEvent[] = [
        {
          timeMs: scheduledMs + 120,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: expectedSnoozeKey,
          stage: 'custom_notif_post',
          details: 'soundType=salawat, silent=false',
        },
      ];

      const dispatched: string[] = [];
      const loggedDiag: RingDiagnosticEvent[] = [];
      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [makePending(snoozeAlarm, checkDate)],
        checkDate,
        inFlightKeys: new Set<string>(),
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => nativeLogs,
        logDiag: (ev) => loggedDiag.push(ev),
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatched.push(dispItem.alarm.id),
      });

      assert.equal(dispatched.length, 0);
      assert.equal(loggedDiag.length, 1);
      assert.ok(loggedDiag[0].details?.includes(`matchedKey=${expectedSnoozeKey}`));
    });

    it('does NOT suppress a midnight-crossing relative alarm (ambiguous scheduledTimeMs)', async () => {
      const checkDate = new Date(2026, 10, 20, 0, 10, 15, 0);
      const midnightCrossingAlarm: AlarmConfig = {
        id: 'custom_isha_after_midnight',
        title: 'قيام بعد العشاء',
        enabled: true,
        type: 'prayer_relative',
        prayers: ['Isha'],
        relation: 'after',
        offsetMinutes: 25,
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'reminder',
        notifyMode: 'both',
      };

      const ambiguousMs = new Date(2026, 10, 20, 0, 10, 0, 0).getTime();
      const nativeLogs: RingDiagnosticEvent[] = [
        {
          timeMs: ambiguousMs + 100,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: buildCustomAlarmNativeKey({
            alarmId: midnightCrossingAlarm.id,
            timeMs: ambiguousMs,
            targetPrayer: 'isha',
          }),
          stage: 'custom_notif_post',
          details: 'soundType=reminder, silent=false',
        },
      ];

      const dispatched: string[] = [];
      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [makePending(midnightCrossingAlarm, checkDate, 'Isha', '23:45')],
        checkDate,
        inFlightKeys: new Set<string>(),
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => nativeLogs,
        logDiag: () => {},
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatched.push(dispItem.alarm.id),
      });

      assert.deepEqual(dispatched, [midnightCrossingAlarm.id]);
    });

    it('writes triggeredKey only after decision and prevents duplicate dispatch on concurrent 1s ticks during await', async () => {
      const appOpenDate = new Date(2026, 10, 20, 11, 36, 5, 0);
      const inFlightKeys = new Set<string>();
      const item = makePending(salawatAlarm, appOpenDate, 'Dhuhr', '11:51');

      let resolveRead!: (events: RingDiagnosticEvent[]) => void;
      let readCalls = 0;
      const dispatched: string[] = [];

      const firstTick = resolveAndDispatchPendingCustomAlarms({
        pendingItems: [item],
        checkDate: appOpenDate,
        inFlightKeys,
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: () => {
          readCalls++;
          return new Promise<RingDiagnosticEvent[]>((resolve) => {
            resolveRead = resolve;
          });
        },
        logDiag: () => {},
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatched.push(dispItem.alarm.id),
      });

      // While firstTick is awaiting: triggeredKey must NOT be persisted yet, AND second tick must skip cleanly
      assert.equal(safeGetItem(item.triggeredKey), null, 'triggeredKey must NOT be written before decision');
      assert.equal(inFlightKeys.has(item.triggeredKey), true, 'inFlightKeys must block concurrent ticks');

      const secondTick = await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [item],
        checkDate: appOpenDate,
        inFlightKeys,
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => {
          readCalls++;
          return [];
        },
        logDiag: () => {},
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem) => dispatched.push(dispItem.alarm.id),
      });

      assert.equal(readCalls, 1, 'Second concurrent tick must not re-query or double dispatch');
      assert.equal(secondTick.playable.length, 0);
      assert.equal(secondTick.suppressed.length, 0);

      // Now complete firstTick with empty native log -> single dispatch and triggeredKey written after decision
      resolveRead([]);
      await firstTick;

      assert.deepEqual(dispatched, [salawatAlarm.id]);
      assert.equal(safeGetItem(item.triggeredKey), 'true');
      assert.equal(inFlightKeys.has(item.triggeredKey), false);
    });

    it('setTriggered throwing for suppressed alarm A isolates failure, logs custom_dispatch_error, and still dispatches alarm B', async () => {
      const checkDate = new Date(2026, 10, 20, 11, 36, 15, 0);
      const scheduledMs = new Date(2026, 10, 20, 11, 36, 0, 0).getTime();

      const alarmB: AlarmConfig = {
        ...salawatAlarm,
        id: 'custom_alarm_playable_b',
        title: 'منبه ب',
        type: 'fixed',
        prayers: undefined,
        time: '11:36',
      };

      const itemA = makePending(salawatAlarm, checkDate, 'Dhuhr', '11:51', 850);
      const itemB = makePending(alarmB, checkDate, undefined, undefined, 450);

      const nativeLogs: RingDiagnosticEvent[] = [
        {
          timeMs: scheduledMs + 150,
          source: 'NATIVE',
          alarmType: 'custom',
          alarmId: buildCustomAlarmNativeKey({ alarmId: salawatAlarm.id, timeMs: scheduledMs, targetPrayer: 'dhuhr' }),
          stage: 'custom_notif_post',
          details: 'soundType=salawat, silent=false',
        },
      ];

      const dispatched: Array<{ id: string; role: string }> = [];
      const loggedDiag: RingDiagnosticEvent[] = [];
      const inFlightKeys = new Set<string>();

      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [itemA, itemB],
        checkDate,
        inFlightKeys,
        getTriggered: safeGetItem,
        setTriggered: (key, val) => {
          if (key === itemA.triggeredKey) {
            throw new Error('QuotaExceededError on suppressed A');
          }
          safeSetItem(key, val);
        },
        readRingLog: async () => nativeLogs,
        logDiag: (ev) => loggedDiag.push(ev),
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem, role) => dispatched.push({ id: dispItem.alarm.id, role }),
      });

      assert.deepEqual(dispatched, [{ id: alarmB.id, role: 'primary_audible' }]);
      assert.equal(safeGetItem(itemB.triggeredKey), 'true');
      assert.equal(inFlightKeys.size, 0);
      const errEvent = loggedDiag.find((e) => e.stage === 'custom_dispatch_error' && e.alarmId === salawatAlarm.id);
      assert.ok(errEvent, 'Expected custom_dispatch_error event for alarm A');
      assert.ok(errEvent.details?.includes('QuotaExceededError on suppressed A'));
    });

    it('onDispatch throwing for primary logs custom_dispatch_error, preserves setTriggered before onDispatch, and still dispatches secondary items', async () => {
      const checkDate = new Date(2026, 10, 20, 11, 36, 15, 0);
      const secondaryAlarm: AlarmConfig = {
        ...salawatAlarm,
        id: 'custom_alarm_secondary_1',
        title: 'منبه ثانوي',
        type: 'fixed',
        prayers: undefined,
        time: '11:36',
      };
      const thirdAlarm: AlarmConfig = {
        ...salawatAlarm,
        id: 'custom_alarm_secondary_2',
        title: 'منبه ثالث',
        type: 'fixed',
        prayers: undefined,
        time: '11:36',
      };

      const primaryItem = makePending(salawatAlarm, checkDate, 'Dhuhr', '11:51', 850);
      const secondaryItem1 = makePending(secondaryAlarm, checkDate, undefined, undefined, 450);
      const secondaryItem2 = makePending(thirdAlarm, checkDate, undefined, undefined, 250);

      const eventsOrder: string[] = [];
      const dispatched: Array<{ id: string; role: string }> = [];
      const loggedDiag: RingDiagnosticEvent[] = [];
      const inFlightKeys = new Set<string>();

      await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [primaryItem, secondaryItem1, secondaryItem2],
        checkDate,
        inFlightKeys,
        getTriggered: safeGetItem,
        setTriggered: (key, val) => {
          eventsOrder.push(`set:${key}`);
          safeSetItem(key, val);
        },
        readRingLog: async () => [],
        logDiag: (ev) => loggedDiag.push(ev),
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem, role) => {
          eventsOrder.push(`dispatch:${dispItem.alarm.id}`);
          if (dispItem.alarm.id === salawatAlarm.id) {
            throw new Error('Primary audio playback crash');
          }
          dispatched.push({ id: dispItem.alarm.id, role });
        },
      });

      assert.equal(safeGetItem(primaryItem.triggeredKey), 'true', 'Primary triggeredKey must be written before onDispatch');
      const setPrimaryIdx = eventsOrder.indexOf(`set:${primaryItem.triggeredKey}`);
      const dispPrimaryIdx = eventsOrder.indexOf(`dispatch:${salawatAlarm.id}`);
      assert.ok(setPrimaryIdx >= 0 && dispPrimaryIdx > setPrimaryIdx, 'setTriggered must happen before onDispatch');

      assert.deepEqual(dispatched, [
        { id: secondaryAlarm.id, role: 'secondary_muted' },
        { id: thirdAlarm.id, role: 'secondary_muted' },
      ]);
      assert.equal(safeGetItem(secondaryItem1.triggeredKey), 'true');
      assert.equal(safeGetItem(secondaryItem2.triggeredKey), 'true');
      assert.equal(inFlightKeys.size, 0);

      const errEvent = loggedDiag.find((e) => e.stage === 'custom_dispatch_error' && e.alarmId === salawatAlarm.id);
      assert.ok(errEvent, 'Expected custom_dispatch_error for primary alarm');
      assert.ok(errEvent.details?.includes('Primary audio playback crash'));
    });

    it('treats all candidates as playable (fail-open) when filterCandidates throws', async () => {
      const checkDate = new Date(2026, 10, 20, 11, 36, 15, 0);
      const otherAlarm: AlarmConfig = {
        ...salawatAlarm,
        id: 'custom_alarm_failopen_b',
        title: 'ذكر',
        type: 'fixed',
        prayers: undefined,
        time: '11:36',
      };

      const itemA = makePending(salawatAlarm, checkDate, 'Dhuhr', '11:51', 850);
      const itemB = makePending(otherAlarm, checkDate, undefined, undefined, 450);

      const dispatched: Array<{ id: string; role: string }> = [];
      const loggedDiag: RingDiagnosticEvent[] = [];
      const inFlightKeys = new Set<string>();

      const result = await resolveAndDispatchPendingCustomAlarms({
        pendingItems: [itemA, itemB],
        checkDate,
        inFlightKeys,
        getTriggered: safeGetItem,
        setTriggered: safeSetItem,
        readRingLog: async () => [],
        logDiag: (ev) => loggedDiag.push(ev),
        computeIsAudioBusy: () => false,
        onDispatch: (dispItem, role) => dispatched.push({ id: dispItem.alarm.id, role }),
        filterCandidates: () => {
          throw new Error('Unexpected filter failure');
        },
      });

      assert.equal(result.suppressed.length, 0);
      assert.equal(result.playable.length, 2);
      assert.deepEqual(dispatched, [
        { id: salawatAlarm.id, role: 'primary_audible' },
        { id: otherAlarm.id, role: 'secondary_muted' },
      ]);
      assert.equal(safeGetItem(itemA.triggeredKey), 'true');
      assert.equal(safeGetItem(itemB.triggeredKey), 'true');
      assert.equal(inFlightKeys.size, 0);

      const errEvent = loggedDiag.find((e) => e.stage === 'custom_dispatch_error');
      assert.ok(errEvent);
      assert.ok(errEvent.details?.includes('Unexpected filter failure'));
    });
  });
});
