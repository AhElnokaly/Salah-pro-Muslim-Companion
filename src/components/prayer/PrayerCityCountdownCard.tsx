/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { ClockFace } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';
import { PrayerAnalogClock } from './PrayerAnalogClock';

export interface PrayerCityCountdownCardProps {
  currentTime: Date;
  activeHijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  cityName?: string;
  clockFace: ClockFace;
  setClockFace: (face: ClockFace) => void;
  arabicNextName: string;
  countdownStr: string;
  nextPrayerTimeStr: string;
}

export const PrayerCityCountdownCard: React.FC<PrayerCityCountdownCardProps> = ({
  currentTime,
  activeHijri,
  cityName,
  clockFace,
  setClockFace,
  arabicNextName,
  countdownStr,
  nextPrayerTimeStr,
}) => {
  return (
    <div className="flex flex-col items-center bg-white dark:bg-[#161d26] rounded-3xl p-4 sm:p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs space-y-3">
      {/* City & Date Info */}
      <div className="text-center space-y-0.5">
        <div className="flex items-center justify-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
            {cityName || 'سان ستيفانو'}
          </span>
        </div>
        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold">
          {currentTime.toLocaleDateString('ar-EG', { weekday: 'long' })}، {toArabicNumbers(activeHijri.day)} {activeHijri.monthName} {toArabicNumbers(activeHijri.year)} هـ - {toArabicNumbers(currentTime.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }))}
        </p>
      </div>

      {/* Ticking Analog Clock & Face Picker */}
      <PrayerAnalogClock 
        currentTime={currentTime}
        clockFace={clockFace}
        setClockFace={setClockFace}
      />

      {/* Countdown Ticker Card */}
      <div className="w-full bg-slate-50/50 dark:bg-[#111720]/30 border border-slate-100 dark:border-slate-800/40 rounded-2xl p-2.5 text-center space-y-1">
        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black">
          الوقت المتبقي لـ {arabicNextName}
        </span>
        <div className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-widest" dir="ltr">
          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0 animate-pulse" />
          <span>{countdownStr}</span>
        </div>
        <p className="text-[9px] text-slate-400 font-bold">
          الأذان القادم في تمام الساعة {toArabicNumbers(nextPrayerTimeStr)}
        </p>
      </div>
    </div>
  );
};

export default PrayerCityCountdownCard;
