/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Calendar as CalendarIcon,
  BarChart3
} from 'lucide-react';
import type { PrayerLog, VoluntaryPrayerLog, PrayerName } from '../types';
import { toArabicNumbers } from '../utils/hijri';
import { 
  DAYS_RTL_LABELS,
  DAY_INDEX_MAP,
  ARABIC_MONTH_NAMES,
  computeIntensity,
  calculateStreaks,
  type HeatmapCellData,
  type MonthPrayerStats
} from './prayer/heatmap/heatmapUtils';
import { HeatmapGrid } from './prayer/heatmap/HeatmapGrid';
import { HeatmapSummaryCards } from './prayer/heatmap/HeatmapSummaryCards';
import { HeatmapDayDetailsModal, type DayDetailsData } from './prayer/heatmap/HeatmapDayDetailsModal';

// Re-export for backward compatibility
export { computeIntensity, calculateStreaks, DAYS_RTL_LABELS, DAY_INDEX_MAP, ARABIC_MONTH_NAMES };

export interface PrayerHeatmapStatsProps {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
  onClose?: () => void;
}

export const PrayerHeatmapStats: React.FC<PrayerHeatmapStatsProps> = ({
  prayerLogs,
  voluntaryPrayerLogs = [] as VoluntaryPrayerLog[],
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
  const { cells, paddingCols, monthStats } = useMemo(() => {
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

    const cellList: HeatmapCellData[] = [];

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

    const mStats: MonthPrayerStats = {
      totalPerformed: performedMonthTotal,
      prayerBreakdown,
      inTimeCount,
      qadaCount,
      excusedCount,
      missedCount,
      daysCount: daysInMonth
    };

    return {
      cells: cellList,
      paddingCols: offsetCols,
      monthStats: mStats
    };
  }, [year, month, prayerLogs, todayStr]);

  // Streak calculations
  const streaks = useMemo(() => calculateStreaks(prayerLogs), [prayerLogs]);

  // Selected Day log details
  const selectedDayDetails = useMemo<DayDetailsData | null>(() => {
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
            type="button"
            onClick={onClose}
            aria-label="إغلاق إحصائيات الصلاة"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Month Navigation Control */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <button
          type="button"
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
          type="button"
          onClick={handleNextMonth}
          className="p-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200/50 dark:border-slate-700 flex items-center gap-1 text-xs font-bold"
        >
          <span>الشهر التالي</span>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Heatmap Grid */}
      <HeatmapGrid
        cells={cells}
        paddingCount={paddingCols}
        month={month}
        onSelectDay={setSelectedDayStr}
      />

      {/* Expandable Summary Cards Section */}
      <HeatmapSummaryCards
        monthStats={monthStats}
        streaks={streaks}
        expandedCard={expandedCard}
        onToggleCard={(card) => setExpandedCard(expandedCard === card ? null : card)}
      />

      {/* Selected Day Details BottomSheet / Modal */}
      <HeatmapDayDetailsModal
        selectedDayDetails={selectedDayDetails}
        onClose={() => setSelectedDayStr(null)}
      />
    </div>
  );
};

export default PrayerHeatmapStats;
