/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Flame, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar as CalendarIcon,
  BarChart3,
  ChevronDown,
  Award,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { PrayerLog, VoluntaryPrayerLog, PrayerName } from '../types';
import { toArabicNumbers } from '../utils/hijri';
import { getArabicPrayerName } from '../utils/prayerCalc';

interface PrayerHeatmapStatsProps {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
  onClose?: () => void;
}

const DAYS_RTL_LABELS = ['ج', 'خ', 'ر', 'ث', 'ن', 'ح', 'س']; // Friday to Saturday RTL
const DAY_INDEX_MAP: Record<number, number> = {
  5: 0, // Friday
  4: 1, // Thursday
  3: 2, // Wednesday
  2: 3, // Tuesday
  1: 4, // Monday
  0: 5, // Sunday
  6: 6  // Saturday
};

const ARABIC_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function computeIntensity(ratio: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (ratio <= 0) return 0;
  if (ratio <= 0.2) return 1; // 1 prayer
  if (ratio <= 0.4) return 2; // 2 prayers
  if (ratio <= 0.6) return 3; // 3 prayers
  if (ratio <= 0.8) return 4; // 4 prayers
  return 5;                    // All 5 prayers
}

export function calculateStreaks(prayerLogs: Record<string, Record<string, PrayerLog>>) {
  const dailyPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get all dates present in logs or generated chronologically
  const dates = Object.keys(prayerLogs).sort();
  if (dates.length === 0) {
    return { current: 0, best: 0 };
  }

  let currentStreak = 0;
  let bestStreak = 0;
  let runningStreak = 0;

  // Find start date from earliest log or 30 days ago
  const startDate = new Date(dates[0]);
  const endDate = new Date(today);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLog = prayerLogs[dStr] || {};

    let performedCount = 0;
    for (const p of dailyPrayers) {
      const status = dayLog[p]?.status;
      if (status === 'A' || status === 'B' || status === 'E') {
        performedCount++;
      }
    }

    if (performedCount === 5) {
      runningStreak++;
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak;
      }
    } else {
      // Streak breaks
      runningStreak = 0;
    }

    if (dStr === todayStr) {
      currentStreak = runningStreak;
    }
  }

  return { current: currentStreak, best: bestStreak };
}

export const PrayerHeatmapStats: React.FC<PrayerHeatmapStatsProps> = ({
  prayerLogs,
  voluntaryPrayerLogs = [],
  onClose
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<'monthly' | 'streak' | 'status' | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

  // Month navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate grid for current month
  const { cells, monthStats } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const startDayOfWeek = firstDay.getDay(); // 0..6
    const offsetCols = DAY_INDEX_MAP[startDayOfWeek] || 0;

    const dailyPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    let performedMonthTotal = 0;
    const prayerBreakdown: Record<Exclude<PrayerName, 'Sunrise'>, number> = {
      Fajr: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0
    };
    let inTimeCount = 0;
    let qadaCount = 0;
    let excusedCount = 0;
    let missedCount = 0;

    const cellList: Array<{
      dayNumber: number;
      dateStr: string;
      completionRatio: number;
      intensity: 0 | 1 | 2 | 3 | 4 | 5;
      isToday: boolean;
      dateObj: Date;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dObj = new Date(year, month, day);
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayLog = prayerLogs[dStr] || {};

      let count = 0;
      for (const p of dailyPrayers) {
        const st = dayLog[p]?.status;
        if (st === 'A') {
          count++;
          inTimeCount++;
          prayerBreakdown[p]++;
        } else if (st === 'B') {
          count++;
          qadaCount++;
          prayerBreakdown[p]++;
        } else if (st === 'E') {
          count++;
          excusedCount++;
          prayerBreakdown[p]++;
        } else if (st === 'C' || st === 'D') {
          missedCount++;
        }
      }

      performedMonthTotal += count;
      const ratio = count / 5;
      const intensity = computeIntensity(ratio);

      cellList.push({
        dayNumber: day,
        dateStr: dStr,
        completionRatio: ratio,
        intensity,
        isToday: dStr === todayStr,
        dateObj: dObj
      });
    }

    return {
      cells: cellList,
      paddingCols: offsetCols,
      monthStats: {
        totalPerformed: performedMonthTotal,
        prayerBreakdown,
        inTimeCount,
        qadaCount,
        excusedCount,
        missedCount,
        daysCount: daysInMonth
      }
    };
  }, [year, month, prayerLogs, todayStr]);

  // Streak calculations
  const streaks = useMemo(() => calculateStreaks(prayerLogs), [prayerLogs]);

  // Selected Day log details
  const selectedDayDetails = useMemo(() => {
    if (!selectedDayStr) return null;
    const dayLog = prayerLogs[selectedDayStr] || {};
    const dailyPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const parts = selectedDayStr.split('-').map(Number);
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);

    const voluntaryForDay = voluntaryPrayerLogs.filter(v => v.appPrayerDay === selectedDayStr);

    return {
      dateStr: selectedDayStr,
      dateObj,
      dayLog,
      dailyPrayers,
      voluntaryForDay
    };
  }, [selectedDayStr, prayerLogs, voluntaryPrayerLogs]);

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-md space-y-5 text-right font-sans transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shadow-2xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>تقويم إحصائيات الصلاة (Heatmap)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              تابع التزامك اليومي بالصلوات الخمس ونسب الإنجاز الشهرية
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Month Navigation Control */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700 flex items-center gap-1 text-xs font-bold"
        >
          <ChevronRight className="w-4 h-4" />
          <span>الشهر السابق</span>
        </button>

        <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-slate-100">
          <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{ARABIC_MONTH_NAMES[month]} {toArabicNumbers(year)}</span>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700 flex items-center gap-1 text-xs font-bold"
        >
          <span>الشهر التالي</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Heatmap Grid */}
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
          {Array.from({ length: (cells.length > 0 ? DAY_INDEX_MAP[new Date(year, month, 1).getDay()] : 0) }).map((_, idx) => (
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
                onClick={() => setSelectedDayStr(cell.dateStr)}
                title={`${toArabicNumbers(cell.dayNumber)} ${ARABIC_MONTH_NAMES[month]}: ${toArabicNumbers(Math.round(cell.completionRatio * 5))}/5 صلوات`}
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
            <span className="w-3.5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700" />
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70" />
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-200 dark:bg-emerald-900/80" />
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-400 dark:bg-emerald-700" />
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 dark:bg-emerald-600" />
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-700 dark:bg-emerald-500" />
          </div>
          <span className="font-bold">أكثر</span>
        </div>
      </div>

      {/* Expandable Summary Cards Section */}
      <div className="space-y-2.5 pt-2">
        {/* Card 1: Total Performed This Month */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 rounded-2xl overflow-hidden transition-all">
          <button
            onClick={() => setExpandedCard(expandedCard === 'monthly' ? null : 'monthly')}
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
            onClick={() => setExpandedCard(expandedCard === 'streak' ? null : 'streak')}
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
            onClick={() => setExpandedCard(expandedCard === 'status' ? null : 'status')}
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

      {/* Selected Day Details BottomSheet / Modal */}
      <AnimatePresence>
        {selectedDayDetails && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
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
                  onClick={() => setSelectedDayStr(null)}
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
    </div>
  );
};

export default PrayerHeatmapStats;
