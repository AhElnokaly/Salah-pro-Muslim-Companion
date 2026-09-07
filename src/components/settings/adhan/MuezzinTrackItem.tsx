import React from 'react';
import {
  Check,
  Download,
  Trash2,
  Play,
  Pause,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { MuezzinOption } from '../../../types';

interface MuezzinTrackItemProps {
  muezzin: MuezzinOption;
  isSelected: boolean;
  isDownloaded: boolean;
  isDownloading: boolean;
  isPlaying: boolean;
  onSelect: (id: string) => void;
  onDownload: (track: MuezzinOption) => void;
  onDelete: (trackId: string) => void;
  onTogglePlay: (id: string, url: string) => void;
}

export const MuezzinTrackItem: React.FC<MuezzinTrackItemProps> = ({
  muezzin,
  isSelected,
  isDownloaded,
  isDownloading,
  isPlaying,
  onSelect,
  onDownload,
  onDelete,
  onTogglePlay,
}) => {
  return (
    <div
      onClick={() => onSelect(muezzin.id)}
      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20'
          : 'border-slate-150 dark:border-slate-800/70 hover:bg-slate-50 dark:hover:bg-[#111720]'
      }`}
    >
      <div className="flex items-center gap-2">
        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
        <span className="text-xs font-black text-slate-700 dark:text-slate-200">{muezzin.name}</span>
        {isDownloaded ? (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            ⚡ أوفلاين
          </span>
        ) : (
          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700">
            🌐 أونلاين
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {isDownloaded ? (
          <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 px-2 py-1 rounded-lg text-[10px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span className="hidden sm:inline">محفوظ أوفلاين</span>
            {!muezzin.id.startsWith('custom_') && (
              <button
                type="button"
                onClick={() => onDelete(muezzin.id)}
                aria-label={`حذف الأذان المحفوظ للمؤذن ${muezzin.name}`}
                className="p-0.5 hover:text-rose-500 transition-colors ms-1 cursor-pointer"
                title="حذف النسخة المحفوظة أوفلاين"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onDownload(muezzin)}
            disabled={isDownloading}
            aria-label={`تحميل أذان المؤذن ${muezzin.name} أوفلاين`}
            className="flex items-center gap-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 px-2 py-1 rounded-lg text-[10px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer disabled:opacity-50"
            title="تحميل الأذان لحفظه والعمل أوفلاين بدون إنترنت"
          >
            {isDownloading ? (
              <Loader2 className="w-3 h-3 animate-spin text-indigo-500" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">
              {isDownloading ? 'جارٍ الحفظ...' : 'تحميل أوفلاين'}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onTogglePlay(muezzin.id, muezzin.url || muezzin.src || '')}
          aria-label={
            isPlaying
              ? `إيقاف صوت أذان ${muezzin.name}`
              : `استماع واختبار صوت أذان ${muezzin.name}`
          }
          className={`p-1.5 rounded-lg text-white transition-colors cursor-pointer ${
            isPlaying ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
          title="اختبر صوت المؤذن"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
};
