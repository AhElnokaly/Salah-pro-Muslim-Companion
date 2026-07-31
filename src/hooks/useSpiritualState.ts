import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { safeSetItem } from '../utils/storage';
import { 
  AppSettings, 
  PrayerLog, 
  PendingQadaPrayer, 
  RamadanQadaTracker, 
  QuranSession, 
  QuranKhatma, 
  CustomDua,
  FastingLog 
} from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  latitude: 30.0444,
  longitude: 31.2357,
  cityName: 'القاهرة',
  calcMethod: 'Egypt',
  madhab: 'standard',
  hijriOffset: 0,
  adhanEnabled: {
    Fajr: true,
    Sunrise: false,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true
  },
  hasCompletedOnboarding: false,
  backdropStyle: 'auto',
  clockStyle: 'digital'
};

export interface UseSpiritualStateReturn {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: Dispatch<SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: Dispatch<SetStateAction<PendingQadaPrayer[]>>;
  fastingLogs: Record<string, FastingLog>;
  setFastingLogs: Dispatch<SetStateAction<Record<string, FastingLog>>>;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: Dispatch<SetStateAction<RamadanQadaTracker>>;
  quranSessions: QuranSession[];
  setQuranSessions: Dispatch<SetStateAction<QuranSession[]>>;
  khatmat: QuranKhatma[];
  setKhatmat: Dispatch<SetStateAction<QuranKhatma[]>>;
  dhikrLogs: Record<string, Record<string, number>>;
  setDhikrLogs: Dispatch<SetStateAction<Record<string, Record<string, number>>>>;
  customDuas: CustomDua[];
  setCustomDuas: Dispatch<SetStateAction<CustomDua[]>>;
  isLoaded: boolean;
  storageWriteError: boolean;
}

export function useSpiritualState(): UseSpiritualStateReturn {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [prayerLogs, setPrayerLogs] = useState<Record<string, Record<string, PrayerLog>>>({});
  const [pendingQadaPrayers, setPendingQadaPrayers] = useState<PendingQadaPrayer[]>([]);
  const [fastingLogs, setFastingLogs] = useState<Record<string, FastingLog>>({});
  const [ramadanQada, setRamadanQada] = useState<RamadanQadaTracker>({
    daysOwed: 0,
    daysCompleted: 0,
    trackMode: 'qada',
    fidyaTarget: 0,
    fidyaCompleted: 0
  });
  const [quranSessions, setQuranSessions] = useState<QuranSession[]>([]);
  const [khatmat, setKhatmat] = useState<QuranKhatma[]>([]);
  const [dhikrLogs, setDhikrLogs] = useState<Record<string, Record<string, number>>>({});
  const [customDuas, setCustomDuas] = useState<CustomDua[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [storageWriteError, setStorageWriteError] = useState<boolean>(false);

  // 1. Load data from LocalStorage on mount
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('mc_settings');
      const storedPrayerLogs = localStorage.getItem('mc_prayer_logs');
      const storedPendingQada = localStorage.getItem('mc_pending_qada');
      const storedFasting = localStorage.getItem('mc_fasting_logs');
      const storedRamadanQada = localStorage.getItem('mc_ramadan_qada');
      const storedQuranSessions = localStorage.getItem('mc_quran_sessions');
      const storedKhatmat = localStorage.getItem('mc_khatmat');
      const storedDhikrLogs = localStorage.getItem('mc_dhikr_logs');
      const storedCustomDuas = localStorage.getItem('mc_custom_duas');

      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Failed parsing mc_settings:', e);
        }
      }
      if (storedPrayerLogs) {
        try {
          setPrayerLogs(JSON.parse(storedPrayerLogs));
        } catch (e) {
          console.error('Failed parsing mc_prayer_logs:', e);
        }
      }
      if (storedPendingQada) {
        try {
          setPendingQadaPrayers(JSON.parse(storedPendingQada));
        } catch (e) {
          console.error('Failed parsing mc_pending_qada:', e);
        }
      }
      if (storedFasting) {
        try {
          setFastingLogs(JSON.parse(storedFasting));
        } catch (e) {
          console.error('Failed parsing mc_fasting_logs:', e);
        }
      }
      if (storedRamadanQada) {
        try {
          const parsed = JSON.parse(storedRamadanQada);
          setRamadanQada(prev => ({
            daysOwed: typeof parsed.daysOwed === 'number' ? parsed.daysOwed : prev.daysOwed,
            daysCompleted: typeof parsed.daysCompleted === 'number' ? parsed.daysCompleted : prev.daysCompleted,
            trackMode: parsed.trackMode || prev.trackMode,
            fidyaTarget: typeof parsed.fidyaTarget === 'number' ? parsed.fidyaTarget : prev.fidyaTarget,
            fidyaCompleted: typeof parsed.fidyaCompleted === 'number' ? parsed.fidyaCompleted : prev.fidyaCompleted,
          }));
        } catch (e) {
          console.error('Failed parsing mc_ramadan_qada:', e);
        }
      }
      if (storedQuranSessions) {
        try {
          setQuranSessions(JSON.parse(storedQuranSessions));
        } catch (e) {
          console.error('Failed parsing mc_quran_sessions:', e);
        }
      }
      if (storedKhatmat) {
        try {
          setKhatmat(JSON.parse(storedKhatmat));
        } catch (e) {
          console.error('Failed parsing mc_khatmat:', e);
        }
      }
      if (storedDhikrLogs) {
        try {
          setDhikrLogs(JSON.parse(storedDhikrLogs));
        } catch (e) {
          console.error('Failed parsing mc_dhikr_logs:', e);
        }
      }
      if (storedCustomDuas) {
        try {
          setCustomDuas(JSON.parse(storedCustomDuas));
        } catch (e) {
          console.error('Failed parsing mc_custom_duas:', e);
        }
      }
    } catch (e) {
      console.error('Error loading states from localStorage', e);
    }
    setIsLoaded(true);
  }, []);

  // 2. Persist state changes to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    if (!safeSetItem('mc_settings', JSON.stringify(settings))) {
      setStorageWriteError(true);
    }
  }, [settings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!safeSetItem('mc_prayer_logs', JSON.stringify(prayerLogs))) {
      setStorageWriteError(true);
    }
  }, [prayerLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!safeSetItem('mc_pending_qada', JSON.stringify(pendingQadaPrayers))) {
      setStorageWriteError(true);
    }
  }, [pendingQadaPrayers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!safeSetItem('mc_fasting_logs', JSON.stringify(fastingLogs))) {
      setStorageWriteError(true);
    }
  }, [fastingLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!safeSetItem('mc_ramadan_qada', JSON.stringify(ramadanQada))) {
      setStorageWriteError(true);
    }
  }, [ramadanQada, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!safeSetItem('mc_quran_sessions', JSON.stringify(quranSessions))) {
      setStorageWriteError(true);
    }
  }, [quranSessions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!safeSetItem('mc_khatmat', JSON.stringify(khatmat))) {
      setStorageWriteError(true);
    }
  }, [khatmat, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!safeSetItem('mc_dhikr_logs', JSON.stringify(dhikrLogs))) {
      setStorageWriteError(true);
    }
  }, [dhikrLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!safeSetItem('mc_custom_duas', JSON.stringify(customDuas))) {
      setStorageWriteError(true);
    }
  }, [customDuas, isLoaded]);

  return {
    settings,
    setSettings,
    prayerLogs,
    setPrayerLogs,
    pendingQadaPrayers,
    setPendingQadaPrayers,
    fastingLogs,
    setFastingLogs,
    ramadanQada,
    setRamadanQada,
    quranSessions,
    setQuranSessions,
    khatmat,
    setKhatmat,
    dhikrLogs,
    setDhikrLogs,
    customDuas,
    setCustomDuas,
    isLoaded,
    storageWriteError,
  };
}
