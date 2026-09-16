/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuranReciterOption {
  id: string;
  name: string;
  subname: string;
  audioBaseUrl: string; // EveryAyah base URL format
}

export const QURAN_RECITERS: QuranReciterOption[] = [
  {
    id: 'ajamy',
    name: 'أحمد بن علي العجمي',
    subname: 'رواية حفص عن عاصم',
    audioBaseUrl: 'https://everyayah.com/data/Ahmed_ibn_Ali_al-Ajamy_128kbps',
  },
  {
    id: 'afasy',
    name: 'مشاري بن راشد العفاسي',
    subname: 'رواية حفص عن عاصم',
    audioBaseUrl: 'https://everyayah.com/data/Alafasy_128kbps',
  },
  {
    id: 'minshawi',
    name: 'محمد صديق المنشاوي',
    subname: 'المصحف المرتل',
    audioBaseUrl: 'https://everyayah.com/data/Minshawy_Murattal_128kbps',
  },
  {
    id: 'husary',
    name: 'محمود خليل الحصري',
    subname: 'المصحف المرتل',
    audioBaseUrl: 'https://everyayah.com/data/Husary_128kbps',
  },
  {
    id: 'abdulbasit',
    name: 'عبد الباسط عبد الصمد',
    subname: 'المصحف المرتل',
    audioBaseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps',
  },
];

export interface OngoingPrayerBarConfig {
  enabled: boolean;
  showHijriDate: boolean;
  showLocation: boolean;
  showSeconds: boolean;
}

export interface QuranReadingPortionConfig {
  enabled: boolean;
  dailyPagesGoal: number; // e.g. 2
  currentPage: number; // e.g. 220
  scheduledTime: string; // e.g. "17:00" (5:00 PM)
  completedToday: boolean;
  lastCompletedDate?: string;
  streakDays: number;
}

export interface QuranListeningPortionConfig {
  enabled: boolean;
  versesPerPortion: number; // e.g. 5
  reciterId: string; // 'ajamy'
  surahNumber: number; // e.g. 96 (Al-Alaq)
  startAyah: number; // e.g. 1
  scheduledTime: string; // e.g. "20:00" (8:00 PM)
  completedToday: boolean;
  lastCompletedDate?: string;
}

export interface ContextualAdhkarConfig {
  enabled: boolean;
  morningTime: string; // e.g. "05:15"
  eveningTime: string; // e.g. "16:56"
  includeQuotes: boolean;
}

export interface SmartNotificationsSettings {
  ongoingPrayerBar: OngoingPrayerBarConfig;
  readingPortion: QuranReadingPortionConfig;
  listeningPortion: QuranListeningPortionConfig;
  contextualAdhkar: ContextualAdhkarConfig;
}

export const DEFAULT_SMART_NOTIFICATIONS_SETTINGS: SmartNotificationsSettings = {
  ongoingPrayerBar: {
    enabled: true,
    showHijriDate: true,
    showLocation: true,
    showSeconds: true,
  },
  readingPortion: {
    enabled: true,
    dailyPagesGoal: 2,
    currentPage: 220,
    scheduledTime: '17:00',
    completedToday: false,
    streakDays: 4,
  },
  listeningPortion: {
    enabled: true,
    versesPerPortion: 5,
    reciterId: 'ajamy',
    surahNumber: 96, // Al-Alaq
    startAyah: 1,
    scheduledTime: '20:00',
    completedToday: false,
  },
  contextualAdhkar: {
    enabled: true,
    morningTime: '05:15',
    eveningTime: '16:56',
    includeQuotes: true,
  },
};
