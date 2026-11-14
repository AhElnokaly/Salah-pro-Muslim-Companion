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
