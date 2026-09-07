/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, ChevronLeft, X } from 'lucide-react';
import { FeatureItem } from '../../data/featureDiscoveryData';

interface DiscoveryBubbleProps {
  currentFeature: FeatureItem;
  currentTipIdx: number;
  totalFeatures: number;
  onOpenTour: () => void;
  onOpenCatalog: () => void;
  onDismiss: () => void;
  onPrevTip: () => void;
  onNextTip: () => void;
  onSelectFeature: (id: string, subTab?: string) => void;
}

export const DiscoveryBubble: React.FC<DiscoveryBubbleProps> = ({
  currentFeature,
  currentTipIdx,
  totalFeatures,
  onOpenTour,
  onOpenCatalog,
  onDismiss,
  onPrevTip,
  onNextTip,
  onSelectFeature,
}) => {
  const Icon = currentFeature.icon;

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-3.5 sm:p-4 border border-indigo-500/30 shadow-xl relative overflow-hidden transition-all duration-300 text-end">
      {/* Background glow accents */}
      <div className="absolute top-0 end-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 start-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 space-y-2.5">
        {/* Bubble Header */}
        <div className="flex items-center justify-between gap-2 border-b border-indigo-500/20 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-xs font-black text-xs shrink-0 flex items-center justify-center">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-black text-amber-300">
                  دليل ومزايا التطبيق 💬
                </h3>
                <span className="text-[9.5px] bg-amber-500/20 text-amber-200 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                  تلميح {currentTipIdx + 1} من {totalFeatures}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenTour}
              className="py-1 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              title="الجولة التفاعلية"
            >
              <Play className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">الجولة</span>
            </button>

            <button
              type="button"
              onClick={onOpenCatalog}
              className="py-1 px-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer"
            >
              عرض المزايا ({totalFeatures})
            </button>

            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="إغلاق الفقاعة"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Speech Bubble Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFeature.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-indigo-500/20"
          >
            <div className="flex items-start gap-2.5 flex-1">
              <div
                className={`p-2.5 bg-gradient-to-br ${currentFeature.gradient} text-white rounded-xl shrink-0 mt-0.5`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-white">{currentFeature.title}</span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${currentFeature.badgeColor}`}
                  >
                    {currentFeature.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-tight">
                  {currentFeature.subtitle}
                </p>
              </div>
            </div>

            {/* Navigation & Action */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 border-t sm:border-t-0 border-slate-700/60 pt-2 sm:pt-0">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onPrevTip}
                  className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="السابق"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={onNextTip}
                  className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="التالي"
                >
                  ›
                </button>
              </div>

              <button
                type="button"
                onClick={() => onSelectFeature(currentFeature.id, currentFeature.subTab)}
                className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>جرب الميزة الآن</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DiscoveryBubble;
