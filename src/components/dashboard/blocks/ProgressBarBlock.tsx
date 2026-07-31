import React from 'react';
import { CardBlockSize, CardBlockAccent, PrayerName } from '../../../types';

interface ProgressBarBlockProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  current: PrayerName;
  next: PrayerName;
  now: Date;
  getArabicPrayerName: (prayer: PrayerName, date?: Date) => string;
  toArabicNumbers: (str: string | number) => string;
  getPrayerProgressPercentage: () => number;
}

const ProgressBarBlock: React.FC<ProgressBarBlockProps> = ({
  current,
  next,
  now,
  getArabicPrayerName,
  toArabicNumbers,
  getPrayerProgressPercentage
}) => {
  const progressPct = getPrayerProgressPercentage();

  return (
    <div className="w-full space-y-1.5 my-1">
      <div className="flex justify-between items-center text-[9.5px] text-white/75 font-bold px-1">
        <div className="flex items-center gap-1">
          <span className="text-white/50">الحالية:</span>
          <span className="text-emerald-300 font-extrabold">{getArabicPrayerName(current, now)}</span>
        </div>
        <span className="text-amber-300 font-black bg-white/10 px-1 py-0.5 rounded-md text-[8.5px]">
          {toArabicNumbers(Math.round(progressPct))}%
        </span>
        <div className="flex items-center gap-1">
          <span className="text-white/50">التالية:</span>
          <span className="text-amber-200 font-extrabold">{getArabicPrayerName(next, now)}</span>
        </div>
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden relative border border-white/5 shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBarBlock;
