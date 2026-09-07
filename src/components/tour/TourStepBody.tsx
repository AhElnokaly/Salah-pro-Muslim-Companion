/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Zap, CheckCircle2 } from 'lucide-react';
import { TourStep } from '../../data/featureTourData';

interface TourStepBodyProps {
  currentStep: TourStep;
}

export const TourStepBody: React.FC<TourStepBodyProps> = ({ currentStep }) => {
  return (
    <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-right">
      {/* Category & Subtitle */}
      <div className="flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 pb-3 text-right">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            الفئة:
          </span>
          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {currentStep.category}
          </span>
        </div>
        <p className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
          {currentStep.subtitle}
        </p>
      </div>

      {/* Main Description */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium text-right">
        {currentStep.description}
      </p>

      {/* Bullet Highlights */}
      <div
        className={`p-4 rounded-2xl ${currentStep.color.bg} border ${currentStep.color.border} space-y-2.5 text-right`}
      >
        <h4 className={`text-xs font-black ${currentStep.color.text} flex items-center gap-2 justify-start`}>
          <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>أبرز المميزات والوظائف المتاحة:</span>
        </h4>
        <ul className="space-y-2">
          {currentStep.highlights.map((item, idx) => (
            <li
              key={idx}
              className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed text-right"
            >
              <CheckCircle2
                className={`w-4 h-4 ${currentStep.color.text} shrink-0 mt-0.5`}
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pro Tip Box */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-start gap-2.5 font-medium text-right">
        <span className="text-amber-500 text-base shrink-0" aria-hidden="true">💡</span>
        <p className="leading-relaxed">
          <strong className="text-slate-800 dark:text-slate-200">نصيحة استكشاف:</strong> {currentStep.tips}
        </p>
      </div>
    </div>
  );
};

export default TourStepBody;
