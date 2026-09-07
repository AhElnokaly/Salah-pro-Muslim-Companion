import React from 'react';
import { PrayerName } from '../../../types';
import { toArabicNumbers } from '../../../utils/hijri';

interface PrayerNightPrayersSectionProps {
  currentWitrRakahs: number;
  currentQiyamRakahs: number;
  onUpdateNafilah: (nafilahName: PrayerName, rakahs: number) => void;
  onExpandNightPrayers: () => void;
}

export const PrayerNightPrayersSection: React.FC<PrayerNightPrayersSectionProps> = ({
  currentWitrRakahs,
  currentQiyamRakahs,
  onUpdateNafilah,
  onExpandNightPrayers,
}) => {
  return (
    <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500">
          الصلوات الليلية المصاحبة
        </span>
        <button
          type="button"
          onClick={onExpandNightPrayers}
          className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          aria-label="توسيع نافذة صلوات الليل والوتر والتهجد"
        >
          <span>توسيع نافذة صلاة الليل</span>
          <span aria-hidden="true">✨</span>
        </button>
      </div>

      <div className="space-y-2">
        {/* Quick Witr Row */}
        <div className="flex items-center justify-between p-2.5 bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10 rounded-2xl">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-right">
              🌟 الشفع والوتر
            </span>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 text-right">
              {currentWitrRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentWitrRakahs)} ركعة` : '١ أو ٣ ركعات'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 3].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onUpdateNafilah('Witr', currentWitrRakahs === r ? 0 : r)}
                aria-label={`تسجيل صلاة الوتر ${r} ${r === 1 ? 'ركعة' : 'ركعات'}`}
                aria-pressed={currentWitrRakahs === r}
                className={`px-2.5 py-1 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                  currentWitrRakahs === r
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs scale-105'
                    : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {toArabicNumbers(r)} {r === 1 ? 'ركعة' : 'ركعات'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Qiyam Row */}
        <div className="flex items-center justify-between p-2.5 bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10 rounded-2xl">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block text-right">
              🌃 قيام الليل والتهجد
            </span>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 text-right">
              {currentQiyamRakahs > 0 ? `تمت صلاة ${toArabicNumbers(currentQiyamRakahs)} ركعة` : '٢، ٤، ٨ ركعات'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[2, 4, 8].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onUpdateNafilah('Qiyam', currentQiyamRakahs === r ? 0 : r)}
                aria-label={`تسجيل قيام الليل ${r} ركعات`}
                aria-pressed={currentQiyamRakahs === r}
                className={`px-2 py-1 text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                  currentQiyamRakahs === r
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                    : 'bg-white dark:bg-slate-800 border-slate-200/60 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {toArabicNumbers(r)} ركعات
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
