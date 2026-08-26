import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bell, Clock, Cpu, Battery, Wrench, CheckCircle, AlertTriangle, Play, RefreshCw, X } from 'lucide-react';
import { AppSettings } from '../types';
import AthanAlarm, { checkExactAlarmPermission, checkNotificationPermission, requestExactAlarmPermission, requestNotificationPermission } from '../services/athanAlarmPlugin';
import { AlarmReconciliationService, ReconciliationStatus } from '../services/AlarmReconciliationService';
import { runPrayerCalcGoldenTests } from '../utils/prayerCalc';

interface AlarmDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
}

export const AlarmDiagnosticsModal: React.FC<AlarmDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [notificationGranted, setNotificationGranted] = useState<boolean | null>(null);
  const [exactAlarmGranted, setExactAlarmGranted] = useState<boolean | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconcileStatus, setReconcileStatus] = useState<ReconciliationStatus | null>(null);
  const [testAlarmScheduled, setTestAlarmScheduled] = useState(false);
  const [goldenTestsPass, setGoldenTestsPass] = useState(false);

  const runDiagnostics = async () => {
    const notif = await checkNotificationPermission();
    setNotificationGranted(notif);

    const exact = await checkExactAlarmPermission();
    setExactAlarmGranted(exact);

    const golden = runPrayerCalcGoldenTests();
    setGoldenTestsPass(golden);

    const status = await AlarmReconciliationService.reconcileAlarms(settings);
    setReconcileStatus(status);
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const handleAutoRepair = async () => {
    setIsReconciling(true);
    try {
      await requestNotificationPermission();
      await requestExactAlarmPermission();
      await runDiagnostics();
    } catch (err) {
      console.warn('[AlarmDiagnostics] Repair failed:', err);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleScheduleTest = async () => {
    const success = await AlarmReconciliationService.scheduleTestAlarm(60);
    setTestAlarmScheduled(success);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">فحص وتشخيص تنبيهات الصلاة</h3>
              <p className="text-xs text-slate-400">التحقق اللحظي من صلاحيات الجهاز ومواقيت الصلاة</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Permission Status Checks */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">حالة الصلاحيات والإشعار</h4>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <Bell className="w-4 h-4 text-slate-400" />
                <span className="text-sm">إذن الإشعارات</span>
              </div>
              {notificationGranted ? (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 ml-1" /> مسموح
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5 ml-1" /> محجوب
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 space-x-reverse">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm">تنبيهات الألأرم الدقيقة (Exact Alarm)</span>
              </div>
              {exactAlarmGranted ? (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 ml-1" /> مسموح
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-amber-400 bg-amber-500/10 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5 ml-1" /> تحتاج تفعيل
                </span>
              )}
            </div>
          </div>

          {/* Golden Tests & Prayer Calc Diagnostics */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">سلامة حساب المواقيت الفلكية</h4>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm">اختبارات المواقيت (Golden Tests)</span>
              {goldenTestsPass ? (
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 ml-1" /> سليمة 100%
                </span>
              ) : (
                <span className="text-xs font-medium text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full">فحص مجدد</span>
              )}
            </div>
            <p className="text-xs text-slate-400">المدينة: {settings.cityName} | المذهب: {settings.madhab}</p>
          </div>

          {/* Active Reconciliation Count */}
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">التنبيهات المجدولة حالياً</h4>
              <p className="text-sm font-medium mt-0.5">
                {reconcileStatus ? `${reconcileStatus.scheduledCount} تنبيه مجدول للصلوات القادمة` : 'جاري الفحص...'}
              </p>
            </div>
            <button
              onClick={runDiagnostics}
              disabled={isReconciling}
              className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isReconciling ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Battery Guidance Notice */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3 space-x-reverse">
            <Battery className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              لضمان انطلاق الأذان في موعده بدقة على أجهزة سامسونج وشياومي، يرجى الاستثناء من قيود البطارية (Unrestricted Battery Mode).
            </p>
          </div>

          {/* Actions */}
          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleAutoRepair}
              disabled={isReconciling}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center space-x-2 space-x-reverse shadow-lg shadow-emerald-600/20"
            >
              <Wrench className="w-4 h-4" />
              <span>إصلاح تلقائي للصلاحيات</span>
            </button>

            <button
              onClick={handleScheduleTest}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2 space-x-reverse"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>تجربة الأذان بعد 60 ثانية</span>
            </button>
          </div>

          {testAlarmScheduled && (
            <p className="text-xs text-center text-emerald-400 font-medium bg-emerald-500/10 py-2 rounded-lg">
              ✓ تم إدراج تجربة الأذان، سينطلق التنبيه خلال 60 ثانية بالضبط!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
