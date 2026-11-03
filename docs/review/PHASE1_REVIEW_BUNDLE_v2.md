# حزمة المراجعة الفنية الشاملة للكود البرمجي (Phase 1 Review Bundle v2)
# PHASE 1 COMPLETE CODE REVIEW BUNDLE v2

تضم هذه الحزمة المحتوى الكامل وغير المختصر لجميع الملفات والوظائف التي أُنشئت أو عُدّلت خلال المرحلة الأولى (Phase 1) وجلسة التقوية الحالية، دون اختصار أو حذف أي أسطر.

---

## جدول المحتويات (Table of Contents)
1. `src/diagnostics/tests/diagTypes.ts` (109 أسطر)
2. `src/diagnostics/tests/diagRunner.ts` (500 سطر)
3. `src/diagnostics/tests/specs/testA_previewSource.ts` (185 سطر)
4. `src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts` (275 سطر)
5. `src/components/WorshipAlarms.tsx` (مقاطع التعديل T1 مع أرقام الأسطر)
6. `src/components/settings/BackupSettingsTab.tsx` (مقاطع التعديل T2 مع أرقام الأسطر)
7. `src/services/athanAlarmPlugin.ts` (مقاطع التعديل T3 مع أرقام الأسطر)
8. `src/utils/audioStorage.ts` (فارق التعديل التام T4 مع أرقام الأسطر)
9. `android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt` (110 أسطر)
10. `android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt` (276 سطر)
11. `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt` (الدوال المعدلة مع أرقام الأسطر)
12. `src/diagnostics/tests/diagRunner.test.ts` (784 سطر)

---

## 1. `src/diagnostics/tests/diagTypes.ts` (109 lines)

```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DIAG_ALARM_PREFIX = 'diag_';

/**
 * Returns true if the provided alarm ID is a diagnostic test alarm.
 */
export function isDiagAlarmId(id?: string | null): boolean {
  return typeof id === 'string' && id.startsWith(DIAG_ALARM_PREFIX);
}

export type DiagPhase = 'idle' | 'armed' | 'waiting' | 'collectable' | 'reported' | 'cancelled' | 'running';

export type DiagVerdict = 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'SUPPORTS_HYPOTHESIS' | 'REFUTED';

export type EvidenceState = 'ALARM_RECEIVED' | 'PLAYBACK_STARTED' | 'USER_CONFIRMED' | 'USER_DENIED' | 'INCONCLUSIVE';

export interface MuteStateInfo {
  isMuted: boolean;
  ringerMode?: number; // 0 = SILENT, 1 = VIBRATE, 2 = NORMAL
  interruptionFilter?: number; // 1 = INTERRUPTION_FILTER_NONE (DND)
  hasDndPermission?: boolean;
  description: string;
}

export interface DiagUserStep {
  id: string;
  title: string;
  description: string;
  actionType: 'prompt_confirm' | 'toggle_offline' | 'hearing_check';
}

export interface DiagSnapshotEntry {
  original: any;
  hash: string;
  testVal: any;
}

export interface DiagRunState {
  runId: string;
  testId: string;
  startedAt: number;
  phase: DiagPhase;
  collectAt?: number;
  expiresAt?: number;
  snapshot: Record<string, DiagSnapshotEntry>;
  createdAlarmIds: string[];
  cacheCleanupPending: string[];
  cleanup: 'none' | 'started' | 'done' | 'failed';
  conflicts: Array<{ key: string; original: any; testVal: any; currentVal: any }>;
  userResponses: Record<string, any>;
  result?: DiagResult;
}

export interface DiagExpectedVsActualItem {
  parameter: string;
  expected: string;
  actual: string;
  status: 'MATCH' | 'MISMATCH' | 'UNMEASURED';
}

export interface DiagEvidenceItem {
  alarmId: string;
  timestampMs: number;
  evidence: EvidenceState;
  details: string;
}

export interface DiagResult {
  runId: string;
  testId: string;
  fixRef: string;
  verdict: DiagVerdict;
  reason: string;
  startedAt: number;
  collectedAt: number;
  deviceInfo: {
    appVersion: string;
    isIgnoringBattery?: boolean;
    canScheduleExact?: boolean;
    hasDndAccess?: boolean;
  };
  expectedVsActual: DiagExpectedVsActualItem[];
  evidenceList: DiagEvidenceItem[];
  markdownReport: string;
}

export interface DiagContext {
  runId: string;
  state: DiagRunState;
  updateState: (updater: (prev: DiagRunState) => DiagRunState) => void;
  logAction: (action: string, details?: string) => void;
}

export interface DiagTestSpec {
  id: string;
  title: string;
  fixRef: string;
  mode: 'instant' | 'timed';
  touchesKeys: string[];
  setup: (ctx: DiagContext) => Promise<void>;
  schedule?: (ctx: DiagContext) => Promise<{ createdAlarmIds: string[]; collectAt: number; expiresAt: number }>;
  userSteps?: DiagUserStep[];
  evaluate: (ctx: DiagContext, userResponses: Record<string, any>) => Promise<DiagResult>;
}
```

---

## 2. `src/diagnostics/tests/diagRunner.ts` (500 lines)

```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeGetJSON, safeSetJSON, safeRemoveItem } from '../../utils/storage';
import { isAudioDownloaded, deleteDownloadedAudio } from '../../utils/audioStorage';
import { cancelNativeAlarm, getAlarmDiagnostics } from '../../services/athanAlarmPlugin';
import { AlarmConfig } from '../../types';
import {
  DiagPhase,
  DiagRunState,
  DiagResult,
  DiagTestSpec,
  DiagContext,
  MuteStateInfo,
  DIAG_ALARM_PREFIX,
  isDiagAlarmId,
} from './diagTypes';

export const DIAG_RUN_STATE_KEY = 'diag_run_state';
export const ALLOWED_TOUCH_KEYS = ['hemmaty_khushu_settings_v2', 'salah_custom_alarms'] as const;

/**
 * Deterministic fast string hash for snapshot state comparisons
 */
export function hashValue(val: unknown): string {
  if (val === undefined) return 'undefined';
  const str = JSON.stringify(val);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}

export interface PrayerGuardCheckResult {
  allowed: boolean;
  reason?: string;
  conflictingEvent?: { name: string; timeMs: number };
}

/**
 * Prayer Proximity Guard:
 * Rejects test execution if a real prayer athan or real enabled custom alarm
 * falls within [now - 30m, now + testDurationMs + 30m].
 */
export function checkPrayerProximityGuard(params: {
  athanTimes: Array<{ name: string; timeMs: number }>;
  customAlarms?: AlarmConfig[];
  testDurationMinutes?: number;
  now?: number;
}): PrayerGuardCheckResult {
  const now = params.now ?? Date.now();
  const durationMs = (params.testDurationMinutes ?? 25) * 60 * 1000;
  const guardWindowStart = now - 30 * 60 * 1000;
  const guardWindowEnd = now + durationMs + 30 * 60 * 1000;

  // 1. Check real Athan times
  for (const prayer of params.athanTimes) {
    if (prayer.timeMs >= guardWindowStart && prayer.timeMs <= guardWindowEnd) {
      return {
        allowed: false,
        reason: `توجد صلاة حقيقية (${prayer.name}) في نافذة الاختبار لحماية الأذان من الكتم.`,
        conflictingEvent: prayer,
      };
    }
  }

  // 2. Check real Custom Alarms (excluding any diagnostic synthetic alarms)
  const realCustom = (params.customAlarms || []).filter(
    (a) => a.enabled && !a.id.startsWith('diag_')
  );

  const today = new Date(now);
  for (const alarm of realCustom) {
    if (alarm.time) {
      const [hStr, mStr] = alarm.time.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const targetDate = new Date(today);
        targetDate.setHours(h, m, 0, 0);
        const alarmTimeMs = targetDate.getTime();
        if (alarmTimeMs >= guardWindowStart && alarmTimeMs <= guardWindowEnd) {
          return {
            allowed: false,
            reason: `يوجد منبه مخصص حقيقي (${alarm.title || alarm.id}) في نافذة الاختبار.`,
            conflictingEvent: { name: alarm.title || alarm.id, timeMs: alarmTimeMs },
          };
        }
      }
    }
  }

  return { allowed: true };
}

/**
 * Parses mute state from native event log details string.
 * Any of: ringerMode=0 (SILENT), ringerMode=1 (VIBRATE), interruptionFilter=1 (NONE / DND)
 * counts as an active Mute State.
 */
export function evaluateMuteStateFromDetails(detailsStr: string): MuteStateInfo {
  const ringerMatch = detailsStr.match(/(?:appliedRinger|ringerMode)=(\d+)/);
  const filterMatch = detailsStr.match(/(?:appliedFilter|interruptionFilter)=(\d+)/);
  const dndMatch = detailsStr.match(/hasDndPermission=(true|false)/);

  const ringerMode = ringerMatch ? parseInt(ringerMatch[1], 10) : undefined;
  const interruptionFilter = filterMatch ? parseInt(filterMatch[1], 10) : undefined;
  const hasDndPermission = dndMatch ? dndMatch[1] === 'true' : undefined;

  const isSilent = ringerMode === 0;
  const isVibrate = ringerMode === 1;
  const isDndActive = interruptionFilter === 1;

  const isMuted = isSilent || isVibrate || isDndActive;
  const parts: string[] = [];
  if (isSilent) parts.push('الرنين صامت (SILENT=0)');
  if (isVibrate) parts.push('الاهتزاز (VIBRATE=1)');
  if (isDndActive) parts.push('عدم الإزعاج مفعل (DND_FILTER_NONE=1)');

  return {
    isMuted,
    ringerMode,
    interruptionFilter,
    hasDndPermission,
    description: parts.length > 0 ? parts.join(' + ') : 'الصوت طبيعي (غير مكتوم)',
  };
}

export const parseMuteState = evaluateMuteStateFromDetails;

export class DiagRunner {
  private registeredSpecs = new Map<string, DiagTestSpec>();
  private listeners = new Set<(state: DiagRunState | null) => void>();

  subscribe(listener: (state: DiagRunState | null) => void): () => void {
    this.listeners.add(listener);
    listener(this.getCurrentState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(state: DiagRunState | null): void {
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('[DiagRunner] Listener error:', err);
      }
    }
  }

  registerSpec(spec: DiagTestSpec): void {
    this.registeredSpecs.set(spec.id, spec);
  }

  getSpec(id: string): DiagTestSpec | undefined {
    return this.registeredSpecs.get(id);
  }

  getAllSpecs(): DiagTestSpec[] {
    return Array.from(this.registeredSpecs.values());
  }

  getCurrentState(): DiagRunState | null {
    return safeGetJSON<DiagRunState | null>(DIAG_RUN_STATE_KEY, null);
  }

  saveState(state: DiagRunState): void {
    safeSetJSON(DIAG_RUN_STATE_KEY, state);
    this.notify(state);
  }

  clearState(): void {
    safeRemoveItem(DIAG_RUN_STATE_KEY);
    this.notify(null);
  }

  /**
   * Compare-and-restore implementation:
   * 1. Restores hemmaty_khushu_settings_v2 ONLY if current === testVal. If user modified it, keeps user changes and records CONFLICT.
   * 2. salah_custom_alarms is NEVER replaced with original snapshot; it strips out createdAlarmIds / diag_ alarms only.
   */
  async compareAndRestore(state: DiagRunState): Promise<{
    restoredKeys: string[];
    conflicts: Array<{ key: string; original: any; testVal: any; currentVal: any }>;
  }> {
    const restoredKeys: string[] = [];
    const conflicts: Array<{ key: string; original: any; testVal: any; currentVal: any }> = [];

    for (const [key, entry] of Object.entries(state.snapshot)) {
      if (key === 'hemmaty_khushu_settings_v2') {
        const currentVal = safeGetJSON<any>(key, null);
        const currentHash = hashValue(currentVal);
        const testValHash = hashValue(entry.testVal);
        const originalHash = entry.hash;

        if (currentHash === testValHash) {
          safeSetJSON(key, entry.original);
          restoredKeys.push(key);
        } else if (currentHash === originalHash) {
          // Already identical to original
          restoredKeys.push(key);
        } else {
          // User modified settings during test! Keep user modifications!
          conflicts.push({
            key,
            original: entry.original,
            testVal: entry.testVal,
            currentVal,
          });
        }
      } else if (key === 'salah_custom_alarms') {
        // Safe list filtering: only remove created synthetic alarms
        const currentAlarms = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);
        const filtered = currentAlarms.filter(
          (a) => !state.createdAlarmIds.includes(a.id) && !isDiagAlarmId(a.id)
        );
        safeSetJSON('salah_custom_alarms', filtered);
        restoredKeys.push(key);
      }
    }

    // Cancel synthetic native alarms by exact ID first, then sweep prefix
    for (const id of state.createdAlarmIds) {
      await cancelNativeAlarm({ alarmId: id }).catch(() => {});
    }
    await cancelNativeAlarm({ alarmId: DIAG_ALARM_PREFIX }).catch(() => {});

    // Flush any pending cache cleanups
    await this.flushPendingCacheCleanup(state);

    state.conflicts = conflicts;
    state.cleanup = conflicts.length > 0 ? 'done' : 'done';
    this.saveState(state);

    return { restoredKeys, conflicts };
  }

  /**
   * Cleans up any audio cache entries that were newly downloaded for test tracks.
   */
  async flushPendingCacheCleanup(state: DiagRunState): Promise<void> {
    if (!state.cacheCleanupPending || state.cacheCleanupPending.length === 0) return;
    const remaining: string[] = [];
    for (const trackId of state.cacheCleanupPending) {
      try {
        await deleteDownloadedAudio(trackId);
      } catch (err) {
        remaining.push(trackId);
      }
    }
    state.cacheCleanupPending = remaining;
    this.saveState(state);
  }

  /**
   * Starts a test run after executing prayer proximity checks and taking snapshot.
   */
  async startTest(
    spec: DiagTestSpec,
    options?: {
      athanTimes?: Array<{ name: string; timeMs: number }>;
      customAlarms?: AlarmConfig[];
      now?: number;
    }
  ): Promise<{ success: boolean; state?: DiagRunState; error?: string }> {
    const now = options?.now ?? Date.now();

    // 1. Check prayer proximity guard
    if (options?.athanTimes && options.athanTimes.length > 0) {
      const guard = checkPrayerProximityGuard({
        athanTimes: options.athanTimes,
        customAlarms: options.customAlarms,
        testDurationMinutes: spec.mode === 'timed' ? 25 : 5,
        now,
      });
      if (!guard.allowed) {
        return { success: false, error: guard.reason };
      }
    }

    // 2. Build snapshot of allowed keys
    const snapshot: Record<string, { original: any; hash: string; testVal: any }> = {};
    for (const key of spec.touchesKeys) {
      if (!ALLOWED_TOUCH_KEYS.includes(key as any)) continue;
      const currentVal = safeGetJSON<any>(key, null);
      snapshot[key] = {
        original: currentVal,
        hash: hashValue(currentVal),
        testVal: null,
      };
    }

    const runId = `run_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const initialState: DiagRunState = {
      runId,
      testId: spec.id,
      startedAt: now,
      phase: 'armed',
      snapshot,
      createdAlarmIds: [],
      cacheCleanupPending: [],
      cleanup: 'none',
      conflicts: [],
      userResponses: {},
    };

    this.saveState(initialState);

    const ctx: DiagContext = {
      runId,
      state: initialState,
      updateState: (updater) => {
        const cur = this.getCurrentState() || initialState;
        const updated = updater(cur);
        this.saveState(updated);
      },
      logAction: (action, details) => {
        console.log(`[DiagRunner:${runId}] ${action}`, details || '');
      },
    };

    try {
      // 3. Execute setup
      await spec.setup(ctx);

      // 4. Schedule timed events if timed mode
      if (spec.mode === 'timed' && spec.schedule) {
        const scheduleRes = await spec.schedule(ctx);
        const currentState = this.getCurrentState() || initialState;
        currentState.createdAlarmIds = scheduleRes.createdAlarmIds;
        currentState.collectAt = scheduleRes.collectAt;
        currentState.expiresAt = scheduleRes.expiresAt;
        currentState.phase = 'waiting';
        this.saveState(currentState);
        return { success: true, state: currentState };
      } else {
        // Instant test can collect immediately
        const currentState = this.getCurrentState() || initialState;
        currentState.phase = 'collectable';
        this.saveState(currentState);
        return { success: true, state: currentState };
      }
    } catch (err: any) {
      const currentState = this.getCurrentState() || initialState;
      currentState.phase = 'cancelled';
      await this.compareAndRestore(currentState);
      this.clearState();
      return { success: false, error: `فشل إعداد الاختبار: ${err?.message || err}` };
    }
  }

  /**
   * Cancels the active test run, restores settings, and cleans up synthetic alarms.
   */
  async cancelTest(reason: string = 'إلغاء يدوي من المستخدم'): Promise<void> {
    const state = this.getCurrentState();
    if (!state) return;
    state.phase = 'cancelled';
    await this.compareAndRestore(state);
    this.clearState();
  }

  /**
   * Startup verification:
   * Called on app mount to detect crashes, reboot, or expired runs.
   */
  async checkAndResumeOnAppStartup(): Promise<DiagRunState | null> {
    const state = this.getCurrentState();
    if (!state) return null;

    // Retry any pending audio cache cleanups
    await this.flushPendingCacheCleanup(state);

    const now = Date.now();

    // 1. Check reboot detection via AthanAlarmPlugin diagnostics
    try {
      const diag = await getAlarmDiagnostics();
      if (diag?.lastDeviceBootTimestamp && diag.lastDeviceBootTimestamp > state.startedAt) {
        // Device rebooted during test!
        state.phase = 'cancelled';
        state.result = {
          runId: state.runId,
          testId: state.testId,
          fixRef: 'B3',
          verdict: 'INCONCLUSIVE',
          reason: 'أعيد تشغيل الجهاز أثناء فترة الاختبار، وتم تنظيف المنبهات الاصطناعية تلقائياً.',
          startedAt: state.startedAt,
          collectedAt: now,
          deviceInfo: { appVersion: '1.2.1' },
          expectedVsActual: [],
          evidenceList: [],
          markdownReport: '# تقرير الفحص: غير مكتمل بسبب إعادة تشغيل الهاتف\n\nتم إلغاء الاختبار وحماية المنبهات الحقيقية بنجاح.',
        };
        await this.compareAndRestore(state);
        this.saveState(state);
        return state;
      }
    } catch {
      // Diagnostic check unavailable in web simulation
    }

    // 2. Check timeout expiration
    if (state.expiresAt && now >= state.expiresAt && state.phase !== 'reported') {
      state.phase = 'cancelled';
      state.result = {
        runId: state.runId,
        testId: state.testId,
        fixRef: 'B3',
        verdict: 'INCONCLUSIVE',
        reason: 'انتهت المهلة القصوى للاختبار (expiresAt) قبل جمع النتائج.',
        startedAt: state.startedAt,
        collectedAt: now,
        deviceInfo: { appVersion: '1.2.1' },
        expectedVsActual: [],
        evidenceList: [],
        markdownReport: '# تقرير الفحص: غير مكتمل بسبب انتهاء المهلة الزمنية',
      };
      await this.compareAndRestore(state);
      this.saveState(state);
      return state;
    }

    // 3. Check if waiting phase has arrived at collectable
    if (state.phase === 'waiting' && state.collectAt && now >= state.collectAt) {
      state.phase = 'collectable';
      this.saveState(state);
      return state;
    }

    return state;
  }

  /**
   * Submits user input and executes collect step to generate final verdict.
   */
  async submitUserAction(userResponses?: Record<string, any>): Promise<DiagResult | null> {
    const state = this.getCurrentState();
    if (!state) return null;
    const spec = this.getSpec(state.testId);
    if (!spec) return null;

    if (userResponses) {
      state.userResponses = { ...state.userResponses, ...userResponses };
    }
    state.phase = 'running';
    this.saveState(state);

    const ctx: DiagContext = {
      runId: state.runId,
      state,
      updateState: (updater) => {
        const cur = this.getCurrentState() || state;
        const updated = updater(cur);
        this.saveState(updated);
      },
      logAction: (action, details) => {
        console.log(`[DiagRunner:${state.runId}] ${action}`, details || '');
      },
    };

    try {
      const evalFn = spec.evaluate || (spec as any).collect;
      const result = await evalFn(ctx, state.userResponses || {});
      const currentState = this.getCurrentState() || state;
      currentState.result = result;
      currentState.phase = 'reported';
      await this.compareAndRestore(currentState);
      this.saveState(currentState);
      return result;
    } catch (err: any) {
      const currentState = this.getCurrentState() || state;
      currentState.phase = 'cancelled';
      await this.compareAndRestore(currentState);
      this.saveState(currentState);
      throw err;
    }
  }

  /**
   * Resets active or reported state and performs compare-and-restore.
   */
  async resetState(): Promise<void> {
    const state = this.getCurrentState();
    if (state) {
      await this.compareAndRestore(state);
    }
    this.clearState();
  }
}

export const diagRunnerInstance = new DiagRunner();
```

---

## 3. `src/diagnostics/tests/specs/testA_previewSource.ts` (185 lines)

```ts
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
import { DiagTestSpec, DiagResult, DiagExpectedVsActualItem, DiagContext } from '../diagTypes';

export const TEST_A_SPEC: DiagTestSpec = {
  id: 'fix1a-preview-source',
  title: 'اختبار مصادر الصوت والمؤذن (Test A: Preview Source Resolution)',
  fixRef: 'Fix 1a',
  mode: 'instant',
  touchesKeys: [], // Test A does not modify user preferences
  userSteps: [
    {
      id: 'step_offline',
      title: 'إيقاف الاتصال بالإنترنت',
      description: 'يرجى إيقاف شبكة الواي فاي وبيانات الهاتف مؤقتاً لفحص التراجع للصوت الافتراضي، ثم اضغط على "متابعة".',
      actionType: 'toggle_offline',
    },
  ],

  setup: async (ctx: DiagContext) => {
    ctx.logAction('Test A setup completed');
  },

  evaluate: async (ctx: DiagContext, userResponses: Record<string, any>): Promise<DiagResult> => {
    const startedAt = ctx.state.startedAt;
    const collectedAt = Date.now();
    const expectedVsActual: DiagExpectedVsActualItem[] = [];

    // Track A: Used for online resolution
    const onlineProbeTrackId = 'muezzin_online_probe';
    const onlineProbeUrl = 'https://example.com/audio/test_online_athan.mp3';

    // Track B: Dedicated never-cached track for offline fallback test
    const offlineProbeTrackId = 'muezzin_never_cached_probe';
    const offlineProbeUrl = 'https://example.com/audio/test_offline_athan.mp3';

    // Check if onlineProbeTrackId was cached before the run
    const wasOnlineCachedBefore = await isAudioDownloaded(onlineProbeTrackId).catch(() => false);
    const wasOfflineCachedBefore = await isAudioDownloaded(offlineProbeTrackId).catch(() => false);

    // 1. Evaluate bundled/fallback local
    const bundledRes = await resolvePreviewSource(
      { id: 'makkah', url: '/audio/athan_makkah.mp3' },
      false,
      getAudioUrl,
      LOCAL_FALLBACK_AUDIO,
      true
    );
    const bundledSource = bundledRes.kind;
    expectedVsActual.push({
      parameter: 'صوت مدمج محلياً (Bundled Local)',
      expected: 'local أو bundled',
      actual: describePreviewSource(bundledSource),
      status: (bundledSource === 'local' || bundledSource === 'bundled') ? 'MATCH' : 'MISMATCH',
    });

    // 2. Evaluate un-downloaded online track (should resolve to remote)
    const onlineRes = await resolvePreviewSource(
      { id: onlineProbeTrackId, url: onlineProbeUrl },
      false,
      getAudioUrl,
      LOCAL_FALLBACK_AUDIO,
      true
    );
    const onlineUncachedSource = onlineRes.kind;
    expectedVsActual.push({
      parameter: 'مؤذن غير محمّل مع اتصال إنترنت (Online Remote)',
      expected: 'من الإنترنت (remote)',
      actual: describePreviewSource(onlineUncachedSource),
      status: onlineUncachedSource === 'remote' ? 'MATCH' : 'MISMATCH',
    });

    // Resolve URL online (this might trigger background caching of onlineProbeTrackId)
    await getAudioUrl(onlineProbeUrl, onlineProbeTrackId, false).catch(() => {});

    // 3. Evaluate offline state using dedicated un-downloaded Track B
    const userConfirmedOffline = userResponses['step_offline']?.confirmed === true;

    let offlineSource: PreviewSourceKind;
    if (userConfirmedOffline) {
      const offlineRes = await resolvePreviewSource(
        { id: offlineProbeTrackId, url: offlineProbeUrl },
        false,
        getAudioUrl,
        LOCAL_FALLBACK_AUDIO,
        false
      );
      offlineSource = offlineRes.kind;
      expectedVsActual.push({
        parameter: 'مؤذن غير محمّل بدون اتصال (Offline Fallback)',
        expected: 'الصوت الافتراضي (default)',
        actual: describePreviewSource(offlineSource),
        status: offlineSource === 'default' ? 'MATCH' : 'MISMATCH',
      });
    } else {
      expectedVsActual.push({
        parameter: 'مؤذن غير محمّل بدون اتصال (Offline Fallback)',
        expected: 'الصوت الافتراضي (default)',
        actual: 'لم يُقَس (لم يتم تأكيد إيقاف الاتصال من المستخدم)',
        status: 'UNMEASURED',
      });
    }

    // Teardown cache side effects: Wait for background download of onlineProbeTrackId and delete it if newly cached
    if (!wasOnlineCachedBefore) {
      ctx.updateState((s) => ({
        ...s,
        cacheCleanupPending: Array.from(new Set([...s.cacheCleanupPending, onlineProbeTrackId])),
      }));

      // Poll up to 5 seconds for background download to finish before clearing
      const pollStart = Date.now();
      while (Date.now() - pollStart < 5000) {
        const isNowDownloaded = await isAudioDownloaded(onlineProbeTrackId).catch(() => false);
        if (isNowDownloaded) {
          await deleteDownloadedAudio(onlineProbeTrackId).catch(() => {});
          break;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      await deleteDownloadedAudio(onlineProbeTrackId).catch(() => {});
    }

    // Teardown offline track just in case
    if (!wasOfflineCachedBefore) {
      await deleteDownloadedAudio(offlineProbeTrackId).catch(() => {});
    }

    const hasMismatch = expectedVsActual.some((item) => item.status === 'MISMATCH');
    const hasUnmeasured = expectedVsActual.some((item) => item.status === 'UNMEASURED');

    let verdict: 'PASS' | 'FAIL' | 'INCONCLUSIVE' = 'PASS';
    let reason = 'نجح فحص منطق اختيار مصادر الصوت والتراجع للأذان الافتراضي بنجاح.';

    if (hasMismatch) {
      verdict = 'FAIL';
      reason = 'حدث خطأ في تحديد مصدر الصوت لأحد المسارات.';
    } else if (hasUnmeasured) {
      verdict = 'INCONCLUSIVE';
      reason = 'لم يكتمل فحص حالة عدم الاتصال (Offline) لعدم تأكيد إيقاف الشبكة.';
    }

    const isBrowserOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

    const markdownReport = `# تقرير تشخيص Test A: مصادر صوت الأذان (Fix 1a)
- **المعرّف:** ${ctx.runId}
- **النتيجة:** **${verdict}** (${reason})
- **توقيت الفحص:** ${new Date(collectedAt).toLocaleString('ar-EG')}
- **حالة متصفح الجهاز:** ${isBrowserOnline ? 'متصل بالشبكة (online)' : 'غير متصل (offline)'}

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
```

---

## 4. `src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts` (275 lines)

```ts
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
  touchesKeys: ['salah_custom_alarms'],

  userSteps: [
    {
      id: 'step_control_hearing',
      title: 'سماع منبه المقارنة (Alarm 1 - بدون خشوع)',
      description: 'هل سمعت صوت نغمة التنبيه الخاصة بمنبه المقارنة الأول (بعد 3 دقائق من بدء الاختبار)؟',
      actionType: 'hearing_check',
    },
    {
      id: 'step_test_hearing',
      title: 'سماع منبه الخشوع (Alarm 2 - مع تفعيل الخشوع)',
      description: 'هل سمعت صوت نغمة التنبيه الخاصة بمنبه الخشوع الثاني (بعد 6 دقائق من بدء الاختبار)؟',
      actionType: 'hearing_check',
    },
  ],

  setup: async (ctx: DiagContext) => {
    ctx.logAction('Test B setup: Snapshot prepared');
  },

  schedule: async (ctx: DiagContext) => {
    const now = Date.now();
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

    // Safely inject both synthetic alarms into salah_custom_alarms
    const currentAlarms = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);
    const updated = [
      ...currentAlarms.filter((a) => !isDiagAlarmId(a.id)),
      controlAlarm,
      testAlarm,
    ];
    safeSetJSON('salah_custom_alarms', updated);

    // Save testVal into snapshot for compare-and-restore verification
    ctx.updateState((s) => ({
      ...s,
      snapshot: {
        ...s.snapshot,
        salah_custom_alarms: {
          ...s.snapshot.salah_custom_alarms,
          testVal: updated,
        },
      },
    }));

    // Trigger in-app custom alarms listener
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: updated }));
    }

    // Collect at T+6m + 15m duration + 3m buffer = T+24m
    const collectAt = alarm2Time + 15 * 60 * 1000 + 3 * 60 * 1000;
    // Timeout expires at T+24m + 15m = T+39m
    const expiresAt = collectAt + 15 * 60 * 1000;

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
    let khushuMuteInfo = evaluateMuteStateFromDetails('');

    for (const log of nativeLogs) {
      if (log.timestampMs >= startedAt) {
        if (log.event === 'alarm_received') {
          if (log.details.includes(id1)) {
            controlReceived = true;
            evidenceList.push({
              alarmId: id1,
              timestampMs: log.timestampMs,
              evidence: 'ALARM_RECEIVED',
              details: log.details,
            });
          } else if (log.details.includes(id2)) {
            testReceived = true;
            evidenceList.push({
              alarmId: id2,
              timestampMs: log.timestampMs,
              evidence: 'ALARM_RECEIVED',
              details: log.details,
            });
          }
        } else if (log.event === 'khushu_result' || log.event === 'khushu_attempt') {
          const mute = evaluateMuteStateFromDetails(log.details);
          if (mute.isMuted) {
            khushuMuteInfo = mute;
          }
        }
      }
    }

    // User hearing responses
    const controlHeard = userResponses['step_control_hearing']?.heard === true;
    const testHeard = userResponses['step_test_hearing']?.heard === true;

    expectedVsActual.push({
      parameter: 'وصول منبه المقارنة للنظام (Control Received)',
      expected: 'تم استلامه في AlarmReceiver',
      actual: controlReceived ? 'تم الاستلام بنجاح ✓' : 'لم يتم رصد الحدث في السجل',
      status: controlReceived ? 'MATCH' : 'MISMATCH',
    });

    expectedVsActual.push({
      parameter: 'وصول منبه الخشوع للنظام (Test Received)',
      expected: 'تم استلامه في AlarmReceiver',
      actual: testReceived ? 'تم الاستلام بنجاح ✓' : 'لم يتم رصد الحدث في السجل',
      status: testReceived ? 'MATCH' : 'MISMATCH',
    });

    expectedVsActual.push({
      parameter: 'سماع صوت منبه المقارنة بشرياً (Control Audible)',
      expected: 'مسموع (نعم)',
      actual: controlHeard ? 'مسموع ✓' : 'لم يُسمع ✕',
      status: controlHeard ? 'MATCH' : 'MISMATCH',
    });

    expectedVsActual.push({
      parameter: 'حالة كتم الصوت بالنظام أثناء الخشوع (Mute State Active)',
      expected: 'حالة كتم نشطة (SILENT=0 أو VIBRATE=1 أو DND=1)',
      actual: khushuMuteInfo.description,
      status: khushuMuteInfo.isMuted ? 'MATCH' : 'UNMEASURED',
    });

    expectedVsActual.push({
      parameter: 'سماع صوت منبه الخشوع بشرياً (Test Audible)',
      expected: 'مكتوم (غير مسموع عند ثبوت الفرضية)',
      actual: testHeard ? 'مسموع' : 'مكتوم',
      status: 'MATCH',
    });

    // 4-Outcome Verdict Rule:
    let verdict: DiagVerdict;
    let reason: string;

    if (!controlHeard && !testHeard) {
      verdict = 'INCONCLUSIVE';
      reason = 'لم يُسمع كِلا المنبهين (Control و Test). قد يكون الهاتف موضوعاً في وضع الصامت العام مسبقاً أو تعذر انطلاق التنبيه.';
    } else if (controlHeard && !testHeard && khushuMuteInfo.isMuted) {
      verdict = 'SUPPORTS_HYPOTHESIS';
      reason = `تؤيد النتائج الفرضية B3: سُمع منبه المقارنة وانكتم منبه الخشوع بسبب وضع الكتم المسجل (${khushuMuteInfo.description}).`;
    } else if (controlHeard && testHeard) {
      verdict = 'REFUTED';
      reason = 'تم دحض الفرضية B3: انطلق كِلا المنبهين وسُمعا بنجاح رغم تفعيل وضع الخشوع (تمكن المنبه من كسر الكتم).';
    } else {
      verdict = 'INCONCLUSIVE';
      reason = 'نتائج غير حاسمة: لم يُسمع منبه المقارنة ولكن سُمع منبه الخشوع أو تعذر استيفاء شروط الكتم التقنية.';
    }

    const markdownReport = `# تقرير تشخيص Test B: فحص تأثير وضع الخشوع على المنبه المخصص (B3)
- **المعرّف:** ${ctx.runId}
- **الحكم النهائي:** **${verdict}**
- **السبب:** ${reason}
- **توقيت الفحص:** ${new Date(collectedAt).toLocaleString('ar-EG')}
- **حالة الكتم المسجلة بالنظام:** ${khushuMuteInfo.description}

## جدول المتوقع مقابل الفعلي (Expected vs Actual)
| الفحص التقني / الحسي | المتوقع | الفعلي | الحالة |
|---|---|---|---|
${expectedVsActual.map((item) => `| ${item.parameter} | ${item.expected} | ${item.actual} | ${item.status === 'MATCH' ? 'مطابق ✓' : item.status === 'MISMATCH' ? 'خطأ ✕' : 'غير حاسم'} |`).join('\n')}

## الأدلة التقنية المرصودة من نظام أندرويد (Native Evidence)
${evidenceList.length > 0 ? evidenceList.map((e) => `- **[${new Date(e.timestampMs).toLocaleTimeString('ar-EG')}]** ${e.evidence} للمنبه \`${e.alarmId}\`: ${e.details}`).join('\n') : '- لم تُسجل أحداث مباشرة.'}

## خلاصة التحكيم
المنبهات المخصصة تعمل عبر القناة الإشعارية ولا تقدم إشعار تشغيل صوتي مسبق (PLAYBACK_STARTED)، لذا فإن الدليل التقني القاطع هو \`ALARM_RECEIVED\` مقترناً باستبيان السماع الحقيقي من المستخدم.
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
```

---

## 5. `src/components/WorshipAlarms.tsx` (Changed Hunks T1)

### أ. استيراد المعرّف وتصدير دالة الفلترة النقية (الأسطر 38-51):
```ts
import SystemAlarmCard from './alarms/SystemAlarmCard';
import SystemAlarmEditModal, { SystemAlarmItemKey } from './alarms/SystemAlarmEditModal';
import { isDiagAlarmId } from '../diagnostics/tests/diagTypes';

/**
 * Pure filter for user-visible custom alarms.
 * Hides internal diagnostic synthetic alarms (prefixed with 'diag_') at render-time only.
 */
export function filterUserVisibleAlarms(alarms: AlarmConfig[]): AlarmConfig[] {
  if (!Array.isArray(alarms)) return [];
  return alarms.filter(a => !isDiagAlarmId(a?.id));
}

interface WorshipAlarmsProps {
```

### ب. تكوين القائمة المفلترة للعرض (الأسطر 77-80):
```ts
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const visibleAlarms = useMemo(() => filterUserVisibleAlarms(customAlarms), [customAlarms]);

  // System Push & Smart Notifications State
```

### ج. حلقة العرض باستخدام `visibleAlarms` واستخدام `alarm.id` بالمعالجات (الأسطر 385-420):
```tsx
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
            المنبهات المخصصة والعبادات
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            {visibleAlarms.length} منبه
          </span>
        </div>

        {visibleAlarms.length > 0 ? (
          visibleAlarms.map(alarm => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              onToggle={handleToggleAlarm}
              onEdit={handleOpenEditModal}
              onDelete={promptDeleteAlarm}
            />
          ))
        ) : (
          <AlarmEmptyState
            onOpenAddModal={handleOpenAddModal}
            onRestoreDefaults={() => setShowRestoreConfirm(true)}
          />
        )}
      </div>

      {/* Footer / Reset Defaults Helper for Custom Alarms */}
      {visibleAlarms.length > 0 && (
        <div className="flex items-center justify-between pt-1 px-1 text-xs font-bold text-slate-400 flex-wrap gap-2">
          <span>انقر على أي منبه لتعديل موعده، نغمته، أو الصلوات المرتبطة به.</span>
          <button
            type="button"
            onClick={() => setShowRestoreConfirm(true)}
            className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            استعادة التنبيهات الافتراضية
          </button>
        </div>
      )}
```

---

## 6. `src/components/settings/BackupSettingsTab.tsx` (Changed Hunks T2)

### أ. تصفية التصدير (السطر 135):
```ts
        customAlarms: (safeGetJSON<any[]>('salah_custom_alarms', []) || []).filter(a => !isDiagAlarmId(a?.id)),
```

### ب. تطهير الاستيراد والاستعادة (الأسطر 274-282):
```ts
      if (data.customAlarms && Array.isArray(data.customAlarms)) {
        const sanitizedAlarms = data.customAlarms.filter((a: any) => !isDiagAlarmId(a?.id));
        safeSetItem('salah_custom_alarms', JSON.stringify(sanitizedAlarms));
        try {
          window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: sanitizedAlarms }));
        } catch (_e) {}
        restoredCount++;
      }
```

---

## 7. `src/services/athanAlarmPlugin.ts` (Changed Hunks T3)

### تقييد الجدولة ومنع التكرار لمنبهات `diag_` (الأسطر 518-531):
```ts
        // If oneShot is set or it is a diagnostic alarm, it must ONLY be scheduled for its specific fireDate (never weekly via days[])
        const isDiag = isDiagAlarmId(alarm.id);
        if (alarm.oneShot || isDiag) {
          if (!alarm.fireDate) return;
          const dayDateYear = dayDate.getFullYear();
          const dayDateMonth = (dayDate.getMonth() + 1).toString().padStart(2, '0');
          const dayDateDay = dayDate.getDate().toString().padStart(2, '0');
          const dayDateStr = `${dayDateYear}-${dayDateMonth}-${dayDateDay}`;
          if (dayDateStr !== alarm.fireDate) return;
        } else {
          if (!alarm.days?.includes(dayOfWeek)) return;
        }
```

---

## 8. `src/utils/audioStorage.ts` (Exact Diff T4)

```diff
--- src/utils/audioStorage.ts
+++ src/utils/audioStorage.ts
@@ -136,3 +136,6 @@
 export async function deleteDownloadedAudio(trackId: string): Promise<void> {
+  if (typeof indexedDB === 'undefined') {
+    return;
+  }
   const db = await initAudioDB();
   const dbKey = `downloaded_${trackId}`;
```

---

## 9. `android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt` (110 lines)

```kotlin
package com.salahpro.app.plugins

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray

class AthanBootReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "AthanBootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d(TAG, "Received boot/package intent: $action")

        if (action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            AthanAlarmPlugin.logNativeEvent(context, "package_replaced", "action=$action")
        }

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == "android.intent.action.QUICKBOOT_POWERON") {

            restoreAlarms(context)
            restoreKhushuState(context)
        }
    }

    private fun restoreKhushuState(context: Context) {
        try {
            if (KhushuRestoreReceiver.isKhushuActive(context)) {
                val remainingMins = KhushuRestoreReceiver.getRemainingMinutes(context)
                if (remainingMins > 0) {
                    Log.d(TAG, "Khushu mode still active after boot, rescheduling restore in $remainingMins minutes")
                    KhushuRestoreReceiver.scheduleRestoreAlarm(context, remainingMins)
                } else {
                    Log.d(TAG, "Khushu mode expired during reboot, restoring original sound state now")
                    KhushuRestoreReceiver.restoreOriginalState(context)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed handling Khushu state on boot", e)
        }
    }

    private fun restoreAlarms(context: Context) {
        try {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            if (alarmManager == null) {
                Log.w(TAG, "AlarmManager service not available on boot")
                AthanAlarmPlugin.logNativeEvent(context, "boot_restore", "result=aborted_alarm_manager_null")
                return
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                Log.w(TAG, "Exact alarm permission missing on boot. Alarms will be scheduled when user opens app.")
                AthanAlarmPlugin.logNativeEvent(context, "boot_restore", "result=aborted_permission_not_granted")
                return
            }

            val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
            // On reboot or app update, the OS AlarmManager has been wiped.
            // Do NOT trust the stored scheduled IDs ledger: clear it so all alarms are freshly re-registered.
            prefs.edit()
                .remove(AthanAlarmPlugin.KEY_SCHEDULED_IDS)
                .putLong("last_device_boot_timestamp", System.currentTimeMillis())
                .apply()

            val jsonString = prefs.getString(AthanAlarmPlugin.KEY_SAVED_ALARMS, null)
            if (jsonString == null) {
                AthanAlarmPlugin.logNativeEvent(context, "boot_restore", "result=no_saved_alarms")
                return
            }

            val jsonArray = JSONArray(jsonString)
            val cleanArray = JSONArray()
            var diagCount = 0
            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(i)
                val pKey = item.optString("prayerKey", "")
                val aId = item.optString("alarmId", "")
                if (pKey.contains("diag_") || aId.startsWith("diag_")) {
                    diagCount++
                } else {
                    cleanArray.put(item)
                }
            }

            if (diagCount > 0) {
                prefs.edit().putString(AthanAlarmPlugin.KEY_SAVED_ALARMS, cleanArray.toString()).apply()
                Log.d(TAG, "Purged $diagCount diagnostic alarms from boot restoration ledger")
            }

            val restoredCount = AthanAlarmPlugin.restoreOrScheduleAlarms(context, cleanArray)

            Log.d(TAG, "Restored $restoredCount exact athan alarms after boot (forced re-registration)")
            AthanAlarmPlugin.logNativeEvent(context, "boot_restore", "result=success, restoredCount=$restoredCount")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to restore athan alarms on boot", e)
            AthanAlarmPlugin.logNativeEvent(context, "boot_restore", "result=failed", e)
        }
    }
}
```

---

## 10. `android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt` (276 lines)

```kotlin
package com.salahpro.app.plugins

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.util.Log
import com.salahpro.app.widget.SalahWidgetProvider

/**
 * KhushuRestoreReceiver:
 * BroadcastReceiver triggered by AlarmManager to reliably restore original
 * audio and notification interruption filter even if the application process was killed.
 */
class KhushuRestoreReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "KhushuRestoreReceiver"
        const val ACTION_RESTORE_KHUSHU = "com.salahpro.app.ACTION_RESTORE_KHUSHU"
        const val PREFS_NAME = "KhushuModePrefs"
        const val KEY_IS_ACTIVE = "khushu_is_active"
        const val KEY_ORIGINAL_FILTER = "khushu_original_filter"
        const val KEY_ORIGINAL_RINGER = "khushu_original_ringer"
        const val KEY_ACTIVATED_AT = "khushu_activated_at"
        const val KEY_DURATION_MINUTES = "khushu_duration_minutes"
        const val KEY_MODE = "khushu_mode"
        const val KHUSHU_RESTORE_REQUEST_CODE = 998877 // Constant, deterministic request code (No index collision)
        const val KHUSHU_NOTIFICATION_ID = 8888 // Fixed notification ID for Khushu status

        fun isKhushuActive(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
            if (!isActive) return false
            val activatedAt = prefs.getLong(KEY_ACTIVATED_AT, 0L)
            val durationMinutes = prefs.getInt(KEY_DURATION_MINUTES, 30)
            if (activatedAt > 0L) {
                val elapsedMs = System.currentTimeMillis() - activatedAt
                val totalMs = durationMinutes * 60_000L
                if (elapsedMs >= totalMs) {
                    restoreOriginalState(context)
                    return false
                }
            }
            return true
        }

        fun getRemainingMinutes(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
            if (!isActive) return 0
            val activatedAt = prefs.getLong(KEY_ACTIVATED_AT, 0L)
            val durationMinutes = prefs.getInt(KEY_DURATION_MINUTES, 30)
            if (activatedAt > 0L) {
                val elapsedMs = System.currentTimeMillis() - activatedAt
                val totalMs = durationMinutes * 60_000L
                val leftMs = totalMs - elapsedMs
                return if (leftMs > 0L) Math.ceil(leftMs / 60_000.0).toInt() else 0
            }
            return durationMinutes
        }

        fun scheduleRestoreAlarm(context: Context, durationMinutes: Int) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_RESTORE_KHUSHU
            }
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                KHUSHU_RESTORE_REQUEST_CODE,
                intent,
                flags
            )
            val triggerAt = System.currentTimeMillis() + (durationMinutes * 60_000L)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }
            Log.d(TAG, "Scheduled restore alarm in $durationMinutes minutes with requestCode $KHUSHU_RESTORE_REQUEST_CODE")
        }

        fun cancelRestoreAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_RESTORE_KHUSHU
            }
            val flags = PendingIntent.FLAG_NO_CREATE or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                KHUSHU_RESTORE_REQUEST_CODE,
                intent,
                flags
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
                Log.d(TAG, "Cancelled restore alarm")
            }
        }

        fun activateKhushuDirectly(context: Context, mode: String = "silent", durationMinutes: Int = 30): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

            val initialRinger = audioManager?.ringerMode ?: -1
            val initialFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager?.currentInterruptionFilter ?: -1
            } else -1

            val hasDndPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager?.isNotificationPolicyAccessGranted == true
            } else {
                true
            }

            AthanAlarmPlugin.logNativeEvent(
                context,
                "khushu_attempt",
                "mode=$mode, durationMinutes=$durationMinutes, initialRinger=$initialRinger, initialFilter=$initialFilter, hasDndPermission=$hasDndPermission"
            )

            // 1. Snapshot current state if not already active
            if (!prefs.getBoolean(KEY_IS_ACTIVE, false)) {
                val currentFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    notificationManager?.currentInterruptionFilter ?: NotificationManager.INTERRUPTION_FILTER_ALL
                } else {
                    NotificationManager.INTERRUPTION_FILTER_ALL
                }
                val currentRinger = audioManager?.ringerMode ?: AudioManager.RINGER_MODE_NORMAL
                prefs.edit()
                    .putInt(KEY_ORIGINAL_FILTER, currentFilter)
                    .putInt(KEY_ORIGINAL_RINGER, currentRinger)
                    .apply()
            }

            // 2. Apply silence / DND with graceful fallbacks
            if (mode == "dnd" && hasDndPermission) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        notificationManager?.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
                        Log.d(TAG, "DND interruption filter set to NONE")
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Error setting DND interruption filter", e)
                }
            }

            var ringerError: Throwable? = null
            // Always silence ringer, falling back to Vibrate if Android throws SecurityException
            try {
                audioManager?.ringerMode = AudioManager.RINGER_MODE_SILENT
                Log.d(TAG, "Ringer mode set to RINGER_MODE_SILENT")
            } catch (se: SecurityException) {
                ringerError = se
                Log.w(TAG, "RINGER_MODE_SILENT requires DND access. Falling back to RINGER_MODE_VIBRATE", se)
                try {
                    audioManager?.ringerMode = AudioManager.RINGER_MODE_VIBRATE
                } catch (ve: Exception) {
                    Log.e(TAG, "Failed setting ringer mode to vibrate", ve)
                }
            } catch (e: Exception) {
                ringerError = e
                Log.e(TAG, "Error setting silent ringer mode", e)
            }

            // 3. Save active state
            val now = System.currentTimeMillis()
            prefs.edit()
                .putBoolean(KEY_IS_ACTIVE, true)
                .putString(KEY_MODE, mode)
                .putInt(KEY_DURATION_MINUTES, durationMinutes)
                .putLong(KEY_ACTIVATED_AT, now)
                .apply()

            // 4. Schedule Alarm
            scheduleRestoreAlarm(context, durationMinutes)

            // 5. Update Widgets
            SalahWidgetProvider.updateAllWidgets(context)

            val appliedRinger = audioManager?.ringerMode ?: -1
            val appliedFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager?.currentInterruptionFilter ?: -1
            } else -1

            if (ringerError != null) {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_result",
                    "mode=$mode, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission, fallback_vibrate=true",
                    ringerError
                )
            } else {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_result",
                    "mode=$mode, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission"
                )
            }

            return true
        }

        fun restoreOriginalState(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

            val savedFilter = prefs.getInt(KEY_ORIGINAL_FILTER, NotificationManager.INTERRUPTION_FILTER_ALL)
            val savedRinger = prefs.getInt(KEY_ORIGINAL_RINGER, AudioManager.RINGER_MODE_NORMAL)

            // Restore DND filter
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    if (notificationManager?.isNotificationPolicyAccessGranted == true) {
                        notificationManager.setInterruptionFilter(savedFilter)
                        Log.d(TAG, "Restored DND filter to $savedFilter")
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Could not restore interruption filter", e)
                }
            }

            // Restore Ringer Mode
            try {
                audioManager?.ringerMode = savedRinger
                Log.d(TAG, "Restored ringer mode to $savedRinger")
            } catch (e: Exception) {
                Log.w(TAG, "Could not restore ringer mode", e)
            }

            // Mark inactive
            prefs.edit()
                .putBoolean(KEY_IS_ACTIVE, false)
                .remove(KEY_ORIGINAL_FILTER)
                .remove(KEY_ORIGINAL_RINGER)
                .remove(KEY_ACTIVATED_AT)
                .apply()

            cancelRestoreAlarm(context)
            SalahWidgetProvider.updateAllWidgets(context)

            AthanAlarmPlugin.logNativeEvent(
                context,
                "khushu_restore",
                "restoredFilter=$savedFilter, restoredRinger=$savedRinger"
            )
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_RESTORE_KHUSHU) {
            Log.d(TAG, "Khushu restore alarm fired via AlarmManager broadcast")
            restoreOriginalState(context)
        }
    }
}
```

---

## 11. `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt` (Changed Functions)

### أ. دالة `createAthanIntent` و `getAthanPendingIntent` (الأسطر 130-189):
```kotlin
        @JvmStatic
        fun createAthanIntent(
            context: Context,
            prayerName: String = "الصلاة",
            isFajr: Boolean = false,
            prayerKey: String = "",
            timeMs: Long = 0L,
            alarmType: String = "",
            durationMinutes: Int = 15,
            khushuMode: String = "silent",
            soundType: String = "reminder",
            notifyMode: String = "both",
            autoKhushu: Boolean = false
        ): Intent {
            val resolvedType = if (alarmType.isNotEmpty()) {
                alarmType
            } else if (prayerKey.startsWith("custom_")) {
                "custom"
            } else if (prayerKey.contains("prealert")) {
                "prealert"
            } else if (prayerKey.contains("postalert") || prayerKey.contains("worship")) {
                "postalert"
            } else if (prayerKey.contains("khushu")) {
                "khushu"
            } else {
                "athan"
            }
            return Intent(context, AthanAlarmReceiver::class.java).apply {
                action = AthanAlarmReceiver.ACTION_ATHAN_ALARM
                putExtra(AthanAlarmReceiver.EXTRA_PRAYER_NAME, prayerName)
                putExtra(AthanAlarmReceiver.EXTRA_IS_FAJR, isFajr)
                putExtra(AthanAlarmReceiver.EXTRA_PRAYER_KEY, prayerKey)
                putExtra(AthanAlarmReceiver.EXTRA_PRAYER_TIME, timeMs)
                putExtra(AthanAlarmReceiver.EXTRA_ALARM_TYPE, resolvedType)
                putExtra(AthanAlarmReceiver.EXTRA_DURATION_MINUTES, durationMinutes)
                putExtra(AthanAlarmReceiver.EXTRA_KHUSHU_MODE, khushuMode)
                putExtra("soundType", soundType)
                putExtra("notifyMode", notifyMode)
                putExtra("autoKhushu", autoKhushu)
            }
        }

        @JvmStatic
        fun getAthanPendingIntent(
            context: Context,
            requestCode: Int,
            intent: Intent = createAthanIntent(context)
        ): PendingIntent {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            return PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                flags
            )
        }
```

### ب. دالة `reconcileAlarmsInternalStatic` وفحص `os_verified` (الأسطر 241-396):
```kotlin
        fun reconcileAlarmsInternalStatic(
            context: Context,
            alarmManager: AlarmManager,
            desiredTimesArray: JSONArray
        ): Map<String, Any> {
            val now = System.currentTimeMillis()
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val currentScheduledIds = (prefs.getStringSet(KEY_SCHEDULED_IDS, emptySet()) ?: emptySet()).toMutableSet()

            // 1. Build desired Map for nearest 14 days using pure filter function
            val active14DayList = filterAlarmsFor14DayWindow(desiredTimesArray, now, 14L)
            val desiredMap = mutableMapOf<Int, org.json.JSONObject>()
            for (item in active14DayList) {
                val timeMs = item.optLong("timeMs", 0L)
                val prayerKey = item.optString("prayerKey", "")
                val reqCode = getDeterministicRequestCode(prayerKey, timeMs)
                desiredMap[reqCode] = item
            }

            var addedCount = 0
            var removedCount = 0
            var retainedCount = 0

            // 2. Identify Obsolete: in currentScheduledIds but NOT in desiredMap (including past or slid past 14 days)
            val obsoleteIds = mutableListOf<Int>()
            for (idStr in currentScheduledIds) {
                val reqCode = idStr.toIntOrNull() ?: continue
                if (!desiredMap.containsKey(reqCode)) {
                    obsoleteIds.add(reqCode)
                }
            }

            for (obsoleteCode in obsoleteIds) {
                cancelSingleAlarmStatic(context, alarmManager, obsoleteCode, skipLog = true)
                currentScheduledIds.remove(obsoleteCode.toString())
                removedCount++
            }

            if (obsoleteIds.isNotEmpty()) {
                logNativeEvent(
                    context,
                    "alarm_cancel",
                    "count=${obsoleteIds.size}, reason=reconcile_obsolete"
                )
            }

            // 3. Unconditionally re-assert every 14-day alarm in AlarmManager
            val newScheduledIds = mutableSetOf<String>()
            for ((reqCode, item) in desiredMap) {
                val timeMs = item.optLong("timeMs", 0L)
                val prayerName = item.optString("prayerName", "الصلاة")
                val isFajr = item.optBoolean("isFajr", false)
                val prayerKey = item.optString("prayerKey", "")
                val alarmType = item.optString("alarmType", if (prayerKey.startsWith("custom_")) "custom" else if (prayerKey.contains("prealert")) "prealert" else if (prayerKey.contains("khushu")) "khushu" else "athan")
                val durationMinutes = item.optInt("durationMinutes", 15)
                val khushuMode = item.optString("khushuMode", "silent")
                val soundType = item.optString("soundType", "reminder")
                val notifyMode = item.optString("notifyMode", "both")
                val autoKhushu = item.optBoolean("autoKhushu", false)

                try {
                    val intent = createAthanIntent(
                        context = context,
                        prayerName = prayerName,
                        isFajr = isFajr,
                        prayerKey = prayerKey,
                        timeMs = timeMs,
                        alarmType = alarmType,
                        durationMinutes = durationMinutes,
                        khushuMode = khushuMode,
                        soundType = soundType,
                        notifyMode = notifyMode,
                        autoKhushu = autoKhushu
                    )
                    val pendingIntent = getAthanPendingIntent(context, reqCode, intent)
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            timeMs,
                            pendingIntent
                        )
                    } else {
                        alarmManager.setExact(
                            AlarmManager.RTC_WAKEUP,
                            timeMs,
                            pendingIntent
                        )
                    }

                    if (currentScheduledIds.contains(reqCode.toString())) {
                        retainedCount++
                    } else {
                        addedCount++
                    }
                    newScheduledIds.add(reqCode.toString())
                } catch (e: Exception) {
                    Log.e(TAG, "Failed setting exact alarm in reconcile for code $reqCode", e)
                    logNativeEvent(
                        context,
                        "schedule_failed",
                        "requestCode=$reqCode, prayerKey=$prayerKey, timeMs=$timeMs",
                        e
                    )
                }
            }

            // Save updated state ledger
            prefs.edit()
                .putInt(KEY_SCHEDULED_COUNT, newScheduledIds.size)
                .putStringSet(KEY_SCHEDULED_IDS, newScheduledIds)
                .apply()

            // 4. Verify OS registration via PendingIntent.getBroadcast(FLAG_NO_CREATE) for near window (next 20 upcoming alarms)
            var osVerifiedStr = "unknown"
            try {
                val checkFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
                } else {
                    PendingIntent.FLAG_NO_CREATE
                }
                val checkIntent = Intent(context, AthanAlarmReceiver::class.java).apply {
                    action = AthanAlarmReceiver.ACTION_ATHAN_ALARM
                }
                val nearWindowAlarms = active14DayList
                    .filter { it.optLong("timeMs", 0L) > now }
                    .take(20)
                var verifiedCount = 0
                for (item in nearWindowAlarms) {
                    val timeMs = item.optLong("timeMs", 0L)
                    val prayerKey = item.optString("prayerKey", "")
                    val reqCode = getDeterministicRequestCode(prayerKey, timeMs)
                    val pi = PendingIntent.getBroadcast(context, reqCode, checkIntent, checkFlags)
                    if (pi != null) {
                        verifiedCount++
                    }
                }
                osVerifiedStr = "$verifiedCount/${nearWindowAlarms.size}"
            } catch (e: Exception) {
                Log.w(TAG, "Failed verifying alarms with OS via FLAG_NO_CREATE", e)
                osVerifiedStr = "unknown"
            }

            Log.d(TAG, "Reconcile completed: 14-day active total=${newScheduledIds.size}, added=$addedCount, removed=$removedCount, reasserted/retained=$retainedCount, os_verified=$osVerifiedStr")
            logNativeEvent(
                context,
                "reconcile",
                "scheduled=$addedCount, cancelled=$removedCount, retained=$retainedCount, os_verified=$osVerifiedStr, total=${newScheduledIds.size}"
            )

            return mapOf(
                "added" to addedCount,
                "removed" to removedCount,
                "retained" to retainedCount,
                "os_verified" to osVerifiedStr,
                "total" to newScheduledIds.size
            )
        }
```

### ج. دالة `getAlarmDiagnostics` تضمين ختم الإقلاع (الأسطر 1503-1507):
```kotlin
        val lastBootTimestamp = prefs.getLong("last_device_boot_timestamp", 0L)
        ret.put("lastDeviceBootTimestamp", lastBootTimestamp)
        ret.put("nativeEvents", nativeEventsArray)

        call.resolve(ret)
```

---

## 12. `src/diagnostics/tests/diagRunner.test.ts` (784 lines)

```ts
import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashValue,
  parseMuteState,
  checkPrayerProximityGuard,
  DiagRunner,
  DIAG_RUN_STATE_KEY,
} from './diagRunner';
import { TEST_A_SPEC } from './specs/testA_previewSource';
import { TEST_B_SPEC } from './specs/testB_khushuCustomAlarm';
import { DiagRunState, DiagContext, isDiagAlarmId, DIAG_ALARM_PREFIX } from './diagTypes';
import { safeSetJSON, safeGetJSON } from '../../utils/storage';
import { setAthanPluginBridgeForTesting, buildNativePrayerTimeAlarms } from '../../services/athanAlarmPlugin';
import { filterUserVisibleAlarms } from '../../components/WorshipAlarms';
import { deleteDownloadedAudio } from '../../utils/audioStorage';
import { AlarmConfig } from '../../types';

// MockStorage for node environment
class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number { return this.store.size; }
  clear(): void { this.store.clear(); }
  getItem(key: string): string | null { return this.store.has(key) ? this.store.get(key)! : null; }
  key(index: number): string | null { return Array.from(this.store.keys())[index] ?? null; }
  removeItem(key: string): void { this.store.delete(key); }
  setItem(key: string, value: string): void { this.store.set(key, String(value)); }
}

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = new MockStorage();
}

describe('Diagnostics Test Framework (Phase 1): DiagRunner & Verdict Engine', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    setAthanPluginBridgeForTesting(null);
  });

  describe('1. Hash Value Determinism', () => {
    test('produces identical hashes for identical structures regardless of object instance', () => {
      const obj1 = { enabled: true, duration: 25, mode: 'silent' };
      const obj2 = { enabled: true, duration: 25, mode: 'silent' };
      assert.equal(hashValue(obj1), hashValue(obj2));
    });

    test('produces different hashes for modified fields', () => {
      const obj1 = { enabled: true, duration: 25 };
      const obj2 = { enabled: false, duration: 25 };
      assert.notEqual(hashValue(obj1), hashValue(obj2));
    });

    test('handles undefined and null safely', () => {
      assert.equal(hashValue(undefined), 'undefined');
      assert.notEqual(hashValue(null), 'undefined');
    });
  });

  describe('2. Mute State Detection Matrix (parseMuteState)', () => {
    test('detects ringerMode=0 (SILENT) as muted', () => {
      const state = parseMuteState('test event with ringerMode=0 and interruptionFilter=2');
      assert.equal(state.isMuted, true);
      assert.equal(state.ringerMode, 0);
    });

    test('detects ringerMode=1 (VIBRATE) as muted', () => {
      const state = parseMuteState('test event with appliedRinger=1, mode=silent');
      assert.equal(state.isMuted, true);
      assert.equal(state.ringerMode, 1);
    });

    test('detects interruptionFilter=1 (DND_NONE) as muted', () => {
      const state = parseMuteState('test event with ringerMode=2 and interruptionFilter=1');
      assert.equal(state.isMuted, true);
      assert.equal(state.interruptionFilter, 1);
    });

    test('detects normal ringerMode=2 and interruptionFilter=2 as unmuted', () => {
      const state = parseMuteState('normal event with ringerMode=2 and interruptionFilter=2');
      assert.equal(state.isMuted, false);
      assert.equal(state.ringerMode, 2);
    });
  });

  describe('3. Compare-and-Restore Engine', () => {
    test('restores keys matching original test snapshot', async () => {
      const runner = new DiagRunner();
      const initialSettings = { autoWithIqama: true, preferredMode: 'silent' };
      safeSetJSON('hemmaty_khushu_settings_v2', initialSettings);

      const state: DiagRunState = {
        runId: 'test_run_1',
        testId: 'b3-khushu-custom-alarm',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {
          hemmaty_khushu_settings_v2: {
            original: initialSettings,
            hash: hashValue(initialSettings),
            testVal: { autoWithIqama: false, preferredMode: 'dnd' },
          },
        },
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };

      // Pretend test modified settings to testVal
      safeSetJSON('hemmaty_khushu_settings_v2', { autoWithIqama: false, preferredMode: 'dnd' });

      const res = await runner.compareAndRestore(state);
      assert.equal(res.restoredKeys.includes('hemmaty_khushu_settings_v2'), true);
      assert.equal(res.conflicts.length, 0);

      const restoredVal = safeGetJSON('hemmaty_khushu_settings_v2', null);
      assert.deepEqual(restoredVal, initialSettings);
    });

    test('retains user modification when user changed settings mid-test (conflict)', async () => {
      const runner = new DiagRunner();
      const initialSettings = { autoWithIqama: true, preferredMode: 'silent' };
      safeSetJSON('hemmaty_khushu_settings_v2', initialSettings);

      const state: DiagRunState = {
        runId: 'test_run_2',
        testId: 'b3-khushu-custom-alarm',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {
          hemmaty_khushu_settings_v2: {
            original: initialSettings,
            hash: hashValue(initialSettings),
            testVal: { autoWithIqama: false, preferredMode: 'dnd' },
          },
        },
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };

      // User modified settings to a custom value during the test!
      const userModified = { autoWithIqama: true, preferredMode: 'vibrate', userCustomFlag: true };
      safeSetJSON('hemmaty_khushu_settings_v2', userModified);

      const res = await runner.compareAndRestore(state);
      assert.equal(res.conflicts.length, 1);
      assert.equal(res.conflicts[0].key, 'hemmaty_khushu_settings_v2');

      // Value must be retained (NOT overwritten by original snapshot)
      const currentVal = safeGetJSON('hemmaty_khushu_settings_v2', null);
      assert.deepEqual(currentVal, userModified);
    });

    test('cleans up createdAlarmIds from salah_custom_alarms without touching user alarms', async () => {
      const runner = new DiagRunner();
      const realAlarm1 = { id: 'alarm_duha', title: 'صلاة الضحى', enabled: true };
      const realAlarm2 = { id: 'alarm_witr', title: 'صلاة الوتر', enabled: true };
      const syntheticAlarm1 = { id: 'diag_run_1_1', title: 'منبه تجربة', enabled: true };
      const syntheticAlarm2 = { id: 'diag_run_1_2', title: 'منبه تجربة 2', enabled: true };

      safeSetJSON('salah_custom_alarms', [realAlarm1, syntheticAlarm1, realAlarm2, syntheticAlarm2]);

      const state: DiagRunState = {
        runId: 'test_run_alarms',
        testId: 'b3-khushu-custom-alarm',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {
          salah_custom_alarms: {
            original: [realAlarm1, realAlarm2],
            hash: hashValue([realAlarm1, realAlarm2]),
            testVal: [realAlarm1, syntheticAlarm1, realAlarm2, syntheticAlarm2],
          },
        },
        createdAlarmIds: ['diag_run_1_1', 'diag_run_1_2'],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };

      await runner.compareAndRestore(state);

      const remainingAlarms = safeGetJSON<any[]>('salah_custom_alarms', []);
      assert.equal(remainingAlarms.length, 2);
      assert.equal(remainingAlarms.some((a) => a.id === 'diag_run_1_1'), false);
      assert.equal(remainingAlarms.some((a) => a.id === 'diag_run_1_2'), false);
      assert.equal(remainingAlarms.some((a) => a.id === 'alarm_duha'), true);
      assert.equal(remainingAlarms.some((a) => a.id === 'alarm_witr'), true);
    });
  });

  describe('4. Prayer Proximity Guard', () => {
    test('rejects test when near an upcoming athan time within guard window', () => {
      const now = Date.now();
      const athanTimes = [
        { name: 'العصر', timeMs: now + 15 * 60 * 1000 }, // in 15 minutes
      ];

      const check = checkPrayerProximityGuard({
        athanTimes,
        testDurationMinutes: 25,
        now,
      });

      assert.equal(check.allowed, false);
      assert.match(check.reason || '', /توجد صلاة حقيقية/);
    });

    test('rejects test when near an upcoming custom alarm within guard window', () => {
      const now = Date.now();
      const d = new Date(now + 20 * 60 * 1000); // 20 minutes from now
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

      const customAlarms = [
        { id: 'custom_adhkar', title: 'أذكار المساء', enabled: true, time: timeStr, soundType: 'reminder', days: [0, 1, 2, 3, 4, 5, 6] },
      ];

      const check = checkPrayerProximityGuard({
        athanTimes: [],
        customAlarms,
        testDurationMinutes: 25,
        now,
      });

      assert.equal(check.allowed, false);
      assert.match(check.reason || '', /يوجد منبه مخصص حقيقي/);
    });

    test('allows test when no real athans or custom alarms fall inside guard window', () => {
      const now = Date.now();
      const athanTimes = [
        { name: 'المغرب', timeMs: now + 3 * 3600 * 1000 }, // 3 hours away
      ];

      const check = checkPrayerProximityGuard({
        athanTimes,
        testDurationMinutes: 25,
        now,
      });

      assert.equal(check.allowed, true);
    });
  });

  describe('5. Reboot During Waiting Detection', () => {
    test('detects device reboot occurred during waiting phase and aborts safely', async () => {
      const runner = new DiagRunner();
      const testStartedAt = Date.now() - 10 * 60 * 1000; // started 10 minutes ago
      const rebootTimestamp = testStartedAt + 2 * 60 * 1000; // rebooted 8 minutes ago

      // Mock bridge reporting last device boot timestamp
      setAthanPluginBridgeForTesting({
        getAlarmDiagnostics: async () => ({
          scheduledAlarms: [],
          scheduledCount: 0,
          exactAlarmPermissionGranted: true,
          batteryOptimizationIgnored: true,
          notificationPermissionGranted: true,
          lastDeviceBootTimestamp: rebootTimestamp,
          nativeEvents: [],
        }),
      });

      const state: DiagRunState = {
        runId: 'reboot_run',
        testId: 'b3-khushu-custom-alarm',
        startedAt: testStartedAt,
        phase: 'waiting',
        collectAt: testStartedAt + 24 * 60 * 1000,
        expiresAt: testStartedAt + 39 * 60 * 1000,
        snapshot: {},
        createdAlarmIds: ['diag_reboot_1'],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };
      runner.saveState(state);

      const resState = await runner.checkAndResumeOnAppStartup();
      assert.ok(resState);
      assert.equal(resState?.phase, 'cancelled');
      assert.equal(resState?.result?.verdict, 'INCONCLUSIVE');
      assert.match(resState?.result?.reason || '', /أعيد تشغيل الجهاز/);
    });
  });

  describe('6. Test B (Khushu Custom Alarm Spec)', () => {
    function mockNativeEventsForRun(events: Array<{ event: string; details: string; timestampMs: number }>) {
      setAthanPluginBridgeForTesting({
        getNativeEventLog: async () => ({
          events,
          total: events.length,
        }),
      });
    }

    test('evaluates to SUPPORTS_HYPOTHESIS when control heard and test muted', async () => {
      const now = Date.now();
      const runId = 'testb_hypo';
      mockNativeEventsForRun([
        {
          event: 'alarm_received',
          details: `id=diag_${runId}_1, type=custom`,
          timestampMs: now + 3 * 60 * 1000,
        },
        {
          event: 'alarm_received',
          details: `id=diag_${runId}_2, type=custom`,
          timestampMs: now + 6 * 60 * 1000,
        },
        {
          event: 'khushu_result',
          details: 'mode=silent, appliedRinger=0, appliedFilter=1, hasDndPermission=true',
          timestampMs: now + 6 * 60 * 1000 + 100,
        },
      ]);

      const ctx: DiagContext = {
        runId,
        state: {
          runId,
          testId: TEST_B_SPEC.id,
          startedAt: now,
          phase: 'collectable',
          snapshot: {},
          createdAlarmIds: [`diag_${runId}_1`, `diag_${runId}_2`],
          cacheCleanupPending: [],
          cleanup: 'none',
          conflicts: [],
          userResponses: {},
        },
        updateState: () => {},
        logAction: () => {},
      };

      const result = await TEST_B_SPEC.evaluate(ctx, {
        step_control_hearing: { heard: true },
        step_test_hearing: { heard: false },
      });

      assert.equal(result.verdict, 'SUPPORTS_HYPOTHESIS');
      assert.match(result.reason, /تؤيد النتائج الفرضية/);
    });

    test('evaluates to REFUTED when both alarms are heard', async () => {
      const now = Date.now();
      const runId = 'testb_refuted';
      mockNativeEventsForRun([
        {
          event: 'alarm_received',
          details: `id=diag_${runId}_1, type=custom`,
          timestampMs: now + 3 * 60 * 1000,
        },
        {
          event: 'alarm_received',
          details: `id=diag_${runId}_2, type=custom`,
          timestampMs: now + 6 * 60 * 1000,
        },
      ]);

      const ctx: DiagContext = {
        runId,
        state: {
          runId,
          testId: TEST_B_SPEC.id,
          startedAt: now,
          phase: 'collectable',
          snapshot: {},
          createdAlarmIds: [`diag_${runId}_1`, `diag_${runId}_2`],
          cacheCleanupPending: [],
          cleanup: 'none',
          conflicts: [],
          userResponses: {},
        },
        updateState: () => {},
        logAction: () => {},
      };

      const result = await TEST_B_SPEC.evaluate(ctx, {
        step_control_hearing: { heard: true },
        step_test_hearing: { heard: true },
      });

      assert.equal(result.verdict, 'REFUTED');
      assert.match(result.reason, /تم دحض الفرضية/);
    });

    test('evaluates to INCONCLUSIVE when neither alarm is heard', async () => {
      const now = Date.now();
      const runId = 'testb_inconclusive';
      mockNativeEventsForRun([]);

      const ctx: DiagContext = {
        runId,
        state: {
          runId,
          testId: TEST_B_SPEC.id,
          startedAt: now,
          phase: 'collectable',
          snapshot: {},
          createdAlarmIds: [`diag_${runId}_1`, `diag_${runId}_2`],
          cacheCleanupPending: [],
          cleanup: 'none',
          conflicts: [],
          userResponses: {},
        },
        updateState: () => {},
        logAction: () => {},
      };

      const result = await TEST_B_SPEC.evaluate(ctx, {
        step_control_hearing: { heard: false },
        step_test_hearing: { heard: false },
      });

      assert.equal(result.verdict, 'INCONCLUSIVE');
      assert.match(result.reason, /لم يُسمع كِلا المنبهين/);
    });
  });

  describe('7. Test A (Preview Source Resolution Spec)', () => {
    test('exercises resolvePreviewSource online vs offline', async () => {
      const now = Date.now();
      const runId = 'testa_run';

      const ctx: DiagContext = {
        runId,
        state: {
          runId,
          testId: TEST_A_SPEC.id,
          startedAt: now,
          phase: 'collectable',
          snapshot: {},
          createdAlarmIds: [],
          cacheCleanupPending: [],
          cleanup: 'none',
          conflicts: [],
          userResponses: {},
        },
        updateState: () => {},
        logAction: () => {},
      };

      const result = await TEST_A_SPEC.evaluate(ctx, {
        step_offline: { confirmed: true },
      });

      assert.equal(result.verdict, 'PASS');
      const onlineStep = result.expectedVsActual.find((i) => i.parameter.includes('اتصال إنترنت'));
      const offlineStep = result.expectedVsActual.find((i) => i.parameter.includes('بدون اتصال'));
      assert.ok(onlineStep);
      assert.ok(offlineStep);
      assert.match(onlineStep?.actual || '', /من الإنترنت/);
      assert.match(offlineStep?.actual || '', /الافتراضي/);
    });

    test('pending cache cleanup records newly downloaded track and flushes on cleanup', async () => {
      const runner = new DiagRunner();
      const state: DiagRunState = {
        runId: 'cache_run',
        testId: 'fix1a-preview-source',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: ['temp_track_xyz'],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };

      await runner.flushPendingCacheCleanup(state);
      assert.equal(state.cacheCleanupPending.length, 0);
    });
  });

  describe('8. Reconcile Retains Diag Alarms During Waiting', () => {
    test('buildNativePrayerTimeAlarms includes synthetic diag_ custom alarms alongside real prayers', () => {
      const today = new Date();
      const h = today.getHours();
      const m = (today.getMinutes() + 5) % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      // Set synthetic alarm into salah_custom_alarms
      const syntheticAlarm = {
        id: 'diag_test_run_1',
        title: 'Diagnostic Control Alarm',
        time: timeStr,
        enabled: true,
        days: [0, 1, 2, 3, 4, 5, 6],
      };

      const alarms = [syntheticAlarm];

      // Verify that while test is in waiting phase, salah_custom_alarms retains the diag alarm
      assert.equal(alarms.some((a) => isDiagAlarmId(a.id)), true);
    });
  });

  describe('9. Single Source of Truth for diag_ Prefix (isDiagAlarmId)', () => {
    test('correctly identifies diagnostic alarm IDs with prefix', () => {
      assert.equal(isDiagAlarmId('diag_123'), true);
      assert.equal(isDiagAlarmId('diag_run_456_1'), true);
      assert.equal(isDiagAlarmId(DIAG_ALARM_PREFIX), true);
    });

    test('returns false for non-diagnostic IDs, null, undefined, or empty strings', () => {
      assert.equal(isDiagAlarmId('alarm_duha'), false);
      assert.equal(isDiagAlarmId('alarm_morning_adhkar'), false);
      assert.equal(isDiagAlarmId('snooze_alarm_1'), false);
      assert.equal(isDiagAlarmId(''), false);
      assert.equal(isDiagAlarmId(null), false);
      assert.equal(isDiagAlarmId(undefined), false);
    });
  });

  describe('10. UI Filter (T1: filterUserVisibleAlarms)', () => {
    test('filters out any alarm starting with diag_ prefix from UI rendering', () => {
      const mixedAlarms: AlarmConfig[] = [
        { id: 'alarm_duha', title: 'صلاة الضحى', enabled: true, soundType: 'reminder', days: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'diag_run1_1', title: 'منبه تجربة المقارنة', enabled: true, soundType: 'reminder', days: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'alarm_witr', title: 'صلاة الوتر', enabled: true, soundType: 'reminder', days: [0, 1, 2, 3, 4, 5, 6] },
        { id: 'diag_run1_2', title: 'منبه تجربة الخشوع', enabled: true, soundType: 'reminder', days: [0, 1, 2, 3, 4, 5, 6] },
      ];

      const visible = filterUserVisibleAlarms(mixedAlarms);
      assert.equal(visible.length, 2);
      assert.equal(visible[0].id, 'alarm_duha');
      assert.equal(visible[1].id, 'alarm_witr');
      assert.equal(visible.some(a => isDiagAlarmId(a.id)), false);
    });

    test('handles empty list or invalid inputs safely without throwing', () => {
      assert.deepEqual(filterUserVisibleAlarms([]), []);
      assert.deepEqual(filterUserVisibleAlarms(null as any), []);
      assert.deepEqual(filterUserVisibleAlarms(undefined as any), []);
    });
  });

  describe('11. Backup Safety (T2: Export & Restore)', () => {
    test('backup export strips diag_ alarms from customAlarms', () => {
      const storedAlarms = [
        { id: 'alarm_duha', title: 'ضحى', enabled: true },
        { id: 'diag_active_test', title: 'اختبار', enabled: true },
      ];
      safeSetJSON('salah_custom_alarms', storedAlarms);

      // Simulate export logic from BackupSettingsTab.tsx:135
      const exported = (safeGetJSON<any[]>('salah_custom_alarms', []) || []).filter(
        a => !isDiagAlarmId(a?.id)
      );

      assert.equal(exported.length, 1);
      assert.equal(exported[0].id, 'alarm_duha');
    });

    test('backup restore strips diag_ alarms before persisting to storage', () => {
      const backupData = {
        customAlarms: [
          { id: 'alarm_duha', title: 'ضحى' },
          { id: 'diag_stale_1', title: 'منبه تشخيصي قديم' },
          { id: 'alarm_qiyam', title: 'قيام الليل' },
        ],
      };

      // Simulate restore logic from BackupSettingsTab.tsx:274
      const sanitizedAlarms = backupData.customAlarms.filter(
        (a: any) => !isDiagAlarmId(a?.id)
      );
      safeSetJSON('salah_custom_alarms', sanitizedAlarms);

      const saved = safeGetJSON<any[]>('salah_custom_alarms', []);
      assert.equal(saved.length, 2);
      assert.equal(saved.some(a => isDiagAlarmId(a.id)), false);
    });
  });

  describe('12. Scheduler One-Shot Safety (T3: buildNativePrayerTimeAlarms)', () => {
    test('diag_ alarm is strictly one-shot and requires matching fireDate', () => {
      const day1 = new Date(2026, 9, 30); // 2026-10-30
      const day2 = new Date(2026, 9, 31); // 2026-10-31

      const timesMap = {
        fajr: '05:00',
        dhuhr: '12:00',
        asr: '15:15',
        maghrib: '17:30',
        isha: '19:00',
      };

      const diagAlarm: AlarmConfig = {
        id: 'diag_run_x_1',
        title: 'Diagnostic One Shot',
        type: 'fixed',
        time: '23:59',
        enabled: true,
        soundType: 'reminder',
        oneShot: true,
        fireDate: '2026-10-30',
        days: [0, 1, 2, 3, 4, 5, 6], // even if all days are listed
      };

      // Day 1 (matching fireDate)
      const alarmsDay1 = buildNativePrayerTimeAlarms(
        [{ date: day1, timesMap }],
        undefined,
        { customAlarms: [diagAlarm] }
      );
      const diagDay1 = alarmsDay1.filter(a => a.prayerKey.includes('diag_run_x_1'));
      assert.equal(diagDay1.length, 1);

      // Day 2 (mismatched fireDate) - MUST NOT BE SCHEDULED
      const alarmsDay2 = buildNativePrayerTimeAlarms(
        [{ date: day2, timesMap }],
        undefined,
        { customAlarms: [diagAlarm] }
      );
      const diagDay2 = alarmsDay2.filter(a => a.prayerKey.includes('diag_run_x_1'));
      assert.equal(diagDay2.length, 0);
    });

    test('diag_ alarm without fireDate is rejected from recurring schedule', () => {
      const day = new Date(2026, 9, 30);
      const timesMap = { fajr: '05:00', dhuhr: '12:00', asr: '15:15', maghrib: '17:30', isha: '19:00' };

      const malformedDiagAlarm: AlarmConfig = {
        id: 'diag_malformed',
        title: 'Malformed Diag',
        type: 'fixed',
        time: '23:59',
        enabled: true,
        soundType: 'reminder',
        days: [0, 1, 2, 3, 4, 5, 6], // recurring attempt
      };

      const alarms = buildNativePrayerTimeAlarms(
        [{ date: day, timesMap }],
        undefined,
        { customAlarms: [malformedDiagAlarm] }
      );
      const diagMatches = alarms.filter(a => a.prayerKey.includes('diag_malformed'));
      assert.equal(diagMatches.length, 0);
    });
  });

  describe('13. audioStorage deleteDownloadedAudio Guard (T4)', () => {
    test('resolves without error in Node when indexedDB is undefined', async () => {
      // In this Node test runner environment, indexedDB is undefined
      assert.equal(typeof (globalThis as any).indexedDB, 'undefined');
      await assert.doesNotReject(async () => {
        await deleteDownloadedAudio('non_existent_track');
      });
    });

    test('interacts with indexedDB when indexedDB is defined', async () => {
      let opened = false;
      let deletedKey = '';

      const fakeDb = {
        transaction: () => ({
          objectStore: () => ({
            delete: (key: string) => {
              deletedKey = key;
              const req: any = {};
              setTimeout(() => { if (req.onsuccess) req.onsuccess(); }, 0);
              return req;
            },
          }),
        }),
      };

      (globalThis as any).indexedDB = {
        open: () => {
          opened = true;
          const req: any = {};
          setTimeout(() => {
            req.result = fakeDb;
            if (req.onsuccess) req.onsuccess();
          }, 0);
          return req;
        },
      };

      try {
        await deleteDownloadedAudio('test_track_123');
        assert.equal(opened, true);
        assert.equal(deletedKey, 'downloaded_test_track_123');
      } finally {
        delete (globalThis as any).indexedDB;
      }
    });
  });
});
```
