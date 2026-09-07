import React from 'react';
import { toArabicNumbers } from '../../../utils/hijri';

interface PrayerSunnahRowProps {
  label: string;
  prayerDisplayName: string;
  type: 'before' | 'after';
  currentRakahs: number;
  maxRakahs: number;
  onUpdateRakahs: (type: 'before' | 'after', delta: number) => void;
  onToggleComplete: (type: 'before' | 'after', targetAmount: number) => void;
}

export const PrayerSunnahRow: React.FC<PrayerSunnahRowProps> = ({
  label,
  prayerDisplayName,
  type,
  currentRakahs,
  maxRakahs,
  onUpdateRakahs,
  onToggleComplete,
}) => {
  const isComplete = currentRakahs >= maxRakahs;

  return (
    <div className="flex items-center justify-between p-3 bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10 rounded-2xl transition-all">
      <div className="text-right">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sans text-right block">
          {label} ({toArabicNumbers(maxRakahs)} ركعات)
        </span>
        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 text-right">
          {isComplete 
            ? `✨ اكتملت ${label}` 
            : currentRakahs > 0 
              ? `تمت صلاة ${toArabicNumbers(currentRakahs)} ركعات` 
              : 'لم تصلَّ بعد'}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onUpdateRakahs(type, -2)}
          className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center font-black text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
          aria-label={`إنقاص ركعتين من ${label} لصلاة ${prayerDisplayName}`}
        >
          -
        </button>

        <span 
          className="w-8 text-center font-black text-slate-800 dark:text-white text-xs font-mono"
          aria-label={`عدد الركعات المسجلة: ${currentRakahs}`}
        >
          {toArabicNumbers(currentRakahs)}
        </span>

        <button
          type="button"
          onClick={() => onUpdateRakahs(type, 2)}
          className="w-7 h-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center font-black text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all"
          aria-label={`زيادة ركعتين في ${label} لصلاة ${prayerDisplayName}`}
        >
          +
        </button>

        <button
          type="button"
          onClick={() => onToggleComplete(type, isComplete ? 0 : maxRakahs)}
          className={`px-2 py-1 text-[10px] font-black rounded-md cursor-pointer transition-all ${
            isComplete
              ? 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400'
          }`}
          aria-label={isComplete ? `تراجع عن تسجيل ${label}` : `تسجيل ${label} كاملة`}
        >
          {isComplete ? 'تراجع' : 'كاملة'}
        </button>
      </div>
    </div>
  );
};
