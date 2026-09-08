import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ExternalLink, Sparkles, AlertCircle, FileDown, CheckCircle2 } from 'lucide-react';
import { AppReleaseInfo } from '../../services/updateChecker';
import { CURRENT_RELEASE } from '../../data/changelog';

interface UpdateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseInfo: AppReleaseInfo | null;
}

export default function UpdateNotificationModal({
  isOpen,
  onClose,
  releaseInfo,
}: UpdateNotificationModalProps) {
  if (!isOpen || !releaseInfo) return null;

  const handleDownload = () => {
    const url = releaseInfo.apkDownloadUrl || releaseInfo.htmlUrl;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        dir="rtl"
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="إشعار توفر تحديث جديد"
          initial={{ opacity: 0, scale: 0.92, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 14 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="bg-white dark:bg-[#161d26] w-full max-w-md rounded-3xl border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl overflow-hidden flex flex-col text-right max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white flex items-center justify-between relative overflow-hidden shrink-0">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-amber-300/15 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner border border-white/20">
                <Download className="w-5 h-5 text-amber-300 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">يتوفر تحديث جديد!</h3>
                  <span className="text-[11px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-xs">
                    v{releaseInfo.version}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-100 font-bold opacity-90 block mt-0.5">
                  نسختك الحالية: v{CURRENT_RELEASE.version}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-black/10 hover:bg-black/20 rounded-full text-white/90 hover:text-white transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* Highlights Card */}
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-300 font-black text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{releaseInfo.name || `إصدار جديد متوفر: v${releaseInfo.version}`}</span>
              </div>

              {releaseInfo.body ? (
                <div className="text-[11px] text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto pr-1">
                  {releaseInfo.body}
                </div>
              ) : (
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  يتضمن هذا الإصدار تحسينات جديدة وإصلاحات مهمة لضمان استقرار التطبيق والأذان.
                </p>
              )}
            </div>

            {/* APK details */}
            {releaseInfo.apkDownloadUrl && (
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-indigo-500" />
                  <span className="truncate max-w-[200px]">{releaseInfo.apkFileName || 'ملف التثبيت (APK)'}</span>
                </div>
                {releaseInfo.apkSizeFormatted && (
                  <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">
                    {releaseInfo.apkSizeFormatted}
                  </span>
                )}
              </div>
            )}

            {/* Safety notice */}
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 rounded-xl text-[10.5px] font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                التحديث متسلسل ومعتمد، وسيثبت مباشرة فوق نسختك الحالية دون أي مساس بصلواتك الفائتة أو إعداداتك المحفوظة.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-[#121820] border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>تحميل وتثبيت التحديث الآن 🚀</span>
            </button>

            <div className="flex items-center justify-between gap-2 pt-1">
              <a
                href={releaseInfo.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10.5px] font-extrabold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 cursor-pointer transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                <span>صفحة الإصدار على GitHub</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="text-[10.5px] font-extrabold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                تحديث لاحقاً
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
