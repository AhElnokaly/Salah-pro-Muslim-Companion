/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ActiveNudge, RecentUserData, PrayerName, PrayerStatus } from '../types';
import { toArabicNumbers, formatArabicDayCount } from './hijri';

interface MessageTemplate {
  id: string;
  template: string;
}

const TEMPLATES: MessageTemplate[] = [
  { id: 'missed_pattern_suggest', template: 'لاحظنا إنك بتفوّت {x} مؤخراً، إيه رأيك نفعّل {z}؟' },
  { id: 'streak_encourage',       template: 'ما شاء الله! معاك {y} في {x}، كمّل عليها 🤍' },
  { id: 'improvement_praise',     template: 'لاحظنا تحسناً كبيراً في صلاة {x} الأسبوع ده، ثبتك الله.' },
  { id: 'general_reminder',       template: 'عن النبي ﷺ: «أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِنْ قَلَّ». خطوة صغيرة مستمرة تصنع فارقاً.' },
];

function renderTemplate(id: string, vars: Record<string, string>) {
  const item = TEMPLATES.find(t => t.id === id);
  if (!item) return '';
  let t = item.template;
  return t.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function generateActiveNudge(data: RecentUserData): ActiveNudge {
  // Check for prayer streaks
  const today = new Date();
  
  // Calculate general counts for the last 7 days
  const last7Days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }
  
  // 1. Check if there is a streak of "A" (in time) prayers
  let totalPrayersLogged = 0;
  let onTimeCount = 0;
  
  // Let's check Fajr specifically as it's the most common target
  let fajrOnTimeStreak = 0;
  for (const dateStr of last7Days) {
    const dayLog = data.prayerLogs[dateStr];
    if (dayLog && dayLog['Fajr']) {
      totalPrayersLogged++;
      if (dayLog['Fajr'].status === 'A') {
        fajrOnTimeStreak++;
      } else {
        break;
      }
    }
  }

  if (fajrOnTimeStreak >= 3) {
    return {
      ruleId: 'fajr_streak',
      message: renderTemplate('streak_encourage', {
        x: 'المواظبة على صلاة الفجر في وقتها',
        y: formatArabicDayCount(fajrOnTimeStreak)
      }),
      actionKey: 'encourage'
    };
  }

  // 2. Check for missed prayers (status D) in the last 7 days to suggest Qada or alarm activation
  const missedCount: Record<PrayerName, number> = {
    Fajr: 0, Sunrise: 0, Dhuhr: 0, Asr: 0, Maghrib: 0, Isha: 0
  };
  
  for (const dateStr of last7Days) {
    const dayLog = data.prayerLogs[dateStr];
    if (dayLog) {
      for (const pName of Object.keys(dayLog) as PrayerName[]) {
        if (dayLog[pName]?.status === 'D') {
          missedCount[pName] = (missedCount[pName] ?? 0) + 1;
        }
      }
    }
  }

  const highestMissedPrayer = (Object.keys(missedCount) as PrayerName[]).reduce((a, b) => 
    missedCount[a] > missedCount[b] ? a : b
  );

  if (missedCount[highestMissedPrayer] >= 2) {
    const mapArabic: Record<PrayerName, string> = {
      Fajr: 'صلاة الفجر',
      Sunrise: 'شروق الشمس',
      Dhuhr: 'صلاة الظهر',
      Asr: 'صلاة العصر',
      Maghrib: 'صلاة المغرب',
      Isha: 'صلاة العشاء',
    };
    return {
      ruleId: 'suggest_alarm',
      message: renderTemplate('missed_pattern_suggest', {
        x: mapArabic[highestMissedPrayer],
        z: `تنبيهات الأذان لهذه الصلاة`
      }),
      actionKey: 'enable_alarm_' + highestMissedPrayer
    };
  }

  // 3. Check fasting streak
  let fastingStreak = 0;
  for (const dateStr of last7Days) {
    const fLog = data.fastingLogs[dateStr];
    if (fLog && fLog.fasted) {
      fastingStreak++;
    } else if (fLog) {
      break;
    }
  }

  if (fastingStreak >= 2) {
    return {
      ruleId: 'fasting_streak',
      message: renderTemplate('streak_encourage', {
        x: 'الصيام المبارك',
        y: formatArabicDayCount(fastingStreak)
      }),
      actionKey: 'encourage'
    };
  }

  // 4. Default warm, encouraging Hadith
  return {
    ruleId: 'default_motivation',
    message: renderTemplate('general_reminder', {}),
    actionKey: 'general'
  };
}
