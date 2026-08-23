import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { PrayerName, AppSettings } from '../types';
import { getArabicPrayerName } from '../utils/prayerCalc';
import { defaultMuezzins, archiveMuezzins, getAudioUrl, getCustomAudios, AudioTrack, LOCAL_FALLBACK_AUDIO } from '../utils/audioStorage';
import { safeSetItem } from '../utils/storage';
import { formatDateKey } from '../utils/prayerDayBoundary';

export const athanPhrases = [
  { text: 'الله أكبر، الله أكبر', duration: 10 },
  { text: 'الله أكبر، الله أكبر', duration: 10 },
  { text: 'أشهد أن لا إله إلا الله', duration: 12 },
  { text: 'أشهد أن لا إله إلا الله', duration: 12 },
  { text: 'أشهد أن محمداً رسول الله', duration: 12 },
  { text: 'أشهد أن محمداً رسول الله', duration: 12 },
  { text: 'حي على الصلاة', duration: 10 },
  { text: 'حي على الصلاة', duration: 10 },
  { text: 'حي على الفلاح', duration: 10 },
  { text: 'حي على الفلاح', duration: 10 },
  { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
  { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
  { text: 'الله أكبر، الله أكبر', duration: 10 },
  { text: 'لا إله إلا الله', duration: 10 },
];

export function computePhraseTimings(isFajr: boolean): { text: string; start: number; end: number }[] {
  const activePhrases = athanPhrases.filter(p => !p.isFajrOnly || isFajr);
  let accumulatedTime = 0;
  return activePhrases.map(p => {
    const start = accumulatedTime;
    const end = accumulatedTime + p.duration;
    accumulatedTime += p.duration;
    return { text: p.text, start, end };
  });
}

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

  const [showAthanOverlay, setShowAthanOverlay] = useState<boolean>(false);
  const [athanOverlayPrayer, setAthanOverlayPrayer] = useState<PrayerName>('Asr');
  const [isAthanPlaying, setIsAthanPlaying] = useState<boolean>(false);
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState<number>(-1);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [pendingAthanPrayer, setPendingAthanPrayer] = useState<PrayerName | null>(null);
  const [customMuezzins, setCustomMuezzins] = useState<AudioTrack[]>([]);

  const markAthanDismissed = useCallback(() => {
    userDismissedRef.current = true;
  }, []);

  const [audioVolume, setAudioVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem('salah_audio_volume');
    return saved ? parseFloat(saved) : 0.8;
  });

  const [currentMuezzin, setCurrentMuezzinState] = useState<string>(() => {
    return localStorage.getItem('salah_general_muezzin') || 'makkah';
  });

  const [fajrMuezzin, setFajrMuezzinState] = useState<string>(() => {
    return localStorage.getItem('salah_fajr_muezzin') || 'fajr_yusuf';
  });

  const setAudioVolume = useCallback((vol: number) => {
    setAudioVolumeState(vol);
    safeSetItem('salah_audio_volume', vol.toString());
    if (globalAudioRef.current) {
      globalAudioRef.current.volume = vol;
    }
  }, []);

  const setCurrentMuezzin = useCallback((muezzin: string) => {
    setCurrentMuezzinState(muezzin);
    safeSetItem('salah_general_muezzin', muezzin);
  }, []);

  const setFajrMuezzin = useCallback((muezzin: string) => {
    setFajrMuezzinState(muezzin);
    safeSetItem('salah_fajr_muezzin', muezzin);
  }, []);

  // Global Audio Unlocker on first user gesture
  useEffect(() => {
    const unlockAudio = () => {
      try {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        silentAudio.volume = 0.01;
        silentAudio.play().then(() => {
          console.log('[AudioUnlocker] Audio session successfully unlocked by user gesture.');
        }).catch(err => {
          console.warn('[AudioUnlocker] Could not unlock silent audio snippet:', err);
        });
      } catch (err) {
        console.warn('[AudioUnlocker] Exception during audio unlock:', err);
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Fetch custom muezzins on mount
  useEffect(() => {
    getCustomAudios().then(tracks => {
      setCustomMuezzins(tracks);
    }).catch(err => {
      console.error('Failed to load custom muezzins in useAthanPlayer:', err);
    });
  }, []);

  // Auto-play pending Adhan on first user interaction if browser blocked autoplay
  useEffect(() => {
    if (!pendingAthanPrayer) return;

    const handleFirstUserInteraction = () => {
      const prayerToPlay = pendingAthanPrayer;
      setPendingAthanPrayer(null);
      window.dispatchEvent(new CustomEvent('trigger-athan-simulation', { detail: { prayerName: prayerToPlay } }));
    };

    window.addEventListener('click', handleFirstUserInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstUserInteraction, { once: true });
    window.addEventListener('pointerdown', handleFirstUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
      window.removeEventListener('pointerdown', handleFirstUserInteraction);
    };
  }, [pendingAthanPrayer]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
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

    let audio = globalAudioRef.current;

    // Remove previous listeners if audio and listener references exist
    if (audio && prevListenersRef.current) {
      if (prevListenersRef.current.play) audio.removeEventListener('play', prevListenersRef.current.play);
      if (prevListenersRef.current.pause) audio.removeEventListener('pause', prevListenersRef.current.pause);
      if (prevListenersRef.current.ended) audio.removeEventListener('ended', prevListenersRef.current.ended);
      if (prevListenersRef.current.timeupdate) audio.removeEventListener('timeupdate', prevListenersRef.current.timeupdate);
      prevListenersRef.current = null;
    }

    let safeUrl = srcUrl;
    if (!safeUrl || typeof safeUrl !== 'string' || safeUrl.trim() === '' || safeUrl.startsWith('db://')) {
      safeUrl = isFajr ? LOCAL_FALLBACK_AUDIO.fajr : LOCAL_FALLBACK_AUDIO.general;
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
    };

    const handleTimeUpdate = () => {
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
      const stallCheckTimeout = setTimeout(() => {
        if (userDismissedRef.current) return;
        if (audio.currentTime === 0 && !audio.paused) {
          console.warn('[Audio Stall] لا تقدم فعلي بعد 3 ثواني — تحويل للملف المحلي');
          audio.pause();
          const localFallback = isFajr ? LOCAL_FALLBACK_AUDIO.fajr : LOCAL_FALLBACK_AUDIO.general;
          if (srcUrl !== localFallback) {
            playAudioTrack(localFallback, isFajr, prayer, vol);
          }
        }
      }, 3000);

      audio.addEventListener('timeupdate', () => clearTimeout(stallCheckTimeout), { once: true });
    }).catch((e: Error) => {
      if (userDismissedRef.current) return;
      if (srcUrl !== onlineFallback && e.name !== 'NotAllowedError') {
        console.warn(`[Audio Play Catch Fallback]: Attempting online fallback:`, e);
        playAudioTrack(onlineFallback, isFajr, prayer, vol);
      } else {
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
    const savedMuezzin = localStorage.getItem(`salah_muezzin_${prayerToUse}`);
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
    const activeMuezzinId = localStorage.getItem(`salah_muezzin_${athanOverlayPrayer}`) || (isFajr ? fajrMuezzin : currentMuezzin);
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

    // 1. Native Browser Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`حان الآن موعد صلاة ${getArabicPrayerName(prayer)} 🕌`, {
          body: `حسب توقيت مدينة ${settings.cityName || 'القاهرة'}. تقبل الله صلاتكم.`,
          icon: '/favicon.ico',
          dir: 'rtl'
        });
      } catch (e) {
        console.error('Native notification error:', e);
      }
    }

    // 2. Interactive In-App Toast Alert
    if (setToastMessage) {
      setToastMessage(`🕌 حان الآن موعد صلاة ${getArabicPrayerName(prayer)} حسب توقيت ${settings.cityName || 'القاهرة'}!`);
    }

    const isFajr = prayer === 'Fajr';
    const activeMuezzinId = localStorage.getItem(`salah_muezzin_${prayer}`) || (isFajr ? fajrMuezzin : currentMuezzin);
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
