/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SmartNotificationsSettings,
  DEFAULT_SMART_NOTIFICATIONS_SETTINGS,
  QuranReadingPortionConfig,
  QuranListeningPortionConfig,
} from '../domain/smartNotifications/smartNotificationTypes';
import {
  getReadingPortionInfo,
  getListeningPortionInfo,
  getContextualAdhkarInfo,
  getOngoingPrayerBarData,
  dispatchSmartNotification,
  formatCountdown,
} from '../domain/smartNotifications/smartNotificationService';
import { safeGetJSON, safeSetJSON } from '../utils/storage';
import { playSpiritualChime } from '../utils/spiritualAudio';

const STORAGE_KEY = 'hemmaty_smart_notifications_config';

interface UseSmartNotificationsProps {
  cityName: string;
  hijriFullString: string;
  nextPrayerNameArabic: string;
  nextPrayerTimeFormatted: string;
  remainingMsToNextPrayer?: number;
  countdownFormatted?: string;
}

export function useSmartNotifications({
  cityName,
  hijriFullString,
  nextPrayerNameArabic,
  nextPrayerTimeFormatted,
  remainingMsToNextPrayer = 0,
  countdownFormatted,
}: UseSmartNotificationsProps) {
  const [settings, setSettings] = useState<SmartNotificationsSettings>(() => {
    const saved = safeGetJSON<SmartNotificationsSettings | null>(STORAGE_KEY, null);
    if (saved) {
      return {
        ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS,
        ...saved,
        ongoingPrayerBar: { ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS.ongoingPrayerBar, ...saved.ongoingPrayerBar },
        readingPortion: { ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS.readingPortion, ...saved.readingPortion },
        listeningPortion: { ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS.listeningPortion, ...saved.listeningPortion },
        contextualAdhkar: { ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS.contextualAdhkar, ...saved.contextualAdhkar },
      };
    }
    return DEFAULT_SMART_NOTIFICATIONS_SETTINGS;
  });

  // Modals state
  const [isReadingModalOpen, setIsReadingModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Live countdown state ticking every second
  const [liveRemainingMs, setLiveRemainingMs] = useState(remainingMsToNextPrayer);

  useEffect(() => {
    setLiveRemainingMs(remainingMsToNextPrayer);
  }, [remainingMsToNextPrayer]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveRemainingMs((prev) => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Save changes to localStorage
  const updateSettings = useCallback((updater: (prev: SmartNotificationsSettings) => SmartNotificationsSettings) => {
    setSettings((prev) => {
      const next = updater(prev);
      safeSetJSON(STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Audio Playback state for Listening Portion
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const listeningInfo = getListeningPortionInfo(settings.listeningPortion);
  const readingInfo = getReadingPortionInfo(settings.readingPortion);
  const morningAdhkarInfo = getContextualAdhkarInfo('morning', settings.contextualAdhkar.morningTime);
  const eveningAdhkarInfo = getContextualAdhkarInfo('evening', settings.contextualAdhkar.eveningTime);

  // Ongoing prayer bar formatted data
  const baseOngoingData = getOngoingPrayerBarData(
    cityName,
    hijriFullString,
    nextPrayerNameArabic,
    nextPrayerTimeFormatted,
    liveRemainingMs
  );

  const ongoingPrayerData = countdownFormatted
    ? {
        ...baseOngoingData,
        countdownFormatted: countdownFormatted.startsWith('+') ? countdownFormatted : `+ ${countdownFormatted}`,
        secondLine: `${nextPrayerNameArabic}، ${nextPrayerTimeFormatted}  ${countdownFormatted.startsWith('+') ? countdownFormatted : `+ ${countdownFormatted}`}`,
      }
    : baseOngoingData;

  // Play next ayah audio in sequence
  const playAyahAt = useCallback((index: number, urls: string[]) => {
    if (!urls || index >= urls.length) {
      setIsAudioPlaying(false);
      setCurrentAudioIndex(0);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.src = urls[index];
    audio.playbackRate = 1.0;
    setCurrentAudioIndex(index);
    setAudioError(null);

    audio.onended = () => {
      if (index + 1 < urls.length) {
        playAyahAt(index + 1, urls);
      } else {
        setIsAudioPlaying(false);
        setCurrentAudioIndex(0);
        // Mark listening complete
        updateSettings((prev) => ({
          ...prev,
          listeningPortion: {
            ...prev.listeningPortion,
            completedToday: true,
            lastCompletedDate: new Date().toISOString().split('T')[0],
          },
        }));
        playSpiritualChime();
      }
    };

    audio.onerror = () => {
      console.warn('[SmartNotifications] Audio failed to load, stopping player');
      setAudioError('تعذر تحميل التلاوة، يرجى التأكد من الاتصال بالإنترنت');
      setIsAudioPlaying(false);
    };

    audio.play().then(() => {
      setIsAudioPlaying(true);
    }).catch((e) => {
      console.warn('[SmartNotifications] Audio play blocked or failed:', e);
      setIsAudioPlaying(false);
    });
  }, [updateSettings]);

  const toggleListeningAudio = useCallback(() => {
    if (isAudioPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsAudioPlaying(false);
    } else {
      playAyahAt(currentAudioIndex, listeningInfo.audioUrls);
    }
  }, [isAudioPlaying, currentAudioIndex, listeningInfo.audioUrls, playAyahAt]);

  const stopListeningAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAudioPlaying(false);
    setCurrentAudioIndex(0);
  }, []);

  // Mark reading portion completed and advance page
  const completeReadingPortion = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    updateSettings((prev) => {
      const nextStartPage = Math.min(604, prev.readingPortion.currentPage + prev.readingPortion.dailyPagesGoal);
      const isConsecutive = prev.readingPortion.lastCompletedDate === todayStr;
      return {
        ...prev,
        readingPortion: {
          ...prev.readingPortion,
          completedToday: true,
          lastCompletedDate: todayStr,
          currentPage: nextStartPage > 604 ? 1 : nextStartPage,
          streakDays: isConsecutive ? prev.readingPortion.streakDays : prev.readingPortion.streakDays + 1,
        },
      };
    });
    playSpiritualChime();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('smart-reading-portion-completed', {
          detail: { pagesRead: settings.readingPortion.dailyPagesGoal },
        })
      );
    }
  }, [updateSettings, settings.readingPortion.dailyPagesGoal]);

  // Trigger test notification
  const triggerTestNotification = useCallback(async (type: 'ongoing_prayer' | 'listening' | 'reading' | 'adhkar') => {
    return await dispatchSmartNotification(type, settings, {
      locationName: cityName,
      hijriDateStr: hijriFullString,
      nextPrayerNameArabic,
      prayerTimeFormatted: nextPrayerTimeFormatted,
      remainingMs: liveRemainingMs,
      adhkarType: 'evening',
    });
  }, [settings, cityName, hijriFullString, nextPrayerNameArabic, nextPrayerTimeFormatted, liveRemainingMs]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  return {
    settings,
    updateSettings,
    ongoingPrayerData,
    readingInfo,
    listeningInfo,
    morningAdhkarInfo,
    eveningAdhkarInfo,
    isAudioPlaying,
    currentAudioIndex,
    audioError,
    toggleListeningAudio,
    stopListeningAudio,
    completeReadingPortion,
    isReadingModalOpen,
    setIsReadingModalOpen,
    isSettingsModalOpen,
    setIsSettingsModalOpen,
    triggerTestNotification,
  };
}
