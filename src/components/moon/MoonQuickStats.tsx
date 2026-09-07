/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Star, Sparkles, Compass, Eye } from 'lucide-react';
import { LunarMansion } from './lunarMansionsData';

interface MoonQuickStatsProps {
  currentMansion: LunarMansion;
  currentMansionIndex: number;
  isAyyamBeed: boolean;
  targetHijriDay: number;
  estimatedDistance: string;
  toArabicNumbers: (val: string | number) => string;
}

export default function MoonQuickStats({
  currentMansion,
  currentMansionIndex,
  isAyyamBeed,
  targetHijriDay,
  estimatedDistance,
  toArabicNumbers
}: MoonQuickStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Card 1: Current Mansion */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
        <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-amber-400" />
          <span>المنزلة القمرية ({toArabicNumbers(currentMansionIndex + 1)}/٢٨)</span>
        </span>
        <p className="text-sm font-black text-amber-300">{currentMansion.name}</p>
        <span className="text-[10px] text-slate-400 font-bold block truncate">{currentMansion.stars}</span>
      </div>

      {/* Card 2: Ayyam al-Beed Status */}
      <div className={`border rounded-2xl p-3.5 space-y-1 ${
        isAyyamBeed 
          ? 'bg-amber-950/40 border-amber-500/50 text-amber-100' 
          : 'bg-slate-900/90 border-slate-800 text-slate-300'
      }`}>
        <span className="text-[10px] font-bold block flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>أيام البيض (١٣-١٤-١٥)</span>
        </span>
        <p className="text-sm font-black text-amber-300">
          {isAyyamBeed ? '🌕 أيام البيض الآن!' : `متبقي ${toArabicNumbers(Math.max(1, 13 - targetHijriDay))} يوم`}
        </p>
        <span className="text-[10px] opacity-80 block">
          {isAyyamBeed ? 'يستحب الصيام اليوم' : 'استعد لصيام منتصف الشهر'}
        </span>
      </div>

      {/* Card 3: Distance */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
        <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>المسافة عن الأرض</span>
        </span>
        <p className="text-sm font-black text-white font-mono">{toArabicNumbers(estimatedDistance)} كم</p>
        <span className="text-[10px] text-slate-400 block font-bold">متوسط ٣٨٤,٤٠٠ كم</span>
      </div>

      {/* Card 4: Hilal Sighting */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
        <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>إمكانية الرؤية بالعين</span>
        </span>
        <p className="text-sm font-black text-emerald-400">
          {targetHijriDay <= 2 ? 'ممكنة بالأجهزة' : targetHijriDay >= 28 ? 'صعبة في الفجر' : 'واضحة ممتازة'}
        </p>
        <span className="text-[10px] text-slate-400 block font-bold">زاوية الرصد مناسبة</span>
      </div>
    </div>
  );
}
