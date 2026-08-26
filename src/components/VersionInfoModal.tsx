import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, RefreshCw, CheckCircle2, ShieldCheck, History, ArrowRight, Zap, Wrench, Palette } from 'lucide-react';
import { RELEASE_HISTORY, CURRENT_RELEASE, markCurrentVersionAsSeen, ChangelogCategory } from '../data/changelog';

interface VersionInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionInfoModal({ isOpen, onClose }: VersionInfoModalProps) {
  const [showHistory, setShowHistory] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    markCurrentVersionAsSeen();
    onClose();
  };

  const handleForceUpdate = () => {
    markCurrentVersionAsSeen();
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

  const getCategoryBadge = (category: ChangelogCategory) => {
    switch (category) {
      case 'feature':
        return (
          <span className="text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
            <Zap className="w-3 h-3 text-emerald-500" />
            ميزة جديدة
          </span>
        );
      case 'improvement':
        return (
          <span className="text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
            <Palette className="w-3 h-3 text-indigo-500" />
            تحسين مظهر
          </span>
        );
      case 'fix':
        return (
          <span className="text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
            <Wrench className="w-3 h-3 text-amber-500" />
            إصلاح
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="bg-white dark:bg-[#161d26] w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col text-right max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between relative overflow-hidden shrink-0">
            {/* Background Pattern Deco */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-300/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner border border-white/20">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">ما الجديد في هِمَّتِي؟</h3>
                  <span className="text-[10px] bg-amber-400/90 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-xs">
                    v{CURRENT_RELEASE.version}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-100 font-bold opacity-90 block mt-0.5">
                  أحدث المميزات والتحديثات المضافة لخدمتك
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 bg-black/20 hover:bg-black/30 text-white rounded-full transition-all cursor-pointer relative z-10 shrink-0"
              title="إغلاق"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-right flex-1 custom-scrollbar">
            {/* Current Release Banner */}
            {!showHistory ? (
              <div className="space-y-3.5">
                <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-indigo-950/30 border border-emerald-200/60 dark:border-emerald-800/40 p-3.5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-800 dark:text-emerald-300 font-black block">
                      {CURRENT_RELEASE.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block mt-0.5">
                      تاريخ الإصدار: {CURRENT_RELEASE.date} (بناء {CURRENT_RELEASE.buildNumber})
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500 text-white px-2.5 py-1 rounded-lg font-black flex items-center gap-1 shadow-xs shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    محدث الآن
                  </span>
                </div>

                {/* Highlights List */}
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200 block border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    ✨ أبرز الإضافات والتحسينات:
                  </span>
                  <div className="space-y-2 pt-1">
                    {CURRENT_RELEASE.highlights.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 p-3 rounded-2xl flex flex-col gap-1.5 transition-all hover:border-emerald-200 dark:hover:border-emerald-900/50"
                      >
                        <div className="flex items-center justify-between gap-2">
                          {getCategoryBadge(item.category)}
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 leading-relaxed text-right">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Release History View */
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    📜 سجل التحديثات والإصدارات السابقة:
                  </span>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>الرجوع للإصدار الحالي</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-3">
                  {RELEASE_HISTORY.map((rel) => (
                    <div
                      key={rel.version}
                      className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-right"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 pb-1.5">
                        <span className="text-xs font-black text-slate-800 dark:text-white">
                          v{rel.version} - {rel.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{rel.date}</span>
                      </div>
                      <ul className="space-y-1">
                        {rel.highlights.map((h, i) => (
                          <li key={i} className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-start gap-1.5 leading-tight">
                            <span className="text-emerald-500 mt-0.5">•</span>
                            <span>{h.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-[#121820] border-t border-slate-100 dark:border-slate-800/80 space-y-2 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-98 text-center"
            >
              فهمت، ابدأ الاستخدام 🚀
            </button>

            <div className="flex items-center justify-between gap-2 pt-1">
              {!showHistory ? (
                <button
                  type="button"
                  onClick={() => setShowHistory(true)}
                  className="text-[10.5px] font-extrabold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                >
                  <History className="w-3.5 h-3.5 text-indigo-500" />
                  <span>عرض التحديثات السابقة</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={handleForceUpdate}
                className="text-[10.5px] font-extrabold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer transition-all ms-auto"
                title="تحديث الذاكرة المؤقتة"
              >
                <RefreshCw className="w-3 h-3" />
                <span>إعادة التحميل 🔄</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
