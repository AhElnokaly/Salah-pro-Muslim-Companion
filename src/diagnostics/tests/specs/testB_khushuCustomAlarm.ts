/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeGetJSON, safeSetJSON } from '../../../utils/storage';
import { getNativeEventLog } from '../../../services/athanAlarmPlugin';
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
    const nativeLogs = await getNativeEventLog(100).catch(() => []);
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

    // Timing constants for causal sound-window analysis (R12d-1)
    // reminder.mp3 measured audio duration is ~52.4s (52,448 ms).
    // If Khushu muting occurs after 52,448 ms, the sound had already finished playing,
    // so inaudibility cannot be causally attributed to Khushu mute.
    const ESTIMATED_SOUND_DURATION_MS = 52_448;
    const AUDIO_STARTUP_TOLERANCE_MS = 1_000;

    const deltaMs = (testReceivedMs > 0 && correlatedKhushuEvent)
      ? (correlatedKhushuEvent.timestampMs - testReceivedMs)
      : null;

    // Causal relationship:
    // - deltaMs < ESTIMATED_SOUND_DURATION_MS: Khushu muted system before or during playback.
    // - deltaMs >= ESTIMATED_SOUND_DURATION_MS: Khushu muted system AFTER sound playback finished.
    const isMuteDuringPlayback = deltaMs !== null && deltaMs < ESTIMATED_SOUND_DURATION_MS;
    const isMuteAfterPlayback = deltaMs !== null && deltaMs >= ESTIMATED_SOUND_DURATION_MS;

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
      parameter: 'حالة كتم النظام (Mute State Telemetry)',
      expected: 'ringerMode في {0, 1} أو interruptionFilter في {3, 4}',
      actual: correlatedKhushuMuteInfo.description,
      status: correlatedKhushuMuteInfo.isMuted ? 'MATCH' : 'UNMEASURED',
    });

    expectedVsActual.push({
      parameter: 'التزامن السببي بين المنبه وكتم الخشوع (Causal Timing)',
      expected: `كتم متزامن أو أثناء نافذة الصوت (< ${ESTIMATED_SOUND_DURATION_MS} ms)`,
      actual: deltaMs !== null
        ? `${deltaMs} ملي ثانية (${isMuteAfterPlayback ? 'كتم متأخر بعد انتهاء الصوت — ينفي السببية' : isMuteDuringPlayback ? 'كتم متزامن/متداخل أثناء نافذة تشغيل الصوت' : 'غير محدد'})`
        : 'تعذر حساب فارق التوقيت لغياب أحد الحدثين',
      status: deltaMs !== null && isMuteDuringPlayback ? 'MATCH' : isMuteAfterPlayback ? 'MISMATCH' : 'UNMEASURED',
    });

    // Apply strict verdict matrix with causal timing validation (R12d-1)
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
    } else if (controlHeard && !testHeard && correlatedKhushuMuteInfo.isMuted) {
      if (isMuteAfterPlayback) {
        // Causal failure (R12d-1): Khushu mute happened AFTER audio duration finished!
        // The lack of audio cannot be caused by Khushu mute.
        verdict = 'INCONCLUSIVE';
        reason = `عدم سماع منبه الخشوع لا يمكن عزوه سببياً لوضع الخشوع؛ لأن كتم النظام حدث بعد انتهاء مدة الصوت المقدرة بفارق (${deltaMs} ملي ثانية مقابل مدة الصوت ${ESTIMATED_SOUND_DURATION_MS} ملي ثانية). غياب دليل سببي كافٍ يقتضي فحص تيليمتري قنوات الإشعار ومستويات الصوت.`;
      } else {
        verdict = 'SUPPORTS_HYPOTHESIS';
        reason = `تم تأكيد الفرضية (B3): سُمع منبه المقارنة ولم يُسمع منبه الخشوع، مع توثيق كتم الصوت بالنظام أثناء نافذة تشغيل المنبه (فارق التوقيت: ${deltaMs} ملي ثانية).`;
      }
    } else if (controlHeard && testHeard && correlatedKhushuMuteInfo.isMuted) {
      verdict = 'REFUTED';
      reason = 'سُمع صوت المنبه المخصص الثاني بوضوح رغم تفعيل وكتم وضع الخشوع المقترن (الفرضية غير صحيحة أو الصوت صدر قبل اكتمال الكتم).';
    } else {
      verdict = 'INCONCLUSIVE';
      reason = 'الأدلة غير كافية لقطع الشك باليقين بشأن كتم الصوت.';
    }

    const markdownReport = `# تقرير تشخيص Test B: تأثير وضع الخشوع على المنبه المخصص (B3)
- **المعرّف:** ${ctx.runId}
- **النتيجة النهائية:** **${verdict}**
- **السبب:** ${reason}
- **توقيت البدء:** ${new Date(startedAt).toLocaleString('ar-EG')}
- **توقيت الجمع:** ${new Date(collectedAt).toLocaleString('ar-EG')}
- **توقيت وصول منبه الاختبار (testReceived):** ${testReceivedMs ? new Date(testReceivedMs).toLocaleTimeString('ar-EG') + ` (${testReceivedMs} ms)` : 'غير متوفر'}
- **توقيت كتم الخشوع المقترن (khushuMute):** ${correlatedKhushuEvent ? new Date(correlatedKhushuEvent.timestampMs).toLocaleTimeString('ar-EG') + ` (${correlatedKhushuEvent.timestampMs} ms)` : 'غير متوفر'}
- **فارق التوقيت (Delta):** ${deltaMs !== null ? `${deltaMs} ملي ثانية` : 'غير متوفر'} (مدة الصوت المقدرة: ${ESTIMATED_SOUND_DURATION_MS} ms)
- **العلاقة السببية:** ${isMuteAfterPlayback ? 'كتم متأخر بعد انتهاء الصوت — ينفي السببية ويستوجب فحص مسار الإشعار ومستويات الصوت' : isMuteDuringPlayback ? 'كتم متزامن/متداخل مع تشغيل الصوت — يدعم الفرضية' : 'غير محدد'}

## مصفوفة المتوقع مقابل الفعلي
| البند | المتوقع | الفعلي | النتيجة |
|---|---|---|---|
${expectedVsActual.map((item) => `| ${item.parameter} | ${item.expected} | ${item.actual} | ${item.status === 'MATCH' ? 'مطابق ✓' : item.status === 'MISMATCH' ? 'غير مطابق ✕' : 'لم يُقَس'} |`).join('\n')}

## سجل الأدلة البرمجية المسترجعة (Evidence Log)
${evidenceList.length > 0 ? evidenceList.map((e, idx) => `${idx + 1}. [${new Date(e.timestampMs).toLocaleTimeString('ar-EG')}] **${e.evidence}** (${e.alarmId}): ${e.details}`).join('\n') : 'لا توجد أحداث مسجلة في السجل الأصلي.'}

## شهادة المستخدم (Human Hearing Confirmation)
- سماع منبه المقارنة (T+3m): **${controlHeard ? 'نعم (مسموع)' : 'لا (غير مسموع)'}**
- سماع منبه الخشوع (T+6m): **${testHeard ? 'نعم (مسموع)' : 'لا (غير مسموع)'}**

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
