import React from 'react';
import { Clock } from 'lucide-react';
import { CardBlockSize, CardBlockAccent, PrayerName, PrayerTimes } from '../../../types';

interface NextPrayerBlockProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  next: PrayerName;
  now: Date;
  times: PrayerTimes;
  getArabicPrayerName: (prayer: PrayerName, date?: Date) => string;
  toArabicNumbers: (str: string | number) => string;
  timeRemainingStr: string;
}

const NextPrayerBlock: React.FC<NextPrayerBlockProps> = ({
  size = 'normal',
  next,
  now,
  times,
  getArabicPrayerName,
  toArabicNumbers,
  timeRemainingStr
}) => {
  const paddingClasses = {
    compact: 'p-2 gap-0.5',
    normal: 'p-2.5 gap-1',
    large: 'p-3 gap-1.5'
  }[size];

  const arabicNextName = getArabicPrayerName(next, now);
  const arabicTime = toArabicNumbers(times[next]);
  const arabicRemaining = toArabicNumbers(timeRemainingStr);

  return (
    <div 
      role="timer"
      aria-live="polite"
      aria-label={`الصلاة القادمة: صلاة ${arabicNextName} عند الساعة ${arabicTime}، الوقت المتبقي ${arabicRemaining}`}
      className={`bg-black/20 border border-white/10 rounded-2xl ${paddingClasses} flex flex-col items-center md:items-start shadow-md w-full hover:border-white/20 transition-all duration-300 my-1`}
    >
      <div className="flex items-center gap-1.5 justify-center md:justify-start w-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" aria-hidden="true" />
        <span className="text-white/80 text-[9.5px] font-extrabold tracking-wider">الصلاة القادمة</span>
        <span className="text-amber-300 text-xs font-black">
          {arabicNextName}
        </span>
        <span className="text-[9.5px] text-white/75 font-mono">({arabicTime})</span>
      </div>
      
      <div className="text-[11px] font-black text-white flex items-center gap-1 border-t border-white/15 pt-1.5 w-full justify-center md:justify-start">
        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" aria-hidden="true" />
        <span>متبقي {arabicRemaining}</span>
      </div>
    </div>
  );
};

export default NextPrayerBlock;
