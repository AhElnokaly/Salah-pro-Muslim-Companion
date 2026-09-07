import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { StorageFacade } from '../domain/storage/StorageFacade';
import { DEFAULT_APP_SETTINGS } from '../config/defaultSettings';
import { 
  AppSettings, 
  PrayerLog, 
  PrayerName,
  PendingQadaPrayer, 
  RamadanQadaTracker, 
  QuranSession, 
  QuranKhatma, 
  CustomDua,
  FastingLog,
  VoluntaryPrayerLog
} from '../types';

export const DEFAULT_SETTINGS: AppSettings = DEFAULT_APP_SETTINGS;

export interface UseSpiritualStateReturn {
  settings: AppSettings;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: Dispatch<SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: Dispatch<SetStateAction<PendingQadaPrayer[]>>;
  voluntaryPrayerLogs: VoluntaryPrayerLog[];
  setVoluntaryPrayerLogs: Dispatch<SetStateAction<VoluntaryPrayerLog[]>>;
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

function sanitizePrayerLogs(rawLogs: unknown): Record<string, Record<string, PrayerLog>> {
  if (!rawLogs || typeof rawLogs !== 'object') return {};
  const logsObj = rawLogs as Record<string, unknown>;
  const cleaned: Record<string, Record<string, PrayerLog>> = {};
  const mapKey: Record<string, PrayerName> = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    Fajr: 'Fajr',
    Dhuhr: 'Dhuhr',
    Asr: 'Asr',
    Maghrib: 'Maghrib',
    Isha: 'Isha',
    Sunrise: 'Sunrise',
  };

  for (const dateKey of Object.keys(logsObj)) {
    cleaned[dateKey] = {};
    const day = (logsObj[dateKey] && typeof logsObj[dateKey] === 'object') ? logsObj[dateKey] as Record<string, unknown> : {};
    for (const pKey of Object.keys(day)) {
      const canonicalKey = mapKey[pKey] || mapKey[pKey.toLowerCase()] || pKey;
      const log = day[pKey];
      if (log && typeof log === 'object') {
        const rawStatus = (log as Record<string, unknown>).status;
        const status = rawStatus === 'done' ? 'A' : ((rawStatus as PrayerLog['status']) || 'not_yet');
        cleaned[dateKey][canonicalKey] = {
          ...(log as PrayerLog),
          status
        };
      }
    }
  }
  return cleaned;
}

export function useSpiritualState(): UseSpiritualStateReturn {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [prayerLogs, setPrayerLogs] = useState<Record<string, Record<string, PrayerLog>>>({});
  const [pendingQadaPrayers, setPendingQadaPrayers] = useState<PendingQadaPrayer[]>([]);
  const [voluntaryPrayerLogs, setVoluntaryPrayerLogs] = useState<VoluntaryPrayerLog[]>([]);
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

  // 1. Load data synchronously on mount for zero-flash initial render, then verify with IndexedDB
  useEffect(() => {
    try {
      const storedSettings = StorageFacade.getSettings<Partial<AppSettings>>({});
      if (storedSettings && Object.keys(storedSettings).length > 0) {
        setSettings(prev => ({ ...prev, ...storedSettings }));
      }

      const storedPrayerLogs = StorageFacade.getPrayerLogsSync<Record<string, unknown>>({});
      if (storedPrayerLogs && Object.keys(storedPrayerLogs).length > 0) {
        setPrayerLogs(sanitizePrayerLogs(storedPrayerLogs));
      }

      const storedPendingQada = StorageFacade.getPendingQadaSync<PendingQadaPrayer[]>([]);
      if (storedPendingQada.length > 0) {
        setPendingQadaPrayers(storedPendingQada);
      }

      const storedVoluntary = StorageFacade.getVoluntaryPrayersSync<VoluntaryPrayerLog[]>([]);
      if (storedVoluntary.length > 0) {
        setVoluntaryPrayerLogs(storedVoluntary);
      }

      const storedFasting = StorageFacade.getFastingLogsSync<Record<string, FastingLog>>({});
      if (storedFasting && Object.keys(storedFasting).length > 0) {
        setFastingLogs(storedFasting);
      }

      const storedRamadanQada = StorageFacade.getRamadanQadaSync<Partial<RamadanQadaTracker>>({});
      if (storedRamadanQada && Object.keys(storedRamadanQada).length > 0) {
        setRamadanQada(prev => ({
          daysOwed: typeof storedRamadanQada.daysOwed === 'number' ? storedRamadanQada.daysOwed : prev.daysOwed,
          daysCompleted: typeof storedRamadanQada.daysCompleted === 'number' ? storedRamadanQada.daysCompleted : prev.daysCompleted,
          trackMode: storedRamadanQada.trackMode || prev.trackMode,
          fidyaTarget: typeof storedRamadanQada.fidyaTarget === 'number' ? storedRamadanQada.fidyaTarget : prev.fidyaTarget,
          fidyaCompleted: typeof storedRamadanQada.fidyaCompleted === 'number' ? storedRamadanQada.fidyaCompleted : prev.fidyaCompleted,
        }));
      }

      const storedQuranSessions = StorageFacade.getQuranSessionsSync<QuranSession[]>([]);
      if (storedQuranSessions.length > 0) {
        setQuranSessions(storedQuranSessions);
      }

      const storedKhatmat = StorageFacade.getKhatmatSync<QuranKhatma[]>([]);
      if (storedKhatmat.length > 0) {
        setKhatmat(storedKhatmat);
      }

      const storedDhikrLogs = StorageFacade.getDhikrLogsSync<Record<string, Record<string, number>>>({});
      if (storedDhikrLogs && Object.keys(storedDhikrLogs).length > 0) {
        setDhikrLogs(storedDhikrLogs);
      }

      const storedCustomDuas = StorageFacade.getCustomDuasSync<CustomDua[]>([]);
      if (storedCustomDuas.length > 0) {
        setCustomDuas(storedCustomDuas);
      }

      // Background IndexedDB reconciliation: if local data was cleared or empty, hydrate from IndexedDB
      StorageFacade.initAndMigrate().then(async () => {
        try {
          if (!storedPrayerLogs || Object.keys(storedPrayerLogs).length === 0) {
            const idbLogs = await StorageFacade.getPrayerLogs<Record<string, unknown>>({});
            if (idbLogs && Object.keys(idbLogs).length > 0) {
              setPrayerLogs(sanitizePrayerLogs(idbLogs));
            }
          }
          if (storedPendingQada.length === 0) {
            const idbQada = await StorageFacade.getQadaLedger<PendingQadaPrayer[]>([]);
            if (idbQada && idbQada.length > 0) {
              setPendingQadaPrayers(idbQada);
            }
          }
          if (storedQuranSessions.length === 0) {
            const idbSessions = await StorageFacade.getQuranSessions<QuranSession[]>([]);
            if (idbSessions && idbSessions.length > 0) {
              setQuranSessions(idbSessions);
            }
          }
        } catch (reconcileErr) {
          console.warn('[useSpiritualState] Background IDB hydration error:', reconcileErr);
        }
      });
    } catch (e) {
      console.error('Error loading states from StorageFacade', e);
    }
    setIsLoaded(true);
  }, []);

  // 2. Persist state changes through StorageFacade (IndexedDB + localStorage fallback)
  useEffect(() => {
    if (!isLoaded) return;
    if (!StorageFacade.saveSettings(settings)) {
      setStorageWriteError(true);
    }
  }, [settings, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    StorageFacade.savePrayerLogs(prayerLogs).catch(() => setStorageWriteError(true));
  }, [prayerLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    StorageFacade.saveQadaLedger(pendingQadaPrayers).catch(() => setStorageWriteError(true));
  }, [pendingQadaPrayers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    StorageFacade.saveVoluntaryPrayers(voluntaryPrayerLogs).catch(() => setStorageWriteError(true));
  }, [voluntaryPrayerLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    StorageFacade.saveFastingLogs(fastingLogs).catch(() => setStorageWriteError(true));
  }, [fastingLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    StorageFacade.saveRamadanQada(ramadanQada).catch(() => setStorageWriteError(true));
  }, [ramadanQada, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    StorageFacade.saveQuranSessions(quranSessions).catch(() => setStorageWriteError(true));
  }, [quranSessions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    StorageFacade.saveKhatmat(khatmat).catch(() => setStorageWriteError(true));
  }, [khatmat, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    StorageFacade.saveDhikrHistory(dhikrLogs).catch(() => setStorageWriteError(true));
  }, [dhikrLogs, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    StorageFacade.saveCustomDuas(customDuas).catch(() => setStorageWriteError(true));
  }, [customDuas, isLoaded]);

  return {
    settings,
    setSettings,
    prayerLogs,
    setPrayerLogs,
    pendingQadaPrayers,
    setPendingQadaPrayers,
    voluntaryPrayerLogs,
    setVoluntaryPrayerLogs,
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
