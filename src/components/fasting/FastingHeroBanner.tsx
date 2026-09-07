/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Moon } from 'lucide-react';
import { RamadanQadaTracker } from '../../types';
import { toArabicNumbers, HijriDateInfo } from '../../utils/hijri';

interface FastingHeroBannerProps {
  hijriToday: HijriDateInfo;
  totalFastedDays: number;
  sunnahFasted: number;
  qadaFasted: number;
  ramadanQada: RamadanQadaTracker;
  setRamadanQada: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
}

export default function FastingHeroBanner({
  hijriToday,
  totalFastedDays,
  sunnahFasted,
  qadaFasted,
  ramadanQada,
  setRamadanQada
}: FastingHeroBannerProps) {
  const daysOwed = ramadanQada?.daysOwed ?? 0;
  const daysCompleted = ramadanQada?.daysCompleted ?? 0;
  const remainingOwed = Math.max(0, daysOwed - daysCompleted);
  const progressPercent = daysOwed > 0 ? (daysCompleted / daysOwed) * 100 : 0;

  const handleEditDaysOwed = () => {
    const val = prompt('كم عدد الأيام المطلوبة منك لقضائها؟', daysOwed.toString());
    if (val !== null) {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        setRamadanQada(prev => ({ ...prev, daysOwed: parsed }));
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-5 border border-indigo-500/20 shadow-xl relative overflow-hidden">
      {/* Dynamic stars backdrop */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
      
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[10px] text-indigo-300 font-bold tracking-widest block uppercase">سجل الصيام المبارك</span>
            <h2 className="text-xl font-black flex items-center gap-2">
              <Moon className="w-5 h-5 text-amber-300 animate-pulse" />
              تتبع وقضاء الصيام
            </h2>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10">
            {hijriToday.day} {hijriToday.monthName} {hijriToday.year} هـ
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-center pt-2">
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/5">
            <span className="text-[10px] text-indigo-200 block font-semibold">إجمالي الأيام</span>
            <span className="text-lg font-black text-amber-300 font-mono block mt-0.5">{toArabicNumbers(totalFastedDays)}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/5">
            <span className="text-[10px] text-indigo-200 block font-semibold">صيام النوافل</span>
            <span className="text-lg font-black text-amber-300 font-mono block mt-0.5">{toArabicNumbers(sunnahFasted)}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/5">
            <span className="text-[10px] text-indigo-200 block font-semibold">القضاء المنجز</span>
            <span className="text-lg font-black text-emerald-400 font-mono block mt-0.5">{toArabicNumbers(qadaFasted)}</span>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-2xl p-2.5 border border-white/5">
            <span className="text-[10px] text-indigo-200 block font-semibold">المتبقي عليا</span>
            <span className="text-lg font-black text-rose-400 font-mono block mt-0.5">
              {toArabicNumbers(remainingOwed)}
            </span>
          </div>
        </div>

        {/* Ramadan Qada Progress Slider */}
        <div className="bg-black/30 rounded-2xl p-3.5 border border-white/5 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-extrabold text-indigo-200">تقدم قضاء أيام رمضان الفائتة:</span>
            <span className="font-mono font-black text-amber-300">
              {toArabicNumbers(daysCompleted)} / {toArabicNumbers(daysOwed)} أيام
            </span>
          </div>
          
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-2 pt-1 justify-between">
            <span className="text-[10px] text-white/50">تحتاج لتعديل الأيام المطلوبة منك؟</span>
            <button
              type="button"
              onClick={handleEditDaysOwed}
              className="text-[10px] text-amber-300 hover:underline font-bold cursor-pointer"
            >
              تعديل الأيام المطلوبة ⚙️
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
