/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, X, Share2 } from 'lucide-react';
import { MemorizationRoutine } from '../../types';
import { SURAHS_LIST } from '../../data/quranData';
import { safeUUID } from '../../utils/uuid';

export interface AddRoutineModalProps {
  todayStr: string;
  onClose: () => void;
  onSave: (routine: MemorizationRoutine) => void;
  onOpenCardMaker: () => void;
}

const WEEK_DAYS = [
  { char: 'س', name: 'السبت', dayNum: 6 },
  { char: 'ح', name: 'الأحد', dayNum: 0 },
  { char: 'ن', name: 'الإثنين', dayNum: 1 },
  { char: 'ث', name: 'الثلاثاء', dayNum: 2 },
  { char: 'ر', name: 'الأربعاء', dayNum: 3 },
  { char: 'خ', name: 'الخميس', dayNum: 4 },
  { char: 'ج', name: 'الجمعة', dayNum: 5 },
];

export const AddRoutineModal: React.FC<AddRoutineModalProps> = ({
  todayStr,
  onClose,
  onSave,
  onOpenCardMaker,
}) => {
  const [routineType, setRoutineType] = useState<'memorize' | 'review'>('memorize');
  const [unitType, setUnitType] = useState<'verses' | 'pages' | 'juz'>('pages');
  const [unitValue, setUnitValue] = useState<number>(5);
  const [selectedSurah, setSelectedSurah] = useState<string>('سورة البقرة');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderTime, setReminderTime] = useState<string>('20:00');
  const [enableNotification, setEnableNotification] = useState<boolean>(false);

  const toggleDaySelection = (dayIndex: number) => {
    if (selectedDays.includes(dayIndex)) {
      setSelectedDays(selectedDays.filter(d => d !== dayIndex));
    } else {
      setSelectedDays([...selectedDays, dayIndex].sort());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoutine: MemorizationRoutine = {
      id: safeUUID(),
      type: routineType,
      unitType,
      unitValue: Number(unitValue) || 1,
      surahOrJuz: selectedSurah,
      reminderDays: selectedDays,
      reminderTime,
      notificationEnabled: enableNotification,
      createdAt: todayStr,
    };
    onSave(newRoutine);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form 
        onSubmit={handleSubmit} 
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-routine-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-xl animate-fadeIn"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 id="add-routine-title" className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            إضافة ورد حفظ أو مراجعة
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة إضافة الورد"
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type: Memorize vs Review */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            نوع الورد
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRoutineType('memorize')}
              className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                routineType === 'memorize'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              📗 حفظ جديد
            </button>

            <button
              type="button"
              onClick={() => setRoutineType('review')}
              className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                routineType === 'review'
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              📘 مراجعة
            </button>
          </div>
        </div>

        {/* Unit & Amount */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              الوحدة
            </label>
            <select
              value={unitType}
              onChange={(e) => setUnitType(e.target.value as 'verses' | 'pages' | 'juz')}
              aria-label="نوع وحدة الورد"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 cursor-pointer"
            >
              <option value="verses">آيات</option>
              <option value="pages">صفحات</option>
              <option value="juz">أجزاء</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              الكمية
            </label>
            <input
              type="number"
              min="1"
              max="604"
              value={unitValue}
              onChange={(e) => setUnitValue(Number(e.target.value))}
              aria-label="كمية الورد"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        {/* Surah Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
            السورة / الجزء (اختياري)
          </label>
          <select
            value={selectedSurah}
            onChange={(e) => setSelectedSurah(e.target.value)}
            aria-label="اختيار السورة أو الجزء للورد"
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-100 cursor-pointer"
          >
            {SURAHS_LIST.map(s => (
              <option key={s.number} value={`سورة ${s.name}`}>
                سورة {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Days Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
            أيام التذكير
          </label>
          <div className="flex items-center justify-between gap-1">
            {WEEK_DAYS.map((item, idx) => {
              const isSelected = selectedDays.includes(item.dayNum);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDaySelection(item.dayNum)}
                  aria-label={`تذكير يوم ${item.name} (${isSelected ? 'مفعل' : 'غير مفعل'})`}
                  className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {item.char}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time & Notification */}
        <div className="grid grid-cols-2 gap-3 items-center pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              وقت التذكير
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              aria-label="وقت تذكير الورد"
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <input
              type="checkbox"
              id="notifToggle"
              checked={enableNotification}
              onChange={(e) => setEnableNotification(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="notifToggle" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
              تفعيل التنبيه
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm"
          >
            حفظ الورد
          </button>

          <button
            type="button"
            onClick={onOpenCardMaker}
            className="py-3 px-4 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-amber-200 dark:border-amber-800"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>شارك كبطاقة</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddRoutineModal;
