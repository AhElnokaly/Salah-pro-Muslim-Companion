/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { safeSetItem, safeRemoveItem, safeGetItem } from '../utils/storage';
import { ALL_FEATURES } from '../data/featureDiscoveryData';
import { DiscoveryBubble } from './discovery/DiscoveryBubble';
import { FullCatalogModal } from './discovery/FullCatalogModal';

interface FeatureDiscoveryWidgetProps {
  onSelectTab: (tab: string, subTab?: string) => void;
  onOpenTour: () => void;
}

export default function FeatureDiscoveryWidget({
  onSelectTab,
  onOpenTour,
}: FeatureDiscoveryWidgetProps) {
  const [currentTipIdx, setCurrentTipIdx] = useState(0);
  const [isFullCatalogOpen, setIsFullCatalogOpen] = useState(false);
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(() => {
    return safeGetItem('mc_discovery_bubble_dismissed') === 'true';
  });

  const currentFeature = ALL_FEATURES[currentTipIdx % ALL_FEATURES.length];

  const handleNextTip = () => {
    setCurrentTipIdx((prev) => (prev + 1) % ALL_FEATURES.length);
  };

  const handlePrevTip = () => {
    setCurrentTipIdx((prev) => (prev - 1 + ALL_FEATURES.length) % ALL_FEATURES.length);
  };

  const dismissBubble = () => {
    setIsBubbleDismissed(true);
    safeSetItem('mc_discovery_bubble_dismissed', 'true');
  };

  const restoreBubble = () => {
    setIsBubbleDismissed(false);
    safeRemoveItem('mc_discovery_bubble_dismissed');
  };

  // If dismissed, render a subtle micro-badge option to restore if needed
  if (isBubbleDismissed) {
    return (
      <div className="flex justify-center py-1">
        <button
          type="button"
          onClick={restoreBubble}
          className="text-[11px] font-extrabold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 border border-slate-200/80 dark:border-slate-700/80 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>إظهار فقاعة الاكتشاف والخدمات 💬</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <DiscoveryBubble
        currentFeature={currentFeature}
        currentTipIdx={currentTipIdx}
        totalFeatures={ALL_FEATURES.length}
        onOpenTour={onOpenTour}
        onOpenCatalog={() => setIsFullCatalogOpen(true)}
        onDismiss={dismissBubble}
        onPrevTip={handlePrevTip}
        onNextTip={handleNextTip}
        onSelectFeature={onSelectTab}
      />

      <FullCatalogModal
        isOpen={isFullCatalogOpen}
        onClose={() => setIsFullCatalogOpen(false)}
        onSelectFeature={onSelectTab}
      />
    </>
  );
}
