import React from 'react';
import { Calendar } from 'lucide-react';
import { CardBlockSize, CardBlockAccent } from '../../../types';

interface DateHeaderBlockProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  hijri: { day: number; month: number; year: number; fullString: string };
  gregorianClean: string;
  dayNameArabic: string;
  setActiveTab?: (tab: string) => void;
  getMoonPhaseInfo: (day: number) => { name: string; icon: string; illumination: number };
  toArabicNumbers: (str: string | number) => string;
}

const DateHeaderBlock: React.FC<DateHeaderBlockProps> = ({
  size = 'normal',
  hijri,
  gregorianClean,
  dayNameArabic,
  setActiveTab,
  getMoonPhaseInfo,
  toArabicNumbers
}) => {
  const moonInfo = getMoonPhaseInfo(hijri.day);

  const sizeClasses = {
    compact: 'text-[10px] sm:text-[11px] px-2.5 py-1',
    normal: 'text-[11px] sm:text-xs px-3 sm:px-4 py-1.5',
    large: 'text-xs sm:text-sm px-4 sm:px-5 py-2'
  }[size];

  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 z-10 w-full border-b border-white/10 pb-2.5">
      <div className={`flex items-center justify-center gap-2 sm:gap-3 bg-black/20 rounded-full border border-white/10 text-white shadow-xs max-w-full overflow-x-auto whitespace-nowrap scrollbar-none ${sizeClasses}`}>
        {/* Clickable Hijri Date */}
        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('calendar')}
          className="flex items-center gap-1.5 font-extrabold text-white hover:text-amber-300 transition-colors cursor-pointer shrink-0 group"
          title="اضغط لعرض التقويم الهجري والميلادي وتعديل الأيام"
        >
          <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0 group-hover:scale-110 transition-transform" />
          <span className="leading-none drop-shadow-xs">{hijri.fullString}</span>
        </button>

        {/* Clickable Sleek Moon Phase Circle */}
        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('moon')}
          className="w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-full bg-amber-400/25 hover:bg-amber-400/45 border border-amber-300/40 hover:border-amber-300 flex items-center justify-center text-xs sm:text-sm hover:scale-110 active:scale-95 transition-all cursor-pointer shadow-xs shrink-0 group"
          title={`طور القمر اليوم: ${moonInfo.name} (${toArabicNumbers(moonInfo.illumination)}% إضاءة) - اضغط لعرض صفحة أطوار القمر`}
        >
          <span className="leading-none group-hover:rotate-12 transition-transform filter drop-shadow-xs">{moonInfo.icon}</span>
        </button>

        {/* Clickable Gregorian Date & Day Name */}
        <button
          type="button"
          onClick={() => setActiveTab && setActiveTab('calendar')}
          className="flex items-center gap-1.5 font-bold text-white/90 hover:text-amber-200 transition-colors cursor-pointer shrink-0"
          title="اضغط لعرض التقويم الكامل"
        >
          <span className="font-black text-amber-200 leading-none">{dayNameArabic}</span>
          <span className="text-white/25 font-light">•</span>
          <span className="leading-none">{gregorianClean}</span>
        </button>
      </div>
    </div>
  );
};

export default DateHeaderBlock;
