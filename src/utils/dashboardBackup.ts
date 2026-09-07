import { 
  AppSettings, 
  PrayerLog, 
  PendingQadaPrayer, 
  VoluntaryPrayerLog, 
  RamadanQadaTracker, 
  CustomDua, 
  QuranSession, 
  QuranKhatma 
} from '../types';
import { safeSetItem } from './storage';

export interface DashboardBackupDataProps {
  settings: AppSettings;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  voluntaryPrayerLogs?: VoluntaryPrayerLog[];
  fastingLogs: Record<string, { date: string; fasted: boolean; fastType: string }>;
  ramadanQada?: RamadanQadaTracker;
  customDuas: CustomDua[];
  quranSessions?: QuranSession[];
  khatmat?: QuranKhatma[];
  dhikrLogs?: Record<string, Record<string, number>>;
  todayStr: string;
  setDismissedBackupBanner: (v: boolean) => void;
}

export function exportDashboardBackup({
  settings,
  prayerLogs,
  pendingQadaPrayers,
  voluntaryPrayerLogs,
  fastingLogs,
  ramadanQada,
  customDuas,
  quranSessions,
  khatmat,
  dhikrLogs,
  todayStr,
  setDismissedBackupBanner,
}: DashboardBackupDataProps) {
  const backupData = {
    settings,
    prayerLogs,
    pendingQadaPrayers,
    voluntaryPrayerLogs,
    fastingLogs,
    ramadanQada,
    customDuas,
    quranSessions,
    khatmat,
    dhikrLogs,
    exportDate: new Date().toISOString()
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `refaiq_backup_${todayStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  safeSetItem('salah_last_backup_time', Date.now().toString());
  setDismissedBackupBanner(true);
}
