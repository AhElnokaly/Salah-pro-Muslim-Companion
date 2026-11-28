/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * NOTE (Classification): TS_SPEC_MIRROR
 * This module mirrors the pure decision logic specified for Android Kotlin
 * (AlertDuringKhushuPolicy.kt). It tests the algorithm specification in TypeScript,
 * NOT the live Android Kotlin runtime.
 */

export const CUSTOM_ALARM_SILENT_CHANNEL_ID = 'salah_custom_alarms_silent';
export const CUSTOM_ALARM_CHANNEL_ID = 'salah_custom_alarms';
export const POSTALERT_SILENT_CHANNEL_ID = 'athan_postalert_silent_channel_v3';
export const POSTALERT_CHANNEL_ID = 'athan_postalert_channel_v3';
export const PREALERT_SILENT_CHANNEL_ID = 'athan_prealert_silent_channel_v3';
export const PREALERT_CHANNEL_ID = 'athan_prealert_channel_v3';

export interface AlertPolicyInput {
  alarmType: 'postalert' | 'custom' | 'prealert' | string;
  soundType: string;
  notifyMode?: 'both' | 'sound' | 'notification' | 'silent' | string;
  isKhushuActive: boolean;
  autoKhushu?: boolean;
  ringerMode?: number; // 0 = RINGER_MODE_SILENT, 1 = RINGER_MODE_VIBRATE, 2 = RINGER_MODE_NORMAL
}

export interface AlertPolicyResult {
  effectiveIsSilent: boolean;
  channelId: string;
  soundUriRequired: boolean;
  shouldScheduleKhushu: boolean;
  shouldTriggerDirectVibrate: boolean;
  reason: 'muted_for_khushu' | 'configured_silent' | 'normal_playback';
  logDescription: string;
}

export function evaluateAlertDuringKhushuPolicy(input: AlertPolicyInput): AlertPolicyResult {
  const cleanSound = (input.soundType || '').toLowerCase().trim().replace(/-/g, '_');
  const notifyModeClean = (input.notifyMode || 'both').toLowerCase().trim();
  const isOriginallySilent = cleanSound === 'silent' || cleanSound === 'vibrate' || notifyModeClean === 'notification';
  const isOriginallyAudible = !isOriginallySilent;

  const effectiveIsSilent = input.isKhushuActive ? true : isOriginallySilent;

  let reason: 'muted_for_khushu' | 'configured_silent' | 'normal_playback';
  if (input.isKhushuActive && !isOriginallySilent) {
    reason = 'muted_for_khushu';
  } else if (isOriginallySilent) {
    reason = 'configured_silent';
  } else {
    reason = 'normal_playback';
  }

  let logDescription: string;
  if (reason === 'muted_for_khushu') {
    logDescription = 'sound muted for khushu';
  } else if (reason === 'configured_silent') {
    logDescription = 'sound configured silent';
  } else {
    logDescription = `sound: ${cleanSound}`;
  }

  let channelId: string;
  switch (input.alarmType) {
    case 'custom':
      channelId = effectiveIsSilent ? CUSTOM_ALARM_SILENT_CHANNEL_ID : `${CUSTOM_ALARM_CHANNEL_ID}_${cleanSound}`;
      break;
    case 'postalert':
      channelId = effectiveIsSilent ? POSTALERT_SILENT_CHANNEL_ID : `${POSTALERT_CHANNEL_ID}_${cleanSound}`;
      break;
    case 'prealert':
      channelId = effectiveIsSilent ? PREALERT_SILENT_CHANNEL_ID : `${PREALERT_CHANNEL_ID}_${cleanSound}`;
      break;
    default:
      channelId = effectiveIsSilent ? POSTALERT_SILENT_CHANNEL_ID : `${POSTALERT_CHANNEL_ID}_${cleanSound}`;
      break;
  }

  const shouldScheduleKhushu = input.isKhushuActive ? false : (input.alarmType === 'custom' && !!input.autoKhushu);

  // Direct vibration required when:
  // 1. Khushu is active
  // 2. Hardware ringer mode is RINGER_MODE_SILENT (0)
  // 3. Alert was originally audible (not configured as silent, vibrate, or notification-only)
  const ringerMode = input.ringerMode !== undefined ? input.ringerMode : 2;
  const shouldTriggerDirectVibrate = input.isKhushuActive && (ringerMode === 0) && isOriginallyAudible;

  return {
    effectiveIsSilent,
    channelId,
    soundUriRequired: !effectiveIsSilent,
    shouldScheduleKhushu,
    shouldTriggerDirectVibrate,
    reason,
    logDescription,
  };
}
