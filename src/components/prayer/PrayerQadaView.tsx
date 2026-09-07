import React from 'react';
import { Clock, RotateCcw, Check, Plus } from 'lucide-react';
import { PrayerName } from '../../types';
import { getArabicPrayerName } from '../../utils/prayerCalc';
import { toArabicNumbers, formatGregorianFullDateArabic } from '../../utils/hijri';
import { FIVE_DAILY_PRAYERS } from './prayerUtils';

interface PrayerQadaViewProps {
  totalQadaCount: number;
  handleAddFullDayQada: () => void;
  handleResetAllQada: () => void;
  qadaPace: number;
  setQadaPace: (pace: number) => void;
  qadaCounts: Record<PrayerName, number>;
  handlePerformQada: (prayer: PrayerName) => void;
  handleAddManualQada: (prayer: PrayerName) => void;
}

export const PrayerQadaView: React.FC<PrayerQadaViewProps> = ({
  totalQadaCount,
  handleAddFullDayQada,
  handleResetAllQada,
  qadaPace,
  setQadaPace,
  qadaCounts,
  handlePerformQada,
  handleAddManualQada,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Card */}
      <div className="bg-white dark:bg-[#161d26] p-5 rounded-3xl border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 space-y-3.5 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800 dark:text-white">جدول قضاء الصلوات الفائتة</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              قال النبي ﷺ: «مَنْ نَسِيَ صَلَاةً أَوْ نَامَ عَنْهَا فَكَفَّارَتُهَا أَنْ يُصَلِّيَهَا إِذَا ذَكَرَهَا» [متفق عليه].
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block">مجموع الصلوات الفائتة:</span>
            <span className="text-xl font-black text-rose-500 dark:text-rose-400">
              {toArabicNumbers(totalQadaCount)} صلاة
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddFullDayQada}
              className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[11px] rounded-xl cursor-pointer transition-colors"
            >
              + إضافة يوم كامل
            </button>
            {totalQadaCount > 0 && (
              <button
                type="button"
                onClick={handleResetAllQada}
                aria-label="تصفير وإعادة تعيين جميع الصلوات الفائتة"
                className="p-2 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/10 rounded-xl cursor-pointer transition-colors"
                title="تصفير الصلوات"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Qada Projection Card */}
      {totalQadaCount > 0 && (() => {
        const daysNeeded = Math.ceil(totalQadaCount / qadaPace);
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysNeeded);
        const formattedTargetDate = formatGregorianFullDateArabic(targetDate);

        return (
          <div className="p-4 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-amber-500/20 dark:border-amber-500/30 rounded-3xl space-y-3 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                <div className="text-end">
                  <h4 className="text-xs font-black text-slate-800 dark:text-white">خطة قضاء الفوائت الحية</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">توقع موعد إتمام كافة الفوائت حسب معدل إنجازك اليومي</p>
                </div>
              </div>
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3 py-1 rounded-xl border border-emerald-500/30">
                إتمام متوقع: {formattedTargetDate}
              </span>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold block text-end">اختر معدل القضاء اليومي:</span>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setQadaPace(1)}
                  className={`py-2 rounded-xl border transition-all cursor-pointer ${
                    qadaPace === 1
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  صلاة يومياً (١)
                </button>
                <button
                  type="button"
                  onClick={() => setQadaPace(5)}
                  className={`py-2 rounded-xl border transition-all cursor-pointer ${
                    qadaPace === 5
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  مع كل فريضة (٥)
                </button>
                <button
                  type="button"
                  onClick={() => setQadaPace(10)}
                  className={`py-2 rounded-xl border transition-all cursor-pointer ${
                    qadaPace === 10
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  صلاتان مع الفريضة (١٠)
                </button>
              </div>
            </div>

            <p className="text-[10px] font-extrabold text-amber-900 dark:text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-center">
              ✨ بمعدل {toArabicNumbers(qadaPace)} صلاة يومياً، ستنهي قضاء جميع الفوائت ({toArabicNumbers(totalQadaCount)} صلاة) خلال {toArabicNumbers(daysNeeded)} يوماً بإذن الله تعالى.
            </p>
          </div>
        );
      })()}

      {/* Missed Counter Cards */}
      <div className="space-y-4">
        {FIVE_DAILY_PRAYERS.map((prayer) => {
          const count = qadaCounts[prayer];

          return (
            <div 
              key={prayer}
              className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0]/80 dark:border-slate-800/80 transition-colors duration-300 shadow-xs flex justify-between items-center"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                  صلاة {getArabicPrayerName(prayer)} الفائتة
                </h4>
                <span className="text-xs text-slate-400 font-medium">العدد المتبقي في ذمتك</span>
              </div>

              <div className="flex items-center gap-4">
                {/* Count display */}
                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-[#111720]/50 border border-slate-100 dark:border-slate-800/40 flex items-center justify-center font-black text-lg text-slate-800 dark:text-white font-mono">
                  {toArabicNumbers(count)}
                </div>

                {/* Increment / Decrement buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePerformQada(prayer)}
                    disabled={count <= 0}
                    className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-40 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تم القضاء</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddManualQada(prayer)}
                    aria-label={`إضافة صلاة ${getArabicPrayerName(prayer)} فائتة إلى السجل`}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl cursor-pointer transition-colors"
                    title="أضف صلاة فائتة"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Spiritual Encouragement */}
      <div className="p-4 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-3xl border border-emerald-500/10 dark:border-emerald-500/20 text-center text-xs font-semibold text-emerald-800 dark:text-emerald-400 leading-relaxed">
        🌿 "أحب الأعمال إلى الله أدومها وإن قل"، واصل قضاء صلواتك الفائتة بانتظام، صلاةً بصلاة مع كل فريضة يومية، وبإذن الله تبرأ ذمتك وتطمئن روحك.
      </div>
    </div>
  );
};
