/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Plus, RotateCcw } from 'lucide-react';

interface AlarmEmptyStateProps {
  onOpenAddModal: () => void;
  onRestoreDefaults: () => void;
}

export const AlarmEmptyState: React.FC<AlarmEmptyStateProps> = ({
  onOpenAddModal,
  onRestoreDefaults,
}) => {
  return (
    <div className="text-center py-16 px-4 bg-white dark:bg-[#141b24] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
      <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
        <Bell className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-black text-slate-800 dark:text-slate-200">
          لا توجد تنبيهات حالياً
        </h3>
        <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto">
          أضف تنبيهاً جديداً قبل أو بعد الصلوات، أو استعد التنبيهات المقترحة بنقرة زر واحدة
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          إضافة تنبيه مخصص
        </button>
        <button
          type="button"
          onClick={onRestoreDefaults}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          استعادة الافتراضية
        </button>
      </div>
    </div>
  );
};

export default AlarmEmptyState;
