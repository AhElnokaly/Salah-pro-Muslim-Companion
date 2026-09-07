/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Award, Clock, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { getSevenStationsProgress, PrayerKey, AdhkarStation } from '../../utils/adhkarCalc';
import { toArabicNumbers } from '../../utils/hijri';

export interface SevenSegmentProgressBarProps {
  dayLogs: Record<string, number>;
  activePrayerKey: PrayerKey;
  onStationSelect: (station: AdhkarStation) => void;
}

/**
 * Component for rendering the 7-Station Segmented Progress Bar
 */
export const SevenSegmentProgressBar: React.FC<SevenSegmentProgressBarProps> = ({
  dayLogs,
  activePrayerKey,
  onStationSelect,
}) => {
  // Calculate completion for each of the 7 stations
  const { stations: stationsData, completedStationsCount, overallPercentage } = useMemo(() => {
    return getSevenStationsProgress(dayLogs, activePrayerKey);
  }, [dayLogs, activePrayerKey]);

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-4 text-right transition-all">
      {/* Top Header & Daily Completion Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-lg shadow-md shadow-emerald-500/20 shrink-0">
              📿
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  شريط محطات الأذكار السبع اليومية
                </h3>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                  {toArabicNumbers(completedStationsCount)} من ٧ محطات ({toArabicNumbers(overallPercentage)}%)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                أذكار الصباح والمساء بالإضافة لأذكار الصلوات الخمس المكتوبة.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {completedStationsCount === 7 ? (
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-3 py-1.5 rounded-2xl border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5 shadow-sm animate-pulse">
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span>تاج الورد اليومي مكتمل! 🏆</span>
            </span>
          ) : (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>تتجدد محطة كل صلاة بوقتها</span>
            </div>
          )}
        </div>
      </div>

      {/* Overall Progress Micro-Bar */}
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700/50">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 rounded-full transition-all duration-700 shadow-sm"
          style={{ width: `${overallPercentage}%` }}
        />
      </div>

      {/* 7-Station Cards Strip (Scrollable on Mobile, 7-Grid on Desktop) */}
      <div className="flex md:grid md:grid-cols-7 gap-2 overflow-x-auto no-scrollbar snap-x snap-mandatory pt-1 pb-1 -mx-1 px-1">
        {stationsData.map((st) => (
          <motion.button
            key={st.id}
            type="button"
            whileTap={{ scale: 0.95 }}
            whileHover={{ y: -2 }}
            onClick={() => onStationSelect(st)}
            aria-label={`محطة ${st.title} - مكتمل ${toArabicNumbers(st.completedItems)} من ${toArabicNumbers(st.totalItems)} ذكر بنسبة ${toArabicNumbers(st.percent)}%${st.isCurrentTimeStation ? ' (المحطة الحالية)' : ''}`}
            title={`${st.title}: ${toArabicNumbers(st.completedItems)}/${toArabicNumbers(st.totalItems)} ذكر (${toArabicNumbers(st.percent)}%)`}
            className={`group relative flex-1 min-w-[76px] md:min-w-0 snap-center flex flex-col items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden text-right ${
              st.isDone
                ? 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 text-white border-emerald-400/80 shadow-md shadow-emerald-500/20'
                : st.isPartial
                ? 'bg-gradient-to-b from-amber-500 via-amber-600 to-orange-600 text-white border-amber-300/80 shadow-md shadow-amber-500/20'
                : st.isCurrentTimeStation
                ? 'bg-gradient-to-b from-indigo-50/90 to-blue-50/90 dark:from-indigo-950/80 dark:to-slate-900 border-2 border-indigo-500 dark:border-indigo-400 text-indigo-950 dark:text-indigo-100 shadow-md shadow-indigo-500/15 ring-2 ring-indigo-400/30'
                : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-slate-750 hover:border-emerald-300/60'
            }`}
          >
            {/* Top Row: Icon + Badge Status */}
            <div className="flex items-center justify-between w-full text-[11px] font-extrabold gap-1">
              <span className="text-sm select-none">{st.icon}</span>
              {st.isDone ? (
                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                </span>
              ) : st.isCurrentTimeStation ? (
                <span className="text-[9px] font-black bg-indigo-500 text-white px-1.5 py-0.2 rounded-full animate-pulse shadow-xs shrink-0">
                  الآن
                </span>
              ) : st.isPartial ? (
                <span className="text-[9px] font-black bg-white/20 text-white px-1.5 py-0.2 rounded-full shrink-0">
                  {toArabicNumbers(st.completedItems)}/{toArabicNumbers(st.totalItems)}
                </span>
              ) : (
                <span className="text-[9px] font-bold opacity-40">
                  {toArabicNumbers(st.totalItems)}
                </span>
              )}
            </div>

            {/* Station Label */}
            <span className="text-[11px] font-black my-1.5 whitespace-nowrap truncate w-full text-center tracking-tight">
              {st.shortName}
            </span>

            {/* Bottom Progress Line */}
            <div className="w-full h-1.5 bg-black/15 dark:bg-white/15 rounded-full overflow-hidden mt-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  st.isDone 
                    ? 'bg-white' 
                    : st.isPartial 
                    ? 'bg-white/90' 
                    : st.isCurrentTimeStation 
                    ? 'bg-indigo-500 dark:bg-indigo-400' 
                    : 'bg-emerald-500 dark:bg-emerald-400'
                }`}
                style={{ width: `${st.percent}%` }}
              />
            </div>
          </motion.button>
        ))}
      </div>

      {/* Segment Legend Notes */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs" />
            <span>مكتملة بالكامل</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-xs" />
            <span>قيد القراءة</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-xs" />
            <span>المحطة الحالية</span>
          </span>
        </div>
        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
          <span>اضغط على أي محطة للانتقال المباشر إليها</span>
          <span>⚡</span>
        </span>
      </div>
    </div>
  );
};

export default SevenSegmentProgressBar;
