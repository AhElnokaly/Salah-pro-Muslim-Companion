import React from 'react';
import { Heart } from 'lucide-react';

interface FastingTrackerBarProps {
  isFasted: boolean;
  onToggleFasting: () => void;
}

export const FastingTrackerBar: React.FC<FastingTrackerBarProps> = ({
  isFasted,
  onToggleFasting
}) => {
  return (
    <div 
      id="fasting-tracker-container" 
      className="bg-white dark:bg-[#161d26] rounded-3xl p-4 border border-[#e2e8f0]/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors duration-300 shadow-xs" 
      dir="rtl"
    >
      <div className="flex items-center gap-3 text-right">
        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl shrink-0">
          <Heart className="w-5 h-5 text-rose-500" />
        </div>
        <div className="space-y-0.5 text-right">
          <h3 className="text-sm font-black text-slate-800 dark:text-white text-right">
            تتبع الصيام اليومي والسنن
          </h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium text-right">
            {isFasted ? 'تم تسجيل صيامك اليوم، تقبل الله منكم صالح الأعمال 🤍' : 'لم تسجل صياماً لليوم بعد (رمضان، الإثنين والخميس، الأيام البيض، إلخ).'}
          </p>
        </div>
      </div>
      
      <button
        type="button"
        onClick={onToggleFasting}
        className={`py-2 px-5 rounded-xl font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer ${
          isFasted 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 dark:shadow-none'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 dark:shadow-none'
        }`}
      >
        {isFasted ? 'صائم بفضل الله ✓' : 'تسجيل صيام اليوم'}
      </button>
    </div>
  );
};
