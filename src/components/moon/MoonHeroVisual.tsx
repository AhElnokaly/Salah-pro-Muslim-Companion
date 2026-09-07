/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Moon, ChevronRight, ChevronLeft } from 'lucide-react';
import { MoonPhaseDetails } from './lunarMansionsData';

interface MoonHeroVisualProps {
  hijriMonthName: string;
  hijriYear: number;
  cityName: string;
  targetHijriDay: number;
  currentPhase: MoonPhaseDetails;
  isAyyamBeed: boolean;
  selectedDayOffset: number;
  setSelectedDayOffset: React.Dispatch<React.SetStateAction<number>>;
  toArabicNumbers: (val: string | number) => string;
}

export default function MoonHeroVisual({
  hijriMonthName,
  hijriYear,
  cityName,
  targetHijriDay,
  currentPhase,
  isAyyamBeed,
  selectedDayOffset,
  setSelectedDayOffset,
  toArabicNumbers
}: MoonHeroVisualProps) {
  return (
    <div 
      className="relative rounded-3xl overflow-hidden border border-indigo-500/20 shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[380px] bg-slate-950"
      style={{ background: 'radial-gradient(ellipse at top, #131b2e 0%, #090d16 60%, #030712 100%)' }}
    >
      {/* Ambient Twinkling Stars Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
      
      {/* Soft Moon Glow */}
      <div className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
        isAyyamBeed ? 'bg-amber-300' : 'bg-sky-400'
      }`} />

      {/* Top Header Badge */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 w-full border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2.5">
          <span className="p-2.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-amber-300 shrink-0">
            <Moon className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>أطوار ومنازل القمر</span>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                التقويم القمري
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {hijriMonthName} {toArabicNumbers(hijriYear)} هـ • {cityName}
            </p>
          </div>
        </div>

        <div className="text-start font-mono shrink-0">
          <span className="text-xs text-slate-400 block font-bold">اليوم الهجري</span>
          <span className="text-xl font-black text-amber-400">
            {toArabicNumbers(targetHijriDay)} {hijriMonthName}
          </span>
        </div>
      </div>

      {/* MAIN VISUAL MOON DISK */}
      <div className="relative z-10 my-4 flex flex-col items-center group cursor-pointer">
        {/* Outer Ring Atmosphere */}
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center p-2 bg-gradient-to-b from-white/10 to-transparent border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.15)] transition-transform duration-500 group-hover:scale-105">
          {/* The Spherical Moon Texture Surface */}
          <div className="w-full h-full rounded-full bg-[#111827] relative overflow-hidden shadow-inner border border-slate-700 flex items-center justify-center">
            {/* Moon Craters Simulation */}
            <div className="absolute w-8 h-8 rounded-full bg-slate-800/40 top-8 start-10 blur-[1px]" />
            <div className="absolute w-12 h-12 rounded-full bg-slate-800/30 bottom-10 end-8 blur-[1px]" />
            <div className="absolute w-6 h-6 rounded-full bg-slate-800/50 top-20 end-14 blur-[1px]" />
            <div className="absolute w-10 h-10 rounded-full bg-slate-800/25 bottom-12 start-12 blur-[1px]" />

            {/* Illuminated Phase Overlay Gradient */}
            <div 
              className="absolute inset-0 rounded-full transition-all duration-700 bg-gradient-to-r from-amber-100 via-sky-100 to-white opacity-90 shadow-[0_0_30px_rgba(255,255,255,0.8)]"
              style={{
                clipPath: currentPhase.illumination >= 98 
                  ? 'inset(0 0 0 0)' 
                  : currentPhase.illumination <= 5 
                  ? 'inset(0 100% 0 0)' 
                  : `polygon(0 0, ${currentPhase.illumination}% 0, ${currentPhase.illumination}% 100%, 0 100%)`
              }}
            />

            {/* Moon Emoji Icon Representation overlay */}
            <span className="relative z-10 text-7xl select-none filter drop-shadow-md opacity-30">
              {currentPhase.icon}
            </span>
          </div>
        </div>

        {/* Current Phase Title */}
        <div className="mt-4 text-center space-y-2 px-2">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none drop-shadow-xs">
              {currentPhase.name}
            </h1>
            <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-md dir-ltr shadow-xs">
              {currentPhase.enName}
            </span>
            {isAyyamBeed && (
              <span className="text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full shadow-xs">
                ✨ أيام البيض
              </span>
            )}
          </div>
          <p className="text-xs text-amber-300 font-bold max-w-md mx-auto">
            نسبة الإضاءة: %{toArabicNumbers(currentPhase.illumination)} • عمر القمر: {toArabicNumbers(currentPhase.age)} يوم
          </p>
        </div>
      </div>

      {/* DAY SLIDER SELECTOR */}
      <div className="relative z-10 w-full max-w-md bg-slate-900/80 p-3 rounded-2xl border border-white/10 mt-2 space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
          <button
            type="button"
            onClick={() => setSelectedDayOffset(prev => prev - 1)}
            className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>اليوم السابق</span>
          </button>
          <span className="text-amber-400 font-mono text-xs">
            {selectedDayOffset === 0 ? 'اليوم الحقيقي' : `تصفح (${selectedDayOffset > 0 ? '+' : ''}${toArabicNumbers(selectedDayOffset)} يوم)`}
          </span>
          <button
            type="button"
            onClick={() => setSelectedDayOffset(prev => prev + 1)}
            className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <span>اليوم التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
        <input 
          type="range"
          min="-15"
          max="15"
          value={selectedDayOffset}
          onChange={(e) => setSelectedDayOffset(Number(e.target.value))}
          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
        />
      </div>

      {/* Quick Reset Button if Offset */}
      {selectedDayOffset !== 0 && (
        <button
          type="button"
          onClick={() => setSelectedDayOffset(0)}
          className="relative z-10 mt-2 text-[10px] font-extrabold text-amber-300 hover:underline cursor-pointer"
        >
          العودة لليوم الحالي
        </button>
      )}
    </div>
  );
}
