# PHASE 1 REVIEW BUNDLE

Generated on: 2026-10-30T11:54:09.198Z
Target Branch: Wip/commit3-athan-master-toggle

---

## A. Full file contents

### 1. src/diagnostics/tests/diagRunner.ts (498 lines)
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
          (a) => !state.createdAlarmIds.includes(a.id) && !a.id.startsWith('diag_')
        );
        safeSetJSON('salah_custom_alarms', filtered);
        restoredKeys.push(key);
      }
    }

    // Cancel synthetic native alarms by exact ID first, then sweep prefix
    for (const id of state.createdAlarmIds) {
      await cancelNativeAlarm({ alarmId: id }).catch(() => {});
    }
    await cancelNativeAlarm({ alarmId: 'diag_' }).catch(() => {});

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

### 2. src/diagnostics/tests/diagTypes.ts (100 lines)
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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

### 3. src/diagnostics/tests/specs/testA_previewSource.ts (185 lines)
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

### 4. src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts (267 lines)
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
      title: 'سماع منبه الاختبار (Alarm 2 - مع تفعيل الخشوع)',
      description: 'هل سمعت صوت نغمة التنبيه الخاصة بمنبه الاختبار الثاني (بعد 6 دقائق من بدء الاختبار)؟',
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

    const id1 = `diag_${ctx.runId}_1`;
    const id2 = `diag_${ctx.runId}_2`;

    const d1 = new Date(alarm1Time);
    const d2 = new Date(alarm2Time);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr1 = `${pad(d1.getHours())}:${pad(d1.getMinutes())}`;
    const timeStr2 = `${pad(d2.getHours())}:${pad(d2.getMinutes())}`;

    // Synthetic Alarm 1: Control (no Khushu)
    const controlAlarm: AlarmConfig = {
      id: id1,
      title: 'منبه تجربة المقارنة (Control)',
      type: 'fixed',
      time: timeStr1,
      enabled: true,
      soundType: 'reminder',
      notifyMode: 'both',
      autoKhushu: false,
      days: [d1.getDay()],
    };

    // Synthetic Alarm 2: Test (with Khushu)
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
      days: [d2.getDay()],
    };

    // Safely inject both synthetic alarms into salah_custom_alarms
    const currentAlarms = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);
    const updated = [
      ...currentAlarms.filter((a) => !a.id.startsWith('diag_')),
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
    const id1 = `diag_${ctx.runId}_1`;
    const id2 = `diag_${ctx.runId}_2`;

    // Fetch native event log
    const nativeLogs = await getNativeEventLog(100).catch(() => []);
    const evidenceList: DiagEvidenceItem[] = [];
    const expectedVsActual: DiagExpectedVsActualItem[] = [];

    // Filter events belonging to this run
    let controlReceived = false;
    let testReceived = false;
    let khushuMuteInfo = evaluateMuteStateFromDetails('');

    for (const evt of nativeLogs) {
      const details = evt.details || '';
      if (details.includes(id1)) {
        controlReceived = true;
        evidenceList.push({
          alarmId: id1,
          timestampMs: evt.timestampMs,
          evidence: 'ALARM_RECEIVED',
          details: `وصول منبه المقارنة إلى المستقبل (AthanAlarmReceiver): ${evt.event} - ${details}`,
        });
      }
      if (details.includes(id2)) {
        testReceived = true;
        evidenceList.push({
          alarmId: id2,
          timestampMs: evt.timestampMs,
          evidence: 'ALARM_RECEIVED',
          details: `وصول منبه الخشوع إلى المستقبل (AthanAlarmReceiver): ${evt.event} - ${details}`,
        });
      }
      if (evt.event === 'khushu_result' && (details.includes('appliedRinger') || details.includes('mode='))) {
        khushuMuteInfo = evaluateMuteStateFromDetails(details);
        evidenceList.push({
          alarmId: id2,
          timestampMs: evt.timestampMs,
          evidence: 'ALARM_RECEIVED',
          details: `حالة الكتم بعد تفعيل الخشوع: ${khushuMuteInfo.description}`,
        });
      }
    }

    const hearingCheck = userResponses['hearing_check'];
    const controlHeard = hearingCheck
      ? hearingCheck.controlHeard === true
      : userResponses['step_control_hearing'] === true;
    const testHeard = hearingCheck
      ? hearingCheck.testHeard === true
      : userResponses['step_test_hearing'] === true;

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
      parameter: 'حالة كتم النظام (Mute State Telemetry)',
      expected: 'ringerMode=0 أو 1 أو DND=1',
      actual: khushuMuteInfo.description,
      status: khushuMuteInfo.isMuted ? 'MATCH' : 'UNMEASURED',
    });

    // Apply strict verdict matrix
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
    } else if (controlHeard && testHeard) {
      verdict = 'REFUTED';
      reason = 'سُمع صوت المنبه المخصص الثاني بوضوح رغم تفعيل وضع الخشوع (الفرضية غير صحيحة أو الصوت صدر قبل الكتم).';
    } else if (controlHeard && !testHeard && khushuMuteInfo.isMuted) {
      verdict = 'SUPPORTS_HYPOTHESIS';
      reason = `تم تأكيد الفرضية (B3): سُمع منبه المقارنة ولم يُسمع منبه الخشوع، مع توثيق كتم الصوت بالنظام (${khushuMuteInfo.description}).`;
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
المنبهات المخصصة تعمل عبر قناة إشعارات أندرويد وتصدر الصوت عبر النظام، ولذلك لا توجد إشارة تقنية برمجية مباشرة لاكتمال الصوت (مثل مشغل الأذان الكامل). الحكم اعتمد على تلاقي الأدلة: وصول الإشعار + كتم رنين النظام + شهادة السماع الحقيقية.
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

### 5. src/components/settings/adhan/AthanDiagnosticsSection.tsx (1281 lines)
```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileAudio,
  Info,
  Clock,
  AlertTriangle,
  Battery,
  BellRing,
  ShieldAlert,
  ListOrdered,
  Copy,
  Check,
  FileText,
  ScrollText,
  FlaskConical,
  Play,
  Square,
  CheckSquare,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { resolveMuezzinId } from '../../../utils/muezzinResolver';
import {
  getNativeAthanFiles,
  getLastAthanPlay,
  getAlarmDiagnostics,
  getNativeEventLog,
  LastAthanPlayRecord,
  AlarmDiagnosticsResult,
  NativeLogEvent,
  groupScheduledAlarmsByType,
} from '../../../services/athanAlarmPlugin';
import { toArabicNumbers } from '../../../utils/hijri';
import { diagRunnerInstance } from '../../../diagnostics/tests/diagRunner';
import { TEST_A_SPEC } from '../../../diagnostics/tests/specs/testA_previewSource';
import { TEST_B_SPEC } from '../../../diagnostics/tests/specs/testB_khushuCustomAlarm';
import { DiagRunState, DiagResult } from '../../../diagnostics/tests/diagTypes';
import { safeGetJSON } from '../../../utils/storage';
import { AlarmConfig } from '../../../types';

interface NativeFileInfo {
  path: string;
  exists: boolean;
  sizeBytes: number;
}

const PRAYERS_LIST = [
  { key: 'fajr', label: 'الفجر', prayerName: 'Fajr' },
  { key: 'dhuhr', label: 'الظهر', prayerName: 'Dhuhr' },
  { key: 'asr', label: 'العصر', prayerName: 'Asr' },
  { key: 'maghrib', label: 'المغرب', prayerName: 'Maghrib' },
  { key: 'isha', label: 'العشاء', prayerName: 'Isha' },
  { key: 'general', label: 'العام (الافتراضي)', prayerName: 'general' },
];

export interface AthanDiagnosticsSectionProps {
  setToastMessage?: (msg: string | null) => void;
}

export const AthanDiagnosticsSection: React.FC<AthanDiagnosticsSectionProps> = ({ setToastMessage }) => {
  const [loading, setLoading] = useState(false);
  const [nativeFiles, setNativeFiles] = useState<Record<string, NativeFileInfo>>({});
  const [lastPlay, setLastPlay] = useState<LastAthanPlayRecord | null>(null);
  const [diagnostics, setDiagnostics] = useState<AlarmDiagnosticsResult | null>(null);
  const [nativeLogs, setNativeLogs] = useState<NativeLogEvent[]>([]);
  const [copiedType, setCopiedType] = useState<'none' | 'all' | 'events' | 'nativeLogs'>('none');

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const [files, playRecord, diag, logs] = await Promise.all([
        getNativeAthanFiles(),
        getLastAthanPlay(),
        getAlarmDiagnostics(),
        getNativeEventLog(100),
      ]);
      if (files) {
        setNativeFiles(files);
      }
      setLastPlay(playRecord);
      if (diag) {
        setDiagnostics(diag);
        if (diag.nativeEvents && diag.nativeEvents.length > 0) {
          setNativeLogs(diag.nativeEvents);
        } else if (logs) {
          setNativeLogs(logs);
        }
      } else if (logs) {
        setNativeLogs(logs);
      }
    } catch (err) {
      console.warn('[AthanDiagnostics] Error fetching diagnostics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const [testsDevMode, setTestsDevMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('salah_diag_tests_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [runnerState, setRunnerState] = useState<DiagRunState | null>(() => diagRunnerInstance.getCurrentState());
  const [hearingAnswers, setHearingAnswers] = useState<{ controlHeard: boolean; testHeard: boolean }>({
    controlHeard: true,
    testHeard: false,
  });
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [guardError, setGuardError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    diagRunnerInstance.registerSpec(TEST_A_SPEC);
    diagRunnerInstance.registerSpec(TEST_B_SPEC);
    diagRunnerInstance.checkAndResumeOnAppStartup();

    const unsubscribe = diagRunnerInstance.subscribe((st) => {
      setRunnerState(st ? { ...st } : null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (runnerState?.phase !== 'waiting' || !runnerState.collectAt) {
      setSecondsRemaining(null);
      return;
    }

    const tick = () => {
      const rem = Math.max(0, Math.ceil((runnerState.collectAt! - Date.now()) / 1000));
      setSecondsRemaining(rem);
      if (rem === 0) {
        diagRunnerInstance.checkAndResumeOnAppStartup();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [runnerState?.phase, runnerState?.collectAt]);

  const toggleDevMode = () => {
    const next = !testsDevMode;
    setTestsDevMode(next);
    try {
      localStorage.setItem('salah_diag_tests_enabled', String(next));
    } catch (_e) {}
  };

  const handleStartTest = async (specId: string) => {
    setGuardError(null);
    setIsActionBusy(true);
    try {
      const spec = diagRunnerInstance.getSpec(specId);
      if (!spec) {
        setGuardError('الاختبار غير مسجل في النظام.');
        return;
      }

      const scheduled = diagnostics?.scheduledAlarms || [];
      const athanTimes = scheduled.map((a) => ({
        name: a.prayerName,
        timeMs: a.timeMs,
      }));
      const customAlarms = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);

      const res = await diagRunnerInstance.startTest(spec, {
        athanTimes,
        customAlarms,
      });

      if (!res.success) {
        setGuardError(res.error || 'فشل بدء الاختبار بسبب حماية الصلاة أو خطأ في التهيئة.');
      }
    } catch (err: any) {
      setGuardError(err?.message || 'حدث خطأ غير متوقع أثناء تشغيل الاختبار.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleSubmitHearing = async () => {
    setIsActionBusy(true);
    try {
      await diagRunnerInstance.submitUserAction({
        hearing_check: hearingAnswers,
      });
      fetchDiagnostics();
    } catch (err: any) {
      setGuardError(err?.message || 'فشل إرسال نتائج السماع.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleCancelTest = async () => {
    setIsActionBusy(true);
    try {
      await diagRunnerInstance.cancelTest('إلغاء يدوي من واجهة المستخدم');
      fetchDiagnostics();
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleResetTest = async () => {
    await diagRunnerInstance.resetState();
    fetchDiagnostics();
  };

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '٠ بايت';
    if (bytes >= 1024 * 1024) {
      return `${toArabicNumbers((bytes / (1024 * 1024)).toFixed(2))} ميجابايت`;
    }
    return `${toArabicNumbers(Math.round(bytes / 1024))} كيلوبايت`;
  };

  const formatSource = (source?: string): string => {
    switch (source) {
      case 'per-prayer':
        return 'مخصص لكل صلاة (per-prayer)';
      case 'fajr':
        return 'أذان الفجر (fajr)';
      case 'general':
        return 'المؤذن العام (general)';
      case 'raw':
        return 'الملف الافتراضي المدمج (raw)';
      default:
        return source || 'غير محدد';
    }
  };

  const formatTimestamp = (ms?: number): string => {
    if (!ms || ms <= 0) return 'غير متوفر';
    try {
      const d = new Date(ms);
      return toArabicNumbers(
        d.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' - ' + d.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    } catch (_e) {
      return String(ms);
    }
  };

  const formatStandbyBucket = (bucket?: number): string => {
    switch (bucket) {
      case 10:
        return 'النشط (Active - 10)';
      case 20:
        return 'مجموعة العمل (Working Set - 20)';
      case 30:
        return 'متكرر (Frequent - 30)';
      case 40:
        return 'نادر (Rare - 40)';
      case 45:
        return 'مقيّد بشدة (Restricted - 45)';
      default:
        return bucket !== undefined && bucket >= 0 ? `فئة (${bucket})` : 'غير محدد / قياسي';
    }
  };

  const hasBatteryOrExactAlarmIssue = Boolean(
    diagnostics &&
    (!diagnostics.isIgnoringBatteryOptimizations || !diagnostics.canScheduleExactAlarms)
  );

  const copyToClipboard = async (text: string, type: 'all' | 'events' | 'nativeLogs') => {
    let success = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch (_e) {
      success = false;
    }

    if (!success && typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (_e2) {
        success = false;
      }
    }

    if (success) {
      setCopiedType(type);
      if (setToastMessage) {
        setToastMessage(
          type === 'all'
            ? 'تم نسخ تقرير التشخيص الشامل بنجاح ✓'
            : type === 'events'
            ? 'تم نسخ سجل إطلاق التنبيهات بنجاح ✓'
            : 'تم نسخ سجل الأحداث الأصلية بنجاح ✓'
        );
      }
      setTimeout(() => setCopiedType('none'), 3000);
    }
  };

  const getEventBadgeClass = (eventName: string): string => {
    switch (eventName) {
      case 'reconcile':
        return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'fire_received':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'service_start':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'service_stop':
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
      case 'boot_restore':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'khushu_attempt':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'khushu_result':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'alarm_cancel':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'package_replaced':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'schedule_failed':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  };

  const generateNativeLogsText = (): string => {
    const list = (diagnostics?.nativeEvents && diagnostics.nativeEvents.length > 0)
      ? diagnostics.nativeEvents
      : nativeLogs;
    if (!list || list.length === 0) {
      return 'سجل الأحداث الأصلية للنظام (Native Event Log): لا توجد أحداث مسجلة بعد.';
    }
    const lines = [
      `=== سجل الأحداث الأصلية للنظام (Native Event Log - Ring Buffer) ===`,
      `تاريخ الاستخراج: ${new Date().toLocaleString('ar-EG')}`,
      `إجمالي الأحداث المسجلة: ${list.length}`,
      `--------------------------------------------------`,
    ];
    list.forEach((evt, idx) => {
      const timeStr = formatTimestamp(evt.timestampMs);
      lines.push(
        `[${idx + 1}] ${timeStr} | الحدث: ${evt.event}`,
        `   التفاصيل: ${evt.details || '—'}`
      );
      if (evt.error) {
        lines.push(`   الخطأ: ${evt.error}`);
      }
      lines.push(`--------------------------------------------------`);
    });
    return lines.join('\n');
  };

  const generateEventsText = (): string => {
    if (!diagnostics?.fireEvents || diagnostics.fireEvents.length === 0) {
      return 'سجل إطلاق التنبيهات (Fire Events): لا توجد أحداث مسجلة بعد.';
    }
    const lines = [
      `=== سجل إطلاق تنبيهات الأذان (Athan Fire Events Log) ===`,
      `تاريخ الاستخراج: ${new Date().toLocaleString('ar-EG')}`,
      `إجمالي الأحداث المسجلة: ${diagnostics.fireEvents.length}`,
      `--------------------------------------------------`,
    ];
    diagnostics.fireEvents.forEach((evt, idx) => {
      const timeStr = formatTimestamp(evt.timestampMs);
      const decisionArabic = evt.decision === 'played' ? 'تم التشغيل (PLAYED)' : 'تم التخطي (SKIPPED)';
      lines.push(
        `[${idx + 1}] ${timeStr} | صلاة: ${evt.prayerName || evt.prayerKey} (النوع: ${evt.alarmType})`,
        `   القرار: ${decisionArabic}`,
        `   السبب: ${evt.reason}`,
        `--------------------------------------------------`
      );
    });
    return lines.join('\n');
  };

  const generateFullReportText = (): string => {
    const lines = [
      `==================================================`,
      `تقرير تشخيص أذان هِمَّتِي الشامل (Hemmaty Athan Diagnostics)`,
      `التاريخ والوقت: ${new Date().toLocaleString('ar-EG')} (${new Date().toISOString()})`,
      `==================================================`,
      ``,
      `[1] حالة النظام والبطارية (Device & Battery Health):`,
      `• استثناء تحسين استهلاك البطارية: ${diagnostics?.isIgnoringBatteryOptimizations ? 'مستثنى (آمن - Unrestricted)' : 'غير مستثنى (معرض للتجميد والسكون - Optimized)'}`,
      `• إذن المنبهات الدقيقة: ${diagnostics?.canScheduleExactAlarms ? 'ممنوح (Granted)' : 'مفقود (Denied)'}`,
      `• فئة الاستعداد للتطبيق: ${formatStandbyBucket(diagnostics?.standbyBucket)}`,
      `• أقرب منبه AlarmClock مسجل بالنظام: ${diagnostics?.nextAlarmClockMs ? formatTimestamp(diagnostics.nextAlarmClockMs) : 'لا يوجد منبه AlarmClock مسجل'}`,
      ``,
      `[2] سجل إطلاق التنبيهات الأخيرة (Fire Events Log - ${diagnostics?.fireEvents?.length || 0} حدث):`,
    ];

    if (diagnostics?.fireEvents && diagnostics.fireEvents.length > 0) {
      diagnostics.fireEvents.forEach((evt, idx) => {
        lines.push(
          `  ${idx + 1}. [${formatTimestamp(evt.timestampMs)}] ${evt.prayerName || evt.prayerKey} (${evt.alarmType}) - القرار: ${evt.decision} - السبب: ${evt.reason}`
        );
      });
    } else {
      lines.push(`  (لم يتم تسجيل أي حدث إطلاق بعد)`);
    }

    const alarmCounts = groupScheduledAlarmsByType(diagnostics?.savedAlarms);
    lines.push(
      ``,
      `[3] المسجل في التطبيق (ليس بالضرورة مسجلًا في النظام) - الإجمالي: ${alarmCounts.total} منبه:`,
      `• أذان (athan): ${alarmCounts.athan}`,
      `• تنبيه مسبق (prealert): ${alarmCounts.prealert}`,
      `• تنبيه بعدي (postalert): ${alarmCounts.postalert}`,
      `• خشوع (khushu): ${alarmCounts.khushu}`,
      `• منبه مخصص (custom): ${alarmCounts.custom}`,
      `• أخرى (other): ${alarmCounts.other}`,
      ``,
      `تفاصيل التنبيهات المسجلة في التطبيق (عينة من أول 15 منبه):`
    );

    if (diagnostics?.savedAlarms && diagnostics.savedAlarms.length > 0) {
      diagnostics.savedAlarms.slice(0, 15).forEach((alarm, idx) => {
        lines.push(
          `  ${idx + 1}. ${alarm.prayerName || alarm.prayerKey} (${alarm.alarmType}) - الوقت: ${formatTimestamp(alarm.timeMs)} - الرمز: ${alarm.requestCode} - نشط: ${alarm.isCurrentlyScheduled ? 'نعم' : 'مخزن'}`
        );
      });
    } else {
      lines.push(`  (لا توجد منبهات مسجلة حالياً)`);
    }

    lines.push(
      ``,
      `[4] سجل آخر أذان تم تشغيله:`,
      `• الصلاة: ${lastPlay?.prayer || 'غير متوفر'}`,
      `• المصدر: ${formatSource(lastPlay?.source)}`,
      `• المقطع: ${lastPlay?.track || 'غير متوفر'}`,
      `• الوقت: ${formatTimestamp(lastPlay?.timestampMs)}`,
      ``,
      `[5] سجل الأحداث الأصلية للنظام (Native Event Log - Ring Buffer):`
    );

    const list = (diagnostics?.nativeEvents && diagnostics.nativeEvents.length > 0)
      ? diagnostics.nativeEvents
      : nativeLogs;

    const latestReconcile = list.find((e) => e.event === 'reconcile');
    const osVerifiedMatch = latestReconcile?.details?.match(/os_verified=([^, ]+)/);
    if (osVerifiedMatch) {
      lines.push(`• مطابقة منبهات النظام (OS Verified): ${osVerifiedMatch[1]}`);
    }

    if (list.length > 0) {
      list.forEach((evt, idx) => {
        lines.push(
          `  ${idx + 1}. [${formatTimestamp(evt.timestampMs)}] ${evt.event} - ${evt.details}${evt.error ? ` - الخطأ: ${evt.error}` : ''}`
        );
      });
    } else {
      lines.push(`  (لم يتم تسجيل أي حدث أصلي بعد)`);
    }

    lines.push(
      ``,
      `[6] حالة ملفات المؤذنين المخزنة لكل صلاة:`
    );

    PRAYERS_LIST.forEach(({ key, label, prayerName }) => {
      const selectedId = prayerName === 'general' ? resolveMuezzinId('Dhuhr') : resolveMuezzinId(prayerName);
      const nativeInfo = nativeFiles[key];
      const exists = nativeInfo?.exists ? 'متوفر' : 'غير متوفر';
      const size = formatSize(nativeInfo?.sizeBytes || 0);
      const path = nativeInfo?.path || 'لا يوجد';
      lines.push(`• ${label}: معرف المؤذن: ${selectedId} | الحالة: ${exists} (${size}) | المسار: ${path}`);
    });

    lines.push(
      ``,
      `==================================================`
    );

    return lines.join('\n');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-5 border border-indigo-500/20 space-y-5 transition-colors duration-300">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">
            تشخيص ملفات الأذان والنظام الأصلي (Athan Diagnostics)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => copyToClipboard(generateFullReportText(), 'all')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer"
            title="نسخ تقرير التشخيص بالكامل بما فيه سجل الأحداث وحالة البطارية"
          >
            {copiedType === 'all' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>تم نسخ التقرير ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ التقرير</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={toggleDevMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              testsDevMode
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="تفعيل أو إخفاء أدوات فحص التشخيص الميداني"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{testsDevMode ? 'وضع الفحص نشط' : 'أدوات الفحص'}</span>
          </button>

          <button
            type="button"
            onClick={fetchDiagnostics}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            title="تحديث بيانات التشخيص"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Active Diagnostic Test Running Banner */}
      {runnerState && (runnerState.phase === 'waiting' || runnerState.phase === 'running' || runnerState.phase === 'collectable') && (
        <div className="p-4 bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl space-y-3 text-rose-900 dark:text-rose-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sm">
              <FlaskConical className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />
              <span>فحص تشخيصي قيد التشغيل: {diagRunnerInstance.getSpec(runnerState.testId)?.title || runnerState.testId}</span>
            </div>
            <button
              type="button"
              onClick={handleCancelTest}
              disabled={isActionBusy}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              إلغاء الاختبار وفك الحجز
            </button>
          </div>
          <div className="text-xs space-y-1">
            {runnerState.phase === 'waiting' && (
              <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <Clock className="w-4 h-4 animate-spin shrink-0" />
                <span>متبقي على إطلاق المنبهات وسؤال السماع: {secondsRemaining !== null ? `${toArabicNumbers(secondsRemaining)} ثانية` : '...'}</span>
              </p>
            )}
            {runnerState.phase === 'running' && (
              <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>جاري معالجة خطوات الفحص وتهيئة البيئة...</span>
              </p>
            )}
            {runnerState.phase === 'collectable' && (
              <p className="font-black text-emerald-600 dark:text-emerald-400">
                ✓ تم إطلاق المنبهات! يرجى الإجابة على سؤال السماع في بطاقة الفحص أدناه.
              </p>
            )}
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80">
              ملاحظة: المنبهات الأصلية وإعدادات الخشوع محفوظة في نسخة احتياطية آمنة (Snapshot) وستتم استعادتها تلقائياً عند انتهاء الفحص أو إلغائه.
            </p>
          </div>
        </div>
      )}

      {guardError && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{guardError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGuardError(null)}
            className="text-amber-700 dark:text-amber-300 hover:underline font-bold text-[11px] cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 0.5 In-App Diagnostics Test Framework (Dev Mode) */}
      {(testsDevMode || runnerState) && (
        <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-500/20 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  إطار الاختبارات التشخيصية الميدانية (Diagnostics Test Framework)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  فحص دقيق ومباشر على الجهاز للتأكد من سلوك المنبهات والخشوع وعزل التخزين المؤقت.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
              Dev Mode
            </span>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Test A Card */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Test A: عزل مصدر المعاينة (Fix 1a)
                </span>
                <span className="text-[10px] text-slate-400">فوري (Instant)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                يتحقق من مسارات الصوت (محلي / بعيد / افتراضي) عبر مسارين مستقلين للتأكد من عدم تلويث التخزين المؤقت للأذان.
              </p>
              <button
                type="button"
                onClick={() => handleStartTest('fix1a-preview-source')}
                disabled={isActionBusy || (!!runnerState && runnerState.phase !== 'reported' && runnerState.phase !== 'cancelled')}
                className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>تشغيل Test A (فحص المعاينة)</span>
              </button>
            </div>

            {/* Test B Card */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Test B: منبهات الخشوع المخصصة (B3)
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">مجدول (7 دقائق)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                يجدول منبهين متتاليين (عادي بعد 3د، وأثناء الخشوع بعد 6د)، ويتحقق من كتم الثاني وسجلات ringerMode/interruptionFilter.
              </p>
              <button
                type="button"
                onClick={() => handleStartTest('b3-khushu-custom-alarm')}
                disabled={isActionBusy || (!!runnerState && runnerState.phase !== 'reported' && runnerState.phase !== 'cancelled')}
                className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>تشغيل Test B (فحص الخشوع - 7 دقائق)</span>
              </button>
            </div>
          </div>

          {/* Interactive Hearing Questionnaire */}
          {runnerState?.phase === 'collectable' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <h5 className="text-xs font-black text-amber-900 dark:text-amber-200">
                  سؤال التحقق الميداني من السماع (User Hearing Verification):
                </h5>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="bg-white dark:bg-[#161d26] p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    1. هل سمعت صوت المنبه الأول (المنبه العادي - Control Alarm)؟
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="controlHeard"
                        checked={hearingAnswers.controlHeard === true}
                        onChange={() => setHearingAnswers((prev) => ({ ...prev, controlHeard: true }))}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">نعم (سمعت الصوت)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="controlHeard"
                        checked={hearingAnswers.controlHeard === false}
                        onChange={() => setHearingAnswers((prev) => ({ ...prev, controlHeard: false }))}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">لا (لم يصدر صوت)</span>
                    </label>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161d26] p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    2. هل سمعت صوت المنبه الثاني (المنبه أثناء الخشوع - Test Alarm)؟
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="testHeard"
                        checked={hearingAnswers.testHeard === false}
                        onChange={() => setHearingAnswers((prev) => ({ ...prev, testHeard: false }))}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">لا (تم كتم الصوت بنجاح ✓)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="testHeard"
                        checked={hearingAnswers.testHeard === true}
                        onChange={() => setHearingAnswers((prev) => ({ ...prev, testHeard: true }))}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">نعم (رن المنبه أثناء الخشوع ✕)</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmitHearing}
                disabled={isActionBusy}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                اعتماد الملاحظات وتوليد التقرير النهائي
              </button>
            </div>
          )}

          {/* Report Presentation */}
          {runnerState?.phase === 'reported' && runnerState.result && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-black text-xs ${
                      runnerState.result.verdict === 'SUPPORTS_HYPOTHESIS'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : runnerState.result.verdict === 'REFUTED'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                        : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    }`}
                  >
                    {runnerState.result.verdict === 'SUPPORTS_HYPOTHESIS' && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {runnerState.result.verdict === 'REFUTED' && <XCircle className="w-3.5 h-3.5" />}
                    {runnerState.result.verdict === 'INCONCLUSIVE' && <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>{runnerState.result.verdict}</span>
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {runnerState.result.reason}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(runnerState.result?.markdownReport || '', 'all');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ التقرير</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTest}
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto dir-ltr text-left">
                {runnerState.result.markdownReport}
              </div>
            </div>
          )}

          {/* Cancelled Banner */}
          {runnerState?.phase === 'cancelled' && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-500 shrink-0" />
                <span>
                  {runnerState.result?.reason || 'تم إلغاء الاختبار واستعادة الإعدادات الأصلية بنجاح.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetTest}
                className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold rounded-lg transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      )}

      {/* 0. Visible Warning for Battery Optimization & Exact Alarms */}
      {hasBatteryOrExactAlarmIssue && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
          <div className="flex items-center gap-2 font-black text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>تنبيه هام لأجهزة سامسونج وأندرويد الحديثة</span>
          </div>
          <p>
            {!diagnostics?.isIgnoringBatteryOptimizations && (
              <span className="block font-bold">
                • تحسين استهلاك البطارية (Battery Optimization) مفعّل للتطبيق. قد تقوم واجهة سامسونج (OneUI) بوضع التطبيق في السكون التام (Sleeping Apps) وتجميد مواقيت الأذان عند قفل الشاشة لعدة ساعات.
              </span>
            )}
            {!diagnostics?.canScheduleExactAlarms && (
              <span className="block font-bold">
                • إذن المنبهات الدقيقة (Exact Alarms) غير ممنوح. لن يتمكن النظام من إطلاق الأذان في الوقت المحدد بدقة.
              </span>
            )}
          </p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
            يرجى ضبط استهلاك البطارية على &quot;غير مقيّد&quot; (Unrestricted) في إعدادات التطبيق لضمان استيقاظ منبه الأذان في موعده دائماً.
          </p>
        </div>
      )}

      {/* 1. Device System & Battery Status */}
      {diagnostics && (
        <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Battery className="w-4 h-4 text-emerald-500" />
            <span>حالة قيود النظام والبطارية (Device & Battery Health):</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold">استثناء تحسين البطارية:</span>
              <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                diagnostics.isIgnoringBatteryOptimizations
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                  : 'text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40'
              }`}>
                {diagnostics.isIgnoringBatteryOptimizations ? 'مستثنى (آمن) ✓' : 'غير مستثنى (معرض للتجميد) ⚠️'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold">إذن المنبهات الدقيقة:</span>
              <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                diagnostics.canScheduleExactAlarms
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                  : 'text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/40'
              }`}>
                {diagnostics.canScheduleExactAlarms ? 'ممنوح ✓' : 'مفقود ✕'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold">فئة الاستعداد (Standby Bucket):</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                {formatStandbyBucket(diagnostics.standbyBucket)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold">أقرب منبه مسجل بالنظام (AlarmClock):</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                {diagnostics.nextAlarmClockMs > 0 ? formatTimestamp(diagnostics.nextAlarmClockMs) : 'لا يوجد منبه AlarmClock مسجل'}
              </span>
            </div>
            {(() => {
              const list = diagnostics.nativeEvents || nativeLogs;
              const latestReconcile = list.find((e) => e.event === 'reconcile');
              const osMatch = latestReconcile?.details?.match(/os_verified=([^, ]+)/);
              if (!osMatch) return null;
              const val = osMatch[1];
              return (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 sm:col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 font-bold">
                    مطابقة منبهات النظام (OS Verified):
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      val === 'unknown'
                        ? 'text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40'
                        : 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                    }`}
                  >
                    {val === 'unknown' ? 'غير مؤكد (unknown)' : `${val} منبه مؤكد بالنظام ✓`}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. Registered Alarms Grouped by Type - المسجل في التطبيق (ليس بالضرورة مسجلًا في النظام) */}
      {diagnostics && diagnostics.savedAlarms && (
        <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-indigo-500" />
              <span>المسجل في التطبيق (ليس بالضرورة مسجلًا في النظام)</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400">
              الإجمالي: {toArabicNumbers(groupScheduledAlarmsByType(diagnostics.savedAlarms).total)}
            </span>
          </div>

          {(() => {
            const counts = groupScheduledAlarmsByType(diagnostics.savedAlarms);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">أذان (athan)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.athan)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">مسبق (prealert)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.prealert)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">بعدي (postalert)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.postalert)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">خشوع (khushu)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.khushu)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">مخصص (custom)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.custom)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">أخرى (other)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.other)}</span>
                </div>
              </div>
            );
          })()}

          {diagnostics.savedAlarms.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 pb-0.5">عينة من التنبيهات المجدولة بالتطبيق:</div>
              {diagnostics.savedAlarms.slice(0, 10).map((alarm, idx) => (
                <div
                  key={`${alarm.requestCode}_${idx}`}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]"
                >
                  <div className="space-x-2 space-x-reverse flex items-center">
                    <span className="font-black text-slate-900 dark:text-white">
                      {alarm.prayerName || alarm.prayerKey}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                      {alarm.alarmType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                      {formatTimestamp(alarm.timeMs)}
                    </span>
                    {alarm.isCurrentlyScheduled ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">نشط ✓</span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">مخزن</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-slate-400 text-xs">
              لا توجد تنبيهات مجدولة مسجلة حالياً في الذاكرة.
            </div>
          )}
        </div>
      )}

      {/* 3. Last N Fire Events Log (from AthanAlarmReceiver) */}
      {diagnostics && diagnostics.fireEvents && (
        <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-purple-500" />
              <span>سجل إطلاق التنبيهات الأخير (Athan Fire Events Log):</span>
            </h4>
            <button
              type="button"
              onClick={() => copyToClipboard(generateEventsText(), 'events')}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-all cursor-pointer"
              title="نسخ سجل أحداث إطلاق التنبيهات فقط"
            >
              {copiedType === 'events' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">تم النسخ ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>نسخ الأحداث 📋</span>
                </>
              )}
            </button>
          </div>

          {diagnostics.fireEvents.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {diagnostics.fireEvents.map((evt, idx) => {
                const isPlayed = evt.decision === 'played';
                return (
                  <div
                    key={`${evt.timestampMs}_${idx}`}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 dark:text-white">
                          {evt.prayerName || evt.prayerKey}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 font-mono">
                          {evt.alarmType}
                        </span>
                      </div>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                        isPlayed
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                          : 'text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/40'
                      }`}>
                        {isPlayed ? 'تم التشغيل ✓' : 'تم التخطي ✕'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{formatTimestamp(evt.timestampMs)}</span>
                      <span className="font-mono text-slate-400 truncate max-w-[200px]" title={evt.reason}>
                        السبب: {evt.reason}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-slate-400 text-xs">
              لم يتم رصد أي إطلاق تنبيه من قِبل AthanAlarmReceiver حتى الآن في هذا السجل.
            </div>
          )}
        </div>
      )}

      {/* 4. Native Event Log (Ring Buffer - last 100 events) */}
      <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ScrollText className="w-4 h-4 text-emerald-500" />
            <span>
              سجل أحداث النظام الأصلي (Native Event Log - Ring Buffer):
            </span>
          </h4>
          <button
            type="button"
            onClick={() => copyToClipboard(generateNativeLogsText(), 'nativeLogs')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-all cursor-pointer"
            title="نسخ سجل أحداث النظام الأصلي"
          >
            {copiedType === 'nativeLogs' ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">تم النسخ ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>نسخ السجل 📋</span>
              </>
            )}
          </button>
        </div>

        {((diagnostics?.nativeEvents && diagnostics.nativeEvents.length > 0) || nativeLogs.length > 0) ? (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {((diagnostics?.nativeEvents && diagnostics.nativeEvents.length > 0) ? diagnostics.nativeEvents : nativeLogs).map((evt, idx) => {
              return (
                <div
                  key={`${evt.timestampMs}_${idx}`}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getEventBadgeClass(evt.event)}`}>
                        {evt.event}
                      </span>
                      {evt.event === 'reconcile' && (() => {
                        const m = evt.details?.match(/os_verified=([^, ]+)/);
                        if (!m) return null;
                        const val = m[1];
                        return (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              val === 'unknown'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/60 dark:border-amber-800/60'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-800/60'
                            }`}
                            title="مطابقة المنبهات مع نظام التشغيل OS عبر PendingIntent"
                          >
                            OS: {val}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {formatTimestamp(evt.timestampMs)}
                    </span>
                  </div>

                  {evt.details && (
                    <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all bg-white/70 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      {evt.details}
                    </div>
                  )}

                  {evt.error && (
                    <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 break-all flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0 text-rose-500" />
                      <span>{evt.error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-slate-400 text-xs">
            لم يتم تسجيل أي حدث في السجل الأصلي حتى الآن (يتم التسجيل تلقائياً عند المطابقة وإطلاق التنبيهات والخدمة والاستعادة).
          </div>
        )}
      </div>

      {/* 5. Per-Prayer Native Files Status */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <FileAudio className="w-4 h-4 text-indigo-500" />
          <span>حالة الملفات لكل صلاة (مكتبة النظام الأصلي):</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {PRAYERS_LIST.map(({ key, label, prayerName }) => {
            const selectedId = prayerName === 'general'
              ? resolveMuezzinId('Dhuhr')
              : resolveMuezzinId(prayerName);
            const nativeInfo = nativeFiles[key];
            const exists = nativeInfo?.exists ?? false;
            const size = nativeInfo?.sizeBytes ?? 0;
            const path = nativeInfo?.path || '';

            return (
              <div
                key={key}
                className="bg-white dark:bg-[#161d26] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white font-black">{label}</span>
                  <span className="flex items-center gap-1">
                    {exists ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-black text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        متوفر
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-black text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        غير مخزن محلياً
                      </span>
                    )}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                  <div className="truncate">
                    <span className="text-slate-400 dark:text-slate-500 font-sans">معرف المؤذن: </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-sans">الحجم: </span>
                    <span className="font-bold">{formatSize(size)}</span>
                  </div>
                  {path && (
                    <div className="truncate text-[10px] text-slate-400 dark:text-slate-500 dir-ltr text-right" title={path}>
                      {path}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Last-Played Athan Record */}
      <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span>سجل آخر أذان تم تشغيله (Last Played Track):</span>
        </h4>

        {lastPlay && lastPlay.hasRecord ? (
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">الصلاة المستهدفة:</span>
              <span className="font-black text-slate-900 dark:text-white">{lastPlay.prayer}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">مصدر الصوت المستخدم:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatSource(lastPlay.source)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">المقطع / الملف:</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">{lastPlay.track || 'غير معروف'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">وقت التشغيل:</span>
              <span className="font-mono text-[11px]">{formatTimestamp(lastPlay.timestampMs)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-slate-400 dark:text-slate-500 text-xs font-bold">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>لم يتم تسجيل أي تشغيل أذان حتى الآن (سيتم التوثيق تلقائياً عند حلول وقت الصلاة وتشغيل الخدمة).</span>
          </div>
        )}
      </div>
    </div>
  );
};

```

### 6. android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt (110 lines)
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

### 7. android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt (276 lines)
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
                    "mode=$mode, durationMinutes=$durationMinutes, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission, status=success"
                )
            }
            return true
        }

        fun restoreOriginalState(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
            if (!isActive) {
                Log.d(TAG, "Khushu mode was already inactive, skipping duplicate restore")
                SalahWidgetProvider.updateAllWidgets(context)
                return
            }

            val originalFilter = prefs.getInt(KEY_ORIGINAL_FILTER, NotificationManager.INTERRUPTION_FILTER_ALL)
            val originalRinger = prefs.getInt(KEY_ORIGINAL_RINGER, AudioManager.RINGER_MODE_NORMAL)

            // 1. Restore Do Not Disturb (DND) filter if permitted
            val nm = context.getSystemService(NotificationManager::class.java)
            if (nm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    if (nm.isNotificationPolicyAccessGranted) {
                        nm.setInterruptionFilter(originalFilter)
                        Log.d(TAG, "Restored interruption filter to: $originalFilter")
                    } else {
                        Log.w(TAG, "Notification policy access not granted during restore")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to restore interruption filter", e)
                }
            }

            // 2. Restore AudioManager ringer mode
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            if (audioManager != null) {
                try {
                    audioManager.ringerMode = originalRinger
                    Log.d(TAG, "Restored audio ringer mode to: $originalRinger")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to restore audio ringer mode", e)
                }
            }

            // 3. Mark inactive in prefs
            prefs.edit()
                .putBoolean(KEY_IS_ACTIVE, false)
                .putLong(KEY_ACTIVATED_AT, 0L)
                .putInt(KEY_DURATION_MINUTES, 0)
                .apply()

            cancelRestoreAlarm(context)
            Log.d(TAG, "Khushu mode successfully deactivated and marked inactive")

            // 4. Dismiss Khushu status notification
            try {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                notificationManager?.cancel(KHUSHU_NOTIFICATION_ID)
            } catch (e: Exception) {
                Log.w(TAG, "Failed cancelling Khushu notification", e)
            }

            // 5. Update Widgets
            SalahWidgetProvider.updateAllWidgets(context)
        }
    }

    override fun onReceive(context: Context, intent: Intent?) {
        Log.d(TAG, "KhushuRestoreReceiver triggered - restoring original device state")
        restoreOriginalState(context)
    }
}


```

### 8. android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt (Changed Functions & Callers)

#### 8.1 createAthanIntent (Lines 130-171)
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

```

#### 8.2 getAthanPendingIntent (Lines 172-190)
```kotlin
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

#### 8.3 reconcileAlarmsInternalStatic (Lines 240-397)
```kotlin
        @JvmStatic
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
                    Log.e(TAG, "Error scheduling 14-day alarm reqCode=$reqCode", e)
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

#### 8.4 scheduleAthanAlarms [Caller] (Lines 831-875)
```kotlin
    @PluginMethod
    fun scheduleAthanAlarms(call: PluginCall) {
        val timesArray: JSArray? = call.getArray("times")
        if (timesArray == null || timesArray.length() == 0) {
            call.reject("No times provided for scheduling")
            return
        }

        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        if (alarmManager == null) {
            call.reject("AlarmManager service not available")
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
            val ret = JSObject()
            ret.put("scheduledCount", 0)
            ret.put("addedCount", 0)
            ret.put("removedCount", 0)
            ret.put("retainedCount", 0)
            ret.put("exactAlarmPermissionMissing", true)
            call.resolve(ret)
            return
        }

        // True State Reconciliation: Diff desired vs current scheduled
        val reconcileResult = reconcileAlarmsInternalStatic(context, alarmManager, timesArray)
        val scheduledCount = (reconcileResult["total"] as? Number)?.toInt() ?: 0

        // Save calculation parameters for offline renewal
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        
        if (call.hasOption("lat")) {
            editor.putFloat("lat", call.getDouble("lat", 30.0444)?.toFloat() ?: 30.0444f)
        }
        if (call.hasOption("lng")) {
            editor.putFloat("lng", call.getDouble("lng", 31.2357)?.toFloat() ?: 31.2357f)
        }
        if (call.hasOption("calcMethod")) {
            editor.putString("calcMethod", call.getString("calcMethod", "Egypt"))
        }
        if (call.hasOption("madhab")) {
            editor.putString("madhab", call.getString("madhab", "standard"))
```

#### 8.5 reconcileAthanAlarms [Caller] (Lines 960-995)
```kotlin
    fun reconcileAthanAlarms(call: PluginCall) {
        val timesArray: JSArray? = call.getArray("times")
        if (timesArray == null) {
            call.reject("Missing 'times' parameter for reconciliation")
            return
        }

        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        if (alarmManager == null) {
            call.reject("AlarmManager service not available")
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
            val ret = JSObject()
            ret.put("scheduledCount", 0)
            ret.put("addedCount", 0)
            ret.put("removedCount", 0)
            ret.put("retainedCount", 0)
            ret.put("exactAlarmPermissionMissing", true)
            call.resolve(ret)
            return
        }

        val result = reconcileAlarmsInternalStatic(context, alarmManager, timesArray)
        val ret = JSObject()
        ret.put("scheduledCount", (result["total"] as? Number)?.toInt() ?: 0)
        ret.put("addedCount", (result["added"] as? Number)?.toInt() ?: 0)
        ret.put("removedCount", (result["removed"] as? Number)?.toInt() ?: 0)
        ret.put("retainedCount", (result["retained"] as? Number)?.toInt() ?: 0)
        ret.put("os_verified", result["os_verified"] as? String ?: "unknown")
        ret.put("exactAlarmPermissionMissing", false)
        call.resolve(ret)
    }

```

#### 8.6 getAlarmDiagnostics (Lines 1399-1508)
```kotlin
    fun getAlarmDiagnostics(call: PluginCall) {
        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        val powerManager = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
        val usageStatsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP_MR1) {
            context.getSystemService(Context.USAGE_STATS_SERVICE) as? android.app.usage.UsageStatsManager
        } else null

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val ret = JSObject()

        // 1. Saved alarms from SharedPreferences
        val rawJson = prefs.getString(KEY_SAVED_ALARMS, "[]") ?: "[]"
        val scheduledIds = prefs.getStringSet(KEY_SCHEDULED_IDS, emptySet()) ?: emptySet()
        val alarmsArray = JSArray()
        try {
            val parsedArray = JSONArray(rawJson)
            for (i in 0 until parsedArray.length()) {
                val item = parsedArray.getJSONObject(i)
                val timeMs = item.optLong("timeMs", 0L)
                val prayerKey = item.optString("prayerKey", "")
                val reqCode = getDeterministicRequestCode(prayerKey, timeMs)
                val jsItem = JSObject()
                jsItem.put("requestCode", reqCode)
                jsItem.put("prayerKey", prayerKey)
                jsItem.put("prayerName", item.optString("prayerName", ""))
                jsItem.put("timeMs", timeMs)
                jsItem.put("isFajr", item.optBoolean("isFajr", false))
                jsItem.put("alarmType", item.optString("alarmType", "athan"))
                jsItem.put("soundType", item.optString("soundType", "reminder"))
                jsItem.put("isCurrentlyScheduled", scheduledIds.contains(reqCode.toString()))
                alarmsArray.put(jsItem)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in getAlarmDiagnostics parsing saved alarms", e)
        }
        ret.put("savedAlarms", alarmsArray)

        // 2. Next system alarm clock (from AlarmManager.getNextAlarmClock)
        val nextAlarmClockMs = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            alarmManager?.nextAlarmClock?.triggerTime ?: 0L
        } else 0L
        ret.put("nextAlarmClockMs", nextAlarmClockMs)

        // 3. Fire events log
        val fireEventsJson = prefs.getString("athan_fire_events", "[]") ?: "[]"
        val fireEventsArray = JSArray()
        try {
            val parsedEvents = JSONArray(fireEventsJson)
            for (i in 0 until parsedEvents.length()) {
                val eventObj = parsedEvents.getJSONObject(i)
                val jsEvent = JSObject()
                jsEvent.put("timestampMs", eventObj.optLong("timestampMs", 0L))
                jsEvent.put("prayerName", eventObj.optString("prayerName", ""))
                jsEvent.put("prayerKey", eventObj.optString("prayerKey", ""))
                jsEvent.put("alarmType", eventObj.optString("alarmType", ""))
                jsEvent.put("decision", eventObj.optString("decision", ""))
                jsEvent.put("reason", eventObj.optString("reason", ""))
                fireEventsArray.put(jsEvent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in getAlarmDiagnostics parsing fire events", e)
        }
        ret.put("fireEvents", fireEventsArray)

        // 4. Power & Battery Optimization
        val isIgnoringBatteryOptimizations = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            powerManager?.isIgnoringBatteryOptimizations(context.packageName) ?: false
        } else true
        ret.put("isIgnoringBatteryOptimizations", isIgnoringBatteryOptimizations)

        // 5. Exact alarm permission
        val canScheduleExactAlarms = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager?.canScheduleExactAlarms() ?: false
        } else true
        ret.put("canScheduleExactAlarms", canScheduleExactAlarms)

        // 6. App standby bucket
        val standbyBucket = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            usageStatsManager?.appStandbyBucket ?: -1
        } else -1
        ret.put("standbyBucket", standbyBucket)

        // 7. Native event log (last 100 events, newest first)
        val nativeEventsArray = JSArray()
        try {
            val events = getNativeEventLogStatic(context)
            val total = events.length()
            val count = Math.min(total, 100)
            for (i in 0 until count) {
                val idx = total - 1 - i
                val obj = events.getJSONObject(idx)
                val jsObj = JSObject()
                jsObj.put("timestampMs", obj.optLong("timestampMs", 0L))
                jsObj.put("event", obj.optString("event", ""))
                jsObj.put("details", obj.optString("details", ""))
                if (obj.has("error") && !obj.isNull("error")) {
                    jsObj.put("error", obj.optString("error", ""))
                }
                nativeEventsArray.put(jsObj)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in getAlarmDiagnostics reading native events", e)
        }
        val lastBootTimestamp = prefs.getLong("last_device_boot_timestamp", 0L)
        ret.put("lastDeviceBootTimestamp", lastBootTimestamp)
        ret.put("nativeEvents", nativeEventsArray)

        call.resolve(ret)
    }
```

### 9. src/services/athanAlarmPlugin.ts (Changed Hunks)

#### 9.1 ReconcileAthanResult interface & os_verified (Lines 29-37)
```ts
export interface ReconcileAthanResult {
  scheduledCount: number;
  addedCount: number;
  removedCount: number;
  retainedCount: number;
  exactAlarmPermissionMissing?: boolean;
  os_verified?: string;
}

```

#### 9.2 AlarmDiagnosticsResult interface & lastDeviceBootTimestamp (Lines 151-161)
```ts
export interface AlarmDiagnosticsResult {
  savedAlarms: SavedNativeAlarmItem[];
  nextAlarmClockMs: number;
  fireEvents: AthanFireEventRecord[];
  isIgnoringBatteryOptimizations: boolean;
  canScheduleExactAlarms: boolean;
  standbyBucket: number;
  nativeEvents?: NativeLogEvent[];
  lastDeviceBootTimestamp?: number;
}

```

#### 9.3 Web fallback simulation os_verified return (Lines 241-248)
```ts
      return {
        scheduledCount: options.times.length,
        addedCount: options.times.length,
        removedCount: 0,
        retainedCount: 0,
        os_verified: `${Math.min(options.times.length, 20)}/${Math.min(options.times.length, 20)}`,
      };
    },
```

#### 9.4 reconcileNativeAthanAlarms export (Lines 911-923)
```ts
export async function reconcileNativeAthanAlarms(options: {
  times: PrayerTimeAlarm[];
}): Promise<ReconcileAthanResult | null> {
  const plugin = athanPluginBridgeForTesting || AthanAlarm;
  if (!plugin.reconcileAthanAlarms) return null;
  try {
    return await plugin.reconcileAthanAlarms(options);
  } catch (err) {
    console.warn('[ATHAN] SOURCE=RECONCILE [AthanAlarmPlugin] reconcileAthanAlarms error:', err);
    return null;
  }
}

```

---

## B. Honest answers

### a) Can you run `gradlew compileDebugKotlin` in this environment?
**NO.** `gradlew compileDebugKotlin` cannot run in this environment because neither Java JDK (`JAVA_HOME`) nor the Android SDK is installed in this web container (`ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH`). The Kotlin changes are uncompiled in this web sandbox; `compile_applet` and `tsc` only compile the web React/TypeScript applet.

### b) Does the custom alarms screen or any list UI filter out entries whose id starts with "diag_"?
**NOT FILTERED.** In `src/components/WorshipAlarms.tsx` line 381, `customAlarms.map(alarm => <AlarmCard ... />)` directly renders every entry in `customAlarms` without checking `!alarm.id.startsWith("diag_")`. While Test B is actively in `waiting` phase (~7 minutes), the two synthetic diagnostic alarms are visible as cards in the Worship Alarms UI.

### c) Is src/components/prayer/PrayerTimesView.tsx modified by any action in this session?
**NO.** Zero tool calls or modifications targeted `src/components/prayer/PrayerTimesView.tsx` in this session. It remains 100% untouched, exactly preserving the user's explicit instruction.

### d) Which files did you edit in this session? List them from your action history. Flag any file that is not in section A.
The complete list of files modified or created across this session:
1. `android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt` [In Section A #6]
2. `android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt` [In Section A #7]
3. `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt` [In Section A #8]
4. `src/services/athanAlarmPlugin.ts` [In Section A #9]
5. `src/diagnostics/tests/diagTypes.ts` [In Section A #2]
6. `src/diagnostics/tests/diagRunner.ts` [In Section A #1]
7. `src/diagnostics/tests/specs/testA_previewSource.ts` [In Section A #3]
8. `src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts` [In Section A #4]
9. `src/components/settings/adhan/AthanDiagnosticsSection.tsx` [In Section A #5]
10. `src/diagnostics/tests/diagRunner.test.ts` [FLAG: Not in Section A] — Created 26-case unit test suite for the runner and verdict matrix.
11. `src/utils/audioStorage.ts` [FLAG: Not in Section A] — Added `typeof indexedDB === "undefined"` safety guard in `deleteDownloadedAudio` to prevent Node test crashes.
12. `/.aistudio/artifacts/brain/a7942c4e-20bb-444d-95a7-a68fc3cf4354/implementation_plan.md` [FLAG: Not in Section A] — Plan artifact updated in Turn 1.

### e) Does any sync, backup or export path read salah_custom_alarms?
**YES.**
1. Backup Generator: `src/components/settings/BackupSettingsTab.tsx` line 134 reads `customAlarms: safeGetJSON('salah_custom_alarms', [])` when exporting the full backup JSON (and restores it at line 274).
2. Orchestration: `src/domain/notifications/UnifiedNotificationOrchestrator.ts` line 186 reads `safeGetJSON<AlarmConfig[] | null>('salah_custom_alarms', null)`.
3. Scheduler: `src/hooks/usePrayerScheduler.ts` line 60 and line 130 read `salah_custom_alarms` to build native alarms.
4. Adhkar Modal: `src/components/adhkar/AdhkarTimingModal.tsx` line 60 and line 103 read `salah_custom_alarms`.

---

## C. Known limits

1. **PrayerTimesView.tsx Invisibility Investigation:** As instructed, `PrayerTimesView.tsx` was not modified in Phase 1. The root cause analysis (toast message rendering inside `PrayerManagerHeader` while user is scrolled down, plus 3s timeout) was documented in the plan, but UI fixes remain deferred.
2. **Phase 2 Deferred:** Per instructions, Khushu start delay per prayer (using `iqamaOffsets` with [5, 30] min clamp) was excluded from Phase 1 implementation.
3. **Physical Hardware Sound Verification:** Custom alarms on Android fire via `NotificationManager.notify()`. Because Android notification sound playback in `system_server` provides no OS-level completion callback, maximum native proof is `ALARM_RECEIVED` + `khushu_result` telemetry (ringerMode / interruptionFilter) combined with user hearing check.
4. **Kotlin Compilation in AI Studio:** As verified in Question (B.a), Gradle/Kotlin compilation cannot run in this web container. Final verification of Kotlin files must occur in Android Studio or GitHub Actions CI.
5. **Custom Alarms UI Display:** Synthetic `diag_` alarms are temporarily visible in `WorshipAlarms` list during the 7-minute test window because no filter was injected into `WorshipAlarms.tsx` (preserving strict Phase 1 file boundaries).
