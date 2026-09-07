/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PrayerTimes } from '../../types';

export interface ExtraSpecialtyWidgetsProps {
  wType: 'analog' | 'compact' | 'dhikr' | 'qibla' | 'calendar';
  themeClass: string;
  cityName?: string;
  dayNameArabic: string;
  currentDayDigit: number;
  currentMonthName: string;
  currentYear: number;
  current: string;
  next: string;
  times: Record<string, string> | PrayerTimes;
  timeRemainingStr: string;
  gregorianClean: string;
  subhaCount: number;
  setSubhaCount: React.Dispatch<React.SetStateAction<number>>;
  hrDeg: number;
  minDeg: number;
  secDeg: number;
  toArabicNumbers: (val: string | number) => string;
  getArabicNameLocal: (p: string) => string;
  getFormattedTimeRemaining: (tStr: string) => string;
}

export const ExtraSpecialtyWidgets: React.FC<ExtraSpecialtyWidgetsProps> = ({
  wType,
  themeClass,
  cityName,
  dayNameArabic,
  currentDayDigit,
  currentMonthName,
  currentYear,
  current,
  next,
  times,
  timeRemainingStr,
  gregorianClean,
  subhaCount,
  setSubhaCount,
  hrDeg,
  minDeg,
  secDeg,
  toArabicNumbers,
  getArabicNameLocal,
  getFormattedTimeRemaining,
}) => {
  const dhikrSample = "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ";

  if (wType === 'analog') {
    return (
      <div className={`w-full rounded-xl p-3 flex items-center justify-center gap-3 border select-none ${themeClass}`}>
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
          <span className="text-[7.5px] font-black text-amber-400 block uppercase leading-none">صلاة {getArabicNameLocal(next)}</span>
          <div className="flex items-center gap-1">
            <span className="text-[8px] font-bold text-white/70">متبقي للأذان:</span>
            <span className="text-[10px] font-black text-amber-300 font-mono leading-none">
              {getFormattedTimeRemaining(timeRemainingStr)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (wType === 'compact') {
    return (
      <div className="w-full bg-[#eeeeee] dark:bg-[#1a242d] text-slate-800 dark:text-white rounded-full py-2 px-4 flex items-center justify-between shadow-sm border border-slate-200 dark:border-white/5 select-none">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9.5px] font-extrabold font-sans">
            {getArabicNameLocal(current)} -{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
          </span>
        </div>
        <span className="text-[7.5px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5 leading-none">
          📍 {cityName || 'الإسكندرية'}
        </span>
      </div>
    );
  }

  if (wType === 'dhikr') {
    return (
      <div className={`w-full rounded-xl p-3 flex flex-col justify-between border select-none ${themeClass}`}>
        <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[8px] font-black">
          <span className="text-amber-400 flex items-center gap-1">✨ ذكر اليوم البركة</span>
          <span className="text-white/60">{dayNameArabic}</span>
        </div>
        <div className="py-2 text-center space-y-1.5">
          <p className="text-[10px] font-black leading-relaxed text-amber-100 font-serif">
            «{dhikrSample}»
          </p>
          <div className="flex justify-center items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSubhaCount(c => c + 1)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9px] px-3 py-1 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1"
            >
              <span>📿 تسبيحة</span>
              <span className="bg-slate-950/20 text-slate-950 px-1.5 py-0.2 rounded-full font-mono">{toArabicNumbers(subhaCount)}</span>
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center border-t border-white/5 pt-1 text-[7px] text-white/40 font-bold">
          <span>الصلاة القادمة: {getArabicNameLocal(next)}</span>
          <span>📍 {cityName || 'مكة المكرمة'}</span>
        </div>
      </div>
    );
  }

  if (wType === 'qibla') {
    return (
      <div className={`w-full rounded-xl p-3 flex items-center justify-between border select-none ${themeClass}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-full bg-[#0d1622] flex flex-col items-center justify-center text-center relative">
              <span className="text-[12px] leading-none">🕌</span>
              <span className="text-[6px] font-black text-amber-400 font-mono mt-0.5">١٣٦°</span>
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <span className="text-[7px] font-black text-amber-400 block uppercase">بوصلة القبلة المباشرة</span>
            <h4 className="text-[10px] font-black text-white">الكعبة المشرفة (جنوب شرق)</h4>
            <span className="text-[7.5px] font-bold text-white/50 block">موقعك الحالي: {cityName || 'الإسكندرية'}</span>
          </div>
        </div>
        <div className="text-end bg-black/20 px-2 py-1 rounded-lg border border-white/5">
          <span className="text-[6px] font-bold text-white/40 block">الأذان القادم</span>
          <span className="text-[9px] font-black text-amber-400 font-mono">{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}</span>
        </div>
      </div>
    );
  }

  if (wType === 'calendar') {
    return (
      <div className={`w-full rounded-xl p-3 flex flex-col justify-between border select-none ${themeClass}`}>
        <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex flex-col items-center justify-center font-sans shadow-xs">
              <span className="text-[12px] font-black leading-none">{toArabicNumbers(currentDayDigit)}</span>
              <span className="text-[6px] font-bold leading-none">{currentMonthName}</span>
            </div>
            <div className="text-right">
              <span className="text-[9.5px] font-black block text-white">{dayNameArabic}</span>
              <span className="text-[7px] font-extrabold text-amber-300 block">{toArabicNumbers(currentYear)} هجرية</span>
            </div>
          </div>
          <div className="text-end bg-white/10 px-2 py-1 rounded-lg border border-white/10">
            <span className="text-[6.5px] font-bold text-emerald-200 block">حالة اليوم</span>
            <span className="text-[8px] font-black text-white">مستحب الصيام 🌙</span>
          </div>
        </div>
        <div className="py-1.5 flex justify-between items-center text-[7.5px] font-bold text-white/80 border-t border-b border-white/5 my-1">
          <span>الظهر {toArabicNumbers(times.Dhuhr || '١٢:١٥')}</span>
          <span>العصر {toArabicNumbers(times.Asr || '١٥:٤٥')}</span>
          <span className="text-amber-300 font-black">المغرب {toArabicNumbers(times.Maghrib || '١٩:٠٢')}</span>
          <span>العشاء {toArabicNumbers(times.Isha || '٢٠:٣٥')}</span>
        </div>
        <div className="flex justify-between items-center text-[7px] text-white/40 font-bold">
          <span>📍 {cityName || 'مصر'}</span>
          <span>{toArabicNumbers(gregorianClean)}</span>
        </div>
      </div>
    );
  }

  return null;
};

export default ExtraSpecialtyWidgets;
