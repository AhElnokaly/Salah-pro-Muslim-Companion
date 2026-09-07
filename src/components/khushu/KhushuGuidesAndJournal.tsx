/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, Calendar, Award, Zap } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';
import {
  QIYAM_PLANS,
  QIYAM_HADITHS,
  QiyamJournalEntry,
} from './khushuConstants';

interface KhushuGuidesAndJournalProps {
  onSelectPlan: (planTitle: string) => void;
  qiyamJournalHistory: QiyamJournalEntry[];
}

export const KhushuGuidesAndJournal: React.FC<KhushuGuidesAndJournalProps> = ({
  onSelectPlan,
  qiyamJournalHistory,
}) => {
  return (
    <>
      {/* 7. TAHAJJUD PLAN GENERATOR & ROUTINE SELECTOR */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              مولّد جدول وبرنامج التهجد حسب الوقت المتاح
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              اختر الوقت المتاح لديك ليعرض لك التطبيق برنامجاً عملياً متكاملاً
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {QIYAM_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 flex flex-col justify-between hover:border-purple-500/40 transition-all"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-black text-purple-900 dark:text-purple-300 block">
                  {plan.title}
                </span>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                  {plan.desc}
                </p>

                <div className="pt-2 space-y-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                  {plan.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span className="text-purple-600 dark:text-purple-400 font-mono">•</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectPlan(plan.title)}
                className="w-full mt-3 py-1.5 px-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-black transition-all cursor-pointer border border-purple-500/20 text-center active:scale-95"
              >
                اعتماد هذه الخطة ⚡
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 8. QIYAM JOURNAL HISTORY */}
      {qiyamJournalHistory.length > 0 && (
        <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">
                  سجل الخواطر والمناجاة في قيام الليل
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  مراجعة سجلك وخواطرك الإيمانية في الخلوات السابقة
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl">
              {toArabicNumbers(qiyamJournalHistory.length)} ليلة موثقة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {qiyamJournalHistory.slice(0, 6).map((entry, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">{toArabicNumbers(entry.date)}</span>
                  <span className="text-amber-500 font-black">{'⭐'.repeat(entry.rating)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span>قيام: {toArabicNumbers(entry.rakahs)} ركعة</span>
                  <span>وتر: {toArabicNumbers(entry.witrRakahs)} ركعة</span>
                </div>

                {entry.surahs && (
                  <p className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                    التلاوة: {entry.surahs}
                  </p>
                )}

                {entry.notes && (
                  <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                    «{entry.notes}»
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. QIYAM HADITHS & VIRTUES */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <Award className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              درر وفضائل قيام الليل من السنة النبوية
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              أحاديث نبوية شريفة تحث على قيام الليل وتبين منازله العالية
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {QIYAM_HADITHS.map((h) => (
            <div
              key={h.id}
              className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="inline-block text-[9.5px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-lg border border-amber-300/40">
                  {h.tag}
                </span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-relaxed font-serif">
                  {h.text}
                </p>
              </div>

              <span className="text-[9.5px] text-slate-400 font-bold block pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                المصدر: {h.source}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 10. QURAN VERSES TARGETS (10, 100, 1000 VERSES) */}
      <div className="bg-gradient-to-br from-[#111827] via-[#1a2234] to-[#251b3a] rounded-3xl p-5 text-white border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-black text-white">
              مراتب القائمين وورِد الآيات في الليل
            </h3>
            <p className="text-[10px] text-slate-300 font-semibold">
              مقترحات السور لتحقيق فضائل «القانتين» و«المقنطرين»
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <span className="text-xs font-black text-emerald-300 block">
              ١. ألا تُكتب من الغافلين (١٠ آيات)
            </span>
            <p className="text-[10.5px] text-slate-300 font-bold leading-normal">
              قراءة آية الكرسي + سورة الإخلاص والمعوذتين، أو سورة الفاتحة والكوثر والنصر.
            </p>
          </div>

          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <span className="text-xs font-black text-amber-300 block">
              ٢. أن تُكتب من القانتين (١٠٠ آية)
            </span>
            <p className="text-[10.5px] text-slate-300 font-bold leading-normal">
              قراءة سورة الملك (٣٠ آية) + سورة الواقعة (٩٦ آية) = ١٢٦ آية تكتب بها من القانتين!
            </p>
          </div>

          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <span className="text-xs font-black text-purple-300 block">
              ٣. أن تُكتب من المقنطرين (١٠٠٠ آية)
            </span>
            <p className="text-[10.5px] text-slate-300 font-bold leading-normal">
              قراءة جزء تبارك وجزء عمّ كاملين، أو من سورة تبارك إلى نهاية القرآن الكريـم.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
