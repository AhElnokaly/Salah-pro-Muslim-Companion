import { useState, useEffect, useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react';
import { PrayerName, AppSettings, AlarmConfig, SpiritualAlerts } from '../types';
import { calculatePrayerTimes, getArabicPrayerName } from '../utils/prayerCalc';
import { toArabicNumbers } from '../utils/hijri';
import { safeSetItem } from '../utils/storage';

export const getLocalDateStr = (d: Date): string => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
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
          icon: '/favicon.ico',
          dir: 'rtl'
        });
      } catch (e) {
        console.error(e);
      }
    }

    if (alarm.soundType !== 'silent') {
      let soundUrl = 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
      if (alarm.soundType === 'beep') {
        soundUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav';
      } else if (alarm.soundType === 'vibrate') {
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      }

      if (alarm.soundType !== 'vibrate') {
        if (globalAudioRef.current) {
          globalAudioRef.current.pause();
        }

        const audio = new Audio(soundUrl);
        globalAudioRef.current = audio;
        audio.volume = audioVolume;

        audio.play().catch(e => console.error(e));
      }
    }

    setActiveRingingAlarm(alarm);
  }, [globalAudioRef, audioVolume]);

  const triggerSpiritualAlert = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: '/favicon.ico',
          dir: 'rtl'
        });
      } catch (e) {
        console.error(e);
      }
    }

    const chimeUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav';
    const audio = new Audio(chimeUrl);
    audio.volume = audioVolume * 0.5;
    audio.play().catch(e => console.error(e));

    if (setToastMessage) {
      setToastMessage(`⏰ ${title}: ${body}`);
    }
  }, [audioVolume, setToastMessage]);

  const checkTimesAndAlarms = useCallback((checkDate: Date, isCatchup = false) => {
    const currentHour = checkDate.getHours();
    const currentMin = checkDate.getMinutes();
    const currentDay = checkDate.getDay();
    const timeKey = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
    const todayStr = getLocalDateStr(checkDate);

    // Calculate prayer times for checkDate
    const currentTimes = calculatePrayerTimes(
      checkDate,
      settings.latitude,
      settings.longitude,
      -checkDate.getTimezoneOffset() / 60,
      settings.calcMethod,
      settings.madhab,
      settings.prayerOffsets || {}
    );

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

        const isMatch = prayerTimeStr === timeKey || (diff >= 0 && diff <= 1) || (isCatchup && diff >= 0 && diff <= 20);

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

  // Run catchup and cleanup on initial state load
  useEffect(() => {
    if (isLoaded) {
      checkTimesAndAlarms(new Date(), true);
      cleanupOldTrackingKeys();
    }
  }, [isLoaded, checkTimesAndAlarms]);

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
