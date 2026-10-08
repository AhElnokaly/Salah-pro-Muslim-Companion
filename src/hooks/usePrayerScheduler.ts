import { useState, useEffect, useCallback, Dispatch, SetStateAction, MutableRefObject, useRef } from 'react';
import { PrayerName, AppSettings, AlarmConfig, SpiritualAlerts, PrayerTimes, RelativePrayerTarget } from '../types';
import { calculatePrayerTimes, getArabicPrayerName, parseTimeToMinutes, getTimezoneOffsetForLocation } from '../utils/prayerCalc';
import { toArabicNumbers } from '../utils/hijri';
import { safeSetItem, safeGetItem, safeGetJSON, safeSetJSON, safeSessionGetItem, safeSessionSetItem } from '../utils/storage';
import { UnifiedNotificationOrchestrator } from '../domain/notifications/UnifiedNotificationOrchestrator';
import {
  DEFAULT_WORSHIP_ALARMS,
  calculateTriggerMinutes,
  FIVE_PRAYERS_ONLY
} from '../utils/alarmUtils';
import {
  findNearestLocationCache,
  saveLocationSchedule,
  getLastCachedLocationSchedule,
} from '../utils/locationCache';
import { getLocalDateStr, cleanupOldTrackingKeys } from './prayerSchedulerUtils';
import { useCustomAlarmTrigger } from './useCustomAlarmTrigger';
import { useCachedPrayerTimes } from './useCachedPrayerTimes';
import { isNativeAthanRunning, DailyPrayerTimesEntry } from '../services/athanAlarmPlugin';
import { resolveAthanOverride } from '../domain/notifications/prayerAthanToggle';

export { getLocalDateStr, cleanupOldTrackingKeys } from './prayerSchedulerUtils';

export interface UsePrayerSchedulerProps {
  settings: AppSettings;
  isLoaded: boolean;
  triggerAthan: (prayer: PrayerName, timeStr: string, settings: AppSettings, setToastMessage?: (msg: string) => void) => Promise<void>;
  globalAudioRef: MutableRefObject<HTMLAudioElement | null>;
  audioVolume: number;
  setToastMessage?: (msg: string) => void;
}

export interface UsePrayerSchedulerReturn {
  customAlarms: AlarmConfig[];
  setCustomAlarms: Dispatch<SetStateAction<AlarmConfig[]>>;
  alerts: SpiritualAlerts;
  setAlerts: Dispatch<SetStateAction<SpiritualAlerts>>;
  activeRingingAlarm: AlarmConfig | null;
  setActiveRingingAlarm: Dispatch<SetStateAction<AlarmConfig | null>>;
  checkTimesAndAlarms: (checkDate: Date, isCatchup?: boolean) => void | Promise<void>;
}

export function usePrayerScheduler({
  settings,
  isLoaded,
  triggerAthan,
  globalAudioRef,
  audioVolume,
  setToastMessage
}: UsePrayerSchedulerProps): UsePrayerSchedulerReturn {
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const prevPushAthanRef = useRef<boolean | undefined>(undefined);
  const days60ListRef = useRef<DailyPrayerTimesEntry[]>([]);
  const [customAlarms, setCustomAlarms] = useState<AlarmConfig[]>(() => {
    const saved = safeGetJSON<AlarmConfig[] | null>('salah_custom_alarms', null);
    if (saved !== null && Array.isArray(saved)) {
      // Cleanup expired one-shot / snooze alarms on app start
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
      const nowMins = today.getHours() * 60 + today.getMinutes();
      const cleaned = saved.filter(a => {
        if (!a.oneShot && !a.fireDate && !a.id.startsWith('snooze_')) return true;
        if (a.fireDate) {
          if (a.fireDate < todayStr) return false;
          if (a.fireDate === todayStr && a.time) {
            const [h, m] = a.time.split(':').map(Number);
            if (!isNaN(h) && !isNaN(m) && (h * 60 + m) < (nowMins - 2)) return false;
          }
        } else if (a.oneShot || a.id.startsWith('snooze_')) {
          return false;
        }
        return true;
      });
      if (cleaned.length !== saved.length) {
        safeSetJSON('salah_custom_alarms', cleaned);
      }
      return cleaned;
    }

    // Initialize with canonical default alarms and migrate old salah_alerts if customized
    const oldAlerts = safeGetJSON<any>('salah_alerts', null);
    let defaults = [...DEFAULT_WORSHIP_ALARMS];
    if (oldAlerts) {
      defaults = defaults.map(def => {
        if (def.id === 'alarm_before_salah' && oldAlerts.before) {
          return {
            ...def,
            enabled: Boolean(oldAlerts.before.enabled),
            offsetMinutes: oldAlerts.before.minutes || 10,
            days: oldAlerts.before.days || def.days,
            prayers: oldAlerts.before.prayers || def.prayers
          };
        }
        if (def.id === 'alarm_after_salah' && oldAlerts.after) {
          return {
            ...def,
            enabled: Boolean(oldAlerts.after.enabled),
            offsetMinutes: oldAlerts.after.minutes || 15,
            days: oldAlerts.after.days || def.days,
            prayers: oldAlerts.after.prayers || def.prayers
          };
        }
        if (def.id === 'alarm_duha' && oldAlerts.duha) {
          return {
            ...def,
            enabled: Boolean(oldAlerts.duha.enabled),
            offsetMinutes: oldAlerts.duha.minutes || 15,
            days: oldAlerts.duha.days || def.days
          };
        }
        return def;
      });
    }
    return defaults;
  });

  const [alerts, setAlerts] = useState<SpiritualAlerts>(() => {
    const saved = safeGetJSON<SpiritualAlerts | null>('salah_alerts', null);
    if (saved) {
      return saved;
    }
    return {
      before: { enabled: true, minutes: 10, days: [0, 1, 2, 3, 4, 5, 6], prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
      after: { enabled: true, minutes: 15, days: [0, 1, 2, 3, 4, 5, 6], prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
      duha: { enabled: true, minutes: 15, days: [0, 1, 2, 3, 4, 5, 6] }
    };
  });

  const [activeRingingAlarm, setActiveRingingAlarm] = useState<AlarmConfig | null>(null);

  useEffect(() => {
    safeSetJSON('salah_custom_alarms', customAlarms);
  }, [customAlarms]);

  useEffect(() => {
    const handleAlarmsChanged = (e: Event) => {
      const customEvent = e as CustomEvent<AlarmConfig[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setCustomAlarms(customEvent.detail);
      } else {
        const saved = safeGetJSON<AlarmConfig[] | null>('salah_custom_alarms', null);
        if (saved && Array.isArray(saved)) {
          setCustomAlarms(saved);
        }
      }
    };
    window.addEventListener('custom-alarms-changed', handleAlarmsChanged);
    return () => {
      window.removeEventListener('custom-alarms-changed', handleAlarmsChanged);
    };
  }, []);

  useEffect(() => {
    safeSetJSON('salah_alerts', alerts);
  }, [alerts]);

  const { triggerCustomAlarm } = useCustomAlarmTrigger({
    globalAudioRef,
    audioVolume,
    setActiveRingingAlarm,
    setToastMessage,
  });

  const getCachedPrayerTimes = useCachedPrayerTimes(settings);

  const checkTimesAndAlarms = useCallback(async (checkDate: Date, isCatchup = false) => {
    const currentHour = checkDate.getHours();
    const currentMin = checkDate.getMinutes();
    const currentDay = checkDate.getDay();
    const currentMins = currentHour * 60 + currentMin;
    const todayStr = getLocalDateStr(checkDate);

    // Get cached prayer times for checkDate (avoids running astronomical math every second)
    const currentTimes = getCachedPrayerTimes(checkDate);

    // 1. Check Adhans
    const prayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const prayer of prayers) {
      if (settings.adhanEnabled[prayer] === false) continue;
      const prayerTimeStr = currentTimes[prayer];
      if (prayerTimeStr) {
        const prayerMins = parseTimeToMinutes(prayerTimeStr);
        const diff = currentMins - prayerMins;

        const playedKey = `salah_played_${todayStr}_${prayer}`;
        const attemptedKey = `salah_attempted_${todayStr}_${prayer}`;

        // Real-time: diff within [0..1]. Catchup when app wakes: diff within [0..3] (real live adhan duration)
        const isMatch = (diff >= 0 && diff <= 1) || (isCatchup && diff >= 0 && diff <= 3);

        if (diff > 3 && !safeGetItem(playedKey)) {
          // Prayer call has ended; mark as expired so it never triggers late upon wake
          safeSetItem(playedKey, 'expired');
        } else if (isMatch) {
          if (!safeGetItem(playedKey) && !safeSessionGetItem(attemptedKey)) {
            safeSessionSetItem(attemptedKey, 'true');

            const isRunning = await isNativeAthanRunning();
            if (isRunning) {
              safeSetItem(playedKey, 'true');
              console.log(`[ATHAN] SOURCE=WEB ACTION=SKIP REASON=NATIVE_RUNNING PRAYER=${prayer}`);
              break;
            }

            // Always trigger athan, which opens the full AthanOverlay screen and plays sound
            triggerAthan(prayer, currentTimes[prayer], settings, setToastMessage);
            break;
          }
        }
      }
    }

    const getAlarmPriorityScore = (alarm: AlarmConfig): number => {
      let score = 200;
      const lowerTitle = (alarm.title || '').toLowerCase();
      // 1. Prayer alerts & Pre-alerts (Highest priority custom alarms)
      if (lowerTitle.includes('صلاة') || lowerTitle.includes('أذان') || lowerTitle.includes('اقتربت') || alarm.id === 'alarm_before_salah' || alarm.id === 'alarm_after_salah') {
        score = 800;
      }
      // 2. Morning & Evening Adhkar
      else if (lowerTitle.includes('صباح') || lowerTitle.includes('مساء') || lowerTitle.includes('أذكار') || lowerTitle.includes('اذكار') || alarm.id.includes('adhkar')) {
        score = 600;
      }
      // 3. Sunnah & Nawafil & Qiyam & Duha
      else if (lowerTitle.includes('ضحى') || lowerTitle.includes('قيام') || lowerTitle.includes('وتر') || lowerTitle.includes('تهجد') || lowerTitle.includes('سنة')) {
        score = 400;
      }

      // Audio & Khushu boosts
      if (alarm.soundType !== 'silent' && alarm.soundType !== 'vibrate') score += 50;
      if (alarm.autoKhushu) score += 20;
      return score;
    };

    interface PendingTriggerItem {
      alarm: AlarmConfig;
      targetPrayer?: RelativePrayerTarget;
      triggeredKey: string;
      priority: number;
    }

    const pendingAlarmsToTrigger: PendingTriggerItem[] = [];

    // 2. Check Custom Alarms (Both Prayer-Relative & Fixed Times)
    customAlarms.forEach(alarm => {
      if (!alarm.enabled) return;
      if (alarm.oneShot) {
        if (!alarm.fireDate || alarm.fireDate !== todayStr) return;
      } else {
        if (!alarm.days || !alarm.days.includes(currentDay)) return;
      }

      const isRelative = alarm.type === 'prayer_relative' || (!alarm.type && !alarm.time && alarm.prayers);

      if (isRelative) {
        const targetPrayers = (alarm.prayers && alarm.prayers.length > 0) ? alarm.prayers : FIVE_PRAYERS_ONLY;
        targetPrayers.forEach((pTarget: RelativePrayerTarget) => {
          const prayerTimeStr = currentTimes[pTarget];
          if (!prayerTimeStr) return;

          const targetMins = calculateTriggerMinutes(alarm, prayerTimeStr);
          if (targetMins === null) return;

          const diff = currentMins - targetMins;

          const triggeredKey = `salah_triggered_${alarm.id}_${pTarget}_${todayStr}`;
          const isMatch = (diff >= 0 && diff <= 1) || (isCatchup && diff >= 0 && diff <= 2);

          if (diff > 2 && !safeGetItem(triggeredKey)) {
            // Expired, mark handled so opening app late doesn't ring
            safeSetItem(triggeredKey, 'expired');
          } else if (isMatch && !safeGetItem(triggeredKey)) {
            pendingAlarmsToTrigger.push({ alarm, targetPrayer: pTarget, triggeredKey, priority: getAlarmPriorityScore(alarm) });
          }
        });
      } else {
        // Fixed Time Alarm
        if (!alarm.time) return;
        const alarmMins = parseTimeToMinutes(alarm.time);
        const diff = currentMins - alarmMins;

        const triggeredKey = `salah_triggered_${alarm.id}_${todayStr}`;
        const isMatch = (diff >= 0 && diff <= 1) || (isCatchup && diff >= 0 && diff <= 2);

        if (diff > 2 && !safeGetItem(triggeredKey)) {
          safeSetItem(triggeredKey, 'expired');
        } else if (isMatch && !safeGetItem(triggeredKey)) {
          pendingAlarmsToTrigger.push({ alarm, triggeredKey, priority: getAlarmPriorityScore(alarm) });
        }
      }
    });

    if (pendingAlarmsToTrigger.length > 0) {
      pendingAlarmsToTrigger.sort((a, b) => b.priority - a.priority);

      const isAnyPrayerAthanAttempting = prayers.some(
        p => safeSessionGetItem(`salah_attempted_${todayStr}_${p}`) === 'true' && !safeGetItem(`salah_played_${todayStr}_${p}`)
      );

      const isAudioBusy = Boolean(
        (globalAudioRef?.current && !globalAudioRef.current.paused && globalAudioRef.current.currentTime > 0) ||
        isAnyPrayerAthanAttempting
      );

      const primaryItem = pendingAlarmsToTrigger[0];
      safeSetItem(primaryItem.triggeredKey, 'true');
      if (!isAudioBusy) {
        triggerCustomAlarm(primaryItem.alarm, primaryItem.targetPrayer);
      } else {
        triggerCustomAlarm({ ...primaryItem.alarm, soundType: 'silent' }, primaryItem.targetPrayer);
      }

      if (primaryItem.alarm.id.startsWith('snooze_') || primaryItem.alarm.oneShot) {
        setTimeout(() => {
          const currentList = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);
          if (Array.isArray(currentList)) {
            const updated = currentList.filter(a => a.id !== primaryItem.alarm.id);
            safeSetJSON('salah_custom_alarms', updated);
            window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: updated }));
          }
        }, 1500);
      }

      for (let i = 1; i < pendingAlarmsToTrigger.length; i++) {
        const secondaryItem = pendingAlarmsToTrigger[i];
        safeSetItem(secondaryItem.triggeredKey, 'true');
        // Secondary items trigger silently and skip overwriting the primary ringing modal
        triggerCustomAlarm({ ...secondaryItem.alarm, soundType: 'silent' }, secondaryItem.targetPrayer, true);
        if (secondaryItem.alarm.id.startsWith('snooze_') || secondaryItem.alarm.oneShot) {
          setTimeout(() => {
            const currentList = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);
            if (Array.isArray(currentList)) {
              const updated = currentList.filter(a => a.id !== secondaryItem.alarm.id);
              safeSetJSON('salah_custom_alarms', updated);
              window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: updated }));
            }
          }, 1500);
        }
      }
    }
  }, [settings, customAlarms, triggerAthan, triggerCustomAlarm, setToastMessage]);

  // Run catchup, cleanup, and native Android AlarmManager scheduling on initial state load or settings update
  useEffect(() => {
    if (isLoaded) {
      checkTimesAndAlarms(new Date(), true);
      cleanupOldTrackingKeys();

      const now = new Date();
      let days60List: Array<{ date: Date; timesMap: Record<string, string> | PrayerTimes }> = [];

      const hasValidCoords = Boolean(settings.latitude && settings.longitude);

      if (hasValidCoords) {
        // Check if there is a cached location schedule within 25km (Task 20)
        const cached = findNearestLocationCache(
          settings.latitude,
          settings.longitude,
          settings.calcMethod,
          settings.madhab,
          settings.prayerOffsets || {}
        );

        if (cached && cached.schedule && cached.schedule.length >= 60) {
          // Cache hit within 25km with 60 days -> reuse schedule
          days60List = cached.schedule.map(s => ({
            date: new Date(s.dateStr),
            timesMap: s.timesMap,
          }));
        } else {
          // Cache miss or needs 60-day extension -> compute fresh 60 days
          for (let i = 0; i < 60; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() + i);
            const tzOffset = getTimezoneOffsetForLocation(d, settings.timezoneId);
            const timesMap = calculatePrayerTimes(
              d,
              settings.latitude,
              settings.longitude,
              tzOffset,
              settings.calcMethod,
              settings.madhab,
              settings.prayerOffsets || {}
            );
            days60List.push({ date: d, timesMap });
          }

          // Save to location cache
          saveLocationSchedule(
            settings.latitude,
            settings.longitude,
            settings.calcMethod,
            settings.madhab,
            settings.prayerOffsets || {},
            days60List,
            settings.cityName
          );
        }
      } else {
        // Fallback if coordinates missing: attempt to load last cached location schedule
        const lastCached = getLastCachedLocationSchedule();
        if (lastCached && lastCached.schedule) {
          days60List = lastCached.schedule.map(s => ({
            date: new Date(s.dateStr),
            timesMap: s.timesMap,
          }));
        }
      }

      if (days60List.length > 0) {
        days60ListRef.current = days60List;
        UnifiedNotificationOrchestrator.orchestratePrayerAlarms(settings, days60List, customAlarms).catch(err => {
          console.warn('[usePrayerScheduler] Notification orchestration error:', err);
        });

        const handleKhushuChange = () => {
          const targetDaysList = days60ListRef.current.length > 0 ? days60ListRef.current : days60List;
          UnifiedNotificationOrchestrator.orchestratePrayerAlarms(settingsRef.current, targetDaysList, customAlarms).catch(err => {
            console.warn('[usePrayerScheduler] Notification re-orchestration on khushu change error:', err);
          });
        };

        const handleAlarmsChange = (e?: Event) => {
          const targetDaysList = days60ListRef.current.length > 0 ? days60ListRef.current : days60List;
          const updatedAlarms = (e as CustomEvent)?.detail || customAlarms;
          UnifiedNotificationOrchestrator.orchestratePrayerAlarms(settingsRef.current, targetDaysList, updatedAlarms).catch(err => {
            console.warn('[usePrayerScheduler] Notification re-orchestration on custom alarms change error:', err);
          });
        };

        const handlePushChange = (e?: Event) => {
          const detail = (e as CustomEvent)?.detail;
          const currentSettings = settingsRef.current;
          let effectiveSettings = currentSettings;

          const overrideResult = resolveAthanOverride(
            detail,
            prevPushAthanRef.current,
            currentSettings.adhanEnabled
          );
          prevPushAthanRef.current = overrideResult.nextPrev;

          if (overrideResult.shouldOverride) {
            effectiveSettings = { ...currentSettings, adhanEnabled: overrideResult.adhanEnabled };
          }

          const targetDaysList = days60ListRef.current.length > 0 ? days60ListRef.current : days60List;
          UnifiedNotificationOrchestrator.orchestratePrayerAlarms(effectiveSettings, targetDaysList, customAlarms).catch(err => {
            console.warn('[usePrayerScheduler] Notification re-orchestration on push settings change error:', err);
          });
        };

        window.addEventListener('khushu-settings-changed', handleKhushuChange);
        window.addEventListener('custom-alarms-changed', handleAlarmsChange);
        window.addEventListener('push-settings-changed', handlePushChange);
        return () => {
          window.removeEventListener('khushu-settings-changed', handleKhushuChange);
          window.removeEventListener('custom-alarms-changed', handleAlarmsChange);
          window.removeEventListener('push-settings-changed', handlePushChange);
        };
      }
    }
  }, [isLoaded, settings.latitude, settings.longitude, settings.timezoneId, settings.calcMethod, settings.madhab, settings.prayerOffsets, settings.cityName, checkTimesAndAlarms, customAlarms]);

  // Reschedule immediately when adhanEnabled changes (e.g. from individual prayer toggles)
  const prevAdhanEnabledRef = useRef<Record<string, boolean> | undefined>(undefined);
  useEffect(() => {
    if (!isLoaded || !settings.adhanEnabled) return;
    if (prevAdhanEnabledRef.current === undefined) {
      prevAdhanEnabledRef.current = settings.adhanEnabled;
      return;
    }
    const prev = prevAdhanEnabledRef.current;
    prevAdhanEnabledRef.current = settings.adhanEnabled;
    const isDifferent = Object.keys(settings.adhanEnabled).some(
      k => (prev as any)?.[k] !== (settings.adhanEnabled as any)?.[k]
    );
    if (isDifferent && days60ListRef.current && days60ListRef.current.length > 0) {
      UnifiedNotificationOrchestrator.orchestratePrayerAlarms(
        settings,
        days60ListRef.current,
        customAlarms
      ).catch(err => {
        console.warn('[usePrayerScheduler] Notification re-orchestration on adhanEnabled change error:', err);
      });
    }
  }, [settings.adhanEnabled, isLoaded, customAlarms, settings]);

  // Background Web Worker tick with single fallback interval (Task 2)
  useEffect(() => {
    let worker: Worker | null = null;
    let workerUrl: string | null = null;
    let mainInterval: ReturnType<typeof setInterval> | null = null;
    let workerSuccess = false;

    const handleTick = () => {
      checkTimesAndAlarms(new Date(), false);
    };

    try {
      const workerCode = `
        let intervalId = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(() => {
              self.postMessage('tick');
            }, 1000);
          } else if (e.data === 'stop') {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      workerUrl = URL.createObjectURL(blob);
      worker = new Worker(workerUrl);

      worker.onmessage = (e) => {
        if (e.data === 'tick') {
          handleTick();
        }
      };

      worker.postMessage('start');
      workerSuccess = true;
    } catch (err) {
      console.warn("Background web worker failed to initialize, using fallback interval:", err);
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
        workerUrl = null;
      }
      workerSuccess = false;
    }

    // Only start fallback interval if worker failed to initialize
    if (!workerSuccess) {
      mainInterval = setInterval(handleTick, 1000);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTimesAndAlarms(new Date(), true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (worker) {
        try {
          worker.postMessage('stop');
          worker.terminate();
        } catch (e) {
          console.warn('Error terminating worker:', e);
        }
      }
      if (workerUrl) {
        URL.revokeObjectURL(workerUrl);
        workerUrl = null;
      }
      if (mainInterval) {
        clearInterval(mainInterval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkTimesAndAlarms]);

  return {
    customAlarms,
    setCustomAlarms,
    alerts,
    setAlerts,
    activeRingingAlarm,
    setActiveRingingAlarm,
    checkTimesAndAlarms,
  };
}
