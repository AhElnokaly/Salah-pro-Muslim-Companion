import { useState, useEffect, useCallback, MutableRefObject } from 'react';
import { safeSetItem, safeGetItem } from '../utils/storage';
import { getCustomAudios, AudioTrack } from '../utils/audioStorage';
import { syncMuezzinIdToNative } from '../services/athanAlarmPlugin';
import { resolveMuezzinId } from '../utils/muezzinResolver';

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
    return resolveMuezzinId('Dhuhr', { generalFallback: 'makkah' });
  });

  const [fajrMuezzin, setFajrMuezzinState] = useState<string>(() => {
    return resolveMuezzinId('Fajr', { fajrFallback: 'fajr_makkah' });
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
    syncMuezzinIdToNative('general', muezzin).catch(() => {});
  }, []);

  const setFajrMuezzin = useCallback((muezzin: string) => {
    setFajrMuezzinState(muezzin);
    safeSetItem('salah_fajr_muezzin', muezzin);
    syncMuezzinIdToNative('fajr', muezzin).catch(() => {});
  }, []);

  // Fetch custom muezzins and sync active muezzins to native on mount
  useEffect(() => {
    const generalId = resolveMuezzinId('Dhuhr', { generalFallback: currentMuezzin });
    const fajrId = resolveMuezzinId('Fajr', { fajrFallback: fajrMuezzin });
    syncMuezzinIdToNative('general', generalId).catch(() => {});
    syncMuezzinIdToNative('fajr', fajrId).catch(() => {});

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
