/**
 * Weekly Reflection Engine & Explainable No-Guilt Analytics
 */

export interface WeeklyActivityLog {
  prayersLoggedOnTime: number;
  totalPrayersRequired: number; // usually 35 per week
  adhkarDaysCompleted: number;
  quranDaysRead: number;
  qiyamCount: number;
}

export interface WeeklyReflectionOutput {
  prayerRatePercent: number;
  reflectionSummary: string;
  positiveHighlight: string;
  gentleEncouragement: string;
  breakdown: string[];
}

export class WeeklyReflectionEngine {
  static generateReflection(log: WeeklyActivityLog): WeeklyReflectionOutput {
    const totalRequired = Math.max(1, log.totalPrayersRequired || 35);
    const prayerPercent = Math.round((log.prayersLoggedOnTime / totalRequired) * 100);

    const breakdown: string[] = [
      `✓ المحافظة على الصلوات: ${prayerPercent}% من الصلوات الأسبوعية`,
      `✓ الأذكار: التزمت بالأذكار في ${log.adhkarDaysCompleted} أيام من الأسبوع`,
      `✓ القرآن الكريم: قرأت وردك في ${log.quranDaysRead} أيام`,
    ];

    if (log.qiyamCount > 0) {
      breakdown.push(`✓ قيام الليل: وُفِّقْتَ للقيام ${log.qiyamCount} مرات هذا الأسبوع`);
    }

    let summary = 'أسبوع مبارك وطاعة مستمرة بحمد الله.';
    let highlight = 'ثباتك هذا الأسبوع خطوة مباركة نحو الاستمرارية.';
    let encouragement = 'ابدأ من الصلاة القادمة بنية صادقة وقلب حاضِر.';

    if (prayerPercent >= 80) {
      summary = 'أداء ممتاز وثبات يبعث على الطمأنينة.';
      highlight = 'أحسنت! حافظت على معظم صلواتك في أوقاتها.';
    } else if (prayerPercent >= 50) {
      summary = 'محاولة صالحة وتقدم طيب هذا الأسبوع.';
      highlight = 'خطوات إيجابية مباركة، والاستمرار هو سر الفتح.';
    }

    return {
      prayerRatePercent: prayerPercent,
      reflectionSummary: summary,
      positiveHighlight: highlight,
      gentleEncouragement: encouragement,
      breakdown,
    };
  }
}
