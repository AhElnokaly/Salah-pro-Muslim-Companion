import React from 'react';
import { ClockFace } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';

interface PrayerAnalogClockProps {
  currentTime: Date;
  clockFace: ClockFace;
  setClockFace: (face: ClockFace) => void;
}

export const PrayerAnalogClock: React.FC<PrayerAnalogClockProps> = ({
  currentTime,
  clockFace,
  setClockFace,
}) => {
  const sec = currentTime.getSeconds();
  const min = currentTime.getMinutes();
  const hr = currentTime.getHours();

  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = (hr % 12) * 30 + min * 0.5;

  const renderClockDial = () => {
    if (clockFace === 'classic') {
      return (
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[3px] sm:border-4 border-amber-500/40 bg-[#111720] flex items-center justify-center shadow-md transition-colors">
          <span className="absolute top-1 sm:top-1.5 text-[8px] sm:text-[10px] font-black text-amber-500 font-mono">١٢</span>
          <span className="absolute end-2 sm:end-2.5 text-[8px] sm:text-[10px] font-black text-amber-500 font-mono">٣</span>
          <span className="absolute bottom-1 sm:bottom-1.5 text-[8px] sm:text-[10px] font-black text-amber-500 font-mono">٦</span>
          <span className="absolute start-2 sm:start-2.5 text-[8px] sm:text-[10px] font-black text-amber-500 font-mono">٩</span>
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            <line x1="50" y1="50" x2="50" y2="28" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="18" stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="12" stroke="#f97316" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
            <circle cx="50" cy="50" r="2.5" fill="#f59e0b" />
          </svg>
        </div>
      );
    }

    if (clockFace === 'islamic') {
      return (
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[3px] sm:border-4 border-emerald-600/40 bg-[#fbf8f3] flex items-center justify-center shadow-md overflow-hidden transition-colors">
          <div className="absolute inset-0 opacity-15 flex items-center justify-center">
            <svg className="w-4/5 h-4/5" viewBox="0 0 100 100" fill="none" stroke="#047857" strokeWidth="0.5">
              <circle cx="50" cy="50" r="40" />
              <polygon points="50,10 90,50 50,90 10,50" />
              <polygon points="50,10 78,78 10,50 78,22" />
              <polygon points="50,10 22,78 90,50 22,22" />
            </svg>
          </div>
          <span className="absolute top-1 sm:top-1.5 text-[8px] sm:text-[10px] font-black text-emerald-800">١٢</span>
          <span className="absolute end-2 sm:end-2.5 text-[8px] sm:text-[10px] font-black text-emerald-800">٣</span>
          <span className="absolute bottom-1 sm:bottom-1.5 text-[8px] sm:text-[10px] font-black text-emerald-800">٦</span>
          <span className="absolute start-2 sm:start-2.5 text-[8px] sm:text-[10px] font-black text-emerald-800">٩</span>
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            <line x1="50" y1="50" x2="50" y2="30" stroke="#047857" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="18" stroke="#10b981" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="12" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
            <circle cx="50" cy="50" r="3" fill="#047857" />
          </svg>
        </div>
      );
    }

    if (clockFace === 'minimal') {
      return (
        <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm transition-colors">
          <div className="absolute top-1 sm:top-1.5 w-0.5 sm:w-1 h-1.5 sm:h-2 bg-indigo-500 rounded" />
          <div className="absolute bottom-1 sm:bottom-1.5 w-0.5 sm:w-1 h-1.5 sm:h-2 bg-indigo-500 rounded" />
          <div className="absolute end-1 sm:end-1.5 h-0.5 sm:h-1 w-1.5 sm:w-2 bg-indigo-500 rounded" />
          <div className="absolute start-1 sm:start-1.5 h-0.5 sm:h-1 w-1.5 sm:w-2 bg-indigo-500 rounded" />
          
          <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
            <line x1="50" y1="50" x2="50" y2="32" stroke="currentColor" className="text-slate-800 dark:text-slate-100" strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="16" stroke="currentColor" className="text-slate-600 dark:text-slate-300" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
            <line x1="50" y1="50" x2="50" y2="10" stroke="#a855f7" strokeWidth="0.75" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
            <circle cx="50" cy="50" r="2" fill="#a855f7" />
          </svg>
        </div>
      );
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    return (
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[3px] sm:border-4 border-cyan-500/30 bg-slate-950 flex flex-col items-center justify-center shadow-md overflow-hidden transition-colors">
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-30">
          <span className="text-xs sm:text-sm font-black font-mono text-cyan-400 tracking-wider">
            {toArabicNumbers(pad(hr % 12 || 12))}:{toArabicNumbers(pad(min))}
          </span>
        </div>

        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
          <line x1="50" y1="50" x2="50" y2="28" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="15" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="10" stroke="#0891b2" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
          <circle cx="50" cy="50" r="2.5" fill="#22d3ee" />
        </svg>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-3 w-full">
      {/* Ticking Analog Clock */}
      <div className="relative py-1 flex justify-center">
        {renderClockDial()}
      </div>

      {/* Clock Face Customizer Buttons */}
      <div className="space-y-1 w-full">
        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-black text-end block">شكل وجه الساعة:</span>
        <div className="grid grid-cols-4 gap-1 w-full">
          {(
            [
              { id: 'classic', label: 'كلاسيكي داكن' },
              { id: 'islamic', label: 'زخرفة إسلامية' },
              { id: 'minimal', label: 'حديث بسيط' },
              { id: 'hybrid', label: 'هجين رقمي' },
            ] as { id: ClockFace; label: string }[]
          ).map((face) => (
            <button
              key={face.id}
              type="button"
              onClick={() => setClockFace(face.id)}
              className={`py-1 px-1 text-[9px] sm:text-[10px] font-black rounded-lg transition-all border cursor-pointer text-center truncate ${
                clockFace === face.id
                  ? 'bg-indigo-600 border-indigo-600 text-white font-black shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              {face.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
