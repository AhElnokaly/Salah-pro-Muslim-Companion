/**
 * SpiritualSummary Engine: Separates metrics across Domain concerns without misleading single percentages.
 */

export interface PrayerPerformanceMetrics {
  totalRequired: number;
  performedInGroup: number;
  performedOnTime: number;
  performedLate: number;
  missed: number;
  excusedDays: number;
}

export interface QuranMetrics {
  pagesReadToday: number;
  dailyGoalPages: number;
  currentKhatmaProgressPercent: number;
}

export interface DhikrMetrics {
  morningCompleted: boolean;
  eveningCompleted: boolean;
  totalSubhaCountToday: number;
}

export interface SpiritualSnapshotSummary {
  prayer: PrayerPerformanceMetrics;
  quran: QuranMetrics;
  dhikr: DhikrMetrics;
  overallHealthScore: number; // 0-100 score based on metrics
}

export class SpiritualSummaryEngine {
  static calculateHealthScore(
    prayer: PrayerPerformanceMetrics,
    quran: QuranMetrics,
    dhikr: DhikrMetrics
  ): number {
    let score = 0;

    // 1. Prayer Contribution (Max 50 points)
    if (prayer.totalRequired > 0) {
      const prayerScore = ((prayer.performedInGroup * 1.0 + prayer.performedOnTime * 0.9 + prayer.performedLate * 0.5) / prayer.totalRequired) * 50;
      score += Math.min(50, Math.max(0, prayerScore));
    } else {
      score += 50;
    }

    // 2. Quran Contribution (Max 25 points)
    if (quran.dailyGoalPages > 0) {
      const quranRatio = Math.min(1, quran.pagesReadToday / quran.dailyGoalPages);
      score += quranRatio * 25;
    }

    // 3. Dhikr Contribution (Max 25 points)
    if (dhikr.morningCompleted) score += 10;
    if (dhikr.eveningCompleted) score += 10;
    if (dhikr.totalSubhaCountToday >= 33) score += 5;

    return Math.round(Math.min(100, Math.max(0, score)));
  }
}
