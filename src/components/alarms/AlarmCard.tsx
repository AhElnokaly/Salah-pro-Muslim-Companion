/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, BellOff, Edit2, Trash2, Volume2, Shield } from 'lucide-react';
import type { AlarmConfig } from '../../types';
import { formatAlarmDays, formatAlarmTimingDesc } from '../../utils/alarmUtils';
import { ToggleSwitch } from '../ui/ToggleSwitch';

export interface AlarmCardProps {
  alarm: AlarmConfig;
  onToggle: (id: string) => void;
  onEdit: (alarm: AlarmConfig) => void;
  onDelete: (id: string) => void;
}

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const isEnabled = alarm.enabled;
  const timingDesc = formatAlarmTimingDesc(alarm);
  const daysDesc = formatAlarmDays(alarm.days);

  return (
    <div
      className={`p-4 rounded-3xl border transition-all duration-200 flex flex-col gap-3 shadow-xs ${
        isEnabled
          ? 'bg-white/90 dark:bg-[#151d27]/90 border-slate-200/80 dark:border-slate-750'
          : 'bg-slate-50/70 dark:bg-[#0f151e]/60 border-slate-200/40 dark:border-slate-800/40 opacity-75'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Title and Icon */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              isEnabled
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400'
            }`}
          >
            {isEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </div>
          <div className="text-right flex-1 min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
              {alarm.title}
            </h4>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              {timingDesc}
            </span>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="shrink-0 flex items-center">
          <ToggleSwitch
            checked={isEnabled}
            onChange={() => onToggle(alarm.id)}
            ariaLabel={`تبديل تفعيل ${alarm.title}`}
          />
        </div>
      </div>

      {/* Footer Info: Days & Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg text-[10px]">
            {daysDesc}
          </span>
          {alarm.autoKhushu && (
            <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg text-[10px]">
              <Shield className="w-3 h-3" />
              الخشوع التلقائي
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(alarm)}
            aria-label={`تعديل ${alarm.title}`}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(alarm.id)}
            aria-label={`حذف ${alarm.title}`}
            className="p-1.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmCard;
