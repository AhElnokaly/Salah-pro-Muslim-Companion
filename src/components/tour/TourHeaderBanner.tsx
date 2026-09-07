/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';
import { TourStep } from '../../data/featureTourData';

interface TourHeaderBannerProps {
  currentStep: TourStep;
  currentStepIndex: number;
  totalSteps: number;
  onClose: () => void;
}

export const TourHeaderBanner: React.FC<TourHeaderBannerProps> = ({
  currentStep,
  currentStepIndex,
  totalSteps,
  onClose,
}) => {
  const Icon = currentStep.icon;

  return (
    <div
      className={`p-4 sm:p-5 bg-gradient-to-r ${currentStep.color.gradient} text-white relative flex items-center justify-between shrink-0`}
    >
      <div className="flex items-center gap-3">
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
          <Icon className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-white/20 font-extrabold px-2 py-0.5 rounded-full border border-white/20">
              خطوة {currentStepIndex + 1} من {totalSteps}
            </span>
            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-xs">
              {currentStep.badge}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white mt-1 leading-tight">
            {currentStep.title}
          </h2>
        </div>
      </div>

      <button
        onClick={onClose}
        className="p-2 bg-black/20 hover:bg-black/40 text-white/90 hover:text-white rounded-full transition-all cursor-pointer shrink-0"
        title="إغلاق الجولة"
        aria-label="إغلاق جولة استكشاف مميزات التطبيق"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default TourHeaderBanner;
