import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, AlertTriangle } from 'lucide-react';

interface AppFeedbackOverlaysProps {
  toastMessage: string | null;
  fiqhWarning: { title: string; removedReasons: string[] } | null;
  onDismissFiqhWarning: () => void;
}

export const AppFeedbackOverlays: React.FC<AppFeedbackOverlaysProps> = ({
  toastMessage,
  fiqhWarning,
  onDismissFiqhWarning
}) => {
  return (
    <>
      {/* Premium Glassmorphic In-App Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 start-4 end-4 md:start-auto md:end-4 md:max-w-md bg-slate-900/95 dark:bg-[#161d26]/98 backdrop-blur-md text-white px-5 py-4 rounded-2xl border border-slate-700/50 shadow-2xl z-50 flex items-start gap-3.5 text-end font-sans"
            dir="rtl"
          >
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
            </div>
            <div className="space-y-1">
              <h5 className="text-[10px] font-black tracking-wider text-indigo-300 uppercase">مساعد التخصيص الذكي</h5>
              <p className="text-xs text-slate-100 font-extrabold leading-relaxed">{toastMessage}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fiqh Warning Modal for prohibited fasting days */}
      {fiqhWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
          <div className="bg-white dark:bg-[#18202c] border border-amber-500/30 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-end">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-black text-base">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <h3>{fiqhWarning.title}</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
              يَحْرُم صيام أيام العيدين وأيام التشريق شرعاً. تم إلغاء صيام الأيام التالية تلقائياً من جدولك:
            </p>
            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-3 rounded-2xl border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-bold space-y-1">
              {fiqhWarning.removedReasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span>•</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-black text-center">
              نسأل الله أن يتقبل طاعتكم وفرحكم بالعيد! 🤲🌸
            </p>
            <button
              onClick={onDismissFiqhWarning}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              فهمت
            </button>
          </div>
        </div>
      )}
    </>
  );
};
