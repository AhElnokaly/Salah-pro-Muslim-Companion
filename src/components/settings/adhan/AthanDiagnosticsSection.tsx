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
  FileText,
  ScrollText,
  FlaskConical,
  Play,
  Square,
  CheckSquare,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { resolveMuezzinId } from '../../../utils/muezzinResolver';
import {
  getNativeAthanFiles,
  getLastAthanPlay,
  getAlarmDiagnostics,
  getNativeEventLog,
  LastAthanPlayRecord,
  AlarmDiagnosticsResult,
  NativeLogEvent,
  groupScheduledAlarmsByType,
} from '../../../services/athanAlarmPlugin';
import { toArabicNumbers } from '../../../utils/hijri';
import { diagRunnerInstance, getCollectableBannerMessage } from '../../../diagnostics/tests/diagRunner';
import { TEST_A_SPEC } from '../../../diagnostics/tests/specs/testA_previewSource';
import { TEST_B_SPEC } from '../../../diagnostics/tests/specs/testB_khushuCustomAlarm';
import { TEST_E_SPEC } from '../../../diagnostics/tests/specs/testE_khushuRestoreSafety';
import { DiagRunState, DiagResult } from '../../../diagnostics/tests/diagTypes';
import { safeGetJSON } from '../../../utils/storage';
import { AlarmConfig, AppSettings } from '../../../types';
import { KhushuMode } from '../../../services/khushuModePlugin';
import { StorageFacade } from '../../../domain/storage/StorageFacade';
import { resolveAthanTimes } from '../../../diagnostics/resolveAthanTimes';
import { APP_VERSION } from '../../../version';

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
  const [nativeLogs, setNativeLogs] = useState<NativeLogEvent[]>([]);
  const [isDndGranted, setIsDndGranted] = useState<boolean | null>(null);
  const [copiedType, setCopiedType] = useState<'none' | 'all' | 'events' | 'nativeLogs'>('none');

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    try {
      const [files, playRecord, diag, logs, dndPerm] = await Promise.all([
        getNativeAthanFiles(),
        getLastAthanPlay(),
        getAlarmDiagnostics(),
        getNativeEventLog(100),
        KhushuMode.checkPermission().catch(() => null),
      ]);

      const dndStatus = (dndPerm && typeof dndPerm.granted === 'boolean') ? dndPerm.granted : null;

      if (files) {
        setNativeFiles(files);
      }
      setLastPlay(playRecord);
      setIsDndGranted(dndStatus);
      if (diag) {
        setDiagnostics(diag);
        if (diag.nativeEvents && diag.nativeEvents.length > 0) {
          setNativeLogs(diag.nativeEvents);
        } else if (logs) {
          setNativeLogs(logs);
        }
      } else if (logs) {
        setNativeLogs(logs);
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

  const [testsDevMode, setTestsDevMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('salah_diag_tests_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [runnerState, setRunnerState] = useState<DiagRunState | null>(() => diagRunnerInstance.getCurrentState());
  const [hearingAnswers, setHearingAnswers] = useState<{ controlHeard: boolean | null; testHeard: boolean | null }>({
    controlHeard: null,
    testHeard: null,
  });
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [guardError, setGuardError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  useEffect(() => {
    diagRunnerInstance.registerSpec(TEST_A_SPEC);
    diagRunnerInstance.registerSpec(TEST_B_SPEC);
    diagRunnerInstance.registerSpec(TEST_E_SPEC);
    diagRunnerInstance.checkAndResumeOnAppStartup();

    const unsubscribe = diagRunnerInstance.subscribe((st) => {
      setRunnerState(st ? { ...st } : null);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (runnerState?.phase !== 'waiting' || !runnerState.collectAt) {
      setSecondsRemaining(null);
      return;
    }

    const tick = () => {
      const rem = Math.max(0, Math.ceil((runnerState.collectAt! - Date.now()) / 1000));
      setSecondsRemaining(rem);
      if (rem === 0) {
        diagRunnerInstance.checkAndResumeOnAppStartup();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [runnerState?.phase, runnerState?.collectAt]);

  const toggleDevMode = () => {
    const next = !testsDevMode;
    setTestsDevMode(next);
    try {
      localStorage.setItem('salah_diag_tests_enabled', String(next));
    } catch (_e) {}
  };

  const handleStartTest = async (specId: string) => {
    setGuardError(null);
    setHearingAnswers({ controlHeard: null, testHeard: null });
    setIsActionBusy(true);
    try {
      const spec = diagRunnerInstance.getSpec(specId);
      if (!spec) {
        setGuardError('الاختبار غير مسجل في النظام.');
        return;
      }

      const storedSettings = StorageFacade.getSettings<AppSettings | null>(null);
      const athanTimes = resolveAthanTimes(diagnostics, storedSettings, new Date());
      const customAlarms = safeGetJSON<AlarmConfig[]>('salah_custom_alarms', []);

      const res = await diagRunnerInstance.startTest(spec, {
        athanTimes,
        customAlarms,
      });

      if (!res.success) {
        setGuardError(res.error || 'فشل بدء الاختبار بسبب حماية الصلاة أو خطأ في التهيئة.');
      } else if (res.state?.phase === 'reported') {
        fetchDiagnostics();
      }
    } catch (err: any) {
      setGuardError(err?.message || 'حدث خطأ غير متوقع أثناء تشغيل الاختبار.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleSubmitHearing = async () => {
    if (hearingAnswers.controlHeard === null || hearingAnswers.testHeard === null) {
      setGuardError('يرجى تحديد إجابة السماع لكلا المنبهين قبل الاعتماد.');
      return;
    }
    setIsActionBusy(true);
    try {
      await diagRunnerInstance.submitUserAction({
        hearing_check: {
          controlHeard: hearingAnswers.controlHeard,
          testHeard: hearingAnswers.testHeard,
        },
      });
      fetchDiagnostics();
    } catch (err: any) {
      setGuardError(err?.message || 'فشل إرسال نتائج السماع.');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleCancelTest = async () => {
    setIsActionBusy(true);
    try {
      await diagRunnerInstance.cancelTest('إلغاء يدوي من واجهة المستخدم');
      setHearingAnswers({ controlHeard: null, testHeard: null });
      fetchDiagnostics();
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleResetTest = async () => {
    setHearingAnswers({ controlHeard: null, testHeard: null });
    await diagRunnerInstance.resetState();
    fetchDiagnostics();
  };

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

  const copyToClipboard = async (text: string, type: 'all' | 'events' | 'nativeLogs') => {
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
        setToastMessage(
          type === 'all'
            ? 'تم نسخ تقرير التشخيص الشامل بنجاح ✓'
            : type === 'events'
            ? 'تم نسخ سجل إطلاق التنبيهات بنجاح ✓'
            : 'تم نسخ سجل الأحداث الأصلية بنجاح ✓'
        );
      }
      setTimeout(() => setCopiedType('none'), 3000);
    }
  };

  const getEventBadgeClass = (eventName: string): string => {
    switch (eventName) {
      case 'reconcile':
        return 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'fire_received':
        return 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'service_start':
        return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'service_stop':
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
      case 'boot_restore':
        return 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'khushu_attempt':
        return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'khushu_result':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'alarm_cancel':
        return 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'package_replaced':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'schedule_failed':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  };

  const generateNativeLogsText = (): string => {
    const list = (diagnostics?.nativeEvents && diagnostics.nativeEvents.length > 0)
      ? diagnostics.nativeEvents
      : nativeLogs;
    if (!list || list.length === 0) {
      return 'سجل الأحداث الأصلية للنظام (Native Event Log): لا توجد أحداث مسجلة بعد.';
    }
    const lines = [
      `=== سجل الأحداث الأصلية للنظام (Native Event Log - Ring Buffer) ===`,
      `تاريخ الاستخراج: ${new Date().toLocaleString('ar-EG')}`,
      `إجمالي الأحداث المسجلة: ${list.length}`,
      `--------------------------------------------------`,
    ];
    list.forEach((evt, idx) => {
      const timeStr = formatTimestamp(evt.timestampMs);
      lines.push(
        `[${idx + 1}] ${timeStr} | الحدث: ${evt.event}`,
        `   التفاصيل: ${evt.details || '—'}`
      );
      if (evt.error) {
        lines.push(`   الخطأ: ${evt.error}`);
      }
      lines.push(`--------------------------------------------------`);
    });
    return lines.join('\n');
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
      `الإصدار: v${APP_VERSION.version} (بناء ${APP_VERSION.buildNumber}) | الـ Commit: ${APP_VERSION.commitHash}`,
      `التاريخ والوقت: ${new Date().toLocaleString('ar-EG')} (${new Date().toISOString()})`,
      `==================================================`,
      ``,
      `[1] حالة النظام والبطارية (Device & Battery Health):`,
      `• استثناء تحسين استهلاك البطارية: ${diagnostics?.isIgnoringBatteryOptimizations ? 'مستثنى (آمن - Unrestricted)' : 'غير مستثنى (معرض للتجميد والسكون - Optimized)'}`,
      `• إذن المنبهات الدقيقة: ${diagnostics?.canScheduleExactAlarms ? 'ممنوح (Granted)' : 'مفقود (Denied)'}`,
      `• صلاحية عدم الإزعاج (DND): ${isDndGranted === true ? 'ممنوحة' : isDndGranted === false ? 'غير ممنوحة' : 'غير معروف'}`,
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

    const alarmCounts = groupScheduledAlarmsByType(diagnostics?.savedAlarms);
    lines.push(
      ``,
      `[3] المسجل في التطبيق (ليس بالضرورة مسجلًا في النظام) - الإجمالي: ${alarmCounts.total} منبه:`,
      `• أذان (athan): ${alarmCounts.athan}`,
      `• تنبيه مسبق (prealert): ${alarmCounts.prealert}`,
      `• تنبيه بعدي (postalert): ${alarmCounts.postalert}`,
      `• خشوع (khushu): ${alarmCounts.khushu}`,
      `• منبه مخصص (custom): ${alarmCounts.custom}`,
      `• أخرى (other): ${alarmCounts.other}`,
      ``,
      `تفاصيل التنبيهات المسجلة في التطبيق (عينة من أول 15 منبه):`
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
      `[5] سجل الأحداث الأصلية للنظام (Native Event Log - Ring Buffer):`
    );

    const list = (diagnostics?.nativeEvents && diagnostics.nativeEvents.length > 0)
      ? diagnostics.nativeEvents
      : nativeLogs;

    const latestReconcile = list.find((e) => e.event === 'reconcile');
    const osVerifiedMatch = latestReconcile?.details?.match(/os_verified=([^, ]+)/);
    if (osVerifiedMatch) {
      lines.push(`• مطابقة منبهات النظام (OS Verified): ${osVerifiedMatch[1]}`);
    }

    if (list.length > 0) {
      list.forEach((evt, idx) => {
        lines.push(
          `  ${idx + 1}. [${formatTimestamp(evt.timestampMs)}] ${evt.event} - ${evt.details}${evt.error ? ` - الخطأ: ${evt.error}` : ''}`
        );
      });
    } else {
      lines.push(`  (لم يتم تسجيل أي حدث أصلي بعد)`);
    }

    lines.push(
      ``,
      `[6] حالة ملفات المؤذنين المخزنة لكل صلاة:`
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
        <div className="flex items-center gap-2 flex-wrap">
          <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">
            تشخيص ملفات الأذان والنظام الأصلي (Athan Diagnostics)
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold font-mono">
            v{APP_VERSION.version} ({APP_VERSION.commitHash})
          </span>
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
            onClick={toggleDevMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              testsDevMode
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="تفعيل أو إخفاء أدوات فحص التشخيص الميداني"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>{testsDevMode ? 'وضع الفحص نشط' : 'أدوات الفحص'}</span>
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

      {/* Active Diagnostic Test Running Banner */}
      {runnerState && (runnerState.phase === 'waiting' || runnerState.phase === 'running' || runnerState.phase === 'collectable') && (
        <div className="p-4 bg-rose-500/15 border-2 border-rose-500/40 rounded-2xl space-y-3 text-rose-900 dark:text-rose-200">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 font-black text-sm flex-1 min-w-[200px]">
              <FlaskConical className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce" />
              <span className="leading-snug">فحص تشخيصي قيد التشغيل: {diagRunnerInstance.getSpec(runnerState.testId)?.title || runnerState.testId}</span>
            </div>
            <button
              type="button"
              onClick={handleCancelTest}
              disabled={isActionBusy}
              className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              إلغاء الاختبار وفك الحجز
            </button>
          </div>
          <div className="text-xs space-y-1">
            {runnerState.phase === 'waiting' && (
              <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <Clock className="w-4 h-4 animate-spin shrink-0" />
                <span>متبقي على إطلاق المنبهات وسؤال السماع: {secondsRemaining !== null ? `${toArabicNumbers(secondsRemaining)} ثانية` : '...'}</span>
              </p>
            )}
            {runnerState.phase === 'running' && (
              <p className="font-bold flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>جاري معالجة خطوات الفحص وتهيئة البيئة...</span>
              </p>
            )}
            {runnerState.phase === 'collectable' && (
              <p className="font-black text-emerald-600 dark:text-emerald-400">
                {getCollectableBannerMessage(runnerState.testId)}
              </p>
            )}
            <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80">
              ملاحظة: المنبهات الأصلية وإعدادات الخشوع محفوظة في نسخة احتياطية آمنة (Snapshot) وستتم استعادتها تلقائياً عند انتهاء الفحص أو إلغائه.
            </p>
          </div>
        </div>
      )}

      {guardError && (
        <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
          <div className="flex items-start gap-2 font-bold flex-1 min-w-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{guardError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGuardError(null)}
            className="shrink-0 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 rounded-lg font-bold text-[11px] cursor-pointer transition"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 0.5 In-App Diagnostics Test Framework (Dev Mode) */}
      {(testsDevMode || runnerState) && (
        <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-500/20 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h4 className="text-xs font-black text-slate-800 dark:text-white">
                  إطار الاختبارات التشخيصية الميدانية (Diagnostics Test Framework)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  فحص دقيق ومباشر على الجهاز للتأكد من سلوك المنبهات والخشوع وعزل التخزين المؤقت.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">
              Dev Mode
            </span>
          </div>

          {/* Test Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Test A Card */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Test A: عزل مصدر المعاينة (Fix 1a)
                </span>
                <span className="text-[10px] text-slate-400">فوري (Instant)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                يتحقق من مسارات الصوت (محلي / بعيد / افتراضي) عبر مسارين مستقلين للتأكد من عدم تلويث التخزين المؤقت للأذان.
              </p>
              <button
                type="button"
                onClick={() => handleStartTest('fix1a-preview-source')}
                disabled={isActionBusy || (!!runnerState && runnerState.phase !== 'reported' && runnerState.phase !== 'cancelled')}
                className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>تشغيل Test A (فحص المعاينة)</span>
              </button>
            </div>

            {/* Test B Card */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  Test B: منبهات الخشوع المخصصة (B3)
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">مجدول (~24 دقيقة)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                يجدول منبهين متتاليين (عادي بعد 3د، وأثناء الخشوع بعد 6د)، ويتحقق من كتم الثاني وسجلات النظام عند د24.
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                تنبيه للمستخدم: استمع للمنبهين وتذكّر بدقة ما سمعته للإجابة على سؤالي التحقق عند فتح الاستبيان بعد انتهاء فترة الفحص (~24 دقيقة).
              </p>
              <button
                type="button"
                onClick={() => handleStartTest('b3-khushu-custom-alarm')}
                disabled={isActionBusy || (!!runnerState && runnerState.phase !== 'reported' && runnerState.phase !== 'cancelled')}
                className="w-full py-1.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>تشغيل Test B (فحص الخشوع - ~24 دقيقة)</span>
              </button>
            </div>

            {/* Test E Card */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Test E: فحص سلامة المعاملات والاستعادة (B1 Safety)</span>
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">فوري (Instant ~5 ثوانٍ)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                يتحقق من: 1) خط الأساس (NORMAL)، 2) الجدولة أولاً قبل الكتم، 3) حارس التكرار وعدم تمديد المؤقت، 4) استعادة رنين الهاتف وفلتر الإشعارات بالكامل، 5) توثيق أحداث التيليمتري (KHUSHU_RESTORE_SCHEDULED و KHUSHU_RESTORED).
              </p>
              <button
                type="button"
                onClick={() => handleStartTest('test-e-khushu-restore-safety')}
                disabled={isActionBusy || (!!runnerState && runnerState.phase !== 'reported' && runnerState.phase !== 'cancelled')}
                className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>تشغيل Test E (فحص أمان الاستعادة والمعاملات)</span>
              </button>
            </div>
          </div>

          {/* Interactive UI for Test A (Offline Fallback Step) */}
          {runnerState?.phase === 'collectable' && runnerState.testId === 'fix1a-preview-source' && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <h5 className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                  فحص التراجع بدون اتصال (Test A: Offline Fallback Verification):
                </h5>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                اكتملت المرحلة الأولى (فحص الصوت المدمج والصوت عبر الإنترنت أثناء الاتصال). الآن يرجى قطع اتصال الإنترنت على الهاتف (إيقاف الواي فاي وبيانات الهاتف)، ثم الضغط على الزر أدناه لإجراء المرحلة الثانية (فحص التراجع للصوت الافتراضي ومسار التخزين المحلي بدون اتصال).
              </p>
              <button
                type="button"
                onClick={async () => {
                  setIsActionBusy(true);
                  try {
                    await diagRunnerInstance.submitUserAction({
                      step_offline: { confirmed: true },
                    });
                    fetchDiagnostics();
                  } catch (err: any) {
                    setGuardError(err?.message || 'فشل إرسال تأكيد عدم الاتصال.');
                  } finally {
                    setIsActionBusy(false);
                  }
                }}
                disabled={isActionBusy}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                تأكيد إيقاف الاتصال وإتمام الفحص
              </button>
            </div>
          )}

          {/* Interactive Hearing Questionnaire for Test B */}
          {runnerState?.phase === 'collectable' && runnerState.testId === 'b3-khushu-custom-alarm' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <h5 className="text-xs font-black text-amber-900 dark:text-amber-200">
                  سؤال التحقق الميداني من السماع (User Hearing Verification):
                </h5>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="bg-white dark:bg-[#161d26] p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    1. هل سمعت صوت المنبه الأول (المنبه العادي - Control Alarm)؟
                  </span>
                  <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="controlHeard"
                        checked={hearingAnswers.controlHeard === true}
                        onChange={() => setHearingAnswers((prev) => ({ ...prev, controlHeard: true }))}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">نعم (سمعت الصوت)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="controlHeard"
                        checked={hearingAnswers.controlHeard === false}
                        onChange={() => setHearingAnswers((prev) => ({ ...prev, controlHeard: false }))}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">لا (لم يصدر صوت)</span>
                    </label>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#161d26] p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    2. هل سمعت صوت المنبه الثاني (المنبه أثناء الخشوع - Test Alarm)؟
                  </span>
                  <div className="flex items-center gap-x-4 gap-y-2 flex-wrap">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="testHeard"
                        checked={hearingAnswers.testHeard === false}
                        onChange={() => setHearingAnswers((prev) => ({ ...prev, testHeard: false }))}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">لا (تم كتم الصوت بنجاح ✓)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="testHeard"
                        checked={hearingAnswers.testHeard === true}
                        onChange={() => setHearingAnswers((prev) => ({ ...prev, testHeard: true }))}
                        className="text-indigo-600"
                      />
                      <span className="text-slate-700 dark:text-slate-300">نعم (رن المنبه أثناء الخشوع ✕)</span>
                    </label>
                  </div>
                </div>
              </div>

              {(hearingAnswers.controlHeard === null || hearingAnswers.testHeard === null) && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-bold text-center">
                  يرجى تحديد الإجابة لكلا السؤالين أعلاه لتفعيل زر الاعتماد.
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmitHearing}
                disabled={isActionBusy || hearingAnswers.controlHeard === null || hearingAnswers.testHeard === null}
                className="w-full py-2 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                اعتماد الملاحظات وتوليد التقرير النهائي
              </button>
            </div>
          )}

          {/* Report Presentation */}
          {runnerState?.phase === 'reported' && runnerState.result && (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black text-xs shrink-0 ${
                    runnerState.result.verdict === 'PASS' || runnerState.result.verdict === 'SUPPORTS_HYPOTHESIS'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : runnerState.result.verdict === 'FAIL' || runnerState.result.verdict === 'REFUTED'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  }`}
                >
                  {(runnerState.result.verdict === 'PASS' || runnerState.result.verdict === 'SUPPORTS_HYPOTHESIS') && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  {(runnerState.result.verdict === 'FAIL' || runnerState.result.verdict === 'REFUTED') && <XCircle className="w-4 h-4 shrink-0" />}
                  {runnerState.result.verdict === 'INCONCLUSIVE' && <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{runnerState.result.verdict}</span>
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      copyToClipboard(runnerState.result?.markdownReport || '', 'all');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ التقرير</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetTest}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>

              {runnerState.result.reason && (
                <div className="p-3 bg-white dark:bg-[#161d26] border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xs">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed text-right">
                    {runnerState.result.reason}
                  </p>
                </div>
              )}

              <div className="p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono whitespace-pre-wrap max-h-60 overflow-y-auto dir-ltr text-left">
                {runnerState.result.markdownReport}
              </div>
            </div>
          )}

          {/* Cancelled Banner */}
          {runnerState?.phase === 'cancelled' && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl flex items-start justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2 flex-1 min-w-0">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  {runnerState.result?.reason || 'تم إلغاء الاختبار واستعادة الإعدادات الأصلية بنجاح.'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetTest}
                className="shrink-0 px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold rounded-lg transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      )}

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
              <span className="text-slate-500 dark:text-slate-400 font-bold">صلاحية عدم الإزعاج (DND):</span>
              <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                isDndGranted === true
                  ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                  : isDndGranted === false
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40'
                  : 'text-slate-700 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-800/60'
              }`}>
                {isDndGranted === true ? 'ممنوحة ✓' : isDndGranted === false ? 'غير ممنوحة ⚠️' : 'غير معروف ❓'}
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px] sm:text-xs">فئة الاستعداد (Standby Bucket):</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] shrink-0">
                {formatStandbyBucket(diagnostics.standbyBucket)}
              </span>
            </div>

            <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px] sm:text-xs">أقرب منبه مسجل بالنظام (AlarmClock):</span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px] shrink-0">
                {diagnostics.nextAlarmClockMs > 0 ? formatTimestamp(diagnostics.nextAlarmClockMs) : 'لا يوجد منبه AlarmClock مسجل'}
              </span>
            </div>
            {(() => {
              const list = diagnostics.nativeEvents || nativeLogs;
              const latestReconcile = list.find((e) => e.event === 'reconcile');
              const osMatch = latestReconcile?.details?.match(/os_verified=([^, ]+)/);
              if (!osMatch) return null;
              const val = osMatch[1];
              return (
                <div className="flex items-center justify-between flex-wrap sm:flex-nowrap gap-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 sm:col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px] sm:text-xs">
                    مطابقة منبهات النظام (OS Verified):
                  </span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-md text-[11px] shrink-0 ${
                      val === 'unknown'
                        ? 'text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-950/40'
                        : 'text-emerald-700 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40'
                    }`}
                  >
                    {val === 'unknown' ? 'غير مؤكد (unknown)' : `${val} منبه مؤكد بالنظام ✓`}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 2. Registered Alarms Grouped by Type - المسجل في التطبيق (ليس بالضرورة مسجلًا في النظام) */}
      {diagnostics && diagnostics.savedAlarms && (
        <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ListOrdered className="w-4 h-4 text-indigo-500" />
              <span>المسجل في التطبيق (ليس بالضرورة مسجلًا في النظام)</span>
            </h4>
            <span className="text-[11px] font-bold text-slate-400">
              الإجمالي: {toArabicNumbers(groupScheduledAlarmsByType(diagnostics.savedAlarms).total)}
            </span>
          </div>

          {(() => {
            const counts = groupScheduledAlarmsByType(diagnostics.savedAlarms);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">أذان (athan)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.athan)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">مسبق (prealert)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.prealert)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">بعدي (postalert)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.postalert)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">خشوع (khushu)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.khushu)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">مخصص (custom)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.custom)}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-bold">أخرى (other)</span>
                  <span className="font-mono font-black text-slate-900 dark:text-white">{toArabicNumbers(counts.other)}</span>
                </div>
              </div>
            );
          })()}

          {diagnostics.savedAlarms.length > 0 ? (
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 pt-1 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 pb-0.5">عينة من التنبيهات المجدولة بالتطبيق:</div>
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

      {/* 4. Native Event Log (Ring Buffer - last 100 events) */}
      <div className="bg-white dark:bg-[#161d26] p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <ScrollText className="w-4 h-4 text-emerald-500" />
            <span>
              سجل أحداث النظام الأصلي (Native Event Log - Ring Buffer):
            </span>
          </h4>
          <button
            type="button"
            onClick={() => copyToClipboard(generateNativeLogsText(), 'nativeLogs')}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-all cursor-pointer"
            title="نسخ سجل أحداث النظام الأصلي"
          >
            {copiedType === 'nativeLogs' ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">تم النسخ ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>نسخ السجل 📋</span>
              </>
            )}
          </button>
        </div>

        {((diagnostics?.nativeEvents && diagnostics.nativeEvents.length > 0) || nativeLogs.length > 0) ? (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {((diagnostics?.nativeEvents && diagnostics.nativeEvents.length > 0) ? diagnostics.nativeEvents : nativeLogs).map((evt, idx) => {
              return (
                <div
                  key={`${evt.timestampMs}_${idx}`}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${getEventBadgeClass(evt.event)}`}>
                        {evt.event}
                      </span>
                      {evt.event === 'reconcile' && (() => {
                        const m = evt.details?.match(/os_verified=([^, ]+)/);
                        if (!m) return null;
                        const val = m[1];
                        return (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              val === 'unknown'
                                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/60 dark:border-amber-800/60'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-800/60'
                            }`}
                            title="مطابقة المنبهات مع نظام التشغيل OS عبر PendingIntent"
                          >
                            OS: {val}
                          </span>
                        );
                      })()}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {formatTimestamp(evt.timestampMs)}
                    </span>
                  </div>

                  {evt.details && (
                    <div className="text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all bg-white/70 dark:bg-slate-800/50 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      {evt.details}
                    </div>
                  )}

                  {evt.error && (
                    <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 break-all flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0 text-rose-500" />
                      <span>{evt.error}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl text-slate-400 text-xs">
            لم يتم تسجيل أي حدث في السجل الأصلي حتى الآن (يتم التسجيل تلقائياً عند المطابقة وإطلاق التنبيهات والخدمة والاستعادة).
          </div>
        )}
      </div>

      {/* 5. Per-Prayer Native Files Status */}
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
