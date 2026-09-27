import { useState, useEffect, useCallback, MutableRefObject } from 'react';
import { safeSetItem, safeGetItem } from '../utils/storage';
import { getCustomAudios, AudioTrack } from '../utils/audioStorage';

export interface UseMuezzinSettingsReturn {
  audioVolume: number;
  setAudioVolume: (volume: number) => void;
  currentMuezzin: string;
  setCurrentMuezzin: (muezzin: string) => void;
  fajrMuezzin: string;
  setFajrMuezzin: (muezzin: string) => void;
  customMuezzins: AudioTrack[];
}

export function useMuezzinSettings(
  globalAudioRef: MutableRefObject<HTMLAudioElement | null>
): UseMuezzinSettingsReturn {
  const [audioVolume, setAudioVolumeState] = useState<number>(() => {
    const saved = safeGetItem('salah_audio_volume');
    return saved ? parseFloat(saved) : 0.8;
  });

  const [currentMuezzin, setCurrentMuezzinState] = useState<string>(() => {
    return safeGetItem('salah_general_muezzin') || 'makkah';
  });

  const [fajrMuezzin, setFajrMuezzinState] = useState<string>(() => {
    return safeGetItem('salah_fajr_muezzin') || 'fajr_yusuf';
  });

  const [customMuezzins, setCustomMuezzins] = useState<AudioTrack[]>([]);

  const setAudioVolume = useCallback((vol: number) => {
    setAudioVolumeState(vol);
    safeSetItem('salah_audio_volume', vol.toString());
    if (globalAudioRef.current) {
      globalAudioRef.current.volume = vol;
    }
  }, [globalAudioRef]);

  const setCurrentMuezzin = useCallback((muezzin: string) => {
    setCurrentMuezzinState(muezzin);
    safeSetItem('salah_general_muezzin', muezzin);
  }, []);

  const setFajrMuezzin = useCallback((muezzin: string) => {
    setFajrMuezzinState(muezzin);
    safeSetItem('salah_fajr_muezzin', muezzin);
  }, []);

  // Fetch custom muezzins on mount
  useEffect(() => {
    getCustomAudios().then(tracks => {
      setCustomMuezzins(tracks);
    }).catch(err => {
      console.error('Failed to load custom muezzins in useAthanPlayer:', err);
    });
  }, []);

  return {
    audioVolume,
    setAudioVolume,
    currentMuezzin,
    setCurrentMuezzin,
    fajrMuezzin,
    setFajrMuezzin,
    customMuezzins,
  };
}
