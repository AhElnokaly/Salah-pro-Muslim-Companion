/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface ExpandableCardProps {
  key?: string | number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function ExpandableCard({
  title,
  subtitle,
  icon,
  defaultExpanded = false,
  headerAction,
  children,
  className = ''
}: ExpandableCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl transition-all duration-300 overflow-hidden shadow-sm ${className}`}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 truncate">
              {title}
            </div>
            {subtitle && (
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 me-1">
          {headerAction && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
          <div className={`p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-100 dark:bg-slate-800' : ''}`}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/80 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
}
