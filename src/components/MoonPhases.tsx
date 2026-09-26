/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import MoonHeroVisual from './moon/MoonHeroVisual';
import { getMoonPhaseDetailsForDay } from './moon/lunarMansionsData';

export interface MoonPhasesProps {
  now: Date;
  hijriDay: number;
  hijriMonthName: string;
  hijriYear: number;
  cityName?: string;
  toArabicNumbers: (val: string | number) => string;
  onNavigateTab?: (tab: any) => void;
}

export default function MoonPhases({
  hijriDay,
  hijriMonthName,
  hijriYear,
  cityName = 'الإسكندرية',
  toArabicNumbers,
}: MoonPhasesProps) {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Target hijri day in 1..30 range
  const rawDay = hijriDay + selectedDayOffset;
  const targetHijriDay = Math.max(1, Math.min(30, rawDay));

  const currentPhase = getMoonPhaseDetailsForDay(targetHijriDay);
  const isAyyamBeed = targetHijriDay === 13 || targetHijriDay === 14 || targetHijriDay === 15;

  return (
    <div className="pb-16 space-y-5 animate-fade-in" dir="rtl">
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
    </div>
  );
}
