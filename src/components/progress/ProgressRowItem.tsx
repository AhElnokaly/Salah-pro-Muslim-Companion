/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProgressItemData, ProgressTierInfo } from '../../utils/progressEngine';
import { toArabicNumbers } from '../../utils/hijri';
import { CircularProgressRing } from './CircularProgressRing';

export interface ProgressRowItemProps {
  key?: React.Key;
  item: ProgressItemData;
  isDark: boolean;
  onNavigateTab?: (tab: string) => void;
}

export function ProgressRowItem({ item, isDark, onNavigateTab }: ProgressRowItemProps) {
  const tier: ProgressTierInfo = item.tier;

  const handleClick = () => {
    if (!onNavigateTab) return;
    if (item.id === 'salah' || item.id === 'sunnah') {
      window.dispatchEvent(new CustomEvent('navigate-salah-subtab', { detail: 'worship' }));
      onNavigateTab('salah');
    }
    else if (item.id === 'adhkar') onNavigateTab('adhkar');
    else if (item.id === 'fasting') onNavigateTab('fasting');
    else if (item.id === 'quran') onNavigateTab('quran');
  };

  const hasLatePrayers = item.id === 'salah' && (item.lateValue || 0) > 0;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`عرض تفاصيل ${item.categoryName} - نسبة الإنجاز ${toArabicNumbers(item.percentage)}% (${item.detailText})`}
      className={`p-1.5 xs:p-2 sm:p-3 rounded-2xl sm:rounded-3xl border transition-all duration-300 hover:scale-[1.03] active:scale-95 cursor-pointer group flex flex-col items-center justify-between text-center relative shadow-xs focus:outline-none w-full min-h-[140px] xs:min-h-[150px] sm:min-h-[165px] ${
        isDark ? 'bg-white/[0.04] border-white/10 hover:bg-white/[0.08]' : 'bg-slate-50/90 border-slate-200/80 hover:bg-white hover:shadow-md'
      }`}
    >
      {/* Top Badge Pill */}
      <div className={`px-1.5 py-0.5 rounded-full text-[7.5px] xs:text-[8.5px] sm:text-[9.5px] font-black flex items-center justify-center gap-0.5 shadow-2xs ${tier.colorClasses.badgeBg} ${tier.colorClasses.glow}`}>
        <span className="text-[8.5px] xs:text-[9.5px]">{tier.badgeSymbol}</span>
        <span className="text-[7.5px] xs:text-[8.5px] font-black">{tier.shortLabel.split(' ')[0]}</span>
      </div>

      {/* Responsive SVG Circular Ring */}
      <CircularProgressRing
        percentage={item.percentage}
        tier={tier}
        icon={item.icon}
        onTimePercentage={item.onTimePercentage}
        latePercentage={item.latePercentage}
      />

      {/* Titles & Details */}
      <div className="space-y-0.5 w-full flex flex-col items-center justify-center text-center mt-auto">
        <h4 className="text-[10.5px] xs:text-[11.5px] sm:text-xs font-black text-slate-900 dark:text-slate-100 leading-tight">
          {item.categoryName}
        </h4>
        <p className="text-[8px] xs:text-[8.5px] sm:text-[10px] text-slate-600 dark:text-slate-300 font-bold leading-tight px-0.5 max-w-full break-words">
          {toArabicNumbers(item.detailText)}
        </p>

        {hasLatePrayers && (
          <div className="flex flex-col xs:flex-row items-center justify-center gap-0.5 mt-1 w-full">
            <span className="inline-flex items-center justify-center gap-0.5 px-1 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 text-[7px] xs:text-[8px] font-black leading-none whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
              {toArabicNumbers(item.onTimeValue || 0)} حاضراً
            </span>
            <span className="inline-flex items-center justify-center gap-0.5 px-1 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-300 text-[7px] xs:text-[8px] font-black leading-none whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
              {toArabicNumbers(item.lateValue || 0)} متأخر
            </span>
          </div>
        )}
      </div>
    </button>
  );
}
