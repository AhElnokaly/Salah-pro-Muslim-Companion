import React from 'react';

export type ClockFaceType = 'classic' | 'islamic' | 'minimal' | 'cyber' | 'salatuk';

interface CardAnalogClockProps {
  clockFace: ClockFaceType;
  now: Date;
  currentStyle: string;
  dayNameArabic: string;
  toArabicNumbers: (n: number | string) => string;
}

export const CardAnalogClock: React.FC<CardAnalogClockProps> = ({
  clockFace,
  now,
  currentStyle,
  dayNameArabic,
  toArabicNumbers,
}) => {
  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours();

  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = (hr % 12) * 30 + min * 0.5;

  if (clockFace === 'classic') {
    const isFaithBright = currentStyle === 'faith-bright';
    return (
      <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-lg ${
        isFaithBright 
          ? 'bg-[#fdfbf7] border-amber-500 shadow-amber-100/50' 
          : 'bg-slate-950 border-amber-400 shadow-black/60'
      }`}>
        {/* Numbers */}
        <span className={`absolute top-1 text-[9px] font-black font-mono ${isFaithBright ? 'text-amber-800' : 'text-amber-300'}`}>١٢</span>
        <span className={`absolute end-1 text-[9px] font-black font-mono ${isFaithBright ? 'text-amber-800' : 'text-amber-300'}`}>٣</span>
        <span className={`absolute bottom-1 text-[9px] font-black font-mono ${isFaithBright ? 'text-amber-800' : 'text-amber-300'}`}>٦</span>
        <span className={`absolute start-1 text-[9px] font-black font-mono ${isFaithBright ? 'text-amber-800' : 'text-amber-300'}`}>٩</span>
        
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
          {/* 12 dial tick marks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const isQuarter = i % 3 === 0;
            return (
              <line
                key={i}
                x1="50"
                y1={isQuarter ? "6" : "8"}
                x2="50"
                y2="12"
                stroke={isQuarter ? (isFaithBright ? '#b45309' : '#f59e0b') : (isFaithBright ? '#fef3c7' : '#78350f')}
                strokeWidth={isQuarter ? "2" : "1"}
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}
          {/* Hands */}
          <line x1="50" y1="50" x2="50" y2="28" stroke={isFaithBright ? '#78350f' : '#f59e0b'} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="18" stroke={isFaithBright ? '#1e293b' : '#cbd5e1'} strokeWidth="2.5" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="12" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
          <circle cx="50" cy="50" r="3.5" fill={isFaithBright ? '#78350f' : '#f59e0b'} />
          <circle cx="50" cy="50" r="1.5" fill="#fff" />
        </svg>
      </div>
    );
  }

  if (clockFace === 'islamic') {
    const isFaithBright = currentStyle === 'faith-bright';
    return (
      <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-lg overflow-hidden ${
        isFaithBright 
          ? 'bg-[#fdfbf2] border-emerald-600 shadow-emerald-100/50' 
          : 'bg-emerald-950/80 border-emerald-500 shadow-black/50'
      }`}>
        {/* Islamic Star watermark in background */}
        <div className="absolute inset-0 opacity-[0.12] flex items-center justify-center pointer-events-none">
          <svg className="w-4/5 h-4/5" viewBox="0 0 100 100" fill="none" stroke={isFaithBright ? '#047857' : '#10b981'} strokeWidth="0.75">
            <polygon points="50,10 78,22 90,50 78,78 50,90 22,78 10,50 22,22" />
            <polygon points="50,10 90,50 50,90 10,50" />
            <circle cx="50" cy="50" r="30" />
          </svg>
        </div>
        
        <span className={`absolute top-1 text-[9px] font-black ${isFaithBright ? 'text-emerald-900' : 'text-emerald-300'}`}>١٢</span>
        <span className={`absolute end-1 text-[9px] font-black ${isFaithBright ? 'text-emerald-900' : 'text-emerald-300'}`}>٣</span>
        <span className={`absolute bottom-1 text-[9px] font-black ${isFaithBright ? 'text-emerald-900' : 'text-emerald-300'}`}>٦</span>
        <span className={`absolute start-1 text-[9px] font-black ${isFaithBright ? 'text-emerald-900' : 'text-emerald-300'}`}>٩</span>
        
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
          {/* 12 Islamic dots or tiny stars as ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const isQuarter = i % 3 === 0;
            return (
              <circle
                key={i}
                cx="50"
                cy={isQuarter ? "9" : "10"}
                r={isQuarter ? "1.8" : "1"}
                fill={isQuarter ? '#d4af37' : (isFaithBright ? '#10b981' : '#047857')}
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}
          {/* Calligraphic styled hands */}
          <line x1="50" y1="50" x2="50" y2="30" stroke={isFaithBright ? '#064e3b' : '#34d399'} strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="18" stroke={isFaithBright ? '#047857' : '#10b981'} strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="12" stroke="#d4af37" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
          {/* Beautiful center dome node */}
          <circle cx="50" cy="50" r="4.5" fill="#d4af37" />
          <circle cx="50" cy="50" r="2.5" fill={isFaithBright ? '#064e3b' : '#047857'} />
        </svg>
      </div>
    );
  }

  if (clockFace === 'minimal') {
    const isFaithBright = currentStyle === 'faith-bright';
    return (
      <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border transition-all duration-300 flex items-center justify-center shadow-md ${
        isFaithBright 
          ? 'bg-white/40 border-slate-200/80 shadow-slate-100/30' 
          : 'bg-black/30 border-white/10 shadow-black/30'
      }`}>
        {/* Subtle central minute circle */}
        <div className="absolute w-12 h-12 rounded-full border border-dashed border-white/5 opacity-40" />
        
        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
          {/* Ultra minimal hour lines */}
          {[0, 90, 180, 270].map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="6"
              x2="50"
              y2="11"
              stroke={isFaithBright ? '#64748b' : '#cbd5e1'}
              strokeWidth="2.2"
              strokeLinecap="round"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          {/* Other 8 dots */}
          {[30, 60, 120, 150, 210, 240, 300, 330].map((angle) => (
            <circle
              key={angle}
              cx="50"
              cy="8"
              r="1"
              fill={isFaithBright ? '#94a3b8' : '#64748b'}
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          
          {/* Modern thin needle hands */}
          <line x1="50" y1="50" x2="50" y2="31" stroke={isFaithBright ? '#1e293b' : '#f8fafc'} strokeWidth="2" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="17" stroke={isFaithBright ? '#475569' : '#94a3b8'} strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
          <circle cx="50" cy="12" r="2.2" fill="#8b5cf6" transform={`rotate(${secDeg} 50 50)`} />
          <circle cx="50" cy="50" r="2.5" fill="#8b5cf6" />
        </svg>
      </div>
    );
  }

  if (clockFace === 'salatuk') {
    const isFaithBright = currentStyle === 'faith-bright';
    const padVal = (n: number) => n.toString().padStart(2, '0');
    return (
      <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-lg overflow-hidden ${
        isFaithBright 
          ? 'bg-[#edf2f7] border-blue-600 shadow-blue-100/40' 
          : 'bg-[#0b1724] border-[#1b2f44] shadow-black/60'
      }`}>
        {/* Numbers */}
        <span className={`absolute top-1 text-[9px] font-black font-sans ${isFaithBright ? 'text-blue-900' : 'text-white/40'}`}>١٢</span>
        <span className={`absolute end-1 text-[9px] font-black font-sans ${isFaithBright ? 'text-blue-900' : 'text-white/40'}`}>٣</span>
        <span className={`absolute bottom-1 text-[9px] font-black font-sans ${isFaithBright ? 'text-blue-900' : 'text-white/40'}`}>٦</span>
        <span className={`absolute start-1 text-[9px] font-black font-sans ${isFaithBright ? 'text-blue-900' : 'text-white/40'}`}>٩</span>
        
        {/* Center Digital Clock Readout & Calligraphic Arabic Day Name */}
        <div className="absolute top-1/2 -translate-y-1/2 text-center select-none pointer-events-none">
          <span className={`text-[9px] font-black font-mono tracking-tight block pt-4.5 ${isFaithBright ? 'text-blue-800' : 'text-sky-400'}`}>
            {toArabicNumbers(padVal(hr % 12 || 12))}:{toArabicNumbers(padVal(min))}
          </span>
          <span className="text-[7.5px] font-black text-amber-500/95 leading-none block mt-0.5 font-sans">
            {dayNameArabic}
          </span>
        </div>

        <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
          {/* 12 Salatuk clean dial ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const isQuarter = i % 3 === 0;
            return (
              <line
                key={i}
                x1="50"
                y1={isQuarter ? "6" : "8"}
                x2="50"
                y2="12"
                stroke={isQuarter ? (isFaithBright ? '#1e3a8a' : '#38bdf8') : (isFaithBright ? '#cbd5e1' : '#1e293b')}
                strokeWidth={isQuarter ? "2" : "1"}
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}
          {/* Premium Salatuk white & red needle hands */}
          <line x1="50" y1="50" x2="50" y2="30" stroke={isFaithBright ? '#1e3a8a' : '#ffffff'} strokeWidth="3.2" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="18" stroke={isFaithBright ? '#3b82f6' : '#ffffff'} strokeWidth="2.2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
          <line x1="50" y1="50" x2="50" y2="12" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
          <circle cx="50" cy="50" r="3.5" fill="#ef4444" />
          <circle cx="50" cy="50" r="1.5" fill="#fff" />
        </svg>
      </div>
    );
  }

  // Cyber clock face (default fallback)
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-cyan-500 bg-slate-950 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)] overflow-hidden">
      {/* Holographic scanner active line */}
      <div className="absolute inset-x-0 h-[1px] bg-cyan-400/30 animate-pulse top-1/2" />
      
      {/* Background Digital HUD readout */}
      <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-20">
        <span className="text-xs sm:text-sm font-black font-mono text-cyan-400 tracking-wider">
          {toArabicNumbers(pad(hr % 12 || 12))}:{toArabicNumbers(pad(min))}
        </span>
      </div>

      <svg className="w-full h-full absolute inset-0" viewBox="0 0 100 100">
        {/* Circular HUD segments */}
        <circle cx="50" cy="50" r="45" stroke="#0891b2" strokeWidth="0.5" strokeDasharray="5,15" fill="none" className="animate-spin-slow opacity-30" />
        <circle cx="50" cy="50" r="41" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="30,10" fill="none" className="animate-spin-reverse opacity-25" />
        
        {/* Hour markers as glowing ticks */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30;
          const isQuarter = i % 3 === 0;
          return (
            <line
              key={i}
              x1="50"
              y1={isQuarter ? "5" : "7"}
              x2="50"
              y2="10"
              stroke={isQuarter ? '#22d3ee' : '#0891b2'}
              strokeWidth={isQuarter ? "2" : "1"}
              transform={`rotate(${angle} 50 50)`}
            />
          );
        })}
        
        {/* Cyberpunk Laser hands with drop shadows/glows */}
        <line x1="50" y1="50" x2="50" y2="28" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" transform={`rotate(${hrDeg} 50 50)`} />
        <line x1="50" y1="50" x2="50" y2="15" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" transform={`rotate(${minDeg} 50 50)`} />
        <line x1="50" y1="50" x2="50" y2="10" stroke="#f43f5e" strokeWidth="0.75" strokeLinecap="round" transform={`rotate(${secDeg} 50 50)`} />
        
        {/* Glowing central node */}
        <circle cx="50" cy="50" r="3.5" fill="#22d3ee" className="animate-pulse" />
        <circle cx="50" cy="50" r="1.5" fill="#f43f5e" />
      </svg>
    </div>
  );
};
