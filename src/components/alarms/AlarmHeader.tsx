/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';

interface AlarmHeaderProps {
  enabledCount: number;
  totalCount: number;
  audioVolume: number;
  setAudioVolume: (vol: number) => void;
  showVolumeSlider: boolean;
  setShowVolumeSlider: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenAddModal: () => void;
  onOpenDiagnostics?: () => void;
}

export const AlarmHeader: React.FC<AlarmHeaderProps> = ({
  enabledCount,
  totalCount,
  audioVolume,
  setAudioVolume,
  showVolumeSlider,
  setShowVolumeSlider,
  onOpenAddModal,
  onOpenDiagnostics,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5 bg-white dark:bg-[#141b24] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-lg sm:text-2xl font-black text-slate-850 dark:text-slate-100">
            تنبيهات العبادة
          </h1>
          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40">
            {toArabicNumbers(enabledCount)} مفعل من {toArabicNumbers(totalCount)}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">
          تنبيهات مخصصة بدقة عالية مرتبطة بمواقيت الصلاة، السنن، والورد اليومي
        </p>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
        {/* Volume Control */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowVolumeSlider(prev => !prev)}
            aria-label={`مستوى صوت التنبيهات: ${Math.round(audioVolume * 100)}%`}
            title="مستوى صوت التنبيهات"
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            {audioVolume === 0 ? (
              <VolumeX className="w-5 h-5 text-rose-500" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </button>

          {/* Volume popover */}
          {showVolumeSlider && (
            <div 
              className="absolute left-0 mt-2 p-3 bg-white dark:bg-[#1a232e] border border-slate-200 dark:border-slate-750 rounded-2xl shadow-xl z-30 w-52 space-y-2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between text-xs font-black text-slate-700 dark:text-slate-300">
                <span>مستوى الصوت</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {toArabicNumbers(Math.round(audioVolume * 100))}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={audioVolume}
                onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Diagnostics Button */}
        {onOpenDiagnostics && (
          <button
            id="open-alarm-diagnostics-btn"
            type="button"
            onClick={onOpenDiagnostics}
            title="فحص وتشخيص أداء المنبهات والصلاحيات"
            aria-label="فحص وتشخيص أداء المنبهات والصلاحيات"
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>
        )}

        {/* Add Alarm Button */}
        <button
          id="add-new-alarm-btn"
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md transition-all active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>إضافة تنبيه</span>
        </button>
      </div>
    </div>
  );
};

export default AlarmHeader;
