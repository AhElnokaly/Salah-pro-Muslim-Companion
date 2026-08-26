/**
 * Config-Driven Dashboard Block Registry Architecture
 */

export interface DashboardBlockConfig {
  id: string;
  title: string;
  priority: number;
  visible: boolean;
  presetLevel: 'minimal' | 'balanced' | 'detailed';
}

export const DEFAULT_DASHBOARD_BLOCKS: DashboardBlockConfig[] = [
  { id: 'prayer_hero', title: 'الصلاة الحالية والعد التنازلي', priority: 1, visible: true, presetLevel: 'minimal' },
  { id: 'daily_progress', title: 'سجل صلوات اليوم', priority: 2, visible: true, presetLevel: 'minimal' },
  { id: 'gentle_nudge', title: 'التوجيه الإيماني الذكي', priority: 3, visible: true, presetLevel: 'minimal' },
  { id: 'quick_actions', title: 'الإنجاز السريع', priority: 4, visible: true, presetLevel: 'minimal' },
  { id: 'spiritual_pulse', title: 'مؤشر النبض الإيماني', priority: 5, visible: true, presetLevel: 'balanced' },
  { id: 'adhkar_card', title: 'أذكار اليوم والساعة', priority: 6, visible: true, presetLevel: 'balanced' },
  { id: 'quran_widget', title: 'متابعة الورد القرآني', priority: 7, visible: true, presetLevel: 'detailed' },
  { id: 'weekly_heatmap', title: 'خريطة التراكم الأسبوعية', priority: 8, visible: true, presetLevel: 'detailed' },
];

export class BlockRegistryManager {
  static getBlocksForPreset(preset: 'minimal' | 'balanced' | 'detailed'): DashboardBlockConfig[] {
    if (preset === 'minimal') {
      return DEFAULT_DASHBOARD_BLOCKS.filter((b) => b.presetLevel === 'minimal');
    }
    if (preset === 'balanced') {
      return DEFAULT_DASHBOARD_BLOCKS.filter((b) => b.presetLevel === 'minimal' || b.presetLevel === 'balanced');
    }
    return DEFAULT_DASHBOARD_BLOCKS;
  }
}
