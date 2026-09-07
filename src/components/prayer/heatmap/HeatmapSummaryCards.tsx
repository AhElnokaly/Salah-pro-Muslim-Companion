/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CheckCircle2, 
  ChevronDown, 
  Flame, 
  Award, 
  Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toArabicNumbers } from '../../../utils/hijri';
import type { MonthPrayerStats } from './heatmapUtils';

export interface HeatmapSummaryCardsProps {
  monthStats: MonthPrayerStats;
  streaks: { current: number; best: number };
  expandedCard: 'monthly' | 'streak' | 'status' | null;
  onToggleCard: (card: 'monthly' | 'streak' | 'status') => void;
}

export const HeatmapSummaryCards: React.FC<HeatmapSummaryCardsProps> = ({
  monthStats,
  streaks,
  expandedCard,
  onToggleCard,
}) => {
  return (
    <div className="space-y-2.5 pt-2">
      {/* Card 1: Total Performed This Month */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => onToggleCard('monthly')}
          className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-black text-sm text-slate-800 dark:text-slate-100">
              صلوات مؤداة هذا الشهر: {toArabicNumbers(monthStats.totalPerformed)}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedCard === 'monthly' ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {expandedCard === 'monthly' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 border-t border-slate-200/50 dark:border-slate-800 pt-3 space-y-2 text-xs"
            >
              <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">توزيع الصلوات المؤداة هذا الشهر حسب الفريضة:</p>
              <div className="grid grid-cols-5 gap-1.5 text-center">
                {[
                  { key: 'Fajr', label: 'الفجر', count: monthStats.prayerBreakdown.Fajr },
                  { key: 'Dhuhr', label: 'الظهر', count: monthStats.prayerBreakdown.Dhuhr },
                  { key: 'Asr', label: 'العصر', count: monthStats.prayerBreakdown.Asr },
                  { key: 'Maghrib', label: 'المغرب', count: monthStats.prayerBreakdown.Maghrib },
                  { key: 'Isha', label: 'العشاء', count: monthStats.prayerBreakdown.Isha }
                ].map(item => (
                  <div key={item.key} className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200/50 dark:border-slate-700/60 space-y-1">
                    <span className="block text-[10px] text-slate-400 font-bold">{item.label}</span>
                    <span className="block text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                      {toArabicNumbers(item.count)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card 2: Streak Stats */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => onToggleCard('streak')}
          className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-amber-500 shrink-0" />
            <span className="font-black text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>🔥 السلسلة الحالية: {toArabicNumbers(streaks.current)} يوم</span>
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedCard === 'streak' ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {expandedCard === 'streak' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 border-t border-slate-200/50 dark:border-slate-800 pt-3 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 font-bold">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>أفضل سلسلة محققة تاريخياً:</span>
                </div>
                <span className="font-black text-base text-amber-600 dark:text-amber-400 font-mono">
                  {toArabicNumbers(streaks.best)} يوم متواصل
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                تزداد السلسلة بانتظام عند أداء كافة الصلوات الخمس يومياً بدون انقطاع.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card 3: Breakdown By Status */}
      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => onToggleCard('status')}
          className="w-full p-3.5 flex items-center justify-between text-right cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
            <span className="font-black text-sm text-slate-800 dark:text-slate-100">
              حسب حالة الصلاة هذا الشهر
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedCard === 'status' ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {expandedCard === 'status' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-4 border-t border-slate-200/50 dark:border-slate-800 pt-3 space-y-2 text-xs"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 flex justify-between items-center">
                  <span className="text-emerald-800 dark:text-emerald-300 font-bold">في وقتها (حاضر):</span>
                  <span className="font-black text-emerald-700 dark:text-emerald-400 font-mono text-sm">{toArabicNumbers(monthStats.inTimeCount)}</span>
                </div>
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200/60 dark:border-amber-900/40 flex justify-between items-center">
                  <span className="text-amber-800 dark:text-amber-300 font-bold">قضاء / متأخر:</span>
                  <span className="font-black text-amber-700 dark:text-amber-400 font-mono text-sm">{toArabicNumbers(monthStats.qadaCount)}</span>
                </div>
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200/60 dark:border-purple-900/40 flex justify-between items-center">
                  <span className="text-purple-800 dark:text-purple-300 font-bold">عذر شرعي:</span>
                  <span className="font-black text-purple-700 dark:text-purple-400 font-mono text-sm">{toArabicNumbers(monthStats.excusedCount)}</span>
                </div>
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200/60 dark:border-rose-900/40 flex justify-between items-center">
                  <span className="text-rose-800 dark:text-rose-300 font-bold">فائتة:</span>
                  <span className="font-black text-rose-700 dark:text-rose-400 font-mono text-sm">{toArabicNumbers(monthStats.missedCount)}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HeatmapSummaryCards;
