/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type { AppSettings, PrayerTimes } from '../../types';
import { SimulatorCustomWidget } from './simulator/SimulatorCustomWidget';
import { SimulatorTimelineGridTeal } from './simulator/SimulatorTimelineGridTeal';
import { SimulatorSpecialtyWidgets } from './simulator/SimulatorSpecialtyWidgets';

export interface WidgetDisplayProps {
  widgetType: 'custom' | 'timeline' | 'grid' | 'teal' | 'analog' | 'compact' | 'dhikr' | 'qibla' | 'calendar';
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
  internalTime: Date;
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

export default function WidgetDisplayCard({
  widgetType,
  cardSize = 'medium',
  showKhushuBtn = true,
  getWidgetThemeClass,
  showDate,
  dayNameArabic,
  currentDayDigit,
  currentMonthName,
  currentYear,
  showMoonPhase,
  clockStyle,
  internalTime,
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
  getCompactCountdown
}: WidgetDisplayProps) {
  const themeClass = getWidgetThemeClass();

  return (
    <div className="my-auto z-10 w-full flex items-center justify-center py-2 px-0.5 min-h-[120px]">
      {/* STYLE 0: Custom Modular Card */}
      {widgetType === 'custom' && (
        <SimulatorCustomWidget
          themeClass={themeClass}
          cardSize={cardSize}
          showKhushuBtn={showKhushuBtn}
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
        />
      )}

      {/* STYLE 1, 2, 3: Timeline, Grid, Teal Widgets */}
      {(widgetType === 'timeline' || widgetType === 'grid' || widgetType === 'teal') && (
        <SimulatorTimelineGridTeal
          widgetType={widgetType}
          themeClass={themeClass}
          currentDayDigit={currentDayDigit}
          currentMonthName={currentMonthName}
          dayNameArabic={dayNameArabic}
          gregorianStr={gregorianStr}
          timeRemainingStr={timeRemainingStr}
          currentPrayer={currentPrayer}
          nextPrayer={nextPrayer}
          prayerTimes={prayerTimes}
          settings={settings}
          getArabicName={getArabicName}
        />
      )}

      {/* STYLE 4, 5, 6, 7, 8: Analog, Compact, Dhikr, Qibla, Calendar Widgets */}
      {(widgetType === 'analog' || widgetType === 'compact' || widgetType === 'dhikr' || widgetType === 'qibla' || widgetType === 'calendar') && (
        <SimulatorSpecialtyWidgets
          widgetType={widgetType}
          themeClass={themeClass}
          hrDeg={hrDeg}
          minDeg={minDeg}
          secDeg={secDeg}
          nextPrayer={nextPrayer}
          currentPrayer={currentPrayer}
          prayerTimes={prayerTimes}
          timeRemainingStr={timeRemainingStr}
          settings={settings}
          dayNameArabic={dayNameArabic}
          currentDayDigit={currentDayDigit}
          currentMonthName={currentMonthName}
          currentYear={currentYear}
          subhaCount={subhaCount}
          setSubhaCount={setSubhaCount}
          getArabicName={getArabicName}
          getFormattedTimeRemaining={getFormattedTimeRemaining}
          getCompactCountdown={getCompactCountdown}
        />
      )}
    </div>
  );
}
