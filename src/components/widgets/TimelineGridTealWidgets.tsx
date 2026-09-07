/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PrayerTimes } from '../../types';

export interface TimelineGridTealWidgetsProps {
  wType: 'timeline' | 'grid' | 'teal';
  themeClass: string;
  cityName?: string;
  dayNameArabic: string;
  currentDayDigit: number;
  currentMonthName: string;
  current: string;
  next: string;
  times: Record<string, string> | PrayerTimes;
  timeRemainingStr: string;
  gregorianClean: string;
  toArabicNumbers: (val: string | number) => string;
  getArabicNameLocal: (p: string) => string;
}

export const TimelineGridTealWidgets: React.FC<TimelineGridTealWidgetsProps> = ({
  wType,
  themeClass,
  cityName,
  dayNameArabic,
  currentDayDigit,
  currentMonthName,
  current,
  next,
  times,
  timeRemainingStr,
  gregorianClean,
  toArabicNumbers,
  getArabicNameLocal,
}) => {
  if (wType === 'timeline') {
    return (
      <div className={`w-full rounded-xl p-3 flex flex-col justify-between border select-none ${themeClass}`}>
        <div className="flex justify-between items-start border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex flex-col items-center justify-center font-sans">
              <span className="text-[11px] font-black leading-none">{toArabicNumbers(currentDayDigit)}</span>
              <span className="text-[6px] font-bold leading-none">{currentMonthName}</span>
            </div>
            <div className="text-right">
              <span className="text-[8.5px] font-black block text-white/90 leading-none">{dayNameArabic}</span>
              <span className="text-[6.5px] font-bold block text-white/40 mt-0.5">{toArabicNumbers(gregorianClean.split(' ').slice(0, 2).join(' '))}</span>
            </div>
          </div>
          <div className="text-end">
            <span className="text-[6.5px] font-bold block text-white/40">متبقي للأذان</span>
            <span className="text-[11px] font-extrabold block text-amber-400 font-mono leading-none mt-0.5" dir="ltr">
              -{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
            </span>
          </div>
        </div>

        <div className="relative py-2.5 my-0.5 flex items-center justify-between">
          <div className="absolute inset-x-1.5 h-[1.5px] bg-white/20 top-1/2 -translate-y-1/2 z-0 rounded-full" />
          {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
            const isActive = current === pName;
            const prayerTime = times[pName] || '٠٠:٠٠';
            return (
              <div key={pName} className="flex flex-col items-center relative z-10 scale-90">
                <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all ${
                  isActive ? 'bg-amber-400 text-slate-950 ring-2 ring-white scale-120 shadow-xs' : 'bg-[#1b2b3c] border border-white/10'
                }`} />
                <span className={`text-[7px] font-bold mt-1 block ${isActive ? 'text-amber-400 font-black' : 'text-white/60'}`}>{getArabicNameLocal(pName)}</span>
                <span className={`text-[7.5px] font-black font-mono mt-0.2 block ${isActive ? 'text-white' : 'text-white/30'}`}>{toArabicNumbers(prayerTime)}</span>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between items-center border-t border-white/5 pt-1.5 text-[7.5px] text-white/40 font-bold leading-none">
          <span>📍 {cityName || 'الإسكندرية'}</span>
          <span>الشروق {toArabicNumbers(times.Sunrise || '٠٦:٠٨')} ص</span>
        </div>
      </div>
    );
  }

  if (wType === 'grid') {
    return (
      <div className={`w-full rounded-xl p-2.5 flex flex-col justify-between border select-none ${themeClass}`}>
        <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[8px] font-black">
          <span className="text-white">{dayNameArabic} • {toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
          <span className="text-amber-400 flex items-center gap-0.5">📍 {cityName || 'الإسكندرية'}</span>
        </div>
        <div className="grid grid-cols-3 gap-1 py-1.5">
          {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
            const isActive = current === pName;
            const prayerTime = times[pName] || '٠٠:٠٠';
            return (
              <div 
                key={pName}
                className={`p-1.5 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                  isActive ? 'bg-[#15273b]/95 border-amber-400 shadow-sm' : 'bg-white/[0.03] border-white/5'
                }`}
              >
                <span className={`text-[7.5px] font-black ${isActive ? 'text-amber-400' : 'text-white/70'}`}>{getArabicNameLocal(pName)}</span>
                <span className={`text-[8px] font-black font-mono mt-0.5 ${isActive ? 'text-white' : 'text-white/35'}`}>{toArabicNumbers(prayerTime)}</span>
              </div>
            );
          })}
        </div>
        <div className="text-center text-[6.5px] text-white/30 border-t border-white/5 pt-1 leading-none font-bold">
          مواقيت الصلاة • تطبيق هِمَّتِي
        </div>
      </div>
    );
  }

  if (wType === 'teal') {
    return (
      <div className="w-full rounded-xl p-3 flex flex-col justify-between bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white shadow-lg relative overflow-hidden select-none border border-teal-400/30 scale-100">
        <div className="flex justify-between items-center border-b border-white/15 pb-1 text-[8px] font-black">
          <span className="flex items-center gap-0.5">📍 {cityName || 'الإسكندرية'}</span>
          <span className="text-teal-100">{toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
        </div>
        <div className="py-1.5 text-right space-y-0.5">
          <span className="text-[6.5px] font-bold text-teal-100/70 block leading-none">الصلاة القادمة</span>
          <h3 className="text-[11px] font-black text-white flex justify-between items-center leading-none">
            <span>صلاة {getArabicNameLocal(next)}</span>
            <span className="text-[12px] font-black font-mono text-amber-300" dir="ltr">{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}</span>
          </h3>
        </div>
        <div className="grid grid-cols-5 gap-0.5 text-center bg-black/15 rounded-lg p-0.5 border border-white/5 scale-90">
          {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
            const isActive = current === pName;
            const prayerTime = times[pName] || '٠٠:٠٠';
            return (
              <div key={pName} className={`p-0.5 rounded transition-all ${isActive ? 'bg-white/20 text-white font-extrabold' : ''}`}>
                <span className="text-[6px] block font-bold opacity-80 leading-none">{getArabicNameLocal(pName)}</span>
                <span className="text-[7px] block font-extrabold font-mono mt-0.5 leading-none">{toArabicNumbers(prayerTime)}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default TimelineGridTealWidgets;
