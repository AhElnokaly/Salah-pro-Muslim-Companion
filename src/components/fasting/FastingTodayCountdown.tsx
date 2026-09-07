/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Trash2, Sun, Moon } from 'lucide-react';
import { FastingLog } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';

interface FastingTodayCountdownProps {
  isFastingToday: boolean;
  todayLog?: FastingLog;
  countdown: {
    label: string;
    timeStr: string;
    percent?: number;
  };
  onToggleFastToday: (type: 'Ramadan' | 'Sunnah' | 'Qada' | 'Kaffarah' | 'Nazar') => void;
}

export default function FastingTodayCountdown({
  isFastingToday,
  todayLog,
  countdown,
  onToggleFastToday
}: FastingTodayCountdownProps) {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 space-y-4 transition-colors duration-300">
      <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
        <Clock className="w-5 h-5 text-indigo-500" />
        حالة الصيام اليوم
      </h3>

      {/* Big Circular Ring for Fasting Progress */}
      <div className="flex flex-col items-center justify-center py-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-slate-800/50">
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Outer Progress Tracker Ring */}
          <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle 
              cx="50" 
              cy="50" 
              r="44" 
              stroke="rgba(99, 102, 241, 0.1)" 
              strokeWidth="4" 
              fill="transparent" 
            />
            <circle 
              cx="50" 
              cy="50" 
              r="44" 
              stroke="#f59e0b" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray="276.46" 
              strokeDashoffset={276.46 - (276.46 * (countdown.percent ?? 0)) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="text-center space-y-1">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
              {isFastingToday ? 'أنت صائم اليوم 🤲' : 'لم تسجل صياماً اليوم'}
            </span>
            <div className="text-2xl font-black font-mono tracking-widest text-slate-800 dark:text-white leading-none">
              {toArabicNumbers(countdown.timeStr)}
            </div>
            <span className="text-[9px] bg-amber-500/10 dark:bg-amber-400/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold inline-block">
              {countdown.percent !== undefined ? `اكتمل ${toArabicNumbers(Math.round(countdown.percent))}%` : 'تتبع المسير'}
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center px-4 font-semibold">
          {countdown.label}
        </p>
      </div>

      {/* Quick Log Buttons */}
      <div className="space-y-2">
        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold">تسجيل سريع لصيام اليوم:</p>
        {isFastingToday ? (
          <button
            type="button"
            onClick={() => onToggleFastToday(todayLog?.fastType || 'Sunnah')}
            className="w-full p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center gap-2 font-black cursor-pointer shadow-xs transition-transform active:scale-98"
          >
            <Trash2 className="w-4 h-4" />
            إلغاء صيام اليوم
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onToggleFastToday('Sunnah')}
              className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/20 hover:bg-indigo-100/50 text-center font-extrabold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-bold">صيام نافلة (سنة)</span>
            </button>
            <button
              type="button"
              onClick={() => onToggleFastToday('Qada')}
              className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/20 hover:bg-amber-100/50 text-center font-extrabold flex flex-col items-center justify-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Moon className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-bold">صيام قضاء رمضان</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
