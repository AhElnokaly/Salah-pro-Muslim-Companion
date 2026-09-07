/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ProgressTierInfo } from '../../utils/progressEngine';
import { toArabicNumbers } from '../../utils/hijri';

interface CircularProgressRingProps {
  percentage: number;
  tier: ProgressTierInfo;
  icon: string;
  onTimePercentage?: number;
  latePercentage?: number;
}

export function CircularProgressRing({
  percentage,
  tier,
  icon,
  onTimePercentage,
  latePercentage
}: CircularProgressRingProps) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius; // 94.24778

  const hasDualBreakdown = onTimePercentage !== undefined && latePercentage !== undefined && latePercentage > 0;

  const clampedPct = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clampedPct / 100) * circumference;

  const onTimePct = onTimePercentage !== undefined ? Math.min(100, Math.max(0, onTimePercentage)) : clampedPct;
  const latePct = latePercentage !== undefined ? Math.min(100, Math.max(0, latePercentage)) : 0;
  const totalPct = Math.min(100, onTimePct + latePct);

  const onTimeOffset = circumference - (onTimePct / 100) * circumference;
  const totalOffset = circumference - (totalPct / 100) * circumference;

  const strokeColorMap: Record<number, string> = {
    0: 'stroke-slate-300 dark:stroke-slate-700',
    1: 'stroke-amber-700 dark:stroke-amber-600',
    2: 'stroke-orange-600 dark:stroke-orange-500',
    3: 'stroke-slate-400 dark:stroke-slate-300',
    4: 'stroke-amber-400 dark:stroke-amber-400',
    5: 'stroke-cyan-400 dark:stroke-cyan-300',
    6: 'stroke-purple-400 dark:stroke-amber-300'
  };

  const strokeClass = strokeColorMap[tier.tierLevel] || 'stroke-emerald-500';

  return (
    <div className="relative w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 flex items-center justify-center shrink-0 my-0.5">
      <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 36 36">
        {/* Background Track Circle */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          className="stroke-slate-200/80 dark:stroke-slate-800"
          strokeWidth="3"
          fill="transparent"
        />

        {hasDualBreakdown ? (
          <>
            {/* Total Completion Arc (Amber / Gold for Late Segment) */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              className="stroke-amber-400 dark:stroke-amber-400 transition-all duration-1000 ease-out"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={totalOffset}
              strokeLinecap="round"
              fill="transparent"
            />
            {/* On Time Arc (Emerald Green on Top) */}
            <circle
              cx="18"
              cy="18"
              r={radius}
              className="stroke-emerald-500 dark:stroke-emerald-400 transition-all duration-1000 ease-out"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={onTimeOffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </>
        ) : (
          /* Standard Single Arc */
          <circle
            cx="18"
            cy="18"
            r={radius}
            className={`${strokeClass} transition-all duration-1000 ease-out`}
            strokeWidth="3"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        )}
      </svg>

      {/* Icon and percentage in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-0.5 pointer-events-none">
        <span className="text-[11px] xs:text-xs sm:text-base leading-none drop-shadow-xs">{icon}</span>
        <span className="text-[8px] xs:text-[9px] sm:text-[10px] font-black font-mono text-slate-800 dark:text-slate-100 leading-tight mt-0.5">
          {toArabicNumbers(percentage)}%
        </span>
      </div>
    </div>
  );
}
