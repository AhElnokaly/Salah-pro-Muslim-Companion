import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Smartphone, Download } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  showManualSteps: boolean;
  setShowManualSteps: (show: boolean) => void;
  onDirectInstall: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  showManualSteps,
  setShowManualSteps,
  onDirectInstall
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative text-end flex flex-col gap-4 text-slate-800 dark:text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">تثبيت تطبيق هِمَّتِي 📲</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-all cursor-pointer text-xs font-black"
            >
              ✕
            </button>
          </div>

          {/* App Preview Card */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <img 
              src="/muslim_companion_icon.jpg" 
              alt="Hemmaty App" 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/hemmaty_logo.jpg'; }}
              className="w-12 h-12 rounded-2xl object-cover shadow-md border border-amber-500/30 shrink-0"
            />
            <div className="text-right">
              <h4 className="text-xs font-black text-slate-900 dark:text-white">تطبيق هِمَّتِي</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">تطبيق إيماني متكامل ومجاني بالكامل</p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 font-bold leading-relaxed">
            احصل على أفضل تجربة بدون إعلانات وبدون إنترنت مباشرة على شاشتك الرئيسية!
          </p>

          <div className="space-y-2">
            <button
              onClick={onDirectInstall}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-black text-xs rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-center flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>تثبيت التطبيق تلقائياً الآن 📥</span>
            </button>

            <button
              onClick={() => setShowManualSteps(!showManualSteps)}
              className="w-full py-2 px-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-extrabold text-[10px] bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-all cursor-pointer text-center"
            >
              {showManualSteps ? "إخفاء خطوات التثبيت اليدوي ✕" : "مشاهدة خطوات التثبيت اليدوي البديلة 📋"}
            </button>
          </div>

          {/* Collapsible Manual Steps */}
          {showManualSteps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 overflow-hidden"
            >
              {/* Option 1: iOS Safari */}
              <div className="border-b border-slate-100 dark:border-slate-800/60 pb-3">
                <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1">
                  <span>🍎 أجهزة آيفون وآيباد (iOS Safari):</span>
                </h4>
                <ul className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold space-y-1 pe-4 list-decimal">
                  <li>اضغط على زر المشاركة 📤 في أسفل أو أعلى المتصفح.</li>
                  <li>اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen) ➕.</li>
                  <li>اضغط على "إضافة" (Add) في الزاوية لتثبيته.</li>
                </ul>
              </div>

              {/* Option 2: Android / Chrome */}
              <div className="pb-1">
                <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                  <span>🤖 أجهزة أندرويد والكمبيوتر:</span>
                </h4>
                <ul className="text-[10px] text-slate-600 dark:text-slate-300 font-extrabold space-y-1 pe-4 list-decimal">
                  <li>انقر على قائمة المتصفح (الثلاث نقاط ⋮) في الزاوية.</li>
                  <li>اختر "تثبيت التطبيق" (Install App).</li>
                  <li>قم بتأكيد التثبيت ليظهر على الشاشة الرئيسية!</li>
                </ul>
              </div>
            </motion.div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
            <button
              onClick={onClose}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl transition-all shadow-sm cursor-pointer text-center"
            >
              فهمت، شكراً لك 🤍
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PwaInstallModal;
