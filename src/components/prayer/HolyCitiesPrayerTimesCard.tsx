/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { calculatePrayerTimes } from '../../utils/prayerCalc';
import { toArabicNumbers } from '../../utils/hijri';

export interface HolyCitiesPrayerTimesCardProps {
  activeTargetDate: Date;
  currentTime: Date;
  calcMethod?: string;
  madhab?: string;
}

interface HolyCity {
  id: string;
  name: string;
  icon: string;
  lat: number;
  lng: number;
  tzOffset: number;
  desc: string;
}

const HOLY_CITIES: HolyCity[] = [
  {
    id: 'makkah',
    name: 'مكة المكرمة',
    icon: '🕋',
    lat: 21.4225,
    lng: 39.8262,
    tzOffset: 3,
    desc: 'المسجد الحرام والكعبة المشرفة',
  },
  {
    id: 'madinah',
    name: 'المدينة المنورة',
    icon: '🕌',
    lat: 24.4672,
    lng: 39.6111,
    tzOffset: 3,
    desc: 'المسجد النبوي الشريف',
  },
  {
    id: 'quds',
    name: 'القدس الشريف',
    icon: '✨',
    lat: 31.7767,
    lng: 35.2345,
    tzOffset: 3,
    desc: 'المسجد الأقصى المبارك',
  },
];

export const HolyCitiesPrayerTimesCard: React.FC<HolyCitiesPrayerTimesCardProps> = ({
  activeTargetDate,
  calcMethod = 'Makkah',
  madhab = 'standard',
}) => {
  const [selectedCityId, setSelectedCityId] = useState<string>('makkah');

  const selectedCity = HOLY_CITIES.find((c) => c.id === selectedCityId) || HOLY_CITIES[0];

  const cityTimes = calculatePrayerTimes(
    activeTargetDate,
    selectedCity.lat,
    selectedCity.lng,
    selectedCity.tzOffset,
    calcMethod,
    madhab as any
  );

  const prayers = [
    { key: 'Fajr', label: 'الفجر', time: cityTimes.Fajr },
    { key: 'Sunrise', label: 'الشروق', time: cityTimes.Sunrise },
    { key: 'Dhuhr', label: 'الظهر', time: cityTimes.Dhuhr },
    { key: 'Asr', label: 'العصر', time: cityTimes.Asr },
    { key: 'Maghrib', label: 'المغرب', time: cityTimes.Maghrib },
    { key: 'Isha', label: 'العشاء', time: cityTimes.Isha },
  ];

  return (
    <div className="bg-white/80 dark:bg-[#121922]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🕋</span>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
              مواقيت الحرمين الشريفين والقدس
            </h3>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
              {selectedCity.desc}
            </span>
          </div>
        </div>

        {/* City selector pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
          {HOLY_CITIES.map((city) => (
            <button
              key={city.id}
              type="button"
              onClick={() => setSelectedCityId(city.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedCityId === city.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {city.icon} {city.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {prayers.map((p) => (
          <div
            key={p.key}
            className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-750 flex flex-col items-center text-center gap-0.5"
          >
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
              {p.label}
            </span>
            <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-100">
              {toArabicNumbers(p.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolyCitiesPrayerTimesCard;
