/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Minus } from 'lucide-react';
import { AppSettings } from '../../types';
import { 
  toArabicNumbers, 
  getHijriDate, 
  formatGregorianFullDateArabic 
} from '../../utils/hijri';
import { getMoonPhaseInfo } from '../../utils/moonPhases';
import { getIslamicOccasion, isForbiddenFastDay, getFastingRecommendation } from './calendarHelpers';

interface SelectedDayDetailsProps {
  selectedDate: Date;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onNavigateTab?: (tab: string) => void;
}

export default function SelectedDayDetails({
  selectedDate,
  settings,
  setSettings,
  onNavigateTab
}: SelectedDayDetailsProps) {
  const selectedHijri = getHijriDate(selectedDate, settings.hijriOffset);
  const selectedOccasion = getIslamicOccasion(selectedHijri.day, selectedHijri.month);
  const isSelectedForbidden = isForbiddenFastDay(selectedHijri.day, selectedHijri.month);
  const fastingRecommendation = getFastingRecommendation(
    selectedDate,
    selectedHijri.day,
    selectedHijri.month,
    selectedHijri.monthName
  );

  const handleDecreaseOffset = () => {
    setSettings(prev => ({ ...prev, hijriOffset: Math.max(-2, prev.hijriOffset - 1) }));
  };

  const handleIncreaseOffset = () => {
    setSettings(prev => ({ ...prev, hijriOffset: Math.min(2, prev.hijriOffset + 1) }));
  };

  return (
    <div className="bg-slate-50 dark:bg-[#161d26]/40 rounded-3xl p-4 border border-[#e2e8f0]/60 dark:border-slate-800/60 text-end space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/30 pb-2">
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">تفاصيل اليوم المحدّد</span>
        <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold">
          {formatGregorianFullDateArabic(selectedDate)}
        </span>
      </div>

      <div className="space-y-3">
        {/* Hijri Date block */}
        <div className="flex items-start gap-2.5">
          <span className="text-base bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-xl block">📅</span>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">التاريخ الهجري</span>
            <span className="text-xs font-black text-slate-800 dark:text-white block">
              {toArabicNumbers(selectedHijri.day)} {selectedHijri.monthName} {toArabicNumbers(selectedHijri.year)} هـ
            </span>
          </div>
        </div>

        {/* Moon Phase Block for Selected Day */}
        {(() => {
          const moonInfo = getMoonPhaseInfo(selectedHijri.day);
          return (
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <span className="text-xl leading-none">{moonInfo.icon}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                      طور القمر: {moonInfo.name}
                    </span>
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">
                      إضاءة {toArabicNumbers(moonInfo.illumination)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    {moonInfo.desc}
                  </p>
                </div>
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('moon')}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 flex items-center gap-0.5 mt-0.5 cursor-pointer"
                >
                  <span>أطوار القمر</span>
                  <span>←</span>
                </button>
              )}
            </div>
          );
        })()}

        {/* Islamic Occasion block if exists */}
        {selectedOccasion && (
          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-start gap-2.5">
            <span className="text-base">✨</span>
            <div className="space-y-1">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 block">مناسبة مباركة</span>
              <p className="text-xs font-black text-slate-800 dark:text-white leading-relaxed">{selectedOccasion}</p>
            </div>
          </div>
        )}

        {/* Fasting recommendation block */}
        {fastingRecommendation && (
          <div className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
            isSelectedForbidden
              ? 'bg-rose-500/5 border-rose-500/10'
              : 'bg-amber-500/5 border-amber-500/10'
          }`}>
            <span className="text-base">{isSelectedForbidden ? '⚠️' : '🌟'}</span>
            <div className="space-y-1">
              <span className={`text-[10px] font-black block ${
                isSelectedForbidden ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {isSelectedForbidden ? 'ملاحظة الفقه والعبادات' : 'صيام التطوع والسنن'}
              </span>
              <p className="text-xs font-black text-slate-800 dark:text-white leading-relaxed">
                {fastingRecommendation}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Hijri Offset Quick Adjust Row */}
      <div className="border-t border-slate-200/40 dark:border-slate-800/30 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black text-slate-450 dark:text-slate-500">مزامنة التقويم الهجري:</span>
          <span className="text-[9px] text-slate-400 dark:text-slate-550 leading-relaxed">(لرؤية الهلال محلياً)</span>
        </div>

        <div className="flex items-center gap-2" dir="ltr">
          <button
            type="button"
            onClick={handleDecreaseOffset}
            disabled={settings.hijriOffset === -2}
            aria-label="تأخير التاريخ الهجري يوم واحد"
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold disabled:opacity-35 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors"
            title="تأخير يوم"
          >
            <Minus className="w-3 h-3" />
          </button>
          
          <span className={`text-[10px] font-black min-w-16 text-center ${
            settings.hijriOffset > 0 ? 'text-emerald-600 dark:text-emerald-400' : settings.hijriOffset < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
          }`}>
            {settings.hijriOffset > 0 
              ? `+${toArabicNumbers(settings.hijriOffset)} يوم` 
              : settings.hijriOffset === 0 
              ? 'مطابق للحساب' 
              : `${toArabicNumbers(settings.hijriOffset)} يوم`
            }
          </span>

          <button
            type="button"
            onClick={handleIncreaseOffset}
            disabled={settings.hijriOffset === 2}
            aria-label="تقديم التاريخ الهجري يوم واحد"
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold disabled:opacity-35 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors"
            title="تقديم يوم"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
