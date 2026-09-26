/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { safeGetJSON, safeSetJSON } from '../../utils/storage';

export type DashboardSectionId =
  | 'heroCard'
  | 'progressCard'
  | 'quranSummary'
  | 'khushuSummary'
  | 'companionInsights'
  | 'sacredHours'
  | 'featureDiscovery'
  | 'pinnedFavorite'
  | 'dailyShortcuts'
  | 'smartStrip'
  | 'banners';

export interface DashboardSectionMeta {
  id: DashboardSectionId;
  label: string;
  description: string;
  defaultEnabled: boolean;
  alwaysVisible?: boolean;
}

export const DASHBOARD_SECTION_REGISTRY: Record<DashboardSectionId, DashboardSectionMeta> = {
  heroCard: {
    id: 'heroCard',
    label: 'بطاقة الصلاة الرئيسية ومواقيت اليوم',
    description: 'عرض الصلاة الحالية والقادمة والعد التنازلي مع الخلفية التفاعلية',
    defaultEnabled: true,
    alwaysVisible: true,
  },
  progressCard: {
    id: 'progressCard',
    label: 'مؤشر الإتقان الإيماني الموحد',
    description: 'متابعة إنجاز الصلوات الخمس والقرآن والأذكار والصيام اليومي والأسبوعي والشهري',
    defaultEnabled: true,
    alwaysVisible: true,
  },
  quranSummary: {
    id: 'quranSummary',
    label: 'شريط متابعة الختمة والورد القرآني',
    description: 'متابعة نسبة إنجاز الختمة الحالية ومحطات الحفظ اليومية',
    defaultEnabled: true,
  },
  khushuSummary: {
    id: 'khushuSummary',
    label: 'شريط نمط الخشوع وحماية الصلاة',
    description: 'إحصائيات تفعيل وضع الخشوع الصامت وإنجاز الخشوع في الصلوات',
    defaultEnabled: true,
  },
  companionInsights: {
    id: 'companionInsights',
    label: 'إضاءات ووصايا الرفيق الإيماني',
    description: 'خواطر وأحاديث وتوجيهات تناسب وقتك وحالتك الإيمانية',
    defaultEnabled: true,
  },
  sacredHours: {
    id: 'sacredHours',
    label: 'تنبيهات الساعات الفاضلة والمواسم',
    description: 'تنبيهات الثلث الأخير، ساعة الجمعة، والسنن الرواتب',
    defaultEnabled: true,
  },
  featureDiscovery: {
    id: 'featureDiscovery',
    label: 'بطاقة استكشاف الميزات والخدمات',
    description: 'اقتراحات ذكية لتجربة ميزات التطبيق المتقدمة',
    defaultEnabled: false,
  },
  pinnedFavorite: {
    id: 'pinnedFavorite',
    label: 'الودجت المصغر المثبت في الواجهة',
    description: 'عرض مصغر لشكل الودجت المفضل لديك مباشرة في الشاشة الرئيسية',
    defaultEnabled: false,
  },
  dailyShortcuts: {
    id: 'dailyShortcuts',
    label: 'إجراءات واختصارات اليوم السريعة',
    description: 'أزرار تسجيل قيام الليل والضحى وصيام اليوم بضغطة واحدة',
    defaultEnabled: true,
  },
  smartStrip: {
    id: 'smartStrip',
    label: 'شريط الإجراءات الذكي المدمج',
    description: 'شريط مختصر لحالة الخشوع والنسخ الاحتياطي والصلاة الفائتة',
    defaultEnabled: true,
  },
  banners: {
    id: 'banners',
    label: 'بانرات التنبيهات الإيمانية',
    description: 'تنبيهات المناسبات الإسلامية وتذكيرات الموقع والأذان',
    defaultEnabled: true,
  },
};

export const DEFAULT_DASHBOARD_SECTIONS: Record<DashboardSectionId, boolean> = {
  heroCard: true,
  progressCard: true,
  quranSummary: true,
  khushuSummary: true,
  companionInsights: true,
  sacredHours: true,
  featureDiscovery: false,
  pinnedFavorite: false,
  dailyShortcuts: true,
  smartStrip: true,
  banners: true,
};

const STORAGE_KEY = 'hemmaty_dashboard_sections_visibility';

export function getDashboardSectionsConfig(): Record<DashboardSectionId, boolean> {
  const stored = safeGetJSON<Partial<Record<DashboardSectionId, boolean>>>(STORAGE_KEY, {});
  return {
    ...DEFAULT_DASHBOARD_SECTIONS,
    ...stored,
  };
}

export function saveDashboardSectionsConfig(config: Record<DashboardSectionId, boolean>): void {
  safeSetJSON(STORAGE_KEY, config);
}
