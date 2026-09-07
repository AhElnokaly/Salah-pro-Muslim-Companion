/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Trash2, ChevronLeft, Volume2, Sparkles, Pencil } from 'lucide-react';
import type { AlarmConfig } from '../../types';
import { formatAlarmTimingDesc, formatAlarmDays } from '../../utils/alarmUtils';
import { toArabicNumbers } from '../../utils/hijri';

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
  onDelete
}) => {
  const timingDesc = formatAlarmTimingDesc(alarm);
  const daysDesc = formatAlarmDays(alarm.days);

  return (
    <div
      id={`alarm-card-${alarm.id}`}
      onClick={() => onEdit(alarm)}
      className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 cursor-pointer select-none gap-3.5 ${
        alarm.enabled
          ? 'bg-white dark:bg-[#151c27] border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-500/50 dark:hover:border-emerald-500/40 hover:shadow-md'
          : 'bg-slate-50/80 dark:bg-[#111620]/70 border-slate-200/50 dark:border-slate-850/50 opacity-75 hover:opacity-95'
      }`}
    >
      {/* Top / Right Info Area */}
      <div className="flex-1 min-w-0 text-right space-y-1.5">
        {/* Title and Category Badge */}
        <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap">
          <h3
            className={`text-base sm:text-lg font-black truncate transition-colors ${
              alarm.enabled
                ? 'text-slate-800 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {alarm.title}
          </h3>

          {alarm.type === 'prayer_relative' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50 shrink-0">
              <Sparkles className="w-3 h-3" />
              مرتبط بالصلاة
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 shrink-0">
              <Clock className="w-3 h-3" />
              وقت محدد
            </span>
          )}
        </div>

        {/* Timing description: e.g. 15 دقيقة بعد الشروق */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>{timingDesc}</span>
        </div>

        {/* Days repetition and sound badge */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
            {daysDesc}
          </span>

          {alarm.soundType && alarm.soundType !== 'silent' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-750">
              <Volume2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
              صوتي
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500">
              🔕 صامت
            </span>
          )}
        </div>
      </div>

      {/* Bottom (Mobile) / Left (Desktop) Controls Area */}
      <div
        className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Action Buttons: Delete & Edit */}
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              id={`delete-alarm-${alarm.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(alarm.id);
              }}
              title="حذف المنبه"
              aria-label="حذف المنبه"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(alarm)}
            title="تعديل المنبه"
            aria-label="تعديل المنبه"
            className="p-2 rounded-xl text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle Switch - Standard LTR isolated to prevent inverted knob translation */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 sm:hidden">
            {alarm.enabled ? 'مفعل' : 'معطل'}
          </span>
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
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer ${
              alarm.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                alarm.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlarmCard;
