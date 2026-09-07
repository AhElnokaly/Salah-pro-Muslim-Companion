import { PrayerTimes, PrayerName } from '../types';
import { parseTimeToMinutes } from './prayerCalc';

export function calculateFastingProgress(now: Date, times: PrayerTimes, fasted: boolean, toArabicNumbers: (n: number | string) => string) {
  if (!fasted) {
    return {
      label: 'غير صائم اليوم',
      countdownStr: 'غير مسجل',
      percent: 0
    };
  }

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const fajrMins = parseTimeToMinutes(times.Fajr);
  const maghribMins = parseTimeToMinutes(times.Maghrib);
  
  if (nowMins >= fajrMins && nowMins <= maghribMins) {
    const totalFastingMins = maghribMins - fajrMins;
    const passed = nowMins - fajrMins;
    const percent = Math.min(100, Math.max(0, Math.round((passed / totalFastingMins) * 100)));
    const remainingMins = maghribMins - nowMins;
    const h = Math.floor(remainingMins / 60);
    const m = remainingMins % 60;
    return {
      label: 'متبقي للإفطار',
      countdownStr: `${toArabicNumbers(h)}س و ${toArabicNumbers(m)}د`,
      percent
    };
  } else {
    let remainingMins = 0;
    if (nowMins > maghribMins) {
      remainingMins = (1440 - nowMins) + fajrMins;
    } else {
      remainingMins = fajrMins - nowMins;
    }
    const h = Math.floor(remainingMins / 60);
    const m = remainingMins % 60;
    return {
      label: 'متبقي للإمساك',
      countdownStr: `${toArabicNumbers(h)}س و ${toArabicNumbers(m)}د`,
      percent: 100 - Math.min(100, Math.round((remainingMins / 600) * 100))
    };
  }
}

export function calculateCelestialPosition(now: Date, times: PrayerTimes) {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const fajrMins = parseTimeToMinutes(times.Fajr);
  const maghribMins = parseTimeToMinutes(times.Maghrib);
  
  if (nowMins >= fajrMins && nowMins <= maghribMins) {
    const totalDayMins = maghribMins - fajrMins;
    const passedMins = nowMins - fajrMins;
    const percent = totalDayMins > 0 ? (passedMins / totalDayMins) : 0.5;
    const glow = Math.max(0, 1 - Math.abs(percent - 0.5) * 2);
    return {
      type: 'sun' as const,
      percent: percent * 100,
      glow
    };
  } else {
    let passedMins = 0;
    let totalNightMins = 0;
    if (nowMins > maghribMins) {
      passedMins = nowMins - maghribMins;
      totalNightMins = (1440 - maghribMins) + fajrMins;
    } else {
      passedMins = (1440 - maghribMins) + nowMins;
      totalNightMins = (1440 - maghribMins) + fajrMins;
    }
    const percent = totalNightMins > 0 ? (passedMins / totalNightMins) : 0.5;
    return {
      type: 'moon' as const,
      percent: percent * 100,
      glow: 0.5
    };
  }
}

export function calculateCelestialRightPercentage(
  now: Date, 
  times: PrayerTimes, 
  fiveDailyPrayers: PrayerName[], 
  current: PrayerName, 
  next: PrayerName
): number {
  const currentIdx = fiveDailyPrayers.indexOf(current);
  const nextIdx = fiveDailyPrayers.indexOf(next);
  
  if (currentIdx === -1 || nextIdx === -1) return 50; // fallback
  
  const currentMins = parseTimeToMinutes(times[current]);
  const nextMins = parseTimeToMinutes(times[next]);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  
  let fraction = 0;
  if (nextMins > currentMins) {
    const total = nextMins - currentMins;
    const passed = nowMins - currentMins;
    fraction = Math.min(1, Math.max(0, passed / total));
  } else {
    // Wrap around (Isha to Fajr next day)
    const total = (1440 - currentMins) + nextMins;
    const passed = nowMins >= currentMins ? (nowMins - currentMins) : ((1440 - currentMins) + nowMins);
    fraction = Math.min(1, Math.max(0, passed / total));
  }
  
  const currentPos = 10 + currentIdx * 20;
  const nextPos = 10 + nextIdx * 20;
  
  return currentPos + fraction * (nextPos - currentPos);
}
