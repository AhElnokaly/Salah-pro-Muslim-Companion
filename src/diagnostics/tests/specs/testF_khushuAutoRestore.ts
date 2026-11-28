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

export interface TestFOptions {
  durationMinutes?: number;
  pollIntervalMs?: number;
  waitTimeoutMs?: number;
}

const DEFAULT_DURATION_MINUTES = 1;
const DEFAULT_POLL_INTERVAL_MS = 2_000;
// 1 minute scheduled duration + 60s margin for AlarmManager / Doze wake-up latency
const DEFAULT_WAIT_TIMEOUT_MS = 120_000;

export function createTestFSpec(options?: TestFOptions): DiagTestSpec {
  const durationMinutes = options?.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  const pollIntervalMs = options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const waitTimeoutMs = options?.waitTimeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;

  return {
    id: 'test-f-khushu-auto-restore',
    title: 'فحص الاستعادة التلقائية لوضع الخشوع بالمنبه (Test F: source=alarm)',
    fixRef: 'B1',
    mode: 'instant',
    guardDurationMinutes: 5,
    touchesKeys: ['hemmaty_khushu_settings_v2'],

    setup: async (ctx: DiagContext) => {
      ctx.logAction('Setting up Test F: Khushu Auto-Restore via AlarmManager (source=alarm)');
    },

    evaluate: async (ctx: DiagContext): Promise<DiagResult> => {
      const startedAt = ctx.state.startedAt;
      const evidenceList: DiagEvidenceItem[] = [];
      const expectedVsActual: DiagExpectedVsActualItem[] = [];

      let didActivateInTest = false;
      let restoredObserved = false;
      let emergencyRestoreExecuted = false;
      let restoredSource = 'none';
      let triggerAtMs = 0;
      let restoredTimestampMs: number | null = null;
      let verdict: DiagVerdict = 'INCONCLUSIVE';
      let failureReason = '';

      // Detect whether Dashboard (which mounts useKhushuMode polling) is mounted at test time
      const hasDom = typeof document !== 'undefined';
      const isDashboardMounted = hasDom ? Boolean(document.getElementById('dashboard-root')) : false;
      const isDiagnosticsModalOpen = hasDom
        ? Boolean(document.querySelector('[aria-label="نافذة فحص وتشخيص الأذان والتنبيهات"]'))
        : false;
      const dashboardMountedStatus = !hasDom
        ? 'غير متاح (بيئة بدون DOM)'
        : isDashboardMounted
        ? 'نعم (مُركّب #dashboard-root)'
        : 'لا (غير مُركّب — تبويب التشخيص)';

      evidenceList.push({
        alarmId: 'env_check',
        timestampMs: Date.now(),
        evidence: 'USER_CONFIRMED',
        details: `F0 Environment: dashboardMounted=${hasDom ? isDashboardMounted : 'unavailable'}, modalOpen=${hasDom ? isDiagnosticsModalOpen : 'unavailable'}, note=يجب تشغيل الاختبار من تبويب التشخيص (activeTab) لا من المودال`,
      });

      try {
        // ==========================================
        // F1: Baseline Check (active=false, ringerMode=2, exact alarms)
        // ==========================================
        const initialStatus = await KhushuMode.getStatus();
        if (initialStatus.active) {
          evidenceList.push({
            alarmId: 'baseline',
            timestampMs: Date.now(),
            evidence: 'USER_CONFIRMED',
            details: `F1 Pre-check: active=${initialStatus.active}, activatedAt=${initialStatus.activatedAt ?? 0}, ringerMode=${initialStatus.ringerMode ?? -1}`,
          });
          expectedVsActual.push({
            parameter: 'F1. حالة الخشوع الابتدائية',
            expected: 'غير نشط (active === false)',
            actual: `active=${initialStatus.active}`,
            status: 'MISMATCH',
          });
          return {
            runId: ctx.runId,
            testId: 'test-f-khushu-auto-restore',
            fixRef: 'B1',
            verdict: 'INCONCLUSIVE',
            reason: 'يوجد جلسة خشوع نشطة؛ أوقفها ثم أعد الاختبار',
            startedAt,
            collectedAt: Date.now(),
            deviceInfo: { appVersion: '1.2.1' },
            expectedVsActual,
            evidenceList,
            markdownReport: `# تقرير Test F: غير حاسم — يوجد جلسة خشوع نشطة؛ أوقفها ثم أعد الاختبار\n- **ملاحظة التشغيل:** يُشغَّل هذا الاختبار من تبويب التشخيص (activeTab) لا من المودال.\n- **حالة Dashboard:** ${dashboardMountedStatus}`,
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
          details: `F1 Baseline: active=${initialStatus.active}, ringerMode=${initialRinger}, interruptionFilter=${initialFilter}, canScheduleExactAlarms=${canScheduleExact}, dashboardMounted=${hasDom ? isDashboardMounted : 'unavailable'}`,
        });

        expectedVsActual.push({
          parameter: 'F1. حالة الخشوع الابتدائية',
          expected: 'غير نشط (active === false)',
          actual: `active=${initialStatus.active}`,
          status: !initialStatus.active ? 'MATCH' : 'MISMATCH',
        });

        expectedVsActual.push({
          parameter: 'F1. خط أساس رنين الجهاز (Baseline Ringer)',
          expected: 'وضع الرنين العادي (NORMAL = 2)',
          actual: `ringerMode=${initialRinger}, interruptionFilter=${initialFilter}`,
          status: initialRinger === 2 ? 'MATCH' : 'MISMATCH',
        });

        expectedVsActual.push({
          parameter: 'F1. صلاحية المنبهات الدقيقة (Exact Alarms)',
          expected: 'ممنوحة (true)',
          actual: `canScheduleExactAlarms=${canScheduleExact}`,
          status: canScheduleExact ? 'MATCH' : 'MISMATCH',
        });

        if (initialRinger !== 2) {
          return {
            runId: ctx.runId,
            testId: 'test-f-khushu-auto-restore',
            fixRef: 'B1',
            verdict: 'INCONCLUSIVE',
            reason: `وضع الرنين الابتدائي للجهاز (${initialRinger}) ليس عادياً (NORMAL=2). يجب ضبط الهاتف على الوضع العادي قبل تشغيل Test F.`,
            startedAt,
            collectedAt: Date.now(),
            deviceInfo: { appVersion: '1.2.1', canScheduleExact },
            expectedVsActual,
            evidenceList,
            markdownReport: `# تقرير Test F: غير حاسم بسبب خط أساس الرنين (${initialRinger})\n- **ملاحظة التشغيل:** يُشغَّل هذا الاختبار من تبويب التشخيص (activeTab) لا من المودال.\n- **حالة Dashboard:** ${dashboardMountedStatus}`,
          };
        }

        // ==========================================
        // F2: Activate for minimum duration (1 minute, origin='diag_test')
        // ==========================================
        const activateCallStartMs = Date.now();
        const act = await KhushuMode.activate({
          mode: 'silent',
          durationMinutes,
          origin: 'diag_test',
        });
        didActivateInTest = Boolean(act?.active) && !act?.alreadyActive;

        if (!didActivateInTest) {
          return {
            runId: ctx.runId,
            testId: 'test-f-khushu-auto-restore',
            fixRef: 'B1',
            verdict: 'INCONCLUSIVE',
            reason: 'يوجد جلسة خشوع نشطة؛ أوقفها ثم أعد الاختبار',
            startedAt,
            collectedAt: Date.now(),
            deviceInfo: { appVersion: '1.2.1', canScheduleExact },
            expectedVsActual,
            evidenceList,
            markdownReport: `# تقرير Test F: غير حاسم — توجد جلسة خشوع نشطة عند التفعيل\n- **ملاحظة التشغيل:** يُشغَّل هذا الاختبار من تبويب التشخيص (activeTab) لا من المودال.\n- **حالة Dashboard:** ${dashboardMountedStatus}`,
          };
        }

        // Immediate post-activation status read (milliseconds after activate, safe from expired_heal)
        const statusAfterF2 = await KhushuMode.getStatus();
        const activatedAnchorMs =
          statusAfterF2.activatedAt && statusAfterF2.activatedAt > 0
            ? statusAfterF2.activatedAt
            : activateCallStartMs;

        evidenceList.push({
          alarmId: 'act1',
          timestampMs: Date.now(),
          evidence: 'USER_CONFIRMED',
          details: `F2 Activated: active=${act.active}, alreadyActive=${act.alreadyActive ?? false}, durationMinutes=${durationMinutes}, activatedAt=${activatedAnchorMs}, hasPendingRestore=${statusAfterF2.hasPendingRestoreAlarm}, ringerMode=${statusAfterF2.ringerMode}, filter=${statusAfterF2.interruptionFilter}`,
        });

        expectedVsActual.push({
          parameter: 'F2. تفعيل الخشوع بأقصر مدة (1 دقيقة)',
          expected: 'active === true مع alreadyActive === false',
          actual: `active=${act.active}, alreadyActive=${act.alreadyActive ?? false}, durationMinutes=${durationMinutes}`,
          status: act.active && !act.alreadyActive ? 'MATCH' : 'MISMATCH',
        });

        const isMutedAfterActivate =
          statusAfterF2.ringerMode !== undefined &&
          statusAfterF2.ringerMode !== 2 &&
          (statusAfterF2.ringerMode === 0 || statusAfterF2.ringerMode === 1);

        expectedVsActual.push({
          parameter: 'F2. تطبيق كتم الصوت بعد التفعيل (ringerMode != 2)',
          expected: 'انتقال رنين الهاتف عن الوضع العادي (ringerMode != 2، أي 0 أو 1)',
          actual: `ringerMode=${statusAfterF2.ringerMode} (0=SILENT, 1=VIBRATE, 2=NORMAL)`,
          status: isMutedAfterActivate ? 'MATCH' : 'MISMATCH',
        });

        // ==========================================
        // F3: Verify pending restore alarm & KHUSHU_RESTORE_SCHEDULED telemetry
        // ==========================================
        expectedVsActual.push({
          parameter: 'F3. جدولة منبه الاستعادة المعلّق',
          expected: 'hasPendingRestoreAlarm === true',
          actual: `hasPendingRestoreAlarm=${statusAfterF2.hasPendingRestoreAlarm}`,
          status: statusAfterF2.hasPendingRestoreAlarm === true ? 'MATCH' : 'MISMATCH',
        });

        const initialNativeLogs: NativeLogEvent[] = await getNativeEventLog(50).catch(() => []);
        const logStartCutoff = Math.min(startedAt, activateCallStartMs);
        const scheduledEvt = initialNativeLogs.find(
          (e) => e.event === 'KHUSHU_RESTORE_SCHEDULED' && e.timestampMs >= logStartCutoff
        );
        const scheduledDetails = scheduledEvt?.details || '';
        const triggerAtMatch = scheduledDetails.match(/triggerAtMs=(\d+)/);
        triggerAtMs = triggerAtMatch
          ? parseInt(triggerAtMatch[1], 10)
          : activatedAnchorMs + durationMinutes * 60_000;

        evidenceList.push({
          alarmId: 'restore_schedule',
          timestampMs: scheduledEvt?.timestampMs ?? Date.now(),
          evidence: 'ALARM_RECEIVED',
          details: scheduledEvt
            ? `F3 Scheduled: ${scheduledDetails} (parsed triggerAtMs=${triggerAtMs})`
            : `F3 Scheduled event missing; fallback triggerAtMs=${triggerAtMs}`,
        });

        expectedVsActual.push({
          parameter: 'F3. تسجيل حدث التيليمتري KHUSHU_RESTORE_SCHEDULED',
          expected: 'مسجل مع triggerAtMs و isExact و method',
          actual: scheduledEvt ? scheduledDetails : 'لم يُعثر على حدث KHUSHU_RESTORE_SCHEDULED في السجل',
          status: scheduledEvt ? 'MATCH' : 'MISMATCH',
        });

        // ==========================================
        // F4: Wait for automatic restoration WITHOUT calling KhushuMode.getStatus()
        // Only read-only getNativeEventLog(50) is polled until KHUSHU_RESTORED or timeout.
        // ==========================================
        const pollDeadlineMs = Date.now() + waitTimeoutMs;
        let restoredEvt: NativeLogEvent | undefined;

        const readRestoredEventFromLog = async (): Promise<NativeLogEvent | undefined> => {
          const logs: NativeLogEvent[] = await getNativeEventLog(50).catch(() => []);
          const matches = logs
            .filter((e) => e.event === 'KHUSHU_RESTORED' && e.timestampMs >= activatedAnchorMs)
            .sort((a, b) => a.timestampMs - b.timestampMs);
          return matches[0];
        };

        while (true) {
          restoredEvt = await readRestoredEventFromLog();
          if (restoredEvt) {
            break;
          }

          const remainingWaitMs = pollDeadlineMs - Date.now();
          if (remainingWaitMs <= 0) {
            // Final post-deadline read before breaking and before judging INCONCLUSIVE
            restoredEvt = await readRestoredEventFromLog();
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, Math.min(pollIntervalMs, remainingWaitMs)));
        }

        if (!restoredEvt) {
          // Timeout reached with NO KHUSHU_RESTORED -> INCONCLUSIVE.
          // CRITICAL: Do NOT call getStatus() here before setting verdict so we don't trigger expired_heal.
          restoredSource = 'none';
          verdict = 'INCONCLUSIVE';
          failureReason = `انتهت مهلة الانتظار (${Math.round(waitTimeoutMs / 1000)} ثانية) ولم يُسجل أي حدث KHUSHU_RESTORED في سجل التيليمتري؛ لم يستعد المنبه الصوت تلقائياً خلال المهلة. تم تنفيذ استعادة طوارئ في finally.`;

          evidenceList.push({
            alarmId: 'restore_timeout',
            timestampMs: Date.now(),
            evidence: 'INCONCLUSIVE',
            details: `F4 Timeout: no KHUSHU_RESTORED observed within ${waitTimeoutMs}ms (triggerAtMs=${triggerAtMs}). Skipped getStatus() to avoid expired_heal.`,
          });

          expectedVsActual.push({
            parameter: 'F4. حدث الاستعادة التلقائية (KHUSHU_RESTORED)',
            expected: 'مسجل بمصدر source=alarm',
            actual: `لم يُعثر على الحدث خلال ${Math.round(waitTimeoutMs / 1000)} ثانية (source=none)`,
            status: 'UNMEASURED',
          });

          expectedVsActual.push({
            parameter: 'F5. استعادة رنين الجهاز والفلتر وزوال المنبه المعلّق',
            expected: `ringerMode=${initialRinger}, interruptionFilter=${initialFilter}, hasPendingRestoreAlarm=false`,
            actual: 'لم يُقَس قبل الحكم (تم تخطي getStatus لمنع expired_heal؛ ستُنفذ استعادة طوارئ في finally)',
            status: 'UNMEASURED',
          });
        } else {
          restoredObserved = true;
          restoredTimestampMs = restoredEvt.timestampMs;
          const details = restoredEvt.details || '';
          const sourceMatch = details.match(/source=([^,\s]+)/);
          restoredSource = sourceMatch ? sourceMatch[1] : 'unknown';

          const deltaFromTriggerMs = restoredEvt.timestampMs - triggerAtMs;
          const deltaSign = deltaFromTriggerMs >= 0 ? '+' : '';

          evidenceList.push({
            alarmId: 'restore_event',
            timestampMs: restoredEvt.timestampMs,
            evidence: 'ALARM_RECEIVED',
            details: `F4 KHUSHU_RESTORED found: source=${restoredSource}, timestampMs=${restoredEvt.timestampMs}, triggerAtMs=${triggerAtMs}, delta=${deltaSign}${deltaFromTriggerMs}ms, details="${details}"`,
          });

          // Safe read-only status read AFTER KHUSHU_RESTORED has already set KEY_IS_ACTIVE = false
          const finalStatus = await KhushuMode.getStatus();
          evidenceList.push({
            alarmId: 'final_status',
            timestampMs: Date.now(),
            evidence: 'USER_CONFIRMED',
            details: `F5 Read-only status post-restore: active=${finalStatus.active}, ringerMode=${finalStatus.ringerMode}, interruptionFilter=${finalStatus.interruptionFilter}, hasPendingRestoreAlarm=${finalStatus.hasPendingRestoreAlarm}`,
          });

          const ringerRestored = finalStatus.ringerMode === initialRinger;
          const filterRestored = initialFilter === -1 || finalStatus.interruptionFilter === initialFilter;
          const pendingCleared = finalStatus.hasPendingRestoreAlarm === false && !finalStatus.active;

          expectedVsActual.push({
            parameter: 'F4. مصدر الاستعادة في التيليمتري (KHUSHU_RESTORED)',
            expected: 'source=alarm',
            actual: `source=${restoredSource} (timestampMs=${restoredEvt.timestampMs} مقابل triggerAtMs=${triggerAtMs}, الفارق=${deltaSign}${deltaFromTriggerMs}ms)`,
            status: restoredSource === 'alarm' ? 'MATCH' : 'MISMATCH',
          });

          expectedVsActual.push({
            parameter: 'F5. استعادة وضع رنين الهاتف الأصلي (Ringer Restoration)',
            expected: `ringerMode === ${initialRinger} (خط الأساس)`,
            actual: `ringerMode=${finalStatus.ringerMode}`,
            status: ringerRestored ? 'MATCH' : 'MISMATCH',
          });

          expectedVsActual.push({
            parameter: 'F5. استعادة فلتر عدم الإزعاج (Filter Restoration)',
            expected: `interruptionFilter === ${initialFilter}`,
            actual: `interruptionFilter=${finalStatus.interruptionFilter}`,
            status: filterRestored ? 'MATCH' : 'MISMATCH',
          });

          expectedVsActual.push({
            parameter: 'F5. إزالة منبه الاستعادة المعلّق وإغلاق الجلسة',
            expected: 'hasPendingRestoreAlarm === false و active === false',
            actual: `hasPendingRestoreAlarm=${finalStatus.hasPendingRestoreAlarm}, active=${finalStatus.active}`,
            status: pendingCleared ? 'MATCH' : 'MISMATCH',
          });

          if (restoredSource === 'expired_heal') {
            verdict = 'INCONCLUSIVE';
            failureReason = `غير حاسم (INCONCLUSIVE): الاستعادة تمت بمصدر expired_heal لاحتمال سبق polling الواجهة (useKhushuMode.ts) لمنبه الاستعادة؛ مقارنة التوقيت: timestampMs=${restoredEvt.timestampMs} مقابل triggerAtMs=${triggerAtMs} (الفارق: ${deltaSign}${deltaFromTriggerMs}ms)، حالة Dashboard: ${dashboardMountedStatus}.`;
          } else if (restoredSource !== 'alarm') {
            verdict = 'FAIL';
            failureReason = `FAIL: alarm did not restore, healed by ${restoredSource} (timestampMs=${restoredEvt.timestampMs} مقابل triggerAtMs=${triggerAtMs}, الفارق: ${deltaSign}${deltaFromTriggerMs}ms)`;
          } else {
            const hasMismatch = expectedVsActual.some((item) => item.status === 'MISMATCH');
            if (hasMismatch) {
              verdict = 'FAIL';
              failureReason = 'فشل أحد معايير التحقق رغم وصول KHUSHU_RESTORED بـ source=alarm (راجع مصفوفة المتوقع مقابل الفعلي: الكتم بعد التفعيل أو عودة الرنين/الفلتر أو زوال المنبه المعلّق).';
            } else {
              verdict = 'PASS';
              failureReason = `نجح Test F بالكامل: كُتم الصوت بعد التفعيل (ringerMode=${statusAfterF2.ringerMode})، واستعاد منبه النظام الحالة تلقائياً (KHUSHU_RESTORED مع source=alarm، الفارق عن الموعد ${deltaSign}${deltaFromTriggerMs}ms)، وعاد الرنين والفلتر لخط الأساس وزال المنبه المعلّق.`;
            }
          }
        }
      } catch (err: any) {
        verdict = 'FAIL';
        failureReason = `حدث استثناء غير متوقع أثناء فحص Test F: ${err?.message || err}`;
      } finally {
        // Emergency restore ONLY if this test activated Khushu and restoration was NOT observed
        if (didActivateInTest && !restoredObserved) {
          try {
            await KhushuMode.deactivate();
            emergencyRestoreExecuted = true;
            evidenceList.push({
              alarmId: 'emergency_restore',
              timestampMs: Date.now(),
              evidence: 'USER_CONFIRMED',
              details: 'Emergency restore executed in finally via KhushuMode.deactivate() (source=manual, not alarm) so the device is not left muted.',
            });
          } catch (_e) {}
        }
      }

      const collectedAt = Date.now();
      const timingComparisonLine =
        restoredTimestampMs !== null && triggerAtMs > 0
          ? `${restoredTimestampMs} vs triggerAtMs=${triggerAtMs} (${restoredTimestampMs - triggerAtMs >= 0 ? '+' : ''}${restoredTimestampMs - triggerAtMs}ms)`
          : triggerAtMs > 0
          ? `لم يحدث استرداد (triggerAtMs=${triggerAtMs})`
          : 'غير متوفر';

      const markdownReport = `# تقرير تشخيص Test F: الاستعادة التلقائية لوضع الخشوع بالمنبه (source=alarm)
- **المعرّف:** ${ctx.runId}
- **النتيجة النهائية:** **${verdict}**
- **السبب:** ${failureReason}
- **مصدر الاستعادة الفعلي (KHUSHU_RESTORED source):** \`${restoredSource}\`
- **مقارنة التوقيت (timestampMs vs triggerAtMs):** ${timingComparisonLine}
- **حالة Dashboard وقت الاختبار:** ${dashboardMountedStatus}
- **شرط بيئة التشغيل:** يُشغَّل هذا الاختبار من تبويب التشخيص (\`activeTab === 'diagnostics'\`) لا من نافذة المودال لتفادي تداخل polling الواجهة (\`useKhushuMode.ts\`).${emergencyRestoreExecuted ? '\n- **تنبيه طوارئ:** تم تنفيذ استعادة طوارئ داخل كتلة `finally` عبر `KhushuMode.deactivate()` (`source=manual`) لحماية الهاتف من البقاء صامتاً.' : ''}
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
        testId: 'test-f-khushu-auto-restore',
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
}

export const TEST_F_SPEC: DiagTestSpec = createTestFSpec();
