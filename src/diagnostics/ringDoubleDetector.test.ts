import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { RingDiagnosticEvent } from '../services/athanAlarmPlugin';
import {
  DEFAULT_OVERLAP_WINDOW_MS,
  DUPLICATE_START_WINDOW_MS,
  FALLBACK_ATHAN_WINDOW_MS,
  HANDOFF_TOLERANCE_MS,
  MIN_AUDIBLE_EVENTS_FOR_VERDICT,
  RING_DIAG_LOG_FETCH_LIMIT,
  detectDoubleRing,
  formatDoubleRingReport,
  parseDetailsKV,
  parseRingLog,
} from './ringDoubleDetector';

const BASE_MS = 1_763_442_000_000; // 2025-11-18T05:00:00Z

describe('Ring Double Detector (TASK10 / D1)', () => {
  test('exposes approved constants and parses Kotlin k=v details cleanly', () => {
    assert.equal(RING_DIAG_LOG_FETCH_LIMIT, 300);
    assert.equal(MIN_AUDIBLE_EVENTS_FOR_VERDICT, 3);
    assert.equal(DUPLICATE_START_WINDOW_MS, 120_000);
    assert.equal(DEFAULT_OVERLAP_WINDOW_MS, 60_000);
    assert.equal(FALLBACK_ATHAN_WINDOW_MS, 240_000);

    const kv = parseDetailsKV('track=file:makkah_fajr.mp3, prayer=fajr, playId=1763442000000');
    assert.deepEqual(kv, {
      track: 'file:makkah_fajr.mp3',
      prayer: 'fajr',
      playId: '1763442000000',
    });
  });

  test('empty log and < 3 audible events return INSUFFICIENT_DATA', () => {
    const emptyReport = detectDoubleRing([]);
    assert.equal(emptyReport.verdict, 'INSUFFICIENT_DATA');
    assert.equal(emptyReport.totalEventsRead, 0);
    assert.equal(emptyReport.audibleEventsCount, 0);
    assert.equal(emptyReport.startsWithoutEndCount, 0);

    const twoEvents: RingDiagnosticEvent[] = [
      {
        timeMs: BASE_MS,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'receiver_on_receive',
        details: 'requestCode=1001, soundType=default, notifyMode=both, channelId=athan_alarm_channel_v2',
      },
      {
        timeMs: BASE_MS + 350,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${BASE_MS + 350}`,
      },
      {
        timeMs: BASE_MS + 180_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_complete',
        details: `track=raw:athan_fajr, prayer=fajr, reason=completed, elapsedMs=179650, playId=${BASE_MS + 350}`,
      },
      {
        timeMs: BASE_MS + 1_800_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_1',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=false, silent=false',
      },
    ];

    const report = detectDoubleRing(twoEvents);
    assert.equal(report.verdict, 'INSUFFICIENT_DATA');
    assert.equal(report.audibleEventsCount, 2);
    assert.equal(report.nativeMpStartCount, 1);
    assert.equal(report.startsWithoutEndCount, 0);
  });

  test('correlates native_mp_start with native_mp_complete and user_stop (normal stop) across 3+ distant prayers -> NONE_FOUND', () => {
    const p1 = BASE_MS;
    const p2 = BASE_MS + 6 * 3_600_000;
    const p3 = BASE_MS + 24 * 3_600_000; // same alarmId "fajr" 24h later must NOT be DUPLICATE_START

    // Provide newest-first order just like getRingDiagnosticLog(300)
    const newestFirstEvents: RingDiagnosticEvent[] = [
      {
        timeMs: p3 + 20_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_stop',
        details: `track=raw:athan_fajr, prayer=fajr, reason=user_stop, elapsedMs=20000, playId=${p3}`,
      },
      {
        timeMs: p3,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${p3}`,
      },
      {
        timeMs: p2 + 190_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'dhuhr',
        stage: 'native_mp_complete',
        details: `track=file:makkah_dhuhr.mp3, prayer=dhuhr, reason=completed, elapsedMs=190000, playId=${p2}`,
      },
      {
        timeMs: p2,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'dhuhr',
        stage: 'native_mp_start',
        details: `track=file:makkah_dhuhr.mp3, prayer=dhuhr, playId=${p2}`,
      },
      {
        timeMs: p1 + 195_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_complete',
        details: `track=raw:athan_fajr, prayer=fajr, reason=completed, elapsedMs=195000, playId=${p1}`,
      },
      {
        timeMs: p1,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${p1}`,
      },
    ];

    const report = detectDoubleRing(newestFirstEvents);
    assert.equal(report.verdict, 'NONE_FOUND');
    assert.equal(report.isEstimated, false);
    assert.equal(report.nativeMpStartCount, 3);
    assert.equal(report.startsWithoutEndCount, 0);
    assert.equal(report.duplicateStarts.length, 0);
    assert.equal(report.possibleOverlaps.length, 0);
    assert.equal(report.audibleEvents[2].endType, 'stop');
  });

  test('detects DUPLICATE_START for same (alarmType, alarmId) within 120s and preserves track/playId', () => {
    const t1 = BASE_MS;
    const t2 = BASE_MS + 4_500;
    const t3 = BASE_MS + 3_600_000;

    const events: RingDiagnosticEvent[] = [
      {
        timeMs: t1,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${t1}`,
      },
      {
        timeMs: t2,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${t2}`,
      },
      {
        timeMs: t2 + 180_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_complete',
        details: `track=raw:athan_fajr, prayer=fajr, reason=completed, elapsedMs=180000, playId=${t2}`,
      },
      {
        timeMs: t3,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'dhuhr',
        stage: 'native_mp_start',
        details: `track=file:dhuhr.mp3, prayer=dhuhr, playId=${t3}`,
      },
      {
        timeMs: t3 + 190_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'dhuhr',
        stage: 'native_mp_complete',
        details: `track=file:dhuhr.mp3, prayer=dhuhr, reason=completed, elapsedMs=190000, playId=${t3}`,
      },
    ];

    const report = detectDoubleRing(events);
    assert.equal(report.verdict, 'DUPLICATE_START');
    assert.equal(report.duplicateStarts.length, 1);
    assert.equal(report.startsWithoutEndCount, 1); // t1 has no end event
    assert.equal(report.duplicateStarts[0].first.track, 'raw:athan_fajr');
    assert.equal(report.duplicateStarts[0].first.playId, String(t1));
    assert.equal(report.duplicateStarts[0].second.playId, String(t2));
  });

  test('detects DUPLICATE_START when NATIVE athan and JS html_audio_play fire for same prayer', () => {
    const events: RingDiagnosticEvent[] = [
      {
        timeMs: BASE_MS,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'asr_1763442000',
        stage: 'native_mp_start',
        details: `track=raw:athan_default, prayer=asr, playId=${BASE_MS}`,
      },
      {
        timeMs: BASE_MS + 1_200,
        source: 'JS',
        alarmType: 'athan',
        alarmId: 'Asr',
        stage: 'html_audio_play',
        details: 'isFajr=false, fallback=false',
      },
      {
        timeMs: BASE_MS + 3_600_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_evening',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=false, silent=false',
      },
    ];

    const report = detectDoubleRing(events);
    assert.equal(report.verdict, 'DUPLICATE_START');
    assert.equal(report.duplicateStarts[0].reason, 'native_and_js_athan');
  });

  test('detects measured POSSIBLE_OVERLAP via playId end event and avoids false overlap after early stop', () => {
    const tAthan = BASE_MS;
    const tEarlyStop = BASE_MS + 10_000;
    const tCustomAfterStop = BASE_MS + 30_000;
    const tSecondAthan = BASE_MS + 3_600_000;
    const tOverlapCustom = tSecondAthan + 150_000; // > 60s after start, but BEFORE 200s complete!
    const tSecondComplete = tSecondAthan + 200_000;

    // 1. After early stop (reason=user_stop from onDestroy/stop), alarm at +30s is NOT an overlap
    const cleanAfterStop = detectDoubleRing([
      {
        timeMs: tAthan,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${tAthan}`,
      },
      {
        timeMs: tEarlyStop,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_stop',
        details: `track=raw:athan_fajr, prayer=fajr, reason=user_stop, elapsedMs=10000, playId=${tAthan}`,
      },
      {
        timeMs: tCustomAfterStop,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_1',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=false, silent=false',
      },
      {
        timeMs: tSecondAthan,
        source: 'NATIVE',
        alarmType: 'postalert',
        alarmId: 'post_fajr',
        stage: 'postalert_notif_post',
        details: 'soundType=reminder, notifyMode=both, isKhushuActive=false, channelId=athan_postalert_channel_v3_reminder',
      },
    ]);
    assert.equal(cleanAfterStop.verdict, 'NONE_FOUND');

    // 2. Inside measured 200s interval -> exact (non-estimated) POSSIBLE_OVERLAP
    const measuredOverlap = detectDoubleRing([
      {
        timeMs: tSecondAthan,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'dhuhr',
        stage: 'native_mp_start',
        details: `track=file:makkah.mp3, prayer=dhuhr, playId=${tSecondAthan}`,
      },
      {
        timeMs: tOverlapCustom,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_1',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=false, silent=false',
      },
      {
        timeMs: tSecondComplete,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'dhuhr',
        stage: 'native_mp_complete',
        details: `track=file:makkah.mp3, prayer=dhuhr, reason=completed, elapsedMs=200000, playId=${tSecondAthan}`,
      },
      {
        timeMs: tSecondAthan + 7_200_000,
        source: 'NATIVE',
        alarmType: 'prealert',
        alarmId: 'pre_asr',
        stage: 'prealert_notif_post',
        details: 'soundType=reminder, notifyMode=both',
      },
    ]);
    assert.equal(measuredOverlap.verdict, 'POSSIBLE_OVERLAP');
    assert.equal(measuredOverlap.isEstimated, false);
    assert.equal(measuredOverlap.possibleOverlaps[0].reason, 'within_measured_interval');
  });

  test('classifies native_mp_start without end or track history as unverifiable (NONE_FOUND) while skipping silent notifications', () => {
    const oldStart = BASE_MS;
    const events: RingDiagnosticEvent[] = [
      {
        timeMs: oldStart,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: 'track=raw:athan_fajr, prayer=fajr', // old Commit 0b format without playId or end, and no complete history
      },
      {
        timeMs: oldStart + 15_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_silent',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_silent, isKhushuActive=true, silent=true',
      },
      {
        timeMs: oldStart + 140_000,
        source: 'NATIVE',
        alarmType: 'postalert',
        alarmId: 'post_fajr',
        stage: 'postalert_notif_post',
        details: 'soundType=reminder, notifyMode=both, isKhushuActive=false, channelId=athan_postalert_channel_v3_reminder',
      },
      {
        timeMs: oldStart + 3_600_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_dua',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=false, silent=false',
      },
    ];

    const report = detectDoubleRing(events);
    assert.equal(report.verdict, 'NONE_FOUND');
    assert.equal(report.possibleOverlaps.length, 0);
    assert.equal(report.startsWithoutEndCount, 1);
    assert.equal(report.unverifiableCount, 1);
    assert.equal(report.audibleEvents[0].isUnverifiable, true);
  });

  test('estimates POSSIBLE_OVERLAP from learned track history when old native_mp_start lacks an end event', () => {
    const oldStart = BASE_MS;
    const laterCompleteStart = BASE_MS + 86_400_000;
    const events: RingDiagnosticEvent[] = [
      {
        timeMs: oldStart,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: 'track=raw:athan_fajr, prayer=fajr',
      },
      {
        timeMs: oldStart + 140_000, // inside learned 180_000 + 1_000 ms window
        source: 'NATIVE',
        alarmType: 'postalert',
        alarmId: 'post_fajr',
        stage: 'postalert_notif_post',
        details: 'soundType=reminder, notifyMode=both, isKhushuActive=false, channelId=athan_postalert_channel_v3_reminder',
      },
      {
        timeMs: laterCompleteStart,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${laterCompleteStart}`,
      },
      {
        timeMs: laterCompleteStart + 180_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_complete',
        details: `track=raw:athan_fajr, prayer=fajr, reason=completed, elapsedMs=180000, playId=${laterCompleteStart}`,
      },
    ];

    const report = detectDoubleRing(events);
    assert.equal(report.verdict, 'POSSIBLE_OVERLAP');
    assert.equal(report.isEstimated, true);
    assert.equal(report.startsWithoutEndCount, 1);
    assert.equal(report.unverifiableCount, 0);
    assert.equal(report.possibleOverlaps.length, 1);
    assert.equal(report.possibleOverlaps[0].reason, 'within_estimated_window');
    assert.equal(report.possibleOverlaps[0].estimatedSource, 'track_history');
    assert.equal(report.possibleOverlaps[0].windowUsedMs, 180_000 + HANDOFF_TOLERANCE_MS);
    assert.equal(report.possibleOverlaps[0].second.alarmId, 'post_fajr');

    const text = formatDoubleRingReport(report, { version: '1.2.1', commitHash: 'c4dd357' });
    assert.ok(text.includes('estimated from track history'));
  });

  test('two distant non-athan alarms > 60s apart (with 3rd event) produce NONE_FOUND', () => {
    const events: RingDiagnosticEvent[] = [
      {
        timeMs: BASE_MS,
        source: 'NATIVE',
        alarmType: 'prealert',
        alarmId: 'pre_fajr',
        stage: 'prealert_notif_post',
        details: 'soundType=reminder, notifyMode=both',
      },
      {
        timeMs: BASE_MS + 90_000, // > 60s
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_1',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=false, silent=false',
      },
      {
        timeMs: BASE_MS + 200_000, // > 60s
        source: 'NATIVE',
        alarmType: 'postalert',
        alarmId: 'post_fajr',
        stage: 'postalert_notif_post',
        details: 'soundType=reminder, notifyMode=both, isKhushuActive=false, channelId=athan_postalert_channel_v3_reminder',
      },
    ];

    const report = detectDoubleRing(events);
    assert.equal(report.verdict, 'NONE_FOUND');
    assert.equal(report.possibleOverlaps.length, 0);
  });

  test('parseRingLog parses valid lines cleanly, skips malformed lines without throwing, and feeds report formatter', () => {
    const rawLines = [
      '=== سجل قياس الرنين المزدوج ===',
      'broken line without pipes',
      `[1] 18/11/2026 (${BASE_MS}) | NATIVE | athan | fajr | native_mp_start`,
      `   التفاصيل: track=raw:athan_fajr, prayer=fajr, playId=${BASE_MS}`,
      `[${BASE_MS + 10_000}] NATIVE | athan | fajr | native_mp_start | track=raw:athan_fajr, prayer=fajr, playId=${BASE_MS + 10_000}`,
      `[${BASE_MS + 3_600_000}] NATIVE | custom | custom_1 | custom_notif_post | soundType=reminder, notifyMode=both, silent=false`,
    ];

    const parsed = parseRingLog(rawLines);
    assert.equal(parsed.parsedLines, 3);
    assert.equal(parsed.skippedLines, 2);

    const report = detectDoubleRing(parsed.events);
    assert.equal(report.verdict, 'DUPLICATE_START');
    const text = formatDoubleRingReport(report, { version: '1.2.1', commitHash: '3905c3a' });
    assert.ok(text.includes('3905c3a'));
    assert.ok(text.includes('DUPLICATE_START'));
    assert.ok(text.includes('raw:athan_fajr'));
  });

  test('classifies native_mp_stop followed by html_audio_play after 300ms as handoff (not DUPLICATE_START)', () => {
    assert.equal(HANDOFF_TOLERANCE_MS, 1_000);
    const tStart = BASE_MS;
    const tStop = BASE_MS + 5_000;
    const tJsPlay = tStop + 300;
    const events: RingDiagnosticEvent[] = [
      {
        timeMs: tStart,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${tStart}`,
      },
      {
        timeMs: tStop,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_stop',
        details: `track=raw:athan_fajr, prayer=fajr, reason=user_stop, elapsedMs=5000, playId=${tStart}`,
      },
      {
        timeMs: tJsPlay,
        source: 'JS',
        alarmType: 'athan',
        alarmId: 'Fajr',
        stage: 'html_audio_play',
        details: 'isFajr=true, fallback=false',
      },
      {
        timeMs: tStart + 3_600_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_1',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=false, silent=false',
      },
    ];

    const report = detectDoubleRing(events);
    assert.equal(report.verdict, 'NONE_FOUND');
    assert.equal(report.duplicateStarts.length, 0);
    assert.equal(report.possibleOverlaps.length, 0);
    assert.equal(report.handoffs.length, 1);
    assert.equal(report.handoffs[0].reason, 'native_and_js_athan');
    assert.equal(report.handoffs[0].handoffGapMs, 300);

    const reportText = formatDoubleRingReport(report, { version: '1.2.1', commitHash: '3905c3a' });
    assert.ok(reportText.includes('handoffs): 1'));
  });

  test('keeps DUPLICATE_START when native_mp_stop happens > 1000ms AFTER html_audio_play starts', () => {
    const tStart = BASE_MS;
    const tJsPlay = BASE_MS + 5_000;
    const tLateStop = tJsPlay + 1_500; // > HANDOFF_TOLERANCE_MS (1000ms)
    const events: RingDiagnosticEvent[] = [
      {
        timeMs: tStart,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${tStart}`,
      },
      {
        timeMs: tJsPlay,
        source: 'JS',
        alarmType: 'athan',
        alarmId: 'Fajr',
        stage: 'html_audio_play',
        details: 'isFajr=true, fallback=false',
      },
      {
        timeMs: tLateStop,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_stop',
        details: `track=raw:athan_fajr, prayer=fajr, reason=user_stop, elapsedMs=6500, playId=${tStart}`,
      },
      {
        timeMs: tStart + 3_600_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_1',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=false, silent=false',
      },
    ];

    const report = detectDoubleRing(events);
    assert.equal(report.verdict, 'DUPLICATE_START');
    assert.equal(report.duplicateStarts.length, 1);
    assert.equal(report.handoffs.length, 0);
  });

  test('does not match native_and_js_athan when prayerKey differs or second prayerKey is empty', () => {
    const tStart = BASE_MS;
    const baseTail: RingDiagnosticEvent[] = [
      {
        timeMs: tStart + 180_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_complete',
        details: `track=raw:athan_fajr, prayer=fajr, reason=completed, elapsedMs=180000, playId=${tStart}`,
      },
      {
        timeMs: tStart + 3_600_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_evening',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=false, silent=false',
      },
    ];

    // 1) Different prayer keys (fajr vs Dhuhr), spaced outside fajr completion so no overlap either
    const diffPrayerReport = detectDoubleRing([
      {
        timeMs: tStart,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${tStart}`,
      },
      {
        timeMs: tStart + 190_000,
        source: 'JS',
        alarmType: 'athan',
        alarmId: 'Dhuhr',
        stage: 'html_audio_play',
        details: 'isFajr=false, fallback=false',
      },
      ...baseTail,
    ]);
    assert.equal(diffPrayerReport.verdict, 'NONE_FOUND');
    assert.equal(diffPrayerReport.duplicateStarts.length, 0);

    // 2) Second event has empty alarmId and no prayer= in details
    const emptySecondPrayerReport = detectDoubleRing([
      {
        timeMs: tStart,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=raw:athan_fajr, prayer=fajr, playId=${tStart}`,
      },
      {
        timeMs: tStart + 200_000,
        source: 'JS',
        alarmType: 'athan',
        alarmId: '',
        stage: 'html_audio_play',
        details: 'isFajr=false, fallback=false',
      },
      ...baseTail,
    ]);
    assert.equal(emptySecondPrayerReport.verdict, 'NONE_FOUND');
    assert.equal(emptySecondPrayerReport.duplicateStarts.length, 0);
  });

  test('custom_notif_post relies on silent flag (not isKhushuActive): silent=true is ignored, silent=false is audible', () => {
    const events: RingDiagnosticEvent[] = [
      {
        timeMs: BASE_MS,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_khushu_muted',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_silent, isKhushuActive=true, silent=true',
      },
      {
        timeMs: BASE_MS + 10_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_khushu_audible',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, channelId=salah_custom_alarms_reminder, isKhushuActive=true, silent=false',
      },
      {
        timeMs: BASE_MS + 30_000, // within 60s of custom_khushu_audible -> POSSIBLE_OVERLAP
        source: 'NATIVE',
        alarmType: 'postalert',
        alarmId: 'post_fajr',
        stage: 'postalert_notif_post',
        details: 'soundType=reminder, notifyMode=both, isKhushuActive=false, channelId=athan_postalert_channel_v3_reminder',
      },
      {
        timeMs: BASE_MS + 3_600_000,
        source: 'NATIVE',
        alarmType: 'prealert',
        alarmId: 'pre_dhuhr',
        stage: 'prealert_notif_post',
        details: 'soundType=reminder, notifyMode=both',
      },
    ];

    const report = detectDoubleRing(events);
    // custom_khushu_muted (silent=true) skipped, custom_khushu_audible (silent=false, isKhushuActive=true) counted
    assert.equal(report.audibleEventsCount, 3);
    assert.equal(report.audibleEvents[0].alarmId, 'custom_khushu_audible');
    assert.equal(report.verdict, 'POSSIBLE_OVERLAP');
    assert.equal(report.possibleOverlaps[0].first.alarmId, 'custom_khushu_audible');
    assert.equal(report.possibleOverlaps[0].second.alarmId, 'post_fajr');
  });

  test('replays Case 1 & Case 2 (Maghrib 238.5s and 239.5s) with learned prayer_default durations (202773ms / 202848ms) -> NONE_FOUND', () => {
    const tMaghribComplete = 1_795_100_460_000;
    const tIshaComplete = 1_795_105_000_000;
    const tEarlyStop = 1_795_120_000_000;

    const events: RingDiagnosticEvent[] = [
      // Case 1: 2026-11-17 Maghrib (238,534 ms gap, no end event)
      {
        timeMs: 1_794_927_661_847,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'maghrib',
        stage: 'native_mp_start',
        details: 'track=file:prayer_default.audio, prayer=maghrib',
      },
      {
        timeMs: 1_794_927_900_381,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_maghrib_1',
        stage: 'custom_notif_post',
        details: 'label=منبه المغرب, soundType=reminder, notifyMode=both, silent=false',
      },
      // Case 2: 2026-11-18 Maghrib (239,487 ms gap, no end event)
      {
        timeMs: 1_795_014_060_678,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'maghrib',
        stage: 'native_mp_start',
        details: 'track=file:prayer_default.audio, prayer=maghrib',
      },
      {
        timeMs: 1_795_014_300_165,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_maghrib_2',
        stage: 'custom_notif_post',
        details: 'label=منبه المغرب, soundType=reminder, notifyMode=both, silent=false',
      },
      // Measured complete durations on later days for same track
      {
        timeMs: tMaghribComplete,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'maghrib',
        stage: 'native_mp_start',
        details: `track=file:prayer_default.audio, prayer=maghrib, playId=${tMaghribComplete}`,
      },
      {
        timeMs: tMaghribComplete + 202_773,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'maghrib',
        stage: 'native_mp_complete',
        details: `track=file:prayer_default.audio, prayer=maghrib, reason=completed, elapsedMs=202773, playId=${tMaghribComplete}`,
      },
      {
        timeMs: tIshaComplete,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'isha',
        stage: 'native_mp_start',
        details: `track=file:prayer_default.audio, prayer=isha, playId=${tIshaComplete}`,
      },
      {
        timeMs: tIshaComplete + 202_848,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'isha',
        stage: 'native_mp_complete',
        details: `track=file:prayer_default.audio, prayer=isha, reason=completed, elapsedMs=202848, playId=${tIshaComplete}`,
      },
      // Truncated stop must NOT corrupt learned window
      {
        timeMs: tEarlyStop,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=file:prayer_default.audio, prayer=fajr, playId=${tEarlyStop}`,
      },
      {
        timeMs: tEarlyStop + 10_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_stop',
        details: `track=file:prayer_default.audio, prayer=fajr, reason=user_stop, elapsedMs=10000, playId=${tEarlyStop}`,
      },
    ];

    const report = detectDoubleRing(events);
    assert.equal(report.verdict, 'NONE_FOUND');
    assert.equal(report.possibleOverlaps.length, 0);
    assert.equal(report.duplicateStarts.length, 0);
    assert.equal(report.startsWithoutEndCount, 2);
    assert.equal(report.unverifiableCount, 0);
    assert.equal(report.audibleEvents[0].learnedDurationMs, 202_848 + HANDOFF_TOLERANCE_MS);
  });

  test('flags real overlap at +240s when learned track duration is 245910ms (Fajr archive_036) without turning into a handoff', () => {
    const tOldFajr = BASE_MS;
    const tMeasuredFajr = BASE_MS + 86_400_000;
    const events: RingDiagnosticEvent[] = [
      {
        timeMs: tOldFajr,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: 'track=file:archive_036.audio, prayer=fajr',
      },
      {
        timeMs: tOldFajr + 240_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_fajr_alarm',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, silent=false',
      },
      {
        timeMs: tMeasuredFajr,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_start',
        details: `track=file:archive_036.audio, prayer=fajr, playId=${tMeasuredFajr}`,
      },
      {
        timeMs: tMeasuredFajr + 245_910,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'fajr',
        stage: 'native_mp_complete',
        details: `track=file:archive_036.audio, prayer=fajr, reason=completed, elapsedMs=245910, playId=${tMeasuredFajr}`,
      },
    ];

    const report = detectDoubleRing(events);
    assert.equal(report.verdict, 'POSSIBLE_OVERLAP');
    assert.equal(report.isEstimated, true);
    assert.equal(report.handoffs.length, 0);
    assert.equal(report.possibleOverlaps.length, 1);
    assert.equal(report.possibleOverlaps[0].reason, 'within_estimated_window');
    assert.equal(report.possibleOverlaps[0].estimatedSource, 'track_history');
    assert.equal(report.possibleOverlaps[0].windowUsedMs, 245_910 + HANDOFF_TOLERANCE_MS);
  });

  test('never learns duration from native_mp_stop/error or case-mismatched track names, and keeps DUPLICATE_START active on unverifiable starts', () => {
    const tStop = BASE_MS;
    const tError = BASE_MS + 3_600_000;
    const tDup1 = BASE_MS + 7_200_000;
    const tDup2 = tDup1 + 5_000;

    // 1. Only stop/error + exact case mismatch -> unverifiable, never POSSIBLE_OVERLAP
    const noLearnReport = detectDoubleRing([
      {
        timeMs: tStop,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'dhuhr',
        stage: 'native_mp_start',
        details: `track=file:Archive_043.mp3, prayer=dhuhr, playId=${tStop}`,
      },
      {
        timeMs: tStop + 190_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'dhuhr',
        stage: 'native_mp_stop',
        details: `track=file:Archive_043.mp3, prayer=dhuhr, reason=user_stop, elapsedMs=190000, playId=${tStop}`,
      },
      {
        timeMs: tError,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'asr',
        stage: 'native_mp_start',
        details: `track=file:Archive_043.mp3, prayer=asr, playId=${tError}`,
      },
      {
        timeMs: tError + 180_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'asr',
        stage: 'native_mp_error',
        details: `track=file:Archive_043.mp3, prayer=asr, reason=error, elapsedMs=180000, playId=${tError}`,
      },
      {
        timeMs: tDup1,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'maghrib',
        stage: 'native_mp_start',
        details: 'track=file:Archive_043.mp3, prayer=maghrib',
      },
      {
        timeMs: tDup1 + 40_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_1',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, silent=false',
      },
      // Complete event on lowercase track name does NOT match mixed-case Archive_043.mp3
      {
        timeMs: tDup1 + 10_000_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'isha',
        stage: 'native_mp_start',
        details: `track=file:archive_043.mp3, prayer=isha, playId=${tDup1 + 10_000_000}`,
      },
      {
        timeMs: tDup1 + 10_150_000,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'isha',
        stage: 'native_mp_complete',
        details: `track=file:archive_043.mp3, prayer=isha, reason=completed, elapsedMs=150000, playId=${tDup1 + 10_000_000}`,
      },
    ]);

    assert.equal(noLearnReport.verdict, 'NONE_FOUND');
    assert.equal(noLearnReport.possibleOverlaps.length, 0);
    assert.equal(noLearnReport.unverifiableCount, 1);

    // 2. Unverifiable starts 5s apart with same (alarmType, alarmId) still report DUPLICATE_START
    const dupUnverifiableReport = detectDoubleRing([
      {
        timeMs: tDup1,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'asr',
        stage: 'native_mp_start',
        details: 'track=file:unseen_asr.mp3, prayer=asr',
      },
      {
        timeMs: tDup2,
        source: 'NATIVE',
        alarmType: 'athan',
        alarmId: 'asr',
        stage: 'native_mp_start',
        details: 'track=file:unseen_asr.mp3, prayer=asr',
      },
      {
        timeMs: tDup1 + 3_600_000,
        source: 'NATIVE',
        alarmType: 'custom',
        alarmId: 'custom_after',
        stage: 'custom_notif_post',
        details: 'soundType=reminder, notifyMode=both, silent=false',
      },
    ]);

    assert.equal(dupUnverifiableReport.verdict, 'DUPLICATE_START');
    assert.equal(dupUnverifiableReport.duplicateStarts.length, 1);
    assert.equal(dupUnverifiableReport.possibleOverlaps.length, 0);
    assert.equal(dupUnverifiableReport.unverifiableCount, 2);
  });
});
