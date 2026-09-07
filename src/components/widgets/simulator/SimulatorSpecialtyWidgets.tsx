/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { toArabicNumbers } from '../../../utils/hijri';
import type { AppSettings, PrayerTimes } from '../../../types';

export interface SimulatorSpecialtyWidgetsProps {
  widgetType: 'analog' | 'compact' | 'dhikr' | 'qibla' | 'calendar';
  themeClass: string;
  hrDeg: number;
  minDeg: number;
  secDeg: number;
  nextPrayer: string;
  currentPrayer: string;
  prayerTimes: PrayerTimes | Record<string, string>;
  timeRemainingStr: string;
  settings: AppSettings;
  dayNameArabic: string;
  currentDayDigit: number;
  currentMonthName: string;
  currentYear: number;
  subhaCount: number;
  setSubhaCount: React.Dispatch<React.SetStateAction<number>>;
  getArabicName: (p: string) => string;
  getFormattedTimeRemaining: (tStr: string) => string;
  getCompactCountdown: () => string;
}

export const SimulatorSpecialtyWidgets: React.FC<SimulatorSpecialtyWidgetsProps> = ({
  widgetType,
  themeClass,
  hrDeg,
  minDeg,
  secDeg,
  nextPrayer,
  currentPrayer,
  prayerTimes,
  timeRemainingStr,
  settings,
  dayNameArabic,
  currentDayDigit,
  currentMonthName,
  currentYear,
  subhaCount,
  setSubhaCount,
  getArabicName,
  getFormattedTimeRemaining,
  getCompactCountdown,
}) => {
  // STYLE 4: Analog style dial
  if (widgetType === 'analog') {
    return (
      <div className={`w-full rounded-[18px] p-2.5 flex items-center justify-center gap-3 transition-all duration-500 border text-end select-none ${themeClass}`}>
        {/* Miniature Clock Face */}
        <div className="w-[56px] h-[56px] rounded-full bg-[#0a1520] border-2 border-[#1e3448] relative flex items-center justify-center shrink-0 shadow-md">
          <div className="absolute inset-0.5 rounded-full border border-dashed border-white/10 pointer-events-none" />
          <span className="absolute top-1 text-[6px] font-black text-amber-400/80 leading-none">١٢</span>
          <span className="absolute end-1 text-[6px] font-black text-white/40 leading-none">٣</span>
          <span className="absolute bottom-1 text-[6px] font-black text-white/40 leading-none">٦</span>
          <span className="absolute start-1 text-[6px] font-black text-white/40 leading-none">٩</span>

          {/* Hour Hand */}
          <div 
            className="absolute bg-gradient-to-t from-amber-400 to-amber-200 rounded-full shadow-xs"
            style={{
              width: '2.5px',
              height: '15px',
              left: '50%',
              bottom: '50%',
              transformOrigin: 'bottom center',
              transform: `translateX(-50%) rotate(${hrDeg}deg)`
            }}
          />

          {/* Minute Hand */}
          <div 
            className="absolute bg-white rounded-full shadow-xs"
            style={{
              width: '1.5px',
              height: '21px',
              left: '50%',
              bottom: '50%',
              transformOrigin: 'bottom center',
              transform: `translateX(-50%) rotate(${minDeg}deg)`
            }}
          />

          {/* Second Hand */}
          <div 
            className="absolute bg-red-500 rounded-full"
            style={{
              width: '1px',
              height: '23px',
              left: '50%',
              bottom: '50%',
              transformOrigin: 'bottom center',
              transform: `translateX(-50%) rotate(${secDeg}deg)`
            }}
          />

          <div className="w-2 h-2 rounded-full bg-red-500 border border-white z-10 shadow-xs" />
        </div>

        <div className="flex-1 space-y-1 text-right">
          <span className="text-[7.5px] font-black text-amber-400 block uppercase leading-none">صلاة {getArabicName(nextPrayer)}</span>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-bold text-white/70">متبقي للأذان:</span>
            <span className="text-[10px] font-black text-amber-300 font-mono leading-none">
              {getFormattedTimeRemaining(timeRemainingStr)}
            </span>
          </div>
          <div className="text-[6.5px] font-bold text-white/30 pt-0.5 border-t border-white/5 leading-none">
            📍 {settings.cityName || 'الإسكندرية'}
          </div>
        </div>
      </div>
    );
  }

  // STYLE 5: Compact Pill style
  if (widgetType === 'compact') {
    return (
      <div className="w-full bg-[#eeeeee] dark:bg-[#1a242d] text-slate-800 dark:text-white rounded-full py-2 px-3 flex items-center justify-between shadow-md border border-slate-200 dark:border-white/5 select-none scale-100">
        <div className="flex items-center gap-1 leading-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] font-extrabold font-sans">
            {getArabicName(currentPrayer)} {getCompactCountdown()}
          </span>
        </div>
        <span className="text-[6.5px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5 leading-none">
          📍 {settings.cityName || 'مكة'}
        </span>
      </div>
    );
  }

  // STYLE 6: Dhikr & Digital Subha
  if (widgetType === 'dhikr') {
    return (
      <div className={`w-full rounded-[18px] p-2.5 flex flex-col justify-between transition-all duration-500 border text-right select-none ${themeClass}`}>
        <div className="flex justify-between items-center border-b border-white/10 pb-1 text-[7.5px] font-black">
          <span className="text-amber-400">✨ ذكر اليوم والبركة</span>
          <span className="text-white/60">{dayNameArabic}</span>
        </div>
        <div className="py-1 text-center">
          <p className="text-[8.5px] font-extrabold text-amber-100 leading-snug">«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ»</p>
          <button
            type="button"
            onClick={() => setSubhaCount(c => c + 1)}
            className="mt-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-[9px] rounded-full shadow-md transition-all cursor-pointer inline-flex items-center gap-1"
          >
            <span>📿 تسبيح ({toArabicNumbers(subhaCount)})</span>
          </button>
        </div>
        <div className="flex justify-between items-center border-t border-white/5 pt-1 text-[6.5px] text-white/50 font-bold">
          <span>الصلاة القادمة: {getArabicName(nextPrayer)}</span>
          <span>📍 {settings.cityName || 'مكة'}</span>
        </div>
      </div>
    );
  }

  // STYLE 7: Qibla Compass Widget
  if (widgetType === 'qibla') {
    return (
      <div className={`w-full rounded-[18px] p-2.5 flex items-center justify-between gap-2 transition-all duration-500 border text-right select-none ${themeClass}`}>
        <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-500/80 flex flex-col items-center justify-center shrink-0 shadow-inner relative">
          <span className="text-xs">🕌</span>
          <span className="text-[6.5px] font-black font-mono text-amber-400">١٣٦°</span>
        </div>
        <div className="flex-1 text-right space-y-0.5">
          <span className="text-[6.5px] font-black text-amber-400 block uppercase">بوصلة القبلة</span>
          <h4 className="text-[8.5px] font-black text-white leading-tight">اتجاه الكعبة المشرفة</h4>
          <span className="text-[6.5px] text-white/60 block font-bold">موقعك: {settings.cityName || 'الإسكندرية'}</span>
        </div>
      </div>
    );
  }

  // STYLE 8: Hijri Calendar Widget
  return (
    <div className={`w-full rounded-[18px] p-2.5 flex flex-col justify-between transition-all duration-500 border text-right select-none ${themeClass}`}>
      <div className="flex justify-between items-center border-b border-white/10 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex flex-col items-center justify-center font-black">
            <span className="text-[9px] leading-none">{toArabicNumbers(currentDayDigit)}</span>
            <span className="text-[5.5px] leading-none font-bold">{currentMonthName}</span>
          </div>
          <div className="text-right">
            <span className="text-[8px] font-black text-white block">{dayNameArabic}</span>
            <span className="text-[6.5px] font-bold text-amber-400 block">{toArabicNumbers(currentYear)} هجرية</span>
          </div>
        </div>
        <span className="text-[6.5px] font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded">مستحب الصيام 🌙</span>
      </div>
      <div className="grid grid-cols-4 gap-0.5 py-1 text-center">
        {(['Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => (
          <div key={pName} className="p-0.5 rounded bg-white/5">
            <span className="text-[5.5px] text-white/60 block">{getArabicName(pName)}</span>
            <span className="text-[6.5px] font-black text-white font-mono">{toArabicNumbers(prayerTimes[pName] || '١٢:٠٠')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SimulatorSpecialtyWidgets;
