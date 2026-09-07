import React from 'react';
import { Sliders } from 'lucide-react';
import { AppSettings, PrayerName } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';

interface PrayerSettingsTabProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function PrayerSettingsTab({
  settings,
  setSettings,
}: PrayerSettingsTabProps) {
  // Individual manual prayer offsets updater
  const handleUpdateOffset = (prayer: PrayerName | 'Sunrise', amount: number) => {
    const currentOffsets = settings.prayerOffsets || {
      Fajr: 0,
      Sunrise: 0,
      Dhuhr: 0,
      Asr: 0,
      Maghrib: 0,
      Isha: 0,
    };
    const updatedOffsets = {
      ...currentOffsets,
      [prayer]: (currentOffsets[prayer as PrayerName] || 0) + amount,
    };
    setSettings((prev) => ({
      ...prev,
      prayerOffsets: updatedOffsets,
    }));
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-black text-slate-800 dark:text-white">إعدادات الصلاة والمذهب</h2>
      </div>

      {/* Calc Method and Madhab Cards */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-5 transition-colors duration-300 shadow-sm">
        
        {/* Calculation Method Selection */}
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">
            طريقة الحساب الرياضي للمواقيت
          </label>
          <select
            value={settings.calcMethod}
            onChange={(e) => setSettings((prev) => ({ ...prev, calcMethod: e.target.value }))}
            className="w-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0]/85 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-2xl px-4 py-3 text-xs font-bold outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="Egypt">الهيئة المصرية العامة للمساحة</option>
            <option value="UmmAlQura">جامعة أم القرى (مكة المكرمة)</option>
            <option value="MWL">رابطة العالم الإسلامي</option>
            <option value="ISNA">الجمعية الإسلامية لأمريكا الشمالية (ISNA)</option>
            <option value="Karachi">جامعة العلوم الإسلامية بكراتشي</option>
            <option value="Tehran">معهد الجيوفيزياء بجامعة طهران</option>
            <option value="Gulf">منطقة الخليج العربي</option>
          </select>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            تغيير طريقة الحساب يؤثر على أوقات الفجر والظهر والعشاء تلقائياً بناءً على الموقع.
          </p>
        </div>

        {/* Asr Madhab Selection */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">مذهب صلاة العصر</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'standard', title: 'الجمهور', desc: 'الشافعي، المالكي، الحنبلي' },
              { id: 'hanafi', title: 'المذهب الحنفي', desc: 'عند مثل الظل الثاني للشيء' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, madhab: item.id as AppSettings['madhab'] }))}
                className={`p-3.5 rounded-2xl border text-end transition-all cursor-pointer flex flex-col justify-between ${
                  settings.madhab === item.id
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/25 text-indigo-700 dark:text-indigo-350'
                    : 'border-[#e2e8f0] dark:border-slate-800 bg-slate-50/55 dark:bg-[#111720] text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-xs font-black">{item.title}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Gender Selection Section */}
        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/50">
          <label className="text-xs font-black text-slate-500 dark:text-slate-400 block">
            جنس ومستند المستخدم (لحساب الرخصة والعذر الشرعي)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'male' as const, title: 'ذكر 👨', desc: 'الحساب العادي للفرائض والسنن' },
              { id: 'female' as const, title: 'أنثى 👩', desc: 'يتيح تسجيل الأعذار الشرعية (الرخص)' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, gender: item.id }))}
                className={`p-3.5 rounded-2xl border text-end transition-all cursor-pointer flex flex-col justify-between ${
                  (settings.gender || 'male') === item.id
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/25 text-indigo-700 dark:text-indigo-350 font-black'
                    : 'border-[#e2e8f0] dark:border-slate-800 bg-slate-50/55 dark:bg-[#111720] text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="text-xs font-black">{item.title}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">{item.desc}</span>
              </button>
            ))}
          </div>

          {settings.gender === 'female' && (
            <div className="p-3 bg-indigo-500/10 dark:bg-indigo-400/5 border border-indigo-500/20 rounded-2xl text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed font-semibold mt-2 animate-fade-in text-end">
              ✨ <strong>رخصة العذر الشرعي مفعلة:</strong> لقد تم تفعيل وضع المرأة المسلمة. يتيح لكِ التطبيق الآن تسجيل صلواتكِ كـ «عذر شرعي رخصة» في لوحة التحكم أثناء أيام عذركِ الشرعي. لن تؤثر هذه الأيام بالسلب على نسب إتمام العبادات أو تهدم تتابع السلاسل الإيمانية الخاص بكِ تيسيراً ورفقاً بكِ 🤍.
            </div>
          )}
        </div>
      </div>

      {/* Manual Prayer Offsets Adjust */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">التعديل اليدوي للمواقيت (بالدقائق)</h3>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
          إذا لاحظت اختلافاً بسيطاً عن التوقيت المحلي لمدينتك، يمكنك زيادة الدقائق أو إنقاصها لكل صلاة بشكل مستقل ليتطابق تماماً.
        </p>

        <div className="space-y-3 pt-2">
          {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as (PrayerName | 'Sunrise')[]).map((prayer) => {
            const arabicName =
              prayer === 'Fajr'
                ? 'الفجر'
                : prayer === 'Sunrise'
                ? 'الشروق'
                : prayer === 'Dhuhr'
                ? 'الظهر'
                : prayer === 'Asr'
                ? 'العصر'
                : prayer === 'Maghrib'
                ? 'المغرب'
                : 'العشاء';

            const val = (settings.prayerOffsets && settings.prayerOffsets[prayer as PrayerName]) || 0;

            return (
              <div
                key={prayer}
                className="flex items-center justify-between p-3 bg-slate-50/60 dark:bg-[#111720]/75 rounded-2xl border border-slate-100 dark:border-slate-800/40"
              >
                <span className="text-xs font-black text-slate-700 dark:text-slate-250">{arabicName}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleUpdateOffset(prayer, -1)}
                    aria-label={`إنقاص دقيقة من توقيت صلاة ${arabicName}`}
                    className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer transition-all"
                  >
                    -
                  </button>
                  <span
                    className={`text-xs font-black min-w-10 text-center ${
                      val > 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : val < 0
                        ? 'text-rose-500'
                        : 'text-slate-500'
                    }`}
                  >
                    {val > 0 ? `+${toArabicNumbers(val)}` : val === 0 ? '٠' : toArabicNumbers(val)} د
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateOffset(prayer, 1)}
                    aria-label={`زيادة دقيقة إلى توقيت صلاة ${arabicName}`}
                    className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-sm flex items-center justify-center cursor-pointer transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
