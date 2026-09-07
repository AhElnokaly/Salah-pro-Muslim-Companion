/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Check } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';

interface FridaySunnahChecklistProps {
  checklist: Record<string, boolean>;
  onToggleCheck: (key: string) => void;
  currentStyle: 'glass-dark' | 'faith-bright';
}

const SUNNAH_ITEMS = [
  { key: 'ghusl', label: 'الاغتسال والتطهر السني', desc: 'غسل الجمعة سنة مؤكدة', emoji: '🛁' },
  { key: 'perfume', label: 'التطيب ولبس أحسن الثياب', desc: 'للرجل لشهود صلاة الجماعة', emoji: '🪔' },
  { key: 'kahf', label: 'قراءة سورة الكهف المباركة', desc: 'نور ما بين الجمعتين', emoji: '📖' },
  { key: 'early', label: 'التبكير لصلاة الجمعة', desc: 'أجر عظيم وفضل جزيل', emoji: '🚶‍♂️' },
  { key: 'dua', label: 'تحري ساعة الاستجابة', desc: 'آخر ساعة قبل المغرب', emoji: '🤲' },
];

export function FridaySunnahChecklist({
  checklist,
  onToggleCheck,
  currentStyle
}: FridaySunnahChecklistProps) {
  const totalItems = SUNNAH_ITEMS.length;
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / totalItems) * 100);

  return (
    <div className="space-y-3 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>جدول سنن وآداب يوم الجمعة ({toArabicNumbers(completedCount)} / {toArabicNumbers(totalItems)}):</span>
        </span>

        <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
          %{toArabicNumbers(completionPercentage)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {SUNNAH_ITEMS.map((item) => {
          const isChecked = checklist[item.key];
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onToggleCheck(item.key)}
              className={`p-3 rounded-2xl border text-right flex items-start gap-3 transition-all cursor-pointer ${
                isChecked
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold'
                  : currentStyle === 'glass-dark'
                  ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                  : 'bg-white border-slate-200/60 hover:bg-slate-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                isChecked 
                  ? 'bg-emerald-500 border-emerald-500 text-white' 
                  : 'border-slate-300 dark:border-slate-700'
              }`}>
                {isChecked && <Check className="w-3.5 h-3.5" />}
              </div>
              <div className="text-right">
                <span className="text-xs font-black block leading-none text-right">
                  {item.emoji} {item.label}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold block mt-1 text-right">
                  {item.desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
