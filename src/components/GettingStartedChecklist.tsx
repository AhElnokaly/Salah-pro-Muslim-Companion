/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronLeft, Sparkles, X } from 'lucide-react';
import { safeSetItem } from '../utils/storage';

export interface GettingStartedChecklistProps {
  hasLoggedPrayer: boolean;
  hasUsedTasbih: boolean;
  hasVisitedQibla: boolean;
  hasStartedKhatma: boolean;
  onNavigateTab: (tab: string) => void;
}

export const GettingStartedChecklist: React.FC<GettingStartedChecklistProps> = ({
  hasLoggedPrayer,
  hasUsedTasbih,
  hasVisitedQibla,
  hasStartedKhatma,
  onNavigateTab,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const tasks = [
    {
      id: 'prayer',
      title: 'تسجيل أول صلاة مؤداة',
      done: hasLoggedPrayer,
      tab: 'salah',
    },
    {
      id: 'tasbih',
      title: 'استخدام السبحة والأذكار',
      done: hasUsedTasbih,
      tab: 'adhkar',
    },
    {
      id: 'qibla',
      title: 'تحديد اتجاه القبلة',
      done: hasVisitedQibla,
      tab: 'qibla',
    },
    {
      id: 'quran',
      title: 'بدء ختمة قرآنية جديدة',
      done: hasStartedKhatma,
      tab: 'quran',
    },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPct = Math.round((completedCount / tasks.length) * 100);

  const handleDismiss = () => {
    setIsDismissed(true);
    safeSetItem('hemmaty_dismissed_checklist', 'true');
  };

  return (
    <div className="bg-white/80 dark:bg-[#121922]/90 backdrop-blur-md border border-emerald-500/20 rounded-3xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100">
            خطوات البداية الإيمانية ({completedCount}/{tasks.length})
          </h3>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="إغلاق القائمة"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="space-y-1.5">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onNavigateTab(task.tab)}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-right cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              {task.done ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
              )}
              <span
                className={`text-xs font-bold ${
                  task.done
                    ? 'line-through text-slate-400 dark:text-slate-500'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {task.title}
              </span>
            </div>
            {!task.done && (
              <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GettingStartedChecklist;
