/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, BookOpen, RotateCcw, Trash2, Share2 } from 'lucide-react';
import ExpandableCard from '../ExpandableCard';
import { MemorizationRoutine } from '../../../types';
import { toArabicNumbers } from '../../../utils/hijri';

interface ActiveRoutinesSectionProps {
  routines: MemorizationRoutine[];
  onOpenAddModal: () => void;
  onDeleteRoutine: (id: string) => void;
  onOpenVerseCardMaker: () => void;
}

export const ActiveRoutinesSection: React.FC<ActiveRoutinesSectionProps> = ({
  routines,
  onOpenAddModal,
  onDeleteRoutine,
  onOpenVerseCardMaker,
}) => {
  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
          أوراد الحفظ والمراجعة النشطة
        </h3>
        <button
          type="button"
          onClick={onOpenAddModal}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-all cursor-pointer"
          aria-label="إضافة ورد جديد للحفظ أو المراجعة"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          <span>ورد جديد</span>
        </button>
      </div>

      {routines.length === 0 ? (
        <div className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-xs">
          لا توجد أوراد حفظ أو مراجعة مخصصة بعد. اضغط على (+ ورد جديد) لبدء خطتك.
        </div>
      ) : (
        routines.map((routine) => (
          <ExpandableCard
            key={routine.id}
            title={
              <div className="flex items-center justify-between">
                <span>
                  {routine.type === 'memorize' ? '📗 حفظ جديد' : '📘 مراجعة'} — {routine.surahOrJuz || 'الورد العام'}
                </span>
              </div>
            }
            subtitle={`${toArabicNumbers(routine.unitValue)} ${
              routine.unitType === 'pages' ? 'صفحة' : routine.unitType === 'verses' ? 'آية' : 'جزء'
            } · ${routine.reminderDays.length === 7 ? 'يومياً' : `${routine.reminderDays.length} أيام في الأسبوع`}`}
            icon={
              routine.type === 'memorize' ? (
                <BookOpen className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <RotateCcw className="w-4 h-4 text-teal-600" aria-hidden="true" />
              )
            }
            headerAction={
              <button
                type="button"
                onClick={() => onDeleteRoutine(routine.id)}
                aria-label={`حذف ورد ${routine.surahOrJuz || 'الحفظ'}`}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                title="حذف الورد"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            }
          >
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span>أيام التذكير:</span>
                <span className="font-bold">
                  {routine.reminderDays.length === 7
                    ? 'كل أيام الأسبوع'
                    : routine.reminderDays.map((d) => daysOfWeek[d]).join('، ')}
                </span>
              </div>

              {routine.reminderTime && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>وقت التنبيه:</span>
                  <span className="font-bold">{routine.reminderTime}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={onOpenVerseCardMaker}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>شارك كبطاقة آية</span>
                </button>
              </div>
            </div>
          </ExpandableCard>
        ))
      )}
    </div>
  );
};

export default ActiveRoutinesSection;
