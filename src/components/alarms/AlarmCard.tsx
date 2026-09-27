/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, ChevronLeft, Volume2, Sparkles } from 'lucide-react';
import type { AlarmConfig } from '../../types';
import { formatAlarmTimingDesc, formatAlarmDays } from '../../utils/alarmUtils';

export interface AlarmCardProps {
  alarm: AlarmConfig;
  onToggle: (id: string, enabled: boolean) => void;
  onEdit: (alarm: AlarmConfig) => void;
  onDelete?: (id: string) => void;
}

export const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  onToggle,
  onEdit,
}) => {
  const timingDesc = formatAlarmTimingDesc(alarm);
  const daysDesc = formatAlarmDays(alarm.days);
  const soundDesc = alarm.soundType && alarm.soundType !== 'silent' ? '🔊 صوتي' : '🔕 صامت';
  // One combined line instead of three separate badges — easier to scan at a glance.
  const summaryLine = `${timingDesc} · ${daysDesc} · ${soundDesc}`;
  const TypeIcon = alarm.type === 'prayer_relative' ? Sparkles : Clock;

  return (
    <div
      id={`alarm-card-${alarm.id}`}
      onClick={() => onEdit(alarm)}
      className={`group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none gap-3 ${
        alarm.enabled
          ? 'bg-white dark:bg-[#151c27] border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-md'
          : 'bg-slate-50/80 dark:bg-[#111620]/70 border-slate-200/50 dark:border-slate-850/50 opacity-75 hover:opacity-95'
      }`}
    >
      {/* Info Area — title + a single descriptive line, no badge soup */}
      <div className="flex-1 min-w-0 text-right space-y-1">
        <div className="flex items-center justify-end gap-1.5">
          <h3
            className={`text-sm sm:text-base font-black truncate transition-colors ${
              alarm.enabled
                ? 'text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {alarm.title}
          </h3>
          <TypeIcon className={`w-3.5 h-3.5 shrink-0 ${alarm.enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
        </div>
        <p className="text-[11px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 truncate">
          {summaryLine}
        </p>
      </div>

      {/* Controls — just toggle + a chevron hint that the row opens the editor */}
      <div
        className="flex items-center gap-2 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          id={`toggle-alarm-${alarm.id}`}
          type="button"
          role="switch"
          dir="ltr"
          aria-checked={alarm.enabled}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(alarm.id, !alarm.enabled);
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer ${
            alarm.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
              alarm.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <ChevronLeft
        onClick={() => onEdit(alarm)}
        className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 cursor-pointer"
      />
    </div>
  );
};

export default AlarmCard;
