import React from 'react';
import { Download, Loader2, CheckCircle2 } from 'lucide-react';
import { toArabicNumbers } from '../../../utils/hijri';

interface OfflineStorageCardProps {
  storageStats: { count: number; totalMB: string };
  isBulkDownloading: boolean;
  bulkProgress: { current: number; total: number } | null;
  onBatchDownloadDefaults: () => void;
}

export const OfflineStorageCard: React.FC<OfflineStorageCardProps> = ({
  storageStats,
  isBulkDownloading,
  bulkProgress,
  onBatchDownloadDefaults,
}) => {
  return (
    <div className="p-3.5 bg-gradient-to-r from-indigo-900/10 via-slate-900/5 to-emerald-900/10 dark:from-indigo-950/30 dark:via-slate-900/30 dark:to-emerald-950/30 rounded-2xl border border-indigo-200/40 dark:border-indigo-800/40 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-700 dark:text-indigo-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>إدارة التخزين المحلي (أوفلاين)</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
            تم حفظ <strong className="text-emerald-600 dark:text-emerald-400">{toArabicNumbers(storageStats.count)}</strong> أصوات محلياً ({toArabicNumbers(storageStats.totalMB)} ميجابايت). تعمل بدون إنترنت!
          </span>
        </div>

        <button
          type="button"
          onClick={onBatchDownloadDefaults}
          disabled={isBulkDownloading}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          title="تحميل جميع الأصوات الافتراضية دفعة واحدة للعمل بدون اتصال"
        >
          {isBulkDownloading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>
                جارٍ التحميل ({toArabicNumbers(bulkProgress?.current || 0)}/{toArabicNumbers(bulkProgress?.total || 0)})...
              </span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>⚡ تحميل كافة الأساسية أوفلاين</span>
            </>
          )}
        </button>
      </div>

      <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-1.5">
        <span className="text-amber-500 font-bold">💡 ملاحظة ذكية:</span>
        <span>عند تشغيل أي أذان وأنت أونلاين، يتم حفظه تلقائياً أوفلاين بالخلفية ليكون جاهزاً دائماً بدون إنترنت!</span>
      </div>
    </div>
  );
};
