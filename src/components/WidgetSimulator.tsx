/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getMoonPhaseInfo } from '../utils/moonPhase';
import { AppSettings, PrayerTimes } from '../types';
import WidgetControls from './widgets/WidgetControls';
import { WidgetSimulatorHeader } from './widgets/WidgetSimulatorHeader';
import { WidgetPhoneFrame } from './widgets/WidgetPhoneFrame';
import { useWidgetSimulatorLogic, WALLPAPERS } from './widgets/useWidgetSimulatorLogic';

export { getMoonPhaseInfo };

interface WidgetSimulatorProps {
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

export default function WidgetSimulator({
  prayerTimes,
  settings,
  setSettings,
  currentPrayer = 'Dhuhr',
  nextPrayer = 'Asr',
  timeRemainingStr = '02:15:30',
  hijri,
  dayNameArabic = 'الجمعة',
  gregorianStr = '١٧ يوليو ٢٠٢٦',
}: WidgetSimulatorProps) {
  const logic = useWidgetSimulatorLogic({
    prayerTimes,
    settings,
    setSettings,
    currentPrayer,
    nextPrayer,
    timeRemainingStr,
    hijri,
    dayNameArabic,
    gregorianStr,
  });

  return (
    <div
      id="widget-simulator-section"
      className={`rounded-3xl border transition-all duration-300 relative overflow-hidden ${
        logic.isFaithBright
          ? 'bg-gradient-to-b from-[#faf8f2] to-[#f4f0e4] border-[#e4dcbf] shadow-md text-slate-800'
          : 'bg-[#0d131b]/95 backdrop-blur-md border-slate-800/80 shadow-2xl text-slate-100'
      }`}
      dir="rtl"
    >
      {/* Dynamic Animated Status Toast */}
      {logic.showToast && (
        <div className="absolute top-4 inset-x-4 z-50 bg-emerald-600 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-xl flex items-center justify-between gap-2 animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <p className="text-end leading-relaxed">{logic.toastMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => logic.setShowToast(false)}
            className="text-white hover:opacity-80 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg shrink-0 cursor-pointer"
          >
            حسناً
          </button>
        </div>
      )}

      {/* Header Panel */}
      <WidgetSimulatorHeader
        isFaithBright={logic.isFaithBright}
        wallpapers={WALLPAPERS}
        activeWallpaper={logic.activeWallpaper}
        onSelectWallpaper={logic.setActiveWallpaper}
      />

      {/* TWO COLUMN GRID LAB: Sleek, compact and modular */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 sm:p-5">
        {/* Left Column: Config Panels */}
        <WidgetControls
          isFaithBright={logic.isFaithBright}
          widgetType={logic.widgetType}
          setWidgetType={logic.setWidgetType}
          widgetTheme={logic.widgetTheme}
          setWidgetTheme={logic.setWidgetTheme}
          cardSize={logic.cardSize}
          setCardSize={logic.setCardSize}
          showKhushuBtn={logic.showKhushuBtn}
          setShowKhushuBtn={logic.setShowKhushuBtn}
          clockStyle={logic.clockStyle}
          setClockStyle={logic.setClockStyle}
          prayerDisplay={logic.prayerDisplay}
          setPrayerDisplay={logic.setPrayerDisplay}
          showMoonPhase={logic.showMoonPhase}
          setShowMoonPhase={logic.setShowMoonPhase}
          showDate={logic.showDate}
          setShowDate={logic.setShowDate}
          showDhikr={logic.showDhikr}
          setShowDhikr={logic.setShowDhikr}
          showAyah={logic.showAyah}
          setShowAyah={logic.setShowAyah}
          showQibla={logic.showQibla}
          setShowQibla={logic.setShowQibla}
          showSubhaBtn={logic.showSubhaBtn}
          setShowSubhaBtn={logic.setShowSubhaBtn}
          showProgressBar={logic.showProgressBar}
          setShowProgressBar={logic.setShowProgressBar}
          handlePinWidget={logic.handlePinWidget}
          handleDownloadWidgetSVG={logic.handleDownloadWidgetSVG}
        />

        {/* Right Column: Smartphone frame with live-reacting Widget preview */}
        <WidgetPhoneFrame
          currentWallpaper={logic.currentWallpaper}
          internalTime={logic.internalTime}
          widgetType={logic.widgetType}
          cardSize={logic.cardSize}
          showKhushuBtn={logic.showKhushuBtn}
          getWidgetThemeClass={logic.getWidgetThemeClass}
          showDate={logic.showDate}
          dayNameArabic={dayNameArabic}
          currentDayDigit={logic.currentDayDigit}
          currentMonthName={logic.currentMonthName}
          currentYear={logic.currentYear}
          showMoonPhase={logic.showMoonPhase}
          clockStyle={logic.clockStyle}
          hrDeg={logic.hrDeg}
          minDeg={logic.minDeg}
          secDeg={logic.secDeg}
          prayerDisplay={logic.prayerDisplay}
          nextPrayer={nextPrayer}
          currentPrayer={currentPrayer}
          prayerTimes={prayerTimes}
          showProgressBar={logic.showProgressBar}
          timeRemainingStr={timeRemainingStr}
          getFormattedTimeRemaining={logic.getFormattedTimeRemaining}
          getPrayerProgressPercent={logic.getPrayerProgressPercent}
          getArabicName={logic.getArabicName}
          showDhikr={logic.showDhikr}
          showAyah={logic.showAyah}
          showQibla={logic.showQibla}
          settings={settings}
          showSubhaBtn={logic.showSubhaBtn}
          subhaCount={logic.subhaCount}
          setSubhaCount={logic.setSubhaCount}
          gregorianStr={gregorianStr}
          getCompactCountdown={logic.getCompactCountdown}
        />
      </div>
    </div>
  );
}
