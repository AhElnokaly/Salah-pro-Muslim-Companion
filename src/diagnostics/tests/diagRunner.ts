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

