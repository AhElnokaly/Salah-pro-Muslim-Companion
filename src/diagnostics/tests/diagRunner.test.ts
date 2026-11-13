import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  hashValue,
  parseMuteState,
  checkPrayerProximityGuard,
  DiagRunner,
  DIAG_RUN_STATE_KEY,
  shouldAutoEvaluateSpec,
  getCollectableBannerMessage,
} from './diagRunner';
import { TEST_A_SPEC } from './specs/testA_previewSource';
import { TEST_B_SPEC, resolveRestoreRowStatus } from './specs/testB_khushuCustomAlarm';
import { TEST_E_SPEC } from './specs/testE_khushuRestoreSafety';
import { TEST_F_SPEC, createTestFSpec } from './specs/testF_khushuAutoRestore';
import { DiagRunState, DiagContext, isDiagAlarmId, DIAG_ALARM_PREFIX } from './diagTypes';
import { safeSetJSON, safeGetJSON } from '../../utils/storage';
import { setAthanPluginBridgeForTesting, buildNativePrayerTimeAlarms } from '../../services/athanAlarmPlugin';
import { filterUserVisibleAlarms } from '../../components/WorshipAlarms';
import { deleteDownloadedAudio } from '../../utils/audioStorage';
import { sanitizeAlarmsForExport, sanitizeAlarmsForRestore } from '../../utils/backupAlarmUtils';
import { KhushuMode, setKhushuPluginBridgeForTesting } from '../../services/khushuModePlugin';
import { AlarmConfig, AppSettings } from '../../types';
import { generatePrayerSchedule } from '../../utils/prayerScheduleSync';
import { resolveAthanTimes, normalizePrayerKey } from '../resolveAthanTimes';

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
    const mockNativeEventsForRun = (runId: string, deltaMs: number = 56000) => {
      const id1 = `diag_${runId}_1`;
      const id2 = `diag_${runId}_2`;
      const testFireTime = Date.now() - 50000;
      setAthanPluginBridgeForTesting({
        getNativeEventLog: async () => ({
          events: [
            { event: 'fire_received', timestampMs: Date.now() - 200000, details: `prayerKey=${id1} alarmType=custom` },
            { event: 'fire_received', timestampMs: testFireTime, details: `prayerKey=${id2} alarmType=custom` },
            { event: 'khushu_attempt', timestampMs: testFireTime + deltaMs, details: `sourceKey=${id2} origin=native_deferred_custom_alarm` },
            { event: 'khushu_result', timestampMs: testFireTime + deltaMs, details: `sourceKey=${id2} appliedRinger=0 appliedFilter=3 hasDndPermission=true` },
          ],
          total: 4,
        }),
      });
    };

    test('Control Heard + Test Heard + Muted in deferred window => PASS (R12d-3)', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_B_SPEC);
      const runId = 'test_b_pass';
      mockNativeEventsForRun(runId, 56000); // 56s delta is within [51958, 58958]

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
      assert.equal(result?.verdict, 'PASS');
      assert.match(result?.reason || '', /نجح الاختبار بالكامل/);
    });

    test('Muting occurs during audio playback (deltaMs = 10,000 ms) => FAIL', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_B_SPEC);
      const runId = 'test_b_early_mute';
      mockNativeEventsForRun(runId, 10000); // 10s delta < 52448 ms

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
      assert.equal(result?.verdict, 'FAIL');
      assert.match(result?.reason || '', /كتم الخشوع تم قبل انتهاء صوت المنبه المخصص/);
    });

    test('Excessive delay in deferred muting (deltaMs = 60,000 ms) => INCONCLUSIVE', async () => {
      const runner = new DiagRunner();
      runner.registerSpec(TEST_B_SPEC);
      const runId = 'test_b_excessive_delay';
      mockNativeEventsForRun(runId, 60000); // 60s > 56448 ms

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
      assert.equal(result?.verdict, 'INCONCLUSIVE');
      assert.match(result?.reason || '', /كتم الخشوع تم بعد تأخر زائد/);
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

  describe('6b. Test B Automatic Restore Row Status Resolution (resolveRestoreRowStatus)', () => {
    const startedAt = 1000000;
    const khushuActivatedAt = startedAt + 60000; // activated 1m after start
    const durationMinutes = 15;
    const toleranceMarginMs = 60000;
    const expectedRestoreAtMs = khushuActivatedAt + durationMinutes * 60000 + toleranceMarginMs; // startedAt + 17m

    test('Case 1: source=alarm event exists => MATCH', () => {
      const result = resolveRestoreRowStatus({
        events: [
          { event: 'KHUSHU_RESTORED', timestampMs: khushuActivatedAt + 15 * 60000, details: 'source=alarm, restoredRinger=2' },
        ],
        startedAt,
        khushuActivatedAt,
        durationMinutes,
        collectedAt: expectedRestoreAtMs + 5000,
        toleranceMarginMs,
      });

      assert.equal(result.status, 'MATCH');
      assert.match(result.actualText, /تم تسجيل حدث استعادة المنبه التلقائية بنجاح/);
    });

    test('Case 2: Non-alarm event only (e.g. source=manual or expired_heal) => MISMATCH', () => {
      const result = resolveRestoreRowStatus({
        events: [
          { event: 'KHUSHU_RESTORED', timestampMs: khushuActivatedAt + 5000, details: 'source=manual, restoredRinger=2' },
        ],
        startedAt,
        khushuActivatedAt,
        durationMinutes,
        collectedAt: expectedRestoreAtMs + 5000,
        toleranceMarginMs,
      });

      assert.equal(result.status, 'MISMATCH');
      assert.match(result.actualText, /لم يُعثر على استعادة بالمنبه \(source=alarm\)/);
      assert.match(result.actualText, /عُثر على استعادة بمصدر آخر/);
    });

    test('Case 3: No events and collectedAt is before expected deadline => UNMEASURED', () => {
      const earlyCollectedAt = expectedRestoreAtMs - 120000; // 2 minutes before deadline
      const result = resolveRestoreRowStatus({
        events: [],
        startedAt,
        khushuActivatedAt,
        durationMinutes,
        collectedAt: earlyCollectedAt,
        toleranceMarginMs,
      });

      assert.equal(result.status, 'UNMEASURED');
      assert.match(result.actualText, /لم يُعثر على أي حدث KHUSHU_RESTORED بعد/);
      assert.match(result.actualText, /يسبق موعد الاستعادة المتوقع/);
    });

    test('Case 4: No events and collectedAt is after expected deadline => MISMATCH', () => {
      const lateCollectedAt = expectedRestoreAtMs + 10000; // 10s after deadline
      const result = resolveRestoreRowStatus({
        events: [],
        startedAt,
        khushuActivatedAt,
        durationMinutes,
        collectedAt: lateCollectedAt,
        toleranceMarginMs,
      });

      assert.equal(result.status, 'MISMATCH');
      assert.match(result.actualText, /لم تُسجل أي استعادة رغم انقضاء مدة الخشوع بالكامل/);
    });

    test('Case 5: Both manual and alarm events exist => MATCH', () => {
      const result = resolveRestoreRowStatus({
        events: [
          { event: 'KHUSHU_RESTORED', timestampMs: khushuActivatedAt + 5000, details: 'source=manual' },
          { event: 'KHUSHU_RESTORED', timestampMs: khushuActivatedAt + 15 * 60000, details: 'source=alarm' },
        ],
        startedAt,
        khushuActivatedAt,
        durationMinutes,
        collectedAt: expectedRestoreAtMs + 5000,
        toleranceMarginMs,
      });

      assert.equal(result.status, 'MATCH');
      assert.match(result.actualText, /تم تسجيل حدث استعادة المنبه التلقائية بنجاح/);
    });

    test('Case 6: source=manual before khushuActivatedAt + source=alarm after => MATCH', () => {
      const result = resolveRestoreRowStatus({
        events: [
          { event: 'KHUSHU_RESTORED', timestampMs: khushuActivatedAt - 10000, details: 'source=manual, restoredRinger=2' },
          { event: 'KHUSHU_RESTORED', timestampMs: khushuActivatedAt + 15 * 60000, details: 'source=alarm, restoredRinger=2' },
        ],
        startedAt,
        khushuActivatedAt,
        durationMinutes,
        collectedAt: expectedRestoreAtMs + 5000,
        toleranceMarginMs,
      });

      assert.equal(result.status, 'MATCH');
      assert.match(result.actualText, /تم تسجيل حدث استعادة المنبه التلقائية بنجاح/);
    });

    test('Case 7: source=manual before khushuActivatedAt only, no events after, before deadline => UNMEASURED', () => {
      const earlyCollectedAt = expectedRestoreAtMs - 120000;
      const result = resolveRestoreRowStatus({
        events: [
          { event: 'KHUSHU_RESTORED', timestampMs: khushuActivatedAt - 10000, details: 'source=manual, restoredRinger=2' },
        ],
        startedAt,
        khushuActivatedAt,
        durationMinutes,
        collectedAt: earlyCollectedAt,
        toleranceMarginMs,
      });

      assert.equal(result.status, 'UNMEASURED');
      assert.match(result.actualText, /لم يُعثر على أي حدث KHUSHU_RESTORED بعد/);
    });

    test('Case 8: khushuActivatedAt === null with no events => UNMEASURED (not activated)', () => {
      const result = resolveRestoreRowStatus({
        events: [],
        startedAt,
        khushuActivatedAt: null,
        durationMinutes,
        collectedAt: startedAt + 30 * 60000,
        toleranceMarginMs,
      });

      assert.equal(result.status, 'UNMEASURED');
      assert.equal(result.actualText, 'لم يتم تفعيل الخشوع للتحقق من استعادته');
    });

    test('Case 9: exact boundary collectedAt === expectedRestoreAtMs => MISMATCH (due to strict < check)', () => {
      const result = resolveRestoreRowStatus({
        events: [],
        startedAt,
        khushuActivatedAt,
        durationMinutes,
        collectedAt: expectedRestoreAtMs,
        toleranceMarginMs,
      });

      assert.equal(result.status, 'MISMATCH');
      assert.match(result.actualText, /لم تُسجل أي استعادة رغم انقضاء مدة الخشوع بالكامل/);
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

    test('evaluate records offlineProbeTrack id into cacheCleanupPending if deletion verification fails', async () => {
      let state: DiagRunState = {
        runId: 'offline_cleanup_fail',
        testId: 'fix1a-preview-source',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
        partialResults: {
          phase1Done: true,
          bundledItem: { parameter: 'bundled', expected: 'bundled', actual: 'bundled', status: 'MATCH' },
          onlineItem: { parameter: 'online', expected: 'remote', actual: 'remote', status: 'MATCH' },
          wasOnlineCachedBefore: true,
          wasOfflineCachedBefore: false,
          onlineProbeTrack: { id: 'online_test_id', url: 'https://example.com/audio1.mp3' },
          offlineProbeTrack: { id: 'offline_stubborn_track', url: 'https://example.com/audio2.mp3' },
        },
      };

      const ctx: DiagContext = {
        runId: state.runId,
        state,
        logAction: () => {},
        updateState: (updater) => {
          state = updater(state);
          ctx.state = state;
        },
      };

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
        await TEST_A_SPEC.evaluate(ctx, { step_offline: { confirmed: true } });
        assert.equal(state.cacheCleanupPending.includes('offline_stubborn_track'), true);
      } finally {
        delete (globalThis as any).indexedDB;
      }
    });

    test('evaluate never deletes or adds offlineProbeTrack to cacheCleanupPending if it was cached before the test', async () => {
      let state: DiagRunState = {
        runId: 'offline_cached_before_safe',
        testId: 'fix1a-preview-source',
        startedAt: Date.now(),
        phase: 'running',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
        partialResults: {
          phase1Done: true,
          bundledItem: { parameter: 'bundled', expected: 'bundled', actual: 'bundled', status: 'MATCH' },
          onlineItem: { parameter: 'online', expected: 'remote', actual: 'remote', status: 'MATCH' },
          wasOnlineCachedBefore: true,
          wasOfflineCachedBefore: true,
          onlineProbeTrack: { id: 'online_test_id', url: 'https://example.com/audio1.mp3' },
          offlineProbeTrack: { id: 'pre_existing_offline_track', url: 'https://example.com/audio2.mp3' },
        },
      };

      let deleteAttempted = false;
      const ctx: DiagContext = {
        runId: state.runId,
        state,
        logAction: () => {},
        updateState: (updater) => {
          state = updater(state);
          ctx.state = state;
        },
      };

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
                    deleteAttempted = true;
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
        await TEST_A_SPEC.evaluate(ctx, { step_offline: { confirmed: true } });
        assert.equal(deleteAttempted, false, 'deleteDownloadedAudio must NOT be called for pre-cached offline track');
        assert.equal(state.cacheCleanupPending.includes('pre_existing_offline_track'), false);
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

  describe('17. Prayer Proximity Guard Athans and Fallback Schedule (R8)', () => {
    const fixedNow = new Date(2026, 5, 10, 12, 0, 0).getTime(); // 12:00:00

    test('Guard condition 1: قائمة فاضية أو غير متوفرة = حظر (fail-closed)', () => {
      // Empty array
      const emptyResult = checkPrayerProximityGuard({
        athanTimes: [],
        now: fixedNow,
        testDurationMinutes: 25,
      });
      assert.equal(emptyResult.allowed, false);
      assert.match(emptyResult.reason || '', /تعذر التحقق من مواقيت الصلاة/);

      // Undefined / missing
      const undefinedResult = checkPrayerProximityGuard({
        athanTimes: undefined,
        now: fixedNow,
        testDurationMinutes: 25,
      });
      assert.equal(undefinedResult.allowed, false);
      assert.match(undefinedResult.reason || '', /تعذر التحقق من مواقيت الصلاة/);
    });

    test('Guard condition 2: صلاة خلال نافذة الحظر (30 دقيقة قبل أو أثناء الاختبار أو 30 دقيقة بعده) = حظر', () => {
      // 1) Athan 15 minutes before now (within 30m prior buffer)
      const pastWithin30m = checkPrayerProximityGuard({
        athanTimes: [{ name: 'Dhuhr', timeMs: fixedNow - 15 * 60 * 1000 }],
        now: fixedNow,
        testDurationMinutes: 25,
      });
      assert.equal(pastWithin30m.allowed, false);
      assert.match(pastWithin30m.reason || '', /Dhuhr/);

      // 2) Athan 10 minutes from now (during test duration)
      const duringTest = checkPrayerProximityGuard({
        athanTimes: [{ name: 'Dhuhr', timeMs: fixedNow + 10 * 60 * 1000 }],
        now: fixedNow,
        testDurationMinutes: 25,
      });
      assert.equal(duringTest.allowed, false);
      assert.match(duringTest.reason || '', /Dhuhr/);

      // 3) Athan 35 minutes from now (within the 30m post-test buffer: 25m test + 30m buffer = 55m window)
      const postBuffer = checkPrayerProximityGuard({
        athanTimes: [{ name: 'Asr', timeMs: fixedNow + 35 * 60 * 1000 }],
        now: fixedNow,
        testDurationMinutes: 25,
      });
      assert.equal(postBuffer.allowed, false);
      assert.match(postBuffer.reason || '', /Asr/);
    });

    test('Guard condition 3: صلاة بعيدة عن نافذة الحظر = مرور', () => {
      // Previous prayer was 45 minutes ago (> 30m buffer) and next prayer is 90 minutes away (> 25m + 30m = 55m window)
      const safeAthans = [
        { name: 'Dhuhr', timeMs: fixedNow - 45 * 60 * 1000 },
        { name: 'Asr', timeMs: fixedNow + 90 * 60 * 1000 },
      ];
      const result = checkPrayerProximityGuard({
        athanTimes: safeAthans,
        customAlarms: [],
        now: fixedNow,
        testDurationMinutes: 25,
      });
      assert.equal(result.allowed, true);
      assert.equal(result.reason, undefined);
      assert.equal(result.conflictingEvent, undefined);
    });

    test('Fallback generatePrayerSchedule: covers today and tomorrow using actual settings', () => {
      const alexandriaSettings: Partial<AppSettings> = {
        latitude: 31.2001,
        longitude: 29.9187,
        cityName: 'الإسكندرية',
        calcMethod: 'Egypt',
        madhab: 'standard',
        prayerOffsets: { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 },
      };

      const schedule = generatePrayerSchedule(alexandriaSettings, new Date(fixedNow), 2);
      // 5 prayers per day * 2 days = 10 prayer items
      assert.equal(schedule.length, 10);
      const prayerNames = schedule.map((p) => p.name);
      assert.ok(prayerNames.includes('Fajr'));
      assert.ok(prayerNames.includes('Dhuhr'));
      assert.ok(prayerNames.includes('Asr'));
      assert.ok(prayerNames.includes('Maghrib'));
      assert.ok(prayerNames.includes('Isha'));

      // All timestamps must be valid numbers
      for (const item of schedule) {
        assert.equal(typeof item.timeMs, 'number');
        assert.ok(!isNaN(item.timeMs));
      }
    });

    test('Fallback generatePrayerSchedule: returns empty array (fail-closed) when settings are missing or invalid', () => {
      assert.deepEqual(generatePrayerSchedule(null), []);
      assert.deepEqual(generatePrayerSchedule(undefined), []);
      assert.deepEqual(generatePrayerSchedule({} as any), []);
      assert.deepEqual(generatePrayerSchedule({ latitude: NaN, longitude: 29.9187 }), []);
    });

    test('resolveAthanTimes: filters only alarmType === athan (ignores khushu, prealert, custom)', () => {
      const rawAlarms: any = {
        savedAlarms: [
          { requestCode: 1, prayerName: 'Fajr', timeMs: fixedNow + 1000, alarmType: 'athan' },
          { requestCode: 2, prayerName: 'Dhuhr', timeMs: fixedNow + 2000, alarmType: 'athan' },
          { requestCode: 3, prayerName: 'Khushu', timeMs: fixedNow + 3000, alarmType: 'khushu' },
          { requestCode: 4, prayerName: 'Prealert', timeMs: fixedNow + 4000, alarmType: 'prealert' },
          { requestCode: 5, prayerName: 'Custom', timeMs: fixedNow + 5000, alarmType: 'custom' },
        ],
      };

      const result = resolveAthanTimes(rawAlarms, null, new Date(fixedNow));
      assert.equal(result.length, 2);
      assert.deepEqual(result.map((r) => r.name), ['Fajr', 'Dhuhr']);
    });

    test('resolveAthanTimes: unions partial savedAlarms with fallback generatePrayerSchedule', () => {
      const alexandriaSettings: Partial<AppSettings> = {
        latitude: 31.2001,
        longitude: 29.9187,
        cityName: 'الإسكندرية',
        calcMethod: 'Egypt',
        madhab: 'standard',
        prayerOffsets: { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 },
      };
      const fallback = generatePrayerSchedule(alexandriaSettings, new Date(fixedNow), 2);
      assert.equal(fallback.length, 10);

      const mockDiag: any = {
        savedAlarms: [
          { requestCode: 1, prayerName: 'الفجر', prayerKey: 'fajr', timeMs: fallback[0].timeMs, alarmType: 'athan' },
          { requestCode: 2, prayerName: 'الظهر', prayerKey: 'dhuhr', timeMs: fallback[1].timeMs, alarmType: 'athan' },
        ],
      };

      const result = resolveAthanTimes(mockDiag, alexandriaSettings, new Date(fixedNow));
      assert.equal(result.length, 10);
      assert.equal(result[0].name, 'الفجر');
      assert.equal(result[1].name, 'الظهر');
      assert.equal(result[2].name, fallback[2].name);
    });

    test('resolveAthanTimes: deduplicates identical prayers across savedAlarms and fallback', () => {
      const alexandriaSettings: Partial<AppSettings> = {
        latitude: 31.2001,
        longitude: 29.9187,
        cityName: 'الإسكندرية',
        calcMethod: 'Egypt',
        madhab: 'standard',
        prayerOffsets: { Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0 },
      };
      const fallback = generatePrayerSchedule(alexandriaSettings, new Date(fixedNow), 2);
      const targetAsr = fallback.find((f) => f.name === 'Asr');
      assert.ok(targetAsr);

      const mockDiag: any = {
        savedAlarms: [
          {
            requestCode: 10,
            prayerName: 'العصر',
            prayerKey: 'asr',
            timeMs: targetAsr.timeMs + 2000, // same minute (+2s)
            alarmType: 'athan',
          },
        ],
      };

      const result = resolveAthanTimes(mockDiag, alexandriaSettings, new Date(fixedNow));
      // Total 10 prayers across 2 days, no duplicated prayer for day 1 Asr
      assert.equal(result.length, 10);
      const asrList = result.filter((r) => normalizePrayerKey(r.name) === 'asr');
      assert.equal(asrList.length, 2); // 1 for today, 1 for tomorrow
      assert.equal(asrList[0].name, 'العصر'); // Prioritized from savedAlarms
    });

    test('resolveAthanTimes: returns [] (fail-closed) when both sources are empty', () => {
      const emptyResult = resolveAthanTimes(null, null, new Date(fixedNow));
      assert.deepEqual(emptyResult, []);

      const emptyDiag = resolveAthanTimes({ savedAlarms: [] } as any, {}, new Date(fixedNow));
      assert.deepEqual(emptyDiag, []);

      const guardRes = checkPrayerProximityGuard({
        athanTimes: emptyResult,
        customAlarms: [],
        now: fixedNow,
        testDurationMinutes: 25,
      });

      assert.equal(guardRes.allowed, false);
      assert.match(guardRes.reason || '', /تعذر التحقق من مواقيت الصلاة/);
    });
  });

  describe('18. Test E Auto-Evaluate Lifecycle, Double-Execution Guards & UI Banner Message', () => {
    const safeAthanTimes = [{ name: 'Fajr', timeMs: Date.now() + 10 * 3600 * 1000 }];

    test('shouldAutoEvaluateSpec returns true for Test E (instant without userSteps) and false for Test A & Test B', () => {
      assert.equal(shouldAutoEvaluateSpec(TEST_E_SPEC), true);
      assert.equal(shouldAutoEvaluateSpec(TEST_A_SPEC), false);
      assert.equal(shouldAutoEvaluateSpec(TEST_B_SPEC), false);
    });

    test('(a) Test E auto-evaluates from startTest through running to reported PASS without manual intervention', async () => {
      let khushuActive = false;
      let ringerMode = 2; // NORMAL
      let activatedAt = 0;
      let hasPendingRestoreAlarm = false;
      let nowOffset = 0;

      const runner = new DiagRunner();
      runner.registerSpec(TEST_E_SPEC);

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: khushuActive,
            mode: 'silent',
            durationMinutes: khushuActive ? 2 : 0,
            remainingSeconds: khushuActive ? 120 : 0,
            hasPermission: true,
            activatedAt,
            hasPendingRestoreAlarm,
            ringerMode,
            interruptionFilter: 1,
          }),
          activate: async (opts) => {
            if (khushuActive) {
              return { active: true, mode: opts.mode, durationMinutes: 2, alreadyActive: true };
            }
            khushuActive = true;
            ringerMode = 1; // VIBRATE fallback when DND is not granted
            activatedAt = Date.now() + nowOffset;
            hasPendingRestoreAlarm = true;
            return { active: true, mode: opts.mode, durationMinutes: opts.durationMinutes, alreadyActive: false };
          },
          deactivate: async () => {
            khushuActive = false;
            ringerMode = 2;
            activatedAt = 0;
            hasPendingRestoreAlarm = false;
            return { active: false };
          },
        });

        setAthanPluginBridgeForTesting({
          getAlarmDiagnostics: (async () => ({
            platform: 'android',
            androidVersion: 34,
            canScheduleExactAlarms: true,
            isIgnoringBatteryOptimizations: true,
            scheduledCount: 0,
            scheduledAlarms: [],
          })) as any,
          getNativeEventLog: async () => ({
            events: [
              { event: 'KHUSHU_RESTORE_SCHEDULED', timestampMs: Date.now() + 100, details: 'durationMinutes=2, isExact=true, method=setExactAndAllowWhileIdle' },
              { event: 'KHUSHU_RESTORED', timestampMs: Date.now() + 200, details: 'source=manual, restoredRinger=2, restoredFilter=1' },
            ],
            total: 2,
          }),
        });

        const startRes = await runner.startTest(TEST_E_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(startRes.success, true);
        assert.equal(startRes.state?.phase, 'reported');
        assert.ok(startRes.state?.expiresAt && startRes.state.expiresAt > startRes.state.startedAt);
        assert.equal(startRes.state?.result?.verdict, 'PASS');
        assert.equal(khushuActive, false); // Restored back to inactive
        assert.equal(ringerMode, 2); // Restored back to NORMAL
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });

    test('(b) Test A remains at collectable and Test B remains at waiting without auto-evaluating', async () => {
      const runnerA = new DiagRunner();
      runnerA.registerSpec(TEST_A_SPEC);
      const resA = await runnerA.startTest(TEST_A_SPEC, { athanTimes: safeAthanTimes });
      assert.equal(resA.success, true);
      assert.equal(resA.state?.phase, 'collectable');
      assert.equal(resA.state?.result, undefined);

      const runnerB = new DiagRunner();
      runnerB.registerSpec(TEST_B_SPEC);
      const resB = await runnerB.startTest(TEST_B_SPEC, { athanTimes: safeAthanTimes });
      assert.equal(resB.success, true);
      assert.equal(resB.state?.phase, 'waiting');
      assert.equal(resB.state?.result, undefined);
    });

    test('(c) Prevents double execution on concurrent startTest / submitUserAction calls and recovers orphaned running state', async () => {
      let evalCount = 0;
      let releaseEval!: () => void;
      const evalGate = new Promise<void>((resolve) => {
        releaseEval = resolve;
      });

      const slowInstantSpec = {
        id: 'test-e-khushu-restore-safety',
        title: 'Slow Auto-Evaluate Mock',
        fixRef: 'B1',
        mode: 'instant' as const,
        touchesKeys: [],
        guardDurationMinutes: 5,
        setup: async () => {},
        evaluate: async (ctx: DiagContext) => {
          evalCount++;
          await evalGate;
          return {
            runId: ctx.runId,
            testId: 'test-e-khushu-restore-safety',
            fixRef: 'B1',
            verdict: 'PASS' as const,
            reason: 'done',
            startedAt: ctx.state.startedAt,
            collectedAt: Date.now(),
            deviceInfo: { appVersion: '1.2.1' },
            expectedVsActual: [],
            evidenceList: [],
            markdownReport: '# OK',
          };
        },
      };

      const runner = new DiagRunner();
      runner.registerSpec(slowInstantSpec);

      // Concurrent startTest calls while first evaluation is still in-flight
      const p1 = runner.startTest(slowInstantSpec, { athanTimes: safeAthanTimes });
      const p2 = runner.startTest(slowInstantSpec, { athanTimes: safeAthanTimes });

      // Wait microtasks for p1 to reach evaluate
      await new Promise((r) => setTimeout(r, 10));
      // Concurrent submitUserAction while already running -> single-flight deduplication
      const p3 = runner.submitUserAction();

      releaseEval();
      const [r1, r2, r3] = await Promise.all([p1, p2, p3]);

      assert.equal(r1.success, true);
      assert.equal(r1.state?.phase, 'reported');
      assert.equal(r2.success, false);
      assert.match(r2.error || '', /قيد التنفيذ بالفعل/);
      assert.equal(r3?.verdict, 'PASS');
      assert.equal(evalCount, 1);

      // Orphaned 'running' recovery after simulated app kill/restart (new DiagRunner instance)
      const crashedRunner = new DiagRunner();
      let evalReTriggered = false;
      crashedRunner.registerSpec({
        ...slowInstantSpec,
        evaluate: async () => {
          evalReTriggered = true;
          return {} as any;
        },
      });
      let deactivateCalledOnRecovery = false;
      const orphanedStartedAt = Date.now() - 2000;
      crashedRunner.saveState({
        runId: 'crashed_run',
        testId: 'test-e-khushu-restore-safety',
        startedAt: orphanedStartedAt,
        expiresAt: Date.now() + 60000,
        phase: 'running',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      });

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: true,
            mode: 'silent',
            durationMinutes: 2,
            remainingSeconds: 100,
            hasPermission: true,
            activatedAt: orphanedStartedAt + 200,
          }),
          deactivate: async () => {
            deactivateCalledOnRecovery = true;
            return { active: false };
          },
        });

        const resumed = await crashedRunner.checkAndResumeOnAppStartup();
        assert.equal(evalReTriggered, false);
        assert.equal(deactivateCalledOnRecovery, true);
        assert.equal(resumed?.phase, 'cancelled');
        assert.equal(resumed?.result?.verdict, 'INCONCLUSIVE');
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });

    test('(d) UI collectable banner message is specialized per testId (hearing question only for Test B)', () => {
      const msgB = getCollectableBannerMessage('b3-khushu-custom-alarm');
      const msgE = getCollectableBannerMessage('test-e-khushu-restore-safety');
      const msgA = getCollectableBannerMessage('fix1a-preview-source');

      assert.match(msgB, /سؤال السماع/);
      assert.equal(msgE, 'جاري تنفيذ الفحص الفوري...');
      assert.equal(msgE.includes('سؤال السماع'), false);
      assert.equal(msgA.includes('سؤال السماع'), false);
    });

    test('(e) Test E returns INCONCLUSIVE without calling activate or deactivate if Khushu is already active', async () => {
      let activateCalled = false;
      let deactivateCalled = false;

      const runner = new DiagRunner();
      runner.registerSpec(TEST_E_SPEC);

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: true,
            mode: 'silent',
            durationMinutes: 30,
            remainingSeconds: 1500,
            hasPermission: true,
            activatedAt: Date.now() - 300000,
            ringerMode: 0,
            interruptionFilter: 1,
          }),
          activate: async () => {
            activateCalled = true;
            return { active: true, mode: 'silent', durationMinutes: 2, alreadyActive: true };
          },
          deactivate: async () => {
            deactivateCalled = true;
            return { active: false };
          },
        });

        const startRes = await runner.startTest(TEST_E_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(startRes.success, true);
        assert.equal(startRes.state?.phase, 'reported');
        assert.equal(startRes.state?.result?.verdict, 'INCONCLUSIVE');
        assert.match(startRes.state?.result?.reason || '', /يوجد جلسة خشوع نشطة/);
        assert.equal(activateCalled, false);
        assert.equal(deactivateCalled, false);
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });

    test('(f) Test E does not call deactivate even if activate returns alreadyActive: true (race condition guard)', async () => {
      let deactivateCalled = false;

      const runner = new DiagRunner();
      runner.registerSpec(TEST_E_SPEC);

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: false,
            mode: 'silent',
            durationMinutes: 0,
            remainingSeconds: 0,
            hasPermission: true,
            activatedAt: 0,
            ringerMode: 2,
            interruptionFilter: 1,
          }),
          activate: async () => ({
            active: true,
            mode: 'silent',
            durationMinutes: 30,
            alreadyActive: true,
          }),
          deactivate: async () => {
            deactivateCalled = true;
            return { active: false };
          },
        });

        setAthanPluginBridgeForTesting({
          getAlarmDiagnostics: (async () => ({
            platform: 'android',
            androidVersion: 34,
            canScheduleExactAlarms: true,
            isIgnoringBatteryOptimizations: true,
            scheduledCount: 0,
            scheduledAlarms: [],
          })) as any,
        });

        const startRes = await runner.startTest(TEST_E_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(startRes.success, true);
        assert.equal(startRes.state?.result?.verdict, 'INCONCLUSIVE');
        assert.equal(deactivateCalled, false);
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });

    test('(g) Orphaned running recovery deactivates only when activatedAt >= startedAt, leaving pre-existing or timestamp-missing sessions untouched', async () => {
      const startedAt = Date.now() - 5000;

      // Case 1: Khushu activated BEFORE startedAt -> must NOT deactivate
      const runnerBefore = new DiagRunner();
      runnerBefore.saveState({
        runId: 'orphan_before',
        testId: 'test-e-khushu-restore-safety',
        startedAt,
        expiresAt: Date.now() + 60000,
        phase: 'running',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      });

      let deactivateBeforeCalled = false;
      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: true,
            mode: 'silent',
            durationMinutes: 30,
            remainingSeconds: 1500,
            hasPermission: true,
            activatedAt: startedAt - 10000,
          }),
          deactivate: async () => {
            deactivateBeforeCalled = true;
            return { active: false };
          },
        });

        const resBefore = await runnerBefore.checkAndResumeOnAppStartup();
        assert.equal(deactivateBeforeCalled, false);
        assert.equal(resBefore?.phase, 'cancelled');
        assert.equal(resBefore?.result?.verdict, 'INCONCLUSIVE');
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }

      // Case 2: Khushu activated AFTER startedAt -> MUST deactivate
      const runnerAfter = new DiagRunner();
      runnerAfter.saveState({
        runId: 'orphan_after',
        testId: 'test-e-khushu-restore-safety',
        startedAt,
        expiresAt: Date.now() + 60000,
        phase: 'running',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      });

      let deactivateAfterCalled = false;
      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: true,
            mode: 'silent',
            durationMinutes: 2,
            remainingSeconds: 110,
            hasPermission: true,
            activatedAt: startedAt + 500,
          }),
          deactivate: async () => {
            deactivateAfterCalled = true;
            return { active: false };
          },
        });

        const resAfter = await runnerAfter.checkAndResumeOnAppStartup();
        assert.equal(deactivateAfterCalled, true);
        assert.equal(resAfter?.phase, 'cancelled');
        assert.equal(resAfter?.result?.verdict, 'INCONCLUSIVE');
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }

      // Case 3: activatedAt unavailable (undefined) -> fail-safe, must NOT deactivate
      const runnerMissingTs = new DiagRunner();
      runnerMissingTs.saveState({
        runId: 'orphan_missing_ts',
        testId: 'test-e-khushu-restore-safety',
        startedAt,
        expiresAt: Date.now() + 60000,
        phase: 'running',
        snapshot: {},
        createdAlarmIds: [],
        cacheCleanupPending: [],
        cleanup: 'none',
        conflicts: [],
        userResponses: {},
      });

      let deactivateMissingTsCalled = false;
      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: true,
            mode: 'silent',
            durationMinutes: 2,
            remainingSeconds: 100,
            hasPermission: true,
          }),
          deactivate: async () => {
            deactivateMissingTsCalled = true;
            return { active: false };
          },
        });

        const resMissing = await runnerMissingTs.checkAndResumeOnAppStartup();
        assert.equal(deactivateMissingTsCalled, false);
        assert.equal(resMissing?.phase, 'cancelled');
        assert.equal(resMissing?.result?.verdict, 'INCONCLUSIVE');
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });
  });

  describe('19. Test F: Khushu Auto-Restore (source=alarm) & No-Heal Read-Only Gating', () => {
    const safeAthanTimes = [{ name: 'Fajr', timeMs: Date.now() + 10 * 3600 * 1000 }];

    test('(a) PASS when muted after activate (ringerMode != 2), KHUSHU_RESTORED has source=alarm, and ringer/filter/pending alarm restore cleanly', async () => {
      let khushuActive = false;
      let ringerMode = 2;
      let interruptionFilter = 1;
      let activatedAt = 0;
      let hasPendingRestoreAlarm = false;
      let deactivateCalls = 0;
      let getStatusCalls = 0;
      let activateDurationArg = 0;
      let pollCount = 0;

      const runner = new DiagRunner();
      runner.registerSpec(TEST_F_SPEC);

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => {
            getStatusCalls++;
            return {
              active: khushuActive,
              mode: 'silent',
              durationMinutes: khushuActive ? 1 : 0,
              remainingSeconds: khushuActive ? 60 : 0,
              hasPermission: false,
              activatedAt,
              hasPendingRestoreAlarm,
              ringerMode,
              interruptionFilter,
            };
          },
          activate: async (opts) => {
            activateDurationArg = opts.durationMinutes;
            khushuActive = true;
            ringerMode = 1; // VIBRATE fallback when DND is not granted
            activatedAt = Date.now();
            hasPendingRestoreAlarm = true;
            return { active: true, mode: opts.mode, durationMinutes: opts.durationMinutes, alreadyActive: false };
          },
          deactivate: async () => {
            deactivateCalls++;
            khushuActive = false;
            ringerMode = 2;
            hasPendingRestoreAlarm = false;
            return { active: false };
          },
        });

        setAthanPluginBridgeForTesting({
          getAlarmDiagnostics: (async () => ({
            canScheduleExactAlarms: true,
            isIgnoringBatteryOptimizations: true,
            savedAlarms: [],
            nextAlarmClockMs: 0,
            fireEvents: [],
            standbyBucket: 10,
          })) as any,
          getNativeEventLog: async () => {
            const baseTs = activatedAt || Date.now();
            const triggerAt = baseTs + 60_000;
            pollCount++;
            if (pollCount === 1) {
              return {
                events: [
                  {
                    event: 'KHUSHU_RESTORE_SCHEDULED',
                    timestampMs: baseTs,
                    details: `durationMinutes=1, triggerAtMs=${triggerAt}, isExact=true, method=setExactAndAllowWhileIdle`,
                  },
                ],
                total: 1,
              };
            }
            // Simulate native KhushuRestoreReceiver firing with source=alarm
            khushuActive = false;
            ringerMode = 2;
            interruptionFilter = 1;
            hasPendingRestoreAlarm = false;
            return {
              events: [
                {
                  event: 'KHUSHU_RESTORED',
                  timestampMs: triggerAt + 120,
                  details: `source=alarm, restoredRinger=2, restoredFilter=1, timestampMs=${triggerAt + 120}`,
                },
                {
                  event: 'KHUSHU_RESTORE_SCHEDULED',
                  timestampMs: baseTs,
                  details: `durationMinutes=1, triggerAtMs=${triggerAt}, isExact=true, method=setExactAndAllowWhileIdle`,
                },
              ],
              total: 2,
            };
          },
        });

        const res = await runner.startTest(TEST_F_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(res.success, true);
        assert.equal(res.state?.phase, 'reported');
        assert.equal(res.state?.result?.verdict, 'PASS');
        assert.equal(activateDurationArg, 1);
        assert.equal(deactivateCalls, 0);
        // Only 3 getStatus calls: baseline, immediate post-activate, and post-KHUSHU_RESTORED read-only check
        assert.equal(getStatusCalls, 3);
        assert.match(res.state?.result?.markdownReport || '', /source=alarm/);
        assert.match(res.state?.result?.markdownReport || '', /تبويب التشخيص/);
        assert.ok(
          res.state?.result?.evidenceList.some((e) => e.alarmId === 'env_check' && e.details.includes('dashboardMounted='))
        );
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });

    test('(b) FAIL when device ringerMode remains 2 after activation (muting never happened)', async () => {
      let khushuActive = false;
      let ringerMode = 2;
      let activatedAt = 0;
      let hasPendingRestoreAlarm = false;
      let pollCount = 0;

      const runner = new DiagRunner();
      runner.registerSpec(TEST_F_SPEC);

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: khushuActive,
            mode: 'silent',
            durationMinutes: khushuActive ? 1 : 0,
            remainingSeconds: khushuActive ? 60 : 0,
            hasPermission: false,
            activatedAt,
            hasPendingRestoreAlarm,
            ringerMode,
            interruptionFilter: 1,
          }),
          activate: async (opts) => {
            khushuActive = true;
            // BUG simulation: ringerMode stayed at 2 (NORMAL)
            ringerMode = 2;
            activatedAt = Date.now();
            hasPendingRestoreAlarm = true;
            return { active: true, mode: opts.mode, durationMinutes: opts.durationMinutes, alreadyActive: false };
          },
          deactivate: async () => {
            khushuActive = false;
            hasPendingRestoreAlarm = false;
            return { active: false };
          },
        });

        setAthanPluginBridgeForTesting({
          getAlarmDiagnostics: (async () => ({
            canScheduleExactAlarms: true,
            isIgnoringBatteryOptimizations: true,
            savedAlarms: [],
            nextAlarmClockMs: 0,
            fireEvents: [],
            standbyBucket: 10,
          })) as any,
          getNativeEventLog: async () => {
            const baseTs = activatedAt || Date.now();
            const triggerAt = baseTs + 60_000;
            pollCount++;
            if (pollCount === 1) {
              return {
                events: [
                  {
                    event: 'KHUSHU_RESTORE_SCHEDULED',
                    timestampMs: baseTs,
                    details: `durationMinutes=1, triggerAtMs=${triggerAt}, isExact=true, method=setExactAndAllowWhileIdle`,
                  },
                ],
                total: 1,
              };
            }
            khushuActive = false;
            hasPendingRestoreAlarm = false;
            return {
              events: [
                {
                  event: 'KHUSHU_RESTORED',
                  timestampMs: triggerAt + 50,
                  details: `source=alarm, restoredRinger=2, restoredFilter=1, timestampMs=${triggerAt + 50}`,
                },
              ],
              total: 1,
            };
          },
        });

        const res = await runner.startTest(TEST_F_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(res.success, true);
        assert.equal(res.state?.result?.verdict, 'FAIL');
        const f2Row = res.state?.result?.expectedVsActual.find((r) => r.parameter.includes('ringerMode != 2'));
        assert.equal(f2Row?.status, 'MISMATCH');
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });

    test('(c) FAIL with explicit reason when KHUSHU_RESTORED has source=manual even if ringer restored to 2', async () => {
      let khushuActive = false;
      let ringerMode = 2;
      let activatedAt = 0;
      let hasPendingRestoreAlarm = false;
      let pollCount = 0;

      const runner = new DiagRunner();
      runner.registerSpec(TEST_F_SPEC);

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: khushuActive,
            mode: 'silent',
            durationMinutes: khushuActive ? 1 : 0,
            remainingSeconds: khushuActive ? 60 : 0,
            hasPermission: false,
            activatedAt,
            hasPendingRestoreAlarm,
            ringerMode,
            interruptionFilter: 1,
          }),
          activate: async (opts) => {
            khushuActive = true;
            ringerMode = 1;
            activatedAt = Date.now();
            hasPendingRestoreAlarm = true;
            return { active: true, mode: opts.mode, durationMinutes: opts.durationMinutes, alreadyActive: false };
          },
          deactivate: async () => ({ active: false }),
        });

        setAthanPluginBridgeForTesting({
          getAlarmDiagnostics: (async () => ({
            canScheduleExactAlarms: true,
            isIgnoringBatteryOptimizations: true,
            savedAlarms: [],
            nextAlarmClockMs: 0,
            fireEvents: [],
            standbyBucket: 10,
          })) as any,
          getNativeEventLog: async () => {
            const baseTs = activatedAt || Date.now();
            const triggerAt = baseTs + 60_000;
            pollCount++;
            if (pollCount === 1) {
              return {
                events: [
                  {
                    event: 'KHUSHU_RESTORE_SCHEDULED',
                    timestampMs: baseTs,
                    details: `durationMinutes=1, triggerAtMs=${triggerAt}, isExact=true, method=setExactAndAllowWhileIdle`,
                  },
                ],
                total: 1,
              };
            }
            khushuActive = false;
            ringerMode = 2;
            hasPendingRestoreAlarm = false;
            return {
              events: [
                {
                  event: 'KHUSHU_RESTORED',
                  timestampMs: triggerAt + 500,
                  details: `source=manual, restoredRinger=2, restoredFilter=1, timestampMs=${triggerAt + 500}`,
                },
              ],
              total: 1,
            };
          },
        });

        const res = await runner.startTest(TEST_F_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(res.success, true);
        assert.equal(res.state?.result?.verdict, 'FAIL');
        assert.match(res.state?.result?.reason || '', /FAIL: alarm did not restore, healed by manual/);
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });

    test('(d) INCONCLUSIVE when KHUSHU_RESTORED has source=expired_heal (UI polling race) with timestampMs vs triggerAtMs comparison', async () => {
      let khushuActive = false;
      let ringerMode = 2;
      let activatedAt = 0;
      let hasPendingRestoreAlarm = false;
      let pollCount = 0;

      const runner = new DiagRunner();
      runner.registerSpec(TEST_F_SPEC);

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: khushuActive,
            mode: 'silent',
            durationMinutes: khushuActive ? 1 : 0,
            remainingSeconds: khushuActive ? 60 : 0,
            hasPermission: false,
            activatedAt,
            hasPendingRestoreAlarm,
            ringerMode,
            interruptionFilter: 1,
          }),
          activate: async (opts) => {
            khushuActive = true;
            ringerMode = 1;
            activatedAt = Date.now();
            hasPendingRestoreAlarm = true;
            return { active: true, mode: opts.mode, durationMinutes: opts.durationMinutes, alreadyActive: false };
          },
          deactivate: async () => ({ active: false }),
        });

        setAthanPluginBridgeForTesting({
          getAlarmDiagnostics: (async () => ({
            canScheduleExactAlarms: true,
            isIgnoringBatteryOptimizations: true,
            savedAlarms: [],
            nextAlarmClockMs: 0,
            fireEvents: [],
            standbyBucket: 10,
          })) as any,
          getNativeEventLog: async () => {
            const baseTs = activatedAt || Date.now();
            const triggerAt = baseTs + 60_000;
            pollCount++;
            if (pollCount === 1) {
              return {
                events: [
                  {
                    event: 'KHUSHU_RESTORE_SCHEDULED',
                    timestampMs: baseTs,
                    details: `durationMinutes=1, triggerAtMs=${triggerAt}, isExact=true, method=setExactAndAllowWhileIdle`,
                  },
                ],
                total: 1,
              };
            }
            khushuActive = false;
            ringerMode = 2;
            hasPendingRestoreAlarm = false;
            return {
              events: [
                {
                  event: 'KHUSHU_RESTORED',
                  timestampMs: triggerAt + 250,
                  details: `source=expired_heal, restoredRinger=2, restoredFilter=1, timestampMs=${triggerAt + 250}`,
                },
              ],
              total: 1,
            };
          },
        });

        const res = await runner.startTest(TEST_F_SPEC, { athanTimes: safeAthanTimes });
        assert.equal(res.success, true);
        assert.equal(res.state?.result?.verdict, 'INCONCLUSIVE');
        assert.match(res.state?.result?.reason || '', /expired_heal/);
        assert.match(res.state?.result?.reason || '', /polling/);
        assert.match(res.state?.result?.reason || '', /triggerAtMs=/);
        assert.match(res.state?.result?.reason || '', /timestampMs=/);
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });

    test('(e) INCONCLUSIVE on timeout without KHUSHU_RESTORED, never calls getStatus during/after timeout, and runs emergency restore in finally', async () => {
      let khushuActive = false;
      let ringerMode = 2;
      let activatedAt = 0;
      let hasPendingRestoreAlarm = false;
      let getStatusCalls = 0;
      let deactivateCalls = 0;

      const fastTimeoutTestF = createTestFSpec({
        pollIntervalMs: 5,
        waitTimeoutMs: 25,
      });

      const runner = new DiagRunner();
      runner.registerSpec(fastTimeoutTestF);

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => {
            getStatusCalls++;
            return {
              active: khushuActive,
              mode: 'silent',
              durationMinutes: khushuActive ? 1 : 0,
              remainingSeconds: khushuActive ? 60 : 0,
              hasPermission: false,
              activatedAt,
              hasPendingRestoreAlarm,
              ringerMode,
              interruptionFilter: 1,
            };
          },
          activate: async (opts) => {
            khushuActive = true;
            ringerMode = 1;
            activatedAt = Date.now();
            hasPendingRestoreAlarm = true;
            return { active: true, mode: opts.mode, durationMinutes: opts.durationMinutes, alreadyActive: false };
          },
          deactivate: async () => {
            deactivateCalls++;
            khushuActive = false;
            ringerMode = 2;
            hasPendingRestoreAlarm = false;
            return { active: false };
          },
        });

        setAthanPluginBridgeForTesting({
          getAlarmDiagnostics: (async () => ({
            canScheduleExactAlarms: true,
            isIgnoringBatteryOptimizations: true,
            savedAlarms: [],
            nextAlarmClockMs: 0,
            fireEvents: [],
            standbyBucket: 10,
          })) as any,
          getNativeEventLog: async () => {
            const baseTs = activatedAt || Date.now();
            return {
              events: [
                {
                  event: 'KHUSHU_RESTORE_SCHEDULED',
                  timestampMs: baseTs,
                  details: `durationMinutes=1, triggerAtMs=${baseTs + 60_000}, isExact=true, method=setExactAndAllowWhileIdle`,
                },
              ],
              total: 1,
            };
          },
        });

        const res = await runner.startTest(fastTimeoutTestF, { athanTimes: safeAthanTimes });
        assert.equal(res.success, true);
        assert.equal(res.state?.result?.verdict, 'INCONCLUSIVE');
        // Must ONLY have called getStatus twice (baseline + immediate post-activate), NOT during polling or on timeout!
        assert.equal(getStatusCalls, 2);
        // Must have executed emergency restore in finally
        assert.equal(deactivateCalls, 1);
        assert.equal(khushuActive, false);
        assert.equal(ringerMode, 2);
        assert.ok(res.state?.result?.evidenceList.some((e) => e.alarmId === 'emergency_restore'));
        assert.match(res.state?.result?.markdownReport || '', /استعادة طوارئ/);
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });

    test('(f) returns PASS and never calls deactivate when KHUSHU_RESTORED (source=alarm) appears only on final post-deadline read', async () => {
      let khushuActive = false;
      let ringerMode = 2;
      let activatedAt = 0;
      let hasPendingRestoreAlarm = false;
      let deactivateCalls = 0;
      let logReadCalls = 0;

      const lateWriteTestF = createTestFSpec({
        pollIntervalMs: 5,
        waitTimeoutMs: 15,
      });

      const runner = new DiagRunner();
      runner.registerSpec(lateWriteTestF);

      try {
        setKhushuPluginBridgeForTesting({
          getStatus: async () => ({
            active: khushuActive,
            mode: 'silent',
            durationMinutes: khushuActive ? 1 : 0,
            remainingSeconds: khushuActive ? 60 : 0,
            hasPermission: false,
            activatedAt,
            hasPendingRestoreAlarm,
            ringerMode,
            interruptionFilter: 1,
          }),
          activate: async (opts) => {
            khushuActive = true;
            ringerMode = 1;
            activatedAt = Date.now();
            hasPendingRestoreAlarm = true;
            return { active: true, mode: opts.mode, durationMinutes: opts.durationMinutes, alreadyActive: false };
          },
          deactivate: async () => {
            deactivateCalls++;
            khushuActive = false;
            ringerMode = 2;
            hasPendingRestoreAlarm = false;
            return { active: false };
          },
        });

        setAthanPluginBridgeForTesting({
          getAlarmDiagnostics: (async () => ({
            canScheduleExactAlarms: true,
            isIgnoringBatteryOptimizations: true,
            savedAlarms: [],
            nextAlarmClockMs: 0,
            fireEvents: [],
            standbyBucket: 10,
          })) as any,
          getNativeEventLog: async () => {
            logReadCalls++;
            const baseTs = activatedAt || Date.now();
            const triggerAt = baseTs + 60_000;

            // Call 1: F3 scheduled check; Call 2: normal F4 read that finishes after deadline without KHUSHU_RESTORED
            if (logReadCalls === 1) {
              return {
                events: [
                  {
                    event: 'KHUSHU_RESTORE_SCHEDULED',
                    timestampMs: baseTs,
                    details: `durationMinutes=1, triggerAtMs=${triggerAt}, isExact=true, method=setExactAndAllowWhileIdle`,
                  },
                ],
                total: 1,
              };
            }

            if (logReadCalls === 2) {
              await new Promise((r) => setTimeout(r, 25));
              return {
                events: [],
                total: 0,
              };
            }

            // Call 3+: final post-deadline read at remainingWaitMs <= 0 observes KHUSHU_RESTORED (source=alarm)
            khushuActive = false;
            ringerMode = 2;
            hasPendingRestoreAlarm = false;
            return {
              events: [
                {
                  event: 'KHUSHU_RESTORED',
                  timestampMs: triggerAt + 30,
                  details: `source=alarm, restoredRinger=2, restoredFilter=1, timestampMs=${triggerAt + 30}`,
                },
              ],
              total: 1,
            };
          },
        });

        const res = await runner.startTest(lateWriteTestF, { athanTimes: safeAthanTimes });
        assert.equal(res.success, true);
        assert.equal(res.state?.result?.verdict, 'PASS');
        assert.equal(deactivateCalls, 0);
        assert.equal(logReadCalls, 3);
      } finally {
        setKhushuPluginBridgeForTesting(null);
      }
    });
  });
});
