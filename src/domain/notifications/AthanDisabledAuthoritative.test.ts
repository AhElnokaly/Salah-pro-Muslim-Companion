import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { isAthanEnabled, getAthanEnabledMap } from '../../utils/athanEnabled';
import { 
  scheduleNativeAthanAlarms, 
  buildNativePrayerTimeAlarms, 
  getLastScheduledOptions,
  DailyPrayerTimesEntry,
  syncMasterAthanToggle,
  syncMasterAthanToggleDetailed,
  syncAthanPreferencesToNative,
  setAthanPluginBridgeForTesting
} from '../../services/athanAlarmPlugin';
import { applyPrayerAthanToggle, resolveAthanOverride } from './prayerAthanToggle';
import { savePushSettings, getPushSettings } from '../../utils/pushNotificationService';
import { Capacitor } from '@capacitor/core';
import fs from 'node:fs';
import path from 'node:path';

describe('TASK 8: Authoritative Athan Disabled Everywhere', () => {
  const tomorrow = new Date(Date.now() + 86400000);
  const daysEntry: DailyPrayerTimesEntry[] = [
    {
      date: tomorrow,
      timesMap: {
        Fajr: '05:00',
        Sunrise: '06:30',
        Dhuhr: '12:30',
        Asr: '15:45',
        Maghrib: '18:15',
        Isha: '19:45',
      }
    }
  ];

  describe('isAthanEnabled unit tests', () => {
    test('returns false when pushSettings.prayerAthan is false (global athan toggle OFF)', () => {
      const pushSettings = { prayerAthan: false };
      const settings = {
        adhanEnabled: {
          Fajr: true,
          Dhuhr: true,
          Asr: true,
          Maghrib: true,
          Isha: true,
        }
      };

      assert.equal(isAthanEnabled('Fajr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Dhuhr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Asr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Maghrib', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Isha', settings, pushSettings), false);

      const map = getAthanEnabledMap(settings, pushSettings);
      assert.deepEqual(map, {
        Fajr: false,
        Dhuhr: false,
        Asr: false,
        Maghrib: false,
        Isha: false,
      });
    });

    test('returns false for single prayer when adhanEnabled[prayer] is false', () => {
      const pushSettings = { prayerAthan: true };
      const settings = {
        adhanEnabled: {
          Fajr: false,
          Dhuhr: true,
          Asr: true,
          Maghrib: true,
          Isha: true,
        }
      };

      assert.equal(isAthanEnabled('Fajr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('fajr', settings, pushSettings), false);
      assert.equal(isAthanEnabled('Dhuhr', settings, pushSettings), true);
      assert.equal(isAthanEnabled('Asr', settings, pushSettings), true);
      assert.equal(isAthanEnabled('Maghrib', settings, pushSettings), true);
      assert.equal(isAthanEnabled('Isha', settings, pushSettings), true);

      const map = getAthanEnabledMap(settings, pushSettings);
      assert.equal(map['Fajr'], false);
      assert.equal(map['Dhuhr'], true);
      assert.equal(map['Asr'], true);
      assert.equal(map['Maghrib'], true);
      assert.equal(map['Isha'], true);
    });

    test('returns true when undefined / missing (undefined = enabled)', () => {
      assert.equal(isAthanEnabled('Fajr', undefined, undefined), true);
      assert.equal(isAthanEnabled('Dhuhr', null, null), true);
      assert.equal(isAthanEnabled('Asr', { adhanEnabled: {} }, {}), true);
      assert.equal(isAthanEnabled('Maghrib', {}, { prayerAthan: true }), true);
      assert.equal(isAthanEnabled('Isha', { adhanEnabled: null }, null), true);

      const map = getAthanEnabledMap(undefined, undefined);
      assert.deepEqual(map, {
        Fajr: true,
        Dhuhr: true,
        Asr: true,
        Maghrib: true,
        Isha: true,
      });
    });
  });

  describe('scheduleNativeAthanAlarms with athanEnabledMap', () => {
    test('with athanEnabledMap {Fajr:false, others true} produces no Fajr athan items and still produces the other four', async () => {
      const athanEnabledMap = {
        Fajr: false,
        Dhuhr: true,
        Asr: true,
        Maghrib: true,
        Isha: true,
      };

      await scheduleNativeAthanAlarms(daysEntry, undefined, {
        athanEnabledMap,
        prayerPreAlert: false,
        prayerPostAlert: false,
      });

      const options = getLastScheduledOptions();
      assert.ok(options, 'Options should be passed to AthanAlarm plugin');
      const scheduledTimes = options.times as any[];

      const athanItems = scheduledTimes.filter(t => (t.alarmType || 'athan') === 'athan');
      const fajrAthanItems = athanItems.filter(t => t.prayerKey === 'Fajr');
      const dhuhrAthanItems = athanItems.filter(t => t.prayerKey === 'Dhuhr');
      const asrAthanItems = athanItems.filter(t => t.prayerKey === 'Asr');
      const maghribAthanItems = athanItems.filter(t => t.prayerKey === 'Maghrib');
      const ishaAthanItems = athanItems.filter(t => t.prayerKey === 'Isha');

      assert.equal(fajrAthanItems.length, 0, 'Must produce NO Fajr athan items');
      assert.equal(dhuhrAthanItems.length, 1, 'Must still produce Dhuhr athan item');
      assert.equal(asrAthanItems.length, 1, 'Must still produce Asr athan item');
      assert.equal(maghribAthanItems.length, 1, 'Must still produce Maghrib athan item');
      assert.equal(ishaAthanItems.length, 1, 'Must still produce Isha athan item');
      assert.equal(athanItems.length, 4, 'Total athan items must be exactly 4');

      // Also verify per-prayer native flags passed to native plugin
      assert.equal(options.athan_enabled_Fajr, false);
      assert.equal(options.athan_enabled_Dhuhr, true);
      assert.equal(options.athan_enabled_Asr, true);
      assert.equal(options.athan_enabled_Maghrib, true);
      assert.equal(options.athan_enabled_Isha, true);
    });

    test('with all false, zero athan items but pre/post alerts and custom alarms are still scheduled', async () => {
      const athanEnabledMap = {
        Fajr: false,
        Dhuhr: false,
        Asr: false,
        Maghrib: false,
        Isha: false,
      };

      const customAlarm = {
        id: 'custom_tahajjud',
        title: 'قيام الليل',
        enabled: true,
        type: 'fixed' as const,
        time: '04:00',
        days: [0, 1, 2, 3, 4, 5, 6],
        soundType: 'reminder' as const,
      };

      await scheduleNativeAthanAlarms(daysEntry, undefined, {
        athanEnabledMap,
        prayerPreAlert: true,
        preAlertMinutes: 15,
        preAlertSound: 'hayya',
        prayerPostAlert: true,
        postAlertMinutes: 15,
        postAlertSound: 'salawat',
        customAlarms: [customAlarm],
      });

      const options = getLastScheduledOptions();
      assert.ok(options, 'Options should be passed to AthanAlarm plugin');
      const scheduledTimes = options.times as any[];

      const athanItems = scheduledTimes.filter(t => (t.alarmType || 'athan') === 'athan');
      const preAlertItems = scheduledTimes.filter(t => t.alarmType === 'prealert');
      const postAlertItems = scheduledTimes.filter(t => t.alarmType === 'postalert');
      const customItems = scheduledTimes.filter(t => t.alarmType === 'custom');

      assert.equal(athanItems.length, 0, 'With all false, zero athan items must be produced');
      assert.ok(preAlertItems.length > 0, 'Pre-alert items must still be scheduled when athan is disabled');
      assert.ok(postAlertItems.length > 0, 'Post-alert items must still be scheduled when athan is disabled');
      assert.ok(customItems.length > 0, 'Custom alarms must still be scheduled when athan is disabled');

      // Verify all five per-prayer flags are false
      assert.equal(options.athan_enabled_Fajr, false);
      assert.equal(options.athan_enabled_Dhuhr, false);
      assert.equal(options.athan_enabled_Asr, false);
      assert.equal(options.athan_enabled_Maghrib, false);
      assert.equal(options.athan_enabled_Isha, false);
    });
  });
});


// ---------------------------------------------------------------------------
// Commit 3: Master Athan toggle
// ---------------------------------------------------------------------------

/** Installs a fake browser (window EventTarget + localStorage) so storage/event code is really exercised. */
function installBrowserStubs() {
  const g = globalThis as any;
  const prev = { window: g.window, localStorage: g.localStorage };
  const store = new Map<string, string>();
  g.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
  };
  g.window = new EventTarget();
  return {
    store,
    restore() {
      g.window = prev.window;
      g.localStorage = prev.localStorage;
    },
  };
}

function withNative<T>(fn: () => Promise<T>): Promise<T> {
  const orig = Capacitor.isNativePlatform;
  (Capacitor as any).isNativePlatform = () => true;
  return fn().finally(() => {
    (Capacitor as any).isNativePlatform = orig;
    setAthanPluginBridgeForTesting(null);
  });
}

describe('Commit 3: Master Athan toggle', () => {
  describe('native sync (syncMasterAthanToggle)', () => {
    test('web: no-op, returns true', async () => {
      const orig = Capacitor.isNativePlatform;
      (Capacitor as any).isNativePlatform = () => false;
      try {
        assert.equal(await syncMasterAthanToggle(false), true);
      } finally {
        (Capacitor as any).isNativePlatform = orig;
      }
    });

    test('native: returns false when updateAthanPreferences is missing', async () => {
      await withNative(async () => {
        setAthanPluginBridgeForTesting({});
        assert.equal(await syncAthanPreferencesToNative({ Fajr: false }), false);
      });
    });

    test('OFF: writes 5 prefs false, then cancelAlarm("athan"), then stopAthan (in that order)', async () => {
      await withNative(async () => {
        const order: string[] = [];
        let prefs: any = null;
        let cancelled: string | undefined;
        setAthanPluginBridgeForTesting({
          updateAthanPreferences: async o => { order.push('updateAthanPreferences'); prefs = o; return { success: true }; },
          cancelAlarm: async o => { order.push('cancelAlarm'); cancelled = o.alarmId; return { cancelled: true }; },
          stopAthan: async () => { order.push('stopAthan'); return { stopped: true }; },
        });
        assert.equal(await syncMasterAthanToggle(false), true);
        assert.deepEqual(prefs, {
          athan_enabled_Fajr: false, athan_enabled_Dhuhr: false, athan_enabled_Asr: false,
          athan_enabled_Maghrib: false, athan_enabled_Isha: false,
        });
        assert.equal(cancelled, 'athan');
        assert.deepEqual(order, ['updateAthanPreferences', 'cancelAlarm', 'stopAthan']);
      });
    });

    test('ON: writes 5 prefs true and does NOT cancel or stop anything', async () => {
      await withNative(async () => {
        const order: string[] = [];
        let prefs: any = null;
        setAthanPluginBridgeForTesting({
          updateAthanPreferences: async o => { order.push('updateAthanPreferences'); prefs = o; return { success: true }; },
          cancelAlarm: async () => { order.push('cancelAlarm'); return { cancelled: true }; },
          stopAthan: async () => { order.push('stopAthan'); return { stopped: true }; },
        });
        assert.equal(await syncMasterAthanToggle(true), true);
        assert.equal(prefs.athan_enabled_Fajr, true);
        assert.equal(prefs.athan_enabled_Isha, true);
        assert.deepEqual(order, ['updateAthanPreferences']);
      });
    });
  });

  describe('resolveAthanOverride', () => {
    const all = (v: boolean) => ({ Fajr: v, Dhuhr: v, Asr: v, Maghrib: v, Isha: v });

    test('unrelated changedKey (prayerPreAlert) does NOT overwrite manual Fajr=false', () => {
      const cur = { ...all(true), Fajr: false };
      const r = resolveAthanOverride({ prayerAthan: true, prayerPreAlert: false, changedKey: 'prayerPreAlert' }, true, cur);
      assert.equal(r.shouldOverride, false);
      assert.equal(r.adhanEnabled.Fajr, false);
    });

    test('changedKey=prayerAthan OFF forces all 5 false; ON forces all 5 true', () => {
      const off = resolveAthanOverride({ prayerAthan: false, changedKey: 'prayerAthan' }, true, all(true));
      assert.deepEqual(off.adhanEnabled, all(false));
      const on = resolveAthanOverride({ prayerAthan: true, changedKey: 'prayerAthan' }, false, all(false));
      assert.deepEqual(on.adhanEnabled, all(true));
    });

    test('no changedKey: true -> true keeps manual Fajr=false (no override)', () => {
      const cur = { ...all(true), Fajr: false };
      const r = resolveAthanOverride({ prayerAthan: true, prayerPreAlert: false }, true, cur);
      assert.equal(r.shouldOverride, false);
      assert.equal(r.adhanEnabled.Fajr, false);
    });

    test('no changedKey: false -> true overrides all 5 to true', () => {
      const r = resolveAthanOverride({ prayerAthan: true }, false, all(false));
      assert.equal(r.shouldOverride, true);
      assert.deepEqual(r.adhanEnabled, all(true));
      assert.equal(r.nextPrev, true);
    });

    test('no changedKey: prayerAthan=false is authoritative (all 5 forced false)', () => {
      const r = resolveAthanOverride({ prayerAthan: false }, true, all(true));
      assert.equal(r.shouldOverride, true);
      assert.deepEqual(r.adhanEnabled, all(false));
    });

    test('event without prayerAthan is ignored', () => {
      const cur = all(true);
      const r = resolveAthanOverride({ prayerPreAlert: true }, true, cur);
      assert.equal(r.shouldOverride, false);
      assert.equal(r.adhanEnabled, cur);
    });
  });

  describe('savePushSettings / changedKey hygiene', () => {
    test('changedKey is stripped from ALL three storage keys AND from the dispatched event detail', () => {
      const env = installBrowserStubs();
      try {
        let detail: any = null;
        (globalThis as any).window.addEventListener('push-settings-changed', (e: any) => { detail = e.detail; });

        savePushSettings({ ...getPushSettings(), prayerAthan: false, changedKey: 'prayerAthan' } as any);

        assert.ok(detail, 'event must be dispatched');
        assert.equal('changedKey' in detail, false, 'event detail must not leak changedKey');
        assert.equal(detail.prayerAthan, false);

        for (const key of ['mc_push_settings_v1', 'salah_push_settings', 'hemmaty_push_settings']) {
          const raw = env.store.get(key);
          assert.ok(raw, `${key} must be written`);
          assert.equal('changedKey' in JSON.parse(raw!), false, `${key} must not contain changedKey`);
        }
      } finally {
        env.restore();
      }
    });

    test('savePushSettings(with changedKey) then applyPrayerAthanToggle then getPushSettings: still no changedKey, prayerAthan persisted', async () => {
      const env = installBrowserStubs();
      try {
        savePushSettings({ ...getPushSettings(), prayerAthan: false, changedKey: 'prayerAthan' } as any);
        await applyPrayerAthanToggle('prayerAthan', false, { syncMasterToggle: async () => true });
        const stored = getPushSettings() as any;
        assert.equal('changedKey' in stored, false);
        assert.equal(stored.prayerAthan, false);
      } finally {
        env.restore();
      }
    });
  });

  describe('applyPrayerAthanToggle', () => {
    test('OFF: updater sets 5 prayers false and both events carry the right detail', async () => {
      let synced: boolean | null = null;
      let adhan: any = null;
      let settingsEvt: any = null;
      let pushEvt: any = null;
      const ok = await applyPrayerAthanToggle('prayerAthan', false, {
        syncMasterToggle: async e => { synced = e; return true; },
        saveAppSettings: u => { adhan = u({ adhanEnabled: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true } } as any).adhanEnabled; },
        dispatchSettingsChanged: d => { settingsEvt = d; },
        dispatchPushChanged: d => { pushEvt = d; },
      });
      assert.equal(ok, true);
      assert.equal(synced, false);
      assert.deepEqual(adhan, { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false });
      assert.deepEqual(settingsEvt.adhanEnabled, adhan);
      assert.deepEqual(pushEvt, { prayerAthan: false, changedKey: 'prayerAthan' });
    });

    test('ON: updater sets 5 prayers true', async () => {
      let adhan: any = null;
      await applyPrayerAthanToggle('prayerAthan', true, {
        syncMasterToggle: async () => true,
        saveAppSettings: u => { adhan = u({ adhanEnabled: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false } } as any).adhanEnabled; },
        dispatchSettingsChanged: () => {},
        dispatchPushChanged: () => {},
      });
      assert.deepEqual(adhan, { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true });
    });

    test('unrelated key: returns false with no side effects', async () => {
      let called = false;
      const ok = await applyPrayerAthanToggle('prayerPreAlert', true, {
        syncMasterToggle: async () => { called = true; return true; },
        dispatchPushChanged: () => { called = true; },
      });
      assert.equal(ok, false);
      assert.equal(called, false);
    });

    test('strict order: React state -> native sync -> settings-changed -> push-settings-changed', async () => {
      const order: string[] = [];
      await applyPrayerAthanToggle('prayerAthan', false, {
        saveAppSettings: () => { order.push('saveAppSettings'); },
        syncMasterToggle: async () => { order.push('syncMasterToggle'); return true; },
        dispatchSettingsChanged: () => { order.push('dispatchSettingsChanged'); },
        dispatchPushChanged: () => { order.push('dispatchPushChanged'); },
      });
      assert.deepEqual(order, ['saveAppSettings', 'syncMasterToggle', 'dispatchSettingsChanged', 'dispatchPushChanged']);
    });

    test('hung native bridge: times out, STILL dispatches both events, returns false', async () => {
      const order: string[] = [];
      const ok = await applyPrayerAthanToggle('prayerAthan', false, {
        nativeSyncTimeoutMs: 20,
        syncMasterToggle: () => new Promise<boolean>(() => { /* never resolves */ }),
        dispatchSettingsChanged: () => { order.push('settings'); },
        dispatchPushChanged: () => { order.push('push'); },
      });
      assert.equal(ok, false);
      assert.deepEqual(order, ['settings', 'push']);
    });

    test('native sync that throws: events still dispatched, returns false', async () => {
      const order: string[] = [];
      const ok = await applyPrayerAthanToggle('prayerAthan', true, {
        syncMasterToggle: async () => { throw new Error('boom'); },
        dispatchSettingsChanged: () => { order.push('settings'); },
        dispatchPushChanged: () => { order.push('push'); },
      });
      assert.equal(ok, false);
      assert.deepEqual(order, ['settings', 'push']);
    });

    test('timeout timer is cleared after a fast sync (no leaked 3s timer)', async () => {
      const g = globalThis as any;
      const origSet = g.setTimeout;
      const origClear = g.clearTimeout;
      const created = new Set<any>();
      const cleared = new Set<any>();
      g.setTimeout = (fn: any, ms?: number, ...a: any[]) => {
        const t = origSet(fn, ms, ...a);
        if (ms === 3000) created.add(t);
        return t;
      };
      g.clearTimeout = (t: any) => { cleared.add(t); return origClear(t); };
      try {
        await applyPrayerAthanToggle('prayerAthan', true, {
          syncMasterToggle: async () => true,
          dispatchSettingsChanged: () => {},
          dispatchPushChanged: () => {},
        });
      } finally {
        g.setTimeout = origSet;
        g.clearTimeout = origClear;
      }
      assert.equal(created.size, 1, 'exactly one 3000ms guard timer created');
      for (const t of created) assert.ok(cleared.has(t), 'guard timer must be cleared');
    });
  });

  describe('FIX 1: latest-wins concurrency', () => {
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    test('OFF times out, ON follows, stale OFF lands late: final push event is ON and native is re-synced to ON', async () => {
      const syncCalls: boolean[] = [];
      const pushEvents: any[] = [];
      const syncMasterToggle = async (enabled: boolean) => {
        syncCalls.push(enabled);
        if (enabled === false && syncCalls.length === 1) await sleep(60);
        return true;
      };
      const deps = {
        syncMasterToggle,
        nativeSyncTimeoutMs: 10,
        dispatchPushChanged: (d: any) => pushEvents.push(d),
        dispatchSettingsChanged: () => {},
      };
      const first = applyPrayerAthanToggle('prayerAthan', false, deps);
      await sleep(15); // first already timed out (and dispatched OFF) while native is still busy
      const second = applyPrayerAthanToggle('prayerAthan', true, deps);
      await Promise.all([first, second]);
      await sleep(100); // stale OFF lands + corrective re-sync runs

      assert.deepEqual(pushEvents.map(e => e.prayerAthan), [false, true], 'last event wins: ON');
      assert.deepEqual(syncCalls, [false, true, true], 'stale OFF landed late -> corrective ON re-sync');
    });

    test('overlap: older call finishing AFTER a newer one is superseded (no events, returns false)', async () => {
      const syncCalls: boolean[] = [];
      const pushEvents: any[] = [];
      const settingsEvents: any[] = [];
      const deps = {
        syncMasterToggle: async (enabled: boolean) => {
          syncCalls.push(enabled);
          if (enabled === false) await sleep(60);
          return true;
        },
        nativeSyncTimeoutMs: 500, // no timeout: the old call is merely slow
        dispatchPushChanged: (d: any) => pushEvents.push(d),
        dispatchSettingsChanged: (d: any) => settingsEvents.push(d),
      };
      const first = applyPrayerAthanToggle('prayerAthan', false, deps);
      await sleep(10);
      const second = applyPrayerAthanToggle('prayerAthan', true, deps);
      const [r1, r2] = await Promise.all([first, second]);
      await sleep(30);

      assert.equal(r1, false, 'superseded call reports false');
      assert.equal(r2, true);
      assert.equal(pushEvents.length, 1);
      assert.equal(pushEvents[0].prayerAthan, true);
      assert.equal(settingsEvents.length, 1);
      assert.deepEqual(syncCalls, [false, true, true], 'stale OFF landed after ON -> corrective ON re-sync');
    });

    test('stale op with the SAME value as the latest request does not trigger a corrective re-sync', async () => {
      const syncCalls: boolean[] = [];
      const deps = {
        syncMasterToggle: async (e: boolean) => { syncCalls.push(e); await sleep(20); return true; },
        nativeSyncTimeoutMs: 200,
        dispatchPushChanged: () => {},
        dispatchSettingsChanged: () => {},
      };
      const a = applyPrayerAthanToggle('prayerAthan', false, deps);
      const b = applyPrayerAthanToggle('prayerAthan', false, deps);
      await Promise.all([a, b]);
      await sleep(60);
      assert.deepEqual(syncCalls, [false, false]);
    });

    test('single call still dispatches once and returns the sync result', async () => {
      const push: any[] = [];
      const ok = await applyPrayerAthanToggle('prayerAthan', true, {
        syncMasterToggle: async () => true,
        dispatchPushChanged: d => push.push(d),
        dispatchSettingsChanged: () => {},
      });
      assert.equal(ok, true);
      assert.equal(push.length, 1);
    });
  });

  describe('FIX 2: full-result sync reporting', () => {
    test('OFF: cancel fails (returns false) -> ok=false, prefsSaved=true, audioStopped=true', async () => {
      await withNative(async () => {
        setAthanPluginBridgeForTesting({
          updateAthanPreferences: async () => ({ success: true }),
          cancelAlarm: async () => ({ cancelled: false }),
          stopAthan: async () => ({ stopped: true }),
        });
        const r = await syncMasterAthanToggleDetailed(false);
        assert.deepEqual(r, { prefsSaved: true, alarmsCancelled: false, audioStopped: true, ok: false });
        assert.equal(await syncMasterAthanToggle(false), false);
      });
    });

    test('OFF: stop fails (throws) -> ok=false, alarmsCancelled=true', async () => {
      await withNative(async () => {
        setAthanPluginBridgeForTesting({
          updateAthanPreferences: async () => ({ success: true }),
          cancelAlarm: async () => ({ cancelled: true }),
          stopAthan: async () => { throw new Error('boom'); },
        });
        const r = await syncMasterAthanToggleDetailed(false);
        assert.equal(r.alarmsCancelled, true);
        assert.equal(r.audioStopped, false);
        assert.equal(r.ok, false);
      });
    });

    test('OFF: prefs write fails -> ok=false even if cancel/stop succeed', async () => {
      await withNative(async () => {
        setAthanPluginBridgeForTesting({
          updateAthanPreferences: async () => ({ success: false }),
          cancelAlarm: async () => ({ cancelled: true }),
          stopAthan: async () => ({ stopped: true }),
        });
        const r = await syncMasterAthanToggleDetailed(false);
        assert.equal(r.prefsSaved, false);
        assert.equal(r.ok, false);
      });
    });

    test('ON: only prefs matter; cancel/stop untouched', async () => {
      await withNative(async () => {
        setAthanPluginBridgeForTesting({
          updateAthanPreferences: async () => ({ success: true }),
        });
        assert.deepEqual(await syncMasterAthanToggleDetailed(true), { prefsSaved: true, alarmsCancelled: true, audioStopped: true, ok: true });
      });
    });
  });

  describe('source wiring (static checks, whitespace-tolerant)', () => {
    const read = (rel: string) => fs.readFileSync(path.resolve(process.cwd(), rel), 'utf8').replace(/\s+/g, ' ');

    test('PushNotificationManager and WorshipAlarms strip changedKey from the event detail', () => {
      for (const f of ['src/components/PushNotificationManager.tsx', 'src/components/WorshipAlarms.tsx']) {
        const c = read(f);
        assert.match(c, /const \{ changedKey, \.\.\.rest \} = detail;/, `${f} must strip changedKey`);
      }
    });

    test('both components call applyPrayerAthanToggle for prayerAthan', () => {
      const pm = read('src/components/PushNotificationManager.tsx');
      assert.match(pm, /applyPrayerAthanToggle\('prayerAthan', Boolean\(value\)\)/);
      const wa = read('src/components/WorshipAlarms.tsx');
      assert.match(wa, /applyPrayerAthanToggle\('prayerAthan', enabled, \{ saveAppSettings: setSettings/);
    });

    test('usePrayerScheduler delegates to resolveAthanOverride; useSpiritualState listens to settings-changed', () => {
      assert.match(read('src/hooks/usePrayerScheduler.ts'), /resolveAthanOverride\(/);
      const ss = read('src/hooks/useSpiritualState.ts');
      assert.match(ss, /addEventListener\('settings-changed'/);
      assert.match(ss, /removeEventListener\('settings-changed'/);
    });
  });
});
