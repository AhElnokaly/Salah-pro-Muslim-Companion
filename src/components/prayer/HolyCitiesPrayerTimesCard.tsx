/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Compass, MapPin } from 'lucide-react';
import { PrayerName } from '../../types';
import { calculatePrayerTimes, getArabicPrayerName } from '../../utils/prayerCalc';
import { toArabicNumbers } from '../../utils/hijri';
import { getExactCountdown } from './prayerUtils';

export interface HolyCitiesPrayerTimesCardProps {
  activeTargetDate: Date;
  currentTime: Date;
  calcMethod: string;
  madhab: 'standard' | 'hanafi';
}

const HOLY_CITIES = [
  { id: 'makkah', arabicName: 'مكة المكرمة', country: 'السعودية', lat: 21.4225, lng: 39.8262, desc: 'المسجد الحرام، كعبة المسلمين' },
  { id: 'medina', arabicName: 'المدينة المنورة', country: 'السعودية', lat: 24.4673, lng: 39.6112, desc: 'المسجد النبوي الشريف' },
  { id: 'quds', arabicName: 'القدس الشريف', country: 'فلسطين', lat: 31.7683, lng: 35.2137, desc: 'المسجد الأقصى المبارك' },
  { id: 'cairo', arabicName: 'القاهرة', country: 'مصر', lat: 30.0444, lng: 31.2357, desc: 'جامع الأزهر الشريف' },
];

export const HolyCitiesPrayerTimesCard: React.FC<HolyCitiesPrayerTimesCardProps> = ({
  activeTargetDate,
  currentTime,
  calcMethod,
  madhab,
}) => {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl border border-[#e2e8f0]/80 dark:border-slate-800/80 shadow-xs p-5 transition-all duration-300 space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <Compass className="w-5 h-5 text-indigo-500 animate-spin-slow" />
        <div className="text-end">
          <h4 className="text-sm font-black text-slate-800 dark:text-white">مواقيت الحرمين الشريفين والمسجد الأقصى</h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">مواقيت الصلاة والعد التنازلي المباشر لأقدس بقاع الأرض</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {HOLY_CITIES.map((city) => {
          const cityTimes = calculatePrayerTimes(
            activeTargetDate,
            city.lat,
            city.lng,
            3, // UTC+3 as default approximation for these holy areas
            calcMethod,
            madhab,
            {}
          );
          const countdownInfo = getExactCountdown(cityTimes, currentTime);

          return (
            <div key={city.id} className="bg-slate-50/50 dark:bg-slate-900/10 rounded-2xl p-3 border border-slate-100/50 dark:border-slate-800/40 space-y-2 text-end">
              <div className="flex justify-between items-start gap-1">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-black text-slate-800 dark:text-white">{city.arabicName}</span>
                    <span className="text-[8px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 py-0.5 px-1.5 rounded-md font-bold">{city.country}</span>
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none">{city.desc}</p>
                </div>
                <div className="text-start leading-tight shrink-0">
                  <span className="text-[8px] text-slate-400 font-bold block">القادم: {countdownInfo.arabicNextName}</span>
                  <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">+ {countdownInfo.countdownStr}</span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-slate-100/50 dark:border-slate-800/30 text-center">
                {[
                  { key: 'Fajr', label: 'الفجر' },
                  { key: 'Dhuhr', label: getArabicPrayerName('Dhuhr', currentTime) },
                  { key: 'Asr', label: 'العصر' },
                  { key: 'Maghrib', label: 'المغرب' },
                  { key: 'Isha', label: 'العشاء' }
                ].map((p) => (
                  <div key={p.key} className="bg-white dark:bg-slate-950/20 rounded-lg py-1 border border-slate-100/30">
                    <span className="text-[8px] text-slate-400 block font-bold">{p.label}</span>
                    <span className="text-[9px] text-slate-700 dark:text-slate-300 font-mono font-black">{toArabicNumbers(cityTimes[p.key as PrayerName] || '')}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HolyCitiesPrayerTimesCard;
