/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { HijriDateInfo, toArabicNumbers } from '../../utils/hijri';
import { getMoonPhaseInfo } from '../../utils/moonPhases';

interface FastingMoonSynergyProps {
  hijriToday: HijriDateInfo;
  onNavigateTab?: (tab: string) => void;
}

export default function FastingMoonSynergy({
  hijriToday,
  onNavigateTab
}: FastingMoonSynergyProps) {
  const moonInfo = getMoonPhaseInfo(hijriToday.day);
  const isWhiteDay = hijriToday.day === 13 || hijriToday.day === 14 || hijriToday.day === 15;

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-4 sm:p-5 border border-indigo-500/20 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 w-full md:w-auto">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-2xl shrink-0">
          {moonInfo.icon}
        </div>
        <div className="space-y-0.5 text-end">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              طور القمر اليوم: {moonInfo.name}
            </h3>
            {isWhiteDay && (
              <span className="bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/20 animate-pulse">
                ✨ صيام الأيام البيض
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {moonInfo.fastingNote}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 dark:border-slate-800/60 pt-3 md:pt-0">
        <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 font-mono">
          إضاءة {toArabicNumbers(moonInfo.illumination)}%
        </span>
        {onNavigateTab && (
          <button
            type="button"
            onClick={() => onNavigateTab('moon')}
            className="bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>عرض أطوار ومنازل القمر</span>
          </button>
        )}
      </div>
    </div>
  );
}
