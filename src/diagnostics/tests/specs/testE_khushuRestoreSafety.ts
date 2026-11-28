/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KhushuMode } from '../../../services/khushuModePlugin';
import { getAlarmDiagnostics, getNativeEventLog, NativeLogEvent } from '../../../services/athanAlarmPlugin';
import {
  DiagTestSpec,
  DiagResult,
  DiagContext,
  DiagEvidenceItem,
  DiagExpectedVsActualItem,
  DiagVerdict,
} from '../diagTypes';

export const TEST_E_SPEC: DiagTestSpec = {
  id: 'test-e-khushu-restore-safety',
  title: 'فحص سلامة تفعيل واستعادة وضع الخشوع والمعاملات الآمنة (Test E)',
  fixRef: 'B1',
  mode: 'instant',
  guardDurationMinutes: 5,
  touchesKeys: ['hemmaty_khushu_settings_v2'],

  setup: async (ctx: DiagContext) => {
    ctx.logAction('Setting up Test E: Khushu Restore & Transaction Safety');
  },

  evaluate: async (ctx: DiagContext): Promise<DiagResult> => {
    const startedAt = ctx.state.startedAt;
    const collectedAt = Date.now();
    const evidenceList: DiagEvidenceItem[] = [];
    const expectedVsActual: DiagExpectedVsActualItem[] = [];

    let didActivateInTest = false;
    let verdict: DiagVerdict = 'PASS';
    let failureReason = '';

    try {
      // ==========================================
      // E1: Baseline Check (Explicit pre-check before touching anything)
      // ==========================================
      const initialStatus = await KhushuMode.getStatus();
      if (initialStatus.active) {
        evidenceList.push({
          alarmId: 'baseline',
          timestampMs: Date.now(),
          evidence: 'USER_CONFIRMED',
          details: `E1 Pre-check: active=${initialStatus.active}, activatedAt=${initialStatus.activatedAt ?? 0}, ringerMode=${initialStatus.ringerMode ?? -1}`,
        });
        expectedVsActual.push({
          parameter: 'E1. حالة الخشوع الابتدائية',
          expected: 'غير نشط (active === false)',
          actual: `active=${initialStatus.active}`,
          status: 'MISMATCH',
        });
        return {
          runId: ctx.runId,
          testId: 'test-e-khushu-restore-safety',
          fixRef: 'B1',
          verdict: 'INCONCLUSIVE',
          reason: 'يوجد جلسة خشوع نشطة؛ أوقفها ثم أعد الاختبار',
          startedAt,
          collectedAt,
          deviceInfo: { appVersion: '1.2.1' },
          expectedVsActual,
          evidenceList,
          markdownReport: '# تقرير Test E: غير حاسم — يوجد جلسة خشوع نشطة؛ أوقفها ثم أعد الاختبار',
        };
      }

      const initialDiag = await getAlarmDiagnostics();

      const initialRinger = initialStatus.ringerMode ?? -1;
      const initialFilter = initialStatus.interruptionFilter ?? -1;
      const canScheduleExact = initialDiag?.canScheduleExactAlarms ?? false;

      evidenceList.push({
        alarmId: 'baseline',
        timestampMs: Date.now(),
        evidence: 'USER_CONFIRMED',
        details: `E1 Baseline: active=${initialStatus.active}, ringerMode=${initialRinger}, interruptionFilter=${initialFilter}, canScheduleExactAlarms=${canScheduleExact}`,
      });

      expectedVsActual.push({
        parameter: 'E1. حالة الخشوع الابتدائية',
        expected: 'غير نشط (active === false)',
        actual: `active=${initialStatus.active}`,
        status: !initialStatus.active ? 'MATCH' : 'MISMATCH',
      });

      expectedVsActual.push({
        parameter: 'E1. خط أساس رنين الجهاز (Baseline Ringer)',
        expected: 'وضع الرنين العادي (NORMAL = 2)',
        actual: `ringerMode=${initialRinger}`,
        status: initialRinger === 2 ? 'MATCH' : 'MISMATCH',
      });

      expectedVsActual.push({
        parameter: 'E1. صلاحية المنبهات الدقيقة (Exact Alarms)',
        expected: 'ممنوحة (true)',
        actual: `canScheduleExactAlarms=${canScheduleExact}`,
        status: canScheduleExact ? 'MATCH' : 'MISMATCH',
      });

      if (initialRinger !== 2) {
        return {
          runId: ctx.runId,
          testId: 'test-e-khushu-restore-safety',
          fixRef: 'B1',
          verdict: 'INCONCLUSIVE',
          reason: `وضع الرنين الابتدائي للجهاز (${initialRinger}) ليس عادياً (NORMAL=2). يتطلب الاختبار أن يكون صوت الهاتف في الوضع العادي للتحقق من الكتم والاستعادة بدقة.`,
          startedAt,
          collectedAt,
          deviceInfo: { appVersion: '1.2.1' },
          expectedVsActual,
          evidenceList,
          markdownReport: '# تقرير Test E: نتيجة غير حاسمة بسبب خط أساس الرنين',
        };
      }

      // ==========================================
      // E2: First Activation (2 minutes, origin='diag_test')
      // ==========================================
      const act1 = await KhushuMode.activate({
        mode: 'silent',
        durationMinutes: 2,
        origin: 'diag_test',
      });
      didActivateInTest = Boolean(act1?.active) && !act1?.alreadyActive;

      if (!didActivateInTest) {
        return {
          runId: ctx.runId,
          testId: 'test-e-khushu-restore-safety',
          fixRef: 'B1',
          verdict: 'INCONCLUSIVE',
          reason: 'يوجد جلسة خشوع نشطة؛ أوقفها ثم أعد الاختبار',
          startedAt,
          collectedAt,
          deviceInfo: { appVersion: '1.2.1' },
          expectedVsActual,
          evidenceList,
          markdownReport: '# تقرير Test E: غير حاسم — توجد جلسة خشوع نشطة عند التفعيل',
        };
      }

      const statusAfterE2 = await KhushuMode.getStatus();
      evidenceList.push({
        alarmId: 'act1',
        timestampMs: Date.now(),
        evidence: 'USER_CONFIRMED',
        details: `E2 Act1: active=${act1.active}, alreadyActive=${act1.alreadyActive}, activatedAt=${statusAfterE2.activatedAt}, hasPendingRestore=${statusAfterE2.hasPendingRestoreAlarm}, ringer=${statusAfterE2.ringerMode}`,
      });

      expectedVsActual.push({
        parameter: 'E2. نتيجة التفعيل الأول',
        expected: 'active === true مع alreadyActive === false',
        actual: `active=${act1.active}, alreadyActive=${act1.alreadyActive ?? false}`,
        status: act1.active && !act1.alreadyActive ? 'MATCH' : 'MISMATCH',
      });

      expectedVsActual.push({
        parameter: 'E2. جدولة منبه الاستعادة الآمن',
        expected: 'hasPendingRestoreAlarm === true',
        actual: `hasPendingRestoreAlarm=${statusAfterE2.hasPendingRestoreAlarm}`,
        status: statusAfterE2.hasPendingRestoreAlarm === true ? 'MATCH' : 'MISMATCH',
      });

      expectedVsActual.push({
        parameter: 'E2. تطبيق كتم الصوت',
        expected: 'انتقال رنين الهاتف إلى الصامت أو الاهتزاز (ringerMode != NORMAL)',
        actual: `ringerMode=${statusAfterE2.ringerMode} (0=SILENT, 1=VIBRATE)`,
        status: statusAfterE2.ringerMode !== undefined && statusAfterE2.ringerMode !== 2 && (statusAfterE2.ringerMode === 0 || statusAfterE2.ringerMode === 1) ? 'MATCH' : 'MISMATCH',
      });

      // ==========================================
      // E3: Second Activation (Idempotency Test)
      // ==========================================
      const act2 = await KhushuMode.activate({
        mode: 'silent',
        durationMinutes: 5, // Attempting different duration
        origin: 'diag_test',
      });

      const statusAfterE3 = await KhushuMode.getStatus();
      evidenceList.push({
        alarmId: 'act2',
        timestampMs: Date.now(),
        evidence: 'USER_CONFIRMED',
        details: `E3 Act2: active=${act2.active}, alreadyActive=${act2.alreadyActive}, activatedAt=${statusAfterE3.activatedAt}, ringer=${statusAfterE3.ringerMode}`,
      });

      expectedVsActual.push({
        parameter: 'E3. حارس التكرار في التفعيل الثاني (Idempotency)',
        expected: 'active === true مع alreadyActive === true (بدون رفض)',
        actual: `active=${act2.active}, alreadyActive=${act2.alreadyActive}`,
        status: act2.active && act2.alreadyActive === true ? 'MATCH' : 'MISMATCH',
      });

      // ==========================================
      // E4: Timer & Telemetry Integrity
      // ==========================================
      const timerUnchanged = statusAfterE2.activatedAt === statusAfterE3.activatedAt && (statusAfterE2.activatedAt ?? 0) > 0;
      evidenceList.push({
        alarmId: 'timer_check',
        timestampMs: Date.now(),
        evidence: 'USER_CONFIRMED',
        details: `E4 Timer Parity: E2.activatedAt=${statusAfterE2.activatedAt} vs E3.activatedAt=${statusAfterE3.activatedAt} (diff=${(statusAfterE3.activatedAt ?? 0) - (statusAfterE2.activatedAt ?? 0)}ms)`,
      });

      expectedVsActual.push({
        parameter: 'E4. ثبات توقيت البدء وعدم تمديد المؤقت (No Timer Extension)',
        expected: 'تطابق تام بالملي ثانية (activatedAt لا يتغير)',
        actual: `E2=${statusAfterE2.activatedAt} vs E3=${statusAfterE3.activatedAt}`,
        status: timerUnchanged ? 'MATCH' : 'MISMATCH',
      });

      // Check Telemetry events for KHUSHU_RESTORE_SCHEDULED
      const nativeLogs: NativeLogEvent[] = await getNativeEventLog(50).catch(() => []);
      const restoreScheduledEvt = nativeLogs.find((e: NativeLogEvent) => e.event === 'KHUSHU_RESTORE_SCHEDULED' && e.timestampMs >= startedAt);

      const hasScheduledLog = !!restoreScheduledEvt;
      const details = restoreScheduledEvt?.details || '';
      const isExactLogged = details.includes('isExact=');
      const methodLogged = details.includes('method=');

      expectedVsActual.push({
        parameter: 'E4. تسجيل حدث التيليمتري KHUSHU_RESTORE_SCHEDULED',
        expected: 'مسجل مع isExact و method صريحين',
        actual: hasScheduledLog ? details : 'لم يُعثر على الحدث في سجل التيليمتري',
        status: hasScheduledLog && isExactLogged && methodLogged ? 'MATCH' : 'MISMATCH',
      });

      // ==========================================
      // E5: Deactivate
      // ==========================================
      const deact = await KhushuMode.deactivate();
      didActivateInTest = false;

      const statusAfterE5 = await KhushuMode.getStatus();
      evidenceList.push({
        alarmId: 'deact',
        timestampMs: Date.now(),
        evidence: 'USER_CONFIRMED',
        details: `E5 Deact: active=${statusAfterE5.active}, ringer=${statusAfterE5.ringerMode}, filter=${statusAfterE5.interruptionFilter}, pendingAlarm=${statusAfterE5.hasPendingRestoreAlarm}`,
      });

      expectedVsActual.push({
        parameter: 'E5. إنهاء وضع الخشوع (Deactivation)',
        expected: 'active === false',
        actual: `active=${statusAfterE5.active}`,
        status: !statusAfterE5.active ? 'MATCH' : 'MISMATCH',
      });

      // ==========================================
      // E6: Audio & Ringer Mode Restoration Check
      // ==========================================
      const ringerRestored = statusAfterE5.ringerMode === initialRinger;
      const filterRestored = initialFilter === -1 || statusAfterE5.interruptionFilter === initialFilter;

      expectedVsActual.push({
        parameter: 'E6. استعادة وضع رنين الهاتف الأصلي (Ringer Restoration)',
        expected: `ringerMode === ${initialRinger} (نفس خط الأساس)`,
        actual: `ringerMode=${statusAfterE5.ringerMode}`,
        status: ringerRestored ? 'MATCH' : 'MISMATCH',
      });

      expectedVsActual.push({
        parameter: 'E6. استعادة فلتر عدم الإزعاج (Filter Restoration)',
        expected: `interruptionFilter === ${initialFilter}`,
        actual: `interruptionFilter=${statusAfterE5.interruptionFilter}`,
        status: filterRestored ? 'MATCH' : 'MISMATCH',
      });

      // Check KHUSHU_RESTORED event
      const nativeLogsAfter: NativeLogEvent[] = await getNativeEventLog(30).catch(() => []);
      const restoredEvt = nativeLogsAfter.find((e: NativeLogEvent) => e.event === 'KHUSHU_RESTORED' && e.timestampMs >= startedAt);

      expectedVsActual.push({
        parameter: 'E6. توثيق الاستعادة في التيليمتري (KHUSHU_RESTORED)',
        expected: 'مسجل في السجل الأصلي مع مصدر manual والقيم المستعادة',
        actual: restoredEvt ? restoredEvt.details : 'لم يُعثر على حدث KHUSHU_RESTORED',
        status: restoredEvt ? 'MATCH' : 'MISMATCH',
      });

      // Determine final verdict
      const hasMismatch = expectedVsActual.some((item) => item.status === 'MISMATCH');
      if (hasMismatch) {
        verdict = 'FAIL';
        failureReason = 'فشل أحد معايير التحقق لسلامة الاستعادة والمعاملات الآمنة.';
      } else {
        verdict = 'PASS';
        failureReason = 'نجحت جميع فحوصات Test E لسلامة المعاملات: الجدولة أولاً، حارس التكرار، ثبات المؤقت، استعادة الرنين الكاملة وتوثيق التيليمتري.';
      }
    } catch (err: any) {
      verdict = 'FAIL';
      failureReason = `حدث استثناء غير متوقع أثناء الفحص: ${err?.message || err}`;
    } finally {
      // Clean up: Ensure phone is never left muted if test was responsible for activating
      if (didActivateInTest) {
        try {
          await KhushuMode.deactivate();
        } catch (_e) {}
      }
    }

    const markdownReport = `# تقرير تشخيص Test E: سلامة تفعيل واستعادة وضع الخشوع (B1 Safety)
- **المعرّف:** ${ctx.runId}
- **النتيجة النهائية:** **${verdict}**
- **السبب:** ${failureReason}
- **توقيت البدء:** ${new Date(startedAt).toLocaleString('ar-EG')}
- **توقيت الجمع:** ${new Date(collectedAt).toLocaleString('ar-EG')}

## مصفوفة المتوقع مقابل الفعلي
| البند | المتوقع | الفعلي | النتيجة |
|---|---|---|---|
${expectedVsActual.map((item) => `| ${item.parameter} | ${item.expected} | ${item.actual} | ${item.status === 'MATCH' ? 'مطابق ✓' : item.status === 'MISMATCH' ? 'غير مطابق ✕' : 'لم يُقَس'} |`).join('\n')}

## سجل الأدلة البرمجية (Evidence Log)
${evidenceList.map((e, idx) => `${idx + 1}. [${new Date(e.timestampMs).toLocaleTimeString('ar-EG')}] (${e.alarmId}): ${e.details}`).join('\n')}
`;

    return {
      runId: ctx.runId,
      testId: 'test-e-khushu-restore-safety',
      fixRef: 'B1',
      verdict,
      reason: failureReason,
      startedAt,
      collectedAt,
      deviceInfo: { appVersion: '1.2.1' },
      expectedVsActual,
      evidenceList,
      markdownReport,
    };
  },
};
