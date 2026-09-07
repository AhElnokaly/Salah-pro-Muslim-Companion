import React, { useState } from 'react';
import { AppSettings, PrayerTimes } from '../types';
import { parseTimeToMinutes } from '../utils/prayerCalc';
import CustomModularWidget from './widgets/CustomModularWidget';
import TimelineGridTealWidgets from './widgets/TimelineGridTealWidgets';
import ExtraSpecialtyWidgets from './widgets/ExtraSpecialtyWidgets';

interface PinnedFavoriteWidgetProps {
  pinnedWidget?: AppSettings['pinnedWidget'];
  cityName?: string;
  now?: Date;
  hijri?: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  times?: Record<string, string> | PrayerTimes;
  current?: string;
  next?: string;
  timeRemainingStr?: string;
  dayNameArabic?: string;
  gregorianClean?: string;
  toArabicNumbers?: (val: string | number) => string;
  isKhushuActive?: boolean;
  onNavigateWidgets?: () => void;
}

export const PinnedFavoriteWidget: React.FC<PinnedFavoriteWidgetProps> = ({
  pinnedWidget,
  cityName,
  now = new Date(),
  hijri,
  times = {} as Record<string, string>,
  current = 'Dhuhr',
  next = 'Asr',
  timeRemainingStr = '',
  dayNameArabic = '',
  gregorianClean = '',
  toArabicNumbers = (val: string | number) => String(val),
  isKhushuActive = false,
  onNavigateWidgets,
}) => {
  const wType = pinnedWidget?.type || 'custom';
  const wTheme = pinnedWidget?.theme || 'dark-blue';
  const [subhaCount, setSubhaCount] = useState(0);

  const themeClass = (() => {
    if (wType === 'teal') {
      return 'bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white border border-teal-400/30';
    }
    switch (wTheme) {
      case 'green':
        return 'bg-gradient-to-b from-emerald-950/95 via-emerald-900/95 to-teal-950/95 border border-emerald-500/30 text-white shadow-xl';
      case 'gold':
        return 'bg-gradient-to-b from-[#1c1b18]/95 via-[#23201a]/95 to-[#2b2720]/95 border border-amber-500/30 text-amber-100 shadow-xl';
      case 'glass':
        return 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl';
      case 'amber':
        return 'bg-gradient-to-tr from-[#2d1706]/95 via-[#452309]/95 to-[#1c0f04]/95 border border-amber-600/30 text-amber-100 shadow-xl';
      case 'onyx':
        return 'bg-gradient-to-b from-[#090d12]/95 via-[#111823]/95 to-[#080b0f]/95 border border-slate-700/40 text-slate-100 shadow-xl';
      case 'dark-blue':
      default:
        return 'bg-gradient-to-b from-[#0c1826]/95 to-[#112236]/95 border border-blue-900/40 text-white shadow-2xl';
    }
  })();

  const getArabicNameLocal = (p: string) => {
    const names: Record<string, string> = {
      Fajr: 'الفجر',
      Sunrise: 'الشروق',
      Dhuhr: 'الظهر',
      Asr: 'العصر',
      Maghrib: 'المغرب',
      Isha: 'العشاء'
    };
    if (p === 'Dhuhr' && now.getDay() === 5) return 'الجمعة';
    return names[p] || p;
  };

  const currentDayDigit = hijri?.day || now.getDate();
  const currentMonthName = hijri?.monthName || 'شوال';
  const currentYear = hijri?.year || 1448;

  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours();

  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = (hr % 12) * 30 + min * 0.5;

  const getFormattedTimeRemaining = (tStr: string) => {
    if (!tStr) return '';
    const clean = tStr.replace('-', '').trim();
    const parts = clean.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (h > 0) {
        return `${toArabicNumbers(h)} س و ${toArabicNumbers(m)} د`;
      }
      return `${toArabicNumbers(m)} دقيقة`;
    }
    return toArabicNumbers(clean);
  };

  const getPrayerProgressPercent = () => {
    if (!times || !current || !next) return 50;
    const currMin = parseTimeToMinutes(times[current] || '');
    let nextMin = parseTimeToMinutes(times[next] || '');
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nextMin <= currMin) nextMin += 24 * 60;
    let currentAdjusted = nowMin;
    if (currentAdjusted < currMin && nextMin > 24 * 60) currentAdjusted += 24 * 60;
    const total = nextMin - currMin;
    if (total <= 0) return 50;
    const elapsed = currentAdjusted - currMin;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  // Dhikr list sample
  const dhikrSample = "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ";

  return (
    <div className="rounded-3xl p-4 sm:p-5 border bg-white dark:bg-[#111723]/95 dark:backdrop-blur-md border-[#e2e8f0] dark:border-white/5 shadow-md dark:shadow-2xl text-slate-800 dark:text-slate-200 transition-all duration-300 relative overflow-hidden flex flex-col gap-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <span className="text-xs">📌</span>
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-700 dark:text-slate-300">
            أداتك المفضلة المثبتة (شاشة الهاتف)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isKhushuActive && (
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              الخشوع نشط
            </span>
          )}
          {onNavigateWidgets && (
            <button
              type="button"
              onClick={onNavigateWidgets}
              className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40"
            >
              تخصيص الـ Widgets ⚙️
            </button>
          )}
        </div>
      </div>

      {/* Widget frame on wallpaper backdrop */}
      <div className="w-full flex justify-center items-center">
        <div className={`relative w-full max-w-md rounded-2xl p-2 overflow-hidden shadow-lg flex items-center justify-center border border-white/10 ${
          pinnedWidget.wallpaper === 'slate' ? 'bg-slate-900' :
          pinnedWidget.wallpaper === 'desert' ? 'bg-gradient-to-tr from-[#1f1235] via-[#481d3d] to-[#99413b]' :
          pinnedWidget.wallpaper === 'forest' ? 'bg-gradient-to-b from-[#061f18] via-[#0c2e26] to-[#143d34]' :
          pinnedWidget.wallpaper === 'light' ? 'bg-gradient-to-br from-amber-50 via-sky-50 to-emerald-50' :
          'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950 via-slate-950 to-black'
        }`}>
          <div className="w-full">
            {/* STYLE 0: Custom Modular Card */}
            {wType === 'custom' && (
              <CustomModularWidget
                pinnedWidget={pinnedWidget}
                themeClass={themeClass}
                dayNameArabic={dayNameArabic}
                currentDayDigit={currentDayDigit}
                currentMonthName={currentMonthName}
                currentYear={currentYear}
                now={now}
                hrDeg={hrDeg}
                minDeg={minDeg}
                secDeg={secDeg}
                next={next}
                current={current}
                times={times}
                timeRemainingStr={timeRemainingStr}
                cityName={cityName}
                subhaCount={subhaCount}
                setSubhaCount={setSubhaCount}
                toArabicNumbers={toArabicNumbers}
                getArabicNameLocal={getArabicNameLocal}
                getFormattedTimeRemaining={getFormattedTimeRemaining}
                getPrayerProgressPercent={getPrayerProgressPercent}
              />
            )}

            {/* STYLES 1, 2, 3: Timeline, Grid, Teal */}
            {(wType === 'timeline' || wType === 'grid' || wType === 'teal') && (
              <TimelineGridTealWidgets
                wType={wType}
                themeClass={themeClass}
                cityName={cityName}
                dayNameArabic={dayNameArabic}
                currentDayDigit={currentDayDigit}
                currentMonthName={currentMonthName}
                current={current}
                next={next}
                times={times}
                timeRemainingStr={timeRemainingStr}
                gregorianClean={gregorianClean}
                toArabicNumbers={toArabicNumbers}
                getArabicNameLocal={getArabicNameLocal}
              />
            )}

            {/* STYLES 4, 5, 6, 7, 8: Analog, Compact, Dhikr, Qibla, Calendar */}
            {(wType === 'analog' || wType === 'compact' || wType === 'dhikr' || wType === 'qibla' || wType === 'calendar') && (
              <ExtraSpecialtyWidgets
                wType={wType}
                themeClass={themeClass}
                cityName={cityName}
                dayNameArabic={dayNameArabic}
                currentDayDigit={currentDayDigit}
                currentMonthName={currentMonthName}
                currentYear={currentYear}
                current={current}
                next={next}
                times={times}
                timeRemainingStr={timeRemainingStr}
                gregorianClean={gregorianClean}
                subhaCount={subhaCount}
                setSubhaCount={setSubhaCount}
                hrDeg={hrDeg}
                minDeg={minDeg}
                secDeg={secDeg}
                toArabicNumbers={toArabicNumbers}
                getArabicNameLocal={getArabicNameLocal}
                getFormattedTimeRemaining={getFormattedTimeRemaining}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

