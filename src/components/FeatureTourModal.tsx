/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TOUR_STEPS } from '../data/featureTourData';
import TourHeaderBanner from './tour/TourHeaderBanner';
import TourStepBody from './tour/TourStepBody';
import TourFooterControls from './tour/TourFooterControls';

interface FeatureTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string, subTab?: string) => void;
}

export default function FeatureTourModal({ isOpen, onClose, onSelectTab }: FeatureTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleJumpToFeature = () => {
    onSelectTab(currentStep.id, currentStep.subTab);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in"
        dir="rtl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          role="dialog"
          aria-modal="true"
          aria-label="جولة استكشاف مميزات التطبيق"
          className="bg-white dark:bg-[#131922] w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right"
        >
          {/* Header Banner */}
          <TourHeaderBanner
            currentStep={currentStep}
            currentStepIndex={currentStepIndex}
            totalSteps={TOUR_STEPS.length}
            onClose={onClose}
          />

          {/* Modal Body */}
          <TourStepBody currentStep={currentStep} />

          {/* Footer Controls */}
          <TourFooterControls
            steps={TOUR_STEPS}
            currentStepIndex={currentStepIndex}
            onSetStepIndex={setCurrentStepIndex}
            onJumpToFeature={handleJumpToFeature}
            onPrev={handlePrev}
            onNext={handleNext}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
