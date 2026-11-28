/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Capacitor } from '@capacitor/core';
import { executeCustomAlarmTrigger } from './useCustomAlarmTrigger';
import { setKhushuPluginBridgeForTesting } from '../services/khushuModePlugin';
import { AlarmConfig } from '../types';

describe('useCustomAlarmTrigger - Item A Native Guard & Origin Tagging', () => {
  let origIsNative: () => boolean;
  let activateCalls: Array<{ mode: string; durationMinutes: number; origin?: string }> = [];

  beforeEach(() => {
    origIsNative = Capacitor.isNativePlatform;
    activateCalls = [];
    setKhushuPluginBridgeForTesting({
      activate: async (options) => {
        activateCalls.push(options);
        return { active: true, mode: options.mode, durationMinutes: options.durationMinutes };
      },
    });
  });

  afterEach(() => {
    (Capacitor as any).isNativePlatform = origIsNative;
    setKhushuPluginBridgeForTesting(null);
  });

  const dummyAlarm: AlarmConfig = {
    id: 'test_alarm_1',
    title: 'منبه قيام الليل',
    time: '03:30',
    enabled: true,
    type: 'fixed',
    days: [0, 1, 2, 3, 4, 5, 6],
    soundType: 'silent',
    notifyMode: 'silent',
    autoKhushu: true,
    khushuDurationMinutes: 25,
  };

  it('Native platform: does NOT invoke KhushuMode.activate, leaving deferral to native AlarmManager', async () => {
    (Capacitor as any).isNativePlatform = () => true;

    let activeModal: any = null;
    let toastMsg: string | null = null;
    const globalAudioRef = { current: null };

    executeCustomAlarmTrigger({
      alarm: dummyAlarm,
      globalAudioRef,
      audioVolume: 0.8,
      setActiveRingingAlarm: (val: any) => {
        activeModal = typeof val === 'function' ? val(null) : val;
      },
      setToastMessage: (msg: string) => {
        toastMsg = msg;
      },
    });

    // Wait a tick for dynamic import resolution
    await new Promise((resolve) => setTimeout(resolve, 50));

    // KhushuMode.activate MUST NOT have been called on native platform!
    assert.equal(activateCalls.length, 0, 'Native platform should NOT trigger KhushuMode.activate from JS');

    // Modal and toast must still function properly
    assert.ok(activeModal !== null, 'Modal should still be activated');
    assert.equal(activeModal.id, 'test_alarm_1');
    assert.equal(toastMsg, '⏰ منبه قيام الليل');
  });

  it('Web/PWA platform: invokes KhushuMode.activate with origin="js_foreground"', async () => {
    (Capacitor as any).isNativePlatform = () => false;

    let activeModal: any = null;
    let toastMsg: string | null = null;
    const globalAudioRef = { current: null };

    executeCustomAlarmTrigger({
      alarm: dummyAlarm,
      globalAudioRef,
      audioVolume: 0.8,
      setActiveRingingAlarm: (val: any) => {
        activeModal = typeof val === 'function' ? val(null) : val;
      },
      setToastMessage: (msg: string) => {
        toastMsg = msg;
      },
    });

    // Wait a tick for dynamic import resolution
    await new Promise((resolve) => setTimeout(resolve, 50));

    // KhushuMode.activate MUST be called on Web/PWA platform
    assert.equal(activateCalls.length, 1, 'Web/PWA platform should trigger KhushuMode.activate');
    assert.equal(activateCalls[0].mode, 'silent');
    assert.equal(activateCalls[0].durationMinutes, 25);
    assert.equal(activateCalls[0].origin, 'js_foreground', 'Origin must explicitly be js_foreground');

    assert.ok(activeModal !== null);
    assert.equal(toastMsg, '⏰ منبه قيام الليل');
  });

  it('Web/PWA platform with autoKhushu=false: does NOT invoke KhushuMode.activate', async () => {
    (Capacitor as any).isNativePlatform = () => false;

    executeCustomAlarmTrigger({
      alarm: { ...dummyAlarm, autoKhushu: false },
      globalAudioRef: { current: null },
      audioVolume: 0.8,
      setActiveRingingAlarm: () => {},
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(activateCalls.length, 0);
  });
});
