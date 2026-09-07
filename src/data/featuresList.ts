/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FeatureDefinition {
  id: string;
  name: string;
  category: 'الصلاة' | 'القرآن والأذكار' | 'القيام والصيام' | 'الخدمات الذكية';
  description: string;
  completionCriteria: string;
  iconName: string;
  color: {
    bg: string;
    text: string;
    border: string;
    badge: string;
  };
}

export const FEATURES_LIST: FeatureDefinition[] = [
  {
    id: 'home',
    name: 'الرئيسية ومواقيت الصلاة',
    category: 'الصلاة',
    description: 'متابعة المواقيت والعد التنازلي الحاد والاستماع للأذان',
    completionCriteria: 'تسجيل الصلوات الـ 5 اليومية في وقتها 100%',
    iconName: 'Clock',
    color: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300',
    },
  },
  {
    id: 'salah',
    name: 'سجل الصلاة والسنن والفوائت',
    category: 'الصلاة',
    description: 'تتبع صلاة الجماعة، السنن الرواتب، وقضاء الفوائت',
    completionCriteria: 'تسجيل الـ 5 فرائض + 12 ركعة سنة راتبة يومياً',
    iconName: 'Sliders',
    color: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-600 dark:text-indigo-400',
      border: 'border-indigo-500/30',
      badge: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300',
    },
  },
  {
    id: 'quran',
    name: 'المصحف الشريف والختمات',
    category: 'القرآن والأذكار',
    description: 'متابعة أجزاء القرآن، قراءة الورد اليومي، وسورة الكهف',
    completionCriteria: 'إتمام الورد القرآني اليومي المخصص بالكامل',
    iconName: 'BookOpen',
    color: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300',
    },
  },
  {
    id: 'adhkar',
    name: 'حصن المسلم والمسبحة',
    category: 'القرآن والأذكار',
    description: 'أذكار الصباح والمساء، أذكار النوم، والمسبحة اللمسية',
    completionCriteria: 'إتمام أذكار الصباح أو المساء بجميع تكراراتها 100%',
    iconName: 'Sparkles',
    color: {
      bg: 'bg-teal-500/10',
      text: 'text-teal-600 dark:text-teal-400',
      border: 'border-teal-500/30',
      badge: 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300',
    },
  },
  {
    id: 'khushu',
    name: 'قيام الليل والثلث الأخير',
    category: 'القيام والصيام',
    description: 'الحساب الفلكي لساعة السحر وتتبع صلاة القيام والوتر',
    completionCriteria: 'تسجيل أداء صلاة القيام والوتر واستغفار السحر',
    iconName: 'Moon',
    color: {
      bg: 'bg-violet-500/10',
      text: 'text-violet-600 dark:text-violet-400',
      border: 'border-violet-500/30',
      badge: 'bg-violet-100 dark:bg-violet-950/80 text-violet-800 dark:text-violet-300',
    },
  },
  {
    id: 'fasting',
    name: 'تتبع الصيام والأيام البيض',
    category: 'القيام والصيام',
    description: 'صيام الإثنين والخميس، الأيام البيض، وسجل القضاء',
    completionCriteria: 'إتمام صيام يوم كامل (تطوع أو فرض/قضاء)',
    iconName: 'Calendar',
    color: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-500/30',
      badge: 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300',
    },
  },
  {
    id: 'qibla',
    name: 'بوصلة القبلة الفلكية 360°',
    category: 'الخدمات الذكية',
    description: 'تحديد اتجاه الكعبة المشرفة بدقة ثلاثية الأبعاد',
    completionCriteria: 'التحقق والمحاذاة المباشرة مع اتجاه الكعبة المشرفة',
    iconName: 'Compass',
    color: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300',
    },
  },
  {
    id: 'calendar',
    name: 'التقويم الهجري والمناسبات',
    category: 'الخدمات الذكية',
    description: 'عرض النتيجة الهجرية والميلادية والمناسبات القادمة',
    completionCriteria: 'استعراض مناسبات الشهر الهجري ومتابعة الأحداث',
    iconName: 'CalendarDays',
    color: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-500/30',
      badge: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300',
    },
  },
  {
    id: 'widgets',
    name: 'مصمم الودجت والخلفيات',
    category: 'الخدمات الذكية',
    description: 'تخصيص ودجت الشاشة الرئيسية وتنزيل خلفيات المساجد',
    completionCriteria: 'حفظ وتصدير تصميم ودجت للهاتف أو تنزيل خلفية',
    iconName: 'Smartphone',
    color: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-600 dark:text-cyan-400',
      border: 'border-cyan-500/30',
      badge: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300',
    },
  },
  {
    id: 'alarms',
    name: 'منبهات العبادات والمؤذنين',
    category: 'الخدمات الذكية',
    description: 'تنبيهات الأذان، أذكار الصباح والمساء، وصلاة الضحى',
    completionCriteria: 'تفعيل وتخصيص كافة تنبيهات العبادات اليومية',
    iconName: 'Bell',
    color: {
      bg: 'bg-orange-500/10',
      text: 'text-orange-600 dark:text-orange-400',
      border: 'border-orange-500/30',
      badge: 'bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300',
    },
  },
  {
    id: 'friday',
    name: 'وضع الجمعة وسورة الكهف',
    category: 'القرآن والأذكار',
    description: 'قراءة سورة الكهف والصلاة على النبي ﷺ يوم الجمعة',
    completionCriteria: 'إتمام قراءة سورة الكهف + 100 صلاة على النبي ﷺ',
    iconName: 'Heart',
    color: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300',
    },
  },
];
