/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DashboardSectionId =
  | 'heroCard'
  | 'progressCard'
  | 'quranSummary'
  | 'khushuSummary'
  | 'companionInsights'
  | 'sacredHours'
  | 'featureDiscovery'
  | 'pinnedFavorite';

export interface DashboardSectionConfig {
  id: DashboardSectionId;
  label: string;
  description: string;
  defaultEnabled: boolean;
  alwaysVisible?: boolean;
}

export const DASHBOARD_SECTION_REGISTRY: Record<DashboardSectionId, DashboardSectionConfig> = {
  heroCard: {
    id: 'heroCard',
    label: 'بطاقة الصلاة الرئيسية (Hero)',
    description: 'بطاقة الصلاة القادمة والعداد التنازلي التفاعلي',
    defaultEnabled: true,
    alwaysVisible: true
  },
  progressCard: {
    id: 'progressCard',
    label: 'شريط/دائرة التقدم الشامل',
    description: 'مؤشرات إنجاز الصلوات والأذكار والقرآن',
    defaultEnabled: true,
    alwaysVisible: true
  },
  quranSummary: {
    id: 'quranSummary',
    label: 'ملخص قراءة القرآن (شريط سريع)',
    description: 'ملخص من سطر واحد لصفحات الختمة المتبقية',
    defaultEnabled: true
  },
  khushuSummary: {
    id: 'khushuSummary',
    label: 'ملخص السنن والقيام (شريط سريع)',
    description: 'ملخص من سطر واحد لصلوات السنن والضحى والقيام',
    defaultEnabled: true
  },
  companionInsights: {
    id: 'companionInsights',
    label: 'بطاقة الرؤى والتحليلات الروحية',
    description: 'بطاقة قابلة للطي تحتوي على توجيهات تطبيق هِمَّتِي',
    defaultEnabled: true
  },
  sacredHours: {
    id: 'sacredHours',
    label: 'تنبيه الأوقات المباركة',
    description: 'يظهر فقط عند حلول وقت مبارك (كالضحى والثلث الأخير)',
    defaultEnabled: true
  },
  featureDiscovery: {
    id: 'featureDiscovery',
    label: 'دليل اكتشاف الميزات',
    description: 'بطاقة تعليمية للتعرف على مزايا التطبيق (اختياري)',
    defaultEnabled: false
  },
  pinnedFavorite: {
    id: 'pinnedFavorite',
    label: 'المفضلة المثبتة',
    description: 'ودجة مخصص للأدعية أو الأذكار المفضلة (اختياري)',
    defaultEnabled: false
  }
};

const STORAGE_KEY = 'salah_dashboard_sections_v1';

export function getDashboardSectionsConfig(): Record<DashboardSectionId, boolean> {
  if (typeof window === 'undefined') {
    return Object.fromEntries(
      Object.entries(DASHBOARD_SECTION_REGISTRY).map(([id, cfg]) => [id, cfg.defaultEnabled])
    ) as Record<DashboardSectionId, boolean>;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        heroCard: true,
        progressCard: true,
        quranSummary: parsed.quranSummary ?? DASHBOARD_SECTION_REGISTRY.quranSummary.defaultEnabled,
        khushuSummary: parsed.khushuSummary ?? DASHBOARD_SECTION_REGISTRY.khushuSummary.defaultEnabled,
        companionInsights: parsed.companionInsights ?? DASHBOARD_SECTION_REGISTRY.companionInsights.defaultEnabled,
        sacredHours: parsed.sacredHours ?? DASHBOARD_SECTION_REGISTRY.sacredHours.defaultEnabled,
        featureDiscovery: parsed.featureDiscovery ?? DASHBOARD_SECTION_REGISTRY.featureDiscovery.defaultEnabled,
        pinnedFavorite: parsed.pinnedFavorite ?? DASHBOARD_SECTION_REGISTRY.pinnedFavorite.defaultEnabled
      };
    }
  } catch (err) {
    console.error('Failed to parse dashboard section config:', err);
  }

  return Object.fromEntries(
    Object.entries(DASHBOARD_SECTION_REGISTRY).map(([id, cfg]) => [id, cfg.defaultEnabled])
  ) as Record<DashboardSectionId, boolean>;
}

import { safeSetJSON } from '../../utils/storage';

export function saveDashboardSectionsConfig(config: Record<DashboardSectionId, boolean>): void {
  safeSetJSON(STORAGE_KEY, config);
}
