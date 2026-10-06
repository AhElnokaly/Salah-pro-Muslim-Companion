/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, X, ShieldAlert } from 'lucide-react';
import { AthanDiagnosticsSection } from './settings/adhan/AthanDiagnosticsSection';

interface AthanDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  setToastMessage?: (msg: string | null) => void;
}

export const AthanDiagnosticsModal: React.FC<AthanDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  setToastMessage,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm dir-rtl">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="نافذة فحص وتشخيص الأذان والتنبيهات"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="bg-white dark:bg-[#161d26] border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <span>فحص وتشخيص الأذان والتنبيهات</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                    Diagnostics
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  مراقبة استيقاظ المنبهات، سجل الأحداث، وحالة قيود البطارية مع إمكانية نسخ التقرير كاملاً
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="إغلاق نافذة التشخيص"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            <AthanDiagnosticsSection setToastMessage={setToastMessage} />
          </div>

          {/* Modal Footer */}
          <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-500" />
              <span>بيانات تشخيص حية مقروءة مباشرة من نظام التشغيل أندرويد</span>
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AthanDiagnosticsModal;
