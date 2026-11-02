/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { resolvePreviewSource, describePreviewSource, PreviewSourceKind } from '../../../utils/previewSource';
import {
  getAudioUrl,
  isAudioDownloaded,
  deleteDownloadedAudio,
  LOCAL_FALLBACK_AUDIO,
} from '../../../utils/audioStorage';
import { AudioCatalog } from '../../../services/audio/AudioCatalog';
import { DiagTestSpec, DiagResult, DiagExpectedVsActualItem, DiagContext } from '../diagTypes';

export const TEST_A_SPEC: DiagTestSpec = {
  id: 'fix1a-preview-source',
  title: 'اختبار مصادر الصوت والمؤذن (Test A: Preview Source Resolution)',
  fixRef: 'Fix 1a',
  mode: 'instant',
  guardDurationMinutes: 5,
  touchesKeys: [], // Test A does not modify user preferences
  userSteps: [
    {
      id: 'step_offline',
      title: 'إيقاف الاتصال بالإنترنت',
      description: 'يرجى إيقاف شبكة الواي فاي وبيانات الهاتف مؤقتاً لفحص التراجع للصوت الافتراضي، ثم اضغط على "تأكيد إيقاف الاتصال".',
      actionType: 'toggle_offline',
    },
  ],

  setup: async (ctx: DiagContext) => {
    ctx.logAction('Test A Phase 1 (Online) setup started');

    const catalog = AudioCatalog.getAllMuezzins();
    const onlineProbeTrack = catalog.find((m) => m.id === 'archive_001') || {
      id: 'archive_001',
      name: 'أذان الشيخ حمزة الحلبية',
      url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/001-.mp3',
      isFajr: false,
    };
    const offlineProbeTrack = catalog.find((m) => m.id === 'archive_002') || {
      id: 'archive_002',
      name: 'الشيخ أحمد العمادي (قطر)',
      url: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/002--.mp3',
      isFajr: false,
    };

    // Check if tracks were cached before this run
    const wasOnlineCachedBefore = await isAudioDownloaded(onlineProbeTrack.id).catch(() => false);
    const wasOfflineCachedBefore = await isAudioDownloaded(offlineProbeTrack.id).catch(() => false);

    // R1: Persist wasCachedBefore map in run state
    ctx.updateState((s) => ({
      ...s,
      wasCachedBefore: {
        ...(s.wasCachedBefore || {}),
        [onlineProbeTrack.id]: wasOnlineCachedBefore,
        [offlineProbeTrack.id]: wasOfflineCachedBefore,
      },
    }));

    // R1: Require navigator.onLine === true at start of Phase 1
    const isOnlineNow = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : true;

    if (!isOnlineNow) {
      ctx.updateState((s) => ({
        ...s,
        partialResults: {
          phase1Done: false,
          phase1Error: 'الجهاز غير متصل بالإنترنت عند بدء الاختبار (المرحلة الأولى تتطلب اتصالاً بالإنترنت)',
          wasOnlineCachedBefore,
          wasOfflineCachedBefore,
          onlineProbeTrack,
          offlineProbeTrack,
        },
      }));
      ctx.logAction('Test A Phase 1 aborted: device is offline');
      return;
    }

    // Phase 1.1: Bundled local audio
    const bundledRes = await resolvePreviewSource(
      { id: 'makkah', url: '/audio/athan_makkah.mp3' },
      false,
      getAudioUrl,
      LOCAL_FALLBACK_AUDIO
    );

    // Phase 1.2: Online uncached audio (or cached if it existed prior to run)
    const onlineRes = await resolvePreviewSource(
      { id: onlineProbeTrack.id, url: onlineProbeTrack.url },
      false,
      getAudioUrl,
      LOCAL_FALLBACK_AUDIO,
      true
    );

    // If online track was not cached before, register it for pending cleanup and trigger background cache
    if (!wasOnlineCachedBefore) {
      ctx.updateState((s) => ({
        ...s,
        cacheCleanupPending: Array.from(new Set([...s.cacheCleanupPending, onlineProbeTrack.id])),
      }));
      await getAudioUrl(onlineProbeTrack.url, onlineProbeTrack.id, false).catch(() => {});
    }

    // Persist Phase 1 results in run state
    ctx.updateState((s) => ({
      ...s,
      partialResults: {
        phase1Done: true,
        bundledItem: {
          parameter: 'صوت مدمج محلياً (Bundled Local)',
          expected: 'local أو bundled',
          actual: describePreviewSource(bundledRes.kind),
          status: (bundledRes.kind === 'local' || bundledRes.kind === 'bundled') ? 'MATCH' : 'MISMATCH',
        },
        onlineItem: {
          parameter: `مؤذن غير محمّل مع اتصال إنترنت (${onlineProbeTrack.id})`,
          expected: wasOnlineCachedBefore ? 'من التخزين المحلي' : 'من الإنترنت',
          actual: describePreviewSource(onlineRes.kind),
          status: wasOnlineCachedBefore
            ? (onlineRes.kind === 'local' ? 'MATCH' : 'MISMATCH')
            : (onlineRes.kind === 'remote' ? 'MATCH' : 'MISMATCH'),
        },
        wasOnlineCachedBefore,
        wasOfflineCachedBefore,
        onlineProbeTrack,
        offlineProbeTrack,
      },
    }));

    ctx.logAction('Test A Phase 1 completed successfully');
  },

  evaluate: async (ctx: DiagContext, userResponses: Record<string, any>): Promise<DiagResult> => {
    const startedAt = ctx.state.startedAt;
    const collectedAt = Date.now();
    const expectedVsActual: DiagExpectedVsActualItem[] = [];

    const partial = ctx.state.partialResults;

    // Check if Phase 1 failed due to offline state
    if (!partial || !partial.phase1Done) {
      return {
        runId: ctx.runId,
        testId: 'fix1a-preview-source',
        fixRef: 'Fix 1a',
        verdict: 'INCONCLUSIVE',
        reason: partial?.phase1Error || 'لم تكتمل المرحلة الأولى بنجاح بسبب عدم توفر اتصال بالإنترنت عند البدء.',
        startedAt,
        collectedAt,
        deviceInfo: { appVersion: '1.2.1' },
        expectedVsActual: [],
        evidenceList: [],
        markdownReport: `# تقرير تشخيص Test A: غير حاسم
السبب: ${partial?.phase1Error || 'عدم توفر اتصال بالإنترنت في المرحلة الأولى.'}`,
      };
    }

    // Add Phase 1 items
    expectedVsActual.push(partial.bundledItem);
    expectedVsActual.push(partial.onlineItem);

    const onlineProbeTrack = partial.onlineProbeTrack;
    const offlineProbeTrack = partial.offlineProbeTrack;
    const wasOnlineCachedBefore = Boolean(partial.wasOnlineCachedBefore);
    const wasOfflineCachedBefore = Boolean(partial.wasOfflineCachedBefore);

    // R1 Phase 2: Check REAL online status at moment of offline confirmation
    const isCurrentlyOnline = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
      ? navigator.onLine
      : false;

    if (isCurrentlyOnline) {
      expectedVsActual.push({
        parameter: `مؤذن غير محمّل بدون اتصال (${offlineProbeTrack.id})`,
        expected: 'الصوت الافتراضي لأن المؤذن المختار غير متاح (default)',
        actual: 'لم يُقَس (الجهاز ما يزال متصلاً بالإنترنت ولم يتم تفعيل وضع الطيران)',
        status: 'UNMEASURED',
      });
      expectedVsActual.push({
        parameter: 'مؤذن محمّل مسبقاً بدون اتصال (Pre-downloaded Track)',
        expected: 'من التخزين المحلي (local)',
        actual: 'لم يُقَس (الجهاز ما يزال متصلاً بالإنترنت)',
        status: 'UNMEASURED',
      });
    } else {
      // Real offline execution (pass real boolean isCurrentlyOnline which is false)
      const offlineRes = await resolvePreviewSource(
        { id: offlineProbeTrack.id, url: offlineProbeTrack.url },
        false,
        getAudioUrl,
        LOCAL_FALLBACK_AUDIO,
        isCurrentlyOnline
      );
      expectedVsActual.push({
        parameter: `مؤذن غير محمّل بدون اتصال (${offlineProbeTrack.id})`,
        expected: 'الصوت الافتراضي لأن المؤذن المختار غير متاح',
        actual: describePreviewSource(offlineRes.kind),
        status: offlineRes.kind === 'default' ? 'MATCH' : 'MISMATCH',
      });

      // R1 Phase 3: Pick a previously downloaded track and verify it returns 'local'
      const catalog = AudioCatalog.getAllMuezzins();
      let preDownloadedTrack: any = null;
      for (const m of catalog) {
        if (m.id !== onlineProbeTrack.id && m.id !== offlineProbeTrack.id) {
          const downloaded = await isAudioDownloaded(m.id).catch(() => false);
          if (downloaded) {
            preDownloadedTrack = m;
            break;
          }
        }
      }

      if (preDownloadedTrack) {
        const preRes = await resolvePreviewSource(
          { id: preDownloadedTrack.id, url: preDownloadedTrack.url },
          false,
          getAudioUrl,
          LOCAL_FALLBACK_AUDIO,
          isCurrentlyOnline
        );
        expectedVsActual.push({
          parameter: `مؤذن محمّل مسبقاً بدون اتصال (${preDownloadedTrack.id})`,
          expected: 'من التخزين المحلي',
          actual: describePreviewSource(preRes.kind),
          status: preRes.kind === 'local' ? 'MATCH' : 'MISMATCH',
        });
      } else {
        expectedVsActual.push({
          parameter: 'مؤذن محمّل مسبقاً بدون اتصال (Pre-downloaded Track)',
          expected: 'من التخزين المحلي',
          actual: 'لم يُقَس (لا يوجد مؤذن محمّل مسبقاً في التخزين المحلي)',
          status: 'UNMEASURED',
        });
      }
    }

    // R1: Cache Teardown - Never delete a track cached before the run
    if (!wasOnlineCachedBefore) {
      const pollStart = Date.now();
      let downloaded = false;
      while (Date.now() - pollStart < 5000) {
        downloaded = await isAudioDownloaded(onlineProbeTrack.id).catch(() => false);
        if (downloaded) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      if (downloaded) {
        await deleteDownloadedAudio(onlineProbeTrack.id).catch(() => {});
        const stillDownloaded = await isAudioDownloaded(onlineProbeTrack.id).catch(() => false);
        if (!stillDownloaded) {
          ctx.updateState((s) => ({
            ...s,
            cacheCleanupPending: s.cacheCleanupPending.filter((id) => id !== onlineProbeTrack.id),
          }));
        }
      }
      // If download did not finish within timeout or delete failed, it stays in cacheCleanupPending for retry on next launch!
    }

    if (!wasOfflineCachedBefore) {
      await deleteDownloadedAudio(offlineProbeTrack.id).catch(() => {});
    }

    const hasMismatch = expectedVsActual.some((item) => item.status === 'MISMATCH');
    const hasUnmeasured = expectedVsActual.some((item) => item.status === 'UNMEASURED');

    let verdict: 'PASS' | 'FAIL' | 'INCONCLUSIVE' = 'PASS';
    let reason = 'نجح فحص منطق اختيار مصادر الصوت والتراجع للأذان الافتراضي بنجاح عبر جميع المراحل.';

    if (hasMismatch) {
      verdict = 'FAIL';
      reason = 'حدث خطأ في تحديد مصدر الصوت لأحد المسارات.';
    } else if (hasUnmeasured) {
      verdict = 'INCONCLUSIVE';
      reason = 'لم تكتمل بعض بنود فحص عدم الاتصال (إما الجهاز لا يزال متصلاً أو لا يوجد مقطع محمّل مسبقاً).';
    }

    const markdownReport = `# تقرير تشخيص Test A: مصادر صوت الأذان (Fix 1a)
- **المعرّف:** ${ctx.runId}
- **النتيجة:** **${verdict}** (${reason})
- **توقيت الفحص:** ${new Date(collectedAt).toLocaleString('ar-EG')}
- **حالة متصفح الجهاز:** ${isCurrentlyOnline ? 'متصل بالشبكة (online)' : 'غير متصل (offline)'}

## جدول المتوقع مقابل الفعلي (Expected vs Actual)
| الفحص | المتوقع | الفعلي | النتيجة |
|---|---|---|---|
${expectedVsActual.map((item) => `| ${item.parameter} | ${item.expected} | ${item.actual} | ${item.status === 'MATCH' ? 'مطابق ✓' : item.status === 'MISMATCH' ? 'خطأ ✕' : 'لم يُقَس'} |`).join('\n')}

## ملاحظة الموثوقية
هذا الاختبار يتحقق حصرياً من **منطق تحديد مسار الصوت** وتفادي الأخطاء الصامتة، ولا يقوم بتشغيل صوت حقيقي على مكبرات الصوت.
`;

    return {
      runId: ctx.runId,
      testId: 'fix1a-preview-source',
      fixRef: 'Fix 1a',
      verdict,
      reason,
      startedAt,
      collectedAt,
      deviceInfo: { appVersion: '1.2.1' },
      expectedVsActual,
      evidenceList: [],
      markdownReport,
    };
  },
};
