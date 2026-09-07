/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppSettings, PrayerLog, QuranSession, QuranKhatma, FastingLog } from '../types';
import { 
  getHijriDate, 
  toArabicNumbers, 
  getArabicMonthNameGregorian 
} from '../utils/hijri';
import CalendarGridCard from './calendar/CalendarGridCard';
import SelectedDayDetails from './calendar/SelectedDayDetails';
import WorshipProgressHub from './calendar/WorshipProgressHub';
import { CalendarGridCell } from './calendar/calendarHelpers';

interface IslamicCalendarProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  prayerLogs?: Record<string, Record<string, PrayerLog>>;
  fastingLogs?: Record<string, FastingLog>;
  dhikrLogs?: Record<string, Record<string, number>>;
  quranSessions?: QuranSession[];
  khatmat?: QuranKhatma[];
  onNavigateTab?: (tab: string) => void;
}

export default function IslamicCalendar({ 
  settings, 
  setSettings,
  prayerLogs = {},
  fastingLogs = {},
  dhikrLogs = {},
  quranSessions = [],
  khatmat = [],
  onNavigateTab
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

  // Generate calendar grid array
  let gridCells: CalendarGridCell[] = [];

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
    const currentHijriDays: CalendarGridCell[] = [];
    let dIter = new Date(firstOfHijriGregorian.getTime());
    for (let i = 0; i < 35; i++) {
      const h = getHijriDate(dIter, settings.hijriOffset);
      if (h.month !== targetHijriMonth || h.year !== targetHijriYear) {
        break;
      }
      currentHijriDays.push({
        dayNum: dIter.getDate(),
        date: new Date(dIter.getTime()),
        isCurrentMonth: true
      });
      dIter.setDate(dIter.getDate() + 1);
    }

    // Previous Hijri Month Padding Days
    const prevHijriDays: CalendarGridCell[] = [];
    let prevIter = new Date(firstOfHijriGregorian.getTime());
    prevIter.setDate(prevIter.getDate() - 1);
    for (let i = 0; i < firstHijriDayIndex; i++) {
      prevHijriDays.unshift({
        dayNum: prevIter.getDate(),
        date: new Date(prevIter.getTime()),
        isCurrentMonth: false
      });
      prevIter.setDate(prevIter.getDate() - 1);
    }

    // Next Hijri Month Padding Days
    const nextHijriDays: CalendarGridCell[] = [];
    const remainingCells = 42 - (prevHijriDays.length + currentHijriDays.length);
    let nextIter = new Date(dIter.getTime());
    for (let i = 0; i < remainingCells; i++) {
      nextHijriDays.push({
        dayNum: nextIter.getDate(),
        date: new Date(nextIter.getTime()),
        isCurrentMonth: false
      });
      nextIter.setDate(nextIter.getDate() + 1);
    }

    gridCells = [...prevHijriDays, ...currentHijriDays, ...nextHijriDays];
  } else {
    // Gregorian Mode
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

    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month, d);
      gridCells.push({
        dayNum: d,
        date: dateObj,
        isCurrentMonth: true
      });
    }

    const remainingCells = 42 - gridCells.length;
    for (let d = 1; d <= remainingCells; d++) {
      const dateObj = new Date(year, month + 1, d);
      gridCells.push({
        dayNum: d,
        date: dateObj,
        isCurrentMonth: false
      });
    }
  }

  return (
    <div className="space-y-4" id="islamic-calendar-widget">
      {/* Calendar Card Grid */}
      <CalendarGridCard
        settings={settings}
        setSettings={setSettings}
        viewDate={viewDate}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onGoToToday={handleGoToToday}
        gridCells={gridCells}
        hijriMonthHeader={hijriMonthHeader}
        gregorianMonthName={gregorianMonthName}
        year={year}
      />

      {/* Selected Day details card */}
      <SelectedDayDetails
        selectedDate={selectedDate}
        settings={settings}
        setSettings={setSettings}
        onNavigateTab={onNavigateTab}
      />

      {/* Worship Progress Hub */}
      <WorshipProgressHub
        statsPeriod={statsPeriod}
        setStatsPeriod={setStatsPeriod}
        prayerLogs={prayerLogs}
        fastingLogs={fastingLogs}
        dhikrLogs={dhikrLogs}
        quranSessions={quranSessions}
      />
    </div>
  );
}
