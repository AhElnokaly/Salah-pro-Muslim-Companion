/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight, ChevronLeft, Calendar } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';

export interface PrayerDayNavigationHeaderProps {
  selectedDateOffset: number;
  setSelectedDateOffset: React.Dispatch<React.SetStateAction<number>>;
  targetDate: Date;
  hijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  setLogSuccessMessage: (msg: string) => void;
}

export const PrayerDayNavigationHeader: React.FC<PrayerDayNavigationHeaderProps> = ({
  selectedDateOffset,
  setSelectedDateOffset,
  targetDate,
  hijri,
  setLogSuccessMessage,
}) => {
  return (
    <div className="bg-white dark:bg-[#161d26] p-4 rounded-3xl border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        {/* Right Button in RTL (Previous Day: moves backwards to older days) */}
        <button
          type="button"
          onClick={() => {
            if (selectedDateOffset > -90) {
              setSelectedDateOffset(prev => prev - 1);
            } else {
              setLogSuccessMessage('التسجيل الرجعي متاح لآخر 90 يوم فقط.');
            }
          }}
          disabled={selectedDateOffset <= -90}
          className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer transition-all flex items-center justify-center shrink-0"
          title="اليوم السابق"
          aria-label="الانتقال لليوم السابق"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Center Title & Date Display */}
        <div className="text-center space-y-0.5">
          <div className="flex items-center justify-center gap-1.5">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
              {targetDate.toLocaleDateString('ar-EG', { weekday: 'long' })} {hijri.fullString} ({toArabicNumbers(targetDate.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }))})
            </span>
          </div>
          {selectedDateOffset !== 0 && (
            <span className="inline-block text-[9px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              سجل سابق
            </span>
          )}
        </div>

        {/* Left Button in RTL (Next Day: moves forward towards today, capped at today) */}
        <button
          type="button"
          onClick={() => {
            if (selectedDateOffset < 0) {
              setSelectedDateOffset(prev => prev + 1);
            }
          }}
          disabled={selectedDateOffset >= 0}
          className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 cursor-pointer transition-all flex items-center justify-center shrink-0"
          title="اليوم التالي"
          aria-label="الانتقال لليوم التالي"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Past Day Banner */}
      {selectedDateOffset !== 0 && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <span>📅</span>
            <span>بتعرض يوم سابق ({toArabicNumbers(Math.abs(selectedDateOffset))} {Math.abs(selectedDateOffset) === 1 ? 'يوم مضى' : 'أيام مضت'})</span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDateOffset(0)}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all shrink-0"
          >
            ارجع للنهاردة
          </button>
        </div>
      )}
    </div>
  );
};

export default PrayerDayNavigationHeader;
