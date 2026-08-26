export type ChangelogCategory = 'feature' | 'improvement' | 'fix';

export interface ChangelogItem {
  category: ChangelogCategory;
  text: string;
}

export interface ReleaseNote {
  version: string;
  buildNumber: number;
  date: string;
  title: string;
  isCurrent?: boolean;
  highlights: ChangelogItem[];
}

export const RELEASE_HISTORY: ReleaseNote[] = [
  {
    version: '1.0.5',
    buildNumber: 105,
    date: '26 أغسطس 2026',
    title: 'تحديث الثيمات الروحانية ونظام ما الجديد',
    isCurrent: true,
    highlights: [
      { category: 'feature', text: 'إطلاق ثيمات روحانية فائقة الجودة لبطاقات المعالم الشريفة (الكعبة المشرفة، المسجد النبوي، المسجد الأقصى، الكلاسيكي الفاخر، والذهبي الملكي)' },
      { category: 'feature', text: 'نظام إشعار تلقائي "ما الجديد" يظهر فوراً مع كل تحديث جديد للتطبيق' },
      { category: 'improvement', text: 'إصلاح اقتطاع العناوين وضبط خطوط الالتفاف للبطاقات الروحانية' },
      { category: 'improvement', text: 'نظام رجوع ذكي هرمي لزر أندرويد (إغلاق القوائم والنوافذ أولاً ثم التأكيد للخروج)' },
      { category: 'fix', text: 'تحسين استقرار الأداء والألوان في الوضعين الداكن والفاتح' }
    ]
  },
  {
    version: '1.0.4',
    buildNumber: 104,
    date: '20 أغسطس 2026',
    title: 'إصدار الاستقرار وتوافق RTL الكامل',
    highlights: [
      { category: 'improvement', text: 'ضبط ومحاذاة اتجاه النصوص اليمينية بالكامل في القائمة الجانبية والشاشات' },
      { category: 'feature', text: 'إعادة تصميم وتنسيق بطاقات جولة استكشاف المزايا بصرياً' },
      { category: 'feature', text: 'إضافة شارة رقم الإصدار وتفاصيل البناء في القائمة الجانبية' },
      { category: 'fix', text: 'دعم التحديث التلقائي وبناء الـ APK المتزامن مع GitHub Actions' }
    ]
  }
];

export const CURRENT_RELEASE = RELEASE_HISTORY[0];

const STORAGE_KEY = 'hemmaty_last_seen_version';

export function getUnreadVersionStatus(): { isNew: boolean; lastSeenVersion: string | null } {
  try {
    const lastSeen = localStorage.getItem(STORAGE_KEY);
    const isNew = lastSeen !== CURRENT_RELEASE.version;
    return { isNew, lastSeenVersion: lastSeen };
  } catch (e) {
    return { isNew: false, lastSeenVersion: null };
  }
}

export function markCurrentVersionAsSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, CURRENT_RELEASE.version);
  } catch (e) {
    console.error('Failed to save last seen version', e);
  }
}
