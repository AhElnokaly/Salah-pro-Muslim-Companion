import React from 'react';
import { PrayerName, PrayerLog, AppSettings, PendingQadaPrayer, PrayerStatus } from '../types';
import { getArabicPrayerName } from '../utils/prayerCalc';
import { safeUUID } from '../utils/uuid';
import { PrayerObligatorySelector } from './prayer/quickLog/PrayerObligatorySelector';
import { PrayerSunnahRow } from './prayer/quickLog/PrayerSunnahRow';
import { PrayerNightPrayersSection } from './prayer/quickLog/PrayerNightPrayersSection';
import { PrayerContextualGateways } from './prayer/quickLog/PrayerContextualGateways';

type DashboardTab = 'home' | 'salah' | 'quran' | 'adhkar' | 'qibla' | 'fasting' | 'settings' | 'calendar' | 'widgets' | 'alarms' | 'khushu' | 'moon';

interface PrayerQuickLogModalProps {
  selectedPrayerToLog: PrayerName;
  onClose: () => void;
  todayLogs: Record<string, PrayerLog>;
  todayStr: string;
  hijriFullString: string;
  settings: AppSettings;
  pendingQadaPrayers: PendingQadaPrayer[];
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  handleUpdateSunnah: (prayerName: PrayerName, type: 'before' | 'after', delta: number) => void;
  handleUpdateNafilah: (nafilahName: PrayerName, rakahs: number) => void;
  setShowNightPrayersQuickLog: (val: boolean) => void;
  onNavigateToAdhkarForPrayer?: (prayerName: string) => void;
  setActiveTab?: React.Dispatch<React.SetStateAction<DashboardTab>>;
  now: Date;
}

export const PrayerQuickLogModal: React.FC<PrayerQuickLogModalProps> = ({
  selectedPrayerToLog,
  onClose,
  todayLogs,
  todayStr,
  hijriFullString,
  settings,
  pendingQadaPrayers,
  setPrayerLogs,
  setPendingQadaPrayers,
  handleUpdateSunnah,
  handleUpdateNafilah,
  setShowNightPrayersQuickLog,
  onNavigateToAdhkarForPrayer,
  setActiveTab,
  now,
}) => {
  const log = todayLogs[selectedPrayerToLog] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
  const status = log.status || 'not_yet';
  const prayerDisplayName = getArabicPrayerName(selectedPrayerToLog, now);
  
  const hasSunnahBefore = selectedPrayerToLog === 'Fajr' || selectedPrayerToLog === 'Dhuhr';
  const hasSunnahAfter = selectedPrayerToLog === 'Dhuhr' || selectedPrayerToLog === 'Maghrib' || selectedPrayerToLog === 'Isha';
  
  const sunnahBeforeMax = selectedPrayerToLog === 'Dhuhr' ? 4 : 2;
  const sunnahAfterMax = 2;

  const witrLog = todayLogs['Witr'] || { status: 'not_yet', extraRakahs: 0 };
  const currentWitrRakahs = witrLog.status === 'A' ? (witrLog.extraRakahs || 0) : 0;
  const qiyamLog = todayLogs['Qiyam'] || { status: 'not_yet', extraRakahs: 0 };
  const currentQiyamRakahs = qiyamLog.status === 'A' ? (qiyamLog.extraRakahs || 0) : 0;

  const pendingForThisPrayer = pendingQadaPrayers.filter(q => q.prayerName === selectedPrayerToLog);
  const qadaCount = pendingForThisPrayer.length;
  const isLoggedDone = status === 'A' || status === 'B';

  const handleSelectStatus = (newStatus: PrayerStatus) => {
    const existingLog = todayLogs[selectedPrayerToLog] || { status: 'not_yet', sunnahBefore: 0, sunnahAfter: 0 };
    setPrayerLogs(prev => ({
      ...prev,
      [todayStr]: {
        ...todayLogs,
        [selectedPrayerToLog]: { ...existingLog, status: newStatus }
      }
    }));

    if (newStatus === 'D') {
      const alreadyPending = pendingQadaPrayers.some(
        q => q.date === todayStr && q.prayerName === selectedPrayerToLog
      );
      if (!alreadyPending) {
        const newQada: PendingQadaPrayer = {
          id: safeUUID(),
          date: todayStr,
          hijriDate: hijriFullString,
          prayerName: selectedPrayerToLog
        };
        setPendingQadaPrayers(prev => [...prev, newQada]);
      }
    } else {
      setPendingQadaPrayers(prev => prev.filter(
        q => !(q.date === todayStr && q.prayerName === selectedPrayerToLog)
      ));
    }
  };

  const handleToggleCompleteSunnah = (type: 'before' | 'after', targetAmount: number) => {
    setPrayerLogs(prev => ({
      ...prev,
      [todayStr]: {
        ...todayLogs,
        [selectedPrayerToLog]: {
          ...log,
          [type === 'before' ? 'sunnahBefore' : 'sunnahAfter']: targetAmount
        }
      }
    }));
  };

  const handleNavigateToAdhkar = () => {
    onClose();
    if (onNavigateToAdhkarForPrayer) {
      onNavigateToAdhkarForPrayer(selectedPrayerToLog);
    } else if (setActiveTab) {
      setActiveTab('adhkar');
    }
  };

  const handleResolveQuickQada = () => {
    const firstMatch = pendingForThisPrayer[0];
    if (firstMatch) {
      setPendingQadaPrayers(prev => prev.filter(q => q.id !== firstMatch.id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`نافذة تسجيل صلاة ${prayerDisplayName}`}
        className="bg-white dark:bg-[#161d26] w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-2xl space-y-5"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-2 sm:hidden" />
          <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center justify-center gap-2">
            <span aria-hidden="true">🕌</span>
            صلاة {prayerDisplayName}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            سجل فريضة وسنن صلاة {prayerDisplayName} في مكان واحد
          </p>
        </div>

        {/* 1. Obligatory Prayer Section */}
        <PrayerObligatorySelector
          status={status}
          gender={settings.gender}
          onSelectStatus={handleSelectStatus}
        />

        {/* 2. Sunnah Prayers Section */}
        {(hasSunnahBefore || hasSunnahAfter) && (
          <div className="space-y-2.5 pt-1">
            <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 block">
              السنن الرواتب المصاحبة
            </span>
            <div className="space-y-2">
              {hasSunnahBefore && (
                <PrayerSunnahRow
                  label="سنة قبلية"
                  prayerDisplayName={prayerDisplayName}
                  type="before"
                  currentRakahs={log.sunnahBefore || 0}
                  maxRakahs={sunnahBeforeMax}
                  onUpdateRakahs={(t, delta) => handleUpdateSunnah(selectedPrayerToLog, t, delta)}
                  onToggleComplete={handleToggleCompleteSunnah}
                />
              )}

              {hasSunnahAfter && (
                <PrayerSunnahRow
                  label="سنة بعدية"
                  prayerDisplayName={prayerDisplayName}
                  type="after"
                  currentRakahs={log.sunnahAfter || 0}
                  maxRakahs={sunnahAfterMax}
                  onUpdateRakahs={(t, delta) => handleUpdateSunnah(selectedPrayerToLog, t, delta)}
                  onToggleComplete={handleToggleCompleteSunnah}
                />
              )}
            </div>
          </div>
        )}

        {/* 3. Integrated Night Prayers Section for Isha */}
        {selectedPrayerToLog === 'Isha' && (
          <PrayerNightPrayersSection
            currentWitrRakahs={currentWitrRakahs}
            currentQiyamRakahs={currentQiyamRakahs}
            onUpdateNafilah={handleUpdateNafilah}
            onExpandNightPrayers={() => {
              onClose();
              setShowNightPrayersQuickLog(true);
            }}
          />
        )}

        {/* 4. Contextual Adhkar & Fast Qada Gateway */}
        <PrayerContextualGateways
          selectedPrayerToLog={selectedPrayerToLog}
          prayerDisplayName={prayerDisplayName}
          isLoggedDone={isLoggedDone}
          qadaCount={qadaCount}
          onNavigateToAdhkar={handleNavigateToAdhkar}
          onResolveQuickQada={handleResolveQuickQada}
        />

        {/* 5. Modal Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl text-center transition-all cursor-pointer shadow-md shadow-emerald-200/50 dark:shadow-none hover:scale-[1.01] active:scale-[0.99]"
            aria-label="حفظ وإغلاق نافذة تسجيل الصلاة"
          >
            حفظ وإغلاق
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl text-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="إلغاء نافذة تسجيل الصلاة"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};
