/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Volume2, VolumeX, ShieldCheck, MoreVertical } from 'lucide-react';
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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

      {/* Action Controls — just "more" + Add, so the primary action stands out */}
      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMoreMenu(prev => !prev)}
            aria-label="خيارات إضافية"
            title="خيارات إضافية"
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMoreMenu && (
            <div
              className="absolute left-0 mt-2 p-2 bg-white dark:bg-[#1a232e] border border-slate-200 dark:border-slate-750 rounded-2xl shadow-xl z-30 w-56 space-y-1"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Volume row */}
              <button
                type="button"
                onClick={() => setShowVolumeSlider(prev => !prev)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
              >
                {audioVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <span className="flex-1 text-right">مستوى صوت التنبيهات</span>
                <span className="font-mono text-slate-400">{toArabicNumbers(Math.round(audioVolume * 100))}%</span>
              </button>
              {showVolumeSlider && (
                <div className="px-2.5 pb-1.5">
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

              {/* Diagnostics row */}
              {onOpenDiagnostics && (
                <button
                  id="open-alarm-diagnostics-btn"
                  type="button"
                  onClick={() => {
                    setShowMoreMenu(false);
                    onOpenDiagnostics();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>فحص وتشخيص أداء المنبهات</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Add Alarm Button — the one action that stays primary */}
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
