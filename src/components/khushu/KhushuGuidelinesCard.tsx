/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, RotateCcw, CheckCircle2, Circle } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';
import { KHUSHU_STEPS, KhushuStepItem } from './khushuConstants';

interface KhushuGuidelinesCardProps {
  khushuResetMode: 'prayer' | 'daily';
  onModeChange: (mode: 'prayer' | 'daily') => void;
  completedKhushuSteps: Set<string>;
  onResetKhushuSteps: () => void;
  stepCategoryFilter: 'all' | 'preparation' | 'during' | 'post';
  setStepCategoryFilter: (filter: 'all' | 'preparation' | 'during' | 'post') => void;
  onToggleKhushuStep: (stepId: string) => void;
  selectedStepDetail: KhushuStepItem | null;
  setSelectedStepDetail: (step: KhushuStepItem | null) => void;
}

export const KhushuGuidelinesCard: React.FC<KhushuGuidelinesCardProps> = ({
  khushuResetMode,
  onModeChange,
  completedKhushuSteps,
  onResetKhushuSteps,
  stepCategoryFilter,
  setStepCategoryFilter,
  onToggleKhushuStep,
  selectedStepDetail,
  setSelectedStepDetail,
}) => {
  const filteredSteps = stepCategoryFilter === 'all'
    ? KHUSHU_STEPS
    : KHUSHU_STEPS.filter(s => s.category === stepCategoryFilter);

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              دليل تحقيق الخشوع وحضور القلب في الصلاة
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              خطوات وأسباب الخشوع المأثورة عن السلف الصالح لتذوق حلاوة الصلاة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Auto-reset Mode Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/50 text-[10px]">
            <button
              type="button"
              onClick={() => onModeChange('prayer')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                khushuResetMode === 'prayer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              تصفير كل صلاة
            </button>
            <button
              type="button"
              onClick={() => onModeChange('daily')}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                khushuResetMode === 'daily'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              تصفير يومي
            </button>
          </div>

          {/* Steps Counter */}
          <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            {toArabicNumbers(completedKhushuSteps.size)} / {toArabicNumbers(KHUSHU_STEPS.length)}
          </span>

          {/* Manual Reset button */}
          <button
            type="button"
            onClick={onResetKhushuSteps}
            title="تصفير القائمة الآن"
            className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <RotateCcw className="w-3 h-3" />
            <span>تصفير</span>
          </button>
        </div>
      </div>

      {/* Step Categories Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setStepCategoryFilter('all')}
          className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
            stepCategoryFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          جميع الخطوات ({toArabicNumbers(KHUSHU_STEPS.length)})
        </button>
        <button
          type="button"
          onClick={() => setStepCategoryFilter('preparation')}
          className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
            stepCategoryFilter === 'preparation'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          قبل الصلاة (التهيئة)
        </button>
        <button
          type="button"
          onClick={() => setStepCategoryFilter('during')}
          className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
            stepCategoryFilter === 'during'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          أثناء الصلاة (الحضور)
        </button>
        <button
          type="button"
          onClick={() => setStepCategoryFilter('post')}
          className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
            stepCategoryFilter === 'post'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}
        >
          بعد الصلاة (المناجاة)
        </button>
      </div>

      {/* Khushu Steps Checklist */}
      <div className="space-y-2">
        {filteredSteps.map((step) => {
          const isDone = completedKhushuSteps.has(step.id);
          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border text-end transition-all space-y-2 ${
                isDone
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200'
                  : 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onToggleKhushuStep(step.id)}
                  className="flex items-start gap-2.5 flex-1 cursor-pointer text-end"
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <h4 className={`text-xs font-black ${isDone ? 'line-through opacity-80 text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
                      {step.title}
                    </h4>
                    <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                      {step.desc}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStepDetail(selectedStepDetail?.id === step.id ? null : step)}
                  className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg text-[10px] font-extrabold shrink-0 cursor-pointer"
                >
                  {selectedStepDetail?.id === step.id ? 'إخفاء الفائدة' : 'فائدة نبوية 💡'}
                </button>
              </div>

              {selectedStepDetail?.id === step.id && (
                <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed animate-fade-in">
                  <span className="font-black block text-indigo-700 dark:text-indigo-300 mb-0.5">💡 أصل السنة والدليل:</span>
                  {step.tip}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
