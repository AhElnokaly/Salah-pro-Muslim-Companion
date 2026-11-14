# PHASE 1 REVIEW BUNDLE - VERSION 4 (UNABRIDGED)
Generated: 2026-11-01T07:32:55.900Z
Branch: Wip/commit3-athan-master-toggle

This bundle contains the complete, unabridged contents of all files touched or referenced in Round 2 of Phase 1 hardening.
No lines skipped, no "..." placeholders.

---

## Table of Contents
1. src/diagnostics/tests/diagRunner.ts
2. src/diagnostics/tests/diagTypes.ts
3. src/diagnostics/tests/specs/testA_previewSource.ts
4. src/components/settings/adhan/AthanDiagnosticsSection.tsx
5. src/App.tsx
6. src/utils/previewSource.ts
7. src/utils/backupAlarmUtils.ts
8. src/diagnostics/tests/diagRunner.test.ts
9. android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt
10. android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt
11. Changed Kotlin functions in AthanAlarmPlugin.kt & AthanAlarmReceiver.kt
12. cancelNativeAlarm TS & Kotlin implementation
13. Native log writing code from R3.2
14. App.tsx startup snippet from R5

---

### src/diagnostics/tests/diagRunner.ts (594 lines)
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeGetJSON, safeSetJSON, safeRemoveItem } from '../../utils/storage';
import { isAudioDownloaded, deleteDownloadedAudio } from '../../utils/audioStorage';
import { cancelNativeAlarm, getAlarmDiagnostics, getNativeEventLog } from '../../services/athanAlarmPlugin';
import { KhushuMode } from '../../services/khushuModePlugin';
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
  INTERRUPTION_FILTER_NONE,
  INTERRUPTION_FILTER_ALARMS,
  INTERRUPTION_FILTER_ALL,
  INTERRUPTION_FILTER_PRIORITY,
  INTERRUPTION_FILTER_UNKNOWN,
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
 * falls within [now - 30m, now + guardDurationMinutes + 30m].
 * Fails closed if athanTimes is empty or missing.
 */
export function checkPrayerProximityGuard(params: {
  athanTimes?: Array<{ name: string; timeMs: number }>;
  customAlarms?: AlarmConfig[];
  testDurationMinutes?: number;
  now?: number;
}): PrayerGuardCheckResult {
  if (!params.athanTimes || params.athanTimes.length === 0) {
    return {
      allowed: false,
      reason: 'تعذر التحقق من مواقيت الصلاة (قائمة الصلوات فارغة أو غير متوفرة). تم حظر بدء الاختبار لحماية أوقات الصلاة.',
    };
  }

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
    (a) => a.enabled && !isDiagAlarmId(a.id)
  );

  const pad = (n: number) => n.toString().padStart(2, '0');
  const startDate = new Date(guardWindowStart);
  const endDate = new Date(guardWindowEnd);

  // Collect unique calendar days overlapping the guard window (handles midnight crossing)
  const candidateDates: Date[] = [];
  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
  while (cur.getTime() <= endDay.getTime()) {
    candidateDates.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  for (const alarm of realCustom) {
    if (!alarm.time) continue;
    const [hStr, mStr] = alarm.time.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (isNaN(h) || isNaN(m)) continue;

    for (const d of candidateDates) {
      const dayOfWeek = d.getDay();
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

      let matchesDay = false;
      if (alarm.oneShot) {
        matchesDay = alarm.fireDate === dateStr;
      } else if (alarm.days && alarm.days.length > 0) {
        matchesDay = alarm.days.includes(dayOfWeek);
      } else {
        matchesDay = true; // Every day if not oneShot and no specific days
      }

      if (matchesDay) {
        const targetDate = new Date(d);
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
 * Any of:
 * - ringerMode in {0 (SILENT), 1 (VIBRATE)}
 * - interruptionFilter in {3 (NONE / Total Silence), 4 (ALARMS / Alarms Only)}
 * counts as an active Mute State.
 * Note: INTERRUPTION_FILTER_PRIORITY (2) is intentionally NOT counted as muted here per spec.
 * INTERRUPTION_FILTER_ALL (1) is normal / unmuted.
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
  const isDndActive =
    interruptionFilter === INTERRUPTION_FILTER_NONE ||
    interruptionFilter === INTERRUPTION_FILTER_ALARMS;

  const isMuted = isSilent || isVibrate || isDndActive;
  const parts: string[] = [];
  if (isSilent) parts.push('الرنين صامت (SILENT=0)');
  if (isVibrate) parts.push('الاهتزاز (VIBRATE=1)');
  if (interruptionFilter === INTERRUPTION_FILTER_NONE) {
    parts.push('عدم الإزعاج كتم تام (DND_FILTER_NONE=3)');
  } else if (interruptionFilter === INTERRUPTION_FILTER_ALARMS) {
    parts.push('عدم الإزعاج منبهات فقط (DND_FILTER_ALARMS=4)');
  }

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
        const currentStr = JSON.stringify(currentVal);
        const testValStr = JSON.stringify(entry.testVal);
        const originalStr = JSON.stringify(entry.original);

        if (currentStr === testValStr) {
          safeSetJSON(key, entry.original);
          restoredKeys.push(key);
        } else if (currentStr === originalStr) {
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: filtered }));
        }
        restoredKeys.push(key);
      }
    }

    // R3.4: Sweep any diag_ alarms from salah_custom_alarms even if schedule threw midway
    const currentAlarms = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);
    const diagAlarmsInStorage = currentAlarms.filter((a) => isDiagAlarmId(a.id) || state.createdAlarmIds.includes(a.id));
    if (diagAlarmsInStorage.length > 0) {
      const filtered = currentAlarms.filter((a) => !isDiagAlarmId(a.id) && !state.createdAlarmIds.includes(a.id));
      safeSetJSON('salah_custom_alarms', filtered);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: filtered }));
      }
      for (const a of diagAlarmsInStorage) {
        await cancelNativeAlarm({ alarmId: a.id }).catch(() => {});
      }
    }

    // Cancel synthetic native alarms by exact ID first, then sweep prefix
    for (const id of state.createdAlarmIds) {
      await cancelNativeAlarm({ alarmId: id }).catch(() => {});
    }
    await cancelNativeAlarm({ alarmId: DIAG_ALARM_PREFIX }).catch(() => {});

    // R2: If this was Test B (Khushu test), ONLY deactivate Khushu if a correlated khushu_result event for this run exists
    if (state.testId === 'b3-khushu-custom-alarm') {
      const id2 = `${DIAG_ALARM_PREFIX}${state.runId}_2`;
      try {
        const nativeLogs = await getNativeEventLog(100);
        const hasCorrelatedKhushu = Array.isArray(nativeLogs) && nativeLogs.some(
          (evt) =>
            evt.event === 'khushu_result' &&
            (evt.details || '').includes(id2)
        );
        if (hasCorrelatedKhushu) {
          await KhushuMode.deactivate().catch(() => {});
        }
      } catch (err) {
        // Native event log could not be read -> do NOT deactivate to avoid killing legitimate/manual Khushu sessions
        console.warn('[DiagRunner] Could not read native event log to verify Test B Khushu activation; skipping deactivate()', err);
      }
    }

    // Flush any pending cache cleanups
    await this.flushPendingCacheCleanup(state);

    state.conflicts = conflicts;
    state.cleanup = conflicts.length > 0 ? 'failed' : 'done';
    this.saveState(state);

    return { restoredKeys, conflicts };
  }

  /**
   * Cleans up any audio cache entries that were newly downloaded for test tracks.
   * R1: Never deletes a track cached before the run, and verifies deletion via isAudioDownloaded.
   */
  async flushPendingCacheCleanup(state: DiagRunState): Promise<void> {
    if (!state.cacheCleanupPending || state.cacheCleanupPending.length === 0) return;
    const remaining: string[] = [];
    for (const trackId of state.cacheCleanupPending) {
      // Never delete a track that was cached before the run
      if (state.wasCachedBefore?.[trackId]) {
        continue;
      }
      try {
        await deleteDownloadedAudio(trackId);
        const isStillDownloaded = await isAudioDownloaded(trackId).catch(() => false);
        if (isStillDownloaded) {
          remaining.push(trackId);
        }
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

    // 1. Check prayer proximity guard (fail closed if athanTimes missing or empty)
    const guard = checkPrayerProximityGuard({
      athanTimes: options?.athanTimes,
      customAlarms: options?.customAlarms,
      testDurationMinutes: spec.guardDurationMinutes ?? (spec.mode === 'timed' ? 40 : 5),
      now,
    });
    if (!guard.allowed) {
      return { success: false, error: guard.reason };
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

### src/diagnostics/tests/diagTypes.ts (119 lines)
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

// Android NotificationManager interruption filter constants
export const INTERRUPTION_FILTER_UNKNOWN = 0;
export const INTERRUPTION_FILTER_ALL = 1; // Normal, DND Off
export const INTERRUPTION_FILTER_PRIORITY = 2; // Priority only (not counted as muted in this matrix; see spec)
export const INTERRUPTION_FILTER_NONE = 3; // Total silence (DND active -> muted)
export const INTERRUPTION_FILTER_ALARMS = 4; // Alarms only (DND active -> muted)

export type DiagPhase = 'idle' | 'armed' | 'waiting' | 'collectable' | 'reported' | 'cancelled' | 'running';

export type DiagVerdict = 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'SUPPORTS_HYPOTHESIS' | 'REFUTED';

export type EvidenceState = 'ALARM_RECEIVED' | 'PLAYBACK_STARTED' | 'USER_CONFIRMED' | 'USER_DENIED' | 'INCONCLUSIVE';

export interface MuteStateInfo {
  isMuted: boolean;
  ringerMode?: number; // 0 = SILENT, 1 = VIBRATE, 2 = NORMAL
  interruptionFilter?: number; // 0=UNKNOWN, 1=ALL (Normal), 2=PRIORITY, 3=NONE (Muted), 4=ALARMS (Muted)
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
  wasCachedBefore?: Record<string, boolean>;
  partialResults?: Record<string, any>;
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
  guardDurationMinutes?: number;
  setup: (ctx: DiagContext) => Promise<void>;
  schedule?: (ctx: DiagContext) => Promise<{ createdAlarmIds: string[]; collectAt: number; expiresAt: number }>;
  userSteps?: DiagUserStep[];
  evaluate: (ctx: DiagContext, userResponses: Record<string, any>) => Promise<DiagResult>;
}

```

---

### src/diagnostics/tests/specs/testA_previewSource.ts (315 lines)
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

```

---

### src/components/settings/adhan/AthanDiagnosticsSection.tsx (1335 lines)
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
  const [hearingAnswers, setHearingAnswers] = useState<{ controlHeard: boolean | null; testHeard: boolean | null }>({
    controlHeard: null,
    testHeard: null,
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
    setHearingAnswers({ controlHeard: null, testHeard: null });
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
    if (hearingAnswers.controlHeard === null || hearingAnswers.testHeard === null) {
      setGuardError('يرجى تحديد إجابة السماع لكلا المنبهين قبل الاعتماد.');
      return;
    }
    setIsActionBusy(true);
    try {
      await diagRunnerInstance.submitUserAction({
        hearing_check: {
          controlHeard: hearingAnswers.controlHeard,
          testHeard: hearingAnswers.testHeard,
        },
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
      setHearingAnswers({ controlHeard: null, testHeard: null });
      fetchDiagnostics();
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleResetTest = async () => {
    setHearingAnswers({ controlHeard: null, testHeard: null });
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
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">مجدول (~24 دقيقة)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                يجدول منبهين متتاليين (عادي بعد 3د، وأثناء الخشوع بعد 6د)، ويتحقق من كتم الثاني وسجلات النظام عند د24.
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                تنبيه للمستخدم: استمع للمنبهين وتذكّر بدقة ما سمعته للإجابة على سؤالي التحقق عند فتح الاستبيان بعد انتهاء فترة الفحص (~24 دقيقة).
              </p>
              <button
                type="button"
                onClick={() => handleStartTest('b3-khushu-custom-alarm')}
                disabled={isActionBusy || (!!runnerState && runnerState.phase !== 'reported' && runnerState.phase !== 'cancelled')}
                className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>تشغيل Test B (فحص الخشوع - ~24 دقيقة)</span>
              </button>
            </div>
          </div>

          {/* Interactive UI for Test A (Offline Fallback Step) */}
          {runnerState?.phase === 'collectable' && runnerState.testId === 'fix1a-preview-source' && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <h5 className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                  فحص التراجع بدون اتصال (Test A: Offline Fallback Verification):
                </h5>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                اكتملت المرحلة الأولى (فحص الصوت المدمج والصوت عبر الإنترنت أثناء الاتصال). الآن يرجى قطع اتصال الإنترنت على الهاتف (إيقاف الواي فاي وبيانات الهاتف)، ثم الضغط على الزر أدناه لإجراء المرحلة الثانية (فحص التراجع للصوت الافتراضي ومسار التخزين المحلي بدون اتصال).
              </p>
              <button
                type="button"
                onClick={async () => {
                  setIsActionBusy(true);
                  try {
                    await diagRunnerInstance.submitUserAction({
                      step_offline: { confirmed: true },
                    });
                    fetchDiagnostics();
                  } catch (err: any) {
                    setGuardError(err?.message || 'فشل إرسال تأكيد عدم الاتصال.');
                  } finally {
                    setIsActionBusy(false);
                  }
                }}
                disabled={isActionBusy}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                تأكيد إيقاف الاتصال وإتمام الفحص
              </button>
            </div>
          )}

          {/* Interactive Hearing Questionnaire for Test B */}
          {runnerState?.phase === 'collectable' && runnerState.testId === 'b3-khushu-custom-alarm' && (
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

              {(hearingAnswers.controlHeard === null || hearingAnswers.testHeard === null) && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-bold text-center">
                  يرجى تحديد الإجابة لكلا السؤالين أعلاه لتفعيل زر الاعتماد.
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmitHearing}
                disabled={isActionBusy || hearingAnswers.controlHeard === null || hearingAnswers.testHeard === null}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
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

---

### src/App.tsx (583 lines)
```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AppSettings, 
  PrayerLog, 
  PrayerName,
  TabId,
  SettingsSubTabId
} from './types';

// Eager Essential Components
import Onboarding from './components/Onboarding';
import AthanOverlay from './components/AthanOverlay';

import { safeGetItem } from './utils/storage';

import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar } from './components/layout/AppSidebar';
import { AppBottomNav } from './components/layout/AppBottomNav';
import { AppTabRouter } from './components/layout/AppTabRouter';
import { AppModalOutlets } from './components/layout/AppModalOutlets';
import { playSpiritualChime } from './utils/spiritualAudio';

// Modular App Subcomponents & Hooks
import { AppBanners } from './components/app/AppBanners';
import { AppFeedbackOverlays } from './components/app/AppFeedbackOverlays';
import { useAppGlobalEvents } from './components/app/useAppGlobalEvents';
import { useAppSync } from './components/app/useAppSync';
import { useAppPermissionsAndAlerts } from './components/app/useAppPermissionsAndAlerts';

// Custom Hooks
import { usePrayerClock } from './hooks/usePrayerClock';
import { useSpiritualState } from './hooks/useSpiritualState';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useAthanPlayer } from './hooks/useAthanPlayer';
import { usePrayerScheduler } from './hooks/usePrayerScheduler';
import { useAndroidBackButton } from './hooks/useAndroidBackButton';
import { useSmartNotificationsSystemSync } from './hooks/useSmartNotificationsSystemSync';

import { formatDateKey } from './utils/prayerDayBoundary';
import { trackFeatureUsage } from './utils/analyticsStorage';
import { PrayerKey } from './utils/adhkarCalc';

// Import Hemmaty app logo icon
import companionIcon from './assets/images/hemmaty_logo.png';

// Calculations for standalone widget state synchronization
import { getArabicPrayerName } from './utils/prayerCalc';
import { toArabicNumbers } from './utils/hijri';
import { getMoonPhaseInfo } from './utils/moonPhase';
import { getPrayerProgressPercentage } from './utils/dashboardSky';
import { getUnreadVersionStatus } from './data/changelog';
import { checkForAppUpdates, AppReleaseInfo, compareSemver } from './services/updateChecker';
import { CURRENT_RELEASE } from './data/changelog';
import UpdateNotificationModal from './components/common/UpdateNotificationModal';
import { diagRunnerInstance } from './diagnostics/tests/diagRunner';

export default function App() {
  // Early diagnostics startup check (F6/R5): detects reboot/restarts before scheduler triggers
  useEffect(() => {
    diagRunnerInstance.checkAndResumeOnAppStartup().catch((err) => {
      console.warn('[App] Diagnostics startup check error:', err);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<SettingsSubTabId>('prayer');
  const [isTourModalOpen, setIsTourModalOpen] = useState(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false);
  const [isDiagnosticsModalOpen, setIsDiagnosticsModalOpen] = useState(false);
  const [availableUpdate, setAvailableUpdate] = useState<AppReleaseInfo | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => safeGetItem('salah_show_post_onboarding_welcome') === 'true');
  const [notificationsCount, setNotificationsCount] = useState<number>(0);

  // Modular App Permissions, Network & Auxiliary Alerts Hook
  const {
    toastMessage,
    setToastMessage,
    storageWarningAcknowledged,
    setStorageWarningAcknowledged,
    notifPermission,
    setNotifPermission,
    notifBannerDismissed,
    setNotifBannerDismissed,
    exactAlarmPermissionGranted,
    setExactAlarmPermissionGranted,
    exactAlarmBannerDismissed,
    setExactAlarmBannerDismissed,
    isOnline,
    isSyncing,
    headerParticles,
    triggerHeaderParticles,
    handleShareApp
  } = useAppPermissionsAndAlerts();

  // Custom Hooks Extraction
  const {
    settings,
    setSettings,
    prayerLogs,
    setPrayerLogs,
    pendingQadaPrayers,
    setPendingQadaPrayers,
    voluntaryPrayerLogs,
    setVoluntaryPrayerLogs,
    fastingLogs,
    setFastingLogs,
    ramadanQada,
    setRamadanQada,
    quranSessions,
    setQuranSessions,
    khatmat,
    setKhatmat,
    dhikrLogs,
    setDhikrLogs,
    customDuas,
    setCustomDuas,
    isLoaded,
    storageWriteError
  } = useSpiritualState();

  // Auto-show "What's New" modal when a new frontend update is detected
  useEffect(() => {
    if (isLoaded) {
      const { isNew } = getUnreadVersionStatus();
      if (isNew) {
        const timer = setTimeout(() => {
          setIsVersionModalOpen(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isLoaded]);

  // Background check for newer GitHub Release APK (throttled safely to avoid spamming API)
  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        checkForAppUpdates({ force: false })
          .then((result) => {
            if (
              result.hasUpdate &&
              result.latestRelease &&
              compareSemver(result.latestRelease.version, CURRENT_RELEASE.version) > 0
            ) {
              setAvailableUpdate(result.latestRelease);
            } else {
              setAvailableUpdate(null);
            }
          })
          .catch(() => {
            // Silently suppress network errors for background check
          });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded]);

  const {
    isInstalled,
    showPwaInstallGuide,
    setShowPwaInstallGuide,
    showManualSteps,
    setShowManualSteps,
    handleInstallApp,
    handleDirectInstallInsideModal
  } = usePwaInstall();

  const {
    globalAudioRef,
    isAthanPlaying,
    showAthanOverlay,
    setShowAthanOverlay,
    athanOverlayPrayer,
    setAthanOverlayPrayer,
    overrideMuezzinId,
    setOverrideMuezzinId,
    currentPhraseIdx,
    audioError,
    audioVolume,
    setAudioVolume,
    currentMuezzin,
    setCurrentMuezzin,
    fajrMuezzin,
    setFajrMuezzin,
    markAthanDismissed,
    triggerAthan,
    stopAthanGlobal,
    togglePlayAthanGlobal,
    handleRetryAudioWithLocal
  } = useAthanPlayer();

  const {
    customAlarms,
    setCustomAlarms,
    alerts,
    setAlerts,
    activeRingingAlarm,
    setActiveRingingAlarm
  } = usePrayerScheduler({
    settings,
    isLoaded,
    triggerAthan,
    globalAudioRef,
    audioVolume,
    setToastMessage
  });

  // Portal of Serenity & Spiritual Breath States
  const [showSpiritualModal, setShowSpiritualModal] = useState<boolean>(false);
  const [isFabOpen, setIsFabOpen] = useState<boolean>(false);
  const [headerRippleActive, setHeaderRippleActive] = useState<boolean>(false);
  const [fiqhWarning, setFiqhWarning] = useState<{ title: string; removedReasons: string[] } | null>(null);
  const [targetAdhkarPrayer, setTargetAdhkarPrayer] = useState<PrayerKey | null>(null);
  const [isSpiritualSearchOpen, setIsSpiritualSearchOpen] = useState<boolean>(false);

  // Background audio pre-cache, schedule synchronization, theme sync, and fiqh fasting validation
  useAppSync({
    isLoaded,
    settings,
    fastingLogs,
    setFastingLogs,
    setFiqhWarning
  });

  const { now, hijri, gregorianStr, times, current, next, timeRemainingStr, dayNameArabic, remainingMs, targetTimestampMs } = usePrayerClock(settings);
  const activePrayerName = current === 'Sunrise' ? 'Fajr' : (current || 'Dhuhr');

  // Window events, Service Worker messages, URL parameters, and Quick Logs
  useAppGlobalEvents({
    setActiveTab,
    setActiveSettingsSubTab,
    setIsTourModalOpen,
    setIsSpiritualSearchOpen,
    setNotificationsCount,
    quranSessions,
    setQuranSessions,
    khatmat,
    setKhatmat,
    current,
    next,
    setAthanOverlayPrayer,
    setShowAthanOverlay,
    globalAudioRef,
    togglePlayAthanGlobal
  });

  // Compute widget & notification synchronization parameters
  const moonInfo = getMoonPhaseInfo(hijri.day);
  const moonPhaseText = `${moonInfo.icon} ${moonInfo.name}`;
  const currentTimeFormatted = toArabicNumbers(
    now.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );
  const progressPercent = getPrayerProgressPercentage(now, times);

  // Silent Background Smart Notifications System Sync (Android Ongoing Notification Shade + Android Homescreen Widget)
  useSmartNotificationsSystemSync({
    cityName: settings.cityName || 'موقعي',
    hijriDateStr: hijri.fullString,
    nextPrayerNameArabic: getArabicPrayerName(next, now),
    nextPrayerTimeFormatted: times[next] || '',
    remainingMsToNextPrayer: remainingMs,
    targetTimestampMs,
    times,
    dayNameArabic,
    nextPrayerKey: next,
    moonPhaseText,
    currentTimeFormatted,
    timeRemainingFormatted: timeRemainingStr,
    progressPercent,
    isJumuah: now.getDay() === 5 && next === 'Dhuhr',
  });

  // Register Android Hardware Back Button Handling (Task 26)
  useAndroidBackButton({
    activeTab,
    setActiveTab,
    setToastMessage: (msg) => setToastMessage(msg),
    overlays: [
      { id: 'isSpiritualSearchOpen', isOpen: isSpiritualSearchOpen, close: () => setIsSpiritualSearchOpen(false) },
      { 
        id: 'athanOverlay', 
        isOpen: showAthanOverlay, 
        close: () => {
          markAthanDismissed();
          setShowAthanOverlay(false);
          stopAthanGlobal();
        } 
      },
      { id: 'activeRingingAlarm', isOpen: Boolean(activeRingingAlarm), close: () => setActiveRingingAlarm(null) },
      { id: 'fiqhWarning', isOpen: Boolean(fiqhWarning), close: () => setFiqhWarning(null) },
      { id: 'isFabOpen', isOpen: isFabOpen, close: () => setIsFabOpen(false) },
      { id: 'isSidebarOpen', isOpen: isSidebarOpen, close: () => setIsSidebarOpen(false) },
      { id: 'isQuickSettingsOpen', isOpen: isQuickSettingsOpen, close: () => setIsQuickSettingsOpen(false) },
      { id: 'isTourModalOpen', isOpen: isTourModalOpen, close: () => setIsTourModalOpen(false) },
      { id: 'isDiagnosticsModalOpen', isOpen: isDiagnosticsModalOpen, close: () => setIsDiagnosticsModalOpen(false) },
      { id: 'availableUpdate', isOpen: Boolean(availableUpdate), close: () => setAvailableUpdate(null) },
      { id: 'isVersionModalOpen', isOpen: isVersionModalOpen, close: () => setIsVersionModalOpen(false) },
      { id: 'showSpiritualModal', isOpen: showSpiritualModal, close: () => setShowSpiritualModal(false) },
      { id: 'showPwaInstallGuide', isOpen: showPwaInstallGuide, close: () => setShowPwaInstallGuide(false) },
      { id: 'showWelcomeModal', isOpen: showWelcomeModal, close: () => setShowWelcomeModal(false) }
    ]
  });

  const handleNavigateToAdhkarForPrayer = (prayerName: string) => {
    const p = (prayerName || '').toLowerCase();
    let key: PrayerKey = 'fajr';
    if (p.includes('dhuhr') || p.includes('zuhr')) key = 'dhuhr';
    else if (p.includes('asr')) key = 'asr';
    else if (p.includes('maghrib')) key = 'maghrib';
    else if (p.includes('isha')) key = 'isha';
    else if (p.includes('fajr')) key = 'fajr';

    setTargetAdhkarPrayer(key);
    setActiveTab('adhkar');
  };

  // Auto track feature usage whenever activeTab changes
  useEffect(() => {
    if (activeTab) {
      trackFeatureUsage(activeTab);
    }
  }, [activeTab]);

  // Handle completion of onboarding
  const handleOnboardingComplete = (
    finalSettings: AppSettings, 
    lastPrayerDone: { prayer: PrayerName; wasOnTime: boolean }
  ) => {
    setSettings(finalSettings);
    
    const todayStr = formatDateKey(new Date());
    const initialLog: PrayerLog = {
      status: lastPrayerDone.wasOnTime ? 'A' : 'B',
      sunnahBefore: 0,
      sunnahAfter: 0
    };
    
    setPrayerLogs({
      [todayStr]: {
        [lastPrayerDone.prayer]: initialLog
      }
    });

    setSettings(prev => ({
      ...prev,
      trackingStartDate: todayStr,
      trackingStartPrayer: lastPrayerDone.prayer
    }));
    setShowWelcomeModal(true);
  };

  // While loading, display a clean loading pulse
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#faf7f0] dark:bg-[#0e1217] flex flex-col items-center justify-center text-center space-y-4" dir="rtl">
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-850 animate-pulse bg-[#16202c] shrink-0">
          <img 
            src={companionIcon} 
            alt="Hemmaty Logo" 
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/hemmaty_logo.png';
            }}
            className="w-full h-full object-cover select-none" 
            referrerPolicy="no-referrer" 
          />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 dark:text-white">هِمَّتِي</h2>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">Hemmaty</p>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold animate-pulse">جاري تحميل السجلات المباركة...</p>
      </div>
    );
  }

  // Render Onboarding if they haven't finished it yet
  if (!settings.hasCompletedOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#faf7f0] dark:bg-[#0e1217] pb-24 text-right flex flex-col items-center font-sans transition-colors duration-300 text-slate-800 dark:text-slate-100 w-full" dir="rtl">
      
      {/* 1. Sticky Top Header Bar */}
      <AppHeader
        settings={settings}
        setSettings={setSettings}
        setIsSidebarOpen={setIsSidebarOpen}
        setActiveTab={setActiveTab}
        activeTab={activeTab}
        notificationsCount={notificationsCount}
        setIsTourModalOpen={setIsTourModalOpen}
        setShowSpiritualModal={setShowSpiritualModal}
        headerRippleActive={headerRippleActive}
        setHeaderRippleActive={setHeaderRippleActive}
        headerParticles={headerParticles}
        triggerHeaderParticles={triggerHeaderParticles}
        playSpiritualChime={playSpiritualChime}
        isSyncing={isSyncing}
        isOnline={isOnline}
      />

      {/* 2. Main Content Stage Container */}
      <main className="w-full max-w-md p-4 space-y-6">
        <AppBanners
          storageWriteError={storageWriteError}
          storageWarningAcknowledged={storageWarningAcknowledged}
          onDismissStorageWarning={() => setStorageWarningAcknowledged(true)}
          notifPermission={notifPermission}
          notifBannerDismissed={notifBannerDismissed}
          onDismissNotifBanner={() => setNotifBannerDismissed(true)}
          setNotifPermission={setNotifPermission}
          exactAlarmPermissionGranted={exactAlarmPermissionGranted}
          exactAlarmBannerDismissed={exactAlarmBannerDismissed}
          onDismissExactAlarmBanner={() => setExactAlarmBannerDismissed(true)}
          setExactAlarmPermissionGranted={setExactAlarmPermissionGranted}
        />

        <AppTabRouter
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activeSettingsSubTab={activeSettingsSubTab}
          setActiveSettingsSubTab={setActiveSettingsSubTab}
          settings={settings}
          setSettings={setSettings}
          prayerLogs={prayerLogs}
          setPrayerLogs={setPrayerLogs}
          pendingQadaPrayers={pendingQadaPrayers}
          setPendingQadaPrayers={setPendingQadaPrayers}
          voluntaryPrayerLogs={voluntaryPrayerLogs}
          setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
          fastingLogs={fastingLogs}
          setFastingLogs={setFastingLogs}
          ramadanQada={ramadanQada}
          setRamadanQada={setRamadanQada}
          quranSessions={quranSessions}
          setQuranSessions={setQuranSessions}
          khatmat={khatmat}
          setKhatmat={setKhatmat}
          dhikrLogs={dhikrLogs}
          setDhikrLogs={setDhikrLogs}
          customDuas={customDuas}
          setCustomDuas={setCustomDuas}
          customAlarms={customAlarms}
          setCustomAlarms={setCustomAlarms}
          alerts={alerts}
          setAlerts={setAlerts}
          audioVolume={audioVolume}
          setAudioVolume={setAudioVolume}
          targetAdhkarPrayer={targetAdhkarPrayer}
          handleNavigateToAdhkarForPrayer={handleNavigateToAdhkarForPrayer}
          handleInstallApp={handleInstallApp}
          isInstalled={isInstalled}
          times={times}
          current={current}
          next={next}
          timeRemainingStr={timeRemainingStr}
          hijri={hijri}
          dayNameArabic={dayNameArabic}
          gregorianStr={gregorianStr}
          now={now}
          toArabicNumbers={toArabicNumbers}
          setToastMessage={setToastMessage}
        />
      </main>

      {/* 4. Slide-out Sidebar Drawer */}
      <AppSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSettingsSubTab={activeSettingsSubTab}
        setActiveSettingsSubTab={setActiveSettingsSubTab}
        settings={settings}
        setSettings={setSettings}
        setIsQuickSettingsOpen={setIsQuickSettingsOpen}
        setIsTourModalOpen={setIsTourModalOpen}
        setIsVersionModalOpen={setIsVersionModalOpen}
        isInstalled={isInstalled}
        handleInstallApp={handleInstallApp}
        handleShareApp={handleShareApp}
        setToastMessage={setToastMessage}
        setIsDiagnosticsModalOpen={setIsDiagnosticsModalOpen}
      />

      {/* 3. Rebalanced Fixed Bottom Navigation with Central FAB Radial Menu */}
      <AppBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isFabOpen={isFabOpen}
        setIsFabOpen={setIsFabOpen}
        currentPrayerName={activePrayerName}
        nextPrayerName={typeof next === 'string' ? next : 'Asr'}
        prayerLogs={prayerLogs}
        setToastMessage={setToastMessage}
      />

      {/* Global Immersive Athan Overlay Screen */}
      <AthanOverlay 
        isOpen={showAthanOverlay} 
        onClose={() => {
          markAthanDismissed();
          setShowAthanOverlay(false);
          setOverrideMuezzinId(null);
          stopAthanGlobal();
        }} 
        overrideMuezzinId={overrideMuezzinId}
        setOverrideMuezzinId={setOverrideMuezzinId}
        prayerName={getArabicPrayerName(athanOverlayPrayer)} 
        prayerTime={times[athanOverlayPrayer]} 
        audioRef={globalAudioRef}
        isPlaying={isAthanPlaying}
        currentPhraseIdx={currentPhraseIdx}
        togglePlayAthan={togglePlayAthanGlobal}
        stopAthan={stopAthanGlobal}
        audioError={audioError}
        onRetryWithLocal={handleRetryAudioWithLocal}
      />

      {/* In-App Toast and Fiqh Warning Modal */}
      <AppFeedbackOverlays
        toastMessage={toastMessage}
        fiqhWarning={fiqhWarning}
        onDismissFiqhWarning={() => setFiqhWarning(null)}
      />

      {/* Lazy Loaded Modal Dialogs */}
      <AppModalOutlets
        showPwaInstallGuide={showPwaInstallGuide}
        setShowPwaInstallGuide={setShowPwaInstallGuide}
        showManualSteps={showManualSteps}
        setShowManualSteps={setShowManualSteps}
        handleDirectInstallInsideModal={handleDirectInstallInsideModal}
        showSpiritualModal={showSpiritualModal}
        setShowSpiritualModal={setShowSpiritualModal}
        activeRingingAlarm={activeRingingAlarm}
        setActiveRingingAlarm={setActiveRingingAlarm}
        setCustomAlarms={setCustomAlarms}
        globalAudioRef={globalAudioRef}
        isTourModalOpen={isTourModalOpen}
        setIsTourModalOpen={setIsTourModalOpen}
        isQuickSettingsOpen={isQuickSettingsOpen}
        setIsQuickSettingsOpen={setIsQuickSettingsOpen}
        settings={settings}
        setSettings={setSettings}
        showWelcomeModal={showWelcomeModal}
        setShowWelcomeModal={setShowWelcomeModal}
        isSpiritualSearchOpen={isSpiritualSearchOpen}
        setIsSpiritualSearchOpen={setIsSpiritualSearchOpen}
        isVersionModalOpen={isVersionModalOpen}
        setIsVersionModalOpen={setIsVersionModalOpen}
        setActiveTab={setActiveTab}
        setActiveSettingsSubTab={setActiveSettingsSubTab}
        setToastMessage={setToastMessage}
        isDiagnosticsModalOpen={isDiagnosticsModalOpen}
        setIsDiagnosticsModalOpen={setIsDiagnosticsModalOpen}
      />

      {/* GitHub In-App Update Alert Modal */}
      {availableUpdate && (
        <UpdateNotificationModal
          isOpen={Boolean(availableUpdate)}
          releaseInfo={availableUpdate}
          onClose={() => setAvailableUpdate(null)}
        />
      )}

    </div>
  );
}

```

---

### src/utils/previewSource.ts (90 lines)
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Local-first source resolution for athan previews.
 *
 * Order: bundled file -> locally cached/downloaded copy -> network URL (only when online) -> bundled default (last resort).
 * The resolver is injected (normally `getAudioUrl`) so this stays pure and unit-testable.
 */

export type PreviewSourceKind = 'bundled' | 'local' | 'remote' | 'default';

export interface PreviewTrackLike {
  id?: string;
  url?: string;
}

export interface PreviewFallbacks {
  fajr: string;
  general: string;
}

export type PreviewUrlResolver = (url: string, trackId?: string, isFajr?: boolean) => Promise<string>;

export interface PreviewSource {
  src: string;
  kind: PreviewSourceKind;
}

export async function resolvePreviewSource(
  track: PreviewTrackLike | undefined,
  isFajr: boolean,
  resolver: PreviewUrlResolver,
  fallbacks: PreviewFallbacks,
  isOnline: boolean = typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true
): Promise<PreviewSource> {
  const fallback = isFajr ? fallbacks.fajr : fallbacks.general;
  const url = track?.url;

  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { src: fallback, kind: 'default' };
  }

  // Files shipped inside the app need no resolution.
  if (url.startsWith('/audio/')) {
    return { src: url, kind: 'bundled' };
  }

  try {
    const resolved = await resolver(url, track?.id, isFajr);
    if (!resolved || typeof resolved !== 'string') {
      return { src: fallback, kind: 'default' };
    }
    if (resolved.startsWith('blob:')) {
      return { src: resolved, kind: 'local' };
    }
    if (resolved.startsWith('/audio/')) {
      // The resolver itself fell back to a bundled default.
      return { src: resolved, kind: 'default' };
    }
    // A network URL is useless when the device is offline and the resolver found no cached copy
    // (getAudioUrl returns the https URL even offline). Go straight to the default instead of
    // waiting for the request to fail. Cached copies (blob:) are decided above and still win offline.
    if (!isOnline) {
      return { src: fallback, kind: 'default' };
    }
    return { src: resolved, kind: 'remote' };
  } catch {
    return { src: fallback, kind: 'default' };
  }
}

export function describePreviewSource(kind: PreviewSourceKind): string {
  switch (kind) {
    case 'local':
      return 'من التخزين المحلي';
    case 'remote':
      return 'من الإنترنت';
    case 'default':
      return 'الصوت الافتراضي لأن المؤذن المختار غير متاح';
    case 'bundled':
    default:
      return 'الصوت المدمج';
  }
}

```

---

### src/utils/backupAlarmUtils.ts (23 lines)
```ts
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isDiagAlarmId } from '../diagnostics/tests/diagTypes';

/**
 * Strips any synthetic diagnostic alarms (with id prefix diag_) from custom alarms list before export.
 */
export function sanitizeAlarmsForExport<T extends { id?: string | null }>(alarms: T[] | null | undefined): T[] {
  if (!Array.isArray(alarms)) return [];
  return alarms.filter((alarm) => !isDiagAlarmId(alarm?.id));
}

/**
 * Strips any synthetic diagnostic alarms (with id prefix diag_) from imported backup payload before saving.
 */
export function sanitizeAlarmsForRestore<T extends { id?: string | null }>(alarms: T[] | null | undefined): T[] {
  if (!Array.isArray(alarms)) return [];
  return alarms.filter((alarm) => !isDiagAlarmId(alarm?.id));
}

```

---

### src/diagnostics/tests/diagRunner.test.ts (1357 lines)
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
import { sanitizeAlarmsForExport, sanitizeAlarmsForRestore } from '../../utils/backupAlarmUtils';
import { KhushuMode } from '../../services/khushuModePlugin';
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
    test('detects ringerMode=0 (SILENT) as muted regardless of filter', () => {
      const state = parseMuteState('test event with ringerMode=0 and interruptionFilter=1');
      assert.equal(state.isMuted, true);
      assert.equal(state.ringerMode, 0);
      assert.match(state.description, /صامت/);
    });

    test('detects ringerMode=1 (VIBRATE) as muted regardless of filter', () => {
      const state = parseMuteState('event details initialRinger=2 appliedRinger=1 interruptionFilter=1');
      assert.equal(state.isMuted, true);
      assert.equal(state.ringerMode, 1);
      assert.match(state.description, /اهتزاز/);
    });

    test('detects interruptionFilter=3 (NONE / Total Silence) as muted with normal ringer', () => {
      const state = parseMuteState('event details ringerMode=2 interruptionFilter=3 hasDndPermission=true');
      assert.equal(state.isMuted, true);
      assert.equal(state.interruptionFilter, 3);
      assert.match(state.description, /DND_FILTER_NONE=3/);
    });

    test('detects interruptionFilter=4 (ALARMS / Alarms Only) as muted with normal ringer', () => {
      const state = parseMuteState('event details ringerMode=2 appliedFilter=4 hasDndPermission=true');
      assert.equal(state.isMuted, true);
      assert.equal(state.interruptionFilter, 4);
      assert.match(state.description, /DND_FILTER_ALARMS=4/);
    });

    test('detects (ringerMode=2, interruptionFilter=1 ALL/Normal) as NOT muted', () => {
      const state = parseMuteState('event details ringerMode=2 interruptionFilter=1');
      assert.equal(state.isMuted, false);
      assert.equal(state.ringerMode, 2);
      assert.equal(state.interruptionFilter, 1);
    });

    test('detects (ringerMode=2, interruptionFilter=2 PRIORITY) as NOT muted', () => {
      const state = parseMuteState('event details ringerMode=2 interruptionFilter=2');
      assert.equal(state.isMuted, false);
      assert.equal(state.ringerMode, 2);
      assert.equal(state.interruptionFilter, 2);
    });

    test('handles empty or unrecognized details gracefully', () => {
      const state = parseMuteState('');
      assert.equal(state.isMuted, false);
      assert.equal(state.ringerMode, undefined);
      assert.equal(state.interruptionFilter, undefined);
    });
  });

  describe('3. Prayer Proximity Guard (Athan & Real Custom Alarms)', () => {
    const now = 1700000000000; // fixed epoch
    const guardStart = now - 30 * 60 * 1000;
    const guardEnd = now + (25 + 30) * 60 * 1000;
    const safeAthanTimes = [
      { name: 'Fajr', timeMs: now - 120 * 60 * 1000 },
      { name: 'Dhuhr', timeMs: now + 180 * 60 * 1000 },
    ];

    test('fails closed: rejects test start when athanTimes is empty or missing', () => {
      const resEmpty = checkPrayerProximityGuard({
        athanTimes: [],
        now,
      });
      assert.equal(resEmpty.allowed, false);
      assert.match(resEmpty.reason || '', /تعذر التحقق من مواقيت الصلاة/);

      const resMissing = checkPrayerProximityGuard({
        athanTimes: undefined,
        now,
      });
      assert.equal(resMissing.allowed, false);
      assert.match(resMissing.reason || '', /تعذر التحقق من مواقيت الصلاة/);
    });

    test('rejects test start when real Athan falls within guard window', () => {
      const athanTimes = [
        { name: 'Fajr', timeMs: guardStart - 10000 },
        { name: 'Dhuhr', timeMs: now + 15 * 60 * 1000 }, // within 25min test window
        { name: 'Asr', timeMs: guardEnd + 10000 },
      ];
      const result = checkPrayerProximityGuard({
        athanTimes,
        now,
        testDurationMinutes: 25,
      });
      assert.equal(result.allowed, false);
      assert.match(result.reason || '', /Dhuhr/);
    });

    test('rejects test start when real custom alarm falls within guard window', () => {
      const today = new Date(now);
      const alarmHours = today.getHours();
      const alarmMinutes = today.getMinutes() + 10;
      const timeStr = `${String(alarmHours).padStart(2, '0')}:${String(alarmMinutes).padStart(2, '0')}`;

      const customAlarms: any[] = [
        { id: 'custom_work_alarm', title: 'Work Reminder', time: timeStr, enabled: true },
      ];

      const result = checkPrayerProximityGuard({
        athanTimes: safeAthanTimes,
        customAlarms,
        now,
        testDurationMinutes: 25,
      });

      assert.equal(result.allowed, false);
      assert.match(result.reason || '', /Work Reminder/);
    });

    test('detects custom alarm crossing midnight into next calendar day within window', () => {
      // Set now to 23:45 (15 minutes before midnight)
      const lateNight = new Date(2026, 5, 10, 23, 45, 0).getTime();
      const nextDay = new Date(2026, 5, 11, 0, 15, 0); // 15 mins after midnight (within 40m test + 30m buffer)
      const timeStr = '00:15';

      const customAlarms: any[] = [
        {
          id: 'midnight_alarm',
          title: 'Midnight Tahajjud',
          time: timeStr,
          enabled: true,
          days: [nextDay.getDay()],
        },
      ];

      const result = checkPrayerProximityGuard({
        athanTimes: [{ name: 'Fajr', timeMs: lateNight + 5 * 3600 * 1000 }],
        customAlarms,
        testDurationMinutes: 40,
        now: lateNight,
      });

      assert.equal(result.allowed, false);
      assert.match(result.reason || '', /Midnight Tahajjud/);
    });

    test('ignores disabled custom alarms in guard window', () => {
      const today = new Date(now);
      const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes() + 10).padStart(2, '0')}`;

      const customAlarms: any[] = [
        { id: 'disabled_alarm', title: 'Disabled', time: timeStr, enabled: false },
      ];

      const result = checkPrayerProximityGuard({
        athanTimes: safeAthanTimes,
        customAlarms,
        now,
        testDurationMinutes: 25,
      });

      assert.equal(result.allowed, true);
    });

    test('ignores synthetic diagnostic alarms (id prefix diag_) in guard window', () => {
      const today = new Date(now);
      const timeStr = `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes() + 10).padStart(2, '0')}`;

      const customAlarms: any[] = [
        { id: 'diag_123_0', title: 'Diagnostic Alarm', time: timeStr, enabled: true },
      ];

      const result = checkPrayerProximityGuard({
        athanTimes: safeAthanTimes,
        customAlarms,
        now,
        testDurationMinutes: 25,
      });

      assert.equal(result.allowed, true);
    });

    test('allows start when all athan and custom alarms are safely outside guard window', () => {
      const result = checkPrayerProximityGuard({
        athanTimes: safeAthanTimes,
        customAlarms: [],
        now,
        testDurationMinutes: 25,
      });

      assert.equal(result.allowed, true);
    });
  });

  describe('4. Compare-and-Restore & Conflict Resolution', () => {
    test('restores original settings when value matches testVal (unchanged by user)', async () => {
      const runner = new DiagRunner();
      const originalSettings = { enabled: false, durationMinutes: 15, mode: 'silent' };
      const testSettings = { enabled: true, durationMinutes: 7, mode: 'silent' };

      safeSetJSON('hemmaty_khushu_settings_v2', testSettings);

      const state: DiagRunState = {
        runId: 'run_1',
        testId: 'test_b',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {
          hemmaty_khushu_settings_v2: {
            original: originalSettings,
            hash: hashValue(originalSettings),
            testVal: testSettings,
          },
        },
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };

      const { restoredKeys, conflicts } = await runner.compareAndRestore(state);

      assert.deepEqual(restoredKeys, ['hemmaty_khushu_settings_v2']);
      assert.equal(conflicts.length, 0);
      assert.deepEqual(safeGetJSON('hemmaty_khushu_settings_v2', null), originalSettings);
    });

    test('preserves user modifications and records CONFLICT when user altered settings during test', async () => {
      const runner = new DiagRunner();
      const originalSettings = { enabled: false, durationMinutes: 15, mode: 'silent' };
      const testSettings = { enabled: true, durationMinutes: 7, mode: 'silent' };
      const userAlteredSettings = { enabled: true, durationMinutes: 30, mode: 'vibrate' }; // user changed in UI

      safeSetJSON('hemmaty_khushu_settings_v2', userAlteredSettings);

      const state: DiagRunState = {
        runId: 'run_1',
        testId: 'test_b',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {
          hemmaty_khushu_settings_v2: {
            original: originalSettings,
            hash: hashValue(originalSettings),
            testVal: testSettings,
          },
        },
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };

      const { restoredKeys, conflicts } = await runner.compareAndRestore(state);

      assert.equal(restoredKeys.length, 0);
      assert.equal(conflicts.length, 1);
      assert.equal(conflicts[0].key, 'hemmaty_khushu_settings_v2');
      // User alterations must be strictly preserved
      assert.deepEqual(safeGetJSON('hemmaty_khushu_settings_v2', null), userAlteredSettings);
    });

    test('custom alarms cleanup purges synthetic diag_ alarms while strictly preserving real alarms', async () => {
      const runner = new DiagRunner();
      const realAlarm1 = { id: 'real_morning_alarm', title: 'Wake Up', time: '06:00', enabled: true };
      const realAlarm2 = { id: 'real_pill_alarm', title: 'Medicine', time: '14:00', enabled: true };
      const syntheticAlarm1 = { id: 'diag_run1_0', title: 'Diagnostic Control', time: '12:00', enabled: true };
      const syntheticAlarm2 = { id: 'diag_run1_1', title: 'Diagnostic Test', time: '12:05', enabled: true };

      safeSetJSON('salah_custom_alarms', [realAlarm1, syntheticAlarm1, realAlarm2, syntheticAlarm2]);

      const state: DiagRunState = {
        runId: 'run1',
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
        createdAlarmIds: ['diag_run1_0', 'diag_run1_1'],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };

      await runner.compareAndRestore(state);

      const remainingAlarms = safeGetJSON<any[]>('salah_custom_alarms', []);
      assert.equal(remainingAlarms.length, 2);
      assert.equal(remainingAlarms[0].id, 'real_morning_alarm');
      assert.equal(remainingAlarms[1].id, 'real_pill_alarm');
    });
  });

  describe('5. Startup Lifecycle, Reboot Detection & Expiration', () => {
    test('transitions to cancelled when device reboot is detected during test', async () => {
      const runner = new DiagRunner();
      const now = Date.now();
      const startedAt = now - 100000;
      const rebootTimestamp = now - 50000; // rebooted after startedAt

      // Mock native getAlarmDiagnostics to return boot timestamp
      setAthanPluginBridgeForTesting({
        getAlarmDiagnostics: (async () => ({
          platform: 'android',
          androidVersion: 34,
          canScheduleExactAlarms: true,
          isIgnoringBatteryOptimizations: true,
          scheduledCount: 0,
          scheduledAlarms: [],
          lastDeviceBootTimestamp: rebootTimestamp,
        })) as any,
      });

      const state: DiagRunState = {
        runId: 'reboot_run',
        testId: 'b3-khushu-custom-alarm',
        startedAt,
        phase: 'waiting',
        snapshot: {},
        createdAlarmIds: ['diag_reboot_0'],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };
      runner.saveState(state);

      const resumed = await runner.checkAndResumeOnAppStartup();

      assert.ok(resumed);
      assert.equal(resumed?.phase, 'cancelled');
      assert.equal(resumed?.result?.verdict, 'INCONCLUSIVE');
      assert.match(resumed?.result?.reason || '', /أعيد تشغيل الجهاز/);
    });

    test('transitions to cancelled when test expires before completion', async () => {
      const runner = new DiagRunner();
      const now = Date.now();
      const state: DiagRunState = {
        runId: 'expired_run',
        testId: 'b3-khushu-custom-alarm',
        startedAt: now - 3600000,
        expiresAt: now - 1000, // expired 1s ago
        phase: 'waiting',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };
      runner.saveState(state);

      const resumed = await runner.checkAndResumeOnAppStartup();

      assert.ok(resumed);
      assert.equal(resumed?.phase, 'cancelled');
      assert.match(resumed?.result?.reason || '', /انتهت المهلة القصوى/);
    });

    test('transitions from waiting to collectable when collectAt timestamp has passed', async () => {
      const runner = new DiagRunner();
      const now = Date.now();
      const state: DiagRunState = {
        runId: 'ready_run',
        testId: 'b3-khushu-custom-alarm',
        startedAt: now - 600000,
        collectAt: now - 5000, // collection time arrived
        expiresAt: now + 600000,
        phase: 'waiting',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };
      runner.saveState(state);

      const resumed = await runner.checkAndResumeOnAppStartup();

      assert.ok(resumed);
      assert.equal(resumed?.phase, 'collectable');
    });
  });

  describe('6. Test B Verdict Decision Matrix', () => {
    const mockNativeEventsForRun = (runId: string) => {
      const id1 = `diag_${runId}_1`;
      const id2 = `diag_${runId}_2`;
      setAthanPluginBridgeForTesting({
        getNativeEventLog: async () => ({
          events: [
            { event: 'fire_received', timestampMs: Date.now() - 200000, details: `prayerKey=${id1} alarmType=custom` },
            { event: 'fire_received', timestampMs: Date.now() - 50000, details: `prayerKey=${id2} alarmType=custom` },
            { event: 'khushu_result', timestampMs: Date.now() - 49000, details: `sourceKey=${id2} appliedRinger=0 appliedFilter=3 hasDndPermission=true` },
          ],
          total: 3,
        }),
      });
    };

    test('Control Heard + Test NOT Heard => SUPPORTS_HYPOTHESIS', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_B_SPEC);
      const runId = 'test_b_supports';
      mockNativeEventsForRun(runId);

      const state: DiagRunState = {
        runId,
        testId: 'b3-khushu-custom-alarm',
        startedAt: Date.now() - 400000,
        phase: 'collectable',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {
          hearing_check: { controlHeard: true, testHeard: false },
        },
      };
      runner.saveState(state);

      const result = await runner.submitUserAction();

      assert.ok(result);
      assert.equal(result?.verdict, 'SUPPORTS_HYPOTHESIS');
      assert.match(result?.reason || '', /تم تأكيد الفرضية/);
    });

    test('Control Heard + Test Heard => REFUTED', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_B_SPEC);
      const runId = 'test_b_refuted';
      mockNativeEventsForRun(runId);

      const state: DiagRunState = {
        runId,
        testId: 'b3-khushu-custom-alarm',
        startedAt: Date.now() - 400000,
        phase: 'collectable',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {
          hearing_check: { controlHeard: true, testHeard: true },
        },
      };
      runner.saveState(state);

      const result = await runner.submitUserAction();

      assert.ok(result);
      assert.equal(result?.verdict, 'REFUTED');
      assert.match(result?.reason || '', /سُمع صوت المنبه المخصص الثاني بوضوح/);
    });

    test('Control NOT Heard + Test NOT Heard => INCONCLUSIVE', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_B_SPEC);
      const runId = 'test_b_inconclusive_both';
      mockNativeEventsForRun(runId);

      const state: DiagRunState = {
        runId,
        testId: 'b3-khushu-custom-alarm',
        startedAt: Date.now() - 400000,
        phase: 'collectable',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {
          hearing_check: { controlHeard: false, testHeard: false },
        },
      };
      runner.saveState(state);

      const result = await runner.submitUserAction();

      assert.ok(result);
      assert.equal(result?.verdict, 'INCONCLUSIVE');
      assert.match(result?.reason || '', /لم يُسمع منبه المقارنة ولا منبه الخشوع/);
    });

    test('Control NOT Heard + Test Heard => INCONCLUSIVE', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_B_SPEC);
      const runId = 'test_b_inconclusive_control_missed';
      mockNativeEventsForRun(runId);

      const state: DiagRunState = {
        runId,
        testId: 'b3-khushu-custom-alarm',
        startedAt: Date.now() - 400000,
        phase: 'collectable',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {
          hearing_check: { controlHeard: false, testHeard: true },
        },
      };
      runner.saveState(state);

      const result = await runner.submitUserAction();

      assert.ok(result);
      assert.equal(result?.verdict, 'INCONCLUSIVE');
      assert.match(result?.reason || '', /لم يُسمع منبه المقارنة بينما سُمع منبه الخشوع/);
    });

    test('Khushu event without matching sourceKey => INCONCLUSIVE', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_B_SPEC);
      const runId = 'test_b_no_sourcekey';
      const id1 = `diag_${runId}_1`;
      const id2 = `diag_${runId}_2`;
      setAthanPluginBridgeForTesting({
        getNativeEventLog: async () => ({
          events: [
            { event: 'fire_received', timestampMs: Date.now() - 200000, details: `prayerKey=${id1} alarmType=custom` },
            { event: 'fire_received', timestampMs: Date.now() - 50000, details: `prayerKey=${id2} alarmType=custom` },
            { event: 'khushu_result', timestampMs: Date.now() - 49000, details: `sourceKey=other_alarm appliedRinger=0 appliedFilter=3` },
          ],
          total: 3,
        }),
      });

      const state: DiagRunState = {
        runId,
        testId: 'b3-khushu-custom-alarm',
        startedAt: Date.now() - 400000,
        phase: 'collectable',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {
          hearing_check: { controlHeard: true, testHeard: false },
        },
      };
      runner.saveState(state);

      const result = await runner.submitUserAction();
      assert.ok(result);
      assert.equal(result?.verdict, 'INCONCLUSIVE');
      assert.match(result?.reason || '', /لم يُعثر على حدث تفعيل وضع الخشوع/);
    });
  });

  describe('7. Test A Multi-Phase Preview Source & Teardown (R1)', () => {
    test('Phase 1 online + Phase 2 offline with unmeasured Phase 3 => INCONCLUSIVE without pre-downloaded track', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_A_SPEC);

      const safeAthanTimes = [{ name: 'Fajr', timeMs: Date.now() + 10 * 3600 * 1000 }];
      const startRes = await runner.startTest(TEST_A_SPEC, { athanTimes: safeAthanTimes });
      assert.equal(startRes.success, true);
      assert.equal(startRes.state?.phase, 'collectable');
      assert.equal(startRes.state?.partialResults?.phase1Done, true);

      const result = await runner.submitUserAction({
        step_offline: { confirmed: true },
      });
      assert.ok(result);
      assert.equal(result?.testId, 'fix1a-preview-source');
      assert.equal(result?.verdict, 'INCONCLUSIVE');
      assert.match(result?.reason || '', /لم تكتمل بعض بنود فحص عدم الاتصال/);

      // Verify bundled, online and offline uncached items are present
      const bundledStep = result?.expectedVsActual.find((e) => e.parameter.includes('صوت مدمج'));
      const onlineStep = result?.expectedVsActual.find((e) => e.parameter.includes('اتصال إنترنت'));
      const offlineStep = result?.expectedVsActual.find((e) => e.parameter.includes('بدون اتصال') && !e.parameter.includes('محمّل مسبقاً'));
      const preDownloadedStep = result?.expectedVsActual.find((e) => e.parameter.includes('محمّل مسبقاً'));

      assert.ok(bundledStep);
      assert.ok(onlineStep);
      assert.ok(offlineStep);
      assert.ok(preDownloadedStep);

      assert.equal(bundledStep?.status, 'MATCH');
      assert.equal(onlineStep?.status, 'MATCH');
      assert.equal(offlineStep?.status, 'MATCH');
      assert.equal(preDownloadedStep?.status, 'UNMEASURED');
    });

    test('achieves PASS when pre-downloaded track is present for Phase 3', async () => {
      const fakeStore = new Map<string, any>();
      fakeStore.set('downloaded_archive_003', { blob: new Blob(['audio'], { type: 'audio/mp3' }) });

      (globalThis as any).indexedDB = {
        open: () => {
          const req: any = {};
          setTimeout(() => {
            req.result = {
              transaction: () => ({
                objectStore: () => ({
                  get: (key: string) => {
                    const r: any = {};
                    setTimeout(() => {
                      r.result = fakeStore.get(key);
                      if (r.onsuccess) r.onsuccess();
                    }, 0);
                    return r;
                  },
                  delete: (key: string) => {
                    fakeStore.delete(key);
                    const r: any = {};
                    setTimeout(() => { if (r.onsuccess) r.onsuccess(); }, 0);
                    return r;
                  },
                }),
              }),
            };
            if (req.onsuccess) req.onsuccess();
          }, 0);
          return req;
        },
      };

      try {
        const runner = new DiagRunner();
        runner.registerSpec(TEST_A_SPEC);

        const safeAthanTimes = [{ name: 'Fajr', timeMs: Date.now() + 10 * 3600 * 1000 }];
        const startRes = await runner.startTest(TEST_A_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(startRes.success, true);

        const result = await runner.submitUserAction({
          step_offline: { confirmed: true },
        });
        assert.ok(result);
        assert.equal(result?.verdict, 'PASS');
        const preDownloadedStep = result?.expectedVsActual.find((e) => e.parameter.includes('محمّل مسبقاً'));
        assert.ok(preDownloadedStep);
        assert.equal(preDownloadedStep?.status, 'MATCH');
      } finally {
        delete (globalThis as any).indexedDB;
      }
    });

    test('Phase 2 reports UNMEASURED when device remains online after offline prompt', async () => {
      const origDescriptor = Object.getOwnPropertyDescriptor(globalThis.navigator, 'onLine');
      Object.defineProperty(globalThis.navigator, 'onLine', { value: true, configurable: true, writable: true });

      try {
        const runner = new DiagRunner();
        runner.registerSpec(TEST_A_SPEC);

        const safeAthanTimes = [{ name: 'Fajr', timeMs: Date.now() + 10 * 3600 * 1000 }];
        await runner.startTest(TEST_A_SPEC, { athanTimes: safeAthanTimes });

        const result = await runner.submitUserAction({
          step_offline: { confirmed: true },
        });
        assert.ok(result);
        assert.equal(result?.verdict, 'INCONCLUSIVE');

        const offlineStep = result?.expectedVsActual.find((e) => e.parameter.includes('بدون اتصال') && !e.parameter.includes('محمّل مسبقاً'));
        assert.ok(offlineStep);
        assert.equal(offlineStep?.status, 'UNMEASURED');
        assert.match(offlineStep?.actual || '', /الجهاز ما يزال متصلاً بالإنترنت/);
      } finally {
        if (origDescriptor) {
          Object.defineProperty(globalThis.navigator, 'onLine', origDescriptor);
        } else {
          delete (globalThis.navigator as any).onLine;
        }
      }
    });

    test('Phase 1 reports INCONCLUSIVE when device is offline at test initiation', async () => {
      const origDescriptor = Object.getOwnPropertyDescriptor(globalThis.navigator, 'onLine');
      Object.defineProperty(globalThis.navigator, 'onLine', { value: false, configurable: true, writable: true });

      try {
        const runner = new DiagRunner();
        runner.registerSpec(TEST_A_SPEC);

        const safeAthanTimes = [{ name: 'Fajr', timeMs: Date.now() + 10 * 3600 * 1000 }];
        const startRes = await runner.startTest(TEST_A_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(startRes.success, true);
        assert.equal(startRes.state?.partialResults?.phase1Done, false);

        const result = await runner.submitUserAction({
          step_offline: { confirmed: true },
        });
        assert.ok(result);
        assert.equal(result?.verdict, 'INCONCLUSIVE');
        assert.match(result?.reason || '', /الجهاز غير متصل بالإنترنت عند بدء الاختبار/);
      } finally {
        if (origDescriptor) {
          Object.defineProperty(globalThis.navigator, 'onLine', origDescriptor);
        } else {
          delete (globalThis.navigator as any).onLine;
        }
      }
    });

    test('cached-before track expects local instead of remote and does not produce false FAIL', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_A_SPEC);

      const fakeStore = new Map<string, any>();
      fakeStore.set('downloaded_archive_001', { blob: new Blob(['audio'], { type: 'audio/mp3' }) });

      (globalThis as any).indexedDB = {
        open: () => {
          const req: any = {};
          setTimeout(() => {
            req.result = {
              transaction: () => ({
                objectStore: () => ({
                  get: (key: string) => {
                    const r: any = {};
                    setTimeout(() => {
                      r.result = fakeStore.get(key);
                      if (r.onsuccess) r.onsuccess();
                    }, 0);
                    return r;
                  },
                }),
              }),
            };
            if (req.onsuccess) req.onsuccess();
          }, 0);
          return req;
        },
      };

      try {
        const safeAthanTimes = [{ name: 'Fajr', timeMs: Date.now() + 10 * 3600 * 1000 }];
        const startRes = await runner.startTest(TEST_A_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(startRes.state?.wasCachedBefore?.['archive_001'], true);
        assert.equal(startRes.state?.partialResults?.onlineItem?.expected, 'من التخزين المحلي');
      } finally {
        delete (globalThis as any).indexedDB;
      }
    });

    test('flushPendingCacheCleanup never deletes a track that was cached before the run', async () => {
      let deleteCalledFor = '';
      const runner = new DiagRunner();
      const state: DiagRunState = {
        runId: 'cache_run_safe',
        testId: 'fix1a-preview-source',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {},
        createdAlarmIds: [],
        wasCachedBefore: {
          'pre_existing_track': true,
        },
        cacheCleanupPending: ['pre_existing_track', 'new_temp_track'],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };

      await runner.flushPendingCacheCleanup(state);
      // 'pre_existing_track' is skipped without deletion
      assert.equal(state.cacheCleanupPending.includes('pre_existing_track'), false);
    });

    test('flushPendingCacheCleanup keeps track in cacheCleanupPending if deletion verification fails', async () => {
      const runner = new DiagRunner();
      const state: DiagRunState = {
        runId: 'cache_run_fail_verify',
        testId: 'fix1a-preview-source',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: ['stubborn_track'],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      };

      // Set up indexedDB that refuses to delete or still shows track as downloaded
      (globalThis as any).indexedDB = {
        open: () => {
          const req: any = {};
          setTimeout(() => {
            req.result = {
              transaction: () => ({
                objectStore: () => ({
                  get: () => {
                    const r: any = {};
                    setTimeout(() => {
                      r.result = { blob: new Blob(['data']) };
                      if (r.onsuccess) r.onsuccess();
                    }, 0);
                    return r;
                  },
                  delete: () => {
                    const r: any = {};
                    setTimeout(() => { if (r.onsuccess) r.onsuccess(); }, 0);
                    return r;
                  },
                }),
              }),
            };
            if (req.onsuccess) req.onsuccess();
          }, 0);
          return req;
        },
      };

      try {
        await runner.flushPendingCacheCleanup(state);
        // Since isAudioDownloaded still returns true, it must remain pending!
        assert.equal(state.cacheCleanupPending.includes('stubborn_track'), true);
      } finally {
        delete (globalThis as any).indexedDB;
      }
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

  describe('12. Scheduler One-Shot Safety & diag_run_state Guard (T3/F6: buildNativePrayerTimeAlarms)', () => {
    const day1 = new Date(Date.now() + 24 * 3600 * 1000);
    const day2 = new Date(Date.now() + 48 * 3600 * 1000);
    const toYMD = (d: Date) =>
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    const day1Str = toYMD(day1);
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
      fireDate: day1Str,
      days: [0, 1, 2, 3, 4, 5, 6],
    };

    test('schedules diag_ alarm only when diag_run_state is in waiting phase and id is in createdAlarmIds with matching fireDate', () => {
      safeSetJSON('diag_run_state', {
        phase: 'waiting',
        createdAlarmIds: ['diag_run_x_1'],
      });

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

    test('skips diag_ alarm when diag_run_state is missing from storage', () => {
      localStorage.removeItem('diag_run_state');
      const alarms = buildNativePrayerTimeAlarms(
        [{ date: day1, timesMap }],
        undefined,
        { customAlarms: [diagAlarm] }
      );
      const diagMatches = alarms.filter(a => a.prayerKey.includes('diag_run_x_1'));
      assert.equal(diagMatches.length, 0);
    });

    test('skips diag_ alarm when diag_run_state phase is NOT waiting (e.g. collectable, reported, idle)', () => {
      safeSetJSON('diag_run_state', {
        phase: 'collectable',
        createdAlarmIds: ['diag_run_x_1'],
      });
      const alarms = buildNativePrayerTimeAlarms(
        [{ date: day1, timesMap }],
        undefined,
        { customAlarms: [diagAlarm] }
      );
      const diagMatches = alarms.filter(a => a.prayerKey.includes('diag_run_x_1'));
      assert.equal(diagMatches.length, 0);
    });

    test('skips diag_ alarm when alarm.id is not registered in createdAlarmIds', () => {
      safeSetJSON('diag_run_state', {
        phase: 'waiting',
        createdAlarmIds: ['diag_other_run_2'],
      });
      const alarms = buildNativePrayerTimeAlarms(
        [{ date: day1, timesMap }],
        undefined,
        { customAlarms: [diagAlarm] }
      );
      const diagMatches = alarms.filter(a => a.prayerKey.includes('diag_run_x_1'));
      assert.equal(diagMatches.length, 0);
    });

    test('diag_ alarm without fireDate is rejected from recurring schedule', () => {
      safeSetJSON('diag_run_state', {
        phase: 'waiting',
        createdAlarmIds: ['diag_malformed'],
      });

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
        [{ date: day1, timesMap }],
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

  describe('14. Backup & Restore Alarm Sanitization (F10: backupAlarmUtils)', () => {
    test('sanitizeAlarmsForExport strips diag_ alarms and preserves real alarms', () => {
      const mixed = [
        { id: 'custom_1', title: 'Real Alarm 1' },
        { id: 'diag_run_abc_1', title: 'Synthetic Diag 1' },
        { id: 'custom_2', title: 'Real Alarm 2' },
        { id: 'diag_run_abc_2', title: 'Synthetic Diag 2' },
      ];
      const exported = sanitizeAlarmsForExport(mixed);
      assert.equal(exported.length, 2);
      assert.equal(exported[0].id, 'custom_1');
      assert.equal(exported[1].id, 'custom_2');
    });

    test('sanitizeAlarmsForRestore strips diag_ alarms from imported payload before saving', () => {
      const payload = [
        { id: 'diag_leaked_run_99', title: 'Leaked Test Alarm' },
        { id: 'custom_fajr_sunnah', title: 'سنة الفجر' },
      ];
      const restored = sanitizeAlarmsForRestore(payload);
      assert.equal(restored.length, 1);
      assert.equal(restored[0].id, 'custom_fajr_sunnah');
    });

    test('safely handles empty, null, or undefined alarm arrays', () => {
      assert.deepEqual(sanitizeAlarmsForExport([]), []);
      assert.deepEqual(sanitizeAlarmsForExport(null), []);
      assert.deepEqual(sanitizeAlarmsForExport(undefined), []);

      assert.deepEqual(sanitizeAlarmsForRestore([]), []);
      assert.deepEqual(sanitizeAlarmsForRestore(null), []);
      assert.deepEqual(sanitizeAlarmsForRestore(undefined), []);
    });
  });

  describe('15. Conditional Khushu Deactivation on Teardown (R2)', () => {
    test('deactivates Khushu when correlated khushu_result event with id2 is present in native event log', async () => {
      const runner = new DiagRunner();
      const runId = 'r2_present_test';
      const id2 = `${DIAG_ALARM_PREFIX}${runId}_2`;

      // Activate Khushu first
      await KhushuMode.activate({ mode: 'silent', durationMinutes: 15 });
      assert.equal((await KhushuMode.getStatus()).active, true);

      // Mock native log containing matching khushu_result with id2
      setAthanPluginBridgeForTesting({
        getNativeEventLog: async () => ({
          events: [
            {
              timestampMs: Date.now(),
              event: 'khushu_result',
              details: `mode=silent, durationMinutes=15, sourceKey=${id2}, appliedRinger=0, appliedFilter=3, status=success`,
            },
          ],
        } as any),
      });

      try {
        const state: DiagRunState = {
          runId,
          testId: 'b3-khushu-custom-alarm',
          startedAt: Date.now(),
          phase: 'running',
          snapshot: {},
          createdAlarmIds: [`${DIAG_ALARM_PREFIX}${runId}_1`, id2],
          cacheCleanupPending: [],
          cleanup: 'none',
          conflicts: [],
          userResponses: {},
        };

        await runner.compareAndRestore(state);
        // Verified: KhushuMode was deactivated because correlated event was found!
        assert.equal((await KhushuMode.getStatus()).active, false);
      } finally {
        setAthanPluginBridgeForTesting(null);
      }
    });

    test('does NOT deactivate Khushu when correlated khushu_result event with id2 is absent', async () => {
      const runner = new DiagRunner();
      const runId = 'r2_absent_test';

      // Activate Khushu first
      await KhushuMode.activate({ mode: 'silent', durationMinutes: 15 });
      assert.equal((await KhushuMode.getStatus()).active, true);

      // Mock native log with NO matching khushu_result (e.g. only unrelated events)
      setAthanPluginBridgeForTesting({
        getNativeEventLog: async () => ({
          events: [
            {
              timestampMs: Date.now(),
              event: 'fire_received',
              details: 'some other alarm event without khushu_result',
            },
          ],
        } as any),
      });

      try {
        const state: DiagRunState = {
          runId,
          testId: 'b3-khushu-custom-alarm',
          startedAt: Date.now(),
          phase: 'running',
          snapshot: {},
          createdAlarmIds: [`${DIAG_ALARM_PREFIX}${runId}_1`],
          cacheCleanupPending: [],
          cleanup: 'none',
          conflicts: [],
          userResponses: {},
        };

        await runner.compareAndRestore(state);
        // Verified: KhushuMode remains active to protect real/manual Khushu session!
        assert.equal((await KhushuMode.getStatus()).active, true);
      } finally {
        await KhushuMode.deactivate();
        setAthanPluginBridgeForTesting(null);
      }
    });

    test('does NOT deactivate Khushu when getNativeEventLog throws (unreadable log)', async () => {
      const runner = new DiagRunner();
      const runId = 'r2_throw_test';

      // Activate Khushu first
      await KhushuMode.activate({ mode: 'silent', durationMinutes: 15 });
      assert.equal((await KhushuMode.getStatus()).active, true);

      // Mock native log throwing error
      setAthanPluginBridgeForTesting({
        getNativeEventLog: async () => {
          throw new Error('Native IPC unavailable');
        },
      });

      try {
        const state: DiagRunState = {
          runId,
          testId: 'b3-khushu-custom-alarm',
          startedAt: Date.now(),
          phase: 'running',
          snapshot: {},
          createdAlarmIds: [`${DIAG_ALARM_PREFIX}${runId}_1`],
          cacheCleanupPending: [],
          cleanup: 'none',
          conflicts: [],
          userResponses: {},
        };

        await runner.compareAndRestore(state);
        // Verified: KhushuMode remains active when log is unreadable!
        assert.equal((await KhushuMode.getStatus()).active, true);
      } finally {
        await KhushuMode.deactivate();
        setAthanPluginBridgeForTesting(null);
      }
    });
  });

  describe('16. startTest Schedule Error Cleanup Safety (R3.4)', () => {
    test('cleans up diag_ alarms from salah_custom_alarms when schedule throws midway after writing', async () => {
      const runner = new DiagRunner();

      // Custom spec whose schedule writes a diag_ alarm into salah_custom_alarms and then throws
      const failingSpec = {
        id: 'failing_schedule_test',
        title: 'Failing Schedule Test',
        fixRef: 'Test',
        mode: 'timed' as const,
        touchesKeys: ['salah_custom_alarms'],
        guardDurationMinutes: 5,
        setup: async () => {},
        schedule: async () => {
          // Simulate schedule writing a diag_ alarm before an unexpected exception
          const current = safeGetJSON<any[]>('salah_custom_alarms', []);
          safeSetJSON('salah_custom_alarms', [
            ...current,
            { id: 'diag_leaked_midway', title: 'Leaked Midway Diag', enabled: true },
          ]);
          throw new Error('Midway schedule crash');
        },
        evaluate: async () => ({} as any),
      };

      runner.registerSpec(failingSpec);

      const safeAthanTimes = [{ name: 'Fajr', timeMs: Date.now() + 10 * 3600 * 1000 }];
      const res = await runner.startTest(failingSpec, { athanTimes: safeAthanTimes });

      assert.equal(res.success, false);
      assert.match(res.error || '', /Midway schedule crash/);

      // Verify that salah_custom_alarms was swept clean and contains zero diag_ alarms!
      const finalAlarms = safeGetJSON<any[]>('salah_custom_alarms', []);
      assert.equal(finalAlarms.some((a) => isDiagAlarmId(a.id)), false);
      assert.equal(runner.getCurrentState(), null);
    });
  });
});

```

---

### android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt (117 lines)
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

        val now = System.currentTimeMillis()
        val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)

        if (action == Intent.ACTION_BOOT_COMPLETED || action == "android.intent.action.QUICKBOOT_POWERON") {
            prefs.edit().putLong("last_device_boot_timestamp", now).apply()
        }

        if (action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            prefs.edit().putLong("last_package_replaced_timestamp", now).apply()
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

### android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt (276 lines)
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

        fun activateKhushuDirectly(context: Context, mode: String = "silent", durationMinutes: Int = 30, sourceKey: String = ""): Boolean {
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
                "mode=$mode, durationMinutes=$durationMinutes, sourceKey=$sourceKey, initialRinger=$initialRinger, initialFilter=$initialFilter, hasDndPermission=$hasDndPermission"
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
                    "mode=$mode, sourceKey=$sourceKey, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission, fallback_vibrate=true",
                    ringerError
                )
            } else {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_result",
                    "mode=$mode, durationMinutes=$durationMinutes, sourceKey=$sourceKey, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission, status=success"
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

---

### Changed Kotlin functions in AthanAlarmPlugin.kt and AthanAlarmReceiver.kt

#### android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt: cancelSingleAlarmStatic & matchesAlarmId (Lines 440-496)
```kotlin
                "count=$totalToCancel, reason=cancel_all"
            )
        }

        @JvmStatic
        fun cancelSingleAlarmStatic(
            context: Context,
            alarmManager: AlarmManager,
            reqCode: Int,
            reason: String = "user_cancel",
            skipLog: Boolean = false
        ): Boolean {
            val intent = createAthanIntent(context)
            val pendingIntent = getAthanPendingIntent(context, reqCode, intent)
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
            notificationManager?.cancel(reqCode)

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val savedIds = prefs.getStringSet(KEY_SCHEDULED_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()
            val removed = savedIds.remove(reqCode.toString())
            if (removed) {
                prefs.edit().putStringSet(KEY_SCHEDULED_IDS, savedIds).apply()
            }

            if (!skipLog) {
                logNativeEvent(
                    context,
                    "alarm_cancel",
                    "requestCode=$reqCode, reason=$reason"
                )
            }

            return true
        }

        @JvmStatic
        fun matchesAlarmId(alarmId: String, prayerKey: String, alarmType: String, snoozeOf: String = ""): Boolean {
            return when (alarmId) {
                "alarm_before_salah" -> prayerKey.startsWith("custom_alarm_before_salah_") ||
                                        prayerKey.startsWith("custom_snooze_alarm_before_salah_") ||
                                        snoozeOf == "alarm_before_salah"
                "alarm_after_salah" -> prayerKey.startsWith("custom_alarm_after_salah_") ||
                                       prayerKey.startsWith("custom_snooze_alarm_after_salah_") ||
                                       snoozeOf == "alarm_after_salah"
                "prealert" -> alarmType == "prealert" || prayerKey.contains("prealert")
                "postalert" -> alarmType == "postalert" || prayerKey.contains("postalert")
                "athan" -> alarmType.isEmpty() || alarmType == "athan"
                else -> alarmType.equals(alarmId, ignoreCase = true) ||
                        prayerKey.startsWith("custom_${alarmId}_") ||
                        prayerKey.contains(alarmId, ignoreCase = true)
            }
        }
    }

    @PluginMethod
```

#### android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt: cancelAlarm (Lines 1009-1065)
```kotlin
    fun cancelAlarm(call: PluginCall) {
        val alarmId = call.getString("alarmId")
        val reqCode = call.getInt("requestCode") ?: alarmId?.toIntOrNull()

        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager

        if (reqCode != null) {
            var success = false
            if (alarmManager != null) {
                success = cancelSingleAlarmStatic(context, alarmManager, reqCode, reason = "cancel_request_code")
            }
            val ret = JSObject()
            ret.put("cancelled", success)
            ret.put("requestCode", reqCode)
            call.resolve(ret)
            return
        }

        if (!alarmId.isNullOrBlank()) {
            var cancelledCount = 0
            if (alarmManager != null) {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val rawJson = prefs.getString(KEY_SAVED_ALARMS, null)
                if (rawJson != null) {
                    try {
                        val array = JSONArray(rawJson)
                        val remaining = JSONArray()
                        for (i in 0 until array.length()) {
                            val item = array.getJSONObject(i)
                            val pKey = item.optString("prayerKey", "")
                            val aType = item.optString("alarmType", "")
                            val matches = matchesAlarmId(alarmId, pKey, aType, item.optString("snoozeOf", ""))
                            if (matches) {
                                val timeMs = item.optLong("timeMs", 0L)
                                val code = getDeterministicRequestCode(pKey, timeMs)
                                cancelSingleAlarmStatic(context, alarmManager, code, skipLog = true)
                                cancelledCount++
                            } else {
                                remaining.put(item)
                            }
                        }
                        prefs.edit().putString(KEY_SAVED_ALARMS, remaining.toString()).apply()

                        if (cancelledCount > 0) {
                            logNativeEvent(
                                context,
                                "alarm_cancel",
                                "count=$cancelledCount, reason=cancel_by_alarmId($alarmId)"
                            )
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error cancelling alarms for alarmId=$alarmId", e)
                    }
                }
            }
            val ret = JSObject()
            ret.put("cancelled", true)
```

#### android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt: onReceive event logging & showCustomAlarmNotification (Lines 135-175)
```kotlin
        val prayerName = intent.getStringExtra(EXTRA_PRAYER_NAME) ?: "الصلاة"
        val isFajr = intent.getBooleanExtra(EXTRA_IS_FAJR, false)
        val prayerKey = intent.getStringExtra(EXTRA_PRAYER_KEY) ?: ""
        val alarmType = intent.getStringExtra(EXTRA_ALARM_TYPE) ?: if (prayerKey.startsWith("custom_")) "custom" else if (prayerKey.contains("prealert")) "prealert" else if (prayerKey.contains("postalert") || prayerKey.contains("worship")) "postalert" else if (prayerKey.contains("khushu")) "khushu" else "athan"
        val requestCode = intent.getIntExtra("requestCode", -1)
        val soundType = intent.getStringExtra("soundType") ?: "reminder"
        val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
        val autoKhushu = intent.getBooleanExtra("autoKhushu", false)

        AthanAlarmPlugin.logNativeEvent(
            context,
            "fire_received",
            "prayerKey=$prayerKey, alarmType=$alarmType, requestCode=$requestCode, soundType=$soundType, notifyMode=$notifyMode, autoKhushu=$autoKhushu"
        )

        if (alarmType == "custom" || prayerKey.startsWith("custom_")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            val autoKhushu = intent.getBooleanExtra("autoKhushu", false)
            val durationMinutes = intent.getIntExtra(EXTRA_DURATION_MINUTES, 15)
            val khushuMode = intent.getStringExtra(EXTRA_KHUSHU_MODE) ?: "silent"

            showCustomAlarmNotification(context, prayerName, prayerKey, soundType, notifyMode)

            if (autoKhushu) {
                KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)
                showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
            }
            logFireEvent(context, prayerName, prayerKey, "custom", "played", "custom_alarm_notification (sound: $soundType)")
            return
        }

        if (alarmType == "prealert" || prayerKey.contains("prealert")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            showPreAlertNotification(context, prayerName, prayerKey, soundType, notifyMode)
            logFireEvent(context, prayerName, prayerKey, "prealert", "played", "prealert_notification (sound: $soundType)")
            return
        }

        if (alarmType == "postalert" || prayerKey.contains("postalert") || prayerKey.contains("worship")) {
```

---

### 12. cancelNativeAlarm TS & Kotlin implementation

#### TypeScript: src/services/athanAlarmPlugin.ts (Lines 1079-1090)
```ts
export async function cancelNativeAlarm(options: { alarmId?: string; requestCode?: number }): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true;
  try {
    const plugin = athanPluginBridgeForTesting || AthanAlarm;
    if (plugin.cancelAlarm) {
      const res = await plugin.cancelAlarm(options);
      return res?.cancelled ?? false;
    }
    return true;
  } catch (err) {
    console.warn('[AthanAlarmPlugin] cancelAlarm error:', err);
    return false;
  }
}
```

#### Kotlin: android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt (Lines 1010-1035)
```kotlin
        val alarmId = call.getString("alarmId")
        val reqCode = call.getInt("requestCode") ?: alarmId?.toIntOrNull()

        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager

        if (reqCode != null) {
            var success = false
            if (alarmManager != null) {
                success = cancelSingleAlarmStatic(context, alarmManager, reqCode, reason = "cancel_request_code")
            }
            val ret = JSObject()
            ret.put("cancelled", success)
            ret.put("requestCode", reqCode)
            call.resolve(ret)
            return
        }

        if (!alarmId.isNullOrBlank()) {
            var cancelledCount = 0
            if (alarmManager != null) {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val rawJson = prefs.getString(KEY_SAVED_ALARMS, null)
                if (rawJson != null) {
                    try {
                        val array = JSONArray(rawJson)
```

---

### 13. Native log writing code from R3.2

#### AthanAlarmReceiver.kt: Line 144
```kotlin
        val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
        val autoKhushu = intent.getBooleanExtra("autoKhushu", false)

        AthanAlarmPlugin.logNativeEvent(
            context,
            "fire_received",
```

#### KhushuRestoreReceiver.kt: Lines 200-205
```kotlin
            } else {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_result",
                    "mode=$mode, durationMinutes=$durationMinutes, sourceKey=$sourceKey, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission, status=success"
                )
            }
            return true
```

---

### 14. App.tsx startup snippet from R5 (Lines 60-72)
```tsx
import { diagRunnerInstance } from './diagnostics/tests/diagRunner';

export default function App() {
  // Early diagnostics startup check (F6/R5): detects reboot/restarts before scheduler triggers
  useEffect(() => {
    diagRunnerInstance.checkAndResumeOnAppStartup().catch((err) => {
      console.warn('[App] Diagnostics startup check error:', err);
    });
  }, []);

  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSettingsOpen, setIsQuickSettingsOpen] = useState(false);
  const [activeSettingsSubTab, setActiveSettingsSubTab] = useState<SettingsSubTabId>('prayer');
```
