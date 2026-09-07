/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export interface DhikrCelebrationProps {
  categoryArabicName: string;
  isAfterPrayer?: boolean;
  postPrayerName?: string;
  onReturn: () => void;
}

export const DhikrCelebration: React.FC<DhikrCelebrationProps> = ({
  categoryArabicName,
  isAfterPrayer = false,
  postPrayerName,
  onReturn,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-[#161d26] rounded-3xl p-8 border border-slate-100 dark:border-slate-800 text-center space-y-6 flex flex-col items-center shadow-lg"
    >
      <div className="inline-flex p-5 bg-gradient-to-tr from-emerald-500 to-teal-600 text-white rounded-full shadow-lg shadow-emerald-100 dark:shadow-none animate-bounce">
        <CheckCircle2 className="w-12 h-12" />
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-black text-slate-800 dark:text-white">تقبل الله طاعاتكم وغفر ذنوبكم!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed font-semibold">
          لقد أتممت قراءة {categoryArabicName} {isAfterPrayer && postPrayerName ? `لصلاة (${postPrayerName})` : ''} بنجاح، جعلها الله حصناً حصيناً وحفظاً مباركاً 🤍
        </p>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 italic font-bold bg-indigo-50/50 dark:bg-indigo-950/20 py-2 px-4 rounded-xl inline-block mt-2">
          &quot;ألا بذكرِ الله تطمئنُّ القلوب&quot;
        </p>
      </div>
      <button
        onClick={onReturn}
        className="py-3 px-8 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-extrabold rounded-2xl text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
      >
        العودة لمحطات الأذكار الأخرى
      </button>
    </motion.div>
  );
};

export default DhikrCelebration;
