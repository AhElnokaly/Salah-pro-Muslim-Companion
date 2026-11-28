/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AlarmConfig, RelativePrayerTarget } from '../types';
import type { RingDiagnosticEvent } from '../services/athanAlarmPlugin';
import { buildCustomAlarmNativeKey } from '../services/athanAlarmPlugin';
import { parseTimeToMinutes } from '../utils/prayerCalc';

export const RING_DIAG_READ_TIMEOUT_MS = 500;
export const RING_DIAG_REPLAY_CHECK_LIMIT = 300;
const MS_PER_MINUTE = 60_000;

export function floorToMinuteMs(ms: number): number {
  return Math.floor(ms / MS_PER_MINUTE) * MS_PER_MINUTE;
}

/**
 * Computes the scheduled epoch timestamp (floored to the minute) for a custom alarm on `checkDate`.
 * Returns `null` when the scheduled timestamp cannot be computed unambiguously
 * (e.g., missing/invalid prayer time, missing fixed time, or prayer-relative offset crossing midnight).
 */
export function computeCustomAlarmScheduledMs(
  alarm: AlarmConfig,
  checkDate: Date,
  prayerTimeStr?: string
): number | null {
  if (!checkDate || Number.isNaN(checkDate.getTime())) return null;

  const isRelative =
    alarm.type === 'prayer_relative' || (!alarm.type && !alarm.time && Boolean(alarm.prayers));

  if (isRelative) {
    if (!prayerTimeStr || typeof prayerTimeStr !== 'string' || !prayerTimeStr.includes(':')) {
      return null;
    }
    const baseMins = parseTimeToMinutes(prayerTimeStr);
    if (!Number.isFinite(baseMins)) return null;

    const offset = alarm.offsetMinutes || 0;
    let rawTargetMins = baseMins;
    if (alarm.relation === 'before') {
      rawTargetMins = baseMins - offset;
    } else if (alarm.relation === 'after') {
      rawTargetMins = baseMins + offset;
    }

    // Prayer-relative crossing midnight belongs to an adjacent prayer calendar day -> ambiguous.
    if (rawTargetMins < 0 || rawTargetMins >= 1440) {
      return null;
    }

    const targetDate = new Date(checkDate);
    targetDate.setHours(0, 0, 0, 0);
    targetDate.setTime(targetDate.getTime() + rawTargetMins * MS_PER_MINUTE);
    return floorToMinuteMs(targetDate.getTime());
  }

  if (!alarm.time || typeof alarm.time !== 'string' || !alarm.time.includes(':')) {
    return null;
  }
  const alarmMins = parseTimeToMinutes(alarm.time);
  if (!Number.isFinite(alarmMins) || alarmMins < 0 || alarmMins >= 1440) {
    return null;
  }
  const targetDate = new Date(checkDate);
  targetDate.setHours(Math.floor(alarmMins / 60), alarmMins % 60, 0, 0);
  return floorToMinuteMs(targetDate.getTime());
}

/**
 * Normalizes ONLY the trailing epoch timestamp segment (if present) to its floored minute
 * so both sides compare on exact scheduled minute without parsing the base alarmId.
 */
function normalizeNativeKeyToMinute(alarmId: string): string {
  const lastUnderscore = alarmId.lastIndexOf('_');
  if (lastUnderscore <= 0) return alarmId;
  const tail = alarmId.slice(lastUnderscore + 1);
  if (!/^\d{10,16}$/.test(tail)) return alarmId;
  const ts = Number(tail);
  if (!Number.isFinite(ts) || ts <= 0) return alarmId;
  return `${alarmId.slice(0, lastUnderscore + 1)}${floorToMinuteMs(ts)}`;
}

/**
 * Matches only NATIVE `custom_notif_post` events whose key equals `expectedKey`
 * (with both sides floored to the minute). Silent Khushu posts count as native fires.
 */
export function findNativeCustomFireMatch(
  events: RingDiagnosticEvent[],
  expectedKey: string
): RingDiagnosticEvent | null {
  if (!Array.isArray(events) || events.length === 0 || !expectedKey) return null;
  const flooredExpected = normalizeNativeKeyToMinute(expectedKey);

  for (const ev of events) {
    if (!ev) continue;
    const source = (ev.source || '').trim().toUpperCase();
    const alarmType = (ev.alarmType || '').trim().toLowerCase();
    const stage = (ev.stage || '').trim();
    if (source !== 'NATIVE' || alarmType !== 'custom' || stage !== 'custom_notif_post') {
      continue;
    }
    const rawAlarmId = (ev.alarmId || '').trim();
    if (!rawAlarmId) continue;
    if (rawAlarmId === flooredExpected || normalizeNativeKeyToMinute(rawAlarmId) === flooredExpected) {
      return ev;
    }
  }
  return null;
}

/**
 * Fail-open reader for getRingDiagnosticLog with a hard timeout (default 500 ms).
 */
export async function readRingLogWithTimeout(
  reader: (limit: number) => Promise<RingDiagnosticEvent[]>,
  timeoutMs: number = RING_DIAG_READ_TIMEOUT_MS,
  limit: number = RING_DIAG_REPLAY_CHECK_LIMIT
): Promise<RingDiagnosticEvent[]> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<RingDiagnosticEvent[]>((resolve) => {
      timer = setTimeout(() => resolve([]), timeoutMs);
    });
    const events = await Promise.race([
      reader(limit).catch(() => [] as RingDiagnosticEvent[]),
      timeoutPromise,
    ]);
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
  }
}

export interface PendingCustomAlarmItem {
  alarm: AlarmConfig;
  targetPrayer?: RelativePrayerTarget;
  prayerTimeStr?: string;
  triggeredKey: string;
  priority: number;
}

export interface SuppressedCustomReplay {
  item: PendingCustomAlarmItem;
  expectedKey: string;
  matchedKey: string;
  scheduledMs: number;
}

export interface CustomReplayFilterResult<T extends PendingCustomAlarmItem = PendingCustomAlarmItem> {
  playable: T[];
  suppressed: Array<{
    item: T;
    expectedKey: string;
    matchedKey: string;
    scheduledMs: number;
  }>;
}

export function filterPendingCustomAlarmsAgainstNativeLog<T extends PendingCustomAlarmItem>(
  pendingItems: T[],
  events: RingDiagnosticEvent[],
  checkDate: Date
): CustomReplayFilterResult<T> {
  const playable: T[] = [];
  const suppressed: Array<{
    item: T;
    expectedKey: string;
    matchedKey: string;
    scheduledMs: number;
  }> = [];

  for (const item of pendingItems) {
    const scheduledMs = computeCustomAlarmScheduledMs(item.alarm, checkDate, item.prayerTimeStr);
    if (scheduledMs === null) {
      playable.push(item);
      continue;
    }

    const expectedKey = buildCustomAlarmNativeKey({
      alarmId: item.alarm.id,
      timeMs: scheduledMs,
      targetPrayer: item.targetPrayer,
      snoozeOf: item.alarm.snoozeOf,
    });

    const match = findNativeCustomFireMatch(events, expectedKey);
    if (match) {
      suppressed.push({
        item,
        expectedKey,
        matchedKey: match.alarmId,
        scheduledMs,
      });
    } else {
      playable.push(item);
    }
  }

  return { playable, suppressed };
}

export interface DispatchCustomAlarmsOptions<T extends PendingCustomAlarmItem> {
  pendingItems: T[];
  checkDate: Date;
  inFlightKeys: Set<string>;
  getTriggered: (key: string) => string | null;
  setTriggered: (key: string, value: string) => void;
  readRingLog: (limit: number) => Promise<RingDiagnosticEvent[]>;
  logDiag: (event: RingDiagnosticEvent) => void;
  computeIsAudioBusy: () => boolean;
  onDispatch: (item: T, role: 'primary_audible' | 'primary_muted_busy' | 'secondary_muted') => void;
  timeoutMs?: number;
  filterCandidates?: typeof filterPendingCustomAlarmsAgainstNativeLog<T>;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message || err.name || 'Unknown error';
  }
  return String(err ?? 'Unknown error');
}

function logCustomDispatchError(
  logDiag: (event: RingDiagnosticEvent) => void,
  alarmId: string,
  err: unknown,
  phase?: string
): void {
  try {
    const msg = getErrorMessage(err);
    logDiag({
      source: 'JS',
      alarmType: 'custom',
      alarmId,
      stage: 'custom_dispatch_error',
      details: phase ? `phase=${phase}, error=${msg}` : `error=${msg}`,
    });
  } catch {}
}

/**
 * Coordinates replay suppression with an in-flight guard and deferred `triggeredKey` persistence:
 * 1. Marks `inFlightKeys` synchronously before awaiting so 1 s ticks skip pending items.
 * 2. Reads native ring log with a fail-open 500 ms timeout and fail-open filter phase.
 * 3. Writes `triggeredKey` ONLY after the suppress-vs-play decision (before `onDispatch`).
 * 4. Isolates each suppress and dispatch item in its own try/catch, logging `custom_dispatch_error` on failure.
 */
export async function resolveAndDispatchPendingCustomAlarms<T extends PendingCustomAlarmItem>({
  pendingItems,
  checkDate,
  inFlightKeys,
  getTriggered,
  setTriggered,
  readRingLog,
  logDiag,
  computeIsAudioBusy,
  onDispatch,
  timeoutMs = RING_DIAG_READ_TIMEOUT_MS,
  filterCandidates = filterPendingCustomAlarmsAgainstNativeLog,
}: DispatchCustomAlarmsOptions<T>): Promise<CustomReplayFilterResult<T>> {
  const candidates = pendingItems.filter(
    (item) => !inFlightKeys.has(item.triggeredKey) && !getTriggered(item.triggeredKey)
  );
  if (candidates.length === 0) {
    return { playable: [], suppressed: [] };
  }

  for (const item of candidates) {
    inFlightKeys.add(item.triggeredKey);
  }

  try {
    let playable: T[] = [];
    let suppressed: Array<{
      item: T;
      expectedKey: string;
      matchedKey: string;
      scheduledMs: number;
    }> = [];

    try {
      const events = await readRingLogWithTimeout(readRingLog, timeoutMs, RING_DIAG_REPLAY_CHECK_LIMIT);
      const filtered = filterCandidates(candidates, events, checkDate);
      playable = [...filtered.playable];
      suppressed = [...filtered.suppressed];
    } catch (err) {
      // Fail-open decision phase: treat all candidates as playable and dispatch as before.
      playable = [...candidates];
      suppressed = [];
      logCustomDispatchError(
        logDiag,
        candidates.map((c) => c.alarm.id).join(',') || 'unknown',
        err,
        'decision'
      );
    }

    for (const sup of suppressed) {
      try {
        setTriggered(sup.item.triggeredKey, 'true');
        try {
          logDiag({
            source: 'JS',
            alarmType: 'custom',
            alarmId: sup.item.alarm.id,
            stage: 'js_replay_suppressed',
            details: `matchedKey=${sup.matchedKey}, expectedKey=${sup.expectedKey}, scheduledMs=${sup.scheduledMs}, prayer=${sup.item.targetPrayer || 'fixed'}`,
          });
        } catch (diagErr) {
          logCustomDispatchError(logDiag, sup.item.alarm.id, diagErr, 'suppress_log');
        }
      } catch (err) {
        logCustomDispatchError(logDiag, sup.item.alarm.id, err, 'suppress');
      }
    }

    if (playable.length === 0) {
      return { playable: [], suppressed };
    }

    playable.sort((a, b) => b.priority - a.priority);

    let isAudioBusy = false;
    try {
      isAudioBusy = computeIsAudioBusy();
    } catch (err) {
      logCustomDispatchError(logDiag, playable[0].alarm.id, err, 'audio_busy');
    }

    const primaryItem = playable[0];
    try {
      setTriggered(primaryItem.triggeredKey, 'true');
      if (!isAudioBusy) {
        onDispatch(primaryItem, 'primary_audible');
      } else {
        onDispatch(primaryItem, 'primary_muted_busy');
      }
    } catch (err) {
      logCustomDispatchError(logDiag, primaryItem.alarm.id, err, 'dispatch_primary');
    }

    for (let i = 1; i < playable.length; i++) {
      const secondaryItem = playable[i];
      try {
        setTriggered(secondaryItem.triggeredKey, 'true');
        onDispatch(secondaryItem, 'secondary_muted');
      } catch (err) {
        logCustomDispatchError(logDiag, secondaryItem.alarm.id, err, 'dispatch_secondary');
      }
    }

    return { playable, suppressed };
  } finally {
    for (const item of candidates) {
      inFlightKeys.delete(item.triggeredKey);
    }
  }
}
