import React from 'react';
import { CardBlockSize, CardBlockAccent } from '../../../types';

interface ClockBlockProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  showAnalogClock: boolean;
  setShowAnalogClock: (show: boolean) => void;
  renderCardAnalogClock: () => React.ReactNode;
  now: Date;
  toArabicNumbers: (str: string | number) => string;
  clockFace: 'classic' | 'islamic' | 'minimal' | 'cyber' | 'salatuk';
  setClockFace: (face: 'classic' | 'islamic' | 'minimal' | 'cyber' | 'salatuk') => void;
}

const ClockBlock: React.FC<ClockBlockProps> = ({
  size = 'large',
  showAnalogClock,
  setShowAnalogClock,
  renderCardAnalogClock,
  now,
  toArabicNumbers,
  clockFace,
  setClockFace
}) => {
  let hrs = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, '0');
  hrs = hrs % 12 || 12;
  const periodStr = now.getHours() >= 12 ? 'م' : 'ص';

  const digitalTextSize = {
    compact: 'text-3xl sm:text-4xl',
    normal: 'text-4xl sm:text-5xl',
    large: 'text-4xl sm:text-5xl'
  }[size];

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-1.5 w-full my-1">
      {showAnalogClock ? (
        <div className="flex flex-col items-center gap-1.5 py-0.5 transition-all duration-500 scale-90 sm:scale-95">
          {renderCardAnalogClock()}
        </div>
      ) : (
        /* Giant Digital Current Time Clock */
        <div className="flex items-baseline gap-1 select-all py-0.5 justify-center">
          <span className={`${digitalTextSize} font-black font-mono tracking-tight text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.35)]`}>
            {`${toArabicNumbers(hrs.toString())}:${toArabicNumbers(mins)}`}
          </span>
          <span className="text-[9px] font-black text-amber-300 bg-black/20 px-1.5 py-0.5 rounded-md border border-white/5">
            {periodStr}
          </span>
        </div>
      )}

      {/* Segmented Clock Mode Button underneath */}
      <button
        type="button"
        onClick={() => setShowAnalogClock(!showAnalogClock)}
        className="text-[9px] font-black text-white/50 hover:text-amber-300 transition-all cursor-pointer bg-white/5 px-2 py-0.5 rounded-md border border-white/5 active:scale-95"
      >
        {showAnalogClock ? 'عرض الساعة الرقمية 🕒' : 'عرض ساعة العقارب 🕰️'}
      </button>

      {/* Analog Clock Face Options Selector */}
      {showAnalogClock && (
        <div className="flex items-center justify-center gap-1 z-10 w-full animate-fade-in mt-1 scale-90">
          <div className="flex bg-black/20 p-0.5 rounded-lg border border-white/5 shadow-inner">
            {(['classic', 'islamic', 'minimal', 'cyber', 'salatuk'] as const).map(face => (
              <button
                key={face}
                type="button"
                onClick={() => setClockFace(face)}
                className={`px-1.5 py-0.5 rounded text-[7.5px] font-black cursor-pointer transition-all ${
                  clockFace === face
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {face === 'classic' ? 'كلاسيك' : face === 'islamic' ? 'إسلامي' : face === 'minimal' ? 'بسيط' : face === 'cyber' ? 'سايبر' : 'صلاتك'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClockBlock;
