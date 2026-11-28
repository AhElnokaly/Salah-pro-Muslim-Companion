/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeGetJSON, safeSetJSON } from '../../../utils/storage';
import { getNativeEventLog, NativeLogEvent } from '../../../services/athanAlarmPlugin';
import { AlarmConfig } from '../../../types';
import {
  DiagTestSpec,
  DiagResult,
  DiagContext,
  DiagEvidenceItem,
  DiagExpectedVsActualItem,
  DiagVerdict,
  DIAG_ALARM_PREFIX,
  isDiagAlarmId,
} from '../diagTypes';
import { evaluateMuteStateFromDetails } from '../diagRunner';

export interface ResolveRestoreRowParams {
  events: Array<{ event: string; timestampMs: number; details?: string }>;
  startedAt: number;
  khushuActivatedAt: number | null;
  durationMinutes: number;
  collectedAt: number;
  toleranceMarginMs?: number;
}

export interface RestoreRowResolution {
  status: 'MATCH' | 'MISMATCH' | 'UNMEASURED';
  actualText: string;
}

export function resolveRestoreRowStatus(params: ResolveRestoreRowParams): RestoreRowResolution {
  const {
    events,
    startedAt,
    khushuActivatedAt,
    durationMinutes,
    collectedAt,
    toleranceMarginMs = 60_000,
  } = params;

  const filterSinceMs = (khushuActivatedAt !== null && khushuActivatedAt > 0)
    ? khushuActivatedAt
    : startedAt;

  const alarmRestoreEvent = events.find(
    (evt) => evt.event === 'KHUSHU_RESTORED' &&
             evt.timestampMs >= filterSinceMs &&
             (evt.details || '').includes('source=alarm')
  );
  const otherRestoreEvents = events.filter(
    (evt) => evt.event === 'KHUSHU_RESTORED' &&
             evt.timestampMs >= filterSinceMs &&
             !(evt.details || '').includes('source=alarm')
  );

  // Case 1 & 5: If an alarm restore event is present, it's a MATCH (even if manual events also exist)
  if (alarmRestoreEvent) {
    return {
      status: 'MATCH',
      actualText: `تم تسجيل حدث استعادة المنبه التلقائية بنجاح (${alarmRestoreEvent.details || ''})`,
    };
  }

  // Case 2: Only non-alarm restore events found (manual / expired_heal)
  if (otherRestoreEvents.length > 0) {
    const otherDetails = otherRestoreEvents.map((e) => e.details).join(' | ');
    return {
      status: 'MISMATCH',
      actualText: `لم يُعثر على استعادة بالمنبه (source=alarm). عُثر على استعادة بمصدر آخر: ${otherDetails}`,
    };
  }

  // Case 3 & 4: No restore events at all -> check against expected restore deadline
  if (khushuActivatedAt !== null && khushuActivatedAt > 0) {
    const expectedRestoreAtMs = khushuActivatedAt + (durationMinutes * 60_000) + toleranceMarginMs;
    if (collectedAt < expectedRestoreAtMs) {
      return {
        status: 'UNMEASURED',
        actualText: 'لم يُعثر على أي حدث KHUSHU_RESTORED بعد (طبيعي: وقت الفحص الحالي يسبق موعد الاستعادة المتوقع)',
      };
    }
    return {
      status: 'MISMATCH',
      actualText: 'لم تُسجل أي استعادة رغم انقضاء مدة الخشوع بالكامل وهامش الأمان، قد يكون الهاتف لا يزال في وضع الصامت',
    };
  }

  return {
    status: 'UNMEASURED',
    actualText: 'لم يتم تفعيل الخشوع للتحقق من استعادته',
  };
}

export const TEST_B_SPEC: DiagTestSpec = {
  id: 'b3-khushu-custom-alarm',
  title: 'فحص تأثير وضع الخشوع على صوت المنبه المخصص (Test B: B3 Custom Alarm)',
  fixRef: 'B3',
  mode: 'timed',
  guardDurationMinutes: 40,
  touchesKeys: ['salah_custom_alarms'],

  userSteps: [
    {
      id: 'hearing_check',
      title: 'التحقق من سماع صوت المنبهات',
      description: 'تأكيد سماع منبه المقارنة (Alarm 1) ومنبه تجربة الخشوع (Alarm 2)',
      actionType: 'hearing_check',
    },
  ],

  setup: async (ctx: DiagContext) => {
    ctx.logAction('Setting up Test B synthetic custom alarms');
  },

  schedule: async (ctx: DiagContext) => {
    const now = ctx.state.startedAt;
    const alarm1Time = now + 3 * 60 * 1000; // T+3 minutes
    const alarm2Time = now + 6 * 60 * 1000; // T+6 minutes

    const id1 = `${DIAG_ALARM_PREFIX}${ctx.runId}_1`;
    const id2 = `${DIAG_ALARM_PREFIX}${ctx.runId}_2`;

    const d1 = new Date(alarm1Time);
    const d2 = new Date(alarm2Time);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr1 = `${pad(d1.getHours())}:${pad(d1.getMinutes())}`;
    const timeStr2 = `${pad(d2.getHours())}:${pad(d2.getMinutes())}`;
    const fireDate1 = `${d1.getFullYear()}-${pad(d1.getMonth() + 1)}-${pad(d1.getDate())}`;
    const fireDate2 = `${d2.getFullYear()}-${pad(d2.getMonth() + 1)}-${pad(d2.getDate())}`;

    // Synthetic Alarm 1: Control (no Khushu, one-shot)
    const controlAlarm: AlarmConfig = {
      id: id1,
      title: 'منبه تجربة المقارنة (Control)',
      type: 'fixed',
      time: timeStr1,
      enabled: true,
      soundType: 'reminder',
      notifyMode: 'both',
      autoKhushu: false,
      oneShot: true,
      fireDate: fireDate1,
      days: [d1.getDay()],
    };

    // Synthetic Alarm 2: Test (with Khushu, one-shot)
    const testAlarm: AlarmConfig = {
      id: id2,
      title: 'منبه تجربة الخشوع (B3 Test)',
      type: 'fixed',
      time: timeStr2,
      enabled: true,
      soundType: 'reminder',
      notifyMode: 'both',
      autoKhushu: true,
      khushuDurationMinutes: 15,
      oneShot: true,
      fireDate: fireDate2,
      days: [d2.getDay()],
    };

    // Collect at T+6m + 15m duration + 3m buffer = T+24m
    const collectAt = alarm2Time + 15 * 60 * 1000 + 3 * 60 * 1000;
    // Timeout expires at T+24m + 15m = T+39m
    const expiresAt = collectAt + 15 * 60 * 1000;

    // Safely inject both synthetic alarms into salah_custom_alarms
    const currentAlarms = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);
    const updated = [
      ...currentAlarms.filter((a) => !isDiagAlarmId(a.id)),
      controlAlarm,
      testAlarm,
    ];

    // CRITICAL (F6): Record created alarm IDs in state *before* updating salah_custom_alarms or dispatching event
    ctx.updateState((s) => ({
      ...s,
      phase: 'waiting',
      createdAlarmIds: [id1, id2],
      collectAt,
      expiresAt,
      snapshot: {
        ...s.snapshot,
        salah_custom_alarms: {
          ...s.snapshot.salah_custom_alarms,
          testVal: updated,
        },
      },
    }));

    safeSetJSON('salah_custom_alarms', updated);

    // Trigger in-app custom alarms listener
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: updated }));
    }

    return {
      createdAlarmIds: [id1, id2],
      collectAt,
      expiresAt,
    };
  },

  evaluate: async (ctx: DiagContext, userResponses: Record<string, any>): Promise<DiagResult> => {
    const startedAt = ctx.state.startedAt;
    const collectedAt = Date.now();
    const id1 = `${DIAG_ALARM_PREFIX}${ctx.runId}_1`;
    const id2 = `${DIAG_ALARM_PREFIX}${ctx.runId}_2`;

    // Fetch native event log
    const nativeLogs: NativeLogEvent[] = await getNativeEventLog(100).catch(() => []);
    const evidenceList: DiagEvidenceItem[] = [];
    const expectedVsActual: DiagExpectedVsActualItem[] = [];

    // Filter events belonging to this run
    let controlReceived = false;
    let testReceived = false;
    let controlReceivedMs = 0;
    let testReceivedMs = 0;
    let correlatedKhushuEvent: any = null;
    let correlatedKhushuMuteInfo = evaluateMuteStateFromDetails('');

    for (const evt of nativeLogs) {
      const details = evt.details || '';
      if ((evt.event === 'fire_received' || evt.event === 'alarm_received') && details.includes(id1)) {
        controlReceived = true;
        controlReceivedMs = evt.timestampMs;
        evidenceList.push({
          alarmId: id1,
          timestampMs: evt.timestampMs,
          evidence: 'ALARM_RECEIVED',
          details: `وصول منبه المقارنة إلى المستقبل (AthanAlarmReceiver: ${evt.event}): ${details}`,
        });
      }
      if ((evt.event === 'fire_received' || evt.event === 'alarm_received') && details.includes(id2)) {
        testReceived = true;
        testReceivedMs = evt.timestampMs;
        evidenceList.push({
          alarmId: id2,
          timestampMs: evt.timestampMs,
          evidence: 'ALARM_RECEIVED',
          details: `وصول منبه الخشوع إلى المستقبل (AthanAlarmReceiver: ${evt.event}): ${details}`,
        });
      }
      if (
        (evt.event === 'khushu_result' || evt.event === 'khushu_attempt') &&
        (details.includes(`sourceKey=${id2}`) || details.includes(id2))
      ) {
        // Correlate with test alarm: timestamp >= testReceivedMs - 2000
        const isCorrelated = !testReceivedMs || evt.timestampMs >= testReceivedMs - 2000;
        if (isCorrelated && evt.event === 'khushu_result') {
          correlatedKhushuEvent = evt;
          correlatedKhushuMuteInfo = evaluateMuteStateFromDetails(details);
          evidenceList.push({
            alarmId: id2,
            timestampMs: evt.timestampMs,
            evidence: 'ALARM_RECEIVED',
            details: `سجل تفعيل الخشوع المقترن بالمنبه (sourceKey=${id2}): ${correlatedKhushuMuteInfo.description}`,
          });
        }
      }
    }

    // F2: Contract must read hearing_check = { controlHeard: boolean, testHeard: boolean }
    const hearingCheck = userResponses?.hearing_check;
    const controlHeard = hearingCheck?.controlHeard === true;
    const testHeard = hearingCheck?.testHeard === true;

    // Timing constants for causal sound-window analysis (R12d-1 & R12d-3)
    // reminder.mp3 exact decoded PCM duration is ~51.958s (51,958 ms).
    // In R12d-3 deferred Khushu architecture, Khushu muting is scheduled at:
    // triggerAt = scheduledAtMs + delayMs, where delayMs = soundDurationMs (51,958 ms) + AUDIO_BUFFER_MARGIN_MS (4,000 ms) = 55,958 ms.
    // Minimum allowable mute time is soundDurationMs (51,958 ms) — any mute before this interrupts audio (FAIL).
    // Execution ceiling includes AUDIO_BUFFER_MARGIN_MS (4,000 ms) + 3,000 ms tolerance for AlarmManager wake-up/Doze exit:
    // Window = [51,958 ms, 58,958 ms].
    const SOUND_DURATION_MS = 51_958;
    const AUDIO_BUFFER_MARGIN_MS = 4_000;
    const ALARM_WAKEUP_TOLERANCE_MS = 3_000;
    const SCHEDULED_TRIGGER_DELAY_MS = SOUND_DURATION_MS + AUDIO_BUFFER_MARGIN_MS; // 55,958 ms
    const MAX_ALLOWED_MUTE_DELAY_MS = SCHEDULED_TRIGGER_DELAY_MS + ALARM_WAKEUP_TOLERANCE_MS; // 58,958 ms

    const deltaMs = (testReceivedMs > 0 && correlatedKhushuEvent)
      ? (correlatedKhushuEvent.timestampMs - testReceivedMs)
      : null;

    // Deferred Khushu Timing Verification:
    // - deltaMs < SOUND_DURATION_MS: Pre-mature mute during audio playback (FAIL).
    // - deltaMs between [51,958, 58,958]: Expected deferred mute safely after audio finishes (PASS).
    // - deltaMs > MAX_ALLOWED_MUTE_DELAY_MS: Excessive delay or system throttling (INCONCLUSIVE).
    const isMuteDuringPlayback = deltaMs !== null && deltaMs < SOUND_DURATION_MS;
    const isMuteInDeferredWindow = deltaMs !== null && deltaMs >= SOUND_DURATION_MS && deltaMs <= MAX_ALLOWED_MUTE_DELAY_MS;
    const isMuteExcessivelyDelayed = deltaMs !== null && deltaMs > MAX_ALLOWED_MUTE_DELAY_MS;

    // Analyze khushu_attempt events for origin and duplicate attempts (Item A verification)
    let khushuAttemptOrigin = 'غير متوفر';
    let khushuAttemptsForTestAlarm = 0;
    let emptySourceKeyAttempts = 0;

    for (const evt of nativeLogs) {
      if (evt.event === 'khushu_attempt') {
        const d = evt.details || '';
        if (d.includes(`sourceKey=${id2}`) || d.includes(id2)) {
          khushuAttemptsForTestAlarm++;
          const originMatch = d.match(/origin=([^, ]+)/);
          if (originMatch) {
            khushuAttemptOrigin = originMatch[1];
          }
        }
        if (d.includes('sourceKey=,') || d.includes('sourceKey= ') || d.includes('sourceKey=""') || /sourceKey=\s*(,|$)/.test(d)) {
          // If within the run time window
          if (evt.timestampMs >= startedAt && evt.timestampMs <= collectedAt) {
            emptySourceKeyAttempts++;
          }
        }
      }
    }

    expectedVsActual.push({
      parameter: 'منبه المقارنة 1 (Control)',
      expected: 'ALARM_RECEIVED وسماع الصوت',
      actual: controlReceived
        ? `ALARM_RECEIVED مسجل (شهادة المستخدم: ${controlHeard ? 'تم السماع ✓' : 'لم يُسمع ✕'})`
        : 'لم يُسجل وصول المنبه',
      status: controlReceived && controlHeard ? 'MATCH' : 'MISMATCH',
    });

    expectedVsActual.push({
      parameter: 'منبه الخشوع 2 (B3 Test)',
      expected: 'ALARM_RECEIVED مع قياس كتم الصوت',
      actual: testReceived
        ? `ALARM_RECEIVED مسجل (شهادة المستخدم: ${testHeard ? 'تم السماع ✓' : 'لم يُسمع ✕'})`
        : 'لم يُسجل وصول المنبه',
      status: testReceived ? 'MATCH' : 'MISMATCH',
    });

    expectedVsActual.push({
      parameter: 'اقتران حدث الخشوع بمنبه الاختبار (sourceKey)',
      expected: `sourceKey=${id2}`,
      actual: correlatedKhushuEvent ? `مقترن بنجاح (${correlatedKhushuMuteInfo.description})` : 'لم يُعثر على حدث خشوع مقترن',
      status: correlatedKhushuEvent ? 'MATCH' : 'MISMATCH',
    });

    expectedVsActual.push({
      parameter: 'مصدر تفعيل الخشوع الأصلي (Item A Origin)',
      expected: 'native_deferred_custom_alarm',
      actual: khushuAttemptOrigin,
      status: khushuAttemptOrigin === 'native_deferred_custom_alarm' ? 'MATCH' : 'MISMATCH',
    });

    expectedVsActual.push({
      parameter: 'عدد محاولات تفعيل الخشوع للمنبه (Idempotency)',
      expected: '1 محاولة فقط (بدون تكرار مزدوج من الواجهة)',
      actual: `${khushuAttemptsForTestAlarm} محاولة (محاولات فارغة المصدر في النافذة: ${emptySourceKeyAttempts})`,
      status: khushuAttemptsForTestAlarm === 1 && emptySourceKeyAttempts === 0 ? 'MATCH' : 'MISMATCH',
    });

    expectedVsActual.push({
      parameter: 'حالة كتم النظام (Mute State Telemetry)',
      expected: 'ringerMode في {0, 1} أو interruptionFilter في {3, 4}',
      actual: correlatedKhushuMuteInfo.description,
      status: correlatedKhushuMuteInfo.isMuted ? 'MATCH' : 'UNMEASURED',
    });

    // Resolve automatic Khushu restoration row status using pure function
    const khushuActivatedAt = correlatedKhushuEvent
      ? correlatedKhushuEvent.timestampMs
      : (testReceivedMs > 0 ? testReceivedMs + SCHEDULED_TRIGGER_DELAY_MS : null);

    const restoreResolution = resolveRestoreRowStatus({
      events: nativeLogs,
      startedAt,
      khushuActivatedAt,
      durationMinutes: 15,
      collectedAt,
      toleranceMarginMs: 60_000,
    });

    expectedVsActual.push({
      parameter: 'التزامن الزمني للخشوع المؤجل (Deferred Timing Window)',
      expected: `كتم مؤجل بعد انتهاء الصوت [${SOUND_DURATION_MS} - ${MAX_ALLOWED_MUTE_DELAY_MS} ms] (موعد الجدولة: ${SCHEDULED_TRIGGER_DELAY_MS} ms)`,
      actual: deltaMs !== null
        ? `${deltaMs} ملي ثانية (${isMuteInDeferredWindow ? 'كتم مؤجل سليم بعد انتهاء الصوت تماماً' : isMuteDuringPlayback ? 'كتم مبكر أثناء تشغيل الصوت (خطأ)' : 'تأخر زائد في تنفيذ المنبه المؤجل'})`
        : 'تعذر حساب فارق التوقيت لغياب أحد الحدثين',
      status: deltaMs !== null && isMuteInDeferredWindow ? 'MATCH' : 'MISMATCH',
    });

    expectedVsActual.push({
      parameter: 'تسجيل الاستعادة التلقائية بالمنبه (KHUSHU_RESTORED)',
      expected: 'تسجيل حدث KHUSHU_RESTORED بـ source=alarm (عند اكتمال مدة الخشوع 15 دقيقة)',
      actual: restoreResolution.actualText,
      status: restoreResolution.status,
    });

    // Apply strict verdict matrix for deferred architecture
    let verdict: DiagVerdict = 'INCONCLUSIVE';
    let reason = '';

    if (!controlReceived || !testReceived) {
      verdict = 'INCONCLUSIVE';
      reason = 'أحد المنبهات الاصطناعية لم يصل إلى مستقبل النظام (AthanAlarmReceiver).';
    } else if (!controlHeard && !testHeard) {
      verdict = 'INCONCLUSIVE';
      reason = 'لم يُسمع منبه المقارنة ولا منبه الخشوع؛ لا يوجد خط أساس للمقارنة الصوتية.';
    } else if (!controlHeard && testHeard) {
      verdict = 'INCONCLUSIVE';
      reason = 'انعكاس غير متوقع: لم يُسمع منبه المقارنة بينما سُمع منبه الخشوع.';
    } else if (!correlatedKhushuEvent) {
      verdict = 'INCONCLUSIVE';
      reason = 'لم يُعثر على حدث تفعيل وضع الخشوع المقترن بمنبه الاختبار الثاني (sourceKey).';
    } else if (!correlatedKhushuMuteInfo.isMuted) {
      verdict = 'INCONCLUSIVE';
      reason = `سجل الخشوع المقترن بالمنبه الثاني لم يحقق حالة الكتم المطلوبة (${correlatedKhushuMuteInfo.description}).`;
    } else if (isMuteDuringPlayback) {
      verdict = 'FAIL';
      reason = `فشل التحقق: كتم الخشوع تم قبل انتهاء صوت المنبه المخصص (فارق التوقيت ${deltaMs}ms أقل من مدة الصوت ${SOUND_DURATION_MS}ms).`;
    } else if (controlHeard && testHeard && correlatedKhushuMuteInfo.isMuted && isMuteInDeferredWindow && khushuAttemptsForTestAlarm === 1) {
      verdict = 'PASS';
      reason = `نجح الاختبار بالكامل (PASS): سُمع صوت المنبه المخصص بالكامل حتى نهايته، ثم تم كتم النظام بنجاح بعد انتهاء الصوت في النافذة المؤجلة المحددة (${deltaMs}ms) بمحاولة تفعيل أصلية واحدة (${khushuAttemptOrigin}).`;
    } else if (isMuteExcessivelyDelayed) {
      verdict = 'INCONCLUSIVE';
      reason = `كتم الخشوع تم بعد تأخر زائد عن النافذة المحددة (${deltaMs}ms مقابل الحد الأقصى المتوقع ${MAX_ALLOWED_MUTE_DELAY_MS}ms).`;
    } else {
      verdict = 'INCONCLUSIVE';
      reason = 'النتائج غير حاسمة؛ يرجى مراجعة مصفوفة المتوقع مقابل الفعلي وسجل الأحداث.';
    }

    const markdownReport = `# تقرير تشخيص Test B: فحص الخشوع المؤجل للمنبه المخصص (Deferred Architecture)
- **المعرّف:** ${ctx.runId}
- **النتيجة النهائية:** **${verdict}**
- **السبب:** ${reason}
- **توقيت البدء:** ${new Date(startedAt).toLocaleString('ar-EG')}
- **توقيت الجمع:** ${new Date(collectedAt).toLocaleString('ar-EG')}
- **توقيت وصول منبه الاختبار (testReceived):** ${testReceivedMs ? new Date(testReceivedMs).toLocaleTimeString('ar-EG') + ` (${testReceivedMs} ms)` : 'غير متوفر'}
- **توقيت كتم الخشوع المقترن (khushuMute):** ${correlatedKhushuEvent ? new Date(correlatedKhushuEvent.timestampMs).toLocaleTimeString('ar-EG') + ` (${correlatedKhushuEvent.timestampMs} ms)` : 'غير متوفر'}
- **فارق التوقيت الفعلي (Delta):** ${deltaMs !== null ? `${deltaMs} ملي ثانية` : 'غير متوفر'} (النافذة المتوقعة: ${SOUND_DURATION_MS} - ${MAX_ALLOWED_MUTE_DELAY_MS} ms، موعد الجدولة: ${SCHEDULED_TRIGGER_DELAY_MS} ms)
- **مصدر التفعيل (Origin):** ${khushuAttemptOrigin} (المحاولات للمنبه: ${khushuAttemptsForTestAlarm}، محاولات بمصدر فارغ: ${emptySourceKeyAttempts})

## مصفوفة المتوقع مقابل الفعلي
| البند | المتوقع | الفعلي | النتيجة |
|---|---|---|---|
${expectedVsActual.map((item) => `| ${item.parameter} | ${item.expected} | ${item.actual} | ${item.status === 'MATCH' ? 'مطابق ✓' : item.status === 'MISMATCH' ? 'غير مطابق ✕' : 'لم يُقَس'} |`).join('\n')}

## سجل الأدلة البرمجية المسترجعة (Evidence Log)
${evidenceList.length > 0 ? evidenceList.map((e, idx) => `${idx + 1}. [${new Date(e.timestampMs).toLocaleTimeString('ar-EG')}] **${e.evidence}** (${e.alarmId}): ${e.details}`).join('\n') : 'لا توجد أحداث مسجلة في السجل الأصلي.'}

## شهادة المستخدم (Human Hearing Confirmation)
- سماع منبه المقارنة (T+3m): **${controlHeard ? 'نعم (مسموع)' : 'لا (غير مسموع)'}**
## تنبيه منهجي هام
المنبهات المخصصة تعمل عبر قناة إشعارات أندرويد وتصدر الصوت عبر النظام، ولذلك لا توجد إشارة تقنية برمجية مباشرة لاكتمال الصوت (مثل مشغل الأذان الكامل). الحكم اعتمد على تلاقي الأدلة: وصول الإشعار + اقتران حدث الخشوع عبر sourceKey + كتم رنين النظام + شهادة السماع الحقيقية.
`;

    return {
      runId: ctx.runId,
      testId: 'b3-khushu-custom-alarm',
      fixRef: 'B3',
      verdict,
      reason,
      startedAt,
      collectedAt,
      deviceInfo: { appVersion: '1.2.1' },
      expectedVsActual,
      evidenceList,
      markdownReport,
    };
  },
};
