import { PrayerName } from '../../types';
import { getArabicPrayerName, parseTimeToMinutes, PrayerTimes } from '../../utils/prayerCalc';

export const FIVE_DAILY_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const formatDateToTimesStr = (date: Date): string => {
  const finalHour = date.getHours();
  const finalMin = date.getMinutes();
  
  const ampm = finalHour >= 12 ? 'م' : 'ص';
  const displayHour = finalHour % 12 === 0 ? 12 : finalHour % 12;
  const padMin = finalMin.toString().padStart(2, '0');
  
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const displayHourStr = displayHour.toString().split('').map(d => arabicDigits[parseInt(d)] ?? d).join('');
  const padMinStr = padMin.split('').map(d => arabicDigits[parseInt(d)] ?? d).join('');
  
  return `${displayHourStr}:${padMinStr} ${ampm}`;
};

export interface CountdownInfo {
  nextPrayerName: PrayerName;
  countdownStr: string;
  arabicNextName: string;
}

export const getExactCountdown = (prayerTimes: PrayerTimes | Record<string, string>, now: Date): CountdownInfo => {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const prayers: { name: PrayerName; timeStr: string }[] = [
    { name: 'Fajr', timeStr: prayerTimes.Fajr || '05:00' },
    { name: 'Sunrise', timeStr: prayerTimes.Sunrise || '06:30' },
    { name: 'Dhuhr', timeStr: prayerTimes.Dhuhr || '12:00' },
    { name: 'Asr', timeStr: prayerTimes.Asr || '15:30' },
    { name: 'Maghrib', timeStr: prayerTimes.Maghrib || '18:00' },
    { name: 'Isha', timeStr: prayerTimes.Isha || '19:30' },
  ];
  
  const parsed = prayers.map(p => {
    const mins = parseTimeToMinutes(p.timeStr);
    return { ...p, mins };
  });
  
  parsed.sort((a, b) => a.mins - b.mins);
  let nextObj = parsed.find(p => p.mins > currentMinutes);
  let isTomorrow = false;
  
  if (!nextObj) {
    nextObj = parsed[0];
    isTomorrow = true;
  }
  
  const nextDate = new Date(now);
  const nextMins = nextObj.mins;
  const targetHour = Math.floor(nextMins / 60);
  const targetMin = nextMins % 60;
  
  nextDate.setHours(targetHour, targetMin, 0, 0);
  if (isTomorrow) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  const diffMs = nextDate.getTime() - now.getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  
  const h = Math.floor(diffSecs / 3600);
  const m = Math.floor((diffSecs % 3600) / 60);
  const s = diffSecs % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  const toArabic = (str: string) => str.split('').map(char => arabicDigits[parseInt(char)] ?? char).join('');
  
  const countdownStr = `${toArabic(pad(h))} : ${toArabic(pad(m))} : ${toArabic(pad(s))}`;
  
  return {
    nextPrayerName: nextObj.name,
    countdownStr,
    arabicNextName: getArabicPrayerName(nextObj.name)
  };
};

export const athanPhrases = [
  { text: 'الله أكبر، الله أكبر', duration: 12 },
  { text: 'الله أكبر، الله أكبر', duration: 12 },
  { text: 'أشهد أن لا إله إلا الله', duration: 12 },
  { text: 'أشهد أن لا إله إلا الله', duration: 12 },
  { text: 'أشهد أن محمداً رسول الله', duration: 12 },
  { text: 'أشهد أن محمداً رسول الله', duration: 12 },
  { text: 'حي على الصلاة', duration: 10 },
  { text: 'حي على الصلاة', duration: 10 },
  { text: 'حي على الفلاح', duration: 10 },
  { text: 'حي على الفلاح', duration: 10 },
  { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
  { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
  { text: 'الله أكبر، الله أكبر', duration: 10 },
  { text: 'لا إله إلا الله', duration: 10 },
];
