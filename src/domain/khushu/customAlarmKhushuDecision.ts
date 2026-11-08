/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NOTE (Classification): TS_SPEC_MIRROR
 * This module mirrors the pure decision logic specified for Android Kotlin
 * (CustomAlarmKhushuDecision.kt). It tests the algorithm specification in TypeScript,
 * NOT the live Android Kotlin runtime.
 */

export interface CustomAlarmKhushuInput {
  autoKhushu: boolean;
  soundType: string;
  notifyMode: string;
  measuredDurationMs: number | null; // null or <= 0 indicates failure/unmeasured
  isKhushuAlreadyActive?: boolean;
}

export interface CustomAlarmKhushuResult {
  shouldScheduleKhushu: boolean;
  isImmediate: boolean;
  delayMs: number;
  isEstimated: boolean;
  logEvent: 'NO_KHUSHU_SCHEDULED' | 'KHUSHU_ALREADY_ACTIVE' | 'KHUSHU_ACTIVATED' | 'KHUSHU_DEFERRED' | 'AUDIO_ERROR';
  reason: string;
}

export type OverlapResolution =
  | 'PROCEED_NORMAL'
  | 'MAINTAIN_PENDING_A'
  | 'PREEMPT_IMMEDIATE_B'
  | 'RESCHEDULE_FOR_B';

export const FALLBACK_ERROR_DELAY_MS = 5000;
export const SAFETY_MARGIN_MS = 1500;

export function evaluateCustomAlarmKhushuDecision(input: CustomAlarmKhushuInput): CustomAlarmKhushuResult {
  if (!input.autoKhushu) {
    return {
      shouldScheduleKhushu: false,
      isImmediate: false,
      delayMs: 0,
      isEstimated: false,
      logEvent: 'NO_KHUSHU_SCHEDULED',
      reason: 'auto_khushu_disabled',
    };
  }

  if (input.isKhushuAlreadyActive) {
    return {
      shouldScheduleKhushu: false,
      isImmediate: false,
      delayMs: 0,
      isEstimated: false,
      logEvent: 'KHUSHU_ALREADY_ACTIVE',
      reason: 'already_active_ignore_duplicate',
    };
  }

  const cleanSound = (input.soundType || '').toLowerCase().trim();
  const isSilentOrVibrate = cleanSound === 'silent' || cleanSound === 'vibrate';
  const isNotificationOnly = (input.notifyMode || '').toLowerCase().trim() === 'notification';

  if (isSilentOrVibrate || isNotificationOnly) {
    return {
      shouldScheduleKhushu: true,
      isImmediate: true,
      delayMs: 0,
      isEstimated: false,
      logEvent: 'KHUSHU_ACTIVATED',
      reason: isSilentOrVibrate ? 'silent_or_vibrate_sound' : 'notification_only_mode',
    };
  }

  const duration = input.measuredDurationMs;
  if (duration === null || duration === undefined || duration <= 0) {
    return {
      shouldScheduleKhushu: true,
      isImmediate: false,
      delayMs: FALLBACK_ERROR_DELAY_MS,
      isEstimated: true,
      logEvent: 'AUDIO_ERROR',
      reason: 'duration_unmeasured_fallback_5s',
    };
  }

  const delay = duration + SAFETY_MARGIN_MS;
  return {
    shouldScheduleKhushu: true,
    isImmediate: false,
    delayMs: delay,
    isEstimated: true,
    logEvent: 'KHUSHU_DEFERRED',
    reason: 'awaiting_sound_completion',
  };
}

export function resolveAlarmOverlap(
  hasPendingDeferredA: boolean,
  incomingAlarmB: CustomAlarmKhushuInput
): OverlapResolution {
  if (!hasPendingDeferredA) {
    return 'PROCEED_NORMAL';
  }

  if (!incomingAlarmB.autoKhushu) {
    return 'MAINTAIN_PENDING_A';
  }

  const cleanSound = (incomingAlarmB.soundType || '').toLowerCase().trim();
  const isBImmediate =
    cleanSound === 'silent' ||
    cleanSound === 'vibrate' ||
    (incomingAlarmB.notifyMode || '').toLowerCase().trim() === 'notification';

  if (isBImmediate) {
    return 'PREEMPT_IMMEDIATE_B';
  }

  return 'RESCHEDULE_FOR_B';
}
