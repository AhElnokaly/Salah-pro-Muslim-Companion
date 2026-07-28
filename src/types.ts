/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type PrayerStatus = 'future' | 'A' | 'B' | 'C' | 'D' | 'not_yet' | 'E';
// A: In time (في وقتها), B: Late/Qada (قضاء/متأخر), C/D: Missed (لم يصلها/فائتة), E: Excused/License (عذر شرعي - لا تحسب كفائتة)

export interface PrayerLog {
  status: PrayerStatus;
  sunnahBefore: number;
  sunnahAfter: number;
  notes?: string;
  extraRakahs?: number;
}

export interface PendingQadaPrayer {
  id: string;
  date: string;
  hijriDate: string;
  prayerName: PrayerName;
}

export interface FastingLog {
  date: string;
  hijriDate: string;
  fastType: 'Ramadan' | 'Sunnah' | 'Qada' | 'Kaffarah' | 'Nazar';
  fasted: boolean;
  isQada: boolean;
  qadaForDate?: string;
  reason?: string;
}

export interface RamadanQadaTracker {
  daysOwed: number;
  daysCompleted: number;
  trackMode: 'fasting' | 'fidya';
  fidyaTarget: number;
  fidyaCompleted: number;
  reason?: string;
}

export interface QuranKhatma {
  id: string;
  name: string;
  startDate: string;
  durationDays: number;
  totalPages: number;
  currentPage: number;
  status: 'active' | 'completed';
}

export interface QuranSession {
  id: string;
  date: string;
  sessionType: 'read' | 'memorize' | 'review';
  khatmaId?: string;
  unitType: 'pages' | 'juz' | 'surah';
  unitValue: number;
}

export interface DhikrLog {
  id: string;
  date: string;
  dhikrType: string;
  count: number;
  target: number;
}

export interface CustomDua {
  id: string;
  text: string;
  showOnHome: boolean;
  order: number;
}

export interface AppSettings {
  latitude: number;
  longitude: number;
  cityName: string;
  calcMethod: string; // 'Egypt' | 'UmmAlQura' | 'ISNA' | 'MWL' | 'Karachi' | 'Tehran' | 'Gulf'
  madhab: 'standard' | 'hanafi'; // standard = Shafi'i, Maliki, Hanbali
  hijriOffset: number; // -2 to +2
  trackingStartDate?: string;
  trackingStartPrayer?: PrayerName;
  adhanEnabled: Record<PrayerName, boolean>;
  hasCompletedOnboarding: boolean;
  theme?: 'light' | 'dark' | 'system';
  prayerOffsets?: Record<PrayerName, number>;
  prayerVolumes?: Record<string, number>;
  appStyle?: 'glass-dark' | 'faith-bright';
  primaryCalendar?: 'hijri' | 'gregorian';
  backdropStyle?: 'gold' | 'classic' | 'banner' | 'emerald' | 'night_sky' | 'kaaba' | 'andulas' | 'minimal' | 'auto';
  cardTheme?: 'dynamic' | 'gold_luxury' | 'emerald_royal' | 'velvet_night' | 'sunset_amber' | 'cyan_dome' | 'rose_twilight' | 'dark_onyx' | 'pure_light';
  clockStyle?: 'digital' | 'analog';
  cardCompactMode?: boolean;
  gender?: 'male' | 'female';
  pinnedWidget?: {
    type: string;
    theme: string;
    wallpaper: string;
  };
}

export interface AlarmConfig {
  id: string;
  title: string;
  time: string; // "HH:MM"
  days: number[];
  enabled: boolean;
  soundType: 'adhan' | 'azan' | 'beep' | 'vibrate' | 'silent';
}

export interface SpiritualAlertRule {
  enabled: boolean;
  minutes: number;
  days: number[];
  prayers: PrayerName[];
}

export interface SpiritualAlerts {
  before: SpiritualAlertRule;
  after: SpiritualAlertRule;
  duha: { enabled: boolean; minutes: number; days: number[] };
}

export interface ActiveNudge {
  ruleId: string;
  message: string;
  actionKey?: string;
}

export interface RecentUserData {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  fastingLogs: Record<string, FastingLog>;
  quranSessions: QuranSession[];
  dhikrLogs: Record<string, Record<string, number>>;
}
