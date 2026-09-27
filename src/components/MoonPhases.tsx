/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Moon, Star, Sparkles, BookOpen } from 'lucide-react';
import { LUNAR_MANSIONS, getMoonPhaseDetails } from './moon/lunarMansionsData';
import MoonHeroVisual from './moon/MoonHeroVisual';
import MoonQuickStats from './moon/MoonQuickStats';
import MoonSubTabs from './moon/MoonSubTabs';

export { LUNAR_MANSIONS };
export type { LunarMansion } from './moon/lunarMansionsData';

interface MoonPhasesProps {
  now?: Date;
  hijriDay?: number;
  hijriMonthName?: string;
  hijriYear?: number;
  cityName?: string;
  toArabicNumbers: (val: string | number) => string;
  onNavigateTab?: (tab: string) => void;
}

export const MoonPhases: React.FC<MoonPhasesProps> = ({
  now = new Date(),
  hijriDay = 14,
  hijriMonthName = 'شوال',
  hijriYear = 1447,
  cityName = 'الإسكندرية',
  toArabicNumbers,
  onNavigateTab
}) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'mansions' | 'islamic' | 'phenomena'>('overview');

  // Simulated Hijri calculation for offset
  let targetHijriDay = ((hijriDay + selectedDayOffset - 1) % 30);
  if (targetHijriDay <= 0) targetHijriDay += 30;

  const currentPhase = getMoonPhaseDetails(targetHijriDay);
  const currentMansionIndex = Math.min(27, Math.max(0, targetHijriDay - 1));
  const currentMansion = LUNAR_MANSIONS[currentMansionIndex];

  // Distance estimate simulated ~384,400 km
  const estimatedDistance = (363300 + Math.sin(targetHijriDay * 0.2) * 21000).toFixed(0);

  // Check if Ayyam al-Beed
  const isAyyamBeed = targetHijriDay >= 13 && targetHijriDay <= 15;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-slate-100 bg-[#090d16] p-3 sm:p-6 rounded-3xl border border-indigo-950/80 shadow-2xl transition-colors">
      
      {/* TOP HERO CANVAS: Realistic Animated 3D Moon Canvas */}
      <MoonHeroVisual
        hijriMonthName={hijriMonthName}
        hijriYear={hijriYear}
        cityName={cityName}
        targetHijriDay={targetHijriDay}
        currentPhase={currentPhase}
        isAyyamBeed={isAyyamBeed}
        selectedDayOffset={selectedDayOffset}
        setSelectedDayOffset={setSelectedDayOffset}
        toArabicNumbers={toArabicNumbers}
      />

      {/* QUICK STATS CARDS */}
      <MoonQuickStats
        currentMansion={currentMansion}
        currentMansionIndex={currentMansionIndex}
        isAyyamBeed={isAyyamBeed}
        targetHijriDay={targetHijriDay}
        estimatedDistance={estimatedDistance}
        toArabicNumbers={toArabicNumbers}
      />

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>الأطوار والتحليل</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mansions')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'mansions'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>منازل القمر الـ ٢٨</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('islamic')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'islamic'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>الشعائر والعبادات القمريّة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('phenomena')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'phenomena'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>الظواهر والتراث العربي</span>
        </button>
      </div>

      {/* SUBTABS CONTENT */}
      <MoonSubTabs
        activeSubTab={activeSubTab}
        currentPhase={currentPhase}
        targetHijriDay={targetHijriDay}
        currentMansion={currentMansion}
        toArabicNumbers={toArabicNumbers}
        onNavigateTab={onNavigateTab}
      />

    </div>
  );
};

export default MoonPhases;
