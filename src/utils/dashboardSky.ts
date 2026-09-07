import { BackdropType } from '../components/MosqueBackdrop';
import { PrayerTimes, PrayerName } from '../types';
import { parseTimeToMinutes } from './prayerCalc';

export function getTimeOfDayGradientAndLabel(now: Date, times: PrayerTimes): { gradient: string; label: string } {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const fajrMins = parseTimeToMinutes(times.Fajr);
  const sunriseMins = parseTimeToMinutes(times.Sunrise);
  const duhaMins = sunriseMins + 20;
  const dhuhrMins = parseTimeToMinutes(times.Dhuhr);
  const asrMins = parseTimeToMinutes(times.Asr);
  const maghribMins = parseTimeToMinutes(times.Maghrib);
  const ishaMins = parseTimeToMinutes(times.Isha);
  const isFriday = now.getDay() === 5;

  if (nowMins >= fajrMins && nowMins < sunriseMins) {
    return {
      gradient: 'from-[#1c2e4a] via-[#2a456c] to-[#483d8b]',
      label: 'من الفجر للشروق'
    };
  } else if (nowMins >= sunriseMins && nowMins < duhaMins) {
    return {
      gradient: 'from-[#ea580c] via-[#f59e0b] to-[#38bdf8]',
      label: 'من الشروق للضحى'
    };
  } else if (nowMins >= duhaMins && nowMins < dhuhrMins) {
    return {
      gradient: 'from-[#0284c7] via-[#0ea5e9] to-[#0f766e]',
      label: isFriday ? 'من الضحى للجمعة' : 'من الضحى للظهر'
    };
  } else if (nowMins >= dhuhrMins && nowMins < asrMins) {
    return {
      gradient: 'from-[#0284c7] via-[#2563eb] to-[#0891b2]',
      label: isFriday ? 'من الجمعة للعصر' : 'من الظهر للعصر'
    };
  } else if (nowMins >= asrMins && nowMins < maghribMins) {
    return {
      gradient: 'from-[#ea580c] via-[#f59e0b] to-[#b45309]',
      label: 'من العصر للمغرب'
    };
  } else if (nowMins >= maghribMins && nowMins < ishaMins) {
    return {
      gradient: 'from-[#701a75] via-[#4c1d95] to-[#1e1b4b]',
      label: 'من المغرب للعشاء'
    };
  } else if (nowMins >= ishaMins && nowMins < 1440) {
    return {
      gradient: 'from-[#0f172a] via-[#1e1b4b] to-[#0f172a]',
      label: 'من العشاء لمنتصف الليل'
    };
  } else {
    return {
      gradient: 'from-[#050508] via-[#0f172a] to-[#111827]',
      label: 'من منتصف الليل للفجر'
    };
  }
}

export function getAutoBackdropKey(now: Date, times: PrayerTimes, hijri: { month: number; day: number }): BackdropType {
  const isFriday = now.getDay() === 5;

  // Ramadan (Month 9)
  if (hijri.month === 9) return 'ramadan';
  // Eid al-Fitr (Month 10, days 1-3)
  if (hijri.month === 10 && hijri.day <= 3) return 'eid_fitr';
  // Eid al-Adha (Month 12, days 9-13)
  if (hijri.month === 12 && hijri.day >= 9 && hijri.day <= 13) return 'eid_adha';
  // Friday
  if (isFriday) return 'friday';

  // Day/Night check based on current time
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const fajrMins = parseTimeToMinutes(times.Fajr);
  const maghribMins = parseTimeToMinutes(times.Maghrib);

  const isNight = nowMins < fajrMins || nowMins >= maghribMins;
  if (isNight) {
    return 'classic'; // Midnight/deep blue silhouette
  } else {
    return 'gold'; // Golden sunlit mosque backdrop
  }
}

export function getGradientForBackdrop(bKey: BackdropType, defaultGrad: string, backdropStyle?: string): string {
  // If user set 'auto' or no specific style, ALWAYS use defaultGrad (the exact time-of-day sky gradient!)
  if (!backdropStyle || backdropStyle === 'auto') {
    return defaultGrad;
  }

  switch (bKey) {
    case 'glass_crystal':
      return 'from-slate-900/50 via-slate-800/30 to-slate-900/50 border-white/25 shadow-2xl';
    case 'glass_emerald':
      return 'from-emerald-950/50 via-teal-900/30 to-emerald-950/50 border-emerald-400/30 shadow-2xl';
    case 'glass_blue':
      return 'from-sky-950/50 via-blue-900/30 to-sky-950/50 border-sky-400/30 shadow-2xl';
    case 'glass_dark':
      return 'from-black/60 via-slate-900/40 to-black/60 border-white/15 shadow-2xl';
    case 'madinah':
      return 'from-[#022c22] via-[#064e3b] to-[#0f766e]';
    case 'aqsa':
      return 'from-[#78350f] via-[#b45309] to-[#d97706]';
    case 'kaaba':
      return 'from-[#0b0f19] via-[#111827] to-[#1e293b]';
    case 'emerald':
      return 'from-[#022c22] via-[#064e3b] to-[#0f766e]';
    case 'andulas':
      return 'from-[#1e1b4b] via-[#312e81] to-[#4338ca]';
    case 'night_sky':
      return 'from-[#020617] via-[#0f172a] to-[#1e1b4b]';
    case 'gold':
      return 'from-[#d97706] via-[#f59e0b] to-[#b45309]';
    case 'banner':
      return 'from-[#4c0519] via-[#881337] to-[#be185d]';
    case 'ramadan':
      return 'from-[#091e3a] via-[#1d2671] to-[#283c86]';
    case 'eid_fitr':
    case 'eid_adha':
      return 'from-[#3b0764] via-[#581c87] to-[#7e22ce]';
    case 'friday':
      return 'from-[#064e3b] via-[#047857] to-[#0f766e]';
    default:
      return defaultGrad;
  }
}

export function getIslamicEventLabel(now: Date, hijri: { month: number; day: number }): { text: string; desc: string } | null {
  const isFriday = now.getDay() === 5;
  const isThursdayNight = now.getDay() === 4 && now.getHours() >= 18;

  if (hijri.month === 9) {
    return { text: '🌙 شهر رمضان المبارك', desc: 'شهر القرآن والرحمة والقيام والبركات' };
  }
  if (hijri.month === 10 && hijri.day <= 3) {
    return { text: '✨ عيد الفطر المبارك', desc: 'تقبل الله طاعتكم وكل عام وأنتم بخير' };
  }
  if (hijri.month === 12 && hijri.day === 9) {
    return { text: '🕋 يوم عرفة المبارك', desc: 'لبيك اللهم لبيك، يوم المغفرة والرحمة' };
  }
  if (hijri.month === 12 && hijri.day >= 10 && hijri.day <= 13) {
    return { text: '🕋 عيد الأضحى المبارك', desc: 'كل عام وأنتم بخير وعافية وسعادة' };
  }
  if (hijri.month === 1 && hijri.day === 1) {
    return { text: '✨ رأس السنة الهجرية الجديدة', desc: 'عام هجري جديد يحمل الخير والسلام' };
  }
  if (hijri.month === 3 && hijri.day === 12) {
    return { text: '🕌 المولد النبوي الشريف', desc: 'صلوات ربي وسلامه عليك يا نبي الرحمة' };
  }
  if (isFriday) {
    return { text: '🕌 يوم الجمعة المبارك', desc: 'أكثروا من الصلاة على الحبيب ﷺ وقراءة الكهف' };
  }
  if (isThursdayNight) {
    return { text: '🌙 ليلة الجمعة المباركة', desc: 'ساعة إجابة ونور يمتد بين الجمعتين' };
  }
  return null;
}

export function getPrayerProgressPercentage(now: Date, times: PrayerTimes): number {
  const fajrMins = parseTimeToMinutes(times.Fajr);
  const sunriseMins = parseTimeToMinutes(times.Sunrise);
  const dhuhrMins = parseTimeToMinutes(times.Dhuhr);
  const asrMins = parseTimeToMinutes(times.Asr);
  const maghribMins = parseTimeToMinutes(times.Maghrib);
  const ishaMins = parseTimeToMinutes(times.Isha);

  const nowMins = now.getHours() * 60 + now.getMinutes();

  let prevMins = 0;
  let nextMins = 0;

  if (nowMins >= fajrMins && nowMins < sunriseMins) {
    prevMins = fajrMins;
    nextMins = sunriseMins;
  } else if (nowMins >= sunriseMins && nowMins < dhuhrMins) {
    prevMins = sunriseMins;
    nextMins = dhuhrMins;
  } else if (nowMins >= dhuhrMins && nowMins < asrMins) {
    prevMins = dhuhrMins;
    nextMins = asrMins;
  } else if (nowMins >= asrMins && nowMins < maghribMins) {
    prevMins = asrMins;
    nextMins = maghribMins;
  } else if (nowMins >= maghribMins && nowMins < ishaMins) {
    prevMins = maghribMins;
    nextMins = ishaMins;
  } else {
    if (nowMins >= ishaMins) {
      prevMins = ishaMins;
      nextMins = fajrMins + 1440;
    } else {
      prevMins = ishaMins - 1440;
      nextMins = fajrMins;
    }
  }

  const currentAdjusted = nowMins < prevMins ? nowMins + 1440 : nowMins;
  const totalDiff = nextMins - prevMins;
  const elapsed = currentAdjusted - prevMins;

  if (totalDiff <= 0) return 0;
  return Math.min(100, Math.max(0, (elapsed / totalDiff) * 100));
}

export function checkIsFridayWindow(now: Date, times: PrayerTimes): boolean {
  const day = now.getDay();
  if (day !== 4 && day !== 5) return false;
  if (!times || !times.Maghrib) return false;

  const maghribMins = parseTimeToMinutes(times.Maghrib);
  const nowMins = now.getHours() * 60 + now.getMinutes();

  if (day === 4) {
    // Thursday: from Maghrib onwards
    return nowMins >= maghribMins;
  } else {
    // Friday: until Maghrib
    return nowMins < maghribMins;
  }
}
