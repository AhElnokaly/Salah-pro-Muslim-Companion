/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NOTE (Classification): TS_SPEC_MIRROR
 * This test suite validates the algorithm specification of AlertDuringKhushuPolicy.
 * It tests the pure TypeScript specification mirror, NOT the live Android Kotlin runtime.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  evaluateAlertDuringKhushuPolicy,
  AlertPolicyInput,
  POSTALERT_SILENT_CHANNEL_ID,
  POSTALERT_CHANNEL_ID,
  CUSTOM_ALARM_SILENT_CHANNEL_ID,
  CUSTOM_ALARM_CHANNEL_ID,
} from './alertDuringKhushuPolicy';

describe('R12c - Alert During Active Khushu Policy (TS_SPEC_MIRROR)', () => {
  describe('1. Friday Scenario: Post-prayer alert at +10m during Khushu (+5m to +50m)', () => {
    it('silences audio, routes to silent channel, and never schedules Khushu', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'reminder',
        notifyMode: 'both',
        isKhushuActive: true,
        autoKhushu: false,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);

      assert.strictEqual(res.effectiveIsSilent, true);
      assert.strictEqual(res.soundUriRequired, false);
      assert.strictEqual(res.channelId, POSTALERT_SILENT_CHANNEL_ID);
      assert.strictEqual(res.shouldScheduleKhushu, false);
      assert.strictEqual(res.reason, 'muted_for_khushu');
      assert.strictEqual(res.logDescription, 'sound muted for khushu');
    });
  });

  describe('2. Custom alarm audible during Khushu', () => {
    it('silences audio to CUSTOM_ALARM_SILENT_CHANNEL_ID and suppresses duplicate Khushu scheduling', () => {
      const input: AlertPolicyInput = {
        alarmType: 'custom',
        soundType: 'reminder',
        notifyMode: 'both',
        isKhushuActive: true,
        autoKhushu: true,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);

      assert.strictEqual(res.effectiveIsSilent, true);
      assert.strictEqual(res.soundUriRequired, false);
      assert.strictEqual(res.channelId, CUSTOM_ALARM_SILENT_CHANNEL_ID);
      assert.strictEqual(res.shouldScheduleKhushu, false);
      assert.strictEqual(res.reason, 'muted_for_khushu');
      assert.strictEqual(res.logDescription, 'sound muted for khushu');
    });
  });

  describe('3. Postalert audible during Khushu', () => {
    it('silences audio to POSTALERT_SILENT_CHANNEL_ID', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'takbeer',
        notifyMode: 'sound',
        isKhushuActive: true,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);

      assert.strictEqual(res.effectiveIsSilent, true);
      assert.strictEqual(res.soundUriRequired, false);
      assert.strictEqual(res.channelId, POSTALERT_SILENT_CHANNEL_ID);
      assert.strictEqual(res.reason, 'muted_for_khushu');
    });
  });

  describe('4. Alert outside Khushu (normal behavior)', () => {
    it('plays sound normally and uses sound channel for postalert', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'reminder',
        notifyMode: 'both',
        isKhushuActive: false,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);

      assert.strictEqual(res.effectiveIsSilent, false);
      assert.strictEqual(res.soundUriRequired, true);
      assert.strictEqual(res.channelId, `${POSTALERT_CHANNEL_ID}_reminder`);
      assert.strictEqual(res.reason, 'normal_playback');
      assert.strictEqual(res.logDescription, 'sound: reminder');
    });

    it('custom alarm outside Khushu schedules Khushu if autoKhushu is true', () => {
      const input: AlertPolicyInput = {
        alarmType: 'custom',
        soundType: 'fajr_short',
        notifyMode: 'both',
        isKhushuActive: false,
        autoKhushu: true,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);

      assert.strictEqual(res.effectiveIsSilent, false);
      assert.strictEqual(res.soundUriRequired, true);
      assert.strictEqual(res.channelId, `${CUSTOM_ALARM_CHANNEL_ID}_fajr_short`);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.reason, 'normal_playback');
    });
  });

  describe('5. autoKhushu=false during Khushu', () => {
    it('silences audio and does not schedule Khushu', () => {
      const input: AlertPolicyInput = {
        alarmType: 'custom',
        soundType: 'reminder',
        notifyMode: 'both',
        isKhushuActive: true,
        autoKhushu: false,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);

      assert.strictEqual(res.shouldScheduleKhushu, false);
      assert.strictEqual(res.effectiveIsSilent, true);
    });
  });

  describe('6. silent or notification mode during Khushu (configured_silent)', () => {
    it('preserves configured_silent reason for soundType=silent', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'silent',
        notifyMode: 'both',
        isKhushuActive: true,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);

      assert.strictEqual(res.effectiveIsSilent, true);
      assert.strictEqual(res.reason, 'configured_silent');
      assert.strictEqual(res.logDescription, 'sound configured silent');
    });

    it('preserves configured_silent reason for notifyMode=notification', () => {
      const input: AlertPolicyInput = {
        alarmType: 'custom',
        soundType: 'reminder',
        notifyMode: 'notification',
        isKhushuActive: true,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);

      assert.strictEqual(res.effectiveIsSilent, true);
      assert.strictEqual(res.reason, 'configured_silent');
      assert.strictEqual(res.logDescription, 'sound configured silent');
    });

    it('preserves configured_silent reason for soundType=vibrate', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'vibrate',
        notifyMode: 'both',
        isKhushuActive: true,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);

      assert.strictEqual(res.effectiveIsSilent, true);
      assert.strictEqual(res.reason, 'configured_silent');
    });
  });

  describe('7. Direct Vibration Decisions (R12c-2)', () => {
    it('(1) active Khushu + silent ringer (0) + audible alert => triggers direct vibration', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'reminder',
        notifyMode: 'both',
        isKhushuActive: true,
        ringerMode: 0,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);
      assert.strictEqual(res.shouldTriggerDirectVibrate, true);
      assert.strictEqual(res.effectiveIsSilent, true);
      assert.strictEqual(res.reason, 'muted_for_khushu');
    });

    it('(2) active Khushu + silent ringer (0) + soundType=silent => false (no direct vibrate)', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'silent',
        notifyMode: 'both',
        isKhushuActive: true,
        ringerMode: 0,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);
      assert.strictEqual(res.shouldTriggerDirectVibrate, false);
      assert.strictEqual(res.reason, 'configured_silent');
    });

    it('(2b) active Khushu + silent ringer (0) + soundType=vibrate => false (no direct vibrate)', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'vibrate',
        notifyMode: 'both',
        isKhushuActive: true,
        ringerMode: 0,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);
      assert.strictEqual(res.shouldTriggerDirectVibrate, false);
    });

    it('(2c) active Khushu + silent ringer (0) + notifyMode=notification => false (no direct vibrate)', () => {
      const input: AlertPolicyInput = {
        alarmType: 'custom',
        soundType: 'reminder',
        notifyMode: 'notification',
        isKhushuActive: true,
        ringerMode: 0,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);
      assert.strictEqual(res.shouldTriggerDirectVibrate, false);
    });

    it('(3) active Khushu + ringerMode=-1 => false (no direct vibrate)', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'reminder',
        notifyMode: 'both',
        isKhushuActive: true,
        ringerMode: -1,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);
      assert.strictEqual(res.shouldTriggerDirectVibrate, false);
    });

    it('(4) active Khushu + ringerMode=1 (Vibrate) => false (channel handles vibration natively)', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'reminder',
        notifyMode: 'both',
        isKhushuActive: true,
        ringerMode: 1,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);
      assert.strictEqual(res.shouldTriggerDirectVibrate, false);
    });

    it('(5) active Khushu + ringerMode=2 (Normal) => false (no direct vibrate needed)', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'reminder',
        notifyMode: 'both',
        isKhushuActive: true,
        ringerMode: 2,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);
      assert.strictEqual(res.shouldTriggerDirectVibrate, false);
    });

    it('(6) inactive Khushu + ringerMode=0 => false (normal outside-Khushu alert flow)', () => {
      const input: AlertPolicyInput = {
        alarmType: 'postalert',
        soundType: 'reminder',
        notifyMode: 'both',
        isKhushuActive: false,
        ringerMode: 0,
      };
      const res = evaluateAlertDuringKhushuPolicy(input);
      assert.strictEqual(res.shouldTriggerDirectVibrate, false);
    });
  });
});
