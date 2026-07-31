import React from 'react';
import { Bell } from 'lucide-react';
import { toArabicNumbers } from '../utils/hijri';
import type { AlarmConfig } from '../types';

interface CustomAlarmOverlayProps {
  activeRingingAlarm: AlarmConfig | null;
  onSnooze: () => void;
  onStop: () => void;
}

export const CustomAlarmOverlay: React.FC<CustomAlarmOverlayProps> = ({
  activeRingingAlarm,
  onSnooze,
  onStop
}) => {
  if (!activeRingingAlarm) return null;

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-white dark:bg-[#161d26] border border-indigo-500/30 w-full max-w-sm rounded-3xl p-6 text-center space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 start-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -translate-x-5 -translate-y-5" />
        
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 animate-bounce">
          <Bell className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base font-black text-slate-800 dark:text-white">تنبيه مخصص: {activeRingingAlarm.title}</h3>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-black font-mono">الوقت الحالي: {toArabicNumbers(activeRingingAlarm.time)}</p>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold leading-relaxed">
          تذكير مبارك من رفيق المسلم للقيام بالعبادة المخصصة والتقرب إلى الله سبحانه وتعالى.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onSnooze}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-black cursor-pointer transition-all active:scale-95"
          >
            تأجيل ٥ دقائق
          </button>
          <button
            onClick={onStop}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95"
          >
            إيقاف الرنين
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlarmOverlay;
