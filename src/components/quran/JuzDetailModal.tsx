/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, X } from 'lucide-react';
import { JuzProgress } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';
import { JUZ_NAMES } from '../../data/quranData';

export interface JuzDetailModalProps {
  selectedJuzDetail: JuzProgress;
  onClose: () => void;
  onToggleStatus: () => void;
  onLogReview: (rating: 'excellent' | 'medium' | 'needs_repeat') => void;
}

export const JuzDetailModal: React.FC<JuzDetailModalProps> = ({
  selectedJuzDetail,
  onClose,
  onToggleStatus,
  onLogReview,
}) => {
  const isMemorized = selectedJuzDetail.status === 'memorized';
  const juzName = JUZ_NAMES[selectedJuzDetail.juzNumber - 1] || '';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="juz-detail-title"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-xl animate-fadeIn"
      >
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 id="juz-detail-title" className="font-bold text-base text-slate-800 dark:text-slate-100">
              تفاصيل الجزء {toArabicNumbers(selectedJuzDetail.juzNumber)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق تفاصيل الجزء"
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          مطلع الجزء: <span className="font-bold text-slate-800 dark:text-slate-200">{juzName}</span>
        </div>

        <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span>حالة الحفظ:</span>
            <button
              type="button"
              onClick={onToggleStatus}
              aria-label={isMemorized ? 'تعليم الجزء كغير محفوظ' : 'تعليم الجزء كمحفوظ'}
              className={`px-3 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                isMemorized
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isMemorized ? '✓ محفوظ' : '+ تعليم كمحفوظ'}
            </button>
          </div>

          {isMemorized && (
            <>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                <span>آخر مراجعة:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  {selectedJuzDetail.lastReviewedDate || selectedJuzDetail.memorizedDate || 'لم تسجل'}
                </span>
              </div>

              <div className="pt-2">
                <div className="font-semibold mb-2 text-slate-700 dark:text-slate-200">
                  سجل مراجعة الجزء الآن وقَيّم الحفظ:
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onLogReview('excellent')}
                    aria-label="تقييم الحفظ ممتاز"
                    className="py-2 px-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-bold rounded-xl text-[11px] cursor-pointer"
                  >
                    ممتاز ✨
                  </button>

                  <button
                    type="button"
                    onClick={() => onLogReview('medium')}
                    aria-label="تقييم الحفظ متوسط"
                    className="py-2 px-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold rounded-xl text-[11px] cursor-pointer"
                  >
                    متوسط ⚖️
                  </button>

                  <button
                    type="button"
                    onClick={() => onLogReview('needs_repeat')}
                    aria-label="تقييم الحفظ يحتاج تكرار قريب"
                    className="py-2 px-1 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 font-bold rounded-xl text-[11px] cursor-pointer"
                  >
                    تكرار قريب 🔄
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق"
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
};

export default JuzDetailModal;
