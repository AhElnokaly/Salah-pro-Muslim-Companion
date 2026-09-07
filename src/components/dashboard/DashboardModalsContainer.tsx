import React from 'react';
import { FuturePrayerWarningModal } from '../FuturePrayerWarningModal';
import { PrayerQuickLogModal } from '../PrayerQuickLogModal';
import { SpiritualNotificationsModal, SpiritualNotification } from './SpiritualNotificationsModal';
import PushNotificationManager from '../PushNotificationManager';
import { DuhaQuickLogModal } from '../DuhaQuickLogModal';
import { NightPrayersQuickLogModal } from '../NightPrayersQuickLogModal';
import AppModal from '../shared/AppModal';
import { AppSettings, DailyPrayerLogs, VoluntaryPrayerLog, PendingQadaPrayer, PrayerLog, PrayerName, DashboardTab } from '../../types';

interface DashboardModalsContainerProps {
  futurePrayerWarning: PrayerName | null;
  setFuturePrayerWarning: (p: PrayerName | null) => void;
  selectedPrayerToLog: PrayerName | null;
  setSelectedPrayerToLog: (p: PrayerName | null) => void;
  todayLogs: Record<string, PrayerLog>;
  todayStr: string;
  hijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  settings: AppSettings;
  pendingQadaPrayers: PendingQadaPrayer[];
  prayerLogs: DailyPrayerLogs;
  setPrayerLogs: React.Dispatch<React.SetStateAction<DailyPrayerLogs>>;
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  voluntaryPrayerLogs?: Record<string, VoluntaryPrayerLog[]>;
  setVoluntaryPrayerLogs?: React.Dispatch<React.SetStateAction<Record<string, VoluntaryPrayerLog[]>>>;
  handleUpdateSunnah: (prayer: PrayerName, completed: boolean) => void;
  handleUpdateNafilah: (nafilahKey: string, completed: boolean) => void;
  showNightPrayersQuickLog: boolean;
  setShowNightPrayersQuickLog: (show: boolean) => void;
  showDuhaQuickLog: boolean;
  setShowDuhaQuickLog: (show: boolean) => void;
  showNotificationsModal: boolean;
  setShowNotificationsModal: (show: boolean) => void;
  showPushControlCenter: boolean;
  setShowPushControlCenter: (show: boolean) => void;
  spiritualNotifications: SpiritualNotification[];
  appModal: { message: string; variant?: 'info' | 'warning' | 'danger' } | null;
  setAppModal: (modal: { message: string; variant?: 'info' | 'warning' | 'danger' } | null) => void;
  onNavigateToAdhkarForPrayer?: (prayerName: string) => void;
  setActiveTab?: (tab: DashboardTab | string) => void;
  now: Date;
}

export const DashboardModalsContainer: React.FC<DashboardModalsContainerProps> = ({
  futurePrayerWarning,
  setFuturePrayerWarning,
  selectedPrayerToLog,
  setSelectedPrayerToLog,
  todayLogs,
  todayStr,
  hijri,
  settings,
  pendingQadaPrayers,
  prayerLogs,
  setPrayerLogs,
  setPendingQadaPrayers,
  voluntaryPrayerLogs,
  setVoluntaryPrayerLogs,
  handleUpdateSunnah,
  handleUpdateNafilah,
  showNightPrayersQuickLog,
  setShowNightPrayersQuickLog,
  showDuhaQuickLog,
  setShowDuhaQuickLog,
  showNotificationsModal,
  setShowNotificationsModal,
  showPushControlCenter,
  setShowPushControlCenter,
  spiritualNotifications,
  appModal,
  setAppModal,
  onNavigateToAdhkarForPrayer,
  setActiveTab,
  now
}) => {
  return (
    <>
      {/* Warning Dialog for Future Prayers */}
      {futurePrayerWarning && (
        <FuturePrayerWarningModal
          prayerName={futurePrayerWarning}
          onClose={() => setFuturePrayerWarning(null)}
          onProceedTravel={(pName) => {
            setSelectedPrayerToLog(pName);
            setFuturePrayerWarning(null);
          }}
          now={now}
        />
      )}

      {/* Logging Dialog / Bottom Sheet Modal */}
      {selectedPrayerToLog && (
        <PrayerQuickLogModal
          selectedPrayerToLog={selectedPrayerToLog}
          onClose={() => setSelectedPrayerToLog(null)}
          todayLogs={todayLogs}
          todayStr={todayStr}
          hijriFullString={hijri.fullString}
          settings={settings}
          pendingQadaPrayers={pendingQadaPrayers}
          setPrayerLogs={setPrayerLogs}
          setPendingQadaPrayers={setPendingQadaPrayers}
          handleUpdateSunnah={handleUpdateSunnah}
          handleUpdateNafilah={handleUpdateNafilah}
          setShowNightPrayersQuickLog={setShowNightPrayersQuickLog}
          onNavigateToAdhkarForPrayer={onNavigateToAdhkarForPrayer}
          setActiveTab={setActiveTab}
          now={now}
        />
      )}

      {/* Spiritual Notifications Modal */}
      <SpiritualNotificationsModal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        notifications={spiritualNotifications}
        onOpenPushSettings={() => setShowPushControlCenter(true)}
      />

      {/* Push Notification Control Center Modal */}
      <PushNotificationManager
        isOpen={showPushControlCenter}
        onClose={() => setShowPushControlCenter(false)}
      />

      {/* Contextual Quick Log Modals */}
      {showDuhaQuickLog && (
        <DuhaQuickLogModal
          isOpen={showDuhaQuickLog}
          onClose={() => setShowDuhaQuickLog(false)}
          prayerLogs={prayerLogs}
          setPrayerLogs={setPrayerLogs}
          voluntaryPrayerLogs={voluntaryPrayerLogs || {}}
          setVoluntaryPrayerLogs={setVoluntaryPrayerLogs || (() => {})}
        />
      )}

      {showNightPrayersQuickLog && (
        <NightPrayersQuickLogModal
          isOpen={showNightPrayersQuickLog}
          onClose={() => setShowNightPrayersQuickLog(false)}
          prayerLogs={prayerLogs}
          setPrayerLogs={setPrayerLogs}
          voluntaryPrayerLogs={voluntaryPrayerLogs || {}}
          setVoluntaryPrayerLogs={setVoluntaryPrayerLogs || (() => {})}
        />
      )}

      {appModal && (
        <AppModal
          message={appModal.message}
          variant={appModal.variant}
          onClose={() => setAppModal(null)}
        />
      )}
    </>
  );
};
