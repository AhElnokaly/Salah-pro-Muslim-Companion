/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, Target, ChevronLeft, Lightbulb } from 'lucide-react';
import type { FeaturePraiseInfo, FeatureNudgeInfo } from '../../utils/analyticsEngine';
import { ICON_MAP } from './analyticsIcons';

interface SmartNudgesViewProps {
  key?: React.Key;
  topPraise: FeaturePraiseInfo | null;
  smartNudges: FeatureNudgeInfo[];
  onSelectTab: (tab: string, subTab?: string) => void;
}

export default function SmartNudgesView({
  topPraise,
  smartNudges,
  onSelectTab
}: SmartNudgesViewProps) {
  return (
    <motion.div
      key="nudges-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Praise for top feature */}
      {topPraise && (
        <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 dark:from-amber-950/40 dark:to-emerald-950/30 p-5 rounded-3xl border border-amber-500/30 shadow-md space-y-3 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-300 rounded-2xl border border-amber-400/40 shrink-0">
                <ThumbsUp className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg">
                    {topPraise.badgeLabel}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    {topPraise.praiseTitle}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-bold leading-relaxed">
                  {topPraise.praiseMessage}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectTab(topPraise.feature.id)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
            >
              <span>متابعة ميزتك المفضلة ({topPraise.feature.name})</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Smart Nudges */}
      {smartNudges.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-slate-900/5 dark:from-indigo-950/40 dark:to-purple-950/30 p-5 rounded-3xl border border-indigo-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500 animate-pulse" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                توجيهات مخصصة للمزايا الأقل استخداماً 🎯
              </h3>
            </div>
            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
              توجيه مخصص
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {smartNudges.map((nudge, idx) => {
              const IconComp = ICON_MAP[nudge.iconName] || Lightbulb;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#111720] rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 hover:border-indigo-400 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`p-2 rounded-xl border ${nudge.feature.color.bg} ${nudge.feature.color.border}`}>
                          <IconComp className={`w-4 h-4 ${nudge.feature.color.text}`} />
                        </span>
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                          {nudge.nudgeTitle}
                        </h4>
                      </div>
                      <span className="text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md">
                        {nudge.badgeText}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                      {nudge.nudgeMessage}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectTab(nudge.targetTab)}
                    className="w-full mt-2 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[11px] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-between gap-1.5 group-hover:shadow-md"
                  >
                    <span>{nudge.buttonLabel}</span>
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
