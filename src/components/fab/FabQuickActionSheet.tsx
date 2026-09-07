/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { X, Zap, BookOpen, Sparkles, Plus } from 'lucide-react';
import { MosqueIcon } from './MosqueIcon';

export interface FabQuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  activePrayerArabic: string;
  isPrayerLogged: boolean;
  adhkarText: string;
  onQuickLogPrayer: () => void;
  onQuickLogAdhkar: () => void;
  onQuickLogQuran: () => void;
  onQuickTasbeeh: () => void;
}

export const FabQuickActionSheet: React.FC<FabQuickActionSheetProps> = ({
  isOpen,
  onClose,
  activePrayerArabic,
  isPrayerLogged,
  adhkarText,
  onQuickLogPrayer,
  onQuickLogAdhkar,
  onQuickLogQuran,
  onQuickTasbeeh,
}) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className="fixed bottom-24 start-4 end-4 md:start-auto md:end-auto md:w-96 bg-white dark:bg-[#151c27] border-2 border-amber-500/40 rounded-3xl p-5 shadow-2xl z-50 space-y-4"
      dir="rtl"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">لوحة الإنجاز السريع الفوري</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">سجّل عبادتك الآن دون مغادرة الصفحة</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق لوحة الإنجاز السريع"
          className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onQuickLogPrayer}
          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer text-start active:scale-98 ${
            isPrayerLogged
              ? 'bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center shadow-md transition-colors ${
              isPrayerLogged ? 'bg-emerald-600' : 'bg-amber-500'
            }`}>
              <MosqueIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-100">أتممت صلاة {activePrayerArabic} 🕌</div>
              <div className={`text-[10px] font-bold ${
                isPrayerLogged ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {isPrayerLogged ? 'تم تسجيل الصلاة في وقتها بنجاح 🌟' : 'تسجيل الصلاة في وقتها بالجماعة'}
              </div>
            </div>
          </div>
          <div className={`px-2.5 py-1 text-white rounded-xl text-[10px] font-black shadow-xs transition-colors ${
            isPrayerLogged ? 'bg-emerald-600' : 'bg-amber-500'
          }`}>
            {isPrayerLogged ? 'تمت ✔️' : 'تسجيل ⚡'}
          </div>
        </button>

        <button
          type="button"
          onClick={onQuickLogAdhkar}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-indigo-500/15 via-indigo-500/5 to-transparent border border-indigo-500/30 hover:bg-indigo-500/20 transition-all cursor-pointer text-start active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-100">{adhkarText} 📿</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">الانتقال الفوري لقائمة الأذكار</div>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-indigo-600 text-white rounded-xl text-[10px] font-black shadow-xs">
            انتقال ⚡
          </div>
        </button>

        <button
          type="button"
          onClick={onQuickLogQuran}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer text-start active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-100">ورد القرآن اليومي 📖</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">إضافة صفحة/جلسة قراءة اليوم</div>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-emerald-600 text-white rounded-xl text-[10px] font-black shadow-xs">
            إضافة 📖
          </div>
        </button>

        <button
          type="button"
          onClick={onQuickTasbeeh}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-transparent border border-teal-500/30 hover:bg-teal-500/20 transition-all cursor-pointer text-start active:scale-98"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-100">تسبيح واستغفار سريع 📿</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">تسجيل +10 تسبيحات فورية من أي مكان</div>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-teal-600 text-white rounded-xl text-[10px] font-black shadow-xs">
            +10 تسبيح ⚡
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default FabQuickActionSheet;
