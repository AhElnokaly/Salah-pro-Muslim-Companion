/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Moon, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Heart, 
  Star, 
  Plus, 
  Minus, 
  Calendar, 
  Volume2, 
  VolumeX,
  Copy, 
  Check, 
  Bell, 
  ChevronLeft, 
  Flame, 
  BookOpen, 
  Award, 
  Sliders,
  HelpCircle,
  Zap,
  RotateCcw
} from 'lucide-react';
import { AppSettings, PrayerLog } from '../types';
import { calculatePrayerTimes, parseTimeToMinutes } from '../utils/prayerCalc';
import { toArabicNumbers, getHijriDate } from '../utils/hijri';

interface KhushuQiyamTrackerProps {
  settings: AppSettings;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  onNavigateTab?: (tab: string) => void;
}

interface QiyamLogEntry {
  date: string;
  rakahs: number;
  witrRakahs: number;
  khushuRating: number; // 1 to 5
  surahsRead: string;
  notes: string;
}

const KHUSHU_STEPS = [
  {
    id: 'wudu',
    title: 'إسباغ الوضوء والدعاء بعده',
    desc: 'الوضوء بتمهل مع استحضار تساقط الذنوب مع قطرات الماء.',
    category: 'preparation'
  },
  {
    id: 'mindset',
    title: 'تفريغ الذهن وقطع الشواغل',
    desc: 'إغلاق المشتتات والتركيز على الوقوف بين يدي جلال الله.',
    category: 'preparation'
  },
  {
    id: 'gaze',
    title: 'النظر إلى موضع السجود',
    desc: 'تجنب الالتفات بالبصر أو العقل، وحصر النظر في مكان سجودك.',
    category: 'during'
  },
  {
    id: 'tranquility',
    title: 'الطمأنينة الكاملة في الأركان',
    desc: 'أن يرجع كل عظم إلى موضعه في الركوع والسجود دون عجلة.',
    category: 'during'
  },
  {
    id: 'tadabbur',
    title: 'ترتيل الفاتحة والآيات وتدبرها',
    desc: 'القراءة بتمهل مع الوقوف على رؤوس الآيات واستشعار الخطاب.',
    category: 'during'
  },
  {
    id: 'shaitan_refuge',
    title: 'الاستعاذة عند وسواس الصلاة',
    desc: 'الاستعاذة بالله والتفل عن اليسار ثلاثاً عند هجوم وسواس (خنزب).',
    category: 'during'
  },
  {
    id: 'sujood_munajat',
    title: 'الإطالة في السجود والمناجاة',
    desc: 'أقرب ما يكون العبد من ربه وهو ساجد؛ فأكثروا فيه من الدعاء.',
    category: 'post'
  }
];

const QIYAM_DUAS = [
  {
    id: 'istiftah_qiyam',
    title: 'دعاء الاستفتاح في قيام الليل',
    arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الْحَمْدُ أَنْتَ قَيِّمُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الْحَمْدُ أَنْتَ الْحَقُّ وَوَعْدُكَ الْحَقُّ، وَلِقَاؤُكَ حَقٌّ، وَالْجَنَّةُ حَقٌّ، وَالنَّارُ حَقٌّ، وَالنَّبِيُّونَ حَقٌّ، وَمُحَمَّدٌ ﷺ حَقٌّ، وَالسَّاعَةُ حَقٌّ...',
    source: 'صحيح البخاري ومسلم - عن ابن عباس رضي الله عنهما'
  },
  {
    id: 'qunut_witr',
    title: 'دعاء القنوت في صلاة الوتر',
    arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلا يُقْضَى عَلَيْكَ، إِنَّهُ لا يَذِلُّ مَنْ وَالَيْتَ، وَلا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ.',
    source: 'سنن أَبِي داود والترمذي - تعليم النبي ﷺ للحسن بن علي'
  },
  {
    id: 'suhoor_istighfar',
    title: 'أذكار واستغفار الأسحار (قبل الفجر)',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ (وَبِالأَسْحَارِ هُمْ يَسْتَغْفِرُونَ).',
    source: 'القرآن الكريم - سورة الذاريات'
  },
  {
    id: 'sayyid_istighfar',
    title: 'سيد الاستغفار',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ.',
    source: 'صحيح البخاري'
  }
];

const QIYAM_HADITHS = [
  {
    id: 'h1',
    text: '«أَفْضَلُ الصَّلاَةِ بَعْدَ الصَّلاَةِ الْمَكْتُوبَةِ صَلاَةُ اللَّيْلِ»',
    source: 'صحيح مسلم',
    tag: 'فضيلة عظيمة'
  },
  {
    id: 'h2',
    text: '«مَنْ قَامَ بِعَشْرِ آيَاتٍ لَمْ يُكْتَبْ مِنَ الْغَافِلِينَ، وَمَنْ قَامَ بِمِائَةِ آيَةٍ كُتِبَ مِنَ الْقَانِتِينَ، وَمَنْ قَامَ بِأَلْفِ آيَةٍ كُتِبَ مِنَ الْمُقَنْطِرِينَ»',
    source: 'سنن أبي داود (حديث صحيح)',
    tag: 'مراتب القائمين'
  },
  {
    id: 'h3',
    text: '«إِنَّ فِي اللَّيْلِ لَسَاعَةً لاَ يُوَافِقُهَا رَجُلٌ مُسْلِمٌ يَسْأَلُ اللَّهَ خَيْرًا مِنْ أَمْرِ الدُّنْيَا وَالآخِرَةِ إِلاَّ أَعْطَاهُ إِيَّاهُ وَذَلِكَ كُلَّ لَيْلَةٍ»',
    source: 'صحيح مسلم',
    tag: 'إجابة الدعاء'
  }
];

const QIYAM_PLANS = [
  {
    id: 'quick_15',
    title: 'خطة التهجد السريعة (١٥ دقيقة)',
    desc: 'مناسبة لمن استيقظ قريباً من الفجر أو لديه مشغلة.',
    steps: [
      'ركعتان خفيفتان لقيام الليل بآيات قصيرة',
      'ركعة واحدة للوتر مع دعاء القنوت',
      '٥ دقائق استغفار ومناجاة بالسحر قبل الفجر'
    ]
  },
  {
    id: 'balanced_30',
    title: 'خطة التهجد المتوازنة (٣٠ دقيقة)',
    desc: 'الخطة المثالية المتوسطة تجمع بين خشوع القراءة والدعاء.',
    steps: [
      'ركعتان افتتاحيتان خفيفتان',
      '٤ ركعات (مثنى مثنى) بقراءة تبارك أو يس أو الواقعة',
      'ركعة الوتر مع القنوت',
      '٧ دقائق استغفار ومناجاة الأسحار'
    ]
  },
  {
    id: 'deep_60',
    title: 'خطة المحراب المتبتل (٦٠ دقيقة)',
    desc: 'لإطالة القيام والتدبر والمناجاة في ثلث الليل الآخر.',
    steps: [
      'ركعتان افتتاحيتان',
      '٨ ركعات بطوال السور وتدبر الآيات',
      '٣ ركعات شفع ووتر مع قنوت خاشع',
      '١٥ دقيقة دعاء وسجود واستغفار الأسحار'
    ]
  }
];

export default function KhushuQiyamTracker({
  settings,
  prayerLogs,
  setPrayerLogs,
  onNavigateTab
}: KhushuQiyamTrackerProps) {
  const isDarkTheme = settings.theme === 'dark' || 
    ((!settings.theme || settings.theme === 'system') && 
     window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedDuaId, setCopiedDuaId] = useState<string | null>(null);
  const [logSuccessMsg, setLogSuccessMsg] = useState<string>('');

  // Ambient tranquility audio generator state (Web Audio API synth)
  const [activeAmbient, setActiveAmbient] = useState<'none' | 'rain' | 'breeze' | 'drone'>('none');
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopAmbientAudio = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setActiveAmbient('none');
  };

  const playAmbientAudio = (type: 'rain' | 'breeze' | 'drone') => {
    if (activeAmbient === type) {
      stopAmbientAudio();
      return;
    }
    stopAmbientAudio();

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.08;
      masterGain.connect(ctx.destination);

      if (type === 'rain' || type === 'breeze') {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
        filter.frequency.value = type === 'rain' ? 700 : 350;

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
      } else if (type === 'drone') {
        // Serene ambient sine harmonic synth (C-G-C-E meditative chord)
        [130.81, 196.00, 261.63, 329.63].forEach(freq => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const oscGain = ctx.createGain();
          oscGain.gain.value = 0.02;
          osc.connect(oscGain);
          oscGain.connect(masterGain);
          osc.start();
        });
      }

      setActiveAmbient(type);
    } catch (e) {
      console.error(e);
    }
  };

  // Clean up ambient audio on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Ticking time effect
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = currentTime.toISOString().split('T')[0];
  const hijri = getHijriDate(currentTime, settings.hijriOffset);

  // Calculate prayer times for today and tomorrow to deduce exact night boundaries
  const todayTimes = calculatePrayerTimes(
    currentTime,
    settings.latitude,
    settings.longitude,
    -currentTime.getTimezoneOffset() / 60,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );

  const tomorrowDate = new Date(currentTime);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowTimes = calculatePrayerTimes(
    tomorrowDate,
    settings.latitude,
    settings.longitude,
    -tomorrowDate.getTimezoneOffset() / 60,
    settings.calcMethod,
    settings.madhab,
    settings.prayerOffsets || {}
  );

  // Parse Maghrib today and Fajr tomorrow to calculate Night Duration & Third of Night
  const getNightCalculations = () => {
    const maghribMins = parseTimeToMinutes(todayTimes.Maghrib || '18:00');
    const fajrMins = parseTimeToMinutes(tomorrowTimes.Fajr || '04:30');
    
    // Total night minutes: from Maghrib (e.g. 18:00 = 1080) to Fajr tomorrow (e.g. 04:30 = 270)
    // 1440 - 1080 + 270 = 630 mins (10.5 hours)
    const nightDurationMins = (1440 - maghribMins) + fajrMins;
    const thirdMins = Math.floor(nightDurationMins / 3);
    const halfMins = Math.floor(nightDurationMins / 2);

    // Start of last third = Maghrib + (2 * thirdMins)
    const lastThirdStartMinsFromMaghrib = (maghribMins + 2 * thirdMins) % 1440;
    const midnightMinsFromMaghrib = (maghribMins + halfMins) % 1440;

    const formatMinsToTimeString = (totalMins: number) => {
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      const ampm = h >= 12 ? 'م' : 'ص';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const padM = m.toString().padStart(2, '0');
      return `${toArabicNumbers(displayH)}:${toArabicNumbers(padM)} ${ampm}`;
    };

    const lastThirdStartStr = formatMinsToTimeString(lastThirdStartMinsFromMaghrib);
    const midnightStr = formatMinsToTimeString(midnightMinsFromMaghrib);

    // Current time in minutes of day
    const currentMinsNow = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    // Check if we are currently inside the Last Third of the Night
    // Night spans from maghribMins -> 1440 and 0 -> fajrMins
    let isCurrentlyInLastThird = false;
    let minsUntilLastThird = 0;

    const lastThirdAbsMins = lastThirdStartMinsFromMaghrib; // Absolute minute in 24h
    if (lastThirdAbsMins > maghribMins) {
      // Last third starts before midnight 00:00
      if (currentMinsNow >= lastThirdAbsMins || currentMinsNow < fajrMins) {
        isCurrentlyInLastThird = true;
      }
    } else {
      // Last third starts after midnight 00:00 (e.g., 01:30 AM)
      if (currentMinsNow >= lastThirdAbsMins && currentMinsNow < fajrMins) {
        isCurrentlyInLastThird = true;
      }
    }

    return {
      maghribStr: todayTimes.Maghrib,
      fajrStr: tomorrowTimes.Fajr,
      lastThirdStartStr,
      midnightStr,
      nightDurationHours: (nightDurationMins / 60).toFixed(1),
      isCurrentlyInLastThird
    };
  };

  const nightCalc = getNightCalculations();

  // Active Logging States
  const dayLog = prayerLogs[todayStr] || {};
  const qiyamLog = dayLog['Qiyam'] || { status: 'not_yet', extraRakahs: 0 };
  const witrLog = dayLog['Witr'] || { status: 'not_yet', extraRakahs: 0 };

  const [qiyamRakahs, setQiyamRakahs] = useState<number>(qiyamLog.extraRakahs || 0);
  const [witrRakahs, setWitrRakahs] = useState<number>(witrLog.extraRakahs || 0);
  const [khushuRating, setKhushuRating] = useState<number>(() => {
    const saved = localStorage.getItem(`khushu_rating_${todayStr}`);
    return saved ? parseInt(saved) : 4;
  });
  const [surahsRead, setSurahsRead] = useState<string>(() => {
    return localStorage.getItem(`qiyam_surahs_${todayStr}`) || '';
  });
  const [personalNotes, setPersonalNotes] = useState<string>(() => {
    return localStorage.getItem(`qiyam_notes_${todayStr}`) || '';
  });

  // Completed Khushu checklist
  const [completedKhushuSteps, setCompletedKhushuSteps] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`khushu_steps_${todayStr}`);
      return saved ? new Set(JSON.parse(saved)) : new Set(['wudu', 'gaze', 'tranquility']);
    } catch (e) {
      return new Set(['wudu', 'gaze', 'tranquility']);
    }
  });

  const toggleKhushuStep = (id: string) => {
    setCompletedKhushuSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (navigator.vibrate) navigator.vibrate(20);
      }
      localStorage.setItem(`khushu_steps_${todayStr}`, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  // Handle saving Qiyam log
  const handleSaveQiyam = (qRakahs: number, wRakahs: number) => {
    setQiyamRakahs(qRakahs);
    setWitrRakahs(wRakahs);

    const updatedQiyamStatus = qRakahs > 0 ? 'A' : 'not_yet';
    const updatedWitrStatus = wRakahs > 0 ? 'A' : 'not_yet';

    setPrayerLogs(prev => ({
      ...prev,
      [todayStr]: {
        ...(prev[todayStr] || {}),
        Qiyam: {
          status: updatedQiyamStatus,
          sunnahBefore: 0,
          sunnahAfter: 0,
          extraRakahs: qRakahs
        },
        Witr: {
          status: updatedWitrStatus,
          sunnahBefore: 0,
          sunnahAfter: 0,
          extraRakahs: wRakahs
        }
      }
    }));

    localStorage.setItem(`khushu_rating_${todayStr}`, khushuRating.toString());
    localStorage.setItem(`qiyam_surahs_${todayStr}`, surahsRead);
    localStorage.setItem(`qiyam_notes_${todayStr}`, personalNotes);

    setLogSuccessMsg(`تم حفظ صلاة قيام الليل (${toArabicNumbers(qRakahs)} ركعات) والوتر (${toArabicNumbers(wRakahs)} ركعات) بنجاح! تقبل الله.`);
  };

  // Copy Dua helper
  const handleCopyDua = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDuaId(id);
    setTimeout(() => setCopiedDuaId(null), 2500);
  };

  // Helper to add quick Tahajjud custom alarm
  const handleAddTahajjudAlarm = (minsBeforeFajr: number, label: string) => {
    try {
      const fajrMins = parseTimeToMinutes(todayTimes.Fajr || '04:30');
      let alarmMins = fajrMins - minsBeforeFajr;
      if (alarmMins < 0) alarmMins += 1440;

      const h = Math.floor(alarmMins / 60);
      const m = alarmMins % 60;
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

      const saved = localStorage.getItem('salah_custom_alarms');
      const existing = saved ? JSON.parse(saved) : [];

      const newAlarm = {
        id: `tahajjud_alarm_${Date.now()}`,
        title: `منبه التهجد: ${label}`,
        time: timeStr,
        days: [0, 1, 2, 3, 4, 5, 6],
        enabled: true,
        soundType: 'adhan'
      };

      const next = [...existing, newAlarm];
      localStorage.setItem('salah_custom_alarms', JSON.stringify(next));

      setLogSuccessMsg(`تم إضافة ${newAlarm.title} الساعة (${toArabicNumbers(timeStr)}) بنجاح! ⏰`);
      if (onNavigateTab) {
        setTimeout(() => onNavigateTab('alarms'), 1200);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Past 30 days Qiyam statistics
  const getQiyamStats = () => {
    let qiyamDaysCount = 0;
    let totalRakahsSum = 0;
    
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(currentTime.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const log = prayerLogs[dStr];
      if (log && log['Qiyam'] && log['Qiyam'].status === 'A') {
        qiyamDaysCount++;
        totalRakahsSum += log['Qiyam'].extraRakahs || 2;
      }
    }

    return { qiyamDaysCount, totalRakahsSum };
  };

  const { qiyamDaysCount, totalRakahsSum } = getQiyamStats();

  return (
    <div className="space-y-6 text-right pb-12 animate-fade-in">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c121e] via-[#151c2d] to-[#1f1636] p-6 text-white border border-indigo-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Moon className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>الخشوع وقيام الليل والتهجد</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                    شرف المؤمن 🌙
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300 font-medium">
                  حاسبة ثلث الليل الآخر، دليل الخشوع في الصلاة، وأدعية ومناجاة التهجد
                </p>
              </div>
            </div>

            <div className="text-left font-mono">
              <span className="text-xs text-indigo-300 font-bold block">{hijri.fullString}</span>
              <span className="text-[10px] text-slate-400 font-bold">{toArabicNumbers(todayStr)}</span>
            </div>
          </div>

          {/* Hadith Quote Banner */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1">
            <p className="text-xs sm:text-sm font-black text-amber-200 leading-relaxed font-serif">
              «عَلَيْكُمْ بِقِيَامِ اللَّيْلِ فَإِنَّهُ دَأَبُ الصَّالِحِينَ قَبْلَكُمْ، وَقُرْبَةٌ إِلَى رَبِّكُمْ، وَمَكْفَرَةٌ لِلسَّيِّئَاتِ»
            </p>
            <span className="text-[9.5px] text-slate-400 block font-bold">
              [جامع الترمذي] - قيام الليل نورٌ في الوجه وسكينةٌ في القلب وطمأنينةٌ في الروح.
            </span>
          </div>
        </div>
      </div>

      {/* SUCCESS TOAST NOTIFICATION */}
      {logSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{logSuccessMsg}</span>
        </div>
      )}

      {/* 2. NIGHT THIRD CALCULATOR & LIVE TIMER CARD */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                حاسبة ثلث الليل الآخر ومنتصف الليل الشرعي
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                حساب دقيق لوقت النزول الإلهي وموعد إجابة الدعاء حسب موقعك الجغرافي
              </p>
            </div>
          </div>

          {nightCalc.isCurrentlyInLastThird ? (
            <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-xl text-[10px] font-black animate-pulse flex items-center gap-1">
              <span>✨ ثلث الليل الآن!</span>
            </span>
          ) : (
            <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-xl text-[10px] font-black">
              محسوب تلقائياً
            </span>
          )}
        </div>

        {/* Live Status Alert Box */}
        {nightCalc.isCurrentlyInLastThird ? (
          <div className="p-4 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/15 border border-amber-500/30 rounded-2xl space-y-1 text-center">
            <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>أنت الآن في وقت ثلث الليل الآخر المبارك! 🌌</span>
            </span>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
              «يَنْزِلُ رَبُّنَا تَبَارَك وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ يَقُولُ: مَنْ يَدْعُونِي فَأَسْتَجِيبَ لَهُ؟ مَنْ يَسْأَلُنِي فَأُعْطِيَهُ؟ مَنْ يَسْتَغْفِرُنِي فَأَغْفِرَ لَهُ؟»
            </p>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400">طول ليلة اليوم:</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {toArabicNumbers(nightCalc.nightDurationHours)} ساعة
            </span>
          </div>
        )}

        {/* Timings Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
          <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold block mb-1">غروب الشمس (المغرب)</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
              {toArabicNumbers(nightCalc.maghribStr || '')}
            </span>
          </div>

          <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40">
            <span className="text-[9.5px] text-indigo-600 dark:text-indigo-300 font-bold block mb-1">منتصف الليل الشرعي</span>
            <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 font-mono">
              {nightCalc.midnightStr}
            </span>
          </div>

          <div className="p-3 bg-amber-500/10 dark:bg-amber-950/40 rounded-2xl border border-amber-500/20">
            <span className="text-[9.5px] text-amber-700 dark:text-amber-400 font-black block mb-1">بداية ثلث الليل الآخر 🌟</span>
            <span className="text-xs font-black text-amber-800 dark:text-amber-300 font-mono">
              {nightCalc.lastThirdStartStr}
            </span>
          </div>

          <div className="p-3 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/60">
            <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold block mb-1">أذان الفجر الصادق</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
              {toArabicNumbers(nightCalc.fajrStr || '')}
            </span>
          </div>
        </div>

        {/* Quick Tahajjud Alarm Launcher */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>ضبط منبه التهجد الذكي بنقرة واحدة:</span>
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleAddTahajjudAlarm(45, '45 دقيقة قبل الفجر')}
              className="py-2 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer text-center"
            >
              ⏰ قبل الفجر بـ 45 دقيقة
            </button>
            <button
              type="button"
              onClick={() => handleAddTahajjudAlarm(30, '30 دقيقة قبل الفجر')}
              className="py-2 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 transition-all cursor-pointer text-center"
            >
              ⏰ قبل الفجر بـ 30 دقيقة
            </button>
            <button
              type="button"
              onClick={() => handleAddTahajjudAlarm(15, '15 دقيقة قبل الفجر')}
              className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer text-center"
            >
              ⏰ قبل الفجر بـ 15 دقيقة
            </button>
          </div>
        </div>

        {/* Ambient Tranquility Audio Synthesizer Controls */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>مُولّد السكينة وصوتيات خشوع التهجد (بدون إنترنت):</span>
            </span>

            {activeAmbient !== 'none' && (
              <button
                type="button"
                onClick={stopAmbientAudio}
                className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <VolumeX className="w-3 h-3" />
                <span>إيقاف الصوت</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => playAmbientAudio('rain')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                activeAmbient === 'rain'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <span>🌧️ مطر خفيف</span>
            </button>

            <button
              type="button"
              onClick={() => playAmbientAudio('breeze')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                activeAmbient === 'breeze'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              <span>🍃 نسيم السحر</span>
            </button>

            <button
              type="button"
              onClick={() => playAmbientAudio('drone')}
              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                activeAmbient === 'drone'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-400'
              }`}
            >
              <span>🌌 نغمة السكينة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. DAILY QIYAM & TAHAJJUD LOGGING CARD */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                تسجيل صلاة القيام والتهجد لليوم
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                وثق ركعاتك، مستوى الخشوع، والآيات التي تلوتها في خلوة الليل
              </p>
            </div>
          </div>

          <div className="text-left">
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-black bg-amber-50 dark:bg-amber-950/50 px-2 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
              {toArabicNumbers(qiyamDaysCount)} ليلة في الشهر 🌙
            </span>
          </div>
        </div>

        {/* Qiyam & Witr Rakahs Counter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Qiyam Rakahs */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-50/80 to-purple-50/40 dark:from-indigo-950/30 dark:to-purple-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                عدد ركعات القيام والتهجد:
              </span>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {toArabicNumbers(qiyamRakahs)} ركعة
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1 pt-1">
              {[2, 4, 6, 8, 10].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setQiyamRakahs(r)}
                  className={`py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                    qiyamRakahs === r
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-indigo-100 dark:border-indigo-900/50'
                  }`}
                >
                  {toArabicNumbers(r)}
                </button>
              ))}
            </div>
          </div>

          {/* Witr Rakahs */}
          <div className="p-3.5 bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-amber-900 dark:text-amber-200">
                صلاة الشفع والوتر:
              </span>
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                {toArabicNumbers(witrRakahs)} ركعات
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {[1, 3, 5].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setWitrRakahs(r)}
                  className={`py-1.5 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                    witrRakahs === r
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-amber-100 dark:border-amber-900/50'
                  }`}
                >
                  {toArabicNumbers(r)} {r === 1 ? 'وتر' : 'ركعات'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Khushu Rating Stars Selector */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>تقييم الخشوع وحضور القلب في الصلاة:</span>
            </span>
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {toArabicNumbers(khushuRating)} / ٥
            </span>
          </div>

          <div className="flex items-center justify-center gap-3 py-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setKhushuRating(star)}
                className="p-1 text-2xl transition-all transform hover:scale-125 cursor-pointer active:scale-95"
                title={`مستوى خشوع ${star}`}
              >
                {star <= khushuRating ? '⭐' : '☆'}
              </button>
            ))}
          </div>
        </div>

        {/* Surahs & Notes Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black block">السور والآيات التي تلوتها:</label>
            <input
              type="text"
              value={surahsRead}
              onChange={e => setSurahsRead(e.target.value)}
              placeholder="مثال: سورة البقرة، يٰس، الملك..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-black block">خواطر ومناجاة خلوة الليل:</label>
            <input
              type="text"
              value={personalNotes}
              onChange={e => setPersonalNotes(e.target.value)}
              placeholder="دعوات خاصة، استغفار، شكر..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={() => handleSaveQiyam(qiyamRakahs, witrRakahs)}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>حفظ سجل القيام والخشوع لليوم</span>
        </button>
      </div>

      {/* 4. KHUSHU' STEP-BY-STEP GUIDELINES & CHECKLIST */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                دليل تحقيق الخشوع وحضور القلب في الصلاة
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                خطوات وأسباب الخشوع المأثورة عن السلف الصالح لتذوق حلاوة الصلاة
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            {toArabicNumbers(completedKhushuSteps.size)} / {toArabicNumbers(KHUSHU_STEPS.length)}
          </span>
        </div>

        {/* Khushu Steps Checklist */}
        <div className="space-y-2">
          {KHUSHU_STEPS.map((step, idx) => {
            const isDone = completedKhushuSteps.has(step.id);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleKhushuStep(step.id)}
                className={`w-full p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-start gap-3 ${
                  isDone
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200'
                    : 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-400 font-mono">
                      {toArabicNumbers(idx + 1)}.
                    </span>
                    <h4 className={`text-xs font-black ${isDone ? 'line-through opacity-80 text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                    {step.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. QIYAM & TAHAJJUD SUPPLICATIONS (أدعية ومناجاة التهجد) */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              أدعية ومناجاة قيام الليل والوتر والأسحار
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              الأدعية المأثورة للتهجد والقنوت والاستغفار في السحر
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {QIYAM_DUAS.map((dua) => {
            const isCopied = copiedDuaId === dua.id;
            return (
              <div 
                key={dua.id}
                className="p-4 bg-gradient-to-br from-slate-50/90 to-indigo-50/30 dark:from-slate-900/60 dark:to-indigo-950/20 rounded-2xl border border-slate-100 dark:border-slate-800/70 space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-2">
                  <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                    {dua.title}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopyDua(dua.id, dua.arabic)}
                    className="py-1 px-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-600 font-black">تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>نسخ الدعاء</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 leading-relaxed font-serif py-1">
                  «{dua.arabic}»
                </p>

                <span className="text-[9.5px] text-slate-400 font-bold block">
                  المصدر: {dua.source}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. TAHAJJUD PLAN GENERATOR & ROUTINE SELECTOR */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              مولّد جدول وبرنامج التهجد حسب الوقت المتاح
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              اختر الوقت المتاح لديك ليعرض لك التطبيق برنامجاً عملياً متكاملاً
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {QIYAM_PLANS.map((plan) => (
            <div
              key={plan.id}
              className="p-4 bg-slate-50/80 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 flex flex-col justify-between hover:border-purple-500/40 transition-all"
            >
              <div className="space-y-1.5">
                <span className="text-xs font-black text-purple-900 dark:text-purple-300 block">
                  {plan.title}
                </span>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
                  {plan.desc}
                </p>

                <div className="pt-2 space-y-1.5 border-t border-slate-200/50 dark:border-slate-800/50">
                  {plan.steps.map((st, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      <span className="text-purple-600 dark:text-purple-400 font-mono">•</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLogSuccessMsg(`تم اختيار ${plan.title}! استعن بالله وتبتل في محرابك.`);
                }}
                className="w-full mt-3 py-1.5 px-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-black transition-all cursor-pointer border border-purple-500/20 text-center"
              >
                اعتماد هذه الخطة ⚡
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 7. QIYAM HADITHS & VIRTUES */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <Award className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              درر وفضائل قيام الليل من السنة النبوية
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              أحاديث نبوية شريفة تحث على قيام الليل وتبين منازله العالية
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {QIYAM_HADITHS.map((h) => (
            <div
              key={h.id}
              className="p-4 bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="inline-block text-[9.5px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded-lg border border-amber-300/40">
                  {h.tag}
                </span>
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 leading-relaxed font-serif">
                  {h.text}
                </p>
              </div>

              <span className="text-[9.5px] text-slate-400 font-bold block pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                المصدر: {h.source}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. QURAN VERSES TARGETS (10, 100, 1000 VERSES) */}
      <div className="bg-gradient-to-br from-[#111827] via-[#1a2234] to-[#251b3a] rounded-3xl p-5 text-white border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-700/60 pb-3">
          <Zap className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-black text-white">
              مراتب القائمين وورِد الآيات في الليل
            </h3>
            <p className="text-[10px] text-slate-300 font-semibold">
              مقترحات السور لتحقيق فضائل «القانتين» و«المقنطرين»
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <span className="text-xs font-black text-emerald-300 block">
              ١. ألا تُكتب من الغافلين (١٠ آيات)
            </span>
            <p className="text-[10.5px] text-slate-300 font-bold leading-normal">
              قراءة آية الكرسي + سورة الإخلاص والمعوذتين، أو سورة الفاتحة والكوثر والنصر.
            </p>
          </div>

          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <span className="text-xs font-black text-amber-300 block">
              ٢. أن تُكتب من القانتين (١٠٠ آية)
            </span>
            <p className="text-[10.5px] text-slate-300 font-bold leading-normal">
              قراءة سورة الملك (٣٠ آية) + سورة الواقعة (٩٦ آية) = ١٢٦ آية تكتب بها من القانتين!
            </p>
          </div>

          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-1.5">
            <span className="text-xs font-black text-purple-300 block">
              ٣. أن تُكتب من المقنطرين (١٠٠٠ آية)
            </span>
            <p className="text-[10.5px] text-slate-300 font-bold leading-normal">
              قراءة جزء تبارك وجزء عمّ كاملين، أو من سورة تبارك إلى نهاية القرآن الكريـم.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
