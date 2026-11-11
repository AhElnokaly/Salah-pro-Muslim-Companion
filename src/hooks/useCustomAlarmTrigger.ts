import { useCallback, MutableRefObject, Dispatch, SetStateAction } from 'react';
import { Capacitor } from '@capacitor/core';
import { AlarmConfig, RelativePrayerTarget } from '../types';
import { showAppNotification } from '../utils/pushNotificationService';
import { playSpiritualSound, playSpiritualSpeech } from '../utils/spiritualAudio';
import { getArabicPrayerOrEventName } from '../utils/alarmUtils';

export interface UseCustomAlarmTriggerProps {
  globalAudioRef: MutableRefObject<HTMLAudioElement | null>;
  audioVolume: number;
  setActiveRingingAlarm: Dispatch<SetStateAction<AlarmConfig | null>>;
  setToastMessage?: (msg: string) => void;
}

export interface ExecuteCustomAlarmTriggerOptions {
  alarm: AlarmConfig;
  targetPrayer?: RelativePrayerTarget;
  skipModal?: boolean;
  globalAudioRef: MutableRefObject<HTMLAudioElement | null>;
  audioVolume: number;
  setActiveRingingAlarm: Dispatch<SetStateAction<AlarmConfig | null>>;
  setToastMessage?: (msg: string) => void;
}

export function executeCustomAlarmTrigger({
  alarm,
  targetPrayer,
  skipModal = false,
  globalAudioRef,
  audioVolume,
  setActiveRingingAlarm,
  setToastMessage,
}: ExecuteCustomAlarmTriggerOptions) {
  const prayerSuffix = targetPrayer ? ` (${getArabicPrayerOrEventName(targetPrayer)})` : '';
  const fullTitle = `${alarm.title}${prayerSuffix}`;

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    showAppNotification(`تنبيه: ${fullTitle}`, {
      body: `حان الآن موعد: ${fullTitle}`,
      icon: '/icon-192.png',
      dir: 'rtl'
    }).catch((e) => {
      console.warn('Alarm notification non-fatal error:', e);
    });
  }

  if (alarm.soundType !== 'silent') {
    playSpiritualSound(alarm.soundType || 'speech', fullTitle, audioVolume, globalAudioRef, alarm.notifyMode || 'both');
  }

  if (alarm.autoKhushu && !Capacitor.isNativePlatform()) {
    import('../services/khushuModePlugin').then(({ KhushuMode }) => {
      KhushuMode.activate({
        durationMinutes: alarm.khushuDurationMinutes || 15,
        mode: 'silent',
        origin: 'js_foreground',
      }).catch((e) => console.warn('[useCustomAlarmTrigger] autoKhushu error:', e));
    });
  }

  if (!skipModal) {
    setActiveRingingAlarm({
      ...alarm,
      title: fullTitle
    });
  }

  if (setToastMessage) {
    setToastMessage(`⏰ ${fullTitle}`);
  }
}

export function useCustomAlarmTrigger({
  globalAudioRef,
  audioVolume,
  setActiveRingingAlarm,
  setToastMessage,
}: UseCustomAlarmTriggerProps) {
  const triggerCustomAlarm = useCallback((alarm: AlarmConfig, targetPrayer?: RelativePrayerTarget, skipModal: boolean = false) => {
    executeCustomAlarmTrigger({
      alarm,
      targetPrayer,
      skipModal,
      globalAudioRef,
      audioVolume,
      setActiveRingingAlarm,
      setToastMessage,
    });
  }, [globalAudioRef, audioVolume, setActiveRingingAlarm, setToastMessage]);

  const triggerSpiritualAlert = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      showAppNotification(title, {
        body: body,
        icon: '/icon-192.png',
        dir: 'rtl'
      }).catch((e) => {
        console.warn('Spiritual alert notification non-fatal error:', e);
      });
    }

    // Play spiritual Arabic voice reminder instead of generic beep
    playSpiritualSpeech(`${title}.. ${body}`, audioVolume);

    if (setToastMessage) {
      setToastMessage(`⏰ ${title}: ${body}`);
    }
  }, [audioVolume, setToastMessage]);

  return { triggerCustomAlarm, triggerSpiritualAlert };
}
