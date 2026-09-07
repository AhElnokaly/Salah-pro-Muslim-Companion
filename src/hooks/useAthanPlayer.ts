import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { PrayerName, AppSettings } from '../types';
import { getArabicPrayerName } from '../utils/prayerCalc';
import { defaultMuezzins, archiveMuezzins, getAudioUrl, AudioTrack, LOCAL_FALLBACK_AUDIO, revokeAudioBlobUrl } from '../utils/audioStorage';
import { showAppNotification } from '../utils/pushNotificationService';
import { safeSetItem, safeGetItem } from '../utils/storage';
import { formatDateKey } from '../utils/prayerDayBoundary';
import { athanPhrases, computePhraseTimings } from './athanPhraseTimings';
import { useMuezzinSettings } from './useMuezzinSettings';
import { useAudioUnlocker } from './useAudioUnlocker';

export { athanPhrases, computePhraseTimings } from './athanPhraseTimings';

export interface UseAthanPlayerReturn {
  globalAudioRef: MutableRefObject<HTMLAudioElement | null>;
  isAthanPlaying: boolean;
  showAthanOverlay: boolean;
  setShowAthanOverlay: (show: boolean) => void;
  athanOverlayPrayer: PrayerName;
  setAthanOverlayPrayer: (prayer: PrayerName) => void;
  currentPhraseIdx: number;
  audioError: string | null;
  setAudioError: (err: string | null) => void;
  audioVolume: number;
  setAudioVolume: (volume: number) => void;
  currentMuezzin: string;
  setCurrentMuezzin: (muezzin: string) => void;
  fajrMuezzin: string;
  setFajrMuezzin: (muezzin: string) => void;
  customMuezzins: AudioTrack[];
  markAthanDismissed: () => void;
  triggerAthan: (prayer: PrayerName, timeStr: string, settings: AppSettings, setToastMessage?: (msg: string) => void) => Promise<void>;
  stopAthanGlobal: () => void;
  togglePlayAthanGlobal: (muezzinId?: string, overridePrayer?: PrayerName) => void;
  handleRetryAudioWithLocal: () => void;
}

export function useAthanPlayer(): UseAthanPlayerReturn {
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevListenersRef = useRef<{ play?: () => void; pause?: () => void; ended?: () => void; timeupdate?: () => void } | null>(null);
  const userDismissedRef = useRef<boolean>(false);
  const stallTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentBlobUrlRef = useRef<string | null>(null);

  const [showAthanOverlay, setShowAthanOverlay] = useState<boolean>(false);
  const [athanOverlayPrayer, setAthanOverlayPrayer] = useState<PrayerName>('Asr');
  const [isAthanPlaying, setIsAthanPlaying] = useState<boolean>(false);
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState<number>(-1);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [pendingAthanPrayer, setPendingAthanPrayer] = useState<PrayerName | null>(null);
  const pendingAthanTimestampRef = useRef<number>(0);

  const {
    audioVolume,
    setAudioVolume,
    currentMuezzin,
    setCurrentMuezzin,
    fajrMuezzin,
    setFajrMuezzin,
    customMuezzins,
  } = useMuezzinSettings(globalAudioRef);

  // Global Audio Unlocker on first user gesture
  useAudioUnlocker();

  const markAthanDismissed = useCallback(() => {
    userDismissedRef.current = true;
  }, []);

  // Auto-play pending Adhan on first user interaction if browser blocked autoplay (valid only during the Adhan duration ~3.5 minutes)
  useEffect(() => {
    if (!pendingAthanPrayer) return;

    // Auto-expire pending adhan after 210 seconds (duration of adhan call)
    const MAX_ATHAN_PENDING_MS = 210000;
    const elapsed = Date.now() - pendingAthanTimestampRef.current;
    const remainingMs = Math.max(0, MAX_ATHAN_PENDING_MS - elapsed);

    const expiryTimer = setTimeout(() => {
      console.log('[useAthanPlayer] انقضى وقت الأذان الفعلي — تم إلغاء تشغيل الأذان المعلق تجنباً للإزعاج المتأخر.');
      setPendingAthanPrayer(null);
      setAudioError(null);
    }, remainingMs);

    const handleFirstUserInteraction = () => {
      const nowElapsed = Date.now() - pendingAthanTimestampRef.current;
      if (nowElapsed <= MAX_ATHAN_PENDING_MS) {
        const prayerToPlay = pendingAthanPrayer;
        setPendingAthanPrayer(null);
        window.dispatchEvent(new CustomEvent('trigger-athan-simulation', { detail: { prayerName: prayerToPlay } }));
      } else {
        setPendingAthanPrayer(null);
        setAudioError(null);
      }
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { once: true });
    window.addEventListener('pointerdown', handleFirstUserInteraction, { once: true });

    return () => {
      clearTimeout(expiryTimer);
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
      window.removeEventListener('pointerdown', handleFirstUserInteraction);
    };
  }, [pendingAthanPrayer]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
        stallTimeoutRef.current = null;
      }
      if (currentBlobUrlRef.current) {
        revokeAudioBlobUrl(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
      if (globalAudioRef.current) {
        if (prevListenersRef.current) {
          if (prevListenersRef.current.play) globalAudioRef.current.removeEventListener('play', prevListenersRef.current.play);
          if (prevListenersRef.current.pause) globalAudioRef.current.removeEventListener('pause', prevListenersRef.current.pause);
          if (prevListenersRef.current.ended) globalAudioRef.current.removeEventListener('ended', prevListenersRef.current.ended);
          if (prevListenersRef.current.timeupdate) globalAudioRef.current.removeEventListener('timeupdate', prevListenersRef.current.timeupdate);
          prevListenersRef.current = null;
        }
        try {
          globalAudioRef.current.pause();
          globalAudioRef.current = null;
        } catch (e) {
          console.warn('Error cleaning up audio element:', e);
        }
      }
    };
  }, []);

  // Unified audio playback helper with error fallback & phrase tracking
  const playAudioTrack = useCallback((
    srcUrl: string,
    isFajr: boolean,
    prayer: PrayerName,
    vol: number
  ) => {
    if (userDismissedRef.current) {
      console.log('[useAthanPlayer] User dismissed athan overlay — skipping playAudioTrack execution.');
      return;
    }

    if (stallTimeoutRef.current) {
      clearTimeout(stallTimeoutRef.current);
      stallTimeoutRef.current = null;
    }

    let audio = globalAudioRef.current;

    // Remove previous listeners if audio and listener references exist
    if (audio && prevListenersRef.current) {
      if (prevListenersRef.current.play) audio.removeEventListener('play', prevListenersRef.current.play);
      if (prevListenersRef.current.pause) audio.removeEventListener('pause', prevListenersRef.current.pause);
      if (prevListenersRef.current.ended) audio.removeEventListener('ended', prevListenersRef.current.ended);
      if (prevListenersRef.current.timeupdate) audio.removeEventListener('timeupdate', prevListenersRef.current.timeupdate);
      prevListenersRef.current = null;
    }

    // Revoke previous blob URL if it was a blob
    if (currentBlobUrlRef.current && currentBlobUrlRef.current !== srcUrl) {
      revokeAudioBlobUrl(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }

    let safeUrl = srcUrl;
    if (!safeUrl || typeof safeUrl !== 'string' || safeUrl.trim() === '' || safeUrl.startsWith('db://')) {
      safeUrl = isFajr ? LOCAL_FALLBACK_AUDIO.fajr : LOCAL_FALLBACK_AUDIO.general;
    }

    if (safeUrl.startsWith('blob:')) {
      currentBlobUrlRef.current = safeUrl;
    }

    if (audio) {
      try {
        audio.pause();
      } catch (e) {
        console.warn('Error pausing previous global audio:', e);
      }
      audio.src = safeUrl;
      try {
        audio.load();
      } catch (e) {
        console.warn('Error calling audio.load():', e);
      }
    } else {
      audio = new Audio(safeUrl);
      globalAudioRef.current = audio;
    }

    audio.volume = vol > 0 ? vol : 1.0;

    const phraseTimings = computePhraseTimings(isFajr);

    const handlePlay = () => {
      setIsAthanPlaying(true);
      setAudioError(null);
    };

    const handlePause = () => {
      setIsAthanPlaying(false);
      setCurrentPhraseIdx(-1);
    };

    const handleEnded = () => {
      setIsAthanPlaying(false);
      setCurrentPhraseIdx(-1);
      if (currentBlobUrlRef.current) {
        revokeAudioBlobUrl(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }
    };

    const handleTimeUpdate = () => {
      if (stallTimeoutRef.current) {
        clearTimeout(stallTimeoutRef.current);
        stallTimeoutRef.current = null;
      }
      const time = audio.currentTime;
      const activeIdx = phraseTimings.findIndex(p => time >= p.start && time < p.end);
      setCurrentPhraseIdx(activeIdx);
    };

    prevListenersRef.current = {
      play: handlePlay,
      pause: handlePause,
      ended: handleEnded,
      timeupdate: handleTimeUpdate,
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    const onlineFallback = isFajr
      ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
      : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';

    audio.onerror = () => {
      if (userDismissedRef.current) return;
      if (srcUrl !== onlineFallback) {
        console.warn(`[Audio Fallback]: Attempting fallback to online stream: ${onlineFallback}`);
        playAudioTrack(onlineFallback, isFajr, prayer, vol);
      } else {
        setIsAthanPlaying(false);
        setAudioError('تعذر تحميل صوت الأذان. يرجى التحقق من اتصال الإنترنت.');
      }
    };

    if (!userDismissedRef.current) {
      setAthanOverlayPrayer(prayer);
      setShowAthanOverlay(true);
    }

    audio.play().then(() => {
      if (userDismissedRef.current) return;
      setIsAthanPlaying(true);
      setAudioError(null);
      setPendingAthanPrayer(null);
      try {
        const todayStr = formatDateKey(new Date());
        safeSetItem(`salah_played_${todayStr}_${prayer}`, 'true');
      } catch (e) {
        console.warn('Error setting salah_played in localStorage:', e);
      }

      // تأكيد إن الصوت فعلاً بيشتغل (مش بس الـ Promise نجح)، خلال 3 ثواني
      stallTimeoutRef.current = setTimeout(() => {
        if (userDismissedRef.current) return;
        if (audio && audio.currentTime === 0 && !audio.paused) {
          console.warn('[Audio Stall] لا تقدم فعلي بعد 3 ثواني — تحويل للملف المحلي');
          audio.pause();
          const localFallback = isFajr ? LOCAL_FALLBACK_AUDIO.fajr : LOCAL_FALLBACK_AUDIO.general;
          if (srcUrl !== localFallback) {
            playAudioTrack(localFallback, isFajr, prayer, vol);
          }
        }
      }, 3000);
    }).catch((e: Error) => {
      if (userDismissedRef.current) return;
      if (srcUrl !== onlineFallback && e.name !== 'NotAllowedError') {
        console.warn(`[Audio Play Catch Fallback]: Attempting online fallback:`, e);
        playAudioTrack(onlineFallback, isFajr, prayer, vol);
      } else {
        pendingAthanTimestampRef.current = Date.now();
        setPendingAthanPrayer(prayer);
        if (e.name === 'NotAllowedError') {
          setAudioError('حظر المتصفح التشغيل التلقائي للصوت (Autoplay Policy). انقر في أي مكان على الشاشة أو اضغط زر المحاولة لفتح الصوت.');
        } else {
          setAudioError(`تعذر بدء الصوت تلقائياً: ${e.message || 'خطأ غير معروف'}. اضغط لفتح الصوت.`);
        }
        setIsAthanPlaying(false);
      }
    });
  }, []);

  const stopAthanGlobal = useCallback(() => {
    if (globalAudioRef.current) {
      try {
        globalAudioRef.current.pause();
        globalAudioRef.current.currentTime = 0;
      } catch (e) {
        console.warn('Error stopping athan:', e);
      }
    }
    setIsAthanPlaying(false);
    setCurrentPhraseIdx(-1);
  }, []);

  const togglePlayAthanGlobal = useCallback((muezzinId?: string, overridePrayer?: PrayerName) => {
    userDismissedRef.current = false;
    const prayerToUse = overridePrayer || athanOverlayPrayer;
    const isFajr = prayerToUse === 'Fajr';
    const savedMuezzin = safeGetItem(`salah_muezzin_${prayerToUse}`);
    const activeMuezzinId = muezzinId || savedMuezzin || (isFajr ? fajrMuezzin : currentMuezzin);

    if (isAthanPlaying && !overridePrayer) {
      stopAthanGlobal();
    } else {
      if (isAthanPlaying) {
        stopAthanGlobal();
      }
      setAudioError(null);
      const tracks = [...defaultMuezzins, ...archiveMuezzins, ...customMuezzins];
      const muezzinObj = tracks.find(m => m.id === activeMuezzinId) || defaultMuezzins[0];

      getAudioUrl(muezzinObj.url, muezzinObj.id).then(resolvedUrl => {
        playAudioTrack(resolvedUrl, isFajr, prayerToUse, audioVolume);
      }).catch(err => {
        console.error("Error resolving audio URL:", err);
        const fallbackUrl = isFajr 
          ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
          : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
        playAudioTrack(fallbackUrl, isFajr, prayerToUse, audioVolume);
      });
    }
  }, [isAthanPlaying, athanOverlayPrayer, fajrMuezzin, currentMuezzin, customMuezzins, audioVolume, playAudioTrack, stopAthanGlobal]);

  const handleRetryAudioWithLocal = useCallback(() => {
    userDismissedRef.current = false;
    setAudioError(null);
    const isFajr = athanOverlayPrayer === 'Fajr';
    const activeMuezzinId = safeGetItem(`salah_muezzin_${athanOverlayPrayer}`) || (isFajr ? fajrMuezzin : currentMuezzin);
    const tracks = [...defaultMuezzins, ...archiveMuezzins, ...customMuezzins];
    const muezzinObj = tracks.find(m => m.id === activeMuezzinId) || defaultMuezzins[0];
    const fallbackUrl = isFajr 
      ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
      : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';

    getAudioUrl(muezzinObj.url, muezzinObj.id).then((srcUrl) => {
      const audioUrlToPlay = srcUrl || fallbackUrl;
      playAudioTrack(audioUrlToPlay, isFajr, athanOverlayPrayer, audioVolume);
    }).catch(() => {
      playAudioTrack(fallbackUrl, isFajr, athanOverlayPrayer, audioVolume);
    });
  }, [athanOverlayPrayer, fajrMuezzin, currentMuezzin, customMuezzins, audioVolume, playAudioTrack]);

  const triggerAthan = useCallback(async (
    prayer: PrayerName, 
    timeStr: string, 
    settings: AppSettings, 
    setToastMessage?: (msg: string) => void
  ) => {
    userDismissedRef.current = false;
    setAudioError(null);
    // Open full screen Athan overlay immediately
    setAthanOverlayPrayer(prayer);
    setShowAthanOverlay(true);

    // 1. Native Browser Notification (Safe for Android & ServiceWorker)
    if ('Notification' in window && Notification.permission === 'granted') {
      showAppNotification(`حان الآن موعد صلاة ${getArabicPrayerName(prayer)} 🕌`, {
        body: `حسب توقيت مدينة ${settings.cityName || 'القاهرة'}. تقبل الله صلاتكم.`,
        icon: '/icon-192.png',
        dir: 'rtl'
      }).catch((e) => {
        console.warn('Notification display non-fatal warning:', e);
      });
    }

    // 2. Interactive In-App Toast Alert
    if (setToastMessage) {
      setToastMessage(`🕌 حان الآن موعد صلاة ${getArabicPrayerName(prayer)} حسب توقيت ${settings.cityName || 'القاهرة'}!`);
    }

    const isFajr = prayer === 'Fajr';
    const activeMuezzinId = safeGetItem(`salah_muezzin_${prayer}`) || (isFajr ? fajrMuezzin : currentMuezzin);
    const tracks = [...defaultMuezzins, ...archiveMuezzins, ...customMuezzins];
    const muezzinObj = tracks.find(m => m.id === activeMuezzinId) || defaultMuezzins[0];

    try {
      const resolvedUrl = await getAudioUrl(muezzinObj.url, muezzinObj.id);
      playAudioTrack(resolvedUrl, isFajr, prayer, audioVolume);
    } catch (err) {
      console.error("Error resolving audio URL:", err);
      const onlineFallback = isFajr 
        ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3' 
        : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
      playAudioTrack(onlineFallback, isFajr, prayer, audioVolume);
    }
  }, [fajrMuezzin, currentMuezzin, customMuezzins, audioVolume, playAudioTrack]);

  return {
    globalAudioRef,
    isAthanPlaying,
    showAthanOverlay,
    setShowAthanOverlay,
    athanOverlayPrayer,
    setAthanOverlayPrayer,
    currentPhraseIdx,
    audioError,
    setAudioError,
    audioVolume,
    setAudioVolume,
    currentMuezzin,
    setCurrentMuezzin,
    fajrMuezzin,
    setFajrMuezzin,
    customMuezzins,
    markAthanDismissed,
    triggerAthan,
    stopAthanGlobal,
    togglePlayAthanGlobal,
    handleRetryAudioWithLocal,
  };
}
