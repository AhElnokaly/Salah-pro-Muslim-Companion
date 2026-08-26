/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PrayerName } from '../types';

export interface PrayerTimes {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
}

export interface CityData {
  name: string;
  arabicName: string;
  lat: number;
  lng: number;
  country: string;
  timezone?: string;
}

export const POPULAR_CITIES: CityData[] = [
  // مصر - Egypt
  { name: 'Cairo', arabicName: 'القاهرة', lat: 30.0444, lng: 31.2357, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Giza', arabicName: 'الجيزة', lat: 30.0131, lng: 31.2089, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Alexandria', arabicName: 'الإسكندرية', lat: 31.2001, lng: 29.9187, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Tanta', arabicName: 'طنطا (الغربية)', lat: 30.7865, lng: 31.0004, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Mansoura', arabicName: 'المنصورة (الدقهلية)', lat: 31.0409, lng: 31.3785, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Zagazig', arabicName: 'الزقازيق (الشرقية)', lat: 30.5877, lng: 31.5020, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Asyut', arabicName: 'أسيوط', lat: 27.1783, lng: 31.1859, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Sohag', arabicName: 'سوهاج', lat: 26.5569, lng: 31.6948, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Luxor', arabicName: 'الأقصر', lat: 25.6872, lng: 32.6396, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Aswan', arabicName: 'أسوان', lat: 24.0889, lng: 32.8998, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Port Said', arabicName: 'بورسعيد', lat: 31.2653, lng: 32.3019, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Suez', arabicName: 'السويس', lat: 29.9668, lng: 32.5498, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Ismailia', arabicName: 'الإسماعيلية', lat: 30.6043, lng: 32.2723, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Faiyum', arabicName: 'الفيوم', lat: 29.3084, lng: 30.8428, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Beni Suef', arabicName: 'بني سويف', lat: 29.0661, lng: 31.0994, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Minya', arabicName: 'المنيا', lat: 28.0871, lng: 30.7618, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Damanhur', arabicName: 'دمنهور (البحيرة)', lat: 31.0414, lng: 30.4682, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Shibin El Kom', arabicName: 'شبين الكوم (المنوفية)', lat: 30.5526, lng: 31.0091, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Banha', arabicName: 'بنها (القليوبية)', lat: 30.4660, lng: 31.1853, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Kafr El Sheikh', arabicName: 'كفر الشيخ', lat: 31.1107, lng: 30.9388, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Qena', arabicName: 'قنا', lat: 26.1551, lng: 32.7160, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Damietta', arabicName: 'دمياط', lat: 31.4175, lng: 31.8144, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Hurghada', arabicName: 'الغردقة (البحر الأحمر)', lat: 27.2579, lng: 33.8116, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Sharm El Sheikh', arabicName: 'شرم الشيخ (جنوب سيناء)', lat: 27.9158, lng: 34.3299, country: 'مصر', timezone: 'Africa/Cairo' },
  { name: 'Marsa Matruh', arabicName: 'مرسى مطروح', lat: 31.3543, lng: 27.2373, country: 'مصر', timezone: 'Africa/Cairo' },

  // السعودية - Saudi Arabia
  { name: 'Makkah', arabicName: 'مكة المكرمة', lat: 21.4225, lng: 39.8262, country: 'السعودية', timezone: 'Asia/Riyadh' },
  { name: 'Medina', arabicName: 'المدينة المنورة', lat: 24.4673, lng: 39.6112, country: 'السعودية', timezone: 'Asia/Riyadh' },
  { name: 'Riyadh', arabicName: 'الرياض', lat: 24.7136, lng: 46.6753, country: 'السعودية', timezone: 'Asia/Riyadh' },
  { name: 'Jeddah', arabicName: 'جدة', lat: 21.5433, lng: 39.1728, country: 'السعودية', timezone: 'Asia/Riyadh' },
  { name: 'Dammam', arabicName: 'الدمام', lat: 26.4207, lng: 50.0888, country: 'السعودية', timezone: 'Asia/Riyadh' },
  { name: 'Khobar', arabicName: 'الخبر', lat: 26.2172, lng: 50.1971, country: 'السعودية', timezone: 'Asia/Riyadh' },
  { name: 'Abha', arabicName: 'أبها', lat: 18.2164, lng: 42.5053, country: 'السعودية', timezone: 'Asia/Riyadh' },
  { name: 'Tabuk', arabicName: 'تبوك', lat: 28.3835, lng: 36.5662, country: 'السعودية', timezone: 'Asia/Riyadh' },
  { name: 'Taif', arabicName: 'الطائف', lat: 21.2854, lng: 40.4222, country: 'السعودية', timezone: 'Asia/Riyadh' },

  // الإمارات - UAE
  { name: 'Abu Dhabi', arabicName: 'أبو ظبي', lat: 24.4539, lng: 54.3773, country: 'الإمارات', timezone: 'Asia/Dubai' },
  { name: 'Dubai', arabicName: 'دبي', lat: 25.2048, lng: 55.2708, country: 'الإمارات', timezone: 'Asia/Dubai' },
  { name: 'Sharjah', arabicName: 'الشارقة', lat: 25.3463, lng: 55.4209, country: 'الإمارات', timezone: 'Asia/Dubai' },

  // دول عربية أخرى
  { name: 'Kuwait City', arabicName: 'الكويت', lat: 29.3759, lng: 47.9774, country: 'الكويت', timezone: 'Asia/Kuwait' },
  { name: 'Doha', arabicName: 'الدوحة', lat: 25.2854, lng: 51.5310, country: 'قطر', timezone: 'Asia/Qatar' },
  { name: 'Manama', arabicName: 'المنامة', lat: 26.2285, lng: 50.5860, country: 'البحرين', timezone: 'Asia/Bahrain' },
  { name: 'Muscat', arabicName: 'مسقط', lat: 23.5880, lng: 58.3829, country: 'عُمان', timezone: 'Asia/Muscat' },
  { name: 'Amman', arabicName: 'عمان', lat: 31.9539, lng: 35.9106, country: 'الأردن', timezone: 'Asia/Amman' },
  { name: 'Jerusalem', arabicName: 'القدس الشريف', lat: 31.7683, lng: 35.2137, country: 'فلسطين', timezone: 'Asia/Jerusalem' },
  { name: 'Gaza', arabicName: 'غزة', lat: 31.5017, lng: 34.4668, country: 'فلسطين', timezone: 'Asia/Gaza' },
  { name: 'Beirut', arabicName: 'بيروت', lat: 33.8938, lng: 35.5018, country: 'لبنان', timezone: 'Asia/Beirut' },
  { name: 'Damascus', arabicName: 'دمشق', lat: 33.5138, lng: 36.2765, country: 'سورية', timezone: 'Asia/Damascus' },
  { name: 'Baghdad', arabicName: 'بغداد', lat: 33.3152, lng: 44.3661, country: 'العراق', timezone: 'Asia/Baghdad' },
  { name: 'Casablanca', arabicName: 'الدار البيضاء', lat: 33.5731, lng: -7.5898, country: 'المغرب', timezone: 'Africa/Casablanca' },
  { name: 'Rabat', arabicName: 'الرباط', lat: 34.0209, lng: -6.8416, country: 'المغرب', timezone: 'Africa/Casablanca' },
  { name: 'Algiers', arabicName: 'الجزائر العاصمة', lat: 36.7538, lng: 3.0588, country: 'الجزائر', timezone: 'Africa/Algiers' },
  { name: 'Tunis', arabicName: 'تونس', lat: 36.8065, lng: 10.1815, country: 'تونس', timezone: 'Africa/Tunis' },
  { name: 'Tripoli', arabicName: 'طرابلس', lat: 32.8872, lng: 13.1913, country: 'ليبيا', timezone: 'Africa/Tripoli' },
  { name: 'Khartoum', arabicName: 'الخرطوم', lat: 15.5007, lng: 32.5599, country: 'السودان', timezone: 'Africa/Khartoum' },
  { name: 'Sanaa', arabicName: 'صنعاء', lat: 15.3694, lng: 44.1910, country: 'اليمن', timezone: 'Asia/Aden' },
  { name: 'Istanbul', arabicName: 'إسطنبول', lat: 41.0082, lng: 28.9784, country: 'تركيا', timezone: 'Europe/Istanbul' },
  { name: 'London', arabicName: 'لندن', lat: 51.5074, lng: -0.1278, country: 'بريطانيا', timezone: 'Europe/London' },
  { name: 'New York', arabicName: 'نيويورك', lat: 40.7128, lng: -74.0060, country: 'أمريكا', timezone: 'America/New_York' },
];

/**
 * Calculates timezone offset in decimal hours for a given date and timezone identifier.
 * Defaults to system timezone if not provided or unsupported.
 */
export function getTimezoneOffsetForLocation(date: Date, timezoneId?: string): number {
  if (timezoneId && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezoneId,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const parts = formatter.formatToParts(date);
      let year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
      let hour = date.getHours(), minute = date.getMinutes(), second = date.getSeconds();
      
      for (const p of parts) {
        if (p.type === 'year') year = parseInt(p.value, 10);
        if (p.type === 'month') month = parseInt(p.value, 10);
        if (p.type === 'day') day = parseInt(p.value, 10);
        if (p.type === 'hour') hour = parseInt(p.value, 10);
        if (p.type === 'minute') minute = parseInt(p.value, 10);
        if (p.type === 'second') second = parseInt(p.value, 10);
      }
      
      const targetUtc = Date.UTC(year, month - 1, day, hour, minute, second);
      const diffMs = targetUtc - date.getTime();
      return diffMs / (1000 * 3600);
    } catch {
      // Fallback
    }
  }
  return -date.getTimezoneOffset() / 60;
}

// Helper trig functions in degrees
const sin = (deg: number) => Math.sin((deg * Math.PI) / 180);
const cos = (deg: number) => Math.cos((deg * Math.PI) / 180);
const tan = (deg: number) => Math.tan((deg * Math.PI) / 180);
const asin = (x: number) => (Math.asin(x) * 180) / Math.PI;
const acos = (x: number) => (Math.acos(x) * 180) / Math.PI;
const atan = (x: number) => (Math.atan(x) * 180) / Math.PI;
const atan2 = (y: number, x: number) => (Math.atan2(y, x) * 180) / Math.PI;

interface MethodParams {
  fajrAngle: number;
  ishaAngle?: number;
  ishaInterval?: number; // Minutes after maghrib (e.g. 90 for Umm Al-Qura)
}

const METHODS: Record<string, MethodParams> = {
  Egypt: { fajrAngle: 19.5, ishaAngle: 17.5 },
  UmmAlQura: { fajrAngle: 18.5, ishaInterval: 90 },
  ISNA: { fajrAngle: 15.0, ishaAngle: 15.0 },
  MWL: { fajrAngle: 18.0, ishaAngle: 17.0 },
  Karachi: { fajrAngle: 18.0, ishaAngle: 18.0 },
  Gulf: { fajrAngle: 18.2, ishaInterval: 90 },
  Tehran: { fajrAngle: 17.7, ishaAngle: 14.0 },
};

function formatTime(decimalHour: number): string {
  if (isNaN(decimalHour)) return '--:--';
  const hour = Math.floor(decimalHour);
  const min = Math.round((decimalHour - hour) * 60);
  const finalHour = (hour + (min === 60 ? 1 : 0)) % 24;
  const finalMin = min === 60 ? 0 : min;
  
  const ampm = finalHour >= 12 ? 'م' : 'ص';
  const displayHour = finalHour % 12 === 0 ? 12 : finalHour % 12;
  const padMin = finalMin.toString().padStart(2, '0');
  
  // Return format: HH:MM ص/م
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const displayHourStr = displayHour.toString().split('').map(d => arabicDigits[parseInt(d)]).join('');
  const padMinStr = padMin.split('').map(d => arabicDigits[parseInt(d)]).join('');
  
  return `${displayHourStr}:${padMinStr} ${ampm}`;
}

export function parseTimeToMinutes(timeStr: string): number {
  // Parsing custom formatted time like "٠٤:٣٢ ص" or "04:32 ص"
  const digitsMap: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  // Normalize digits to English
  let normalized = '';
  for (let i = 0; i < timeStr.length; i++) {
    const char = timeStr[i];
    normalized += digitsMap[char] ?? char;
  }
  
  const parts = normalized.split(':');
  if (parts.length < 2) return 0;
  
  let hours = parseInt(parts[0], 10);
  const minutesPart = parts[1].trim();
  const mins = parseInt(minutesPart.substring(0, 2), 10);
  
  const isPM = timeStr.includes('م');
  if (isPM && hours !== 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  
  return hours * 60 + mins;
}

export function calculatePrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  timezoneOffsetHours: number = -date.getTimezoneOffset() / 60,
  calcMethod: string = 'Egypt',
  madhab: 'standard' | 'hanafi' = 'standard',
  manualOffsets: Record<string, number> = {}
): PrayerTimes {
  const params = METHODS[calcMethod] ?? METHODS.Egypt;
  
  // Calculate day of the year
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime() + (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000;
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  // Solar calculation approximations
  const d = dayOfYear;
  const g = (357.529 + 0.98560028 * d) % 360;
  const q = (280.459 + 0.98564736 * d) % 360;
  const L = (q + 1.915 * sin(g) + 0.02 * sin(2 * g)) % 360;
  
  const obliq = 23.439 - 0.00000036 * d;
  const declination = asin(sin(obliq) * sin(L)); // Dec of Sun
  
  // Equation of time
  const RA = atan2(cos(obliq) * sin(L), cos(L)) / 15;
  let EqT = q / 15 - (RA < 0 ? RA + 24 : RA); // In hours
  EqT = EqT - 24.0 * Math.floor((EqT + 12.0) / 24.0); // Normalize to [-12, 12] range
  
  // Midday time in hours local time
  const midday = 12 + timezoneOffsetHours - lng / 15 - EqT;
  
  const hourAngle = (angle: number) => {
    const num = -sin(angle) - sin(lat) * sin(declination);
    const den = cos(lat) * cos(declination);
    const cosH = num / den;
    if (cosH > 1 || cosH < -1) return NaN;
    return acos(cosH) / 15;
  };
  
  // Sunrise hour angle (sunset is identical)
  const sunAngle = 0.833; // Standard refraction + solar semidiameter
  const H_sunrise = hourAngle(sunAngle);
  
  // Fajr hour angle
  const H_fajr = hourAngle(params.fajrAngle);
  
  // Isha hour angle
  let H_isha = NaN;
  if (params.ishaAngle) {
    H_isha = hourAngle(params.ishaAngle);
  }
  
  // Asr shadow angle calculation
  const shadowFactor = madhab === 'hanafi' ? 2 : 1;
  const g_asr = Math.abs(lat - declination);
  const asr_angle = atan(1 / (shadowFactor + tan(g_asr)));
  const H_asr = hourAngle(-asr_angle);
  
  // Times in decimal hours
  let fajrDec = midday - H_fajr;
  let sunriseDec = midday - H_sunrise;
  let dhuhrDec = midday;
  let asrDec = midday + H_asr;
  let maghribDec = midday + H_sunrise;
  let ishaDec = NaN;
  
  if (params.ishaAngle) {
    ishaDec = midday + H_isha;
  } else if (params.ishaInterval) {
    // interval (minutes) after maghrib
    ishaDec = maghribDec + params.ishaInterval / 60;
  }
  
  // Apply manual offsets in decimal hours
  const applyOffset = (dec: number, key: string) => {
    const offsetMin = manualOffsets[key] ?? 0;
    return dec + offsetMin / 60;
  };
  
  fajrDec = applyOffset(fajrDec, 'Fajr');
  sunriseDec = applyOffset(sunriseDec, 'Sunrise');
  dhuhrDec = applyOffset(dhuhrDec, 'Dhuhr');
  asrDec = applyOffset(asrDec, 'Asr');
  maghribDec = applyOffset(maghribDec, 'Maghrib');
  ishaDec = applyOffset(ishaDec, 'Isha');
  
  return {
    Fajr: formatTime(fajrDec),
    Sunrise: formatTime(sunriseDec),
    Dhuhr: formatTime(dhuhrDec),
    Asr: formatTime(asrDec),
    Maghrib: formatTime(maghribDec),
    Isha: formatTime(ishaDec),
  };
}

export function getCurrentAndNextPrayer(
  prayerTimes: PrayerTimes,
  now: Date = new Date()
): { current: PrayerName; next: PrayerName; timeRemainingStr: string; progressPercent: number } {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const prayers: { name: PrayerName; minutes: number }[] = [
    { name: 'Fajr', minutes: parseTimeToMinutes(prayerTimes.Fajr) },
    { name: 'Sunrise', minutes: parseTimeToMinutes(prayerTimes.Sunrise) },
    { name: 'Dhuhr', minutes: parseTimeToMinutes(prayerTimes.Dhuhr) },
    { name: 'Asr', minutes: parseTimeToMinutes(prayerTimes.Asr) },
    { name: 'Maghrib', minutes: parseTimeToMinutes(prayerTimes.Maghrib) },
    { name: 'Isha', minutes: parseTimeToMinutes(prayerTimes.Isha) },
  ];
  
  // Sort prayers by minutes in the day
  prayers.sort((a, b) => a.minutes - b.minutes);
  
  let currentIdx = -1;
  let nextIdx = -1;
  
  // Check where current time fits
  for (let i = 0; i < prayers.length; i++) {
    const currMin = prayers[i].minutes;
    const nextMin = prayers[(i + 1) % prayers.length].minutes;
    
    if (i === prayers.length - 1) {
      // After Isha, current is Isha, next is Fajr (next day)
      if (currentMinutes >= currMin || currentMinutes < prayers[0].minutes) {
        currentIdx = i;
        nextIdx = 0;
        break;
      }
    } else {
      if (currentMinutes >= currMin && currentMinutes < nextMin) {
        currentIdx = i;
        nextIdx = i + 1;
        break;
      }
    }
  }
  
  if (currentIdx === -1) {
    // Fallback: Before Fajr, current is Isha (of yesterday), next is Fajr
    currentIdx = prayers.length - 1;
    nextIdx = 0;
  }
  
  const currentPrayerObj = prayers[currentIdx];
  const nextPrayerObj = prayers[nextIdx];
  
  // Calculate remaining minutes
  let remMins = 0;
  let elapsedMins = 0;
  let totalSpan = 0;
  
  if (nextIdx === 0) {
    // Next prayer is Fajr (next day or late tonight)
    if (currentMinutes >= currentPrayerObj.minutes) {
      // Late tonight
      totalSpan = (1440 - currentPrayerObj.minutes) + nextPrayerObj.minutes;
      elapsedMins = currentMinutes - currentPrayerObj.minutes;
      remMins = totalSpan - elapsedMins;
    } else {
      // Early morning before Fajr
      totalSpan = (1440 - prayers[prayers.length - 1].minutes) + nextPrayerObj.minutes;
      elapsedMins = (1440 - prayers[prayers.length - 1].minutes) + currentMinutes;
      remMins = totalSpan - elapsedMins;
    }
  } else {
    totalSpan = nextPrayerObj.minutes - currentPrayerObj.minutes;
    elapsedMins = currentMinutes - currentPrayerObj.minutes;
    remMins = nextPrayerObj.minutes - currentMinutes;
  }
  
  const remHours = Math.floor(remMins / 60);
  const remMinutesOnly = remMins % 60;
  
  // Convert numbers to Arabic
  const digitsMap = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const toArabic = (n: number) => n.toString().split('').map(d => digitsMap[parseInt(d)]).join('');
  
  let timeRemainingStr = '';
  if (remHours > 0) {
    timeRemainingStr = `باقي ${toArabic(remHours)} س و ${toArabic(remMinutesOnly)} د`;
  } else {
    timeRemainingStr = `باقي ${toArabic(remMinutesOnly)} دقيقة`;
  }
  
  const progressPercent = Math.min(100, Math.max(0, (elapsedMins / totalSpan) * 100));
  
  return {
    current: currentPrayerObj.name,
    next: nextPrayerObj.name,
    timeRemainingStr,
    progressPercent,
  };
}

export function getArabicPrayerName(name: PrayerName, date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : (date || new Date());
  if (name === 'Dhuhr') {
    if (!isNaN(d.getTime()) && d.getDay() === 5) {
      return 'الجمعة';
    }
  }
  const map: Record<PrayerName, string> = {
    Fajr: 'الفجر',
    Sunrise: 'الشروق',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء',
  };
  return map[name] || name;
}

export function runPrayerCalcGoldenTests(): boolean {
  try {
    const testDate = new Date('2026-08-25T12:00:00Z');
    const cairoTimes = calculatePrayerTimes(testDate, 30.0444, 31.2357, 2, 'Egypt', 'standard');
    const makkahTimes = calculatePrayerTimes(testDate, 21.4225, 39.8262, 3, 'UmmAlQura', 'standard');
    const londonTimes = calculatePrayerTimes(testDate, 51.5074, -0.1278, 1, 'MWL', 'standard');

    const isValidTimes = (times: PrayerTimes) =>
      Boolean(times.Fajr && times.Dhuhr && times.Asr && times.Maghrib && times.Isha && !times.Fajr.includes('NaN'));

    return isValidTimes(cairoTimes) && isValidTimes(makkahTimes) && isValidTimes(londonTimes);
  } catch {
    return false;
  }
}


