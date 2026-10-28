/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DuhaQuickLogModal } from './DuhaQuickLogModal';
import { NightPrayersQuickLogModal } from './NightPrayersQuickLogModal';
import { 
  AppSettings, 
  PendingQadaPrayer, 
  PrayerLog, 
  VoluntaryPrayerLog, 
  AlarmConfig, 
  SpiritualAlerts 
} from '../types';
import { PrayerTimesView } from './prayer/PrayerTimesView';
import { PrayerWorshipView } from './prayer/PrayerWorshipView';
import { athanPhrases } from './prayer/prayerUtils';
import { usePrayerManagerLogic } from './prayer/usePrayerManagerLogic';
import { PrayerManagerHeader } from './prayer/PrayerManagerHeader';

interface PrayerManagerProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
  setVoluntaryPrayerLogs?: React.Dispatch<React.SetStateAction<VoluntaryPrayerLog[]>>;
  customAlarms: AlarmConfig[];
  setCustomAlarms: React.Dispatch<React.SetStateAction<AlarmConfig[]>>;
  alerts: SpiritualAlerts;
  setAlerts: React.Dispatch<React.SetStateAction<SpiritualAlerts>>;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export default function PrayerManager({
  settings,
  setSettings,
  prayerLogs,
  setPrayerLogs,
  pendingQadaPrayers,
  setPendingQadaPrayers,
  voluntaryPrayerLogs = [],
  setVoluntaryPrayerLogs,
  onNavigateTab
}: PrayerManagerProps) {
  const {
    activeSubTab,
    setActiveSubTab,
    worshipTab,
    setWorshipTab,
    qadaPace,
    setQadaPace,
    selectedDateOffset,
    setSelectedDateOffset,
    logSuccessMessage,
    setLogSuccessMessage,
    showDuhaModal,
    setShowDuhaModal,
    showNightPrayersModal,
    setShowNightPrayersModal,
    currentTime,
    clockFace,
    setClockFace,
    isPlaying,
    prayerMuezzins,
    setPrayerMuezzins,
    currentMuezzin,
    setCurrentMuezzin,
    fajrMuezzin,
    setFajrMuezzin,
    muezzins,
    downloadedTrackIds,
    togglePlayAthan,
    dateStr,
    targetDate,
    targetTimestamp,
    hijri,
    times,
    dayLogs,
    handleLogPrayerStatus,
    handleUpdateSunnah,
    handleUpdateNafilah,
    qadaCounts,
    totalQadaCount,
    handleAddManualQada,
    handlePerformQada,
    handleAddFullDayQada,
    handleResetAllQada,
  } = usePrayerManagerLogic({
    settings,
    prayerLogs,
    setPrayerLogs,
    pendingQadaPrayers,
    setPendingQadaPrayers,
    voluntaryPrayerLogs,
    setVoluntaryPrayerLogs,
  });

  return (
    <div id="prayer-manager-root" className="space-y-4 text-right" dir="rtl">
      {/* Sleek Header Tabs & Notifications */}
      <PrayerManagerHeader
        activeSubTab={activeSubTab}
        setActiveSubTab={setActiveSubTab}
        totalQadaCount={totalQadaCount}
        logSuccessMessage={logSuccessMessage}
      />

      {/* --- SubTab: Times View --- */}
      {activeSubTab === 'times' && (
        <PrayerTimesView
          times={times}
          currentTime={currentTime}
          targetDate={targetDate}
          hijri={hijri}
          clockFace={clockFace}
          setClockFace={setClockFace}
          dayLogs={dayLogs}
          prayerMuezzins={prayerMuezzins}
          setPrayerMuezzins={setPrayerMuezzins}
          currentMuezzin={currentMuezzin}
          setCurrentMuezzin={setCurrentMuezzin}
          fajrMuezzin={fajrMuezzin}
          setFajrMuezzin={setFajrMuezzin}
          muezzins={muezzins}
          downloadedTrackIds={downloadedTrackIds}
          isPlaying={isPlaying}
          currentPlayingPrayer={null}
          togglePlayAthan={togglePlayAthan}
          targetTimestamp={targetTimestamp.getTime()}
          handleLogPrayerStatus={handleLogPrayerStatus}
          settings={settings}
          setSettings={setSettings}
          setLogSuccessMessage={setLogSuccessMessage}
          setShowDuhaModal={setShowDuhaModal}
          setShowNightPrayersModal={setShowNightPrayersModal}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* --- SubTab: Worship & Missed Prayers View --- */}
      {activeSubTab === 'worship' && (
        <PrayerWorshipView
          worshipTab={worshipTab}
          setWorshipTab={setWorshipTab}
          selectedDateOffset={selectedDateOffset}
          setSelectedDateOffset={setSelectedDateOffset}
          targetDate={targetDate}
          hijri={hijri}
          targetTimestamp={targetTimestamp.getTime()}
          dayLogs={dayLogs}
          times={times}
          settings={settings}
          handleLogPrayerStatus={handleLogPrayerStatus}
          handleUpdateSunnah={handleUpdateSunnah}
          handleUpdateNafilah={handleUpdateNafilah}
          setShowDuhaModal={setShowDuhaModal}
          setLogSuccessMessage={setLogSuccessMessage}
          isPlaying={isPlaying}
          currentPhraseIdx={-1}
          athanPhrases={athanPhrases}
          currentPlayingPrayer={null}
          totalQadaCount={totalQadaCount}
          handleAddFullDayQada={handleAddFullDayQada}
          handleResetAllQada={handleResetAllQada}
          qadaPace={qadaPace}
          setQadaPace={setQadaPace}
          qadaCounts={qadaCounts}
          handlePerformQada={handlePerformQada}
          handleAddManualQada={handleAddManualQada}
          prayerLogs={prayerLogs}
          voluntaryPrayerLogs={voluntaryPrayerLogs}
        />
      )}

      {/* Duha Prayer BottomSheet Modal */}
      <DuhaQuickLogModal
        isOpen={showDuhaModal}
        onClose={() => setShowDuhaModal(false)}
        dateStr={dateStr}
        prayerLogs={prayerLogs}
        setPrayerLogs={setPrayerLogs}
        voluntaryPrayerLogs={voluntaryPrayerLogs}
        setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
        onSuccess={(msg) => setLogSuccessMessage(msg)}
      />

      {/* Night Prayers BottomSheet Modal */}
      <NightPrayersQuickLogModal
        isOpen={showNightPrayersModal}
        onClose={() => setShowNightPrayersModal(false)}
        dateStr={dateStr}
        prayerLogs={prayerLogs}
        setPrayerLogs={setPrayerLogs}
        voluntaryPrayerLogs={voluntaryPrayerLogs}
        setVoluntaryPrayerLogs={setVoluntaryPrayerLogs}
        onSuccess={(msg) => setLogSuccessMessage(msg)}
      />

      {/* Noticeable bottom/center notification when falling back to default athan preview */}
      {logSuccessMessage && logSuccessMessage.includes('الصوت الافتراضي لأن المؤذن المختار غير متاح') && (
        <div
          id="athan-preview-fallback-banner"
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[92vw] sm:max-w-md bg-amber-950/95 dark:bg-amber-900/95 text-amber-100 border border-amber-500/60 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-center gap-2.5 text-xs sm:text-sm font-black text-center animate-fade-in pointer-events-none"
        >
          <span className="shrink-0 text-base">⚠️</span>
          <span>{logSuccessMessage}</span>
        </div>
      )}
    </div>
  );
}
