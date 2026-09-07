import React from 'react';
import { Calendar, Sparkles } from 'lucide-react';
import { AppSettings } from '../../types';
import { toArabicNumbers, getHijriDate } from '../../utils/hijri';

interface CalendarSettingsTabProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function CalendarSettingsTab({
  settings,
  setSettings,
}: CalendarSettingsTabProps) {
  const todayHijri = getHijriDate(new Date(), settings.hijriOffset);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-black text-slate-800 dark:text-white">ضبط وتعديل التقويم الهجري</h2>
      </div>

      {/* Premium Calligraphy Date Card */}
      <div className="bg-radial from-indigo-500 to-indigo-750 dark:from-indigo-900/60 dark:to-slate-900 text-white rounded-3xl p-6 text-center space-y-4 shadow-md border border-indigo-100/10 transition-colors">
        <Sparkles className="w-8 h-8 text-amber-300 mx-auto animate-pulse" />
        <div className="space-y-1">
          <span className="text-[10px] tracking-widest text-indigo-200 font-bold uppercase block">
            التاريخ الهجري لليوم
          </span>
          <h3 className="text-xl font-extrabold text-amber-200 tracking-wide font-sans">
            {todayHijri.fullString}
          </h3>
          <p className="text-[10px] text-indigo-100/80 font-medium leading-relaxed">
            يتم حساب اليوم استناداً لتقويم أم القرى / الحساب الفلكي القياسي، ويمكنك تعديله بحسب رؤية الهلال المحلية في بلدك:
          </p>
        </div>
      </div>

      {/* Hijri Adjustment Selector */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 dark:text-white">تعديل التاريخ الهجري (رؤية الهلال)</h3>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
          اختر الفارق بالأيام إذا ثبتت رؤية الهلال في بلدك بخلاف التحديد الفلكي:
        </p>

        <div className="grid grid-cols-5 gap-2 pt-1">
          {[-2, -1, 0, 1, 2].map((off) => (
            <button
              key={off}
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, hijriOffset: off }))}
              className={`py-3 rounded-2xl text-xs font-black transition-all cursor-pointer border ${
                settings.hijriOffset === off
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs scale-105'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              {off === 0 ? 'قياسي (٠)' : off > 0 ? `+${toArabicNumbers(off)} يوم` : `${toArabicNumbers(off)} يوم`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
