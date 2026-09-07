/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PrayerLog, VoluntaryPrayerLog, PrayerName } from '../../../types';
import { toArabicNumbers } from '../../../utils/hijri';
import { getArabicPrayerName } from '../../../utils/prayerCalc';
import { ARABIC_MONTH_NAMES } from './heatmapUtils';

export interface DayDetailsData {
  dateStr: string;
  dateObj: Date;
  dayLog: Record<string, PrayerLog>;
  dailyPrayers: PrayerName[];
  voluntaryForDay: VoluntaryPrayerLog[];
}

export interface HeatmapDayDetailsModalProps {
  selectedDayDetails: DayDetailsData | null;
  onClose: () => void;
}

export const HeatmapDayDetailsModal: React.FC<HeatmapDayDetailsModalProps> = ({
  selectedDayDetails,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {selectedDayDetails && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="تفاصيل صلوات اليوم"
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white dark:bg-[#161d26] w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto text-right"
          >
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-black text-base text-slate-800 dark:text-white">
                  تفاصيل صلوات يوم {selectedDayDetails.dateObj.toLocaleDateString('ar-EG', { weekday: 'long' })} ({toArabicNumbers(selectedDayDetails.dateObj.getDate())} {ARABIC_MONTH_NAMES[selectedDayDetails.dateObj.getMonth()]} {toArabicNumbers(selectedDayDetails.dateObj.getFullYear())})
                </h4>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق تفاصيل اليوم"
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of 5 daily prayers status */}
            <div className="space-y-2">
              <h5 className="text-xs font-black text-slate-400 dark:text-slate-500">الصلوات الخمس:</h5>
              <div className="grid grid-cols-1 gap-2">
                {selectedDayDetails.dailyPrayers.map((pName) => {
                  const st = selectedDayDetails.dayLog[pName]?.status;
                  let badge = { text: 'لم تُسجّل بعد', bg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' };
                  if (st === 'A') badge = { text: 'حاضر (في وقتها) ✓', bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' };
                  else if (st === 'B') badge = { text: 'قضاء / متأخر', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300' };
                  else if (st === 'E') badge = { text: 'عذر شرعي', bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300' };
                  else if (st === 'C' || st === 'D') badge = { text: 'فائتة ✗', bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300' };

                  return (
                    <div key={pName} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 text-xs font-bold">
                      <span className="text-slate-800 dark:text-slate-100 font-black">
                        صلاة {getArabicPrayerName(pName, selectedDayDetails.dateObj)}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${badge.bg}`}>
                        {badge.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Voluntary Prayers if any */}
            {selectedDayDetails.voluntaryForDay.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h5 className="text-xs font-black text-slate-400 dark:text-slate-500">النوافل والسنن المسجلة:</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedDayDetails.voluntaryForDay.map((v, i) => (
                    <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl text-xs font-bold">
                      {v.type === 'duha' ? 'الضحى' : v.type === 'qiyam' ? 'قيام الليل' : v.type === 'witr' ? 'الوتر' : v.type === 'taraweeh' ? 'التراويح' : 'شفع'} ({toArabicNumbers(v.rakaat || 2)} ركعات)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default HeatmapDayDetailsModal;
