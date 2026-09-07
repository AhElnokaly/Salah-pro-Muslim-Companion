/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { AppSettings, PrayerName } from '../../types';
import { AppModalVariant } from '../shared/AppModal';
import { AdhanAudioPlaybar } from './adhan/AdhanAudioPlaybar';
import { OfflineStorageCard } from './adhan/OfflineStorageCard';
import { IndividualPrayerToggles } from './adhan/IndividualPrayerToggles';
import { BackgroundAthansCard } from './adhan/BackgroundAthansCard';
import { AdhanVolumeControls } from './adhan/AdhanVolumeControls';
import { MuezzinSelectionSection } from './adhan/MuezzinSelectionSection';
import { useAdhanAudioLogic } from './adhan/useAdhanAudioLogic';

interface AdhanSettingsTabProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  fajrMuezzin: string;
  setFajrMuezzin: React.Dispatch<React.SetStateAction<string>>;
  generalMuezzin: string;
  setGeneralMuezzin: React.Dispatch<React.SetStateAction<string>>;
  audioVolume: number;
  setAudioVolume: React.Dispatch<React.SetStateAction<number>>;
  autoPlayAthan: boolean;
  setAutoPlayAthan: React.Dispatch<React.SetStateAction<boolean>>;
  setAppModal: React.Dispatch<React.SetStateAction<{ message: string; variant: AppModalVariant } | null>>;
}

export default function AdhanSettingsTab({
  settings,
  setSettings,
  fajrMuezzin,
  setFajrMuezzin,
  generalMuezzin,
  setGeneralMuezzin,
  audioVolume,
  setAudioVolume,
  autoPlayAthan,
  setAutoPlayAthan,
  setAppModal,
}: AdhanSettingsTabProps) {
  const [showArchiveFajr, setShowArchiveFajr] = useState(false);
  const [showArchiveGeneral, setShowArchiveGeneral] = useState(false);
  const [fajrSearch, setFajrSearch] = useState('');
  const [generalSearch, setGeneralSearch] = useState('');

  const {
    muezzins,
    playingAudio,
    audioIsPlaying,
    audioCurrentTime,
    audioDuration,
    playbackSpeed,
    audioError,
    audioSuccessMessage,
    downloadedTrackIds,
    downloadingId,
    storageStats,
    isBulkDownloading,
    bulkProgress,
    togglePlayAudio,
    handleSkip,
    handleSeek,
    handleSpeedChange,
    handleStopAudio,
    handleDownloadTrack,
    handleDeleteDownloadedTrack,
    handleBatchDownloadDefaults,
  } = useAdhanAudioLogic({ audioVolume });

  const handleToggleAdhan = (prayer: PrayerName) => {
    setSettings((prev) => ({
      ...prev,
      adhanEnabled: {
        ...prev.adhanEnabled,
        [prayer]: !prev.adhanEnabled[prayer],
      },
    }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Volume2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
        <h2 className="text-lg font-black text-slate-800 dark:text-white">إصدار الأذان وأصوات المؤذنين</h2>
      </div>

      {/* Premium Interactive Audio Player / Scrubber */}
      {playingAudio && (
        <AdhanAudioPlaybar
          playingAudio={playingAudio}
          audioIsPlaying={audioIsPlaying}
          audioCurrentTime={audioCurrentTime}
          audioDuration={audioDuration}
          playbackSpeed={playbackSpeed}
          audioError={audioError}
          audioSuccessMessage={audioSuccessMessage}
          onStopAudio={handleStopAudio}
          onTogglePlay={togglePlayAudio}
          onSkip={handleSkip}
          onSeek={handleSeek}
          onSpeedChange={handleSpeedChange}
        />
      )}

      {/* Unified Muezzins Selection with Play Test Controls */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/40 pb-3">
          <h3 className="text-sm font-black text-slate-800 dark:text-white">المؤذنون الافتراضيون</h3>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">معاينة الصوت فورية</span>
        </div>

        {/* Offline Storage Dashboard & Batch Download */}
        <OfflineStorageCard
          storageStats={storageStats}
          isBulkDownloading={isBulkDownloading}
          bulkProgress={bulkProgress}
          onBatchDownloadDefaults={handleBatchDownloadDefaults}
        />

        {/* Volume and Auto Play Controls */}
        <AdhanVolumeControls
          audioVolume={audioVolume}
          setAudioVolume={setAudioVolume}
          autoPlayAthan={autoPlayAthan}
          setAutoPlayAthan={setAutoPlayAthan}
        />

        {/* Reliable Background Athans Control & Privacy Badge */}
        <BackgroundAthansCard setAppModal={setAppModal} />

        {/* Default Fajr Muezzin */}
        <MuezzinSelectionSection
          label="صوت أذان الفجر (الخاص بالتثويب)"
          defaultMuezzinsList={muezzins.filter((m) => m.isFajr && !m.id.startsWith('archive_'))}
          archiveMuezzinsList={muezzins.filter(
            (m) =>
              m.isFajr &&
              m.id.startsWith('archive_') &&
              m.name.toLowerCase().includes(fajrSearch.toLowerCase())
          )}
          selectedMuezzinId={fajrMuezzin}
          onSelectMuezzin={setFajrMuezzin}
          showArchive={showArchiveFajr}
          onToggleArchive={() => setShowArchiveFajr(!showArchiveFajr)}
          archiveTitleOpen="إخفاء أصوات أذان الفجر الإضافية"
          archiveTitleClosed="عرض أصوات أذان الفجر الإضافية (٣٠ صوتاً من المكتبة الشاملة)"
          searchPlaceholder="البحث عن مؤذن للفجر..."
          searchValue={fajrSearch}
          onSearchChange={setFajrSearch}
          downloadedTrackIds={downloadedTrackIds}
          downloadingId={downloadingId}
          playingAudioId={playingAudio?.id || null}
          audioIsPlaying={audioIsPlaying}
          onDownloadTrack={handleDownloadTrack}
          onDeleteDownloadedTrack={handleDeleteDownloadedTrack}
          onTogglePlayAudio={togglePlayAudio}
        />

        {/* Default General Muezzin */}
        <MuezzinSelectionSection
          label="صوت بقية الصلوات (المساجد الشهيرة)"
          defaultMuezzinsList={muezzins.filter((m) => !m.isFajr && !m.id.startsWith('archive_'))}
          archiveMuezzinsList={muezzins.filter(
            (m) =>
              !m.isFajr &&
              m.id.startsWith('archive_') &&
              m.name.toLowerCase().includes(generalSearch.toLowerCase())
          )}
          selectedMuezzinId={generalMuezzin}
          onSelectMuezzin={setGeneralMuezzin}
          showArchive={showArchiveGeneral}
          onToggleArchive={() => setShowArchiveGeneral(!showArchiveGeneral)}
          archiveTitleOpen="إخفاء أصوات الصلوات الإضافية"
          archiveTitleClosed="عرض أصوات الصلوات الإضافية (٦٠ صوتاً من المكتبة الشاملة)"
          searchPlaceholder="البحث عن مؤذن..."
          searchValue={generalSearch}
          onSearchChange={setGeneralSearch}
          downloadedTrackIds={downloadedTrackIds}
          downloadingId={downloadingId}
          playingAudioId={playingAudio?.id || null}
          audioIsPlaying={audioIsPlaying}
          onDownloadTrack={handleDownloadTrack}
          onDeleteDownloadedTrack={handleDeleteDownloadedTrack}
          onTogglePlayAudio={togglePlayAudio}
        />
      </div>

      {/* Individual Prayer Notification Toggles */}
      <IndividualPrayerToggles
        settings={settings}
        onToggleAdhan={handleToggleAdhan}
      />
    </div>
  );
}
