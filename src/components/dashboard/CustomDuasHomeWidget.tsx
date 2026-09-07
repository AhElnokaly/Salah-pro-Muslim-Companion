import React, { useState } from 'react';
import { Sparkles, ChevronLeft } from 'lucide-react';
import { CustomDua } from '../../types';

interface CustomDuasHomeWidgetProps {
  customDuas: CustomDua[];
  toArabicNumbers: (n: number | string) => string;
}

export const CustomDuasHomeWidget: React.FC<CustomDuasHomeWidgetProps> = ({
  customDuas,
  toArabicNumbers,
}) => {
  const [homeDuaIdx, setHomeDuaIdx] = useState(0);

  const homeDuas = customDuas.filter(d => d.showOnHome);
  if (homeDuas.length === 0) return null;

  // Ensure index is valid in case list shrunk
  const activeIdx = homeDuaIdx >= homeDuas.length ? 0 : homeDuaIdx;
  const activeDua = homeDuas[activeIdx];
  if (!activeDua) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-5 border border-indigo-900/30 space-y-4 shadow-lg relative overflow-hidden transition-all duration-300">
      {/* Background design accents */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none flex justify-center items-center">
        <span className="text-[140px] font-black">🤍</span>
      </div>
      
      <div className="flex justify-between items-center relative z-10">
        <h3 className="text-xs font-black flex items-center gap-1.5 text-indigo-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          أدعيتك المخصصة اليومية
        </h3>
        <span className="text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 px-2 py-0.5 rounded-full font-bold">
          {toArabicNumbers(homeDuas.length)} {homeDuas.length === 1 ? 'دعاء' : 'أدعية'}
        </span>
      </div>

      {/* Content card */}
      <div className="relative z-10 space-y-4">
        <p className="text-sm font-semibold leading-relaxed text-right text-indigo-50/90 whitespace-pre-line font-sans" dir="rtl">
          {activeDua.text}
        </p>
        
        {homeDuas.length > 1 && (
          <div className="flex justify-between items-center pt-2.5 border-t border-indigo-900/40">
            {/* Indicators */}
            <div className="flex gap-1">
              {homeDuas.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    idx === activeIdx ? 'w-4 bg-amber-400' : 'w-1.5 bg-indigo-950'
                  }`}
                />
              ))}
            </div>
            
            {/* Navigation Arrow buttons */}
            <div className="flex gap-1.5" dir="ltr">
              <button
                type="button"
                onClick={() => setHomeDuaIdx(prev => (prev - 1 + homeDuas.length) % homeDuas.length)}
                aria-label="عرض الدعاء السابق"
                className="w-7 h-7 rounded-lg bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-200 hover:text-white flex items-center justify-center border border-indigo-900/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => setHomeDuaIdx(prev => (prev + 1) % homeDuas.length)}
                aria-label="عرض الدعاء التالي"
                className="w-7 h-7 rounded-lg bg-indigo-950/40 hover:bg-indigo-950/80 text-indigo-200 hover:text-white flex items-center justify-center border border-indigo-900/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
