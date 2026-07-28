/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MoonPhaseInfo {
  name: string;
  enName: string;
  illumination: number;
  age: number; // 1 to 30
  icon: string; // Emoji
  desc: string;
  fastingNote: string;
  isWhiteDay?: boolean;
}

export function getMoonPhaseInfo(hijriDay: number): MoonPhaseInfo {
  const day = Math.max(1, Math.min(30, Math.round(hijriDay)));

  if (day === 1 || day === 30) {
    return {
      name: 'المحاق',
      enName: 'New Moon',
      illumination: 2,
      age: day,
      icon: '🌑',
      desc: 'بداية الشهر الهجري وولادة الهلال الجديد. يقع القمر بين الأرض والشمس.',
      fastingNote: 'تحري الهلال ودعاء رؤية الهلال.'
    };
  } else if (day >= 2 && day <= 6) {
    return {
      name: 'الهلال المتزايد',
      enName: 'Waxing Crescent',
      illumination: Math.round((day / 15) * 50),
      age: day,
      icon: '🌒',
      desc: 'قوس نحيل فضي في الغرب بعد غروب الشمس.',
      fastingNote: 'بداية أيام الخير والدعاء والابتهال.'
    };
  } else if (day >= 7 && day <= 9) {
    return {
      name: 'التربيع الأول',
      enName: 'First Quarter',
      illumination: 50,
      age: day,
      icon: '🌓',
      desc: 'نصف القمر مضيء بحجم دقيق يمتد في سماء المساء.',
      fastingNote: 'اقتراب منتصف الشهر الهجري.'
    };
  } else if (day >= 10 && day <= 12) {
    return {
      name: 'الأحدب المتزايد',
      enName: 'Waxing Gibbous',
      illumination: Math.round(50 + ((day - 7) / 7) * 45),
      age: day,
      icon: '🌔',
      desc: 'اكتمل معظم وجه القمر بالضوء الباهر مع اقتراب ليلة البدر.',
      fastingNote: 'تأهب لصيام الأيام البيض (١٣، ١٤، ١٥).'
    };
  } else if (day >= 13 && day <= 15) {
    return {
      name: 'البدر المكتمل',
      enName: 'Full Moon',
      illumination: 100,
      age: day,
      icon: '🌕',
      desc: 'يكتمل نور القمر تماماً في كبد السماء ليلتي ١٤ و١٥.',
      fastingNote: '✨ صيام الأيام البيض (١٣ - ١٤ - ١٥ من الشهر الهجري).',
      isWhiteDay: true
    };
  } else if (day >= 16 && day <= 19) {
    return {
      name: 'الأحدب المتناقص',
      enName: 'Waning Gibbous',
      illumination: Math.round(95 - ((day - 15) / 7) * 45),
      age: day,
      icon: '🌖',
      desc: 'يبدأ جانب من الضوء ينحسر تدريجياً بعد ليلة البدر.',
      fastingNote: 'استمرار الاستفادة من بركة الشهر.'
    };
  } else if (day >= 20 && day <= 23) {
    return {
      name: 'التربيع الأخير',
      enName: 'Third Quarter',
      illumination: 50,
      age: day,
      icon: '🌗',
      desc: 'يضيء النصف الآخر من القمر ويشرق في وقت متأخر من الليل.',
      fastingNote: 'أوقات قيام الليل ومناجاة السحر تحت الضياء.'
    };
  } else {
    return {
      name: 'العرجون القديم',
      enName: 'Waning Crescent',
      illumination: Math.max(3, Math.round(50 - ((day - 22) / 7) * 45)),
      age: day,
      icon: '🌘',
      desc: 'هلال نحيل يشرق قُبيل الفجر كالعرجون القديم كما ورد في القرآن.',
      fastingNote: 'أواخر الشهر الهجري وترقب المهل الجديد.'
    };
  }
}
