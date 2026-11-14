/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppSettings } from '../../types';
import { StorageFacade } from '../storage/StorageFacade';
import { syncMasterAthanToggle } from '../../services/athanAlarmPlugin';

export const NATIVE_SYNC_TIMEOUT_MS = 3000;

// Latest-wins bookkeeping. A timed-out native sync is NOT cancelled, so an older
// call can finish after a newer one. We (a) skip the JS events of superseded calls
// and (b) re-sync native to the latest value if a stale op finishes late.
let toggleSeq = 0;
let latestRequested: boolean | undefined;

export interface ApplyPrayerAthanToggleDeps {
  syncMasterToggle?: (enabled: boolean) => Promise<boolean>;
  saveAppSettings?: (updater: (prev: AppSettings) => AppSettings) => void;
  dispatchPushChanged?: (detail: any) => void;
  dispatchSettingsChanged?: (detail: any) => void;
  /** Test hook: override the native-sync timeout (ms). */
  nativeSyncTimeoutMs?: number;
}

export interface AthanOverrideResult {
  shouldOverride: boolean;
  adhanEnabled: Record<string, boolean>;
  nextPrev: boolean | undefined;
}

/**
 * Pure evaluation of Athan overrides triggered by push-settings-changed events.
 * 1. An explicit toggle of prayerAthan (changedKey === 'prayerAthan') sets all 5 prayers to the target state.
 * 2. Unrelated push setting changes (e.g. prayerPreAlert) never clobber per-prayer adhanEnabled when
 *    the event carries a different changedKey.
 * 3. Events WITHOUT changedKey (e.g. savePushSettings called by a component): prayerAthan === false is
 *    treated as authoritative (all 5 forced off); a false -> true transition forces all 5 on;
 *    a repeated true -> true does nothing.
 */
export function resolveAthanOverride(
  detail: any,
  prevValue: boolean | undefined,
  currentAdhan: Record<string, boolean> = {}
): AthanOverrideResult {
  if (!detail || typeof detail !== 'object' || !('prayerAthan' in detail)) {
    return { shouldOverride: false, adhanEnabled: currentAdhan, nextPrev: prevValue };
  }

  const newAthanVal = Boolean(detail.prayerAthan);
  const nextPrev = newAthanVal;

  let shouldOverride = false;
  if (detail.changedKey) {
    shouldOverride = detail.changedKey === 'prayerAthan';
  } else {
    const hasValueChanged = prevValue !== undefined && prevValue !== newAthanVal;
    const isTurnedOff = newAthanVal === false;
    shouldOverride = isTurnedOff || hasValueChanged;
  }

  if (shouldOverride) {
    const updatedAdhan = { ...currentAdhan };
    (['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).forEach(p => {
      updatedAdhan[p] = newAthanVal;
    });
    return { shouldOverride: true, adhanEnabled: updatedAdhan, nextPrev };
  }

  return { shouldOverride: false, adhanEnabled: currentAdhan, nextPrev };
}

/**
 * Single shared point of truth for toggling the Master Athan switch.
 *
 * Execution order:
 * 1. Update AppSettings in React state (sync, via deps.saveAppSettings when given).
 * 2. Persist AppSettings to StorageFacade (sync).
 * 3. Await native sync (updateAthanPreferences commit() -> cancelAlarm('athan') -> stopAthan when OFF),
 *    guarded by a timeout so a hung native bridge cannot block the JS events forever.
 * 4. Dispatch settings-changed.
 * 5. Dispatch push-settings-changed (with changedKey) AFTER native prefs are committed so the scheduler
 *    (usePrayerScheduler -> orchestratePrayerAlarms) reads the new native state.
 *
 * Dual-event note: components call savePushSettings() first, which already fires one
 * push-settings-changed (no changedKey). This function fires a second one carrying
 * changedKey: 'prayerAthan'. That means orchestratePrayerAlarms runs twice per toggle; the second run
 * is the authoritative one. resolveAthanOverride handles both events deterministically.
 *
 * Concurrency: calls are latest-wins. A superseded call skips steps 4-5 and returns false; if its
 * (possibly timed-out) native op lands after a newer request, native is re-synced to the latest value.
 *
 * Known edge: if the native call times out, step 5 runs before native prefs are written, so the scheduler
 * may race with them in that rare case. The native receiver's athan_enabled_<Prayer> guard at fire time
 * still prevents a disabled athan from playing.
 */
export async function applyPrayerAthanToggle(
  key: string,
  value: boolean,
  deps?: ApplyPrayerAthanToggleDeps
): Promise<boolean> {
  if (key !== 'prayerAthan') {
    return false;
  }

  const enabled = Boolean(value);
  const mySeq = ++toggleSeq;
  latestRequested = enabled;
  const updatedAdhanMap = {
    Fajr: enabled,
    Dhuhr: enabled,
    Asr: enabled,
    Maghrib: enabled,
    Isha: enabled,
  };

  // 1. React state
  if (deps?.saveAppSettings) {
    deps.saveAppSettings(prev => ({
      ...prev,
      adhanEnabled: { ...(prev?.adhanEnabled || {}), ...updatedAdhanMap },
    }));
  }

  // 2. Persistent storage
  try {
    const appSettings = StorageFacade.getSettings<any>(null);
    if (appSettings) {
      StorageFacade.saveSettings({
        ...appSettings,
        adhanEnabled: { ...(appSettings.adhanEnabled || {}), ...updatedAdhanMap },
      });
    }
  } catch (e) {
    console.warn('[applyPrayerAthanToggle] StorageFacade update failed:', e);
  }

  // 3. Native sync, guarded by a timeout (timer is always cleared)
  const syncFn = deps?.syncMasterToggle || syncMasterAthanToggle;
  const timeoutMs = deps?.nativeSyncTimeoutMs ?? NATIVE_SYNC_TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let synced = false;
  try {
    const opPromise = syncFn(enabled);
    // If this op outlives its timeout (or a newer call) and lands AFTER a newer
    // request, it may have overwritten native prefs with an outdated value: correct it.
    opPromise
      .catch(() => false)
      .then(() => {
        if (mySeq !== toggleSeq && latestRequested !== undefined && latestRequested !== enabled) {
          return syncFn(latestRequested).catch(err => {
            console.warn('[applyPrayerAthanToggle] Corrective native re-sync failed:', err);
          });
        }
      });
    synced = await Promise.race([
      opPromise,
      new Promise<boolean>(resolve => {
        timer = setTimeout(() => {
          console.warn(`[applyPrayerAthanToggle] Native sync timed out after ${timeoutMs}ms; proceeding with dispatch`);
          resolve(false);
        }, timeoutMs);
      }),
    ]);
  } catch (err) {
    console.warn('[applyPrayerAthanToggle] Native sync encountered error:', err);
    synced = false;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }

  // A newer toggle superseded this one: it owns the events/reschedule now.
  if (mySeq !== toggleSeq) {
    return false;
  }
  if (!synced) {
    console.warn('[applyPrayerAthanToggle] Native sync incomplete (prefs/cancel/stop failed or timed out); native may be out of step with the UI');
  }

  // 4. settings-changed
  if (deps?.dispatchSettingsChanged) {
    deps.dispatchSettingsChanged({ adhanEnabled: updatedAdhanMap });
  } else if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: { adhanEnabled: updatedAdhanMap } }));
  }

  // 5. push-settings-changed (with changedKey)
  const pushDetail = { prayerAthan: enabled, changedKey: 'prayerAthan' };
  if (deps?.dispatchPushChanged) {
    deps.dispatchPushChanged(pushDetail);
  } else if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('push-settings-changed', { detail: pushDetail }));
  }

  return synced;
}
