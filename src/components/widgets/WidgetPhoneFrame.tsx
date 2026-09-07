/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WallpaperOption } from './useWidgetSimulatorLogic';
import WidgetDisplayCard from './WidgetDisplayCard';
import { WidgetType } from './WidgetControls';
import { AppSettings, PrayerTimes } from '../../types';

interface WidgetPhoneFrameProps {
  currentWallpaper: WallpaperOption;
  internalTime: Date;
  widgetType: WidgetType;
  cardSize?: 'compact' | 'medium' | 'large';
  showKhushuBtn?: boolean;
  getWidgetThemeClass: () => string;
  showDate: boolean;
  dayNameArabic: string;
  currentDayDigit: number;
  currentMonthName: string;
  currentYear: number;
  showMoonPhase: boolean;
  clockStyle: 'none' | 'digital' | 'analog';
  hrDeg: number;
  minDeg: number;
  secDeg: number;
  prayerDisplay: 'none' | 'next_only' | 'all_prayers';
  nextPrayer: string;
  currentPrayer: string;
  prayerTimes: PrayerTimes | Record<string, string>;
  showProgressBar: boolean;
  timeRemainingStr: string;
  getFormattedTimeRemaining: (tStr: string) => string;
  getPrayerProgressPercent: () => number;
  getArabicName: (p: string) => string;
  showDhikr: boolean;
  showAyah: boolean;
  showQibla: boolean;
  settings: AppSettings;
  showSubhaBtn: boolean;
  subhaCount: number;
  setSubhaCount: React.Dispatch<React.SetStateAction<number>>;
  gregorianStr: string;
  getCompactCountdown: () => string;
}

export const WidgetPhoneFrame: React.FC<WidgetPhoneFrameProps> = ({
  currentWallpaper,
  internalTime,
  widgetType,
  cardSize = 'medium' as 'compact' | 'medium' | 'large',
  showKhushuBtn = true,
  getWidgetThemeClass,
  showDate,
  dayNameArabic,
  currentDayDigit,
  currentMonthName,
  currentYear,
  showMoonPhase,
  clockStyle,
  hrDeg,
  minDeg,
  secDeg,
  prayerDisplay,
  nextPrayer,
  currentPrayer,
  prayerTimes,
  showProgressBar,
  timeRemainingStr,
  getFormattedTimeRemaining,
  getPrayerProgressPercent,
  getArabicName,
  showDhikr,
  showAyah,
  showQibla,
  settings,
  showSubhaBtn,
  subhaCount,
  setSubhaCount,
  gregorianStr,
  getCompactCountdown,
}) => {
  return (
    <div className="md:col-span-5 flex justify-center items-center">
      <div className="relative w-full max-w-[230px] rounded-[36px] border-[7px] border-slate-800 dark:border-slate-900 bg-black overflow-hidden aspect-[9/16] shadow-xl flex flex-col justify-between p-2.5 pb-4">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-20">
          <div className="w-16 h-3 bg-black rounded-b-lg flex items-center justify-center gap-1 px-2">
            <span className="w-1 h-1 rounded-full bg-slate-950" />
            <span className="w-7 h-1 bg-slate-950 rounded-full" />
          </div>
        </div>

        {/* Simulated wallpaper background */}
        <div className={`absolute inset-0 z-0 ${currentWallpaper.style} transition-all duration-700`} />

        {/* Mobile Status bar */}
        <div className="flex justify-between items-center z-10 text-[7.5px] text-white/95 font-sans font-bold px-2 pt-1">
          <span dir="ltr">
            {internalTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="flex items-center gap-0.5" dir="ltr">
            <span>📶</span>
            <span>🛜</span>
            <span className="text-[7px]">🔋 ٩٥٪</span>
          </div>
        </div>

        {/* Centered Widget Area */}
        <WidgetDisplayCard
          widgetType={widgetType}
          cardSize={cardSize}
          showKhushuBtn={showKhushuBtn}
          getWidgetThemeClass={getWidgetThemeClass}
          showDate={showDate}
          dayNameArabic={dayNameArabic}
          currentDayDigit={currentDayDigit}
          currentMonthName={currentMonthName}
          currentYear={currentYear}
          showMoonPhase={showMoonPhase}
          clockStyle={clockStyle}
          internalTime={internalTime}
          hrDeg={hrDeg}
          minDeg={minDeg}
          secDeg={secDeg}
          prayerDisplay={prayerDisplay}
          nextPrayer={nextPrayer}
          currentPrayer={currentPrayer}
          prayerTimes={prayerTimes}
          showProgressBar={showProgressBar}
          timeRemainingStr={timeRemainingStr}
          getFormattedTimeRemaining={getFormattedTimeRemaining}
          getPrayerProgressPercent={getPrayerProgressPercent}
          getArabicName={getArabicName}
          showDhikr={showDhikr}
          showAyah={showAyah}
          showQibla={showQibla}
          settings={settings}
          showSubhaBtn={showSubhaBtn}
          subhaCount={subhaCount}
          setSubhaCount={setSubhaCount}
          gregorianStr={gregorianStr}
          getCompactCountdown={getCompactCountdown}
        />

        {/* Bottom launcher shortcuts */}
        <div className="mt-auto flex justify-center gap-4 z-10 py-0.5 border-t border-white/5 pt-1.5">
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">📞</div>
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">💬</div>
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">🌐</div>
          <div className="w-5 h-5 rounded-full bg-indigo-600/80 flex items-center justify-center text-[9px] border border-indigo-400/20 shadow-inner">🕌</div>
        </div>

        {/* Swipe home bar */}
        <div className="absolute bottom-0.5 inset-x-0 h-0.5 flex justify-center z-20">
          <div className="w-12 h-0.5 bg-white/50 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default WidgetPhoneFrame;
