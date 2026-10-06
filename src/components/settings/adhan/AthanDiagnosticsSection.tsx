/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  XCircle,
  FileAudio,
  Info,
  Clock,
  AlertTriangle,
  Battery,
  BellRing,
  ShieldAlert,
  ListOrdered,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { resolveMuezzinId } from '../../../utils/muezzinResolver';
import {
  getNativeAthanFiles,
  getLastAthanPlay,
  getAlarmDiagnostics,
  LastAthanPlayRecord,
  AlarmDiagnosticsResult,
} from '../../../services/athanAlarmPlugin';
import { toArabicNumbers } from '../../../utils/hijri';

interface NativeFileInfo {
  path: string;
  exists: boolean;
  sizeBytes: number;
}

const PRAYERS_LIST = [
  { key: 'fajr', label: 'الفجر', prayerName: 'Fajr' },
  { key: 'dhuhr', label: 'الظهر', prayerName: 'Dhuhr' },
  { key: 'asr', label: 'العصر', prayerName: 'Asr' },
  { key: 'maghrib', label: 'المغرب', prayerName: 'Maghrib' },
  { key: 'isha', label: 'العشاء', prayerName: 'Isha' },
  { key: 'general', label: 'العام (الافتراضي)', prayerName: 'general' },
];

export interface AthanDiagnosticsSectionProps {
  setToastMessage?: (msg: string | null) => void;
}

export const AthanDiagnosticsSection: React.FC<AthanDiagnosticsSectionProps> = ({ setToastMessage }) => {
  const [loading, setLoading] = useState(false);
  const [nativeFiles, setNativeFiles] = useState<Record<string, NativeFileInfo>>({});
  const [lastPlay, setLastPlay] = useState<LastAthanPlayRecord | null>(null);
  const [diagnostics, setDiagnostics] = useState<AlarmDiagnosticsResult | null>(null);
  const [copiedType, setCopiedType] = useState<'none' | 'all' | 'events'>('none');

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const [files, playRecord, diag] = await Promise.all([
        getNativeAthanFiles(),
        getLastAthanPlay(),
        getAlarmDiagnostics(),
      ]);
      if (files) {
        setNativeFiles(files);
      }
      setLastPlay(playRecord);
      if (diag) {
        setDiagnostics(diag);
      }
    } catch (err) {
      console.warn('[AthanDiagnostics] Error fetching diagnostics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '٠ بايت';
    if (bytes >= 1024 * 1024) {
      return `${toArabicNumbers((bytes / (1024 * 1024)).toFixed(2))} ميجابايت`;
    }
    return `${toArabicNumbers(Math.round(bytes / 1024))} كيلوبايت`;
  };

  const formatSource = (source?: string): string => {
    switch (source) {
      case 'per-prayer':
        return 'مخصص لكل صلاة (per-prayer)';
      case 'fajr':
        return 'أذان الفجر (fajr)';
      case 'general':
        return 'المؤذن العام (general)';
      case 'raw':
        return 'الملف الافتراضي المدمج (raw)';
      default:
        return source || 'غير محدد';
    }
  };

  const formatTimestamp = (ms?: number): string => {
    if (!ms || ms <= 0) return 'غير متوفر';
    try {
      const d = new Date(ms);
      return toArabicNumbers(
        d.toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }) + ' - ' + d.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      );
    } catch (_e) {
      return String(ms);
    }
  };

  const formatStandbyBucket = (bucket?: number): string => {
    switch (bucket) {
      case 10:
        return 'النشط (Active - 10)';
      case 20:
        return 'مجموعة العمل (Working Set - 20)';
      case 30:
        return 'متكرر (Frequent - 30)';
      case 40:
        return 'نادر (Rare - 40)';
      case 45:
        return 'مقيّد بشدة (Restricted - 45)';
      default:
        return bucket !== undefined && bucket >= 0 ? `فئة (${bucket})` : 'غير محدد / قياسي';
    }
  };

  const hasBatteryOrExactAlarmIssue = Boolean(
    diagnostics &&
    (!diagnostics.isIgnoringBatteryOptimizations || !diagnostics.canScheduleExactAlarms)
  );

  const copyToClipboard = async (text: string, type: 'all' | 'events') => {
    let success = false;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        success = true;
      }
    } catch (_e) {
      success = false;
    }

    if (!success && typeof document !== 'undefined') {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.top = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (_e2) {
        success = false;
      }
    }

    if (success) {
      setCopiedType(type);
      if (setToastMessage) {
        setToastMessage(type === 'all' ? 'تم نسخ تقرير التشخيص الشامل بنجاح ✓' : 'تم نسخ سجل إطلاق التنبيهات بنجاح ✓');
      }
      setTimeout(() => setCopiedType('none'), 3000);
    }
  };

  const generateEventsText = (): string => {
    if (!diagnostics?.fireEvents || diagnostics.fireEvents.length === 0) {
      return 'سجل إطلاق التنبيهات (Fire Events): لا توجد أحداث مسجلة بعد.';
    }
    const lines = [
      `=== سجل إطلاق تنبيهات الأذان (Athan Fire Events Log) ===`,
      `تاريخ الاستخراج: ${new Date().toLocaleString('ar-EG')}`,
      `إجمالي الأحداث المسجلة: ${diagnostics.fireEvents.length}`,
      `--------------------------------------------------`,
    ];
    diagnostics.fireEvents.forEach((evt, idx) => {
      const timeStr = formatTimestamp(evt.timestampMs);
      const decisionArabic = evt.decision === 'played' ? 'تم التشغيل (PLAYED)' : 'تم التخطي (SKIPPED)';
      lines.push(
        `[${idx + 1}] ${timeStr} | صلاة: ${evt.prayerName || evt.prayerKey} (النوع: ${evt.alarmType})`,
        `   القرار: ${decisionArabic}`,
        `   السبب: ${evt.reason}`,
        `--------------------------------------------------`
      );
    });
    return lines.join('\n');
  };

  const generateFullReportText = (): string => {
    const lines = [
      `==================================================`,
      `تقرير تشخيص أذان هِمَّتِي الشامل (Hemmaty Athan Diagnostics)`,
      `التاريخ والوقت: ${new Date().toLocaleString('ar-EG')} (${new Date().toISOString()})`,
      `==================================================`,
      ``,
      `[1] حالة النظام والبطارية (Device & Battery Health):`,
      `• استثناء تحسين استهلاك البطارية: ${diagnostics?.isIgnoringBatteryOptimizations ? 'مستثنى (آمن - Unrestricted)' : 'غير مستثنى (معرض للتجميد والسكون - Optimized)'}`,
      `• إذن المنبهات الدقيقة: ${diagnostics?.canScheduleExactAlarms ? 'ممنوح (Granted)' : 'مفقود (Denied)'}`,
      `• فئة الاستعداد للتطبيق: ${formatStandbyBucket(diagnostics?.standbyBucket)}`,
      `• أقرب منبه AlarmClock مسجل بالنظام: ${diagnostics?.nextAlarmClockMs ? formatTimestamp(diagnostics.nextAlarmClockMs) : 'لا يوجد منبه AlarmClock مسجل'}`,
      ``,
      `[2] سجل إطلاق التنبيهات الأخيرة (Fire Events Log - ${diagnostics?.fireEvents?.length || 0} حدث):`,
    ];

    if (diagnostics?.fireEvents && diagnostics.fireEvents.length > 0) {
      diagnostics.fireEvents.forEach((evt, idx) => {
        lines.push(
          `  ${idx + 1}. [${formatTimestamp(evt.timestampMs)}] ${evt.prayerName || evt.prayerKey} (${evt.alarmType}) - القرار: ${evt.decision} - السبب: ${evt.reason}`
        );
      });
    } else {
      lines.push(`  (لم يتم تسجيل أي حدث إطلاق بعد)`);
    }

    lines.push(
      ``,
      `[3] التنبيهات المجدولة حالياً بالنظام (${diagnostics?.savedAlarms?.length || 0} منبه):`
    );

    if (diagnostics?.savedAlarms && diagnostics.savedAlarms.length > 0) {
      diagnostics.savedAlarms.slice(0, 15).forEach((alarm, idx) => {
        lines.push(
          `  ${idx + 1}. ${alarm.prayerName || alarm.prayerKey} (${alarm.alarmType}) - الوقت: ${formatTimestamp(alarm.timeMs)} - الرمز: ${alarm.requestCode} - نشط: ${alarm.isCurrentlyScheduled ? 'نعم' : 'مخزن'}`
        );
      });
    } else {
      lines.push(`  (لا توجد منبهات مسجلة حالياً)`);
    }

    lines.push(
      ``,
      `[4] سجل آخر أذان تم تشغيله:`,
      `• الصلاة: ${lastPlay?.prayer || 'غير متوفر'}`,
      `• المصدر: ${formatSource(lastPlay?.source)}`,
      `• المقطع: ${lastPlay?.track || 'غير متوفر'}`,
      `• الوقت: ${formatTimestamp(lastPlay?.timestampMs)}`,
      ``,
      `[5] حالة ملفات المؤذنين المخزنة لكل صلاة:`
    );

    PRAYERS_LIST.forEach(({ key, label, prayerName }) => {
      const selectedId = prayerName === 'general' ? resolveMuezzinId('Dhuhr') : resolveMuezzinId(prayerName);
      const nativeInfo = nativeFiles[key];
      const exists = nativeInfo?.exists ? 'متوفر' : 'غير متوفر';
      const size = formatSize(nativeInfo?.sizeBytes || 0);
      const path = nativeInfo?.path || 'لا يوجد';
      lines.push(`• ${label}: معرف المؤذن: ${selectedId} | الحالة: ${exists} (${size}) | المسار: ${path}`);
    });

    lines.push(
      ``,
      `==================================================`
    );

    return lines.join('\n');
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-5 border border-indigo-500/20 space-y-5 transition-colors duration-300">
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">
            تشخيص ملفات الأذان والنظام الأصلي (Athan Diagnostics)
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => copyToClipboard(generateFullReportText(), 'all')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:scale-95 rounded-xl transition-all shadow-xs cursor-pointer"
            title="نسخ تقرير التشخيص بالكامل بما فيه سجل الأحداث وحالة البطارية"
          >
            {copiedType === 'all' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>تم نسخ التقرير ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ التقرير</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={fetchDiagnostics}
            disabled={loading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            title="تحديث بيانات التشخيص"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* 0. Visible Warning for Battery Optimization & Exact Alarms */}
      {hasBatteryOrExactAlarmIssue && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
          <div className="flex items-center gap-2 font-black text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>تنبيه هام لأجهزة سامسونج وأندرويد الحديثة</span>
          </div>
          <p>
            {!diagnostics?.isIgnoringBatteryOptimizations && (
              <span className="block font-bold">
                • تحسين استهلاك البطارية (Battery Optimization) مفعّل للتطبيق. قد تقوم واجهة سامسونج (OneUI) بوضع التطبيق في السكون التام (Sleeping Apps) وتجميد مواقيت الأذان عند قفل الشاشة لعدة ساعات.
              </span>
            )}
            {!diagnostics?.canScheduleExactAlarms && (
              <span className="block font-bold">
                • إذن المنبهات الدقيقة (Exact Alarms) غير ممنوح. لن يتمكن النظام من إطلاق الأذان في الوقت المحدد بدقة.
              </span>
            )}
          </p>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
            يرجى ضبط استهلاك البطارية على &quot;غير مقيّد&quot; (Unrestricted) في إعدادات التطبيق لضمان استيقاظ منبه الأذان في موعده دائماً.
          </p>
        </div>
      )}

      {/* 1. Device System & Battery Status */}
      {diagnostics && (
        <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Battery className="w-4 h-4 text-emerald-500" />
            <span>حالة قيود النظام والبطارية (Device & Battery Health):</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold">استثناء تحسين البطارية:</span>
              <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                diagnostics.isIgnoringBatteryOptimizations
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                  : 'text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40'
              }`}>
                {diagnostics.isIgnoringBatteryOptimizations ? 'مستثنى (آمن) ✓' : 'غير مستثنى (معرض للتجميد) ⚠️'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold">إذن المنبهات الدقيقة:</span>
              <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                diagnostics.canScheduleExactAlarms
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                  : 'text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/40'
              }`}>
                {diagnostics.canScheduleExactAlarms ? 'ممنوح ✓' : 'مفقود ✕'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold">فئة الاستعداد (Standby Bucket):</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">
                {formatStandbyBucket(diagnostics.standbyBucket)}
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold">أقرب منبه مسجل بالنظام (AlarmClock):</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">
                {diagnostics.nextAlarmClockMs > 0 ? formatTimestamp(diagnostics.nextAlarmClockMs) : 'لا يوجد منبه AlarmClock مسجل'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Registered Alarms Currently in System (saved_alarms_json) */}
      {diagnostics && diagnostics.savedAlarms && (
        <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-indigo-500" />
              <span>التنبيهات المجدولة حالياً بالنظام ({toArabicNumbers(diagnostics.savedAlarms.length)}):</span>
            </h4>
          </div>

          {diagnostics.savedAlarms.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {diagnostics.savedAlarms.slice(0, 10).map((alarm, idx) => (
                <div
                  key={`${alarm.requestCode}_${idx}`}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]"
                >
                  <div className="space-x-2 space-x-reverse flex items-center">
                    <span className="font-black text-slate-900 dark:text-white">
                      {alarm.prayerName || alarm.prayerKey}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold">
                      {alarm.alarmType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 dark:text-slate-400 text-[10px]">
                      {formatTimestamp(alarm.timeMs)}
                    </span>
                    {alarm.isCurrentlyScheduled ? (
                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">نشط ✓</span>
                    ) : (
                      <span className="text-slate-400 text-[10px]">مخزن</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-slate-400 text-xs">
              لا توجد تنبيهات مجدولة مسجلة حالياً في الذاكرة.
            </div>
          )}
        </div>
      )}

      {/* 3. Last N Fire Events Log (from AthanAlarmReceiver) */}
      {diagnostics && diagnostics.fireEvents && (
        <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-purple-500" />
              <span>سجل إطلاق التنبيهات الأخير (Athan Fire Events Log):</span>
            </h4>
            <button
              type="button"
              onClick={() => copyToClipboard(generateEventsText(), 'events')}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-all cursor-pointer"
              title="نسخ سجل أحداث إطلاق التنبيهات فقط"
            >
              {copiedType === 'events' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">تم النسخ ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>نسخ الأحداث 📋</span>
                </>
              )}
            </button>
          </div>

          {diagnostics.fireEvents.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {diagnostics.fireEvents.map((evt, idx) => {
                const isPlayed = evt.decision === 'played';
                return (
                  <div
                    key={`${evt.timestampMs}_${idx}`}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-slate-900 dark:text-white">
                          {evt.prayerName || evt.prayerKey}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 font-mono">
                          {evt.alarmType}
                        </span>
                      </div>
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                        isPlayed
                          ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                          : 'text-rose-700 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-950/40'
                      }`}>
                        {isPlayed ? 'تم التشغيل ✓' : 'تم التخطي ✕'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{formatTimestamp(evt.timestampMs)}</span>
                      <span className="font-mono text-slate-400 truncate max-w-[200px]" title={evt.reason}>
                        السبب: {evt.reason}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-slate-400 text-xs">
              لم يتم رصد أي إطلاق تنبيه من قِبل AthanAlarmReceiver حتى الآن في هذا السجل.
            </div>
          )}
        </div>
      )}

      {/* 4. Per-Prayer Native Files Status */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <FileAudio className="w-4 h-4 text-indigo-500" />
          <span>حالة الملفات لكل صلاة (مكتبة النظام الأصلي):</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {PRAYERS_LIST.map(({ key, label, prayerName }) => {
            const selectedId = prayerName === 'general'
              ? resolveMuezzinId('Dhuhr')
              : resolveMuezzinId(prayerName);
            const nativeInfo = nativeFiles[key];
            const exists = nativeInfo?.exists ?? false;
            const size = nativeInfo?.sizeBytes ?? 0;
            const path = nativeInfo?.path || '';

            return (
              <div
                key={key}
                className="bg-white dark:bg-[#161d26] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5 shadow-xs"
              >
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-900 dark:text-white font-black">{label}</span>
                  <span className="flex items-center gap-1">
                    {exists ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md font-black text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        متوفر
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-black text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        غير مخزن محلياً
                      </span>
                    )}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
                  <div className="truncate">
                    <span className="text-slate-400 dark:text-slate-500 font-sans">معرف المؤذن: </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 font-sans">الحجم: </span>
                    <span className="font-bold">{formatSize(size)}</span>
                  </div>
                  {path && (
                    <div className="truncate text-[10px] text-slate-400 dark:text-slate-500 dir-ltr text-right" title={path}>
                      {path}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Last-Played Athan Record */}
      <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span>سجل آخر أذان تم تشغيله (Last Played Track):</span>
        </h4>

        {lastPlay && lastPlay.hasRecord ? (
          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">الصلاة المستهدفة:</span>
              <span className="font-black text-slate-900 dark:text-white">{lastPlay.prayer}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">مصدر الصوت المستخدم:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatSource(lastPlay.source)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">المقطع / الملف:</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">{lastPlay.track || 'غير معروف'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 dark:text-slate-500">وقت التشغيل:</span>
              <span className="font-mono text-[11px]">{formatTimestamp(lastPlay.timestampMs)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-slate-400 dark:text-slate-500 text-xs font-bold">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>لم يتم تسجيل أي تشغيل أذان حتى الآن (سيتم التوثيق تلقائياً عند حلول وقت الصلاة وتشغيل الخدمة).</span>
          </div>
        )}
      </div>
    </div>
  );
};
