/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CardBlockSize, CardBlockAccent } from '../../../types';

interface DateHeaderBlockProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  hijri?: { day: number; month: number; year: number; monthName?: string; fullString: string };
  gregorianClean?: string;
  dayNameArabic?: string;
  onOpenHijriAdjust?: () => void;
  getMoonPhaseInfo?: (day: number) => { name: string; icon: string; illumination: number };
  toArabicNumbers?: (str: string | number) => string;
}

const DateHeaderBlock: React.FC<DateHeaderBlockProps> = ({
  size = 'normal',
  hijri,
  gregorianClean,
  dayNameArabic,
  onOpenHijriAdjust,
  getMoonPhaseInfo,
  toArabicNumbers = (n) => String(n),
}) => {
  const moonInfo = hijri && getMoonPhaseInfo ? getMoonPhaseInfo(hijri.day) : null;

  return (
    <div className="w-full flex items-center justify-between text-white/90 text-xs font-bold px-1 my-0.5 select-none">
      {/* Day Name and Gregorian */}
      <div className="flex items-center gap-1.5">
        {dayNameArabic && (
          <span className="font-black text-amber-300 drop-shadow-xs">
            {dayNameArabic}
          </span>
        )}
        {gregorianClean && (
          <span className="text-white/60 text-[10px] font-medium hidden xs:inline">
            ({toArabicNumbers(gregorianClean)})
          </span>
        )}
      </div>

      {/* Hijri Date with Moon Phase & Click to Adjust */}
      {hijri && (
        <button
          type="button"
          onClick={onOpenHijriAdjust}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 active:scale-95 px-2 py-0.5 rounded-full border border-white/15 transition-all cursor-pointer text-[10px] font-extrabold text-amber-200"
          title="انقر لتعديل التاريخ الهجري 📅"
          aria-label={`التاريخ الهجري: ${hijri.fullString}. انقر لتصحيح التاريخ`}
        >
          {moonInfo && <span className="text-xs">{moonInfo.icon}</span>}
          <span>{toArabicNumbers(hijri.fullString)}</span>
          <span className="text-[8px] text-amber-400/80">✎</span>
        </button>
      )}
    </div>
  );
};

export default DateHeaderBlock;
