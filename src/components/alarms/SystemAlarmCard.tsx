/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, Bell, Clock, Moon, BookOpen, Headphones, Sparkles } from 'lucide-react';
import { SystemAlarmItemKey } from './SystemAlarmEditModal';

export interface SystemAlarmCardProps {
  alarmKey: SystemAlarmItemKey;
  title: string;
  timingDesc: string;
  enabled: boolean;
  isDefault: boolean;
  onToggle: (key: SystemAlarmItemKey, enabled: boolean) => void;
  onEdit: (key: SystemAlarmItemKey) => void;
}

export const SystemAlarmCard: React.FC<SystemAlarmCardProps> = ({
  alarmKey,
  title,
  timingDesc,
  enabled,
  isDefault,
  onToggle,
  onEdit,
}) => {
  const getIcon = () => {
    switch (alarmKey) {
      case 'prayerAthan':
      case 'ongoingPrayerBar':
        return Bell;
      case 'prayerPreAlert':
      case 'adhkarMorning':
      case 'adhkarEvening':
        return Clock;
      case 'fridayKahf':
      case 'readingPortion':
        return BookOpen;
      case 'listeningPortion':
        return Headphones;
      case 'sleepAdhkar':
      case 'quietHours':
        return Moon;
      default:
        return Sparkles;
    }
  };

  const IconComp = getIcon();

  return (
    <div
      id={`system-alarm-card-${alarmKey}`}
      onClick={() => onEdit(alarmKey)}
      className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none gap-3 ${
        enabled
          ? 'bg-white dark:bg-[#151c27] border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-md'
          : 'bg-slate-50/80 dark:bg-[#111620]/70 border-slate-200/50 dark:border-slate-850/50 opacity-75 hover:opacity-95'
      }`}
    >
      {/* Info Area */}
      <div className="flex-1 min-w-0 text-right space-y-1">
        <div className="flex items-center justify-end gap-1.5 flex-wrap">
          {isDefault && enabled && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              مفعّل تلقائياً
            </span>
          )}
          <h3
            className={`text-sm sm:text-base font-black truncate transition-colors ${
              enabled
                ? 'text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {title}
          </h3>
          <IconComp
            className={`w-3.5 h-3.5 shrink-0 ${
              enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
            }`}
          />
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 truncate">
          {timingDesc}
        </p>
      </div>

      {/* Controls — toggle switch */}
      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id={`toggle-system-alarm-${alarmKey}`}
          type="button"
          role="switch"
          dir="ltr"
          aria-checked={enabled}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(alarmKey, !enabled);
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer ${
            enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <ChevronLeft
        onClick={() => onEdit(alarmKey)}
        className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 cursor-pointer"
      />
    </div>
  );
};

export default SystemAlarmCard;
