/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type PrayerStatus = 'future' | 'A' | 'B' | 'C' | 'D' | 'not_yet' | 'E' | 'done';
// A: In time (في وقتها), B: Late/Qada (قضاء/متأخر), C/D: Missed (لم يصلها/فائتة), E: Excused/License (عذر شرعي - لا تحسب كفائتة)

export interface PrayerLog {
  status: PrayerStatus;
  sunnahBefore?: number;
  sunnahAfter?: number;
  notes?: string;
  extraRakahs?: number;
  timestamp?: number;
  jamaah?: boolean;
}

export interface PendingQadaPrayer {
  id: string;
  date: string;
  hijriDate: string;
  prayerName: PrayerName;
}

export type VoluntaryPrayerType = 'duha' | 'qiyam' | 'shafi' | 'witr' | 'taraweeh';

export interface VoluntaryPrayerLog {
  id: string;
  appPrayerDay: string; // YYYY-MM-DD standard date string (formatDateKey)
  type: VoluntaryPrayerType;
  rakaat?: number;
  loggedAt?: string | number;
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
  trackMode: 'fasting' | 'fidya' | 'qada';
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
  completedAt?: string;
  attributedHijriYear?: number;
}

export interface QuranSession {
  id: string;
  date: string;
  sessionType: 'read' | 'memorize' | 'review';
  khatmaId?: string;
  unitType: 'pages' | 'juz' | 'surah' | 'verses';
  unitValue: number;
  surahOrJuzName?: string;
  isCorrection?: boolean;
}

export interface JuzProgress {
  juzNumber: number; // 1 to 30
  status: 'not_started' | 'memorized';
  memorizedDate?: string;
  lastReviewedDate?: string;
  reviewIntervalDays?: number; // default 30 days
  reviewRating?: 'excellent' | 'medium' | 'needs_repeat';
}

export interface MemorizationRoutine {
  id: string;
  type: 'memorize' | 'review';
  unitType: 'verses' | 'pages' | 'juz';
  unitValue: number;
  surahOrJuz?: string;
  reminderDays: number[]; // 0 = Sun, 1 = Mon ...
  reminderTime?: string;
  notificationEnabled: boolean;
  createdAt: string;
}

export interface VerseCardConfig {
  surahName: string;
  surahNumber: number;
  ayahNumber: number | string;
  ayahText: string;
  theme: 'green_gradient' | 'cream_light' | 'dark_elegant' | 'cyan_gold';
  fontSize: number;
  wisdomWord?: string;
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

export type BackdropType = 
  | 'gold' 
  | 'classic' 
  | 'banner' 
  | 'emerald' 
  | 'night_sky' 
  | 'kaaba' 
  | 'andulas' 
  | 'minimal' 
  | 'ramadan' 
  | 'eid_fitr' 
  | 'eid_adha' 
  | 'friday' 
  | 'madinah'
  | 'aqsa'
  | 'glass_crystal'
  | 'glass_emerald'
  | 'glass_blue'
  | 'glass_dark'
  | 'auto';

export type BackdropRenderMode = 'lineArt' | 'illustrated' | 'auto';

export interface AppSettings {
  latitude: number;
  longitude: number;
  cityName: string;
  timezoneId?: string;
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
  backdropStyle?: 'gold' | 'classic' | 'banner' | 'emerald' | 'night_sky' | 'kaaba' | 'andulas' | 'minimal' | 'ramadan' | 'eid_fitr' | 'eid_adha' | 'friday' | 'madinah' | 'aqsa' | 'glass_crystal' | 'glass_emerald' | 'glass_blue' | 'glass_dark' | 'auto';
  backdropRenderMode?: BackdropRenderMode;
  backdropOpacity?: number; // 10 to 100 percentage
  cardTheme?: 'dynamic' | 'gold_luxury' | 'emerald_royal' | 'velvet_night' | 'sunset_amber' | 'cyan_dome' | 'rose_twilight' | 'dark_onyx' | 'pure_light';
  clockStyle?: 'digital' | 'analog';
  cardCompactMode?: boolean;
  gender?: 'male' | 'female';
  isWomenExcuse?: boolean;
  annualKhatmaGoal?: number;
  persistentNotificationEnabled?: boolean;
  pinnedWidget?: {
    type: string;
    theme: string;
    wallpaper?: string;
    enabled?: boolean;
    clockStyle?: 'none' | 'digital' | 'analog';
    showMoonPhase?: boolean;
    prayerDisplay?: 'none' | 'next_only' | 'all_prayers';
    showDate?: boolean;
    showDhikr?: boolean;
    showAyah?: boolean;
    showQibla?: boolean;
    showSubhaBtn?: boolean;
    showProgressBar?: boolean;
    cardSize?: 'compact' | 'medium' | 'large';
  };
  mainCardLayout?: MainCardLayout;
}

export type CardBlockId =
  | 'dateHeader'
  | 'eventTag'
  | 'greeting'
  | 'clock'
  | 'nextPrayer'
  | 'progressBar'
  | 'sunnahQuote';

export type CardBlockSize = 'compact' | 'normal' | 'large';
export type CardBlockAccent = 'default' | 'emerald' | 'amber' | 'violet' | 'rose' | 'sky';

export interface CardBlockConfig {
  id: CardBlockId;
  visible: boolean;
  order: number;
  size: CardBlockSize;
  accent: CardBlockAccent;
}

export interface MainCardLayout {
  blocks: CardBlockConfig[];
  presetName?: 'default' | 'minimal' | 'full' | 'custom';
}

export const DEFAULT_CARD_LAYOUT: MainCardLayout = {
  presetName: 'default',
  blocks: [
    { id: 'dateHeader',  visible: true, order: 1, size: 'normal',  accent: 'default' },
    { id: 'eventTag',    visible: true, order: 2, size: 'compact', accent: 'amber'   },
    { id: 'greeting',    visible: true, order: 3, size: 'compact', accent: 'default' },
    { id: 'clock',       visible: true, order: 4, size: 'large',   accent: 'default' },
    { id: 'nextPrayer',  visible: true, order: 5, size: 'normal',  accent: 'emerald' },
    { id: 'progressBar', visible: true, order: 6, size: 'normal',  accent: 'default' },
    { id: 'sunnahQuote', visible: true, order: 7, size: 'compact', accent: 'default' },
  ],
};

export type AlarmSoundType = 'adhan' | 'speech' | 'duaa' | 'hayya' | 'takbeer' | 'alsalatu_khayr' | 'salawat' | 'istighfar' | 'beep' | 'vibrate' | 'silent';

export type AlarmNotifyMode = 'sound' | 'vibrate' | 'both' | 'silent';

export interface AlarmConfig {
  id: string;
  title: string;
  time: string; // "HH:MM"
  days: number[];
  enabled: boolean;
  soundType: AlarmSoundType;
  notifyMode?: AlarmNotifyMode;
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

// ============================================
// Muezzin / Audio Types
// ============================================

export interface MuezzinOption {
  id: string;
  name: string;
  nameAr?: string;
  src?: string;          // URL or path
  url?: string;
  localFile?: string;    // cached blob URL
  archiveUrl?: string;   // archive.org fallback
  isCustom?: boolean;
  isDownloaded?: boolean;
  isFajr?: boolean;
}

// ============================================
// Prayer Times Type
// ============================================

export type TabId = 'home' | 'salah' | 'quran' | 'adhkar' | 'qibla' | 'fasting' | 'settings' | 'calendar' | 'widgets' | 'alarms' | 'khushu' | 'analytics' | 'moon';

export type SettingsSubTabId = 'qada' | 'prayer' | 'adhan' | 'calendar' | 'theme' | 'location' | 'backup' | 'duas' | 'dashboard';

export type ClockFace = 'classic' | 'islamic' | 'minimal' | 'hybrid';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface RecentUserData {
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  pendingQadaPrayers: PendingQadaPrayer[];
  fastingLogs: Record<string, FastingLog>;
  quranSessions: QuranSession[];
  dhikrLogs: Record<string, Record<string, number>>;
}
