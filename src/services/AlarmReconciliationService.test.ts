/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import AthanAlarm, {
  AlarmDiagnosticsResult,
  getLastScheduledOptions,
  setAthanPluginBridgeForTesting,
} from './athanAlarmPlugin';
import { UnifiedNotificationOrchestrator } from '../domain/notifications/UnifiedNotificationOrchestrator';
import { AlarmReconciliationService } from './AlarmReconciliationService';
import { DEFAULT_APP_SETTINGS } from '../config/defaultSettings';

describe('AlarmReconciliationService — Commit 1 Read-Only Diagnostics', () => {
  let mockStore: Map<string, string>;
  let originalSyncAll: typeof UnifiedNotificationOrchestrator.syncAllNotificationChannels;
  let originalConsoleLog: typeof console.log;

  beforeEach(() => {
    mockStore = new Map();
    (globalThis as any).localStorage = {
      getItem: (key: string) => mockStore.get(key) ?? null,
      setItem: (key: string, val: string) => mockStore.set(key, String(val)),
      removeItem: (key: string) => mockStore.delete(key),
      clear: () => mockStore.clear(),
      key: (idx: number) => Array.from(mockStore.keys())[idx] ?? null,
      get length() {
        return mockStore.size;
      },
    };
    (globalThis as any).window = new EventTarget();
    originalSyncAll = UnifiedNotificationOrchestrator.syncAllNotificationChannels;
    originalConsoleLog = console.log;
  });

  afterEach(() => {
    setAthanPluginBridgeForTesting(null);
    UnifiedNotificationOrchestrator.syncAllNotificationChannels = originalSyncAll;
    console.log = originalConsoleLog;
  });

  it('opening modal twice is strictly read-only (0 scheduleAthanAlarms calls) and keeps savedCount & scheduledCount constant', async () => {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const day = 24 * hour;

    const mockSavedAlarms: AlarmDiagnosticsResult['savedAlarms'] = [
      // Past alarms (must be excluded from future counts)
      {
        requestCode: 1001,
        prayerKey: 'Fajr',
        prayerName: 'الفجر',
        timeMs: now - 2 * hour,
        alarmType: 'athan',
        isCurrentlyScheduled: false,
      },
      {
        requestCode: 1002,
        prayerKey: 'custom_past',
        prayerName: 'منبه سابق',
        timeMs: now - 30 * 60 * 1000,
        alarmType: 'custom',
        isCurrentlyScheduled: true,
      },
      // Future active 14-day alarms (5 items: future && isCurrentlyScheduled)
      {
        requestCode: 2001,
        prayerKey: 'Fajr',
        prayerName: 'الفجر',
        timeMs: now + 4 * hour,
        alarmType: 'athan',
        isCurrentlyScheduled: true,
      },
      {
        requestCode: 2002,
        prayerKey: 'Fajr_khushu',
        prayerName: 'الفجر',
        timeMs: now + 4 * hour + 20 * 60 * 1000,
        alarmType: 'khushu',
        isCurrentlyScheduled: true,
      },
      {
        requestCode: 2003,
        prayerKey: 'Dhuhr',
        prayerName: 'الظهر',
        timeMs: now + 1 * day,
        alarmType: 'athan',
        isCurrentlyScheduled: true,
      },
      {
        requestCode: 2004,
        prayerKey: 'custom_adhkar_1',
        prayerName: 'أذكار المساء',
        timeMs: now + 3 * day,
        alarmType: 'custom',
        isCurrentlyScheduled: true,
      },
      {
        requestCode: 2005,
        prayerKey: 'Isha',
        prayerName: 'العشاء',
        timeMs: now + 10 * day,
        alarmType: 'athan',
        isCurrentlyScheduled: true,
      },
      // Future stored buffer alarms (days 15..30, isCurrentlyScheduled: false -> 3 items)
      {
        requestCode: 3001,
        prayerKey: 'Fajr',
        prayerName: 'الفجر',
        timeMs: now + 16 * day,
        alarmType: 'athan',
        isCurrentlyScheduled: false,
      },
      {
        requestCode: 3002,
        prayerKey: 'Dhuhr',
        prayerName: 'الظهر',
        timeMs: now + 20 * day,
        alarmType: 'athan',
        isCurrentlyScheduled: false,
      },
      {
        requestCode: 3003,
        prayerKey: 'custom_adhkar_1',
        prayerName: 'أذكار المساء',
        timeMs: now + 25 * day,
        alarmType: 'custom',
        isCurrentlyScheduled: false,
      },
    ];

    let syncAllCalls = 0;
    let scheduleAthanCalls = 0;
    const prevLastScheduled = getLastScheduledOptions();

    UnifiedNotificationOrchestrator.syncAllNotificationChannels = async (...args) => {
      syncAllCalls++;
      return originalSyncAll.apply(UnifiedNotificationOrchestrator, args);
    };

    console.log = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('[AthanAlarm Plugin]: Web fallback simulation for scheduling native alarms:')
      ) {
        scheduleAthanCalls++;
      }
      originalConsoleLog.apply(console, args);
    };

    // Spy directly if configurable on AthanAlarm instance
    const origSchedule = (AthanAlarm as any).scheduleAthanAlarms;
    let directBridgeScheduleCalls = 0;

    setAthanPluginBridgeForTesting({
      getAlarmDiagnostics: async () => ({
        savedAlarms: mockSavedAlarms,
        nextAlarmClockMs: 0,
        fireEvents: [],
        isIgnoringBatteryOptimizations: true,
        canScheduleExactAlarms: true,
        standbyBucket: 10,
      }),
      scheduleAthanAlarms: async (opts) => {
        directBridgeScheduleCalls++;
        return origSchedule(opts);
      },
    });

    const settings = {
      ...DEFAULT_APP_SETTINGS,
      latitude: 30.0444,
      longitude: 31.2357,
      calcMethod: 'Egypt' as const,
      madhab: 'standard' as const,
    };

    // Simulate opening AlarmDiagnosticsModal twice consecutively
    const firstOpen = await AlarmReconciliationService.reconcileAlarms(settings);
    const secondOpen = await AlarmReconciliationService.reconcileAlarms(settings);

    assert.equal(syncAllCalls, 0, 'syncAllNotificationChannels must never be called when opening modal');
    assert.equal(scheduleAthanCalls, 0, 'AthanAlarm.scheduleAthanAlarms must be called 0 times');
    assert.equal(directBridgeScheduleCalls, 0, 'Bridge scheduleAthanAlarms must be called 0 times');
    assert.equal(getLastScheduledOptions(), prevLastScheduled, 'lastScheduledOptions must remain unchanged');

    assert.equal(firstOpen.success, true);
    assert.equal(secondOpen.success, true);

    // Expected future saved = 5 active + 3 buffered = 8; future scheduled = 5
    assert.equal((firstOpen as any).savedCount, 8, 'savedCount should equal future savedAlarms count');
    assert.equal(firstOpen.scheduledCount, 5, 'scheduledCount should equal future isCurrentlyScheduled count');
    assert.equal((secondOpen as any).savedCount, 8, 'savedCount must stay constant on second open');
    assert.equal(secondOpen.scheduledCount, 5, 'scheduledCount must stay constant on second open');

    // Legacy diff counters must be removed from ReconciliationStatus
    assert.equal('retainedCount' in firstOpen, false, 'retainedCount must be removed');
    assert.equal('missingCount' in firstOpen, false, 'missingCount must be removed');
    assert.equal('obsoleteCount' in firstOpen, false, 'obsoleteCount must be removed');
    assert.equal('addedCount' in firstOpen, false, 'addedCount must not exist');
  });

  it('returns zero counts gracefully when getAlarmDiagnostics returns null (web without bridge)', async () => {
    setAthanPluginBridgeForTesting(null);

    const status = await AlarmReconciliationService.reconcileAlarms(DEFAULT_APP_SETTINGS);

    assert.equal(status.success, true);
    assert.equal((status as any).savedCount, 0);
    assert.equal(status.scheduledCount, 0);
  });
});
