/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function toArabicNumbers(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '';
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return num.toString().replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
}

export function getHijriDate(date: Date, offsetDays: number = 0): {
  day: number;
  month: number;
  year: number;
  monthName: string;
  fullString: string;
} {
  // Apply manual offset in days
  const workingDate = new Date(date.getTime());
  workingDate.setDate(workingDate.getDate() + offsetDays);

  const gYear = workingDate.getFullYear();
  const gMonth = workingDate.getMonth() + 1; // 1-indexed
  const gDay = workingDate.getDate();

  let y = gYear;
  let m = gMonth;
  if (m < 3) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = Math.floor(a / 4);
  let c = 2 - a + b;
  const e = Math.floor(365.25 * (y + 4716));
  const f = Math.floor(30.6001 * (m + 1));
  let jd = c + gDay + e + f - 1524.5;

  if (jd > 2299160) {
    const alpha = Math.floor((jd - 1867216.25) / 36524.25);
    c = 2 - alpha + Math.floor(alpha / 4);
    jd = c + gDay + e + f - 1524.5;
  }

  // Round JDN to nearest integer at noon
  const jdn = Math.floor(jd + 0.5);

  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const lRemainder = l - 10631 * n + 354;
  
  const j = (Math.floor((10985 - lRemainder) / 5316)) * (Math.floor((50 * lRemainder) / 17719)) + 
            (Math.floor(lRemainder / 5670)) * (Math.floor((43 * lRemainder) / 15238));
  
  const lAdjusted = lRemainder - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - 
                    (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
  
  const hMonth = Math.floor((24 * lAdjusted) / 709);
  const hDay = lAdjusted - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;

  const HIJRI_MONTHS = [
    "محرم", "صفر", "ربيع الأول", "ربيع الآخر",
    "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان",
    "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
  ];

  const monthName = HIJRI_MONTHS[hMonth - 1] || "محرم";
  const arabicDay = toArabicNumbers(hDay);
  const arabicYear = toArabicNumbers(hYear);

  return {
    day: hDay,
    month: hMonth,
    year: hYear,
    monthName,
    fullString: `${arabicDay} ${monthName} ${arabicYear} هـ`
  };
}

export function formatArabicDayCount(n: number): string {
  if (n === 1) return 'يوم واحد';
  if (n === 2) return 'يومين';
  if (n >= 3 && n <= 10) return `${toArabicNumbers(n)} أيام`;
  return `${toArabicNumbers(n)} يوماً`;
}

export function getArabicDayOfWeek(date: Date): string {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
}

export function getArabicMonthNameGregorian(date: Date): string {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[date.getMonth()];
}

export function formatGregorianFullDateArabic(date: Date): string {
  const dayName = getArabicDayOfWeek(date);
  const dayNum = toArabicNumbers(date.getDate());
  const monthName = getArabicMonthNameGregorian(date);
  const yearNum = toArabicNumbers(date.getFullYear());
  return `${dayName}، ${dayNum} ${monthName}`;
}
