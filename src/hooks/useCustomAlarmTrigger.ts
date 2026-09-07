import { useCallback, MutableRefObject, Dispatch, SetStateAction } from 'react';
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

export function useCustomAlarmTrigger({
  globalAudioRef,
  audioVolume,
  setActiveRingingAlarm,
  setToastMessage,
}: UseCustomAlarmTriggerProps) {
  const triggerCustomAlarm = useCallback((alarm: AlarmConfig, targetPrayer?: RelativePrayerTarget) => {
    const prayerSuffix = targetPrayer ? ` (${getArabicPrayerOrEventName(targetPrayer)})` : '';
    const fullTitle = `${alarm.title}${prayerSuffix}`;

    if ('Notification' in window && Notification.permission === 'granted') {
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

    setActiveRingingAlarm({
      ...alarm,
      title: fullTitle
    });

    if (setToastMessage) {
      setToastMessage(`⏰ ${fullTitle}`);
    }
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
