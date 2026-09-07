/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { PrayerKey } from '../../utils/adhkarCalc';

export interface PrayerAdhkarBannerProps {
  activePrayerKey: PrayerKey;
  onStartPrayerAdhkar: () => void;
}

export const PrayerAdhkarBanner: React.FC<PrayerAdhkarBannerProps> = ({
  activePrayerKey,
  onStartPrayerAdhkar,
}) => {
  return (
    <div className="p-4 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl shadow-md border border-indigo-700/50 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-300/30 text-xl">
          ✨
        </div>
        <div>
          <span className="text-[11px] font-bold text-amber-300 block mb-0.5">المرشد الإيماني للوقت الحالي:</span>
          <h4 className="text-sm font-black">
            {activePrayerKey === 'fajr' && 'قد حان وقت أذكار صلاة الفجر المكتوبة وأذكار الصباح 🌅'}
            {activePrayerKey === 'dhuhr' && 'قد حان وقت أذكار صلاة الظهر المكتوبة ☀️'}
            {activePrayerKey === 'asr' && 'قد حان وقت أذكار صلاة العصر وأذكار المساء 🌆'}
            {activePrayerKey === 'maghrib' && 'قد حان وقت أذكار صلاة المغرب المكتوبة 🌅'}
            {activePrayerKey === 'isha' && 'قد حان وقت أذكار صلاة العشاء المكتوبة 🌌'}
          </h4>
        </div>
      </div>

      <button
        type="button"
        onClick={onStartPrayerAdhkar}
        className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
      >
        <span>ابدأ ورد الصلاة الحالي الآن</span>
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PrayerAdhkarBanner;
