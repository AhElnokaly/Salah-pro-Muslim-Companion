/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RingDiagnosticEvent } from '../services/athanAlarmPlugin';

export const RING_DIAG_LOG_FETCH_LIMIT = 300;
export const MIN_AUDIBLE_EVENTS_FOR_VERDICT = 3;
export const DUPLICATE_START_WINDOW_MS = 120_000;
export const DEFAULT_OVERLAP_WINDOW_MS = 60_000;
export const FALLBACK_ATHAN_WINDOW_MS = 240_000;
export const HANDOFF_TOLERANCE_MS = 1_000;

export const KNOWN_RING_LOG_STAGES = new Set<string>([
  'receiver_on_receive',
  'custom_notif_post',
  'prealert_notif_post',
  'postalert_notif_post',
  'start_foreground_service',
  'service_on_start',
  'native_mp_start',
  'native_mp_complete',
  'native_mp_stop',
  'native_mp_error',
  'html_audio_play',
  'custom_play_sound',
  'dhikr_play_speech',
  'skip_native_running',
  'scheduler_trigger_athan',
  'custom_dispatch_audible',
  'custom_dispatch_muted_busy',
  'custom_dispatch_muted_secondary',
  'stop_native_called',
]);

export type DoubleRingVerdict =
  | 'INSUFFICIENT_DATA'
  | 'NONE_FOUND'
  | 'DUPLICATE_START'
  | 'POSSIBLE_OVERLAP';

export type RingEndType = 'complete' | 'stop' | 'error';

export type DuplicateStartReason =
  | 'same_trigger_id'
  | 'same_alarm_within_window'
  | 'native_and_js_athan';

export interface ParsedRingLogResult {
  events: RingDiagnosticEvent[];
  parsedLines: number;
  skippedLines: number;
}

export interface RingAudibleEntry {
  timeMs: number;
  source: string;
  alarmType: string;
  alarmId: string;
  prayerKey: string;
  stage: string;
  track?: string;
  playId?: string;
  triggerId?: string;
  endTimeMs?: number;
  endStage?: string;
  endType?: RingEndType;
  durationMs?: number;
  isEstimatedInterval: boolean;
}

export interface RingSuspiciousPair {
  kind: 'DUPLICATE_START' | 'POSSIBLE_OVERLAP';
  confidence: 'high' | 'medium';
  reason: DuplicateStartReason | 'within_measured_interval' | 'within_estimated_window';
  deltaMs: number;
  windowUsedMs: number;
  isEstimated: boolean;
  first: RingAudibleEntry;
  second: RingAudibleEntry;
}

export interface RingHandoffPair {
  kind: 'HANDOFF';
  reason: 'same_alarm_within_window' | 'native_and_js_athan' | 'within_measured_interval';
  deltaMs: number;
  handoffGapMs: number;
  first: RingAudibleEntry;
  second: RingAudibleEntry;
}

export interface DetectDoubleRingOptions {
  overlapWindowMs?: number;
  athanFallbackWindowMs?: number;
  duplicateWindowMs?: number;
  minEventsForVerdict?: number;
}

export interface DoubleRingReport {
  verdict: DoubleRingVerdict;
  isEstimated: boolean;
  totalEventsRead: number;
  audibleEventsCount: number;
  nativeMpStartCount: number;
  startsWithoutEndCount: number;
  firstEventTimeMs: number | null;
  lastEventTimeMs: number | null;
  duplicateStarts: RingSuspiciousPair[];
  possibleOverlaps: RingSuspiciousPair[];
  handoffs: RingHandoffPair[];
  audibleEvents: RingAudibleEntry[];
}

export function parseDetailsKV(details?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!details || typeof details !== 'string') return result;
  const parts = details.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key) {
      result[key] = value;
    }
  }
  return result;
}

function parseTimestampPrefix(rawPrefix: string): { timeMs?: number; remainder: string } {
  const trimmed = rawPrefix.trim();
  if (!trimmed) return { remainder: '' };

  // Two-line UI export header: "[1] 11/18/2026, 05:00:00 AM (1763442000000)"
  const indexedParenMatch = trimmed.match(/^\[\d+\]\s+.*?\((\d{10,16})\)$/);
  if (indexedParenMatch) {
    const num = Number(indexedParenMatch[1]);
    return {
      timeMs: Number.isFinite(num) && num > 0 ? num : undefined,
      remainder: '',
    };
  }

  // Bracketed timestamp before source: "[1763442000000] NATIVE" or "[2026-11-18T05:00:00Z] NATIVE"
  const bracketMatch = trimmed.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (bracketMatch) {
    const tsToken = bracketMatch[1].trim();
    const rest = bracketMatch[2].trim();
    const num = Number(tsToken);
    if (/^\d{10,16}$/.test(tsToken) && Number.isFinite(num) && num > 0) {
      return { timeMs: num, remainder: rest };
    }
    const parsed = Date.parse(tsToken);
    if (Number.isFinite(parsed) && parsed > 0) {
      return { timeMs: parsed, remainder: rest };
    }
    return { remainder: trimmed };
  }

  return { remainder: trimmed };
}

/**
 * Pure optional text parser for pasted diagnostic reports or text-based log lines.
 * Supports:
 * 1) Single-line format: `[time] NATIVE | <alarmType> | <prayerKey> | <event> | k=v, k=v`
 *    or `NATIVE | <alarmType> | <prayerKey> | <event> | k=v, k=v`
 * 2) Two-line exported format from AthanDiagnosticsSection (`[idx] date (ms) | ...` + `التفاصيل: ...`)
 * Malformed or divider lines are safely skipped without throwing.
 */
export function parseRingLog(input: string | string[]): ParsedRingLogResult {
  const rawLines = Array.isArray(input) ? input : input.split(/\r?\n/);
  const events: RingDiagnosticEvent[] = [];
  let skippedLines = 0;

  for (let i = 0; i < rawLines.length; i++) {
    const line = (rawLines[i] ?? '').trim();
    if (!line) continue;

    // Skip two-line export headers/dividers cleanly
    if (
      line.startsWith('===') ||
      line.startsWith('---') ||
      line.startsWith('تاريخ الاستخراج:') ||
      line.startsWith('إجمالي الأحداث')
    ) {
      skippedLines++;
      continue;
    }

    // Orphan "التفاصيل:" line when not consumed by a preceding header line
    if (line.startsWith('التفاصيل:')) {
      skippedLines++;
      continue;
    }

    const parts = line.split('|').map((p) => p.trim());
    if (parts.length < 4) {
      skippedLines++;
      continue;
    }

    const prefixParsed = parseTimestampPrefix(parts[0]);
    let source = '';
    let alarmType = '';
    let alarmId = '';
    let stage = '';
    let details = '';
    let timeMs = prefixParsed.timeMs;

    if (prefixParsed.remainder === '' && /^\[\d+\]/.test(parts[0]) && parts.length >= 5) {
      // Two-line export header: "[1] ... (ms) | source | alarmType | alarmId | stage"
      source = parts[1];
      alarmType = parts[2];
      alarmId = parts[3];
      stage = parts[4];
      const nextLine = (rawLines[i + 1] ?? '').trim();
      if (nextLine.startsWith('التفاصيل:')) {
        const rawDetails = nextLine.slice('التفاصيل:'.length).trim();
        details = rawDetails === '—' ? '' : rawDetails;
        i++;
      }
    } else {
      source = prefixParsed.remainder || parts[0];
      alarmType = parts[1];
      alarmId = parts[2];
      stage = parts[3];
      details = parts.slice(4).join(' | ').trim();
    }

    if (!source || !alarmType || !stage) {
      skippedLines++;
      continue;
    }

    if (!timeMs && details) {
      const kv = parseDetailsKV(details);
      const fallbackTs = Number(kv.timeMs ?? kv.playId ?? '');
      if (Number.isFinite(fallbackTs) && fallbackTs > 0) {
        timeMs = fallbackTs;
      }
    }

    events.push({
      timeMs,
      source,
      alarmType,
      alarmId,
      stage,
      details: details || undefined,
    });
  }

  return {
    events,
    parsedLines: events.length,
    skippedLines,
  };
}

function normalizePrayerName(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (!lower) return '';
  if (lower.includes('fajr')) return 'fajr';
  if (lower.includes('dhuhr') || lower.includes('zuhr')) return 'dhuhr';
  if (lower.includes('asr')) return 'asr';
  if (lower.includes('maghrib')) return 'maghrib';
  if (lower.includes('isha')) return 'isha';
  return lower;
}

function isNotifPostSilent(kv: Record<string, string>): boolean {
  if (kv.silent === 'true') return true;
  const soundType = (kv.soundType ?? '').trim().toLowerCase();
  const notifyMode = (kv.notifyMode ?? '').trim().toLowerCase();
  const channelId = (kv.channelId ?? '').trim().toLowerCase();

  if (soundType === 'silent' || soundType === 'vibrate') return true;
  if (notifyMode === 'notification' || notifyMode === 'silent') return true;
  if (channelId.includes('silent')) return true;

  return false;
}

function isAudibleRingStart(event: RingDiagnosticEvent, kv: Record<string, string>): boolean {
  const source = (event.source || '').trim().toUpperCase();
  const stage = (event.stage || '').trim();

  if (source === 'NATIVE') {
    if (stage === 'native_mp_start') {
      return true;
    }
    if (stage === 'custom_notif_post' || stage === 'prealert_notif_post' || stage === 'postalert_notif_post') {
      return !isNotifPostSilent(kv);
    }
    return false;
  }

  if (source === 'JS') {
    if (stage === 'html_audio_play' || stage === 'custom_play_sound' || stage === 'dhikr_play_speech') {
      const soundType = (kv.soundType ?? '').trim().toLowerCase();
      const notifyMode = (kv.notifyMode ?? '').trim().toLowerCase();
      if (soundType === 'silent' || soundType === 'vibrate') return false;
      if (notifyMode === 'notification' || notifyMode === 'silent') return false;
      return true;
    }
    return false;
  }

  return false;
}

function getTerminalEndType(stage: string): RingEndType | null {
  if (stage === 'native_mp_complete') return 'complete';
  if (stage === 'native_mp_stop') return 'stop';
  if (stage === 'native_mp_error') return 'error';
  return null;
}

export function detectDoubleRing(
  events: RingDiagnosticEvent[],
  options: DetectDoubleRingOptions = {}
): DoubleRingReport {
  const overlapWindowMs = options.overlapWindowMs ?? DEFAULT_OVERLAP_WINDOW_MS;
  const athanFallbackWindowMs = options.athanFallbackWindowMs ?? FALLBACK_ATHAN_WINDOW_MS;
  const duplicateWindowMs = options.duplicateWindowMs ?? DUPLICATE_START_WINDOW_MS;
  const minEventsForVerdict = options.minEventsForVerdict ?? MIN_AUDIBLE_EVENTS_FOR_VERDICT;

  const validIndexed = (events || [])
    .map((event, idx) => ({
      event,
      idx,
      timeMs: typeof event?.timeMs === 'number' && Number.isFinite(event.timeMs) && event.timeMs > 0
        ? event.timeMs
        : NaN,
      kv: parseDetailsKV(event?.details),
    }))
    .filter((item) => item.event && item.event.stage && Number.isFinite(item.timeMs));

  // Sort chronologically ascending (input from getRingDiagnosticLog is newest-first)
  validIndexed.sort((a, b) => (a.timeMs !== b.timeMs ? a.timeMs - b.timeMs : a.idx - b.idx));

  const totalEventsRead = validIndexed.length;
  const firstEventTimeMs = totalEventsRead > 0 ? validIndexed[0].timeMs : null;
  const lastEventTimeMs = totalEventsRead > 0 ? validIndexed[totalEventsRead - 1].timeMs : null;

  // Index terminal events by (alarmId, playId)
  // Note: Any native_mp_stop (even reason=user_stop emitted by onDestroy) is normalized to 'stop' with no verdict inference.
  interface TerminalInfo {
    timeMs: number;
    stage: string;
    endType: RingEndType;
    consumed: boolean;
  }
  const endsByKey = new Map<string, TerminalInfo[]>();
  for (const item of validIndexed) {
    if ((item.event.source || '').trim().toUpperCase() !== 'NATIVE') continue;
    const endType = getTerminalEndType((item.event.stage || '').trim());
    if (!endType) continue;
    const playId = item.kv.playId ?? '';
    const alarmId = (item.event.alarmId || '').trim();
    if (!playId || !alarmId) continue;
    const key = `${alarmId}::${playId}`;
    const list = endsByKey.get(key) ?? [];
    list.push({
      timeMs: item.timeMs,
      stage: item.event.stage.trim(),
      endType,
      consumed: false,
    });
    endsByKey.set(key, list);
  }

  let nativeMpStartCount = 0;
  let startsWithoutEndCount = 0;
  const audibleEvents: RingAudibleEntry[] = [];

  for (const item of validIndexed) {
    if (!isAudibleRingStart(item.event, item.kv)) continue;

    const source = item.event.source.trim().toUpperCase();
    const alarmType = (item.event.alarmType || '').trim().toLowerCase();
    const alarmId = (item.event.alarmId || '').trim();
    const stage = item.event.stage.trim();
    const playId = item.kv.playId || undefined;
    const track = item.kv.track || item.kv.soundType || undefined;
    const triggerId = item.kv.triggerId || undefined;
    const prayerKey = item.kv.prayer || alarmId;

    let endTimeMs: number | undefined;
    let endStage: string | undefined;
    let endType: RingEndType | undefined;
    let durationMs: number | undefined;
    let isEstimatedInterval = true;

    if (source === 'NATIVE' && stage === 'native_mp_start') {
      nativeMpStartCount++;
      if (alarmId && playId) {
        const candidates = endsByKey.get(`${alarmId}::${playId}`);
        const matched = candidates?.find((c) => !c.consumed && c.timeMs >= item.timeMs);
        if (matched) {
          matched.consumed = true;
          endTimeMs = matched.timeMs;
          endStage = matched.stage;
          endType = matched.endType;
          durationMs = Math.max(0, matched.timeMs - item.timeMs);
          isEstimatedInterval = false;
        }
      }
      if (endTimeMs === undefined) {
        startsWithoutEndCount++;
      }
    }

    audibleEvents.push({
      timeMs: item.timeMs,
      source,
      alarmType,
      alarmId,
      prayerKey,
      stage,
      track,
      playId,
      triggerId,
      endTimeMs,
      endStage,
      endType,
      durationMs,
      isEstimatedInterval,
    });
  }

  const duplicateStarts: RingSuspiciousPair[] = [];
  const possibleOverlaps: RingSuspiciousPair[] = [];
  const handoffs: RingHandoffPair[] = [];

  for (let i = 0; i < audibleEvents.length; i++) {
    const first = audibleEvents[i];
    const fallbackWindowMs = first.alarmType === 'athan' ? athanFallbackWindowMs : overlapWindowMs;
    const intervalEndMs = first.endTimeMs !== undefined ? first.endTimeMs : first.timeMs + fallbackWindowMs;
    const maxLookaheadMs = Math.max(duplicateWindowMs, intervalEndMs - first.timeMs);

    for (let j = i + 1; j < audibleEvents.length; j++) {
      const second = audibleEvents[j];
      const deltaMs = second.timeMs - first.timeMs;
      if (deltaMs > maxLookaheadMs) break;

      // Exception: same_trigger_id stays DUPLICATE_START unconditionally
      if (first.triggerId && second.triggerId && first.triggerId === second.triggerId) {
        duplicateStarts.push({
          kind: 'DUPLICATE_START',
          confidence: 'high',
          reason: 'same_trigger_id',
          deltaMs,
          windowUsedMs: duplicateWindowMs,
          isEstimated: false,
          first,
          second,
        });
        continue;
      }

      let dupReason: 'same_alarm_within_window' | 'native_and_js_athan' | null = null;
      if (
        first.alarmType &&
        first.alarmType === second.alarmType &&
        first.alarmId &&
        first.alarmId === second.alarmId &&
        deltaMs <= duplicateWindowMs
      ) {
        dupReason = 'same_alarm_within_window';
      } else if (
        ((first.source === 'NATIVE' && first.stage === 'native_mp_start' && second.source === 'JS' && second.stage === 'html_audio_play') ||
          (second.source === 'NATIVE' && second.stage === 'native_mp_start' && first.source === 'JS' && first.stage === 'html_audio_play')) &&
        deltaMs <= duplicateWindowMs
      ) {
        const p1 = normalizePrayerName(first.prayerKey || first.alarmId);
        const p2 = normalizePrayerName(second.prayerKey || second.alarmId);
        if (p1 && p1 === p2) {
          dupReason = 'native_and_js_athan';
        }
      }

      const isWithinOverlap = second.timeMs < intervalEndMs;

      if (dupReason || isWithinOverlap) {
        if (first.endTimeMs !== undefined && first.endTimeMs <= second.timeMs + HANDOFF_TOLERANCE_MS) {
          handoffs.push({
            kind: 'HANDOFF',
            reason: dupReason ?? 'within_measured_interval',
            deltaMs,
            handoffGapMs: second.timeMs - first.endTimeMs,
            first,
            second,
          });
          continue;
        }

        if (dupReason) {
          duplicateStarts.push({
            kind: 'DUPLICATE_START',
            confidence: 'high',
            reason: dupReason,
            deltaMs,
            windowUsedMs: duplicateWindowMs,
            isEstimated: false,
            first,
            second,
          });
        } else {
          possibleOverlaps.push({
            kind: 'POSSIBLE_OVERLAP',
            confidence: 'medium',
            reason: first.endTimeMs !== undefined ? 'within_measured_interval' : 'within_estimated_window',
            deltaMs,
            windowUsedMs: first.endTimeMs !== undefined ? Math.max(0, first.endTimeMs - first.timeMs) : fallbackWindowMs,
            isEstimated: first.endTimeMs === undefined,
            first,
            second,
          });
        }
      }
    }
  }

  let verdict: DoubleRingVerdict;
  if (audibleEvents.length < minEventsForVerdict) {
    verdict = 'INSUFFICIENT_DATA';
  } else if (duplicateStarts.length > 0) {
    verdict = 'DUPLICATE_START';
  } else if (possibleOverlaps.length > 0) {
    verdict = 'POSSIBLE_OVERLAP';
  } else {
    verdict = 'NONE_FOUND';
  }

  let isEstimated = false;
  if (verdict === 'POSSIBLE_OVERLAP') {
    isEstimated = possibleOverlaps.some((pair) => pair.isEstimated);
  } else if (verdict === 'NONE_FOUND') {
    isEstimated = audibleEvents.some((entry) => entry.isEstimatedInterval);
  }

  return {
    verdict,
    isEstimated,
    totalEventsRead,
    audibleEventsCount: audibleEvents.length,
    nativeMpStartCount,
    startsWithoutEndCount,
    firstEventTimeMs,
    lastEventTimeMs,
    duplicateStarts,
    possibleOverlaps,
    handoffs,
    audibleEvents,
  };
}

export function formatDoubleRingReport(
  report: DoubleRingReport,
  meta: { version?: string; commitHash?: string; formatTime?: (ms?: number) => string } = {}
): string {
  const fmtTime = meta.formatTime ?? ((ms?: number) => (ms ? new Date(ms).toISOString() : '—'));
  const verdictLabel = `${report.verdict}${report.isEstimated ? ' (تقديري)' : ''}`;
  const lines: string[] = [
    `=== تقرير كاشف الرنين المزدوج (TASK10 / D1) ===`,
    `البناء (Build): v${meta.version || '?'} (${meta.commitHash || 'unknown'})`,
    `الحكم: ${verdictLabel}`,
    `إجمالي الأحداث المقروءة: ${report.totalEventsRead}`,
    `أحداث بدء الصوت المسموعة: ${report.audibleEventsCount} (native_mp_start: ${report.nativeMpStartCount})`,
    `بدايات native_mp_start بدون نهاية: ${report.startsWithoutEndCount}`,
    `الفترة الزمنية: من ${fmtTime(report.firstEventTimeMs ?? undefined)} إلى ${fmtTime(report.lastEventTimeMs ?? undefined)}`,
    `حالات DUPLICATE_START (ثقة عالية): ${report.duplicateStarts.length}`,
    `حالات POSSIBLE_OVERLAP (ثقة متوسطة): ${report.possibleOverlaps.length}`,
    `حالات تسليم/إعادة تشغيل (handoffs): ${report.handoffs.length}`,
  ];

  const appendPair = (label: string, pair: RingSuspiciousPair | RingHandoffPair, idx: number) => {
    const isHandoff = pair.kind === 'HANDOFF';
    const extraInfo = isHandoff
      ? `فاصل التسليم ${(pair.handoffGapMs >= 0 ? '+' : '')}${pair.handoffGapMs}ms`
      : `فرق ${(pair.deltaMs / 1000).toFixed(1)}ث${pair.isEstimated ? ', تقديري' : ''}`;
    lines.push(
      `--- ${label} #${idx + 1} (${pair.reason}, ${extraInfo}) ---`,
      `  [1] ${fmtTime(pair.first.timeMs)} | ${pair.first.source} | ${pair.first.alarmType} | alarmId=${pair.first.alarmId || '—'} | prayerKey=${pair.first.prayerKey || '—'} | stage=${pair.first.stage} | track=${pair.first.track || '—'} | playId=${pair.first.playId || '—'}${pair.first.endTimeMs ? ` | end=${pair.first.endStage}@${fmtTime(pair.first.endTimeMs)}` : ''}`,
      `  [2] ${fmtTime(pair.second.timeMs)} | ${pair.second.source} | ${pair.second.alarmType} | alarmId=${pair.second.alarmId || '—'} | prayerKey=${pair.second.prayerKey || '—'} | stage=${pair.second.stage} | track=${pair.second.track || '—'} | playId=${pair.second.playId || '—'}`
    );
  };

  report.duplicateStarts.forEach((p, idx) => appendPair('DUPLICATE_START', p, idx));
  report.possibleOverlaps.forEach((p, idx) => appendPair('POSSIBLE_OVERLAP', p, idx));
  report.handoffs.forEach((p, idx) => appendPair('HANDOFF', p, idx));

  return lines.join('\n');
}
