/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { FastingLog } from '../../types';
import { getHijriDate, toArabicNumbers } from '../../utils/hijri';
import { formatDateKey } from '../../utils/prayerDayBoundary';

export interface RecommendedFastItem {
  name: string;
  date: Date;
  type: string;
  desc: string;
}

interface FastingRecommendationsProps {
  recommendations: RecommendedFastItem[];
  fastingLogs: Record<string, FastingLog>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, FastingLog>>>;
  hijriOffset: number;
}

export default function FastingRecommendations({
  recommendations,
  fastingLogs,
  setFastingLogs,
  hijriOffset
}: FastingRecommendationsProps) {
  const handleToggleRecommended = (item: RecommendedFastItem) => {
    const dateKey = formatDateKey(item.date);
    const isLogged = fastingLogs[dateKey]?.fasted || false;
    const itemHijri = getHijriDate(item.date, hijriOffset);

    if (isLogged) {
      const updated = { ...fastingLogs };
      delete updated[dateKey];
      setFastingLogs(updated);
    } else {
      setFastingLogs(prev => ({
        ...prev,
        [dateKey]: {
          date: dateKey,
          hijriDate: itemHijri.fullString,
          fastType: 'Sunnah',
          fasted: true,
          isQada: false
        }
      }));
    }
  };

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 space-y-4 transition-colors duration-300">
      <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
        <Sparkles className="w-5 h-5 text-amber-500" />
        مواعيد الصيام المستحبة القادمة
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500">أيام يسن ويستحب صيامها وفقاً للتقويم الهجري والميلادي القادم:</p>

      <div className="space-y-2.5">
        {recommendations.map((item, idx) => {
          const dateKey = formatDateKey(item.date);
          const isLogged = fastingLogs[dateKey]?.fasted || false;

          return (
            <div 
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all flex justify-between items-center ${
                isLogged 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800/80'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-slate-800 dark:text-white">{item.name}</span>
                  <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                    مستحب
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                  {item.desc}
                </p>
                <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold">
                  الموافق: {toArabicNumbers(item.date.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }))}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleRecommended(item)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  isLogged 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                    : 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {isLogged ? 'تم الصيام ✓' : 'أخطط للصيام'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
