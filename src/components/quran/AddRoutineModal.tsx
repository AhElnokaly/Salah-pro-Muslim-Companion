/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, BookOpen, Clock, Calendar, Sparkles } from 'lucide-react';
import { MemorizationRoutine } from '../../types';
import { safeUUID } from '../../utils/uuid';
import { SURAHS_LIST } from '../../data/quranData';

export interface AddRoutineModalProps {
  todayStr: string;
  onClose: () => void;
  onSave: (routine: MemorizationRoutine) => void;
  onOpenCardMaker?: () => void;
}

export const AddRoutineModal: React.FC<AddRoutineModalProps> = ({
  todayStr,
  onClose,
  onSave,
  onOpenCardMaker,
}) => {
  const [type, setType] = useState<'memorize' | 'review'>('memorize');
  const [unitType, setUnitType] = useState<'verses' | 'pages' | 'juz'>('pages');
  const [unitValue, setUnitValue] = useState<number>(1);
  const [selectedSurah, setSelectedSurah] = useState<string>(SURAHS_LIST[0]?.name || 'الفاتحة');
  const [reminderTime, setReminderTime] = useState<string>('06:30');
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoutine: MemorizationRoutine = {
      id: safeUUID(),
      type,
      unitType,
      unitValue: Math.max(1, unitValue),
      surahOrJuz: selectedSurah,
      reminderDays: [0, 1, 2, 3, 4, 5, 6],
      reminderTime,
      notificationEnabled,
      createdAt: todayStr,
    };
    onSave(newRoutine);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-[#121922] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-xl my-auto animate-fadeIn space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-black text-slate-800 dark:text-slate-100">
              إضافة ورد حفظ أو مراجعة 📖
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          {/* Routine Type (Memorize / Review) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
              نوع الورد:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('memorize')}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  type === 'memorize'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                حفظ جديد ✨
              </button>
              <button
                type="button"
                onClick={() => setType('review')}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  type === 'review'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                تثبيت ومراجعة 🔁
              </button>
            </div>
          </div>

          {/* Target Surah */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
              السورة الكريمة:
            </label>
            <select
              value={selectedSurah}
              onChange={(e) => setSelectedSurah(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100"
            >
              {SURAHS_LIST.map((s) => (
                <option key={s.number} value={s.name}>
                  سورة {s.name} ({s.versesCount || s.numberOfAyahs} آية)
                </option>
              ))}
            </select>
          </div>

          {/* Unit Type & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                الوحدة:
              </label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100"
              >
                <option value="pages">صفحات</option>
                <option value="verses">آيات</option>
                <option value="juz">أجزاء</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                الكمية اليومية:
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={unitValue}
                onChange={(e) => setUnitValue(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 text-center"
              />
            </div>
          </div>

          {/* Reminder Time */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
              موعد التذكير اليومي:
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 text-center"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {onOpenCardMaker && (
              <button
                type="button"
                onClick={onOpenCardMaker}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تصميم بطاقة آية</span>
              </button>
            )}

            <div className="flex items-center gap-2 ms-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                حفظ الورد
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoutineModal;
