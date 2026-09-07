/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { toArabicNumbers } from '../../utils/hijri';
import { parseTimeToMinutes } from '../../utils/prayerCalc';
import { AppSettings, PrayerTimes } from '../../types';
import { generateWidgetSvg } from './widgetSvgGenerator';
import { WidgetType, WidgetTheme } from './WidgetControls';

export interface WallpaperOption {
  id: string;
  name: string;
  style: string;
}

export const WALLPAPERS: WallpaperOption[] = [
  { id: 'starry', name: 'نجوم', style: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950 via-slate-950 to-black border-sky-950' },
  { id: 'desert', name: 'صحراء', style: 'bg-gradient-to-tr from-[#1f1235] via-[#481d3d] to-[#99413b] border-pink-900/30' },
  { id: 'forest', name: 'غابة', style: 'bg-gradient-to-b from-[#061f18] via-[#0c2e26] to-[#143d34] border-emerald-950' },
  { id: 'slate', name: 'رمادي', style: 'bg-slate-900 border-slate-750' },
  { id: 'light', name: 'نهار', style: 'bg-gradient-to-br from-amber-50 via-sky-50 to-emerald-50 border-amber-200' },
];

export interface UseWidgetSimulatorLogicProps {
  prayerTimes: PrayerTimes | Record<string, string>;
  settings: AppSettings;
  setSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  currentPrayer?: string;
  nextPrayer?: string;
  timeRemainingStr?: string;
  hijri?: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  dayNameArabic?: string;
  gregorianStr?: string;
}

export function useWidgetSimulatorLogic({
  prayerTimes,
  settings,
  setSettings,
  currentPrayer = 'Dhuhr',
  nextPrayer = 'Asr',
  timeRemainingStr = '02:15:30',
  hijri,
  dayNameArabic = 'الجمعة',
  gregorianStr = '١٧ يوليو ٢٠٢٦',
}: UseWidgetSimulatorLogicProps) {
  const [widgetType, setWidgetType] = useState<WidgetType>('custom');
  const [widgetTheme, setWidgetTheme] = useState<WidgetTheme>(
    (settings?.pinnedWidget?.theme as WidgetTheme) || 'dark-blue'
  );
  const [activeWallpaper, setActiveWallpaper] = useState(settings?.pinnedWidget?.wallpaper || 'starry');
  const [internalTime, setInternalTime] = useState<Date>(new Date());
  const [subhaCount, setSubhaCount] = useState<number>(0);
  const [, setIsPinned] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modular Custom Widget Toggles
  const [clockStyle, setClockStyle] = useState<'none' | 'digital' | 'analog'>(
    settings?.pinnedWidget?.clockStyle || 'digital'
  );
  const [showMoonPhase, setShowMoonPhase] = useState<boolean>(
    settings?.pinnedWidget?.showMoonPhase ?? true
  );
  const [prayerDisplay, setPrayerDisplay] = useState<'none' | 'next_only' | 'all_prayers'>(
    settings?.pinnedWidget?.prayerDisplay || 'next_only'
  );
  const [showDate, setShowDate] = useState<boolean>(
    settings?.pinnedWidget?.showDate ?? true
  );
  const [showDhikr, setShowDhikr] = useState<boolean>(
    settings?.pinnedWidget?.showDhikr ?? true
  );
  const [showAyah, setShowAyah] = useState<boolean>(
    settings?.pinnedWidget?.showAyah ?? false
  );
  const [showQibla, setShowQibla] = useState<boolean>(
    settings?.pinnedWidget?.showQibla ?? false
  );
  const [showSubhaBtn, setShowSubhaBtn] = useState<boolean>(
    settings?.pinnedWidget?.showSubhaBtn ?? true
  );
  const [showProgressBar, setShowProgressBar] = useState<boolean>(
    settings?.pinnedWidget?.showProgressBar ?? true
  );
  const [cardSize, setCardSize] = useState<'compact' | 'medium' | 'large'>(
    settings?.pinnedWidget?.cardSize || 'medium'
  );
  const [showKhushuBtn, setShowKhushuBtn] = useState<boolean>(
    settings?.pinnedWidget?.showKhushuBtn ?? true
  );

  // Local timer for mock clock hands and updates
  useEffect(() => {
    const timer = setInterval(() => {
      setInternalTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentWallpaper = WALLPAPERS.find((w) => w.id === activeWallpaper) || WALLPAPERS[0];

  const getWidgetThemeClass = () => {
    if (widgetType === 'teal') {
      return 'bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white border border-teal-400/30 shadow-xl';
    }
    switch (widgetTheme) {
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
  };

  const getArabicName = (p: string) => {
    const names: Record<string, string> = {
      Fajr: 'الفجر',
      Sunrise: 'الشروق',
      Dhuhr: 'الظهر',
      Asr: 'العصر',
      Maghrib: 'المغرب',
      Isha: 'العشاء',
    };
    if (p === 'Dhuhr' && internalTime.getDay() === 5) return 'الجمعة';
    return names[p] || p;
  };

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
    if (!prayerTimes || !currentPrayer || !nextPrayer) return 50;
    const currMin = parseTimeToMinutes(prayerTimes[currentPrayer] || '');
    let nextMin = parseTimeToMinutes(prayerTimes[nextPrayer] || '');
    const nowMin = internalTime.getHours() * 60 + internalTime.getMinutes();
    if (nextMin <= currMin) nextMin += 24 * 60;
    let currentAdjusted = nowMin;
    if (currentAdjusted < currMin && nextMin > 24 * 60) currentAdjusted += 24 * 60;
    const total = nextMin - currMin;
    if (total <= 0) return 50;
    const elapsed = currentAdjusted - currMin;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const getCompactCountdown = () => {
    const parts = timeRemainingStr.split(':');
    if (parts.length < 3) return timeRemainingStr;
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    return `${toArabicNumbers(h)} س ${toArabicNumbers(m)} د`;
  };

  // Clock calculations
  const sec = internalTime.getSeconds();
  const min = internalTime.getMinutes();
  const hr = internalTime.getHours();

  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = (hr % 12) * 30 + min * 0.5;

  const currentDayDigit = hijri?.day || internalTime.getDate();
  const currentMonthName = hijri?.monthName || 'شوال';
  const currentYear = hijri?.year || 1448;

  // Pin Widget configuration to local settings (which persist)
  const handlePinWidget = () => {
    if (setSettings) {
      setSettings((prev) => ({
        ...prev,
        pinnedWidget: {
          type: widgetType,
          theme: widgetTheme,
          wallpaper: activeWallpaper,
          clockStyle,
          showMoonPhase,
          prayerDisplay,
          showDate,
          showDhikr,
          showAyah,
          showQibla,
          showSubhaBtn,
          showProgressBar,
          cardSize,
          showKhushuBtn,
        },
      }));
      setIsPinned(true);
      setToastMessage('📌 تم تثبيت الـ Widget المخصص بنجاح! سيظهر الآن بجميع مكوناته على شاشتك الرئيسية 🥳🤍');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  // SVG Vector Download Generator
  const handleDownloadWidgetSVG = () => {
    const fullSvg = generateWidgetSvg({
      widgetType,
      widgetTheme,
      settings,
      prayerTimes,
      currentPrayer,
      nextPrayer,
      timeRemainingStr,
      currentDayDigit,
      currentMonthName,
      currentYear,
      dayNameArabic,
      gregorianStr,
      hrDeg,
      minDeg,
      secDeg,
      getArabicName,
    });

    const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hemmaty_${widgetType}_widget.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage('📥 تم تحميل ملف الـ Widget كملف SVG شعاعي عالي الدقة بنجاح! يمكنك الآن استخدامه 🥳');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const isFaithBright = settings.appStyle === 'faith-bright';

  return {
    widgetType,
    setWidgetType,
    widgetTheme,
    setWidgetTheme,
    cardSize,
    setCardSize,
    showKhushuBtn,
    setShowKhushuBtn,
    activeWallpaper,
    setActiveWallpaper,
    currentWallpaper,
    internalTime,
    subhaCount,
    setSubhaCount,
    showToast,
    setShowToast,
    toastMessage,
    clockStyle,
    setClockStyle,
    showMoonPhase,
    setShowMoonPhase,
    prayerDisplay,
    setPrayerDisplay,
    showDate,
    setShowDate,
    showDhikr,
    setShowDhikr,
    showAyah,
    setShowAyah,
    showQibla,
    setShowQibla,
    showSubhaBtn,
    setShowSubhaBtn,
    showProgressBar,
    setShowProgressBar,
    getWidgetThemeClass,
    getArabicName,
    getFormattedTimeRemaining,
    getPrayerProgressPercent,
    getCompactCountdown,
    hrDeg,
    minDeg,
    secDeg,
    currentDayDigit,
    currentMonthName,
    currentYear,
    handlePinWidget,
    handleDownloadWidgetSVG,
    isFaithBright,
  };
}
