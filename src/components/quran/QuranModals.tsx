/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Target, X, Sliders } from 'lucide-react';
import { QuranKhatma } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';

export interface AnnualGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHijriYear: number;
  goalInput: number;
  setGoalInput: (val: number) => void;
  onSaveGoal: (e: React.FormEvent) => void;
}

export function AnnualGoalModal({
  isOpen,
  onClose,
  currentHijriYear,
  goalInput,
  setGoalInput,
  onSaveGoal
}: AnnualGoalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form onSubmit={onSaveGoal} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            تحديد الهدف السنوي للختمات
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة تحديد الهدف السنوي"
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            كام ختمة ناوي تخلصها لسنة {toArabicNumbers(currentHijriYear)}هـ؟
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={goalInput}
            onChange={(e) => setGoalInput(Number(e.target.value))}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-800 dark:text-slate-100 text-center"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-sm"
          >
            حفظ الهدف
          </button>
        </div>
      </form>
    </div>
  );
}

export interface CreateKhatmaModalProps {
  isOpen: boolean;
  onClose: () => void;
  khatmaName: string;
  setKhatmaName: (val: string) => void;
  durationDays: number;
  setDurationDays: (val: number) => void;
  onCreateKhatma: (e: React.FormEvent) => void;
}

export function CreateKhatmaModal({
  isOpen,
  onClose,
  khatmaName,
  setKhatmaName,
  durationDays,
  setDurationDays,
  onCreateKhatma
}: CreateKhatmaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form onSubmit={onCreateKhatma} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
            تخطيط وبدء ختمة جديدة
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة بدء ختمة جديدة"
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">اسم الختمة:</label>
            <input
              type="text"
              required
              value={khatmaName}
              onChange={(e) => setKhatmaName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 dark:text-slate-300 mb-1">المدة المقترحة (يوم):</label>
            <input
              type="number"
              required
              min={1}
              max={365}
              value={isNaN(durationDays) ? '' : durationDays}
              onChange={(e) => setDurationDays(parseInt(e.target.value))}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-sm"
          >
            بدء الختمة المباركة
          </button>
        </div>
      </form>
    </div>
  );
}

export interface UpdatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  newPageVal: number;
  setNewPageVal: (val: number) => void;
  onUpdatePage: (e: React.FormEvent) => void;
}

export function UpdatePageModal({
  isOpen,
  onClose,
  newPageVal,
  setNewPageVal,
  onUpdatePage
}: UpdatePageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <form onSubmit={onUpdatePage} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-xl animate-fadeIn">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 text-center">
          تحديث الصفحة الحالية
        </h3>
        
        <div className="text-center space-y-2">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
            أدخل رقم الصفحة الأخيرة التي قرأتها (من ١ إلى ٦٠٤):
          </label>
          <input
            type="number"
            required
            min={0}
            max={604}
            value={isNaN(newPageVal) ? '' : newPageVal}
            onChange={(e) => setNewPageVal(parseInt(e.target.value))}
            className="w-24 text-center mx-auto p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-xl font-extrabold text-slate-800 dark:text-white"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-xs cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-sm"
          >
            حفظ الورد
          </button>
        </div>
      </form>
    </div>
  );
}

export interface CatchUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeKhatma?: QuranKhatma;
  onApplyExtendDays: (addDays: number) => void;
}

export function CatchUpModal({
  isOpen,
  onClose,
  activeKhatma,
  onApplyExtendDays
}: CatchUpModalProps) {
  if (!isOpen || !activeKhatma) return null;

  const start = new Date(activeKhatma.startDate);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(1, activeKhatma.durationDays - diffDays);
  const remainingPages = Math.max(0, activeKhatma.totalPages - activeKhatma.currentPage);
  const originalDailyGoal = Math.max(1, Math.ceil(activeKhatma.totalPages / activeKhatma.durationDays));
  const neededDaysForOriginalTarget = Math.ceil(remainingPages / originalDailyGoal);
  const extraDaysNeededForOriginal = Math.max(1, neededDaysForOriginalTarget - daysRemaining);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              تعديل الجدول والورد المرن 🌸
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق نافذة تعديل الجدول والورد"
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl space-y-2 border border-emerald-200/80">
            <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
              العودة للهدف المريح الأصلي ({toArabicNumbers(originalDailyGoal)} صفحة/يوم)
            </span>
            <p className="text-slate-600 dark:text-slate-300">
              إضافة +{toArabicNumbers(extraDaysNeededForOriginal)} أيام لجدول الختمة للعودة لمعدل مريح.
            </p>
            <button
              type="button"
              onClick={() => onApplyExtendDays(extraDaysNeededForOriginal)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer"
            >
              تطبيق التمديد المريح ✨
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs cursor-pointer"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}

export interface AttributionChoiceModalProps {
  pendingChoice: {
    khatma: QuranKhatma;
    years: number[];
  } | null;
  onChooseYear: (chosenYear: number) => void;
}

export function AttributionChoiceModal({
  pendingChoice,
  onChooseYear
}: AttributionChoiceModalProps) {
  if (!pendingChoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-xl text-center">
        <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
          نسب السنة الهجرية للختمة
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          تم إنجاز جهد هذه الختمة مناصفة بين سنتين هجريتين. تحب تحسبها على أي سنة؟
        </p>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {pendingChoice.years.map(yr => (
            <button
              key={yr}
              type="button"
              onClick={() => onChooseYear(yr)}
              className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs cursor-pointer shadow-sm"
            >
              سنة {toArabicNumbers(yr)}هـ
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
