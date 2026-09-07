import React from 'react';
import {
  Check,
  Download,
  Trash2,
  Play,
  Pause,
  Loader2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import { MuezzinOption } from '../../../types';

interface ArchiveMuezzinsSectionProps {
  titleOpen: string;
  titleClosed: string;
  isOpen: boolean;
  onToggleOpen: () => void;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  muezzins: MuezzinOption[];
  selectedMuezzinId: string;
  onSelectMuezzin: (id: string) => void;
  downloadedTrackIds: Set<string>;
  downloadingId: string | null;
  playingAudioId: string | null;
  audioIsPlaying: boolean;
  onDownloadTrack: (track: MuezzinOption) => void;
  onDeleteDownloadedTrack: (trackId: string) => void;
  onTogglePlayAudio: (id: string, url: string) => void;
}

export const ArchiveMuezzinsSection: React.FC<ArchiveMuezzinsSectionProps> = ({
  titleOpen,
  titleClosed,
  isOpen,
  onToggleOpen,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  muezzins,
  selectedMuezzinId,
  onSelectMuezzin,
  downloadedTrackIds,
  downloadingId,
  playingAudioId,
  audioIsPlaying,
  onDownloadTrack,
  onDeleteDownloadedTrack,
  onTogglePlayAudio,
}) => {
  return (
    <div className="pt-2">
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between p-3 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs font-black text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-[#111720] transition-all cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {isOpen ? titleOpen : titleClosed}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/40">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full p-2.5 pe-10 ps-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111720] text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all text-end"
            />
            <Search className="w-4 h-4 text-slate-400 absolute end-3 top-3.5" />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pe-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {muezzins.map((m) => {
              const isSelected = selectedMuezzinId === m.id;
              const isDownloaded = downloadedTrackIds.has(m.id);
              const isDownloading = downloadingId === m.id;
              const isPlaying = playingAudioId === m.id && audioIsPlaying;
              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMuezzin(m.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-end ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10'
                      : 'border-slate-100 dark:border-slate-800/40 bg-white dark:bg-[#161d26] hover:bg-slate-50 dark:hover:bg-[#111720]/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isSelected && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />}
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{m.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {isDownloaded ? (
                      <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <button
                          type="button"
                          onClick={() => onDeleteDownloadedTrack(m.id)}
                          className="p-0.5 hover:text-rose-500 transition-colors cursor-pointer"
                          title="حذف النسخة المحفوظة"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onDownloadTrack(m)}
                        disabled={isDownloading}
                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
                        title="تحميل للعمل أوفلاين"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onTogglePlayAudio(m.id, m.url || m.src || '')}
                      className={`p-1 rounded-lg text-white transition-colors cursor-pointer ${
                        isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                      title="اختبر صوت المؤذن"
                    >
                      {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
