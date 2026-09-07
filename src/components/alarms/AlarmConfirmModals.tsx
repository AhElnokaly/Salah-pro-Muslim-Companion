/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { AlarmConfig } from '../../types';

interface AlarmDeleteConfirmModalProps {
  alarmToDelete: AlarmConfig | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const AlarmDeleteConfirmModal: React.FC<AlarmDeleteConfirmModalProps> = ({
  alarmToDelete,
  onClose,
  onConfirm,
}) => {
  if (!alarmToDelete) return null;

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#151c27] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center">
          <Trash2 className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-850 dark:text-slate-100">
            حذف المنبه
          </h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            هل أنت متأكد من رغبتك في حذف تنبيه <span className="text-rose-600 dark:text-rose-400 font-black">"{alarmToDelete.title}"</span>؟
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2.5 px-4 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            نعم، احذف
          </button>
        </div>
      </div>
    </div>
  );
};

interface AlarmRestoreConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AlarmRestoreConfirmModal: React.FC<AlarmRestoreConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#151c27] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
          <RotateCcw className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-850 dark:text-slate-100">
            استعادة التنبيهات الافتراضية
          </h3>
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            هل تريد استعادة قائمة التنبيهات الافتراضية (قبل الصلاة، بعد الصلاة، الضحى، قيام الليل)؟
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-xs font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="py-2.5 px-4 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            استعادة الآن
          </button>
        </div>
      </div>
    </div>
  );
};
