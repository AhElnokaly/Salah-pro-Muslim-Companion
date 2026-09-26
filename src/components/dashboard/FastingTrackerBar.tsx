/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Moon, Check, Sparkles } from 'lucide-react';

export interface FastingTrackerBarProps {
  isFasted: boolean;
  onToggleFasting: () => void;
}

export const FastingTrackerBar: React.FC<FastingTrackerBarProps> = ({
  isFasted,
  onToggleFasting,
}) => {
  return (
    <div className="w-full bg-white/80 dark:bg-[#121922]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-3 sm:p-3.5 shadow-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
          isFasted
            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            : 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20'
        }`}>
          {isFasted ? <Sparkles className="w-5 h-5 text-emerald-500" /> : <Moon className="w-5 h-5" />}
        </div>
        <div className="text-right">
          <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
            {isFasted ? 'تقبل الله صيامك وطاعتك اليوم ✨' : 'تسجيل صيام اليوم'}
          </span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">
            {isFasted ? 'تم تسجيل الصيام بنجاح في السجل الإيماني' : 'صيام التطوع، القضاء، أو صيام الكفارة والنذر'}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleFasting}
        className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all duration-200 shrink-0 cursor-pointer flex items-center gap-1.5 active:scale-95 ${
          isFasted
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
            : 'bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
        }`}
      >
        {isFasted ? (
          <>
            <Check className="w-3.5 h-3.5" />
            <span>صائم اليوم 🌿</span>
          </>
        ) : (
          <span>سجل كصائم 🌙</span>
        )}
      </button>
    </div>
  );
};

export default FastingTrackerBar;
