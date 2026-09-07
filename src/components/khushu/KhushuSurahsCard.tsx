/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';
import { QIYAM_RECOMMENDED_SURAHS } from './khushuConstants';

interface KhushuSurahsCardProps {
  onAddSurahToReading: (surahName: string) => void;
}

export const KhushuSurahsCard: React.FC<KhushuSurahsCardProps> = ({
  onAddSurahToReading,
}) => {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-white">
            سور وآيات كريمة لقيام الليل وتلاوة المحراب
          </h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
            مقترحات للسور المباركة التي يورث تدبرها الخشوع والطمأنينة في القيام
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {QIYAM_RECOMMENDED_SURAHS.map((surah) => (
          <div
            key={surah.id}
            className="p-4 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-slate-50/80 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2 flex flex-col justify-between"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                  {surah.name}
                </span>
                <span className="text-[10px] font-mono font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-lg">
                  {toArabicNumbers(surah.verses)} آية
                </span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                {surah.virtue}
              </p>
            </div>

            <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30 flex items-center justify-between">
              <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium">
                {surah.recommendation}
              </span>
              <button
                type="button"
                onClick={() => onAddSurahToReading(surah.name)}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all shrink-0 active:scale-95"
              >
                إضافة للتلاوة +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
