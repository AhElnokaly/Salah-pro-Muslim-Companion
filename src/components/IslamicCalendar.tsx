/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Minus, 
  Info, 
  Sparkles,
  RefreshCw,
  BarChart2,
  TrendingUp,
  Trophy,
  BookOpen,
  Heart,
  Moon
} from 'lucide-react';
import { AppSettings, PrayerLog } from '../types';
import { 
  getHijriDate, 
  toArabicNumbers, 
  getArabicDayOfWeek,
  getArabicMonthNameGregorian,
  formatGregorianFullDateArabic
} from '../utils/hijri';

interface IslamicCalendarProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  prayerLogs?: Record<string, Record<string, PrayerLog>>;
  fastingLogs?: Record<string, { date: string; fasted: boolean; fastType: string }>;
  dhikrLogs?: Record<string, Record<string, number>>;
  quranSessions?: any[];
  khatmat?: any[];
}

export default function IslamicCalendar({ 
  settings, 
  setSettings,
  prayerLogs = {},
  fastingLogs = {},
  dhikrLogs = {},
  quranSessions = [],
  khatmat = []
}: IslamicCalendarProps) {
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statsPeriod, setStatsPeriod] = useState<'weekly' | 'monthly'>('weekly');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Months labels
  const gregorianMonthName = getArabicMonthNameGregorian(viewDate);
  const currentHijriForFirst = getHijriDate(new Date(year, month, 1), settings.hijriOffset);
  const currentHijriForLast = getHijriDate(new Date(year, month + 1, 0), settings.hijriOffset);

  const isPrimaryHijri = (settings.primaryCalendar || 'hijri') === 'hijri';

  const viewedHijri = getHijriDate(viewDate, settings.hijriOffset);
  const targetHijriMonth = viewedHijri.month;
  const targetHijriYear = viewedHijri.year;

  // Determine Hijri header string (e.g. "محرم - صفر ١٤٤٨ هـ")
  let hijriMonthHeader = '';
  if (isPrimaryHijri) {
    hijriMonthHeader = `${viewedHijri.monthName} ${toArabicNumbers(targetHijriYear)} هـ`;
  } else {
    if (currentHijriForFirst.monthName === currentHijriForLast.monthName) {
      hijriMonthHeader = `${currentHijriForFirst.monthName} ${toArabicNumbers(currentHijriForFirst.year)} هـ`;
    } else {
      hijriMonthHeader = `${currentHijriForFirst.monthName} / ${currentHijriForLast.monthName} ${toArabicNumbers(currentHijriForFirst.year)} هـ`;
    }
  }

  // Days in month calculation
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Occasions list helper
  const getIslamicOccasion = (hDay: number, hMonth: number): string | null => {
    if (hMonth === 1 && hDay === 1) return 'بداية السنة الهجرية الجديدة 🎉';
    if (hMonth === 1 && hDay === 9) return 'يوم تاسوعاء 🌟';
    if (hMonth === 1 && hDay === 10) return 'يوم عاشوراء (كفارة سنة ماضية) ✨';
    if (hMonth === 3 && hDay === 12) return 'المولد النبوي الشريف 🌸';
    if (hMonth === 7 && hDay === 27) return 'ذكرى الإسراء والمعراج 🕋';
    if (hMonth === 8 && hDay === 15) return 'ليلة النصف من شعبان 🌙';
    if (hMonth === 9 && hDay === 1) return 'أول أيام شهر رمضان المبارك 🌙';
    if (hMonth === 9 && hDay >= 21 && hDay % 2 !== 0) return 'ليالي العشر الأواخر (تحرّوا ليلة القدر) ✨';
    if (hMonth === 10 && hDay === 1) return 'أول أيام عيد الفطر المبارك 🎈';
    if (hMonth === 12 && hDay === 9) return 'يوم عرفة (يكفر سنتين) 🙌';
    if (hMonth === 12 && hDay === 10) return 'أول أيام عيد الأضحى المبارك 🐑';
    if (hMonth === 12 && (hDay === 11 || hDay === 12 || hDay === 13)) return 'أيام التشريق المباركة ✨';
    return null;
  };

  // Forbidden fast days helper
  const isForbiddenFastDay = (hDay: number, hMonth: number): boolean => {
    // Eid al-Fitr (1 Shawwal)
    if (hMonth === 10 && hDay === 1) return true;
    // Eid al-Adha (10 Dhu al-Hijjah) & Tashreeq days (11, 12, 13 Dhu al-Hijjah)
    if (hMonth === 12 && (hDay === 10 || hDay === 11 || hDay === 12 || hDay === 13)) return true;
    return false;
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    if (isPrimaryHijri) {
      const prevDate = new Date(viewDate.getTime());
      prevDate.setDate(prevDate.getDate() - 30);
      setViewDate(prevDate);
    } else {
      setViewDate(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = () => {
    if (isPrimaryHijri) {
      const nextDate = new Date(viewDate.getTime());
      nextDate.setDate(nextDate.getDate() + 30);
      setViewDate(nextDate);
    } else {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
  };

  // Offset update handlers
  const handleDecreaseOffset = () => {
    setSettings(prev => ({ ...prev, hijriOffset: Math.max(-2, prev.hijriOffset - 1) }));
  };

  const handleIncreaseOffset = () => {
    setSettings(prev => ({ ...prev, hijriOffset: Math.min(2, prev.hijriOffset + 1) }));
  };

  // Generate calendar grid array
  let gridCells: { dayNum: number; date: Date; isCurrentMonth: boolean }[] = [];

  if (isPrimaryHijri) {
    // Find the 1st of this Hijri Month by walking backward
    let firstOfHijriGregorian = new Date(viewDate.getTime());
    for (let i = 0; i < 35; i++) {
      const prevDate = new Date(firstOfHijriGregorian.getTime());
      prevDate.setDate(prevDate.getDate() - 1);
      const prevHijri = getHijriDate(prevDate, settings.hijriOffset);
      if (prevHijri.month !== targetHijriMonth || prevHijri.year !== targetHijriYear) {
        break;
      }
      firstOfHijriGregorian = prevDate;
    }

    const firstHijriDayIndex = firstOfHijriGregorian.getDay(); // 0 (Sun) to 6 (Sat)

    // Current Hijri Month Days
    const currentHijriDays: { dayNum: number; date: Date; isCurrentMonth: boolean }[] = [];
    let dIter = new Date(firstOfHijriGregorian.getTime());
    for (let i = 0; i < 35; i++) {
      const h = getHijriDate(dIter, settings.hijriOffset);
      if (h.month !== targetHijriMonth || h.year !== targetHijriYear) {
        break;
      }
      currentHijriDays.push({
        dayNum: h.day,
        date: new Date(dIter.getTime()),
        isCurrentMonth: true
      });
      dIter.setDate(dIter.getDate() + 1);
    }

    // Previous Hijri Month Padding Days
    const prevHijriDays: { dayNum: number; date: Date; isCurrentMonth: boolean }[] = [];
    let prevIter = new Date(firstOfHijriGregorian.getTime());
    prevIter.setDate(prevIter.getDate() - 1);
    for (let i = 0; i < firstHijriDayIndex; i++) {
      const h = getHijriDate(prevIter, settings.hijriOffset);
      prevHijriDays.unshift({
        dayNum: h.day,
        date: new Date(prevIter.getTime()),
        isCurrentMonth: false
      });
      prevIter.setDate(prevIter.getDate() - 1);
    }

    // Next Hijri Month Padding Days
    const nextHijriDays: { dayNum: number; date: Date; isCurrentMonth: boolean }[] = [];
    const remainingCells = 42 - (prevHijriDays.length + currentHijriDays.length);
    let nextIter = new Date(dIter.getTime());
    for (let i = 0; i < remainingCells; i++) {
      const h = getHijriDate(nextIter, settings.hijriOffset);
      nextHijriDays.push({
        dayNum: h.day,
        date: new Date(nextIter.getTime()),
        isCurrentMonth: false
      });
      nextIter.setDate(nextIter.getDate() + 1);
    }

    gridCells = [...prevHijriDays, ...currentHijriDays, ...nextHijriDays];
  } else {
    // Gregorian Mode
    // Previous month padding
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const dateObj = new Date(year, month - 1, d);
      gridCells.push({
        dayNum: d,
        date: dateObj,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      gridCells.push({
        dayNum: d,
        date: dateObj,
        isCurrentMonth: true
      });
    }

    // Next month padding to fill grid
    const remainingCells = 42 - gridCells.length; // 6 rows * 7 days
    for (let d = 1; d <= remainingCells; d++) {
      const dateObj = new Date(year, month + 1, d);
      gridCells.push({
        dayNum: d,
        date: dateObj,
        isCurrentMonth: false
      });
    }
  }

  // Analyze selected date
  const selectedHijri = getHijriDate(selectedDate, settings.hijriOffset);
  const selectedOccasion = getIslamicOccasion(selectedHijri.day, selectedHijri.month);
  
  // Selected day fasting recommendation
  const isSelectedMondayOrThursday = selectedDate.getDay() === 1 || selectedDate.getDay() === 4;
  const isSelectedWhiteDay = selectedHijri.day === 13 || selectedHijri.day === 14 || selectedHijri.day === 15;
  const isSelectedForbidden = isForbiddenFastDay(selectedHijri.day, selectedHijri.month);
  
  let fastingRecommendation = '';
  if (!isSelectedForbidden) {
    if (selectedHijri.month === 9) {
      fastingRecommendation = 'فرض عين (صيام شهر رمضان المبارك)';
    } else if (selectedHijri.month === 12 && selectedHijri.day === 9) {
      fastingRecommendation = 'صيام يوم عرفة (سنة مؤكدة تكفّر سنة ماضية وقادمة)';
    } else if (selectedHijri.month === 1 && selectedHijri.day === 10) {
      fastingRecommendation = 'صيام يوم عاشوراء (سنة مؤكدة تكفّر سنة ماضية)';
    } else if (selectedHijri.month === 1 && selectedHijri.day === 9) {
      fastingRecommendation = 'صيام يوم تاسوعاء (مخالفة لليهود مع صيام عاشوراء)';
    } else if (isSelectedWhiteDay) {
      fastingRecommendation = `صيام الأيام البيض لشهر ${selectedHijri.monthName} (سنة مؤكدة)`;
    } else if (isSelectedMondayOrThursday) {
      const dayName = selectedDate.getDay() === 1 ? 'الإثنين' : 'الخميس';
      fastingRecommendation = `صيام يوم ${dayName} (سنة نبوية، تُرفع فيه الأعمال)`;
    }
  } else {
    fastingRecommendation = 'يحرم الصيام في هذا اليوم المبارك (أيام العيد والتشريق)';
  }

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

  const dayNames = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

  return (
    <div className="space-y-4" id="islamic-calendar-widget">
      {/* Calendar Card Wrapper */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 shadow-xs text-slate-800 dark:text-slate-100 transition-all duration-300">
        
        {/* Calendar Header with Navigation */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <div className="text-right">
              <h3 className="text-sm font-black leading-none">التقويم الهجري والميلادي</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold mt-1">تنسيق متبادل للمناسبات والأيام البيض</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/40 p-1 rounded-xl border border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="الشهر السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleGoToToday}
              className="text-[9px] font-black px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 rounded-lg transition-all cursor-pointer"
              title="العودة لليوم"
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="الشهر التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Primary Calendar Switcher (Pill-style Segmented Selector) */}
        <div className="grid grid-cols-2 gap-1 mb-4 p-0.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, primaryCalendar: 'hijri' }))}
            className={`py-1.5 px-3 rounded-lg text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              (settings.primaryCalendar || 'hijri') === 'hijri'
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
              settings.primaryCalendar === 'gregorian'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <span>📅</span>
            <span>التقويم الميلادي كأولوية</span>
          </button>
        </div>

        {/* Calendar Navigation Display (Refined visually and based on primary settings) */}
        <div className="flex flex-col items-center justify-center text-center mb-4 bg-indigo-50/20 dark:bg-indigo-950/10 p-3 rounded-2xl border border-indigo-100/10 dark:border-indigo-900/10">
          {(settings.primaryCalendar || 'hijri') === 'hijri' ? (
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
                  ? 'text-emerald-500' // Friday highlight
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
            const isPrimaryHijri = (settings.primaryCalendar || 'hijri') === 'hijri';

            // Highlighting colors based on conditions
            let cellBg = 'bg-transparent';
            let borderStyle = 'border-transparent';
            
            // Base text classes
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

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(cell.date)}
                className={`aspect-square p-1 rounded-2xl flex flex-col justify-between items-center border transition-all duration-150 cursor-pointer text-center relative ${cellBg} ${borderStyle} hover:scale-[1.03] active:scale-[0.98]`}
              >
                {/* Visual Indicators for Occasions, White Days, or Mon/Thu Fasting */}
                {cell.isCurrentMonth && !isSelectedDay && (
                  <div className="absolute top-1 right-1 flex gap-0.5">
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
                  {toArabicNumbers(isPrimaryHijri ? hDate.day : cell.dayNum)}
                </span>

                {/* Secondary Day Count (Smaller, Bottom) */}
                <span className={`text-[8px] leading-none block font-bold mb-1 ${secondaryTextClass}`}>
                  {toArabicNumbers(isPrimaryHijri ? cell.dayNum : hDate.day)}
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

      {/* Selected Day details card */}
      <div className="bg-slate-50 dark:bg-[#161d26]/40 rounded-3xl p-4 border border-[#e2e8f0]/60 dark:border-slate-800/60 text-right space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-200/40 dark:border-slate-800/30 pb-2">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">تفاصيل اليوم المحدّد</span>
          <span className="text-[9px] font-mono bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded-md font-bold">
            {formatGregorianFullDateArabic(selectedDate)}
          </span>
        </div>

        <div className="space-y-3">
          {/* Hijri Date block */}
          <div className="flex items-start gap-2.5">
            <span className="text-base bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 p-1.5 rounded-xl block">🌙</span>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block">التاريخ الهجري</span>
              <span className="text-xs font-black text-slate-800 dark:text-white block">
                {toArabicNumbers(selectedHijri.day)} {selectedHijri.monthName} {toArabicNumbers(selectedHijri.year)} هـ
              </span>
            </div>
          </div>

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
              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold disabled:opacity-35 cursor-pointer text-slate-700 dark:text-slate-300 transition-colors"
              title="تقديم يوم"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Worship Progress Hub */}
      {(() => {
        const periodDays = statsPeriod === 'weekly' ? 7 : 30;
        const now = new Date();
        now.setHours(0,0,0,0);
        
        // Generate dates in the range
        const dates: string[] = [];
        for (let i = 0; i < periodDays; i++) {
          const d = new Date();
          d.setDate(now.getDate() - i);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          dates.push(`${yyyy}-${mm}-${dd}`);
        }

        // 1. Prayer stats
        const totalPrayersPossible = periodDays * 5;
        let prayersDone = 0;
        dates.forEach(dateStr => {
          const dayLog = prayerLogs[dateStr] || {};
          const prayers: ('Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha')[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
          prayers.forEach(p => {
            const log = dayLog[p];
            if (log && (log.status === 'A' || log.status === 'B')) {
              prayersDone++;
            }
          });
        });
        const prayerPercent = totalPrayersPossible > 0 ? Math.round((prayersDone / totalPrayersPossible) * 100) : 0;

        // 2. Quran pages read
        let quranPages = 0;
        const startDate = new Date();
        startDate.setDate(now.getDate() - periodDays);
        quranSessions.forEach(session => {
          const sessionDate = new Date(session.date);
          if (sessionDate >= startDate) {
            if (session.unitType === 'pages') {
              quranPages += session.unitValue || 0;
            } else if (session.unitType === 'juz') {
              quranPages += (session.unitValue || 0) * 20;
            } else if (session.unitType === 'surah') {
              quranPages += 5;
            }
          }
        });

        // 3. Dhikr counts
        let totalDhikr = 0;
        dates.forEach(dateStr => {
          const dayLog = dhikrLogs[dateStr] || {};
          Object.values(dayLog).forEach(count => {
            totalDhikr += count;
          });
        });

        // 4. Fasting days
        let fastingDays = 0;
        dates.forEach(dateStr => {
          const dayLog = fastingLogs[dateStr];
          if (dayLog && dayLog.fasted) {
            fastingDays++;
          }
        });

        const hasNoActivity = prayersDone === 0 && quranPages === 0 && totalDhikr === 0 && fastingDays === 0;

        return (
          <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-5 transition-colors duration-300 shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📈</span>
                <div className="text-right">
                  <h3 className="text-sm font-black text-slate-800 dark:text-white leading-none">مؤشر التقدم والعبادات</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1">حصاد طاعاتك ودرجة التزامك بالأوراد</p>
                </div>
              </div>

              {/* Segmented Period Switcher */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-0.5 rounded-xl flex">
                <button
                  onClick={() => setStatsPeriod('weekly')}
                  className={`py-1 px-3 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    statsPeriod === 'weekly'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  أسبوعي
                </button>
                <button
                  onClick={() => setStatsPeriod('monthly')}
                  className={`py-1 px-3 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                    statsPeriod === 'monthly'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  شهري
                </button>
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Prayers */}
              <div className="p-3 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 dark:border-emerald-900/20 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400">الصلوات المفروضة</span>
                  <span className="text-sm">🕌</span>
                </div>
                <div>
                  <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
                    {toArabicNumbers(prayersDone)} / {toArabicNumbers(totalPrayersPossible)}
                  </div>
                  <div className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 mt-1">
                    معدل الالتزام: {toArabicNumbers(prayerPercent)}%
                  </div>
                </div>
              </div>

              {/* Quran */}
              <div className="p-3 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/10 dark:border-amber-900/20 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-amber-700 dark:text-amber-400">قراءة القرآن الكريم</span>
                  <span className="text-sm">📖</span>
                </div>
                <div>
                  <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
                    {toArabicNumbers(quranPages)} <span className="text-xs font-bold font-sans">صفحة</span>
                  </div>
                  <div className="text-[9px] font-bold text-amber-600 dark:text-amber-500 mt-1">
                    خلال آخر {statsPeriod === 'weekly' ? '٧ أيام' : '٣٠ يوماً'}
                  </div>
                </div>
              </div>

              {/* Adhkar */}
              <div className="p-3 bg-purple-500/5 dark:bg-purple-950/10 border border-purple-500/10 dark:border-purple-900/20 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-purple-700 dark:text-purple-400">الأذكار والتسابيح</span>
                  <span className="text-sm">📿</span>
                </div>
                <div>
                  <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
                    {toArabicNumbers(totalDhikr)} <span className="text-xs font-bold font-sans">ذكر</span>
                  </div>
                  <div className="text-[9px] font-bold text-purple-600 dark:text-purple-500 mt-1">
                    إجمالي تكرارات الذكر
                  </div>
                </div>
              </div>

              {/* Fasting */}
              <div className="p-3 bg-sky-500/5 dark:bg-sky-950/10 border border-sky-500/10 dark:border-sky-900/20 rounded-2xl flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-sky-700 dark:text-sky-400">صيام التطوع والفرض</span>
                  <span className="text-sm">🌙</span>
                </div>
                <div>
                  <div className="text-lg font-black text-slate-800 dark:text-white font-mono">
                    {toArabicNumbers(fastingDays)} <span className="text-xs font-bold font-sans">{fastingDays === 1 ? 'يوم' : fastingDays === 2 ? 'يومان' : 'أيام'}</span>
                  </div>
                  <div className="text-[9px] font-bold text-sky-600 dark:text-sky-500 mt-1">
                    تقبل الله طاعاتكم
                  </div>
                </div>
              </div>
            </div>

            {/* Encouraging non-judgmental prompt */}
            <div className="p-3 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 text-[10px] leading-relaxed font-semibold text-indigo-900 dark:text-indigo-200">
              {hasNoActivity ? (
                <span>
                  💡 <b>بداية جديدة مباركة!</b> ابدأ بتسجيل صلواتك وقراءتك للقرآن اليوم لتشاهد حصاد التزامك ينمو هنا يوماً بعد يوم بهدوء وتوفيق 🤍
                </span>
              ) : (
                <span>
                  🌟 <b>ما شاء الله!</b> طاعات مستمرة مباركة. الاستمرار على العمل وإن قلّ هو أحب الأعمال إلى الله، وخطواتك المتزنة تصنع فارقاً عظيماً في قلبك ويومك 🤲
                </span>
              )}
            </div>
          </div>
        );
      })()}

    </div>
  );
}
