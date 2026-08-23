import React, { useState, useEffect } from 'react';
import { Sparkles, Moon, Sun, AlertTriangle, Clock, ArrowLeft, HeartHandshake } from 'lucide-react';
import { PrayerTimes } from '../types';
import { toArabicNumbers } from '../utils/hijri';
import { parseTimeToMinutes } from '../utils/prayerCalc';

interface SacredHoursBannerProps {
  prayerTimes?: PrayerTimes;
  now: Date;
  onNavigateTab: (tab: string) => void;
  appStyle?: string;
}

export default function SacredHoursBanner({
  prayerTimes,
  now,
  onNavigateTab,
  appStyle = 'default'
}: SacredHoursBannerProps) {
  const [activeHourType, setActiveHourType] = useState<
    'qiyam' | 'friday_response' | 'athan_iqama' | 'forbidden' | 'normal'
  >('normal');
  const [hourDetails, setHourDetails] = useState<{
    title: string;
    subtitle: string;
    badgeText: string;
    actionText?: string;
    actionTab?: string;
    theme: 'indigo' | 'amber' | 'emerald' | 'rose';
    icon: string;
  } | null>(null);

  useEffect(() => {
    if (!prayerTimes) {
      setHourDetails(null);
      return;
    }

    const currentMs = now.getTime();
    const day = now.getDay(); // 0 = Sun, 5 = Fri

    // Parse prayer date objects for today
    const parseTime = (timeStr: string) => {
      if (!timeStr) return null;
      const totalMins = parseTimeToMinutes(timeStr);
      const d = new Date(now);
      d.setHours(Math.floor(totalMins / 60), totalMins % 60, 0, 0);
      return d;
    };

    const fajrDate = parseTime(prayerTimes.Fajr);
    const sunriseDate = parseTime(prayerTimes.Sunrise);
    const dhuhrDate = parseTime(prayerTimes.Dhuhr);
    const asrDate = parseTime(prayerTimes.Asr);
    const maghribDate = parseTime(prayerTimes.Maghrib);
    const ishaDate = parseTime(prayerTimes.Isha);

    if (!fajrDate || !maghribDate || !sunriseDate || !dhuhrDate || !asrDate) {
      return;
    }

    // 1. Calculate 3rd Night (الثلth الأخير من الليل)
    // Night is from Maghrib to Fajr (next morning)
    let nightStart = maghribDate.getTime();
    let nightEnd = fajrDate.getTime();
    if (currentMs < fajrDate.getTime()) {
      // It's early morning before Fajr, night started yesterday Maghrib
      nightStart = maghribDate.getTime() - 24 * 60 * 60 * 1000;
    } else if (currentMs > maghribDate.getTime()) {
      // It's late evening after Maghrib, night ends tomorrow Fajr
      nightEnd = fajrDate.getTime() + 24 * 60 * 60 * 1000;
    }

    const nightDuration = nightEnd - nightStart;
    const thirdNightStartMs = nightEnd - nightDuration / 3;

    const isInThirdNight = currentMs >= thirdNightStartMs && currentMs < nightEnd;

    // 2. Check Forbidden Nafl Times (أوقات النهي الشرعي عن النافلة)
    // a) Sunrise + 15 mins
    const sunriseEndMs = sunriseDate.getTime() + 15 * 60 * 1000;
    const isSunriseForbidden = currentMs >= sunriseDate.getTime() && currentMs < sunriseEndMs;

    // b) Zenith (10 mins before Dhuhr)
    const dhuhrZenithStartMs = dhuhrDate.getTime() - 10 * 60 * 1000;
    const isZenithForbidden = currentMs >= dhuhrZenithStartMs && currentMs < dhuhrDate.getTime();

    // c) After Asr till Maghrib
    const isPostAsrForbidden = currentMs >= asrDate.getTime() + 20 * 60 * 1000 && currentMs < maghribDate.getTime();

    // 3. Friday Hour of Acceptance (ساعة الاستجابة يوم الجمعة)
    const isFridayAsrWindow = day === 5 && currentMs >= asrDate.getTime() && currentMs < maghribDate.getTime();

    // 4. Inter-Athan-Iqama window (20 mins after any Fard Athan)
    const isAthanIqamaWindow =
      (currentMs >= fajrDate.getTime() && currentMs < fajrDate.getTime() + 20 * 60 * 1000) ||
      (currentMs >= dhuhrDate.getTime() && currentMs < dhuhrDate.getTime() + 20 * 60 * 1000) ||
      (currentMs >= asrDate.getTime() && currentMs < asrDate.getTime() + 20 * 60 * 1000) ||
      (currentMs >= maghribDate.getTime() && currentMs < maghribDate.getTime() + 20 * 60 * 1000) ||
      (ishaDate && currentMs >= ishaDate.getTime() && currentMs < ishaDate.getTime() + 20 * 60 * 1000);

    // Set Priority Banner
    if (isInThirdNight) {
      setActiveHourType('qiyam');
      setHourDetails({
        title: 'الثلث الأخير من الليل قائم الآن 🌙',
        subtitle: 'يتنزل ربنا تبارك وتعالى إلى السماء الدنيا ويقول: هل من داعٍ فأستجيب له؟',
        badgeText: 'ساعة استجابة واستغفار',
        actionText: 'سجل صلاة التهجد والوتر',
        actionTab: 'khushu',
        theme: 'indigo',
        icon: '✨'
      });
    } else if (isFridayAsrWindow) {
      setActiveHourType('friday_response');
      setHourDetails({
        title: 'ساعة الاستجابة يوم الجمعة 🤲',
        subtitle: 'فيه ساعة لا يوافقها عبد مسلم يدعو الله إلا أعطاه إياه، أكثِر من الدعاء والصلاة على النبي ﷺ',
        badgeText: 'ساعة استجابة الجمعة',
        actionText: 'أدعية وأذكار الجمعة',
        actionTab: 'adhkar',
        theme: 'amber',
        icon: '🕌'
      });
    } else if (isSunriseForbidden) {
      setActiveHourType('forbidden');
      setHourDetails({
        title: 'وقت النهي عن النافلة (عند الشروق) ☀️',
        subtitle: 'يُكره ابتداء صلاة النافلة عند شروق الشمس حتى ترتفع قيد رمح (حوالي ١٥ دقيقة بعد الشروق).',
        badgeText: 'وقت نهي شرعي',
        actionText: 'اقرأ أذكار الصباح بدلاً منها',
        actionTab: 'adhkar',
        theme: 'rose',
        icon: '⛔'
      });
    } else if (isZenithForbidden) {
      setActiveHourType('forbidden');
      setHourDetails({
        title: 'وقت النهي عند استواء الشمس ☀️',
        subtitle: 'قبل أذان الظهر بـ ١٠ دقائق تقريباً حتى تزول الشمس، يُكره فيها صلاة النافلة.',
        badgeText: 'وقت نهي شرعي',
        actionText: 'استغل الوقت بالاستغفار',
        actionTab: 'adhkar',
        theme: 'rose',
        icon: '⛔'
      });
    } else if (isPostAsrForbidden) {
      setActiveHourType('forbidden');
      setHourDetails({
        title: 'وقت الكراهة والنهي بعد العصر 🌤️',
        subtitle: 'لا صلاة نافلة مطلقة بعد صلاة العصر حتى تغرب الشمس، ويُستحب شغل الوقت بالأذكار والدعاء.',
        badgeText: 'وقت نهي عن النافلة',
        actionText: 'اذهب لأذكار المساء',
        actionTab: 'adhkar',
        theme: 'rose',
        icon: '📜'
      });
    } else if (isAthanIqamaWindow) {
      setActiveHourType('athan_iqama');
      setHourDetails({
        title: 'بين الأذان والإقامة 🤲',
        subtitle: 'قال رسول الله ﷺ: «الدُّعَاءُ لا يُرَدُّ بَيْنَ الأَذَانِ وَالإِقَامَةِ»، اغتنم هذه الدقائق بالدعاء.',
        badgeText: 'نافذة استجابة الدعاء',
        actionText: 'افتح أدعية الكتاب والسنة',
        actionTab: 'adhkar',
        theme: 'emerald',
        icon: '💫'
      });
    } else {
      setActiveHourType('normal');
      setHourDetails(null);
    }
  }, [prayerTimes, now]);

  if (!hourDetails) return null;

  const themeStyles = {
    indigo: {
      bg: 'bg-gradient-to-r from-indigo-950/80 via-purple-950/70 to-slate-900/90 border-indigo-500/40 text-indigo-100',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      btn: 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/25',
    },
    amber: {
      bg: 'bg-gradient-to-r from-amber-950/80 via-orange-950/70 to-slate-900/90 border-amber-500/40 text-amber-100',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      btn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25',
    },
    emerald: {
      bg: 'bg-gradient-to-r from-emerald-950/80 via-teal-950/70 to-slate-900/90 border-emerald-500/40 text-emerald-100',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      btn: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25',
    },
    rose: {
      bg: 'bg-gradient-to-r from-rose-950/80 via-slate-900/80 to-slate-950/90 border-rose-500/40 text-rose-100',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      btn: 'bg-rose-500/80 hover:bg-rose-600 text-white shadow-rose-500/25',
    },
  }[hourDetails.theme];

  return (
    <div
      className={`p-4 rounded-2xl border shadow-lg transition-all duration-500 relative overflow-hidden ${themeStyles.bg}`}
      dir="rtl"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg">{hourDetails.icon}</span>
            <span className="text-sm font-black text-white">{hourDetails.title}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${themeStyles.badge}`}>
              {hourDetails.badgeText}
            </span>
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-2xl">
            {hourDetails.subtitle}
          </p>
        </div>

        {hourDetails.actionText && hourDetails.actionTab && (
          <button
            type="button"
            onClick={() => onNavigateTab(hourDetails.actionTab!)}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 ${themeStyles.btn}`}
          >
            <span>{hourDetails.actionText}</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
