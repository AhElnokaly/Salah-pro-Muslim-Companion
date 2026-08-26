import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { APP_VERSION } from '../version';

interface VersionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionInfoModal({ isOpen, onClose }: VersionInfoModalProps) {
  if (!isOpen) return null;

  const handleForceUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
    window.location.reload();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#161d26] w-full max-w-sm rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-right"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">إصدار تطبيق هِمَّتِي</h3>
                <span className="text-[10px] text-indigo-100 font-bold">معلومات البناء والتحديثات</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 bg-black/20 hover:bg-black/30 text-white/90 rounded-full transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-4 space-y-3.5 text-right">
            {/* Version Pill Banner */}
            <div className="bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 p-3 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block">الإصدار الحالي:</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">v{APP_VERSION.version} (بناء {APP_VERSION.buildNumber})</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-extrabold border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                مستقر
              </span>
            </div>

            {/* Release Description */}
            <div className="space-y-1.5 text-right">
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 block">
                {APP_VERSION.releaseName} ({APP_VERSION.releaseDate})
              </span>
              <ul className="space-y-1.5">
                {APP_VERSION.changelog.map((item, idx) => (
                  <li key={idx} className="text-[10.5px] font-medium text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed text-right">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Force Refresh Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleForceUpdate}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>إعادة تحميل وتحديث الذاكرة المؤقتة 🔄</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
