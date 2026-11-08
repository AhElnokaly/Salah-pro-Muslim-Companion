/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NOTE (Classification): TS_SPEC_MIRROR
 * This test suite validates the algorithm specification of the custom alarm Khushu decision logic.
 * It tests the pure TypeScript specification mirror, NOT the live Android Kotlin runtime.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  evaluateCustomAlarmKhushuDecision,
  resolveAlarmOverlap,
  CustomAlarmKhushuInput,
} from './customAlarmKhushuDecision';

describe('R12a - Custom Alarm Khushu Decision Logic (TS_SPEC_MIRROR)', () => {
  describe('1. Auto-Khushu Disabled', () => {
    it('does not schedule khushu when autoKhushu is false', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: false,
        soundType: 'reminder',
        notifyMode: 'both',
        measuredDurationMs: 3000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, false);
      assert.strictEqual(res.delayMs, 0);
      assert.strictEqual(res.logEvent, 'NO_KHUSHU_SCHEDULED');
      assert.strictEqual(res.reason, 'auto_khushu_disabled');
    });
  });

  describe('2. Immediate Activation Paths (Silent, Vibrate, Notification-only)', () => {
    it('activates immediately when soundType is silent', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'silent',
        notifyMode: 'both',
        measuredDurationMs: 3000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, true);
      assert.strictEqual(res.delayMs, 0);
      assert.strictEqual(res.isEstimated, false);
      assert.strictEqual(res.logEvent, 'KHUSHU_ACTIVATED');
    });

    it('activates immediately when soundType is vibrate', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'vibrate',
        notifyMode: 'both',
        measuredDurationMs: 3000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, true);
      assert.strictEqual(res.delayMs, 0);
      assert.strictEqual(res.logEvent, 'KHUSHU_ACTIVATED');
    });

    it('activates immediately when notifyMode is notification only', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'reminder',
        notifyMode: 'notification',
        measuredDurationMs: 3000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, true);
      assert.strictEqual(res.delayMs, 0);
      assert.strictEqual(res.logEvent, 'KHUSHU_ACTIVATED');
      assert.strictEqual(res.reason, 'notification_only_mode');
    });
  });

  describe('3. Audible Sound Path (Estimated Delay with Safety Margin)', () => {
    it('defers khushu by measured duration + 1500ms safety margin', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'reminder',
        notifyMode: 'both',
        measuredDurationMs: 3200,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, false);
      assert.strictEqual(res.isEstimated, true);
      assert.strictEqual(res.delayMs, 4700); // 3200 + 1500
      assert.strictEqual(res.logEvent, 'KHUSHU_DEFERRED');
      assert.strictEqual(res.reason, 'awaiting_sound_completion');
    });

    it('defers long audio (e.g. Ayat Kursi 45s) without arbitrary ceiling truncation', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'ayat_kursi',
        notifyMode: 'both',
        measuredDurationMs: 45000,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.delayMs, 46500); // 45000 + 1500, no arbitrary 60s clamp
      assert.strictEqual(res.shouldScheduleKhushu, true);
    });
  });

  describe('4. Resource Failure & Unmeasured Duration Fallback', () => {
    it('falls back to 5000ms delay with AUDIO_ERROR when duration is null', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'missing_res',
        notifyMode: 'both',
        measuredDurationMs: null,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, true);
      assert.strictEqual(res.isImmediate, false);
      assert.strictEqual(res.delayMs, 5000);
      assert.strictEqual(res.logEvent, 'AUDIO_ERROR');
      assert.strictEqual(res.reason, 'duration_unmeasured_fallback_5s');
    });

    it('falls back to 5000ms delay with AUDIO_ERROR when duration is <= 0', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'corrupt',
        notifyMode: 'both',
        measuredDurationMs: 0,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.delayMs, 5000);
      assert.strictEqual(res.logEvent, 'AUDIO_ERROR');
    });
  });

  describe('5. Khushu Already Active (Idempotency Guard)', () => {
    it('ignores duplicate request without resetting timer if khushu is already active', () => {
      const input: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'reminder',
        notifyMode: 'both',
        measuredDurationMs: 3000,
        isKhushuAlreadyActive: true,
      };
      const res = evaluateCustomAlarmKhushuDecision(input);
      assert.strictEqual(res.shouldScheduleKhushu, false);
      assert.strictEqual(res.logEvent, 'KHUSHU_ALREADY_ACTIVE');
      assert.strictEqual(res.reason, 'already_active_ignore_duplicate');
    });
  });

  describe('6. Overlap Resolution Between Two Custom Alarms', () => {
    it('maintains pending deferred A if incoming alarm B has autoKhushu=false', () => {
      const incomingB: CustomAlarmKhushuInput = {
        autoKhushu: false,
        soundType: 'reminder',
        notifyMode: 'both',
        measuredDurationMs: 2000,
      };
      const resolution = resolveAlarmOverlap(true, incomingB);
      assert.strictEqual(resolution, 'MAINTAIN_PENDING_A');
    });

    it('preempts immediately if incoming alarm B is immediate with autoKhushu=true', () => {
      const incomingB: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'silent',
        notifyMode: 'both',
        measuredDurationMs: 0,
      };
      const resolution = resolveAlarmOverlap(true, incomingB);
      assert.strictEqual(resolution, 'PREEMPT_IMMEDIATE_B');
    });

    it('reschedules delay for B if incoming alarm B has its own audible sound with autoKhushu=true', () => {
      const incomingB: CustomAlarmKhushuInput = {
        autoKhushu: true,
        soundType: 'takbeer',
        notifyMode: 'both',
        measuredDurationMs: 6000,
      };
      const resolution = resolveAlarmOverlap(true, incomingB);
      assert.strictEqual(resolution, 'RESCHEDULE_FOR_B');
    });
  });
});
