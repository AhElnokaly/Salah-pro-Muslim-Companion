/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Compass,
  Clock,
  BookOpen,
  Heart,
  Calendar,
  Volume2,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';

export interface TourStep {
  id: string;
  subTab?: string;
  title: string;
  category: string;
  badge: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  color: {
    bg: string;
    border: string;
    text: string;
    gradient: string;
  };
  highlights: string[];
  tips: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'salah',
    subTab: 'times',
    title: 'مواقيت الصلاة الدقيقة',
    category: 'الصلوات',
    badge: 'أساسي',
    subtitle: 'حسابات فلكية معتمدة ومطابقة للموقع الجغرافي',
    description: 'عرض مواقيت الصلوات الخمس والشروق بدقة عالية وفق الهيئات المعتمدة مع إمكانية تعديل الفروق يدوياً.',
    icon: Clock,
    color: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-500',
      gradient: 'from-emerald-600 to-teal-700',
    },
    highlights: [
      'تحديث تلقائي للمواقيت بدون إنترنت',
      'تحديد الصلاة القادمة والوقت المتبقي',
      'إشعار دائم حي في ستارة أندرويد',
    ],
    tips: 'يمكنك تعديل فروق التوقيت بالدقائق لكل صلاة من الإعدادات.',
  },
  {
    id: 'salah',
    subTab: 'qada',
    title: 'قضاء الفوائت والسنن',
    category: 'الصلوات',
    badge: 'مهم',
    subtitle: 'تسجيل النوافل وقضاء ما فات بسكينة',
    description: 'تتبع صلوات القضاء والسنن الرواتب مع عداد تنازلي وسجل تاريخي لمتابعة تقدمك الإيماني.',
    icon: Layers,
    color: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      text: 'text-indigo-500',
      gradient: 'from-indigo-600 to-purple-700',
    },
    highlights: [
      'تسجيل مرن للسنن الرواتب والنوافل',
      'إدارة ذكية لقضاء الصلوات الفائتة',
      'إحصائيات إنجاز متدرجة',
    ],
    tips: 'استخدم الزر العائم الذكي للتسجيل السريع بلمسة واحدة.',
  },
  {
    id: 'quran',
    title: 'متابع القرآن والختمات',
    category: 'القرآن الكريم',
    badge: 'إيماني',
    subtitle: 'أوراد يومية وختمات متكيفة مع الحفظ',
    description: 'محرك ذكي لحساب الأوراد اليومية ومتابعة الحفظ والمراجعة مع خريطة الأجزاء وتوليد بطاقات الآيات.',
    icon: BookOpen,
    color: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-500',
      gradient: 'from-amber-600 to-yellow-700',
    },
    highlights: [
      'حساب مرن للورد اليومي للختمة',
      'تتبع المراجعة المتباعدة للحفظ',
      'صانع بطاقات الآيات القرآنية للمشاركة',
    ],
    tips: 'يمكنك تعيين هدف سنوي للختمات ليحسب لك الورد اليومي تلقائياً.',
  },
  {
    id: 'adhkar',
    title: 'حصن المسلم والسبحة',
    category: 'الأذكار',
    badge: 'ذكر',
    subtitle: 'أذكار الصباح والمساء والسبحة الذكية',
    description: 'مكتبة شاملة للأذكار النبوية المقسمة والمفهرسة، مع سبحة إلكترونية ذات اهتزاز وتأثيرات صوتية.',
    icon: Heart,
    color: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-500',
      gradient: 'from-rose-600 to-pink-700',
    },
    highlights: [
      'أذكار الصباح والمساء ودبر الصلوات',
      'سبحة إلكترونية بألوان مخصصة',
      'محرك ذكي لاقتراح الذكر المناسب لوقتك',
    ],
    tips: 'انقر على السبحة في أي مكان للشاشات الكبيرة للتسبيح بسلاسة.',
  },
  {
    id: 'qibla',
    title: 'بوصلة القبلة التفاعلية',
    category: 'القبلة',
    badge: 'اتجاه',
    subtitle: 'توجيه حي نحو الكعبة المشرفة',
    description: 'بوصلة دقيقة بحسابات زوايا الانحراف مع إرشاد صوتي واهتزازي عند المحاذاة التامة مع الكعبة المشرفة.',
    icon: Compass,
    color: {
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/20',
      text: 'text-teal-500',
      gradient: 'from-teal-600 to-emerald-700',
    },
    highlights: [
      'معايرة سهلة لحساس البوصلة',
      'إرشاد صوتي لقراء الشاشة ومحاذاة بالاهتزاز',
      'مسافة وزاوية الكعبة المشرفة مباشرة',
    ],
    tips: 'حرك الهاتف على شكل رقم 8 لمعايرة البوصلة في حال وجود تشويش.',
  },
  {
    id: 'alarms',
    title: 'منبهات العبادات والأذان',
    category: 'التنبيهات',
    badge: 'تنبيه',
    subtitle: 'أصوات أذان نقية وتنبيهات مخصصة',
    description: 'تخصيص كامل لأصوات الأذان لأشهر المؤذنين مع منبهات قبل الصلاة وبعدها وتذكيرات قيام الليل والضحى.',
    icon: Volume2,
    color: {
      bg: 'bg-amber-600/10',
      border: 'border-amber-600/20',
      text: 'text-amber-600',
      gradient: 'from-amber-600 to-orange-700',
    },
    highlights: [
      'منبهات دقيقة عبر Android AlarmManager',
      'أصوات نقية محملة مسبقاً وتعمل بدون إنترنت',
      'تنبيهات مخصصة للسنن والمناسبات',
    ],
    tips: 'تأكد من استثناء التطبيق من قيود توفير الطاقة لضمان عمل الأذان في الوقت.',
  },
  {
    id: 'calendar',
    title: 'التقويم الهجري وأطوار القمر',
    category: 'التقويم',
    badge: 'فلك',
    subtitle: 'المناسبات الإسلامية وتتبع الصيام',
    description: 'تقويم هجري متوافق مع أم القرى مع إبراز الأيام البيض والإثنين والخميس والمناسبات الإسلامية المباركة.',
    icon: Calendar,
    color: {
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      text: 'text-sky-500',
      gradient: 'from-sky-600 to-blue-700',
    },
    highlights: [
      'عرض أطوار القمر بدقة فلكية',
      'تنبيهات صيام الأيام البيض والسنن',
      'إمكانية تصحيح التاريخ الهجري بسهولة',
    ],
    tips: 'انقر على التاريخ بالبطاقة الرئيسية لتعديل الهجري بنقرة واحدة.',
  },
  {
    id: 'khushu',
    title: 'وضع الخشوع في الصلاة',
    category: 'السكينة',
    badge: 'جديد',
    subtitle: 'إسكات الهاتف تلقائياً أثناء الصلاة',
    description: 'تفعيل وضع الصامت أو عدم الإزعاج تلقائياً مع وقت الإقامة، مع استعادة الوضع الطبيعي تلقائياً بعد انتهاء الصلاة.',
    icon: Shield,
    color: {
      bg: 'bg-emerald-600/10',
      border: 'border-emerald-600/20',
      text: 'text-emerald-600',
      gradient: 'from-emerald-700 to-teal-800',
    },
    highlights: [
      'تفعيل تلقائي مبرمج مع الإقامة',
      'شاشة السكون الإيماني المانعة للتشتت',
      'تجاوز ذكي للمكالمات الطارئة المتكررة',
    ],
    tips: 'يمكنك تفعيل الخشوع بنقرة واحدة من ويدجت الشاشة الرئيسية.',
  },
  {
    id: 'more',
    subTab: 'theme',
    title: 'التخصيص الفاخر والودجت',
    category: 'المظهر',
    badge: 'تخصيص',
    subtitle: 'سمات إسلامية وخلفيات مساجد عريقة',
    description: 'اختر من بين خلفيات المساجد المتغيرة مع وقت اليوم وتخصيص ويدجت الشاشة الزجاجي الفاخر بحرية تامة.',
    icon: Sparkles,
    color: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
      text: 'text-purple-500',
      gradient: 'from-purple-600 to-violet-700',
    },
    highlights: [
      'خلفيات ديناميكية (الفجر، النهار، الليل، الجمعة)',
      'ويدجت شاشة رئيسية مخصص بعدة أحجام',
      'نسخ احتياطي واستعادة شاملة للبيانات',
    ],
    tips: 'قم بحفظ نسخة احتياطية من إعداداتك بضغطة زر لمزامنتها بأي جهاز.',
  },
];

export default TOUR_STEPS;
