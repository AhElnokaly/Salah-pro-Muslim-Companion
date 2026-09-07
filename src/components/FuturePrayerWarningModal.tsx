import React from 'react';
import { PrayerName } from '../types';
import { getArabicPrayerName } from '../utils/prayerCalc';

interface FuturePrayerWarningModalProps {
  prayerName: PrayerName;
  onClose: () => void;
  onProceedTravel: (prayerName: PrayerName) => void;
  now: Date;
}

export const FuturePrayerWarningModal: React.FC<FuturePrayerWarningModalProps> = ({
  prayerName,
  onClose,
  onProceedTravel,
  now,
}) => {
  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
      <div 
        role="dialog"
        aria-modal="true"
        aria-label="تنبيه وقت الصلاة المستقبلي"
        className="bg-white dark:bg-[#161d26] w-full max-w-sm rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl text-center space-y-4"
      >
        <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto text-2xl">
          ✈️
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-800 dark:text-white">
            لم يحن وقت صلاة {getArabicPrayerName(prayerName, now)} بعد
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
            مواقيت الصلاة محددة شرعاً بمواعيد فلكية دقيقة لموقعك الحالي. لا يصح شرعاً أداء الصلاة أو تسجيلها قبل دخول وقتها إلا في حالات السفر (الجمع والقصر).
          </p>
        </div>
        
        <div className="flex flex-col gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold rounded-xl text-xs transition-all cursor-pointer"
          >
            حسناً، سأسجلها في وقتها
          </button>
          <button
            type="button"
            onClick={() => onProceedTravel(prayerName)}
            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-[11px] transition-all cursor-pointer border border-indigo-100/30 dark:border-indigo-950/50"
          >
            أنا في سفر (رخصة الجمع والقصر)
          </button>
        </div>
      </div>
    </div>
  );
};
