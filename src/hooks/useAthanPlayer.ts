import { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { PrayerName, AppSettings } from '../types';
import { getArabicPrayerName } from '../utils/prayerCalc';
import { defaultMuezzins, archiveMuezzins, getAudioUrl, getCustomAudios } from '../utils/audioStorage';

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
  customMuezzins: any[];
  triggerAthan: (prayer: PrayerName, timeStr: string, settings: AppSettings, setToastMessage?: (msg: string) => void) => Promise<void>;
  stopAthanGlobal: () => void;
  togglePlayAthanGlobal: (muezzinId?: string, overridePrayer?: PrayerName) => void;
  handleRetryAudioWithLocal: () => void;
}

export function useAthanPlayer(): UseAthanPlayerReturn {
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);

  const [showAthanOverlay, setShowAthanOverlay] = useState<boolean>(false);
  const [athanOverlayPrayer, setAthanOverlayPrayer] = useState<PrayerName>('Asr');
  const [isAthanPlaying, setIsAthanPlaying] = useState<boolean>(false);
  const [currentPhraseIdx, setCurrentPhraseIdx] = useState<number>(-1);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [pendingAthanPrayer, setPendingAthanPrayer] = useState<PrayerName | null>(null);
  const [customMuezzins, setCustomMuezzins] = useState<any[]>([]);

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
    localStorage.setItem('salah_audio_volume', vol.toString());
    if (globalAudioRef.current) {
      globalAudioRef.current.volume = vol;
    }
  }, []);

  const setCurrentMuezzin = useCallback((muezzin: string) => {
    setCurrentMuezzinState(muezzin);
    localStorage.setItem('salah_general_muezzin', muezzin);
  }, []);

  const setFajrMuezzin = useCallback((muezzin: string) => {
    setFajrMuezzinState(muezzin);
    localStorage.setItem('salah_fajr_muezzin', muezzin);
  }, []);

  // Global Audio Unlocker on first user gesture
  useEffect(() => {
    const unlockAudio = () => {
      try {
        if (!globalAudioRef.current) {
          globalAudioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
        }
        globalAudioRef.current.volume = 0.01;
        globalAudioRef.current.play().then(() => {
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

    return () => {
      window.removeEventListener('click', handleFirstUserInteraction);
      window.removeEventListener('touchstart', handleFirstUserInteraction);
    };
  }, [pendingAthanPrayer]);

  // Audio cleanup on unmount
  useEffect(() => {
    return () => {
      if (globalAudioRef.current) {
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
    let audio = globalAudioRef.current;
    if (audio) {
      try {
        audio.pause();
      } catch (e) {
        console.warn('Error pausing previous global audio:', e);
      }
      audio.src = srcUrl;
    } else {
      audio = new Audio(srcUrl);
      globalAudioRef.current = audio;
    }

    audio.volume = vol > 0 ? vol : 1.0;

    const phraseTimings = computePhraseTimings(isFajr);

    audio.addEventListener('play', () => {
      setIsAthanPlaying(true);
      setAudioError(null);
    });

    audio.addEventListener('pause', () => {
      setIsAthanPlaying(false);
      setCurrentPhraseIdx(-1);
    });

    audio.addEventListener('ended', () => {
      setIsAthanPlaying(false);
      setCurrentPhraseIdx(-1);
    });

    audio.addEventListener('timeupdate', () => {
      const time = audio.currentTime;
      const activeIdx = phraseTimings.findIndex(p => time >= p.start && time < p.end);
      setCurrentPhraseIdx(activeIdx);
    });

    const onlineFallback = isFajr
      ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
      : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';

    audio.onerror = () => {
      if (srcUrl !== onlineFallback) {
        console.warn(`[Audio Fallback]: Attempting fallback to online stream: ${onlineFallback}`);
        playAudioTrack(onlineFallback, isFajr, prayer, vol);
      } else {
        setIsAthanPlaying(false);
        setAudioError('تعذر تحميل صوت الأذان. يرجى التحقق من اتصال الإنترنت.');
      }
    };

    setAthanOverlayPrayer(prayer);
    setShowAthanOverlay(true);

    audio.play().then(() => {
      setIsAthanPlaying(true);
      setAudioError(null);
      setPendingAthanPrayer(null);
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        localStorage.setItem(`salah_played_${todayStr}_${prayer}`, 'true');
      } catch (e) {
        console.warn('Error setting salah_played in localStorage:', e);
      }
    }).catch((e: Error) => {
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
    setAudioError(null);
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
    triggerAthan,
    stopAthanGlobal,
    togglePlayAthanGlobal,
    handleRetryAudioWithLocal,
  };
}
