/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { toArabicNumbers } from '../../../utils/hijri';
import { 
  DAYS_RTL_LABELS, 
  ARABIC_MONTH_NAMES, 
  type HeatmapCellData 
} from './heatmapUtils';

export interface HeatmapGridProps {
  cells: HeatmapCellData[];
  paddingCount: number;
  month: number;
  onSelectDay: (dateStr: string) => void;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = ({
  cells,
  paddingCount,
  month,
  onSelectDay,
}) => {
  return (
    <div className="space-y-2">
      {/* Days Header Row (RTL) */}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-black text-slate-400 dark:text-slate-500 py-1">
        {DAYS_RTL_LABELS.map((dayLabel, idx) => (
          <div key={idx} className="py-0.5">
            {dayLabel}
          </div>
        ))}
      </div>

      {/* Heatmap Cells */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {/* Offset Padding Cells */}
        {Array.from({ length: paddingCount }).map((_, idx) => (
          <div key={`pad-${idx}`} className="aspect-square rounded-xl bg-transparent" />
        ))}

        {/* Month Day Cells */}
        {cells.map((cell) => {
          let bgClass = 'bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600';
          if (cell.intensity === 1) bgClass = 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300';
          else if (cell.intensity === 2) bgClass = 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200';
          else if (cell.intensity === 3) bgClass = 'bg-emerald-400 dark:bg-emerald-700 text-white font-bold';
          else if (cell.intensity === 4) bgClass = 'bg-emerald-600 dark:bg-emerald-600 text-white font-black';
          else if (cell.intensity === 5) bgClass = 'bg-emerald-700 dark:bg-emerald-500 text-white font-black shadow-2xs';

          const borderClass = cell.isToday
            ? 'ring-2 ring-amber-400 dark:ring-amber-300 shadow-md font-black scale-105 z-10'
            : 'border border-slate-200/40 dark:border-slate-800/50';

          return (
            <motion.button
              key={cell.dateStr}
              whileTap={{ scale: 0.92 }}
              onClick={() => onSelectDay(cell.dateStr)}
              title={`${toArabicNumbers(cell.dayNumber)} ${ARABIC_MONTH_NAMES[month]}: ${toArabicNumbers(Math.round(cell.completionRatio * 5))}/5 صلوات`}
              aria-label={`${toArabicNumbers(cell.dayNumber)} ${ARABIC_MONTH_NAMES[month]}، إنجاز ${toArabicNumbers(Math.round(cell.completionRatio * 5))} من 5 صلوات`}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all cursor-pointer relative overflow-hidden ${bgClass} ${borderClass}`}
            >
              <span>{toArabicNumbers(cell.dayNumber)}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Legend below grid */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 px-1">
        <span className="font-bold">أقل</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700" title="صفر صلوات" />
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70" title="صلاة واحدة" />
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-200 dark:bg-emerald-900/80" title="صلاتان" />
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-400 dark:bg-emerald-700" title="3 صلوات" />
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 dark:bg-emerald-600" title="4 صلوات" />
          <span className="w-3.5 h-3.5 rounded-md bg-emerald-700 dark:bg-emerald-500" title="5 صلوات كاملة" />
        </div>
        <span className="font-bold">أكثر</span>
      </div>
    </div>
  );
};

export default HeatmapGrid;
