/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
import type { AppSettings, AlarmConfig, SpiritualAlerts } from '../types';
import { DEFAULT_WORSHIP_ALARMS } from '../utils/alarmUtils';
import { safeSetItem } from '../utils/storage';
import { requestNotificationPermission as requestNativeNotificationPermission } from '../services/athanAlarmPlugin';
import { showAppNotification } from '../utils/pushNotificationService';
import AlarmCard from './alarms/AlarmCard';
import AlarmEditModal from './alarms/AlarmEditModal';
import { AlarmHeader } from './alarms/AlarmHeader';
import { AlarmPermissionBanner } from './alarms/AlarmPermissionBanner';
import { AlarmEmptyState } from './alarms/AlarmEmptyState';
import { AlarmDeleteConfirmModal, AlarmRestoreConfirmModal } from './alarms/AlarmConfirmModals';
import { AlarmDiagnosticsModal } from './AlarmDiagnosticsModal';

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
  settings: _settings,
  setSettings: _setSettings,
  customAlarms,
  setCustomAlarms,
  alerts: _alerts,
  setAlerts: _setAlerts,
  audioVolume,
  setAudioVolume
}: WorshipAlarmsProps) {
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmConfig | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Dedicated custom confirmation dialogs (avoids window.confirm browser blockers)
  const [alarmToDelete, setAlarmToDelete] = useState<AlarmConfig | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Sync notification permission state
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestPermission = async () => {
    try {
      await requestNativeNotificationPermission();
    } catch (e) {
      console.warn('Native notification request error:', e);
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

  const handleToggleAlarm = (id: string, enabled: boolean) => {
    setCustomAlarms(prev => {
      const next = prev.map(a => a.id === id ? { ...a, enabled } : a);
      safeSetItem('salah_custom_alarms', JSON.stringify(next));
      return next;
    });
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
      return next;
    });
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
        return next;
      });
      setAlarmToDelete(null);
    }
  };

  const handleRestoreDefaults = () => {
    setCustomAlarms(DEFAULT_WORSHIP_ALARMS);
    safeSetItem('salah_custom_alarms', JSON.stringify(DEFAULT_WORSHIP_ALARMS));
    setShowRestoreConfirm(false);
  };

  const enabledCount = customAlarms.filter(a => a.enabled).length;

  return (
    <div className="pb-16 max-w-4xl mx-auto space-y-4 sm:space-y-5 animate-fade-in">
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

      {/* Alarms List or Empty State */}
      <div className="space-y-3">
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

      {/* Footer / Reset Defaults Helper */}
      {customAlarms.length > 0 && (
        <div className="flex items-center justify-between pt-2 px-1 text-xs font-bold text-slate-400 flex-wrap gap-2">
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

      {/* Edit / Add Modal */}
      <AlarmEditModal
        isOpen={isModalOpen}
        alarm={selectedAlarm}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAlarm}
        onDelete={promptDeleteAlarm}
        audioVolume={audioVolume}
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
        settings={_settings}
      />
    </div>
  );
}
