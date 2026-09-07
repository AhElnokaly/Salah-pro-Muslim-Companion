/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Clock, Check, Copy } from 'lucide-react';

export const FRIDAY_DUAS = [
  'اللَّهُمَّ فِي يَوْمِ الْجُمُعَةِ ارْحَمْ مَوْتَانَا، وَاشْفِ مَرْضَانَا، وَفَرِّجْ هُمُومَنَا، وَاغْفِرْ لَنَا وَلِوَالِدَيْنَا.',
  'اللَّهُمَّ آتِ نُفُوسَنَا تَقْوَاهَا، وَزَكِّهَا أَنْتَ خَيْرُ مَنْ زَكَّاهَا، أَنْتَ وَلِيُّهَا وَمَوْلاَهَا.',
  'اللَّهُمَّ اكْفِنَا بِحَلاَلِكَ عَنْ حَرَامِكَ، وَأَغْنِنَا بِفَضْلِكَ عَمَّنْ سِوَاكَ، وَاهْدِنَا لِأَحْسَنِ الأَخْلاَقِ.',
  'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ.'
];

interface FridayHourOfDuaAlertProps {
  isHourOfAcceptanceTime: boolean;
}

export function FridayHourOfDuaAlert({ isHourOfAcceptanceTime }: FridayHourOfDuaAlertProps) {
  const [copiedDuaIndex, setCopiedDuaIndex] = useState<number | null>(null);

  const handleCopyDua = (duaText: string, index: number) => {
    navigator.clipboard.writeText(duaText);
    setCopiedDuaIndex(index);
    setTimeout(() => setCopiedDuaIndex(null), 2000);
  };

  return (
    <div 
      dir="rtl"
      className={`p-4 rounded-2xl border transition-all text-right ${
      isHourOfAcceptanceTime 
        ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200 animate-pulse'
        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800'
    }`}>
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-black text-right">
            {isHourOfAcceptanceTime ? '🤲 حانت الآن ساعة الاستجابة المباركة!' : '⏳ ساعة الاستجابة يوم الجمعة'}
          </h4>
        </div>
        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
          آخر ساعة قبل المغرب
        </span>
      </div>

      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed text-right">
        «فِيهِ سَاعَةٌ لاَ يُوَافِقُهَا عَبْدٌ مُسْلِمٌ، وَهُوَ قَائِمٌ يُصَلِّي، يَسْأَلُ اللَّهَ تَعَالَى شَيْئًا، إِلاَّ أَعْطَاهُ إِيَّاهُ»
      </p>

      {/* Quick Duas List */}
      <div className="mt-3 space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-right">
        <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 block text-right">
          أدعية مأثورة جامعة لمساء يوم الجمعة:
        </span>

        <div className="grid grid-cols-1 gap-2">
          {FRIDAY_DUAS.map((dua, idx) => (
            <div 
              key={idx}
              className="p-2.5 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
            >
              <p className="font-bold text-slate-800 dark:text-slate-200 leading-relaxed text-right flex-1 select-text">
                {dua}
              </p>
              <button
                type="button"
                onClick={() => handleCopyDua(dua, idx)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 cursor-pointer shrink-0 transition-colors"
                title="نسخ الدعاء"
              >
                {copiedDuaIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
