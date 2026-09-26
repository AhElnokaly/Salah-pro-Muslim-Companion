/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CardBlockSize, CardBlockAccent, PrayerName, PrayerTimes } from '../../../types';

interface NextPrayerBlockProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  next?: PrayerName;
  times?: PrayerTimes;
  now?: Date;
  getArabicPrayerName?: (prayer: PrayerName, date?: Date) => string;
  toArabicNumbers?: (str: string | number) => string;
  timeRemainingStr?: string;
}

const NextPrayerBlock: React.FC<NextPrayerBlockProps> = ({
  size = 'normal',
  next = 'Dhuhr',
  times,
  now = new Date(),
  getArabicPrayerName = (p: PrayerName, _d?: Date) => p,
  toArabicNumbers = (n) => String(n),
  timeRemainingStr = '',
}) => {
  const prayerTime = times ? (times as any)[next] : '';
  const arabicName = getArabicPrayerName(next as PrayerName, now);

  return (
    <div
      role="region"
      aria-label="معلومات الصلاة القادمة والوقت المتبقي"
      className="flex flex-col items-center justify-center text-center space-y-1 w-full my-1"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-white/70">الصلاة القادمة:</span>
        <span className="text-sm font-black text-amber-300 drop-shadow-xs">
          {arabicName}
        </span>
        {prayerTime && (
          <span className="text-xs font-mono font-bold bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
            {toArabicNumbers(prayerTime)}
          </span>
        )}
      </div>

      {timeRemainingStr && (
        <div
          role="timer"
          aria-live="polite"
          className="text-xs xs:text-sm font-black text-emerald-300 drop-shadow-xs flex items-center gap-1.5"
        >
          <span className="text-white/60 text-[11px] font-bold">متبقي:</span>
          <span>{toArabicNumbers(timeRemainingStr)}</span>
        </div>
      )}
    </div>
  );
};

export default NextPrayerBlock;
