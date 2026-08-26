/**
 * Snapshot-Driven Nudge Engine
 * Reads unified SpiritualSnapshot and outputs exactly ONE prioritized gentle nudge.
 */

export interface SpiritualSnapshot {
  currentPrayer: string;
  nextPrayer: string;
  nextPrayerMinutesLeft: number;
  morningAdhkarDone: boolean;
  eveningAdhkarDone: boolean;
  quranPagesReadToday: number;
  currentHour: number; // 0-23
}

export interface SpiritualNudge {
  id: string;
  title: string;
  message: string;
  actionKey: 'adhkar' | 'quran' | 'duha' | 'qiyam' | 'qada';
  priority: number;
}

export class NudgeEngine {
  static evaluate(snapshot: SpiritualSnapshot): SpiritualNudge {
    const { currentHour, morningAdhkarDone, eveningAdhkarDone, quranPagesReadToday, nextPrayerMinutesLeft } = snapshot;

    // 1. Morning Adhkar Priority (Between 5 AM and 11 AM)
    if (currentHour >= 5 && currentHour < 11 && !morningAdhkarDone) {
      return {
        id: 'morning_adhkar',
        title: 'أذكار الصباح',
        message: 'ابدأ يومك بذكر الله وحصّن نفسك بأذكار الصباح.',
        actionKey: 'adhkar',
        priority: 10,
      };
    }

    // 2. Duha Prayer Nudge (Between 8 AM and 11 AM)
    if (currentHour >= 8 && currentHour <= 11) {
      return {
        id: 'duha_prayer',
        title: 'صلاة الضحى',
        message: 'صلاة الأوابين - ركعتان تجزئان عن صدقة كل مفصل.',
        actionKey: 'duha',
        priority: 8,
      };
    }

    // 3. Evening Adhkar Priority (Between 3 PM and 8 PM)
    if (currentHour >= 15 && currentHour < 20 && !eveningAdhkarDone) {
      return {
        id: 'evening_adhkar',
        title: 'أذكار المساء',
        message: 'حافظ على أذكار المساء لراحة القلوب والاطمئنان.',
        actionKey: 'adhkar',
        priority: 9,
      };
    }

    // 4. Quran Daily Reading Nudge (If 0 pages read by afternoon)
    if (currentHour >= 14 && quranPagesReadToday === 0) {
      return {
        id: 'quran_reading',
        title: 'ورد القرآن الكريم',
        message: 'لا تجعل يومك يمر دون آيات من كتاب الله.',
        actionKey: 'quran',
        priority: 7,
      };
    }

    // 5. Default Gentle Nudge
    return {
      id: 'general_dhikr',
      title: 'استغفار وذكر',
      message: 'سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى - رَطِّب لِسانَك بِذِكرِ الله.',
      actionKey: 'adhkar',
      priority: 1,
    };
  }
}
