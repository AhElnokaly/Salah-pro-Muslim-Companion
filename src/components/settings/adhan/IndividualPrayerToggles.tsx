import React from 'react';
import { AppSettings, PrayerName } from '../../../types';
import ToggleSwitch from '../../ui/ToggleSwitch';

interface IndividualPrayerTogglesProps {
  settings: AppSettings;
  onToggleAdhan: (prayer: PrayerName) => void;
}

const PRAYERS_LIST: { id: PrayerName; label: string }[] = [
  { id: 'Fajr', label: 'صلاة الفجر والصبح' },
  { id: 'Sunrise', label: 'تنبيه شروق الشمس' },
  { id: 'Dhuhr', label: 'صلاة الظهر وعصر الجمعة' },
  { id: 'Asr', label: 'صلاة العصر والوسطى' },
  { id: 'Maghrib', label: 'صلاة المغرب والغروب' },
  { id: 'Isha', label: 'صلاة العشاء والقيام' },
];

export const IndividualPrayerToggles: React.FC<IndividualPrayerTogglesProps> = ({
  settings,
  onToggleAdhan,
}) => {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
      <h3 className="text-sm font-black text-slate-800 dark:text-white">تفعيل صوت التنبيه للصلوات الفردية</h3>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
        يمكنك كتم الأذان لبعض الفرائض وتشغيلها لفرائض أخرى (مثال: تشغيله للفجر والمغرب فقط).
      </p>

      <div className="space-y-3 pt-2">
        {PRAYERS_LIST.map(({ id, label }) => {
          const isEnabled = settings.adhanEnabled[id];
          return (
            <div
              key={id}
              className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/40 gap-3"
            >
              <span className="text-xs font-black text-slate-700 dark:text-slate-250">{label}</span>
              <ToggleSwitch
                checked={isEnabled}
                onChange={() => onToggleAdhan(id)}
                activeColor="bg-emerald-500"
                size="sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
