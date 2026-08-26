/**
 * Pure Prayer Domain Types & Interfaces
 */

export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

export type PrayerStatusType = 'ontime' | 'jamah' | 'late' | 'missed' | 'excused';

export interface PrayerRecord {
  dateStr: string;
  prayer: PrayerName;
  status: PrayerStatusType;
  loggedAt: number;
  notes?: string;
}

export interface PrayerDayOverview {
  dateStr: string;
  records: Record<PrayerName, PrayerRecord | null>;
  totalCompleted: number;
}
