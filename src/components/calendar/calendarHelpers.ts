/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CalendarGridCell {
  dayNum: number;
  date: Date;
  isCurrentMonth: boolean;
}

export const getIslamicOccasion = (hDay: number, hMonth: number): string | null => {
  if (hMonth === 1 && hDay === 1) return 'بداية السنة الهجرية الجديدة 🎉';
  if (hMonth === 1 && hDay === 9) return 'يوم تاسوعاء 🌟';
  if (hMonth === 1 && hDay === 10) return 'يوم عاشوراء (كفارة سنة ماضية) ✨';
  if (hMonth === 3 && hDay === 12) return 'المولد النبوي الشريف 🌸';
  if (hMonth === 7 && hDay === 27) return 'ذكرى الإسراء والمعراج 🕋';
  if (hMonth === 8 && hDay === 15) return 'ليلة النصف من شعبان 🌙';
  if (hMonth === 9 && hDay === 1) return 'أول أيام شهر رمضان المبارك 🌙';
  if (hMonth === 9 && hDay >= 21 && hDay % 2 !== 0) return 'ليالي العشر الأواخر (تحرّوا ليلة القدر) ✨';
  if (hMonth === 10 && hDay === 1) return 'أول أيام عيد الفطر المبارك 🎈';
  if (hMonth === 12 && hDay === 9) return 'يوم عرفة (يكفر سنتين) 🙌';
  if (hMonth === 12 && hDay === 10) return 'أول أيام عيد الأضحى المبارك 🐑';
  if (hMonth === 12 && (hDay === 11 || hDay === 12 || hDay === 13)) return 'أيام التشريق المباركة ✨';
  return null;
};

export const isForbiddenFastDay = (hDay: number, hMonth: number): boolean => {
  // Eid al-Fitr (1 Shawwal)
  if (hMonth === 10 && hDay === 1) return true;
  // Eid al-Adha (10 Dhu al-Hijjah) & Tashreeq days (11, 12, 13 Dhu al-Hijjah)
  if (hMonth === 12 && (hDay === 10 || hDay === 11 || hDay === 12 || hDay === 13)) return true;
  return false;
};

export const getFastingRecommendation = (
  selectedDate: Date,
  hDay: number,
  hMonth: number,
  hMonthName: string
): string => {
  const isForbidden = isForbiddenFastDay(hDay, hMonth);
  if (isForbidden) {
    return 'يحرم الصيام في هذا اليوم المبارك (أيام العيد والتشريق)';
  }

  const isWhiteDay = hDay === 13 || hDay === 14 || hDay === 15;
  const isMonOrThu = selectedDate.getDay() === 1 || selectedDate.getDay() === 4;

  if (hMonth === 9) {
    return 'فرض عين (صيام شهر رمضان المبارك)';
  } else if (hMonth === 12 && hDay === 9) {
    return 'صيام يوم عرفة (سنة مؤكدة تكفّر سنة ماضية وقادمة)';
  } else if (hMonth === 1 && hDay === 10) {
    return 'صيام يوم عاشوراء (سنة مؤكدة تكفّر سنة ماضية)';
  } else if (hMonth === 1 && hDay === 9) {
    return 'صيام يوم تاسوعاء (مخالفة لليهود مع صيام عاشوراء)';
  } else if (isWhiteDay) {
    return `صيام الأيام البيض لشهر ${hMonthName} (سنة مؤكدة)`;
  } else if (isMonOrThu) {
    const dayName = selectedDate.getDay() === 1 ? 'الإثنين' : 'الخميس';
    return `صيام يوم ${dayName} (سنة نبوية، تُرفع فيه الأعمال)`;
  }

  return '';
};
