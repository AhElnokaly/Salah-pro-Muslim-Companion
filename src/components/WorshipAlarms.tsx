/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RotateCcw, ShieldCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import type { AppSettings, AlarmConfig, SpiritualAlerts } from '../types';
import { DEFAULT_WORSHIP_ALARMS } from '../utils/alarmUtils';
import { safeSetItem } from '../utils/storage';
import { applyPrayerAthanToggle } from '../domain/notifications/prayerAthanToggle';
import AthanAlarm, { 
  requestNotificationPermission as requestNativeNotificationPermission,
  cancelNativeAlarm
} from '../services/athanAlarmPlugin';
import { 
  showAppNotification, 
  getPushSettings, 
  savePushSettings, 
  DEFAULT_PUSH_SETTINGS,
  PushNotificationSettings 
} from '../utils/pushNotificationService';
import { 
  getSmartNotificationsSettings, 
  saveSmartNotificationsSettings 
} from '../domain/smartNotifications/smartNotificationService';
import { 
  SmartNotificationsSettings, 
  DEFAULT_SMART_NOTIFICATIONS_SETTINGS 
} from '../domain/smartNotifications/smartNotificationTypes';
import AlarmCard from './alarms/AlarmCard';
import AlarmEditModal from './alarms/AlarmEditModal';
import { AlarmHeader } from './alarms/AlarmHeader';
import { AlarmPermissionBanner } from './alarms/AlarmPermissionBanner';
import { AlarmEmptyState } from './alarms/AlarmEmptyState';
import { AlarmDeleteConfirmModal, AlarmRestoreConfirmModal } from './alarms/AlarmConfirmModals';
import { AlarmDiagnosticsModal } from './AlarmDiagnosticsModal';
import SystemAlarmCard from './alarms/SystemAlarmCard';
import SystemAlarmEditModal, { SystemAlarmItemKey } from './alarms/SystemAlarmEditModal';

interface WorshipAlarmsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  customAlarms: AlarmConfig[];
  setCustomAlarms: React.Dispatch<React.SetStateAction<AlarmConfig[]>>;
  alerts: SpiritualAlerts;
  setAlerts: React.Dispatch<React.SetStateAction<SpiritualAlerts>>;
  audioVolume: number;
  setAudioVolume: (vol: number) => void;
}

export default function WorshipAlarms({
  settings,
  setSettings,
  customAlarms,
  setCustomAlarms,
  alerts: _alerts,
  setAlerts: _setAlerts,
  audioVolume,
  setAudioVolume
}: WorshipAlarmsProps) {
  const isNative = Capacitor.isNativePlatform();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmConfig | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // System Push & Smart Notifications State
  const [pushSettings, setPushSettings] = useState<PushNotificationSettings>(() => getPushSettings());
  const [smartSettings, setSmartSettings] = useState<SmartNotificationsSettings>(() => getSmartNotificationsSettings());
  const [selectedSystemKey, setSelectedSystemKey] = useState<SystemAlarmItemKey | null>(null);
  const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);

  // Dedicated custom confirmation dialogs (avoids window.confirm browser blockers)
  const [alarmToDelete, setAlarmToDelete] = useState<AlarmConfig | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Sync notification permission state
  useEffect(() => {
    if (isNative) return;
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [isNative]);

  // Keep system push & smart settings updated when changed elsewhere in the app
  useEffect(() => {
    const handlePushChanged = (e: Event) => {
      const detail = (e as CustomEvent<PushNotificationSettings & { changedKey?: string }>).detail;
      if (detail && typeof detail === 'object') {
        const { changedKey, ...rest } = detail;
        setPushSettings(prev => ({ ...prev, ...rest }));
      } else {
        setPushSettings(getPushSettings());
      }
    };
    const handleSmartChanged = (e: Event) => {
      const detail = (e as CustomEvent<SmartNotificationsSettings>).detail;
      if (detail) setSmartSettings(detail);
      else setSmartSettings(getSmartNotificationsSettings());
    };
    window.addEventListener('push-settings-changed', handlePushChanged);
    window.addEventListener('smart-notifications-settings-changed', handleSmartChanged);
    return () => {
      window.removeEventListener('push-settings-changed', handlePushChanged);
      window.removeEventListener('smart-notifications-settings-changed', handleSmartChanged);
    };
  }, []);

  const handleRequestPermission = async () => {
    if (isNative) {
      try {
        const granted = await requestNativeNotificationPermission();
        setNotificationPermission(granted ? 'granted' : 'denied');
      } catch (e) {
        console.warn('Native notification request error:', e);
      }
      return;
    }

    if (!('Notification' in window)) {
      setInfoMessage('الإشعارات المباشرة غير مدعومة في متصفحك الحالي، سيتم الاعتماد على الصوت والتنبيه المرئي داخل التطبيق.');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      if (result === 'granted') {
        showAppNotification('تطبيق هِمَّتِي 🔔', {
          body: 'تم تفعيل التنبيهات بنجاح. ستصلك التذكيرات في مواقيتها المحددة بإذن الله.',
          icon: '/icon-192.png',
          dir: 'rtl'
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Permission request failed:', err);
    }
  };

  // Two-way synchronization helper for custom alarms & push settings
  const handleToggleAlarm = (id: string, enabled: boolean) => {
    setCustomAlarms(prev => {
      const next = prev.map(a => a.id === id ? { ...a, enabled } : a);
      safeSetItem('salah_custom_alarms', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: next }));
      return next;
    });

    // Two-way sync: reflect custom alarm toggle in pushSettings
    if (id === 'alarm_before_salah') {
      const updated = { ...pushSettings, prayerPreAlert: enabled };
      setPushSettings(updated);
      savePushSettings(updated);
      if (!enabled && isNative) {
        cancelNativeAlarm({ alarmId: 'prealert' }).catch(() => {});
      }
    } else if (id === 'alarm_after_salah') {
      const updated = { ...pushSettings, prayerPostAlert: enabled };
      setPushSettings(updated);
      savePushSettings(updated);
      if (!enabled && isNative) {
        cancelNativeAlarm({ alarmId: 'postalert' }).catch(() => {});
      }
    } else if (id === 'alarm_morning_adhkar') {
      const updated = { ...pushSettings, adhkarMorning: enabled };
      setPushSettings(updated);
      savePushSettings(updated);
    } else if (id === 'alarm_evening_adhkar') {
      const updated = { ...pushSettings, adhkarEvening: enabled };
      setPushSettings(updated);
      savePushSettings(updated);
    }
  };

  const handleOpenAddModal = () => {
    setSelectedAlarm(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (alarm: AlarmConfig) => {
    setSelectedAlarm(alarm);
    setIsModalOpen(true);
  };

  const handleSaveAlarm = (savedAlarm: AlarmConfig) => {
    setCustomAlarms(prev => {
      const exists = prev.some(a => a.id === savedAlarm.id);
      const next = exists
        ? prev.map(a => a.id === savedAlarm.id ? savedAlarm : a)
        : [...prev, savedAlarm];
      safeSetItem('salah_custom_alarms', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: next }));
      return next;
    });

    // Two-way sync: reflect custom alarm edit in pushSettings
    if (savedAlarm.id === 'alarm_before_salah') {
      const updated = {
        ...pushSettings,
        prayerPreAlert: savedAlarm.enabled,
        preAlertMinutes: savedAlarm.offsetMinutes ?? pushSettings.preAlertMinutes,
      };
      setPushSettings(updated);
      savePushSettings(updated);
      if (isNative) {
        cancelNativeAlarm({ alarmId: 'prealert' }).catch(() => {});
      }
    } else if (savedAlarm.id === 'alarm_after_salah') {
      const updated = {
        ...pushSettings,
        prayerPostAlert: savedAlarm.enabled,
        postAlertMinutes: savedAlarm.offsetMinutes ?? pushSettings.postAlertMinutes,
      };
      setPushSettings(updated);
      savePushSettings(updated);
      if (isNative) {
        cancelNativeAlarm({ alarmId: 'postalert' }).catch(() => {});
      }
    } else if (savedAlarm.id === 'alarm_morning_adhkar') {
      const updated = {
        ...pushSettings,
        adhkarMorning: savedAlarm.enabled,
        morningTime: savedAlarm.time || pushSettings.morningTime,
      };
      setPushSettings(updated);
      savePushSettings(updated);
    } else if (savedAlarm.id === 'alarm_evening_adhkar') {
      const updated = {
        ...pushSettings,
        adhkarEvening: savedAlarm.enabled,
        eveningTime: savedAlarm.time || pushSettings.eveningTime,
      };
      setPushSettings(updated);
      savePushSettings(updated);
    }
  };

  // Toggle handlers for System Alarms
  const handleToggleSystemAlarm = (key: SystemAlarmItemKey, enabled: boolean) => {
    if (key === 'ongoingPrayerBar') {
      const updated: SmartNotificationsSettings = {
        ...smartSettings,
        ongoingPrayerBar: { ...smartSettings.ongoingPrayerBar, enabled }
      };
      setSmartSettings(updated);
      saveSmartNotificationsSettings(updated);
      if (!enabled && isNative && AthanAlarm.updateOngoingPrayerNotification) {
        AthanAlarm.updateOngoingPrayerNotification({ enabled: false }).catch(() => {});
      }
      return;
    }

    if (key === 'readingPortion') {
      const updated: SmartNotificationsSettings = {
        ...smartSettings,
        readingPortion: { ...smartSettings.readingPortion, enabled }
      };
      setSmartSettings(updated);
      saveSmartNotificationsSettings(updated);
      return;
    }

    if (key === 'listeningPortion') {
      const updated: SmartNotificationsSettings = {
        ...smartSettings,
        listeningPortion: { ...smartSettings.listeningPortion, enabled }
      };
      setSmartSettings(updated);
      saveSmartNotificationsSettings(updated);
      return;
    }

    const updated: PushNotificationSettings = { ...pushSettings, [key]: enabled };
    setPushSettings(updated);
    savePushSettings(updated);

    // If disabled, explicitly cancel any native scheduled alarms
    if (!enabled && isNative) {
      if (key === 'prayerPreAlert') {
        cancelNativeAlarm({ alarmId: 'prealert' }).catch(() => {});
      } else if (key === 'prayerPostAlert') {
        cancelNativeAlarm({ alarmId: 'postalert' }).catch(() => {});
      } else if (key === 'prayerAthan') {
        // Handled inside applyPrayerAthanToggle (prefs -> cancel alarms -> stop audio)
      } else {
        cancelNativeAlarm({ alarmId: key }).catch(() => {});
      }
    }

    // Sync prayerAthan with native prefs & AppSettings.adhanEnabled
    if (key === 'prayerAthan') {
      applyPrayerAthanToggle('prayerAthan', enabled, {
        saveAppSettings: setSettings,
      }).catch(err => {
        console.warn('[WorshipAlarms] applyPrayerAthanToggle failed:', err);
      });
    }

    // Two-way sync back to custom alarms if one exists
    if (key === 'prayerPreAlert') {
      setCustomAlarms(prev => {
        if (!prev.some(a => a.id === 'alarm_before_salah')) return prev;
        const next = prev.map(a => a.id === 'alarm_before_salah' ? { ...a, enabled } : a);
        safeSetItem('salah_custom_alarms', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: next }));
        return next;
      });
    } else if (key === 'prayerPostAlert') {
      setCustomAlarms(prev => {
        if (!prev.some(a => a.id === 'alarm_after_salah')) return prev;
        const next = prev.map(a => a.id === 'alarm_after_salah' ? { ...a, enabled } : a);
        safeSetItem('salah_custom_alarms', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: next }));
        return next;
      });
    } else if (key === 'adhkarMorning') {
      setCustomAlarms(prev => {
        if (!prev.some(a => a.id === 'alarm_morning_adhkar')) return prev;
        const next = prev.map(a => a.id === 'alarm_morning_adhkar' ? { ...a, enabled } : a);
        safeSetItem('salah_custom_alarms', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: next }));
        return next;
      });
    } else if (key === 'adhkarEvening') {
      setCustomAlarms(prev => {
        if (!prev.some(a => a.id === 'alarm_evening_adhkar')) return prev;
        const next = prev.map(a => a.id === 'alarm_evening_adhkar' ? { ...a, enabled } : a);
        safeSetItem('salah_custom_alarms', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: next }));
        return next;
      });
    }
  };

  const handleOpenSystemEditModal = (key: SystemAlarmItemKey) => {
    setSelectedSystemKey(key);
    setIsSystemModalOpen(true);
  };

  const promptDeleteAlarm = (id: string) => {
    const target = customAlarms.find(a => a.id === id);
    if (target) {
      setAlarmToDelete(target);
    }
  };

  const confirmDeleteAlarm = () => {
    if (alarmToDelete) {
      setCustomAlarms(prev => {
        const next = prev.filter(a => a.id !== alarmToDelete.id);
        safeSetItem('salah_custom_alarms', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: next }));
        return next;
      });
      setAlarmToDelete(null);
    }
  };

  const handleRestoreDefaults = () => {
    setCustomAlarms(DEFAULT_WORSHIP_ALARMS);
    safeSetItem('salah_custom_alarms', JSON.stringify(DEFAULT_WORSHIP_ALARMS));
    window.dispatchEvent(new CustomEvent('custom-alarms-changed', { detail: DEFAULT_WORSHIP_ALARMS }));
    setShowRestoreConfirm(false);
  };

  const enabledCount = customAlarms.filter(a => a.enabled).length;

  // De-duplication checks: if custom alarm exists, hide matching system alarm card
  const hasBeforeSalahCustom = customAlarms.some(a => a.id === 'alarm_before_salah');
  const hasAfterSalahCustom = customAlarms.some(a => a.id === 'alarm_after_salah');
  const hasMorningAdhkarCustom = customAlarms.some(a => a.id === 'alarm_morning_adhkar');
  const hasEveningAdhkarCustom = customAlarms.some(a => a.id === 'alarm_evening_adhkar');

  return (
    <div className="pb-16 max-w-4xl mx-auto space-y-5 sm:space-y-6 animate-fade-in text-right" dir="rtl">
      {/* Header Bar */}
      <AlarmHeader
        enabledCount={enabledCount}
        totalCount={customAlarms.length}
        audioVolume={audioVolume}
        setAudioVolume={setAudioVolume}
        showVolumeSlider={showVolumeSlider}
        setShowVolumeSlider={setShowVolumeSlider}
        onOpenAddModal={handleOpenAddModal}
        onOpenDiagnostics={() => setShowDiagnostics(true)}
      />

      {/* Info notification if permission not granted */}
      <AlarmPermissionBanner
        permission={notificationPermission}
        onRequestPermission={handleRequestPermission}
      />

      {/* Info Message Toast */}
      {infoMessage && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl flex justify-between items-center">
          <span>{infoMessage}</span>
          <button
            type="button"
            onClick={() => setInfoMessage(null)}
            aria-label="إغلاق الرسالة"
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: Custom Alarms List or Empty State */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">
            المنبهات المخصصة والعبادات
          </h3>
          <span className="text-[11px] font-bold text-slate-400">
            {customAlarms.length} منبه
          </span>
        </div>

        {customAlarms.length > 0 ? (
          customAlarms.map(alarm => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              onToggle={handleToggleAlarm}
              onEdit={handleOpenEditModal}
              onDelete={promptDeleteAlarm}
            />
          ))
        ) : (
          <AlarmEmptyState
            onOpenAddModal={handleOpenAddModal}
            onRestoreDefaults={() => setShowRestoreConfirm(true)}
          />
        )}
      </div>

      {/* Footer / Reset Defaults Helper for Custom Alarms */}
      {customAlarms.length > 0 && (
        <div className="flex items-center justify-between pt-1 px-1 text-xs font-bold text-slate-400 flex-wrap gap-2">
          <span>انقر على أي منبه لتعديل موعده، نغمته، أو الصلوات المرتبطة به.</span>
          <button
            type="button"
            onClick={() => setShowRestoreConfirm(true)}
            className="inline-flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            استعادة التنبيهات الافتراضية
          </button>
        </div>
      )}

      {/* SECTION 2: System Notifications & Alarms (تنبيهات النظام الذكية) */}
      <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              تنبيهات النظام والإشعارات الذكية
            </h3>
            <p className="text-[11px] font-bold text-slate-400">
              تنبيهات وإشعارات الخلفية المدمجة مع تحكم كامل وإمكانية تخصيص المواعيد
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* 1. الأذان (prayerAthan) */}
          <SystemAlarmCard
            alarmKey="prayerAthan"
            title="أذان الصلوات الخمس"
            timingDesc="عند دخول وقت الصلاة تماماً"
            enabled={pushSettings.prayerAthan}
            isDefault={pushSettings.prayerAthan === DEFAULT_PUSH_SETTINGS.prayerAthan}
            onToggle={handleToggleSystemAlarm}
            onEdit={handleOpenSystemEditModal}
          />

          {/* 2. تنبيه قبل الصلاة (prayerPreAlert) — Shown if not overridden by custom alarm */}
          {!hasBeforeSalahCustom && (
            <SystemAlarmCard
              alarmKey="prayerPreAlert"
              title="تنبيه قبل الصلاة (الاستعداد والوضوء)"
              timingDesc={`قبل الأذان بـ ${pushSettings.preAlertMinutes || 15} دقيقة`}
              enabled={pushSettings.prayerPreAlert}
              isDefault={
                pushSettings.prayerPreAlert === DEFAULT_PUSH_SETTINGS.prayerPreAlert &&
                pushSettings.preAlertMinutes === DEFAULT_PUSH_SETTINGS.preAlertMinutes
              }
              onToggle={handleToggleSystemAlarm}
              onEdit={handleOpenSystemEditModal}
            />
          )}

          {/* 3. تنبيه بعد الصلاة (prayerPostAlert) — Shown if not overridden by custom alarm */}
          {!hasAfterSalahCustom && (
            <SystemAlarmCard
              alarmKey="prayerPostAlert"
              title="تنبيه بعد الصلاة (الأذكار والسنن)"
              timingDesc={`بعد الأذان بـ ${pushSettings.postAlertMinutes || 15} دقيقة`}
              enabled={pushSettings.prayerPostAlert}
              isDefault={
                pushSettings.prayerPostAlert === DEFAULT_PUSH_SETTINGS.prayerPostAlert &&
                pushSettings.postAlertMinutes === DEFAULT_PUSH_SETTINGS.postAlertMinutes
              }
              onToggle={handleToggleSystemAlarm}
              onEdit={handleOpenSystemEditModal}
            />
          )}

          {/* 4. أذكار الصباح (adhkarMorning) — Shown if not overridden by custom alarm */}
          {!hasMorningAdhkarCustom && (
            <SystemAlarmCard
              alarmKey="adhkarMorning"
              title="أذكار الصباح"
              timingDesc={`يومياً الساعة ${pushSettings.morningTime || '07:00'}`}
              enabled={pushSettings.adhkarMorning}
              isDefault={
                pushSettings.adhkarMorning === DEFAULT_PUSH_SETTINGS.adhkarMorning &&
                pushSettings.morningTime === DEFAULT_PUSH_SETTINGS.morningTime
              }
              onToggle={handleToggleSystemAlarm}
              onEdit={handleOpenSystemEditModal}
            />
          )}

          {/* 5. أذكار المساء (adhkarEvening) — Shown if not overridden by custom alarm */}
          {!hasEveningAdhkarCustom && (
            <SystemAlarmCard
              alarmKey="adhkarEvening"
              title="أذكار المساء"
              timingDesc={`يومياً الساعة ${pushSettings.eveningTime || '16:30'}`}
              enabled={pushSettings.adhkarEvening}
              isDefault={
                pushSettings.adhkarEvening === DEFAULT_PUSH_SETTINGS.adhkarEvening &&
                pushSettings.eveningTime === DEFAULT_PUSH_SETTINGS.eveningTime
              }
              onToggle={handleToggleSystemAlarm}
              onEdit={handleOpenSystemEditModal}
            />
          )}

          {/* 6. أذكار دورية (adhkarPeriodic) */}
          <SystemAlarmCard
            alarmKey="adhkarPeriodic"
            title="تذكير دوري بالأذكار والتسبيح"
            timingDesc={`كل ${pushSettings.periodicIntervalHours || 2} ساعات`}
            enabled={pushSettings.adhkarPeriodic}
            isDefault={
              pushSettings.adhkarPeriodic === DEFAULT_PUSH_SETTINGS.adhkarPeriodic &&
              pushSettings.periodicIntervalHours === DEFAULT_PUSH_SETTINGS.periodicIntervalHours
            }
            onToggle={handleToggleSystemAlarm}
            onEdit={handleOpenSystemEditModal}
          />

          {/* 7. سورة الكهف يوم الجمعة (fridayKahf) */}
          <SystemAlarmCard
            alarmKey="fridayKahf"
            title="سورة الكهف والصلاة على النبي ﷺ (الجمعة)"
            timingDesc="كل يوم جمعة بعد شروق الشمس"
            enabled={pushSettings.fridayKahf}
            isDefault={pushSettings.fridayKahf === DEFAULT_PUSH_SETTINGS.fridayKahf}
            onToggle={handleToggleSystemAlarm}
            onEdit={handleOpenSystemEditModal}
          />

          {/* 8. أذكار النوم (sleepAdhkar) */}
          <SystemAlarmCard
            alarmKey="sleepAdhkar"
            title="أذكار النوم وسورة الملك"
            timingDesc={`يومياً الساعة ${pushSettings.sleepTime || '22:30'}`}
            enabled={pushSettings.sleepAdhkar}
            isDefault={
              pushSettings.sleepAdhkar === DEFAULT_PUSH_SETTINGS.sleepAdhkar &&
              pushSettings.sleepTime === DEFAULT_PUSH_SETTINGS.sleepTime
            }
            onToggle={handleToggleSystemAlarm}
            onEdit={handleOpenSystemEditModal}
          />

          {/* 9. ساعات الهدوء (quietHours) */}
          <SystemAlarmCard
            alarmKey="quietHours"
            title="ساعات الهدوء وكتم الإشعارات"
            timingDesc={`من ${pushSettings.quietStart || '23:00'} إلى ${pushSettings.quietEnd || '04:30'}`}
            enabled={pushSettings.quietHours}
            isDefault={
              pushSettings.quietHours === DEFAULT_PUSH_SETTINGS.quietHours &&
              pushSettings.quietStart === DEFAULT_PUSH_SETTINGS.quietStart &&
              pushSettings.quietEnd === DEFAULT_PUSH_SETTINGS.quietEnd
            }
            onToggle={handleToggleSystemAlarm}
            onEdit={handleOpenSystemEditModal}
          />

          {/* 10. الإشعار الدائم لموعد الصلاة (ongoingPrayerBar) */}
          <SystemAlarmCard
            alarmKey="ongoingPrayerBar"
            title="الإشعار الدائم لشريط الصلاة (Ongoing Bar)"
            timingDesc="عد تنازلي مستمر ومثبت في شريط الإشعارات"
            enabled={smartSettings.ongoingPrayerBar.enabled}
            isDefault={
              smartSettings.ongoingPrayerBar.enabled === DEFAULT_SMART_NOTIFICATIONS_SETTINGS.ongoingPrayerBar.enabled
            }
            onToggle={handleToggleSystemAlarm}
            onEdit={handleOpenSystemEditModal}
          />

          {/* 11. ورد قراءة القرآن (readingPortion) */}
          <SystemAlarmCard
            alarmKey="readingPortion"
            title="ورد قراءة القرآن الكريم"
            timingDesc={`يومياً الساعة ${smartSettings.readingPortion.scheduledTime || '17:00'} (هدف ${smartSettings.readingPortion.dailyPagesGoal || 2} صفحات)`}
            enabled={smartSettings.readingPortion.enabled}
            isDefault={
              smartSettings.readingPortion.enabled === DEFAULT_SMART_NOTIFICATIONS_SETTINGS.readingPortion.enabled &&
              smartSettings.readingPortion.scheduledTime === DEFAULT_SMART_NOTIFICATIONS_SETTINGS.readingPortion.scheduledTime
            }
            onToggle={handleToggleSystemAlarm}
            onEdit={handleOpenSystemEditModal}
          />

          {/* 12. ورد استماع القرآن (listeningPortion) */}
          <SystemAlarmCard
            alarmKey="listeningPortion"
            title="ورد استماع القرآن الكريم"
            timingDesc={`يومياً الساعة ${smartSettings.listeningPortion.scheduledTime || '20:00'} (${smartSettings.listeningPortion.versesPerPortion || 5} آيات)`}
            enabled={smartSettings.listeningPortion.enabled}
            isDefault={
              smartSettings.listeningPortion.enabled === DEFAULT_SMART_NOTIFICATIONS_SETTINGS.listeningPortion.enabled &&
              smartSettings.listeningPortion.scheduledTime === DEFAULT_SMART_NOTIFICATIONS_SETTINGS.listeningPortion.scheduledTime
            }
            onToggle={handleToggleSystemAlarm}
            onEdit={handleOpenSystemEditModal}
          />
        </div>
      </div>

      {/* Edit / Add Modal for Custom Alarms */}
      <AlarmEditModal
        isOpen={isModalOpen}
        alarm={selectedAlarm}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAlarm}
        onDelete={promptDeleteAlarm}
        audioVolume={audioVolume}
      />

      {/* Edit Modal for System Alarms */}
      <SystemAlarmEditModal
        isOpen={isSystemModalOpen}
        alarmKey={selectedSystemKey}
        onClose={() => {
          setIsSystemModalOpen(false);
          setSelectedSystemKey(null);
        }}
        pushSettings={pushSettings}
        smartSettings={smartSettings}
        onSavePushSettings={(updated) => {
          setPushSettings(updated);
          savePushSettings(updated);
        }}
        onSaveSmartSettings={(updated) => {
          setSmartSettings(updated);
          saveSmartNotificationsSettings(updated);
        }}
      />

      {/* Custom Delete Confirmation Modal */}
      <AlarmDeleteConfirmModal
        alarmToDelete={alarmToDelete}
        onClose={() => setAlarmToDelete(null)}
        onConfirm={confirmDeleteAlarm}
      />

      {/* Custom Restore Defaults Modal */}
      <AlarmRestoreConfirmModal
        isOpen={showRestoreConfirm}
        onClose={() => setShowRestoreConfirm(false)}
        onConfirm={handleRestoreDefaults}
      />

      {/* Alarm Diagnostics & System Health Modal */}
      <AlarmDiagnosticsModal
        isOpen={showDiagnostics}
        onClose={() => setShowDiagnostics(false)}
        settings={settings}
      />
    </div>
  );
}

