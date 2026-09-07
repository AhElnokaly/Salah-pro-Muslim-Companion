/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AlarmSoundType } from '../../types';

export const SOUND_OPTIONS: { type: AlarmSoundType; label: string; desc: string }[] = [
  { type: 'takbeer', label: '🔊 تكبيرات الحرمين', desc: 'تكبيرات العيد والحرم المكي' },
  { type: 'alsalatu_khayr', label: '🌅 الصلاة خير من النوم', desc: 'نداء الفجر الخاشع' },
  { type: 'hayya', label: '🕌 حي على الصلاة', desc: 'نداء الأذان المبارك' },
  { type: 'adhan', label: '📢 الأذان كاملاً', desc: 'أذان نقي كامل' },
  { type: 'salawat', label: '🌸 الصلاة على النبي ﷺ', desc: 'صلوات طيبة مباركة' },
  { type: 'istighfar', label: '📿 استغفار الأسحار', desc: 'أستغفر الله وأتوب إليه' },
  { type: 'duaa', label: '🤲 دعاء قرآني خاشع', desc: 'دعاء وتضرع مبارك' },
  { type: 'speech', label: '🎙️ نطق عنوان التنبيه', desc: 'نطق بصوت إيماني هادئ' },
  { type: 'beep', label: '🔔 رنين تنبيه لطيف', desc: 'نغمة هادئة وسريعة' },
  { type: 'silent', label: '🔕 إشعار مرئي فقط', desc: 'بدون صوت مسموع' },
];

export const PRESET_NAMES = [
  'تنبيه قبل الصلاة',
  'أذكار بعد الصلاة والسنن',
  'صلاة الضحى (صلاة الأوابين)',
  'قيام الليل والتهجد',
  'سورة الكهف يوم الجمعة',
  'الورد القرآني اليومي',
  'صيام الإثنين والخميس'
];

export const MINUTE_PRESETS = [5, 10, 15, 20, 30, 45, 60];
