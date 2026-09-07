/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MuezzinOption } from '../../../types';
import { MuezzinTrackItem } from './MuezzinTrackItem';
import { ArchiveMuezzinsSection } from './ArchiveMuezzinsSection';

export interface MuezzinSelectionSectionProps {
  label: string;
  defaultMuezzinsList: MuezzinOption[];
  archiveMuezzinsList: MuezzinOption[];
  selectedMuezzinId: string;
  onSelectMuezzin: (id: string) => void;
  showArchive: boolean;
  onToggleArchive: () => void;
  archiveTitleOpen: string;
  archiveTitleClosed: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  downloadedTrackIds: Set<string>;
  downloadingId: string | null;
  playingAudioId: string | null;
  audioIsPlaying: boolean;
  onDownloadTrack: (track: MuezzinOption) => void;
  onDeleteDownloadedTrack: (trackId: string) => void;
  onTogglePlayAudio: (id: string, url: string) => void;
}

export const MuezzinSelectionSection: React.FC<MuezzinSelectionSectionProps> = ({
  label,
  defaultMuezzinsList,
  archiveMuezzinsList,
  selectedMuezzinId,
  onSelectMuezzin,
  showArchive,
  onToggleArchive,
  archiveTitleOpen,
  archiveTitleClosed,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  downloadedTrackIds,
  downloadingId,
  playingAudioId,
  audioIsPlaying,
  onDownloadTrack,
  onDeleteDownloadedTrack,
  onTogglePlayAudio,
}) => {
  return (
    <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-end">
      <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">
        {label}
      </label>
      <div className="space-y-2">
        {defaultMuezzinsList.map((m) => (
          <MuezzinTrackItem
            key={m.id}
            muezzin={m}
            isSelected={selectedMuezzinId === m.id}
            isDownloaded={downloadedTrackIds.has(m.id) || m.id.startsWith('custom_')}
            isDownloading={downloadingId === m.id}
            isPlaying={playingAudioId === m.id && audioIsPlaying}
            onSelect={onSelectMuezzin}
            onDownload={onDownloadTrack}
            onDelete={onDeleteDownloadedTrack}
            onTogglePlay={onTogglePlayAudio}
          />
        ))}
      </div>

      {/* Expandable Section for Archive */}
      <ArchiveMuezzinsSection
        titleOpen={archiveTitleOpen}
        titleClosed={archiveTitleClosed}
        isOpen={showArchive}
        onToggleOpen={onToggleArchive}
        searchPlaceholder={searchPlaceholder}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        muezzins={archiveMuezzinsList}
        selectedMuezzinId={selectedMuezzinId}
        onSelectMuezzin={onSelectMuezzin}
        downloadedTrackIds={downloadedTrackIds}
        downloadingId={downloadingId}
        playingAudioId={playingAudioId}
        audioIsPlaying={audioIsPlaying}
        onDownloadTrack={onDownloadTrack}
        onDeleteDownloadedTrack={onDeleteDownloadedTrack}
        onTogglePlayAudio={onTogglePlayAudio}
      />
    </div>
  );
};

export default MuezzinSelectionSection;
