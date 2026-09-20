import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, ExternalLink, Sparkles, AlertCircle, FileDown, CheckCircle2, Loader2 } from 'lucide-react';
import { AppReleaseInfo, compareSemver } from '../../services/updateChecker';
import { CURRENT_RELEASE } from '../../data/changelog';
import { downloadAndInstallAppUpdate } from '../../services/athanAlarmPlugin';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Strictly ensure the release is newer than current running version
  if (!isOpen || !releaseInfo || compareSemver(releaseInfo.version, CURRENT_RELEASE.version) <= 0) {
    return null;
  }

  const handleDownload = async () => {
    const url = releaseInfo.apkDownloadUrl || releaseInfo.htmlUrl;
    if (!releaseInfo.apkDownloadUrl) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMsg(null);
      setStatusMessage('جارٍ تنزيل ملف التحديث...');
      setDownloadProgress(0);

      const result = await downloadAndInstallAppUpdate(releaseInfo.apkDownloadUrl, (progress) => {
        setDownloadProgress(progress);
        setStatusMessage(`جارٍ تنزيل التحديث (${progress}%)...`);
      });

      if (!result.success && result.message) {
        // Fallback message or error
        setErrorMsg(result.message);
      } else {
        setStatusMessage('تم التنزيل بنجاح! جارٍ فتح مثبت الحزم...');
      }
    } catch (err: any) {
      console.error('Update install error:', err);
      setErrorMsg('حدث خطأ أثناء التنزيل التلقائي. يمكنك التنزيل عبر المتصفح.');
    } finally {
      setIsUpdating(false);
    }
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
              <div className="p-3 bg-slate-50 dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
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

                {/* Progress bar during download */}
                {isUpdating && downloadProgress !== null && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <span>{statusMessage}</span>
                      <span className="font-mono">{downloadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-200 rounded-full"
                        style={{ width: `${downloadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-500/20 rounded-xl text-[11px] font-bold text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Safety notice */}
            <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-500/20 rounded-xl text-[10.5px] font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                يتم التنزيل والتثبيت مباشرة من داخل التطبيق فوق نسختك الحالية دون أي مساس بصلواتك الفائتة أو إعداداتك.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-50 dark:bg-[#121820] border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2 shrink-0">
            <button
              type="button"
              disabled={isUpdating}
              onClick={handleDownload}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusMessage || 'جارٍ التنزيل والتثبيت...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تحديث وتثبيت الآن من داخل التطبيق 🚀</span>
                </>
              )}
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
                disabled={isUpdating}
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
