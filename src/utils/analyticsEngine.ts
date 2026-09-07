/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FeatureDefinition, FEATURES_LIST } from '../data/featuresList';
import { BadgeTierInfo, getBadgeTierForRate } from '../data/badgeTiers';
import {
  loadAnalyticsData,
  getTodayDateString,
  getDatesInRange,
  getWomenExcuseMode,
} from './analyticsStorage';

export interface CardFeatureSummaryItem {
  feature: FeatureDefinition;
  todayCount: number;
  todayCompletion: number;
  weeklyCount: number;
  weeklyCompletion: number;
  monthlyCount: number;
  monthlyCompletion: number;
  lifetimeCount: number;
  lifetime100Completion: number;
  completionRate: number; // 0 to 100
  badgeTier: BadgeTierInfo;
  smartCTA: {
    label: string;
    isCompleted100: boolean;
    buttonText: string;
    badgeStyle: string;
  };
  lastUsedText: string;
}

export function getCardSummaries(
  selectedPeriod: 'daily' | 'weekly' | 'monthly' | 'all' = 'weekly'
): CardFeatureSummaryItem[] {
  const data = loadAnalyticsData();
  const todayStr = getTodayDateString();
  const last7Days = getDatesInRange(7);
  const last30Days = getDatesInRange(30);
  const isWomenExcuse = getWomenExcuseMode();

  return FEATURES_LIST.map((feature) => {
    const record = data[feature.id] || {
      usageLogs: {},
      completionLogs: {},
      totalUsage: 0,
      totalCompletion: 0,
    };

    const todayCount = record.usageLogs[todayStr] || 0;
    const todayCompletion = record.completionLogs[todayStr] || 0;

    let weeklyCount = 0;
    let weeklyCompletion = 0;
    last7Days.forEach((d) => {
      weeklyCount += record.usageLogs[d] || 0;
      weeklyCompletion += record.completionLogs[d] || 0;
    });

    let monthlyCount = 0;
    let monthlyCompletion = 0;
    last30Days.forEach((d) => {
      monthlyCount += record.usageLogs[d] || 0;
      monthlyCompletion += record.completionLogs[d] || 0;
    });

    const lifetimeCount = record.totalUsage || 0;
    const lifetime100Completion = record.totalCompletion || 0;

    // Calculate smart rate based on feature domain
    let completionRate = 0;

    if (feature.id === 'home' || feature.id === 'salah') {
      // Prayer domain: 5 prayers per day
      if (selectedPeriod === 'daily') {
        const target = 5;
        completionRate = isWomenExcuse ? 100 : Math.min(100, Math.round((todayCompletion / target) * 100));
      } else if (selectedPeriod === 'weekly') {
        const target = 35;
        completionRate = isWomenExcuse ? 100 : Math.min(100, Math.round((weeklyCompletion / target) * 100));
      } else {
        const target = 150;
        completionRate = isWomenExcuse ? 100 : Math.min(100, Math.round((monthlyCompletion / target) * 100));
      }
      // Give realistic fallback if logs exist
      if (completionRate === 0 && (weeklyCount > 0 || lifetimeCount > 0)) {
        completionRate = isWomenExcuse
          ? 100
          : Math.min(100, Math.round(((weeklyCompletion || 1) / Math.max(1, weeklyCount)) * 100));
      }
    } else if (feature.id === 'fasting') {
      // Voluntary Fasting domain: 2 days / week (Mon & Thu) or White Days
      const targetWeeklyFasts = 2;
      if (weeklyCompletion >= targetWeeklyFasts) {
        completionRate = 100;
      } else {
        completionRate = isWomenExcuse ? 100 : Math.min(100, Math.round((weeklyCompletion / targetWeeklyFasts) * 100));
      }
      if (completionRate === 0 && lifetime100Completion > 0) {
        completionRate = 50;
      }
    } else if (feature.id === 'adhkar' || feature.id === 'quran' || feature.id === 'khushu') {
      const activeCount =
        selectedPeriod === 'daily' ? todayCount : selectedPeriod === 'weekly' ? weeklyCount : monthlyCount;
      const activeComp =
        selectedPeriod === 'daily' ? todayCompletion : selectedPeriod === 'weekly' ? weeklyCompletion : monthlyCompletion;
      if (activeCount > 0) {
        completionRate = Math.min(100, Math.round((activeComp / activeCount) * 100));
        if (completionRate === 0 && activeComp > 0) completionRate = 100;
      } else if (lifetimeCount > 0) {
        completionRate = Math.min(100, Math.round((lifetime100Completion / lifetimeCount) * 100));
      }
      if (isWomenExcuse && feature.id === 'quran') {
        completionRate = Math.max(completionRate, 100);
      }
    } else {
      const activeCount =
        selectedPeriod === 'daily' ? todayCount : selectedPeriod === 'weekly' ? weeklyCount : monthlyCount;
      const activeComp =
        selectedPeriod === 'daily' ? todayCompletion : selectedPeriod === 'weekly' ? weeklyCompletion : monthlyCompletion;
      if (activeCount > 0) {
        completionRate = Math.min(100, Math.round((activeComp / activeCount) * 100));
      } else if (lifetimeCount > 0) {
        completionRate = Math.min(100, Math.round((lifetime100Completion / lifetimeCount) * 100));
      }
    }

    // Default rate bounds
    completionRate = Math.max(0, Math.min(100, completionRate));

    // Badge Tier
    const badgeTier = getBadgeTierForRate(completionRate, lifetime100Completion);

    // Smart CTA Label & Button
    const isCompleted100 = completionRate >= 100 || (selectedPeriod === 'daily' && todayCompletion > 0);
    const ctaLabel = isCompleted100 ? 'مُتقَن 100% 🌟' : todayCount > 0 ? 'مُتابع اليوم 👍' : 'غير مُستخدم اليوم';
    let buttonText = isCompleted100 ? 'مُكتمل بنجاح ✨' : 'انطلق الآن 🚀';
    const badgeStyle = isCompleted100
      ? 'bg-emerald-500 text-white font-black'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white font-black';

    if (feature.id === 'adhkar') {
      buttonText = isCompleted100 ? 'النتيجة: 100% 📿' : 'افتح الأذكار 📿';
    } else if (feature.id === 'quran') {
      buttonText = isCompleted100 ? 'النتيجة: 100% 📖' : 'اقرأ القرآن 📖';
    } else if (feature.id === 'salah' || feature.id === 'home') {
      buttonText = isCompleted100 ? 'النتيجة: 100% 🕌' : 'سجّل صلاتك 🕌';
    } else if (feature.id === 'khushu') {
      buttonText = isCompleted100 ? 'النتيجة: 100% 🌙' : 'احسب القيام 🌙';
    } else if (feature.id === 'fasting') {
      buttonText = isCompleted100 ? 'النتيجة: 100% 🌾' : 'سجل الصيام 🌾';
    }

    // Last used formatted text
    let lastUsedText = 'لم يُستخدم';
    if (record.lastUsedAt) {
      const d = new Date(record.lastUsedAt);
      const isToday = getTodayDateString(d) === todayStr;
      lastUsedText = isToday ? 'اليوم' : `${d.getDate()}/${d.getMonth() + 1}`;
    }

    return {
      feature,
      todayCount,
      todayCompletion,
      weeklyCount,
      weeklyCompletion,
      monthlyCount,
      monthlyCompletion,
      lifetimeCount,
      lifetime100Completion,
      completionRate,
      badgeTier,
      smartCTA: {
        label: ctaLabel,
        isCompleted100,
        buttonText,
        badgeStyle,
      },
      lastUsedText,
    };
  });
}

export interface PeriodSummaryItem {
  feature: FeatureDefinition;
  usageCount: number;
  completionCount: number;
  completionRate: number; // 0 to 100
  lastUsedText: string;
  masteryBadge: {
    label: string;
    color: string;
  };
}

// Get period aggregated summary (daily = today, weekly = last 7 days, monthly = last 30 days, all = all time)
export function getAnalyticsForPeriod(period: 'daily' | 'weekly' | 'monthly' | 'all'): PeriodSummaryItem[] {
  const data = loadAnalyticsData();
  let daysToAggregate = 1;
  if (period === 'weekly') daysToAggregate = 7;
  if (period === 'monthly') daysToAggregate = 30;

  const validDates = period === 'all' ? null : getDatesInRange(daysToAggregate);

  return FEATURES_LIST.map((feature) => {
    const record = data[feature.id] || {
      usageLogs: {},
      completionLogs: {},
      totalUsage: 0,
      totalCompletion: 0,
    };

    let usageCount = 0;
    let completionCount = 0;

    if (period === 'all') {
      usageCount = record.totalUsage || 0;
      completionCount = record.totalCompletion || 0;
    } else {
      validDates?.forEach((date) => {
        usageCount += record.usageLogs[date] || 0;
        completionCount += record.completionLogs[date] || 0;
      });
    }

    // Calculate completion rate percentage %
    let rate = 0;
    if (usageCount > 0) {
      rate = Math.min(100, Math.round((completionCount / usageCount) * 100));
    } else if (completionCount > 0) {
      rate = 100;
    }

    // Determine mastery level badge
    let masteryBadge = {
      label: 'لم يبدأ بعد',
      color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    };

    if (completionCount >= (period === 'daily' ? 1 : period === 'weekly' ? 5 : 20) || rate >= 80) {
      masteryBadge = {
        label: 'مُتقن 100% ⭐',
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
      };
    } else if (completionCount > 0 || rate >= 40) {
      masteryBadge = {
        label: 'مواظب جَيّد 👍',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
      };
    } else if (usageCount > 0) {
      masteryBadge = {
        label: 'تصفح فقط 🔍',
        color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
      };
    }

    // Last used formatted text
    let lastUsedText = 'لم يُستخدم';
    if (record.lastUsedAt) {
      const d = new Date(record.lastUsedAt);
      const isToday = getTodayDateString(d) === getTodayDateString();
      lastUsedText = isToday ? 'اليوم' : `${d.getDate()}/${d.getMonth() + 1}`;
    }

    return {
      feature,
      usageCount,
      completionCount,
      completionRate: rate,
      lastUsedText,
      masteryBadge,
    };
  });
}

export interface FeaturePraiseInfo {
  feature: FeatureDefinition;
  usageCount: number;
  completionCount: number;
  praiseTitle: string;
  praiseMessage: string;
  badgeLabel: string;
}

export interface FeatureNudgeInfo {
  feature: FeatureDefinition;
  nudgeTitle: string;
  nudgeMessage: string;
  buttonLabel: string;
  targetTab: string;
  badgeText: string;
  iconName: string;
}

// Generate praise for the most used feature in the chosen period
export function getTopFeaturePraise(
  period: 'daily' | 'weekly' | 'monthly' | 'all' = 'weekly'
): FeaturePraiseInfo | null {
  const summary = getAnalyticsForPeriod(period);
  // Filter out 'home' if possible to highlight specific spiritual features, unless only home was used
  const specificFeatures = summary.filter((s) => s.feature.id !== 'home');
  const sorted = (specificFeatures.length > 0 ? specificFeatures : summary).sort(
    (a, b) => b.usageCount + b.completionCount * 2 - (a.usageCount + a.completionCount * 2)
  );

  const top = sorted[0];
  if (!top || top.usageCount === 0) return null;

  let praiseTitle = 'ما شاء الله! أداء إيماني متميز 🌟';
  let praiseMessage = `تبارك الله! أنت مواظب جداً على ميزة (${top.feature.name}) حيث استخدمتها ${top.usageCount} مرة وأتممتها بنسبة 100% (${top.completionCount} مرة) هذا الأسبوع.`;
  let badgeLabel = 'الأكثر استمراراً ⭐';

  switch (top.feature.id) {
    case 'adhkar':
      praiseTitle = 'عاطر بذكر الله! 📿';
      praiseMessage = `ما شاء الله تبارك الله! المسبحة وحصن المسلم هي الأكثر صحبة لك بـ ${top.usageCount} استخداماً! (أَلا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ).`;
      badgeLabel = 'بطل الأذكار 📿';
      break;
    case 'quran':
      praiseTitle = 'صاحب القرآن الكريم 📖';
      praiseMessage = `هنيئاً لك! المصحف الشريف والورد اليومي هو الأكثر ملازمة لك بـ ${top.usageCount} جلسة قراءة! (خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ).`;
      badgeLabel = 'قارئ القرآن 📖';
      break;
    case 'salah':
      praiseTitle = 'قرة العين في الصلاة 🕌';
      praiseMessage = `بارك الله في حرصك! سجل الصلاة والسنن الرواتب يترأس جدولك الإيماني بـ ${top.completionCount} صلاة مكتملة 100%!`;
      badgeLabel = 'حافظ الصلاة 🕌';
      break;
    case 'khushu':
      praiseTitle = 'من أهل قيام الليل وساعة السحر 🌙';
      praiseMessage = `طوبى لك! قيام الليل والتهجد واستغفار الثلث الأخير هو طابعك المميز بـ ${top.usageCount} تسجيل قيام! (وَبِالأَسْحَارِ هُمْ يَسْتَغْفِرُونَ).`;
      badgeLabel = 'قائم الليل 🌙';
      break;
    case 'fasting':
      praiseTitle = 'من أهل باب الريان 🌾';
      praiseMessage = `ما شاء الله! صيام التطوع والأيام البيض يزين صحيفتك بـ ${top.completionCount} يوم صيام!`;
      badgeLabel = 'صائم التطوع 🌾';
      break;
    default:
      praiseTitle = `تميز رائع في (${top.feature.name}) ✨`;
      praiseMessage = `استمرارك على خدمة ${top.feature.name} بـ ${top.usageCount} مرة يعكس حرصك الإيماني العالي.`;
      break;
  }

  return {
    feature: top.feature,
    usageCount: top.usageCount,
    completionCount: top.completionCount,
    praiseTitle,
    praiseMessage,
    badgeLabel,
  };
}

// Helper to compute dynamic formatted duration code like "01d", "02w", "01m" from lastUsedAt timestamp
export function getTimeAgoCode(lastUsedAt?: string): { code: string; label: string } {
  if (!lastUsedAt) {
    return { code: '01w', label: 'أسبوع' };
  }
  const diffMs = Math.max(0, Date.now() - new Date(lastUsedAt).getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays <= 1) {
    return { code: '01d', label: 'يوم واحد' };
  } else if (diffDays < 7) {
    const formatted = String(diffDays).padStart(2, '0');
    return { code: `${formatted}d`, label: `${diffDays} أيام` };
  } else if (diffDays < 30) {
    const weeks = Math.max(1, Math.floor(diffDays / 7));
    const formatted = String(weeks).padStart(2, '0');
    return { code: `${formatted}w`, label: `${weeks} أسابيع` };
  } else {
    const months = Math.max(1, Math.floor(diffDays / 30));
    const formatted = String(months).padStart(2, '0');
    return { code: `${formatted}m`, label: `${months} أشهر` };
  }
}

// Generate dynamic tailored nudges for least used/neglected features with specific custom action buttons
export function getSmartFeatureNudges(
  period: 'daily' | 'weekly' | 'monthly' | 'all' = 'weekly'
): FeatureNudgeInfo[] {
  const summary = getAnalyticsForPeriod(period);
  const data = loadAnalyticsData();
  const topPraise = getTopFeaturePraise(period);

  const nudges: FeatureNudgeInfo[] = [];

  // Sort by usage count ascending to find neglected features
  const neglected = summary
    .filter((s) => s.feature.id !== 'home' && s.feature.id !== (topPraise?.feature.id || ''))
    .sort((a, b) => a.usageCount + a.completionCount * 2 - (b.usageCount + b.completionCount * 2));

  neglected.slice(0, 3).forEach((item) => {
    const feat = item.feature;
    const record = data[feat.id];
    const timeAgo = getTimeAgoCode(record?.lastUsedAt);

    let nudgeTitle = `تنشيط ميزة (${feat.name})`;
    let nudgeMessage = `لاحظنا أنك لم تستخدم ميزة (${feat.name}) منذ (${timeAgo.code}). إيه رأيك لو تجربها الآن وتستفيد من خدماتها الإيمانية؟`;
    let buttonLabel = `اضغط هنا لتجربة (${feat.name}) 🚀`;
    const badgeText = `غير مستخدمة منذ (${timeAgo.code})`;
    const iconName = feat.iconName;

    if (feat.id === 'quran') {
      nudgeTitle = 'الورد القرآني والتلاوة 📖';
      nudgeMessage = `لاحظنا أنك لم تسجل قراءة القرآن الكريم منذ (${timeAgo.code}). إيه رأيك تبدأ الآن في تسجيل صفحات القرآن التي قرأتها وتوثيق وردك اليومي؟`;
      buttonLabel = 'اضغط هنا لتسجيل صفحات القرآن التي قرأتها 📖';
    } else if (feat.id === 'adhkar') {
      nudgeTitle = 'حصن المسلم والمسبحة اللمسية 📿';
      nudgeMessage = `لاحظنا أنك لم تستخدم المسبحة والأذكار منذ (${timeAgo.code}). إيه رأيك تأخذ دقيقتين مع المسبحة اللمسية لختم ورد أذكار اليوم؟`;
      buttonLabel = 'اضغط هنا لفتح المسبحة وحصن الأذكار 📿';
    } else if (feat.id === 'khushu') {
      nudgeTitle = 'قيام الليل وحاسبة السحر 🌙';
      nudgeMessage = `لاحظنا أنك لم تسجل صلاة القيام أو حساب الثلث الأخير منذ (${timeAgo.code}). إيه رأيك تحسب ساعة السحر وتوثق صلاة الوتر والتهجد؟`;
      buttonLabel = 'اضغط هنا لحساب ثلث الليل وتوثيق القيام 🌙';
    } else if (feat.id === 'fasting') {
      nudgeTitle = 'صيام التطوع والأيام البيض 🌾';
      nudgeMessage = `لاحظنا أنك لم تتفقد تقويم الصيام والأيام البيض منذ (${timeAgo.code}). إيه رأيك تستعرض أيام الصيام المستحبة وتوثق صيامك؟`;
      buttonLabel = 'اضغط هنا لاستعراض تقويم الصيام والأيام البيض 🌾';
    } else if (feat.id === 'salah') {
      nudgeTitle = 'سجل السنن الرواتب والفوائت 🕌';
      nudgeMessage = `لاحظنا أنك لم تسجل السنن الرواتب والفوائت منذ (${timeAgo.code}). إيه رأيك تفتح سجل الصلاة لتوثيق الـ 12 ركعة سنة راتبة؟`;
      buttonLabel = 'اضغط هنا لفتح سجل السنن والفوائت 🕌';
    } else if (feat.id === 'widgets') {
      nudgeTitle = 'مصمم الودجت والخلفيات 📱';
      nudgeMessage = `لاحظنا أنك لم تعدل ودجت شاشة هاتفك أو تنزل خلفية جديدة منذ (${timeAgo.code}). إيه رأيك تصمم ودجت إسلامي أنيق للشاشة الآن؟`;
      buttonLabel = 'اضغط هنا لتصميم الودجت وتنزيل الخلفيات 🎨';
    } else if (feat.id === 'qibla') {
      nudgeTitle = 'بوصلة القبلة الفلكية 🧭';
      nudgeMessage = `لاحظنا أنك لم تفتح بوصلة القبلة منذ (${timeAgo.code}). إيه رأيك تختبر اتجاه القبلة في موقعك الحالي بدقة ثلاثية الأبعاد؟`;
      buttonLabel = 'اضغط هنا لتحديد اتجاه القبلة الفلكية 🧭';
    } else if (feat.id === 'alarms') {
      nudgeTitle = 'تنبيهات العبادات والمؤذنين 🔔';
      nudgeMessage = `لاحظنا أنك لم تضبط أو تراجع تنبيهات العبادات والأذان منذ (${timeAgo.code}). إيه رأيك تخصص أصوات المؤذنين ومنبه صلاة الضحى؟`;
      buttonLabel = 'اضغط هنا لتخصيص منبهات الأذان والعبادات ⏰';
    } else if (feat.id === 'calendar') {
      nudgeTitle = 'التقويم الهجري والمناسبات 📅';
      nudgeMessage = `لاحظنا أنك لم تستعرض النتيجة الهجرية والمناسبات الإسلامية منذ (${timeAgo.code}). إيه رأيك تفقد الأيام الفاضلة للشهر الحالي؟`;
      buttonLabel = 'اضغط هنا لاستعراض التقويم الهجري والمناسبات 📅';
    } else if (feat.id === 'friday') {
      nudgeTitle = 'وضع الجمعة وسورة الكهف 💚';
      nudgeMessage = `لاحظنا أنك لم تفتح صفحة سنن يوم الجمعة وسورة الكهف منذ (${timeAgo.code}). إيه رأيك تقرأ سورة الكهف وتصلي على النبي ﷺ؟`;
      buttonLabel = 'اضغط هنا لفتح قراءة سورة الكهف وسنن الجمعة 📖';
    }

    nudges.push({
      feature: feat,
      nudgeTitle,
      nudgeMessage,
      buttonLabel,
      targetTab: feat.id,
      badgeText,
      iconName,
    });
  });

  return nudges;
}

// Generate smart spiritual recommendations based on usage patterns
export function getSpiritualRecommendations(): {
  title: string;
  text: string;
  actionTab: string;
  type: 'success' | 'warning' | 'tip';
}[] {
  const summary = getAnalyticsForPeriod('weekly');
  const tips: { title: string; text: string; actionTab: string; type: 'success' | 'warning' | 'tip' }[] = [];

  const adhkarItem = summary.find((s) => s.feature.id === 'adhkar');
  const salahItem = summary.find((s) => s.feature.id === 'salah');
  const quranItem = summary.find((s) => s.feature.id === 'quran');
  const khushuItem = summary.find((s) => s.feature.id === 'khushu');
  const fastingItem = summary.find((s) => s.feature.id === 'fasting');

  // Adhkar recommendation
  if (adhkarItem && adhkarItem.usageCount > 0 && adhkarItem.completionCount === 0) {
    tips.push({
      title: 'إتمام الأذكار بالكامل ✨',
      text: 'تتصفح الأذكار بانتظام، لكن لم تسجل إتمام الأذكار بنسبة 100%. جرب تفعيل المسبحة اللمسية لإنجاز الورد كاملاً.',
      actionTab: 'adhkar',
      type: 'warning',
    });
  } else if (adhkarItem && adhkarItem.completionCount >= 3) {
    tips.push({
      title: 'ما شاء الله! مداومة ممتازة على الأذكار 🌟',
      text: 'أتممت ورد الأذكار كاملاً أكثر من 3 مرات هذا الأسبوع! استمر على هذا الحصن المنيع.',
      actionTab: 'adhkar',
      type: 'success',
    });
  }

  // Salah recommendation
  if (salahItem && salahItem.completionRate < 50) {
    tips.push({
      title: 'السنن الرواتب والفرائض 🕌',
      text: 'حافظ على توثيق السنن الرواتب (12 ركعة) مع كل صلاة لتبني لك بيتاً في الجنة.',
      actionTab: 'salah',
      type: 'tip',
    });
  }

  // Qiyam recommendation
  if (!khushuItem || khushuItem.usageCount === 0) {
    tips.push({
      title: 'شرف المؤمن قيام الليل 🌙',
      text: 'لم تسجل تجربة حاسبة الثلث الأخير وقيام الليل هذا الأسبوع. جرب ركعتين في السحر.',
      actionTab: 'khushu',
      type: 'tip',
    });
  }

  // Quran recommendation
  if (quranItem && quranItem.completionCount === 0) {
    tips.push({
      title: 'الورد القرآني اليومي 📖',
      text: 'خصص 10 دقائق فقط يومياً لإتمام صفحتين من القرآن وتوثيق الختمة القرأنية.',
      actionTab: 'quran',
      type: 'tip',
    });
  }

  // Fasting recommendation
  if (fastingItem && fastingItem.usageCount === 0) {
    tips.push({
      title: 'صيام التطوع والأيام البيض 🌾',
      text: 'تفقد مواعيد الأيام البيض للشهر الحالي واستعد لصيام الإثنين والخميس.',
      actionTab: 'fasting',
      type: 'tip',
    });
  }

  return tips.slice(0, 3);
}
