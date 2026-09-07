/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders } from 'lucide-react';
import { AppSettings } from '../../types';

export interface PrayerCalcMethodCardProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setLogSuccessMessage: (msg: string) => void;
}

export const PrayerCalcMethodCard: React.FC<PrayerCalcMethodCardProps> = ({
  settings,
  setSettings,
  setLogSuccessMessage,
}) => {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs space-y-4 text-end">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <div>
          <h4 className="text-sm font-black text-slate-800 dark:text-white">طريقة حساب المواقيت والمذهب الفقهي</h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold">تطبيق فوري على أوقات الفريضة الظاهرة أعلاه</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Calculation Method Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">طريقة حساب مواقيت الصلاة:</label>
          <select
            value={settings.calcMethod}
            onChange={(e) => {
              const val = e.target.value;
              setSettings(prev => ({ ...prev, calcMethod: val }));
              setLogSuccessMessage('تم تطبيق طريقة الحساب الجديدة وإعادة حساب المواقيت فورا.');
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
          >
            <option value="Egypt">الهيئة المصرية العامة للمساحة (مصر، السودان، الأردن)</option>
            <option value="UmmAlQura">جامعة أم القرى - مكة المكرمة (المملكة العربية السعودية)</option>
            <option value="MWL">رابطة العالم الإسلامي (أوروبا، أمريكا، بعض الدول العربية)</option>
            <option value="ISNA">الجمعية الإسلامية لأمريكا الشمالية - ISNA (الولايات المتحدة وكندا)</option>
            <option value="Karachi">جامعة العلوم الإسلامية بكراتشي (باكستان، الهند، بنغلاديش)</option>
            <option value="Gulf">دبي ومنطقة الخليج العربي (الإمارات العربية المتحدة، الخليج)</option>
          </select>
        </div>

        {/* Madhab Dropdown */}
        <div className="space-y-1.5">
          <label className="text-[10px] text-slate-450 dark:text-slate-500 font-black block">المذهب الفقهي لصلاة العصر:</label>
          <select
            value={settings.madhab}
            onChange={(e) => {
              const val = e.target.value as 'standard' | 'hanafi';
              setSettings(prev => ({ ...prev, madhab: val }));
              setLogSuccessMessage('تم تطبيق المذهب الجديد لصلاة العصر وإعادة حساب المواقيت فورا.');
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-2.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
          >
            <option value="standard">جمهور الفقهاء - الشافعي، المالكي، الحنبلي (يبدأ العصر بظل مثل واحد)</option>
            <option value="hanafi">المذهب الحنفي (يبدأ العصر بظل مثلين)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default PrayerCalcMethodCard;
