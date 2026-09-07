/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sliders,
  Moon,
  BookOpen,
  Sparkles,
  Compass,
  Calendar,
  Smartphone,
  Bell,
  MapPin,
} from 'lucide-react';

export interface FeatureItem {
  id: string;
  subTab?: string;
  category: 'salah' | 'quran' | 'fasting' | 'services';
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  gradient: string;
  bullets: string[];
}

export const ALL_FEATURES: FeatureItem[] = [
  {
    id: 'salah',
    category: 'salah',
    categoryLabel: 'الصلاة والأذان',
    title: 'سجل الصلاة والسنن الرواتب',
    subtitle: 'تتبع صلاة الجماعة، السنن القبلية والبعدية، وقضاء الفوائت',
    badge: 'سجل إيماني',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300',
    icon: Sliders,
    gradient: 'from-indigo-600 to-blue-600',
    bullets: ['تسجيل صلاة الجماعة والسنن', 'حاسبة أوتوماتيكية لقضاء الصلوات الفائتة'],
  },
  {
    id: 'khushu',
    category: 'fasting',
    categoryLabel: 'القيام والصيام',
    title: 'قيام الليل والثلث الأخير',
    subtitle: 'الحساب الفلكي الدقيق لساعات إجابة الدعاء بدقة ثانية',
    badge: 'دقة فلكية',
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300',
    icon: Moon,
    gradient: 'from-violet-600 to-purple-600',
    bullets: ['تحديد بداية ثلث الليل الأخير بدقة', 'عداد استغفار السحر وأدعية القيام'],
  },
  {
    id: 'quran',
    category: 'quran',
    categoryLabel: 'القرآن والأذكار',
    title: 'مساعد المصحف والختمات',
    subtitle: 'متابعة الورد القرآني، حفظ الصفحة، وسورة الكهف للجمعة',
    badge: 'تلاوة وختمات',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    icon: BookOpen,
    gradient: 'from-amber-600 to-yellow-600',
    bullets: ['تتبع أجزاء الختمة وتحديد الصفحة', 'تنبيه ورابط مباشر لسورة الكهف يوم الجمعة'],
  },
  {
    id: 'adhkar',
    category: 'quran',
    categoryLabel: 'القرآن والأذكار',
    title: 'حصن المسلم والمسبحة الذكية',
    subtitle: 'أذكار الصباح والمساء ومسبحة لمسية تفاعلية باهتزاز',
    badge: 'اهتزاز وتفاعل',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300',
    icon: Sparkles,
    gradient: 'from-teal-600 to-emerald-600',
    bullets: ['عداد تسبيح تفاعلي بالصوت واللمس', 'أذكار الصباح والمساء والنوم المؤكدة'],
  },
  {
    id: 'qibla',
    category: 'services',
    categoryLabel: 'الخدمات الذكية',
    title: 'اتجاه القبلة الفلكية 360°',
    subtitle: 'بوصلة حية ثلاثية الأبعاد تحدد الكعبة الشريفة بدون إنترنت',
    badge: 'بوصلة GPS',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    icon: Compass,
    gradient: 'from-emerald-600 to-teal-600',
    bullets: ['تحديد زاوية الكعبة بدقة 100%', 'تعمل بدون اتصال بالإنترنت بالسفر'],
  },
  {
    id: 'fasting',
    category: 'fasting',
    categoryLabel: 'القيام والصيام',
    title: 'تتبع الصيام والأيام البيض',
    subtitle: 'صيام الإثنين والخميس، الأيام البيض، وسجل القضاء',
    badge: 'تطوع ورمضان',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
    icon: Calendar,
    gradient: 'from-rose-600 to-pink-600',
    bullets: ['مواعيد الأيام البيض (13-14-15)', 'ساعات الصيام المتبقية حتى الإفطار'],
  },
  {
    id: 'widgets',
    category: 'services',
    categoryLabel: 'الخدمات الذكية',
    title: 'مصمم الودجت وخلفيات المساجد',
    subtitle: 'تصميم ودجت الشاشة للهاتف وتنزيل خلفيات مساجد الحرمين',
    badge: 'تخصيص الهاتف',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300',
    icon: Smartphone,
    gradient: 'from-cyan-600 to-blue-600',
    bullets: ['أشكال ودجت متنوعة للساعة والأذكار', 'خلفيات عالية الجودة للتنزيل'],
  },
  {
    id: 'alarms',
    category: 'services',
    categoryLabel: 'الخدمات الذكية',
    title: 'منبهات العبادات وأصوات المؤذنين',
    subtitle: 'اختيار صوت أذان الحرم المكي أو المدني والتنبيهات المخصصة',
    badge: 'أصوات الحرمين',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300',
    icon: Bell,
    gradient: 'from-orange-600 to-amber-600',
    bullets: ['تخصيص صوت أذان منفصل لكل صلاة', 'تنبيهات صلاة الضحى والورد اليومي'],
  },
  {
    id: 'calendar',
    category: 'services',
    categoryLabel: 'الخدمات الذكية',
    title: 'التقويم الهجري والمناسبات',
    subtitle: 'النتيجة الهجرية والميلادية والمناسبات الإسلامية القادمة',
    badge: 'التقويم الإسلامي',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    icon: Calendar,
    gradient: 'from-amber-600 to-yellow-600',
    bullets: ['النتيجة المزدوجة هجري وميلادي', 'ضبط وتعديل الرؤية الهجرية'],
  },
  {
    id: 'settings',
    subTab: 'location',
    category: 'services',
    categoryLabel: 'الضبط والتخصيص',
    title: 'تحديد الموقع بالـ GPS والمدن',
    subtitle: 'ضبط إحداثيات موقعك بدقة بالـ GPS واختيار المذهب الفلكي',
    badge: 'إعدادات الموقع',
    badgeColor: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    icon: MapPin,
    gradient: 'from-slate-700 to-slate-900',
    bullets: ['تحديث موقعك بالـ GPS بنقرة زر', 'جميع مدن ومحافظات العالم العربي'],
  },
];
