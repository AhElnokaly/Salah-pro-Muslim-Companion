import type React from 'react';
import { SpiritualNotification } from '../components/dashboard/SpiritualNotificationsModal';
import { PendingQadaPrayer, RamadanQadaTracker, FastingLog, DashboardTab } from '../types';
import { formatDateKey } from './prayerDayBoundary';

interface GenerateSpiritualNotificationsParams {
  now: Date;
  hijri: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  pendingQadaPrayers: PendingQadaPrayer[];
  setPendingQadaPrayers: React.Dispatch<React.SetStateAction<PendingQadaPrayer[]>>;
  ramadanQada?: RamadanQadaTracker;
  setRamadanQada?: React.Dispatch<React.SetStateAction<RamadanQadaTracker>>;
  setFastingLogs: React.Dispatch<React.SetStateAction<Record<string, FastingLog>>>;
  toArabicNumbers: (n: number | string) => string;
  setActiveTab?: (tab: DashboardTab | string) => void;
}

export function generateSpiritualNotifications({
  now,
  hijri,
  pendingQadaPrayers,
  setPendingQadaPrayers,
  ramadanQada,
  setRamadanQada,
  setFastingLogs,
  toArabicNumbers,
  setActiveTab
}: GenerateSpiritualNotificationsParams): SpiritualNotification[] {
  const list: SpiritualNotification[] = [];

  // 1. Pending Qada Prayers - Smart Contextual Reminder
  if (pendingQadaPrayers.length > 0) {
    const firstPending = pendingQadaPrayers[0];
    const namesArabic: Record<string, string> = {
      Fajr: 'الفجر',
      Dhuhr: 'الظهر',
      Asr: 'العصر',
      Maghrib: 'المغرب',
      Isha: 'العشاء'
    };
    const suggestedPrayerName = namesArabic[firstPending.prayerName] || 'الصلاة';

    list.push({
      id: 'qada-prayers',
      type: 'qada',
      title: `اقتراح تذكرة: وقت مناسب لقضاء صلاة ${suggestedPrayerName}؟ 🤲`,
      description: `لديك صلاة ${suggestedPrayerName} فائتة مسجلة. أسهل طريقة للقضاء هي قضاء صلاة مع كل صلاة حاضرة حتى تبرأ ذمتك.`,
      icon: '⏱️',
      actionLabel: `تسجيل قضاء صلاة ${suggestedPrayerName} الآن`,
      action: () => {
        if (firstPending) {
          setPendingQadaPrayers(prev => prev.filter(p => p.id !== firstPending.id));
        }
      }
    });
  }

  // 2. Ramadan Fasting Make up
  const owed = ramadanQada?.daysOwed || 0;
  const completed = ramadanQada?.daysCompleted || 0;
  const remainingFasts = Math.max(0, owed - completed);
  if (remainingFasts > 0) {
    list.push({
      id: 'ramadan-qada',
      type: 'fasting_make_up',
      title: 'قضاء أيام صيام رمضان',
      description: `متبقي عليك قضاء ${toArabicNumbers(remainingFasts)} أيام من رمضان المبارك. تذكر صيامها قضاءً وابتغِ الأجر من الله.`,
      icon: '🌙',
      actionLabel: 'تسجيل صيام يوم قضاء',
      action: () => {
        if (setRamadanQada) {
          setRamadanQada(prev => ({
            ...prev,
            daysCompleted: Math.min(prev.daysOwed, prev.daysCompleted + 1)
          }));
          
          const dStr = formatDateKey(new Date());
          setFastingLogs(prev => ({
            ...prev,
            [dStr]: {
              date: dStr,
              hijriDate: hijri.fullString,
              fastType: 'Qada',
              fasted: true,
              isQada: true
            }
          }));
        }
      }
    });
  }

  // 3. Upcoming Sunnah Fast
  const dayOfWeek = now.getDay();
  const hDay = hijri.day;

  if (hDay === 12 || hDay === 13 || hDay === 14) {
    const tomorrowDay = hDay + 1;
    list.push({
      id: 'white-days-fast',
      type: 'sunnah_fast',
      title: 'تذكير صيام الأيام البيض',
      description: `غداً هو يوم (${toArabicNumbers(tomorrowDay)}) من الأيام البيض لشهر ${hijri.monthName}. هنيئاً لمن نوى وصام!`,
      icon: '✨',
      actionLabel: 'سجل صيام الغد تبرعاً',
      action: () => {
        const dStr = formatDateKey(new Date());
        setFastingLogs(prev => ({
          ...prev,
          [dStr]: {
            date: dStr,
            hijriDate: hijri.fullString,
            fastType: 'Sunnah',
            fasted: true,
            isQada: false
          }
        }));
      }
    });
  } else if (dayOfWeek === 0) {
    list.push({
      id: 'monday-fast-rem',
      type: 'sunnah_fast',
      title: 'صيام سنة الإثنين غداً',
      description: 'تذكير بصيام غد الإثنين؛ تُعرض فيه الأعمال على رب العالمين، فكن من الصائمين لتنال عظيم الأجر.',
      icon: '📅'
    });
  } else if (dayOfWeek === 3) {
    list.push({
      id: 'thursday-fast-rem',
      type: 'sunnah_fast',
      title: 'صيام سنة الخميس غداً',
      description: 'تذكير بصيام غد الخميس؛ صيام تطوع تبتغي به القرب والزلفى من الرحمن سبحانه وتعالى.',
      icon: '📅'
    });
  }

  // 4. Spiritual advice based on hour
  const hrs = now.getHours();
  if (hrs >= 22 || hrs < 3) {
    list.push({
      id: 'night-prayer-advice',
      type: 'spiritual_advice',
      title: 'قيام الليل والوتر',
      description: 'ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا فيقول: هل من سائل فأعطيه؟ صَلِّ ركعة الوتر وتوسل بالدعاء.',
      icon: '🌌'
    });
  } else if (hrs >= 7 && hrs < 11) {
    list.push({
      id: 'duha-prayer-advice',
      type: 'spiritual_advice',
      title: 'صلاة الضحى والصدقة',
      description: 'صلاة الضحى تجزئ عن صدقة ٣٦٠ مفصلاً من مفاصل جسدك. ركعتان يكتبانك من الأوابين الذاكرين.',
      icon: '☀️'
    });
  }

  // 5. Friday recommendations
  if (dayOfWeek === 4 && hrs >= 18) {
    list.push({
      id: 'friday-night-advice',
      type: 'friday',
      title: 'ليلة الجمعة الغراء',
      description: 'بدأت ليلة الجمعة؛ أكثروا من الصلاة والسلام على الحبيب المصطفى ﷺ، واستنيروا بنورها وضياؤها.',
      icon: '🕌'
    });
  } else if (dayOfWeek === 5) {
    list.push({
      id: 'friday-day-advice',
      type: 'friday',
      title: 'سنن الجمعة المباركة',
      description: 'اليوم جمعة عظيمة؛ لا تنسَ الاغتسال والتطيب والتبكير للمسجد وقراءة سورة الكهف الشريفة والدعاء ساعة الإجابة قبل المغرب.',
      icon: '🕌'
    });
  }

  // General beautiful tips
  list.push({
    id: 'general-adhkar-rem',
    type: 'spiritual_advice',
    title: 'أذكار الصباح والمساء',
    description: 'قال رسول الله ﷺ: "مثل الذي يذكر ربه والذي لا يذكر ربه، مثل الحي والميت". حظك اليومي من الأذكار ينير بصيرتك ويحفظ يومك.',
    icon: '📿',
    actionLabel: 'تصفح الأذكار 📿',
    action: () => {
      if (setActiveTab) setActiveTab('adhkar');
    }
  });

  list.push({
    id: 'general-quran-rem',
    type: 'spiritual_advice',
    title: 'وردك اليومي من القرآن',
    description: 'القرآن ربيع القلوب وجلاء الهموم والغموم، تلاوة صفحة واحدة يومياً بانتظام تنير بصيرتك وحياتك كلها ببركته.',
    icon: '📖',
    actionLabel: 'تصفح القرآن 📖',
    action: () => {
      if (setActiveTab) setActiveTab('quran');
    }
  });

  return list;
}
