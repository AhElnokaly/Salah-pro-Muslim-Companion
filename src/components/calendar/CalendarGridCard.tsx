/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { AppSettings } from '../../types';
import { toArabicNumbers, getHijriDate, getArabicMonthNameGregorian } from '../../utils/hijri';
import { CalendarGridCell, getIslamicOccasion, isForbiddenFastDay } from './calendarHelpers';

interface CalendarGridCardProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  viewDate: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onGoToToday: () => void;
  gridCells: CalendarGridCell[];
  hijriMonthHeader: string;
  gregorianMonthName: string;
  year: number;
}

export default function CalendarGridCard({
  settings,
  setSettings,
  selectedDate,
  setSelectedDate,
  onPrevMonth,
  onNextMonth,
  onGoToToday,
  gridCells,
  hijriMonthHeader,
  gregorianMonthName,
  year
}: CalendarGridCardProps) {
  const isPrimaryHijri = (settings.primaryCalendar || 'hijri') === 'hijri';
  const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  };

  const isSelected = (d: Date) => {
    return d.getDate() === selectedDate.getDate() && 
           d.getMonth() === selectedDate.getMonth() && 
           d.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 shadow-xs text-slate-800 dark:text-slate-100 transition-all duration-300">
      
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <div className="text-end">
            <h3 className="text-sm font-black leading-none">التقويم الهجري والميلادي</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold mt-1">تنسيق متبادل للمناسبات والأيام البيض</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-100 dark:border-slate-850">
          <button
            type="button"
            onClick={onPrevMonth}
            aria-label="الشهر السابق"
            className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="الشهر السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onGoToToday}
            className="text-[9px] font-black px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-lg transition-all cursor-pointer"
            title="العودة لليوم"
          >
            اليوم
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            aria-label="الشهر التالي"
            className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            title="الشهر التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Primary Calendar Switcher */}
      <div className="grid grid-cols-2 gap-1 mb-4 p-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
        <button
          type="button"
          onClick={() => setSettings(prev => ({ ...prev, primaryCalendar: 'hijri' }))}
          className={`py-1.5 px-3 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            isPrimaryHijri
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <span>🌙</span>
          <span>التقويم الهجري كأولوية</span>
        </button>
        <button
          type="button"
          onClick={() => setSettings(prev => ({ ...prev, primaryCalendar: 'gregorian' }))}
          className={`py-1.5 px-3 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            !isPrimaryHijri
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <span>📅</span>
          <span>التقويم الميلادي كأولوية</span>
        </button>
      </div>

      {/* Calendar Navigation Display */}
      <div className="flex flex-col items-center justify-center text-center mb-4 bg-indigo-50/20 dark:bg-indigo-950/10 p-3 rounded-2xl border border-indigo-100/10 dark:border-indigo-900/10">
        {isPrimaryHijri ? (
          <>
            <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 block tracking-widest mb-0.5">الشهر الهجري الحالي</span>
            <span className="text-base font-black text-slate-800 dark:text-white block">{hijriMonthHeader}</span>
            <div className="h-px w-8 bg-indigo-500/10 dark:bg-indigo-400/10 my-1.5" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">الموافق تقريباً: {gregorianMonthName} {toArabicNumbers(year)} م</span>
          </>
        ) : (
          <>
            <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 block tracking-widest mb-0.5">الشهر الميلادي الحالي</span>
            <span className="text-base font-black text-slate-800 dark:text-white block">{gregorianMonthName} {toArabicNumbers(year)} م</span>
            <div className="h-px w-8 bg-indigo-500/10 dark:bg-indigo-400/10 my-1.5" />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">الموافق تقريباً: {hijriMonthHeader}</span>
          </>
        )}
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1">
        {dayNames.map((dName, idx) => (
          <span 
            key={idx} 
            className={`text-[9px] font-black py-1 ${
              idx === 5 
                ? 'text-emerald-500' 
                : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {dName}
          </span>
        ))}
      </div>

      {/* Calendar Grid cells */}
      <div className="grid grid-cols-7 gap-1">
        {gridCells.map((cell, idx) => {
          const hDate = getHijriDate(cell.date, settings.hijriOffset);
          const isTodayDay = isToday(cell.date);
          const isSelectedDay = isSelected(cell.date);
          const occasion = getIslamicOccasion(hDate.day, hDate.month);
          
          const isWhiteDay = hDate.day === 13 || hDate.day === 14 || hDate.day === 15;
          const isMonOrThu = cell.date.getDay() === 1 || cell.date.getDay() === 4;
          const isForbidden = isForbiddenFastDay(hDate.day, hDate.month);

          let cellBg = 'bg-transparent';
          let borderStyle = 'border-transparent';
          
          let primaryTextClass = cell.isCurrentMonth ? 'text-slate-800 dark:text-slate-200' : 'text-slate-300 dark:text-slate-700';
          let secondaryTextClass = cell.isCurrentMonth ? 'text-slate-400 dark:text-slate-500' : 'text-slate-300/80 dark:text-slate-700/80';

          if (isSelectedDay) {
            cellBg = 'bg-indigo-600 text-white dark:bg-indigo-500';
            primaryTextClass = 'text-white font-black';
            secondaryTextClass = 'text-indigo-100 font-bold';
            borderStyle = 'border-indigo-600 dark:border-indigo-500 scale-105 shadow-sm';
          } else if (isTodayDay) {
            cellBg = 'bg-indigo-50/60 dark:bg-indigo-950/30';
            borderStyle = 'border-indigo-400 dark:border-indigo-600';
            primaryTextClass = 'text-indigo-600 dark:text-indigo-400 font-black';
            secondaryTextClass = 'text-indigo-500/70 dark:text-indigo-400/60 font-medium';
          } else if (cell.isCurrentMonth) {
            if (occasion) {
              cellBg = 'bg-emerald-500/5 hover:bg-emerald-500/10';
              borderStyle = 'border-emerald-500/20 dark:border-emerald-500/10';
              if (isPrimaryHijri) {
                primaryTextClass = 'text-emerald-600 dark:text-emerald-400 font-black';
              } else {
                secondaryTextClass = 'text-emerald-600 dark:text-emerald-400 font-bold';
              }
            } else if (isWhiteDay && !isForbidden) {
              cellBg = 'bg-amber-500/5 hover:bg-amber-500/10';
              borderStyle = 'border-amber-500/20 dark:border-amber-500/10';
              if (isPrimaryHijri) {
                primaryTextClass = 'text-amber-600 dark:text-amber-400 font-black';
              } else {
                secondaryTextClass = 'text-amber-600 dark:text-amber-400 font-bold';
              }
            } else if (isMonOrThu && !isForbidden) {
              cellBg = 'bg-purple-500/5 hover:bg-purple-500/10';
              borderStyle = 'border-purple-500/20 dark:border-purple-500/10';
              if (isPrimaryHijri) {
                primaryTextClass = 'text-purple-600 dark:text-purple-400 font-black';
              } else {
                secondaryTextClass = 'text-purple-600 dark:text-purple-400 font-bold';
              }
            } else {
              cellBg = 'hover:bg-slate-50 dark:hover:bg-slate-900/30';
            }
          }

          const gDay = cell.date.getDate();
          const gMonth = getArabicMonthNameGregorian(cell.date);
          const hMonthName = hDate.monthName;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDate(cell.date)}
              aria-label={`${isPrimaryHijri ? `يوم ${toArabicNumbers(hDate.day)} ${hMonthName} هجري الموافق ${toArabicNumbers(gDay)} ${gMonth}` : `يوم ${toArabicNumbers(gDay)} ${gMonth} ميلادي الموافق ${toArabicNumbers(hDate.day)} ${hMonthName}`}${occasion ? ` (${occasion})` : ''}${isWhiteDay ? ' (من الأيام البيض)' : ''}`}
              className={`aspect-square p-1 rounded-2xl flex flex-col justify-between items-center border transition-all duration-150 cursor-pointer text-center relative ${cellBg} ${borderStyle} hover:scale-[1.03] active:scale-[0.98]`}
            >
              {/* Visual Indicators for Occasions, White Days, or Mon/Thu Fasting */}
              {cell.isCurrentMonth && !isSelectedDay && (
                <div className="absolute top-1 end-1 flex gap-0.5">
                  {occasion && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500" title={occasion} />
                  )}
                  {isWhiteDay && !isForbidden && (
                    <span className="w-1 h-1 rounded-full bg-amber-500" title="الأيام البيض" />
                  )}
                  {isMonOrThu && !isForbidden && (
                    <span className="w-1 h-1 rounded-full bg-purple-500" title="صيام الإثنين والخميس" />
                  )}
                </div>
              )}

              {/* Primary Day Count (Larger, Center-Top) */}
              <span className={`text-[12px] leading-none block font-extrabold mt-1.5 ${primaryTextClass}`}>
                {toArabicNumbers(isPrimaryHijri ? hDate.day : cell.date.getDate())}
              </span>

              {/* Secondary Day Count (Smaller, Bottom) */}
              <span className={`text-[8px] leading-none block font-bold mb-1 ${secondaryTextClass}`}>
                {toArabicNumbers(isPrimaryHijri ? cell.date.getDate() : hDate.day)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend panel */}
      <div className="grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-3">
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">اليوم</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">صيام الإثنين والخميس</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">الأيام البيض</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">مناسبة إسلامية</span>
        </div>
      </div>
    </div>
  );
}
