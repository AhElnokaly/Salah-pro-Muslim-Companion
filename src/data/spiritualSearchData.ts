/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TabId } from '../types';

export type SearchCategory = 'all' | 'quran' | 'adhkar' | 'prayers' | 'events';

export interface SearchResultItem {
  id: string;
  type: SearchCategory;
  typeLabel: string;
  title: string;
  subtitle?: string;
  content?: string;
  reward?: string;
  targetTab: TabId;
  metadata?: string;
  highlightText?: string;
}

// Helper to normalize Arabic text for search (remove diacritics & normalize alef/ta)
export const normalizeArabic = (text: string): string => {
  return text
    .replace(/[\u064B-\u0652]/g, '') // remove tashkeel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase();
};

// Popular quick search suggestions
export const QUICK_SUGGESTIONS: string[] = [
  'آية الكرسي',
  'سورة الكهف',
  'أذكار المساء',
  'دعاء القنوت',
  'صلاة الضحى',
  'قيام الليل',
  'الأيام البيض'
];

// Pre-built index of static worship items & prayer actions
export const PRAYERS_AND_EVENTS_INDEX: SearchResultItem[] = [
  {
    id: 'p_fajr',
    type: 'prayers',
    typeLabel: 'فريضة',
    title: 'صلاة الفجر والصبح',
    subtitle: 'فريضة • ركعتان جهرية',
    content: 'يبدأ وقتها من الفجر الصادق إلى طلوع الشمس. ركعتا الفجر خير من الدنيا وما فيها.',
    targetTab: 'salah',
    metadata: 'ركعتان'
  },
  {
    id: 'p_dhuhr',
    type: 'prayers',
    typeLabel: 'فريضة',
    title: 'صلاة الظهر',
    subtitle: 'فريضة • ٤ ركعات سرية',
    content: 'يبدأ وقتها عند زوال الشمس وتعامدها حتى يصير ظل كل شيء مثله.',
    targetTab: 'salah',
    metadata: '٤ ركعات'
  },
  {
    id: 'p_asr',
    type: 'prayers',
    typeLabel: 'فريضة',
    title: 'صلاة العصر (الصلاة الوسطى)',
    subtitle: 'فريضة • ٤ ركعات سرية',
    content: 'حافظوا على الصلوات والصلاة الوسطى. من ترك صلاة العصر فقد حبط عمله.',
    targetTab: 'salah',
    metadata: '٤ ركعات'
  },
  {
    id: 'p_maghrib',
    type: 'prayers',
    typeLabel: 'فريضة',
    title: 'صلاة المغرب',
    subtitle: 'فريضة • ٣ ركعات (٢ جهرية + ١ سرية)',
    content: 'يبدأ وقتها بتمكّن غروب الشمس إلى غياب الشفق الأحمر.',
    targetTab: 'salah',
    metadata: '٣ ركعات'
  },
  {
    id: 'p_isha',
    type: 'prayers',
    typeLabel: 'فريضة',
    title: 'صلاة العشاء',
    subtitle: 'فريضة • ٤ ركعات (٢ جهرية + ٢ سرية)',
    content: 'يبدأ وقتها بغياب الشفق الأحمر ويمتد إلى منتصف الليل الشرقي.',
    targetTab: 'salah',
    metadata: '٤ ركعات'
  },
  {
    id: 'p_duha',
    type: 'prayers',
    typeLabel: 'سنة مؤكدة',
    title: 'صلاة الضحى (صلاة الأوابين)',
    subtitle: 'نافلة • ركعتان إلى ٨ ركعات',
    content: 'تُجزئ عن ٣٦٠ صدقة عن كل مفصل في جسم الإنسان. وقتها من بعد الشروق بـ ١٥ دقيقة إلى قبل الظهر بـ ١٠ دقائق.',
    targetTab: 'khushu',
    metadata: 'صدقة المفاصل'
  },
  {
    id: 'p_qiyam',
    type: 'prayers',
    typeLabel: 'سنة مؤكدة',
    title: 'قيام الليل والتهجد',
    subtitle: 'نافلة • أفضل الصلاة بعد الفريضة',
    content: 'ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر فيقول: من يدعوني فأستجيب له؟',
    targetTab: 'khushu',
    metadata: 'الثلث الأخير'
  },
  {
    id: 'p_witr',
    type: 'prayers',
    typeLabel: 'سنة مؤكدة',
    title: 'صلاة الوتر ودعاء القنوت',
    subtitle: 'نافلة • ركعة أو ٣ ركعات فردية',
    content: 'إن الله وتر يحب الوتر، فأوتروا يا أهل القرآن. ختام صلاة الليل.',
    targetTab: 'khushu',
    metadata: 'ختام الليل'
  },
  {
    id: 'e_ramadan',
    type: 'events',
    typeLabel: 'مناسبة مباركة',
    title: 'شهر رمضان المبارك',
    subtitle: 'شهر القرآن والصيام',
    content: 'شهر رمضان الذي أنزل فيه القرآن هدى للناس وبينات من الهدى والفرقان.',
    targetTab: 'fasting',
    metadata: 'ركن الإسلام'
  },
  {
    id: 'e_white_days',
    type: 'events',
    typeLabel: 'صيام نافلة',
    title: 'صيام الأيام البيض (١٣، ١٤، ١٥ من كل شهر هجري)',
    subtitle: 'تعدل صيام الدهر كله',
    content: 'صيام ثلاثة أيام من كل شهر صيام الدهر كله، وهي الأيام المباركة التي يكتمل فيها القمر.',
    targetTab: 'fasting',
    metadata: '١٣ و١٤ و١٥ هـ'
  },
  {
    id: 'e_mon_thu',
    type: 'events',
    typeLabel: 'صيام نافلة',
    title: 'صيام الإثنين والخميس',
    subtitle: 'تُعرض فيهما الأعمال على الله',
    content: 'تعرض الأعمال يوم الإثنين والخميس وأحب أن يُعرض عملي وأنا صائم.',
    targetTab: 'fasting',
    metadata: 'أسبوعي'
  },
  {
    id: 'e_ashura',
    type: 'events',
    typeLabel: 'صيام نافلة',
    title: 'صوم يوم عاشوراء (١٠ محرم)',
    subtitle: 'يكفّر السنة الماضية',
    content: 'صيام يوم عاشوراء أحتسب على الله أن يكفر السنة التي قبله.',
    targetTab: 'calendar',
    metadata: '١٠ محرم'
  },
  {
    id: 'e_arafah',
    type: 'events',
    typeLabel: 'صيام نافلة',
    title: 'صوم يوم عرفة (٩ ذو الحجة)',
    subtitle: 'يكفّر سنتين: الماضية والباقية',
    content: 'أفضل الأيام عند الله، وصيامه يكفّر السنة الماضية والسنة الباقية لغير الحاج.',
    targetTab: 'calendar',
    metadata: '٩ ذو الحجة'
  }
];
