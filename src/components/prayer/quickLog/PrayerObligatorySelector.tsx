import React from 'react';
import { PrayerStatus } from '../../../types';

interface PrayerObligatorySelectorProps {
  status: PrayerStatus;
  gender?: 'male' | 'female';
  onSelectStatus: (status: PrayerStatus) => void;
}

export const PrayerObligatorySelector: React.FC<PrayerObligatorySelectorProps> = ({
  status,
  gender,
  onSelectStatus,
}) => {
  return (
    <div className="space-y-2.5">
      <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 block">
        الفريضة المكتوبة
      </span>
      <div className={`grid ${gender === 'female' ? 'grid-cols-4 gap-1.5' : 'grid-cols-3 gap-2'}`}>
        {/* option A: In Time */}
        <button
          type="button"
          onClick={() => onSelectStatus('A')}
          className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
            status === 'A'
              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-extrabold shadow-xs scale-[1.02]'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/50'
          }`}
          aria-label="تسجيل الفريضة: حاضر في وقتها"
          aria-pressed={status === 'A'}
        >
          <span className="text-lg">✅</span>
          <span className="text-[10px] leading-none whitespace-nowrap">حاضر</span>
        </button>

        {/* option B: Late */}
        <button
          type="button"
          onClick={() => onSelectStatus('B')}
          className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
            status === 'B'
              ? 'bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold shadow-xs scale-[1.02]'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/50'
          }`}
          aria-label="تسجيل الفريضة: صليتها متأخر"
          aria-pressed={status === 'B'}
        >
          <span className="text-lg">⏱️</span>
          <span className="text-[10px] leading-none whitespace-nowrap">صليتها متأخر</span>
        </button>

        {/* option D: Missed/Qada */}
        <button
          type="button"
          onClick={() => onSelectStatus('D')}
          className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
            status === 'D'
              ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold shadow-xs scale-[1.02]'
              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/50'
          }`}
          aria-label="تسجيل الفريضة: قضاء في الذمة"
          aria-pressed={status === 'D'}
        >
          <span className="text-lg">❌</span>
          <span className="text-[10px] leading-none whitespace-nowrap">قضاء</span>
        </button>

        {/* option E: Excused (Only visible if female) */}
        {gender === 'female' && (
          <button
            type="button"
            onClick={() => onSelectStatus('E')}
            className={`p-3 rounded-2xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
              status === 'E'
                ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-400 font-extrabold shadow-xs scale-[1.02]'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100/50'
            }`}
            aria-label="تسجيل الفريضة: عذر شرعي"
            aria-pressed={status === 'E'}
          >
            <span className="text-lg">🌸</span>
            <span className="text-[10px] leading-none whitespace-nowrap">عذر شرعي</span>
          </button>
        )}
      </div>
    </div>
  );
};
