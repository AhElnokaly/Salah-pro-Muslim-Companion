import { useState, useEffect, useCallback, useRef, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { PrayerName, AppSettings, AlarmConfig, SpiritualAlerts } from '../types';
import { calculatePrayerTimes, getArabicPrayerName, parseTimeToMinutes, getTimezoneOffsetForLocation } from '../utils/prayerCalc';
import { toArabicNumbers } from '../utils/hijri';
import { safeSetItem } from '../utils/storage';
import { scheduleNativeAthanAlarms, updateNativeWidgetData } from '../services/athanAlarmPlugin';
import { playSpiritualSound, playSpiritualSpeech } from '../utils/spiritualAudio';
import {
  findNearestLocationCache,
  saveLocationSchedule,
  getLastCachedLocationSchedule,
} from '../utils/locationCache';

export const getLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function cleanupOldTrackingKeys(): void {
  try {
    const nowMs = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const prefixes = ['salah_played_', 'salah_triggered_', 'alert_before_', 'alert_after_', 'alert_duha_'];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const matchedPrefix = prefixes.find(p => key.startsWith(p));
      if (!matchedPrefix) continue;

      const match = key.match(/\b\d{4}-\d{2}-\d{2}\b/);
      if (match) {
        const dateStr = match[0];
        const keyDate = new Date(dateStr);
        if (!isNaN(keyDate.getTime())) {
          if (nowMs - keyDate.getTime() > sevenDaysMs) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error cleaning up old tracking keys:', e);
  }
}

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
  checkTimesAndAlarms: (checkDate: Date, isCatchup?: boolean) => void;
}

export function usePrayerScheduler({
  settings,
  isLoaded,
  triggerAthan,
  globalAudioRef,
  audioVolume,
  setToastMessage
}: UsePrayerSchedulerProps): UsePrayerSchedulerReturn {
  const [customAlarms, setCustomAlarms] = useState<AlarmConfig[]>(() => {
    const saved = localStorage.getItem('salah_custom_alarms');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse salah_custom_alarms from localStorage:', e);
      }
    }
    return [];
  });

  const [alerts, setAlerts] = useState<SpiritualAlerts>(() => {
    const saved = localStorage.getItem('salah_alerts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse salah_alerts from localStorage:', e);
      }
    }
    return {
      before: { enabled: true, minutes: 10, days: [0, 1, 2, 3, 4, 5, 6], prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
      after: { enabled: true, minutes: 15, days: [0, 1, 2, 3, 4, 5, 6], prayers: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] },
      duha: { enabled: true, minutes: 15, days: [0, 1, 2, 3, 4, 5, 6] }
    };
  });

  const [activeRingingAlarm, setActiveRingingAlarm] = useState<AlarmConfig | null>(null);

  useEffect(() => {
    safeSetItem('salah_custom_alarms', JSON.stringify(customAlarms));
  }, [customAlarms]);

  useEffect(() => {
    safeSetItem('salah_alerts', JSON.stringify(alerts));
  }, [alerts]);

  const triggerCustomAlarm = useCallback((alarm: AlarmConfig) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`تنبيه مخصص: ${alarm.title}`, {
          body: `حان الآن موعد: ${alarm.title} (${toArabicNumbers(alarm.time)})`,
          icon: '/icon-192.png',
          dir: 'rtl'
        });
      } catch (e) {
        console.error(e);
      }
    }

    playSpiritualSound(alarm.soundType || 'speech', alarm.title, audioVolume, globalAudioRef, alarm.notifyMode || 'both');

    setActiveRingingAlarm(alarm);
  }, [globalAudioRef, audioVolume]);

  const triggerSpiritualAlert = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: '/icon-192.png',
          dir: 'rtl'
        });
      } catch (e) {
        console.error(e);
      }
    }

    // Play spiritual Arabic voice reminder instead of generic beep
    playSpiritualSpeech(`${title}.. ${body}`, audioVolume);

    if (setToastMessage) {
      setToastMessage(`⏰ ${title}: ${body}`);
    }
  }, [audioVolume, setToastMessage]);

  const prayerTimesCacheRef = useRef<{ key: string; times: Record<PrayerName | 'Sunrise', string> } | null>(null);

  const getCachedPrayerTimes = useCallback((checkDate: Date) => {
    const todayStr = getLocalDateStr(checkDate);
    const key = `${todayStr}_${settings.latitude}_${settings.longitude}_${settings.calcMethod}_${settings.madhab}_${JSON.stringify(settings.prayerOffsets || {})}`;

    if (prayerTimesCacheRef.current && prayerTimesCacheRef.current.key === key) {
      return prayerTimesCacheRef.current.times;
    }

    const tzOffset = getTimezoneOffsetForLocation(checkDate, settings.timezoneId);
    const times = calculatePrayerTimes(
      checkDate,
      settings.latitude,
      settings.longitude,
      tzOffset,
      settings.calcMethod,
      settings.madhab,
      settings.prayerOffsets || {}
    );

    prayerTimesCacheRef.current = { key, times };
    return times;
  }, [settings.latitude, settings.longitude, settings.timezoneId, settings.calcMethod, settings.madhab, settings.prayerOffsets]);

  const checkTimesAndAlarms = useCallback((checkDate: Date, isCatchup = false) => {
    const currentHour = checkDate.getHours();
    const currentMin = checkDate.getMinutes();
    const currentDay = checkDate.getDay();
    const timeKey = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    const todayStr = getLocalDateStr(checkDate);

    // Get cached prayer times for checkDate (avoids running astronomical math every second)
    const currentTimes = getCachedPrayerTimes(checkDate);

    // 1. Check Adhans
    const autoPlayAthanEnabled = localStorage.getItem('salah_auto_play_athan') !== 'false';
    const prayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    for (const prayer of prayers) {
      if (settings.adhanEnabled[prayer] === false) continue;
      const prayerTimeStr = currentTimes[prayer];
      if (prayerTimeStr) {
        const prayerMins = parseTimeToMinutes(prayerTimeStr);
        const currentMins = currentHour * 60 + currentMin;
        const diff = currentMins - prayerMins;

        const isMatch = (diff >= 0 && diff <= 1) || (isCatchup && diff >= 0 && diff <= 20);

        if (isMatch) {
          const playedKey = `salah_played_${todayStr}_${prayer}`;
          const attemptedKey = `salah_attempted_${todayStr}_${prayer}`;
          if (!localStorage.getItem(playedKey) && !sessionStorage.getItem(attemptedKey)) {
            sessionStorage.setItem(attemptedKey, 'true');
            // Always trigger athan, which opens the full AthanOverlay screen and plays sound
            triggerAthan(prayer, currentTimes[prayer], settings, setToastMessage);
            break;
          }
        }
      }
    }

    // 2. Check Custom Alarms
    customAlarms.forEach(alarm => {
      if (!alarm.enabled) return;
      if (alarm.days.includes(currentDay)) {
        let isMatch = false;
        if (isCatchup) {
          const alarmMins = parseTimeToMinutes(alarm.time);
          const currentMins = currentHour * 60 + currentMin;
          isMatch = currentMins >= alarmMins && currentMins <= alarmMins + 15;
        } else {
          isMatch = alarm.time === timeKey;
        }

        if (isMatch) {
          const triggeredKey = `salah_triggered_${alarm.id}_${todayStr}`;
          if (!localStorage.getItem(triggeredKey)) {
            safeSetItem(triggeredKey, 'true');
            triggerCustomAlarm(alarm);
          }
        }
      }
    });

    // 3. Check Spiritual Alerts (Before/After/Duha)
    if (alerts.before?.enabled && alerts.before.days.includes(currentDay)) {
      alerts.before.prayers?.forEach((prayer: PrayerName) => {
        const prayerTimeStr = currentTimes[prayer];
        if (prayerTimeStr) {
          const prayerMins = parseTimeToMinutes(prayerTimeStr);
          const alertMins = prayerMins - alerts.before.minutes;
          const currentMins = currentHour * 60 + currentMin;

          let isMatch = false;
          if (isCatchup) {
            isMatch = currentMins >= alertMins && currentMins <= alertMins + 10;
          } else {
            isMatch = currentMins === alertMins;
          }

          if (isMatch) {
            const triggeredKey = `alert_before_${prayer}_${todayStr}`;
            if (!localStorage.getItem(triggeredKey)) {
              safeSetItem(triggeredKey, 'true');
              triggerSpiritualAlert(
                `الاستعداد لصلاة ${getArabicPrayerName(prayer)}`, 
                `حان موعد الاستعداد لصلاة ${getArabicPrayerName(prayer)} خلال ${alerts.before.minutes} دقائق.`
              );
            }
          }
        }
      });
    }

    if (alerts.after?.enabled && alerts.after.days.includes(currentDay)) {
      alerts.after.prayers?.forEach((prayer: PrayerName) => {
        const prayerTimeStr = currentTimes[prayer];
        if (prayerTimeStr) {
          const prayerMins = parseTimeToMinutes(prayerTimeStr);
          const alertMins = prayerMins + alerts.after.minutes;
          const currentMins = currentHour * 60 + currentMin;

          let isMatch = false;
          if (isCatchup) {
            isMatch = currentMins >= alertMins && currentMins <= alertMins + 10;
          } else {
            isMatch = currentMins === alertMins;
          }

          if (isMatch) {
            const triggeredKey = `alert_after_${prayer}_${todayStr}`;
            if (!localStorage.getItem(triggeredKey)) {
              safeSetItem(triggeredKey, 'true');
              triggerSpiritualAlert(
                `أذكار صلاة ${getArabicPrayerName(prayer)}`, 
                `تذكير مبارك بقراءة الأذكار والسنن البعدية لصلاة ${getArabicPrayerName(prayer)}.`
              );
            }
          }
        }
      });
    }

    if (alerts.duha?.enabled && alerts.duha.days.includes(currentDay)) {
      const sunriseStr = currentTimes['Sunrise'];
      if (sunriseStr) {
        const sunriseMins = parseTimeToMinutes(sunriseStr);
        const alertMins = sunriseMins + alerts.duha.minutes;
        const currentMins = currentHour * 60 + currentMin;

        let isMatch = false;
        if (isCatchup) {
          isMatch = currentMins >= alertMins && currentMins <= alertMins + 10;
        } else {
          isMatch = currentMins === alertMins;
        }

        if (isMatch) {
          const triggeredKey = `alert_duha_${todayStr}`;
          if (!localStorage.getItem(triggeredKey)) {
            safeSetItem(triggeredKey, 'true');
            triggerSpiritualAlert("صلاة الضحى (صلاة الأوابين) ☀️", `صلاة الضحى تجزئ عن صدقة كل سلامى من جسدك. حان الآن موعدها المبارك.`);
          }
        }
      }
    }
  }, [settings, customAlarms, alerts, triggerAthan, triggerCustomAlarm, triggerSpiritualAlert, setToastMessage]);

  // Run catchup, cleanup, and native Android AlarmManager scheduling on initial state load or settings update
  useEffect(() => {
    if (isLoaded) {
      checkTimesAndAlarms(new Date(), true);
      cleanupOldTrackingKeys();

      const now = new Date();
      let days60List: Array<{ date: Date; timesMap: Record<string, string> }> = [];

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
            days60List.push({ date: d, timesMap: timesMap as any });
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
        const userTz = settings.timezoneId || (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined);
        scheduleNativeAthanAlarms(days60List, undefined, {
          lat: settings.latitude,
          lng: settings.longitude,
          calcMethod: settings.calcMethod,
          madhab: settings.madhab,
          timeZoneId: userTz,
          fajrOffset: settings.prayerOffsets?.Fajr || 0,
          dhuhrOffset: settings.prayerOffsets?.Dhuhr || 0,
          asrOffset: settings.prayerOffsets?.Asr || 0,
          maghribOffset: settings.prayerOffsets?.Maghrib || 0,
          ishaOffset: settings.prayerOffsets?.Isha || 0,
        }).catch(err => {
          console.warn('Native athan alarm scheduling error:', err);
        });

        const currentTimes = days60List[0].timesMap;
        updateNativeWidgetData(currentTimes as any, settings.cityName || 'مواقيت الصلاة').catch(err => {
          console.warn('Native widget update error:', err);
        });
      }
    }
  }, [isLoaded, settings.latitude, settings.longitude, settings.timezoneId, settings.calcMethod, settings.madhab, settings.prayerOffsets, settings.cityName, checkTimesAndAlarms]);

  // Background Web Worker tick with single fallback interval (Task 2)
  useEffect(() => {
    let worker: Worker | null = null;
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
      const workerUrl = URL.createObjectURL(blob);
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
