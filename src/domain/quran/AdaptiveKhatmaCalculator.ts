/**
 * Adaptive Khatma Calculator (No-Guilt Quran Progress Engine)
 * Recalculates manageable daily targets if missed days occur without overwhelming the user.
 */

export interface KhatmaPlanInput {
  totalPages: number; // e.g., 604
  startPage: number;
  currentPage: number;
  targetDays: number;
  daysPassed: number;
}

export interface AdaptiveKhatmaResult {
  recommendedPagesPerDay: number;
  remainingPages: number;
  remainingDays: number;
  adjustedTargetDays: number;
  encouragementMessage: string;
}

export class AdaptiveKhatmaCalculator {
  static calculatePlan(input: KhatmaPlanInput): AdaptiveKhatmaResult {
    const totalPages = input.totalPages || 604;
    const currentPage = Math.max(0, input.currentPage || 1);
    const remainingPages = Math.max(0, totalPages - currentPage);

    let remainingDays = Math.max(1, input.targetDays - input.daysPassed);

    // If remaining days became too short (e.g. 1-2 days left for 200 pages), gently auto-extend plan
    let adjustedTargetDays = input.targetDays;
    if (remainingPages / remainingDays > 20) {
      // Auto-extend plan by additional days to keep daily goal under 20 pages (1 Juz max)
      const feasibleDays = Math.ceil(remainingPages / 10);
      remainingDays = Math.max(remainingDays, feasibleDays);
      adjustedTargetDays = input.daysPassed + remainingDays;
    }

    const pagesPerDay = Math.ceil(remainingPages / remainingDays);

    let encouragement = 'واصل على بركة الله، خطوات ثابتة خير من خُطىً متقطعة.';
    if (pagesPerDay <= 4) {
      encouragement = 'ورْدٌ لطيف وميسر، صفحتان بعد كل صلاة تكفيك وزيادة.';
    } else if (pagesPerDay <= 10) {
      encouragement = 'ورْدُ نصف جزء يومياً، نِعمَ الرفيق لكتاب الله.';
    } else {
      encouragement = 'ورْدُ جزء يومياً، فتح الله عليك بارك في وقتك.';
    }

    return {
      recommendedPagesPerDay: pagesPerDay,
      remainingPages,
      remainingDays,
      adjustedTargetDays,
      encouragementMessage: encouragement,
    };
  }
}
