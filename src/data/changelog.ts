import { safeGetItem, safeSetItem } from '../utils/storage';

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
    version: '1.0.9',
    buildNumber: 109,
    date: '20 سبتمبر 2026',
    title: 'تحديث الخشوع التلقائي مع الإقامة وتخصيص الويدجت الشامل',
    isCurrent: true,
    highlights: [
      { category: 'feature', text: 'تفعيل وضع الخشوع التلقائي مع موعد الإقامة لإسكات الهاتف أثناء الصلاة واستعادة وضع الرنين تلقائياً عبر المنبه الدقيق' },
      { category: 'feature', text: 'تخصيص كامل لويدجت الشاشة الرئيسية (6 سمات لونية فاخرة، التحكم في ظهور العناصر، ومزامنة فورية بنقرة واحدة)' },
      { category: 'improvement', text: 'تطوير دقة فحص التحديثات ومنع التنبيهات المكررة مع دعم التثبيت المباشر للـ APK' }
    ]
  },
  {
    version: '1.0.8',
    buildNumber: 108,
    date: '18 سبتمبر 2026',
    title: 'تحديث التثبيت التلقائي المباشر من داخل التطبيق',
    highlights: [
      { category: 'feature', text: 'تحديث وتثبيت الإصدارات الجديدة بضغطة زر مباشرة من داخل التطبيق دون فتح المتصفح مع مؤشر تقدم حقيقي' },
      { category: 'improvement', text: 'استدعاء مثبت الحزم الرسمي لأندرويد (Package Installer) تلقائياً فور اكتمال التنزيل' },
      { category: 'fix', text: 'إضافة الصلاحيات ومسارات التخزين المؤقتة المعتمدة للتثبيت السلس فوق الإصدار الحالي' }
    ]
  },
  {
    version: '1.0.7',
    buildNumber: 107,
    date: '18 سبتمبر 2026',
    title: 'تحديث توافق الويدجت وتزامن المظهر الزمني الذكي',
    highlights: [
      { category: 'feature', text: 'تحديث وتثبيت الإصدارات الجديدة مباشرة من داخل التطبيق دون فتح المتصفح أو الخروج للشاشات الخارجية' },
      { category: 'feature', text: 'خلفية ديناميكية ذكية للويدجت تتغير تلقائياً حسب وقت اليوم (سكينة الفجر، المسجد النهاري، الشفق المسائي، المسجد الليلي، والجمعة المباركة)' },
      { category: 'fix', text: 'إصلاح توافق الويدجت التام مع واجهات سامسونج One UI ومنع خطأ تعذر الإضافة' },
      { category: 'fix', text: 'تثبيت مفتاح التوقيع الرقمي الدائم (Keystore) لضمان التحديث التلقائي المستقبلي دون الحاجة لحذف التطبيق' },
      { category: 'improvement', text: 'تعزيز استقرار كروت الصلاة وتسجيل العبادات اليومية ودقة حساب المواعيد' }
    ]
  },
  {
    version: '1.0.6',
    buildNumber: 106,
    date: '18 سبتمبر 2026',
    title: 'تحديث الويدجت التفاعلي ونظام الإشعارات اللحظية',
    highlights: [
      { category: 'feature', text: 'إعادة تصميم الويدجت الخارجي (Widget) بالكامل ليطابق التصميم الفاخر داخل التطبيق مع أطوار القمر والساعة الرقمية' },
      { category: 'feature', text: 'شريط تفاعلي في الويدجت للسبحة الإلكترونية وتفعيل وضع الخشوع مباشرة من الشاشة الرئيسية دون فتح التطبيق' },
      { category: 'improvement', text: 'تحديث دقيق ولحظي لعداد الإشعار المستمر في شريط أندرويد ليعمل بتناغم وسلاسة' },
      { category: 'improvement', text: 'تحسينات في الأداء والتوافق مع أحدث إصدارات نظام أندرويد 14 و 15' }
    ]
  },
  {
    version: '1.0.5',
    buildNumber: 105,
    date: '26 أغسطس 2026',
    title: 'تحديث الثيمات الروحانية ونظام ما الجديد',
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
  const lastSeen = safeGetItem(STORAGE_KEY);
  const isNew = lastSeen !== CURRENT_RELEASE.version;
  return { isNew, lastSeenVersion: lastSeen };
}

export function markCurrentVersionAsSeen(): void {
  safeSetItem(STORAGE_KEY, CURRENT_RELEASE.version);
}
