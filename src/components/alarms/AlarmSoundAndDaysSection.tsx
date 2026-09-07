/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, Square } from 'lucide-react';
import type { AlarmSoundType } from '../../types';
import { DAYS_ARABIC_ORDERED } from '../../utils/alarmUtils';
import { SOUND_OPTIONS } from './alarmModalConstants';

interface AlarmSoundAndDaysSectionProps {
  days: number[];
  setDays: React.Dispatch<React.SetStateAction<number[]>>;
  soundType: AlarmSoundType;
  setSoundType: (sound: AlarmSoundType) => void;
  testPlaying: boolean;
  onTestSound: () => void;
}

export const AlarmSoundAndDaysSection: React.FC<AlarmSoundAndDaysSectionProps> = ({
  days,
  setDays,
  soundType,
  setSoundType,
  testPlaying,
  onTestSound,
}) => {
  const handleToggleDay = (d: number) => {
    if (days.includes(d)) {
      if (days.length > 1) {
        setDays(days.filter(item => item !== d));
      }
    } else {
      setDays([...days, d]);
    }
  };

  return (
    <>
      {/* Days Repetition */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
            أيام التكرار:
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDays([0, 1, 2, 3, 4, 5, 6])}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              كل يوم
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              type="button"
              onClick={() => setDays([5])}
              className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
            >
              الجمعة فقط
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {DAYS_ARABIC_ORDERED.map((item) => {
            const isSelected = days.includes(item.day);
            return (
              <button
                key={item.day}
                type="button"
                onClick={() => handleToggleDay(item.day)}
                className={`py-2 text-center rounded-xl text-xs font-black border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#1a232e] border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                }`}
              >
                {item.short}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sound & Alert Melody */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
            نغمة التنبيه / الصوت:
          </span>
          <button
            type="button"
            onClick={onTestSound}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-colors cursor-pointer ${
              testPlaying
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            {testPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>إيقاف التجربة</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>تجربة الصوت</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-0.5">
          {SOUND_OPTIONS.map((opt) => {
            const isSelected = soundType === opt.type;
            return (
              <button
                key={opt.type}
                type="button"
                onClick={() => setSoundType(opt.type)}
                className={`p-2.5 rounded-xl text-right border transition-all flex flex-col justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-black shadow-xs'
                    : 'bg-slate-50 dark:bg-[#1a232e] border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                }`}
              >
                <div className="text-xs font-black">{opt.label}</div>
                <div className="text-[10px] text-slate-400 font-normal mt-0.5">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
