/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import AppModal, { AppModalVariant } from './shared/AppModal';
import {
  AppSettings,
  PendingQadaPrayer,
  RamadanQadaTracker,
  PrayerLog,
  CustomDua,
  QuranSession,
  QuranKhatma,
  SettingsSubTabId,
  VoluntaryPrayerLog,
} from '../types';
import BackupSettingsTab from './settings/BackupSettingsTab';
import DashboardSectionsTab from './settings/DashboardSectionsTab';
import ThemeSettingsTab from './settings/ThemeSettingsTab';
import LocationSettingsTab from './settings/LocationSettingsTab';
import QadaSettingsTab from './settings/QadaSettingsTab';
import PrayerSettingsTab from './settings/PrayerSettingsTab';
import AdhanSettingsTab from './settings/AdhanSettingsTab';
import CalendarSettingsTab from './settings/CalendarSettingsTab';
import DuasSettingsTab from './settings/DuasSettingsTab';
import { safeSetItem, safeGetItem } from '../utils/storage';

interface MoreSettingsProps {
  subTab: SettingsSubTabId;
  setSubTab: React.Dispatch<React.SetStateAction<SettingsSubTabId>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
  setVoluntaryPrayerLogs?: React.Dispatch<React.SetStateAction<VoluntaryPrayerLog[]>>;
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, { date: string; fasted: boolean; fastType: string }>>>;
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
  khatmat: QuranKhatma[];
  setKhatmat: React.Dispatch<React.SetStateAction<QuranKhatma[]>>;
  dhikrLogs?: Record<string, Record<string, number>>;
  setDhikrLogs?: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  customDuas: CustomDua[];
  setCustomDuas: React.Dispatch<React.SetStateAction<CustomDua[]>>;
}

export default function MoreSettings({
  subTab,
  setSubTab,
  settings,
  setSettings,
  pendingQadaPrayers,
  setPendingQadaPrayers,
  ramadanQada,
  setRamadanQada,
  prayerLogs,
  setPrayerLogs,
  voluntaryPrayerLogs,
  setVoluntaryPrayerLogs,
  fastingLogs,
  setFastingLogs,
  quranSessions,
  setQuranSessions,
  khatmat,
  setKhatmat,
  dhikrLogs,
  setDhikrLogs,
  customDuas,
  setCustomDuas,
}: MoreSettingsProps) {
  const [appModal, setAppModal] = useState<{ message: string; variant: AppModalVariant } | null>(null);

  const [fajrMuezzin, setFajrMuezzin] = useState(() => safeGetItem('salah_fajr_muezzin') || 'fajr_yusuf');
  const [generalMuezzin, setGeneralMuezzin] = useState(() => safeGetItem('salah_general_muezzin') || 'makkah');
  const [audioVolume, setAudioVolume] = useState(() => {
    const saved = safeGetItem('salah_audio_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  const [autoPlayAthan, setAutoPlayAthan] = useState(() => safeGetItem('salah_auto_play_athan') !== 'false');

  useEffect(() => {
    safeSetItem('salah_fajr_muezzin', fajrMuezzin);
  }, [fajrMuezzin]);

  useEffect(() => {
    safeSetItem('salah_general_muezzin', generalMuezzin);
  }, [generalMuezzin]);

  useEffect(() => {
    safeSetItem('salah_audio_volume', audioVolume.toString());
  }, [audioVolume]);

  useEffect(() => {
    safeSetItem('salah_auto_play_athan', autoPlayAthan ? 'true' : 'false');
  }, [autoPlayAthan]);

  return (
    <div id="settings-root" className="space-y-6 text-end animate-fade-in w-full" dir="rtl">
      {/* ==================== 1. PRAYER CALCULATIONS & MADHAB ==================== */}
      {subTab === 'prayer' && (
        <PrayerSettingsTab
          settings={settings}
          setSettings={setSettings}
        />
      )}

      {/* ==================== 2. ATHAN SOUND & MUEZZINS ==================== */}
      {subTab === 'adhan' && (
        <AdhanSettingsTab
          settings={settings}
          setSettings={setSettings}
          fajrMuezzin={fajrMuezzin}
          setFajrMuezzin={setFajrMuezzin}
          generalMuezzin={generalMuezzin}
          setGeneralMuezzin={setGeneralMuezzin}
          audioVolume={audioVolume}
          setAudioVolume={setAudioVolume}
          autoPlayAthan={autoPlayAthan}
          setAutoPlayAthan={setAutoPlayAthan}
          setAppModal={setAppModal}
        />
      )}

      {/* ==================== 3. HIJRI CALENDAR ADJUST ==================== */}
      {subTab === 'calendar' && (
        <CalendarSettingsTab
          settings={settings}
          setSettings={setSettings}
        />
      )}

      {/* ==================== 4. THEME & APPEARANCE ==================== */}
      {subTab === 'theme' && (
        <ThemeSettingsTab
          settings={settings}
          setSettings={setSettings}
        />
      )}

      {/* ==================== 5. LOCATION & CITY ==================== */}
      {subTab === 'location' && (
        <LocationSettingsTab
          settings={settings}
          setSettings={setSettings}
          setAppModal={setAppModal}
        />
      )}

      {/* ==================== 6. QADA & MISSED LOGS ==================== */}
      {subTab === 'qada' && (
        <QadaSettingsTab
          ramadanQada={ramadanQada}
          setRamadanQada={setRamadanQada}
          setFastingLogs={setFastingLogs}
          pendingQadaPrayers={pendingQadaPrayers}
          setPendingQadaPrayers={setPendingQadaPrayers}
          setAppModal={setAppModal}
        />
      )}

      {/* ==================== 7. CUSTOM DUAS ==================== */}
      {subTab === 'duas' && (
        <DuasSettingsTab
          customDuas={customDuas}
          setCustomDuas={setCustomDuas}
        />
      )}

      {/* ==================== 8. DATA BACKUP & RESTORE ==================== */}
      {subTab === 'backup' && (
        <BackupSettingsTab
          settings={settings}
          setSettings={setSettings}
          prayerLogs={prayerLogs}
          setPrayerLogs={setPrayerLogs}
          pendingQadaPrayers={pendingQadaPrayers}
          setPendingQadaPrayers={setPendingQadaPrayers}
          voluntaryPrayerLogs={voluntaryPrayerLogs}
          setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
          fastingLogs={fastingLogs}
          setFastingLogs={setFastingLogs}
          ramadanQada={ramadanQada}
          setRamadanQada={setRamadanQada}
          quranSessions={quranSessions}
          setQuranSessions={setQuranSessions}
          khatmat={khatmat}
          setKhatmat={setKhatmat}
          dhikrLogs={dhikrLogs}
          setDhikrLogs={setDhikrLogs}
          customDuas={customDuas}
          setCustomDuas={setCustomDuas}
          fajrMuezzin={fajrMuezzin}
          setFajrMuezzin={setFajrMuezzin}
          generalMuezzin={generalMuezzin}
          setGeneralMuezzin={setGeneralMuezzin}
          audioVolume={audioVolume}
        />
      )}

      {/* ==================== 9. DASHBOARD SECTIONS CUSTOMIZATION ==================== */}
      {subTab === 'dashboard' && <DashboardSectionsTab />}

      {appModal && (
        <AppModal
          message={appModal.message}
          variant={appModal.variant}
          onClose={() => setAppModal(null)}
        />
      )}
    </div>
  );
}
