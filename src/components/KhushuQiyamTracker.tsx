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
  RotateCcw,
  Play,
  Pause,
  X,
  Maximize2,
  Bookmark,
  Share2,
  Filter
} from 'lucide-react';
import { AppSettings, PrayerLog } from '../types';
import { calculatePrayerTimes, parseTimeToMinutes } from '../utils/prayerCalc';
import { toArabicNumbers, getHijriDate } from '../utils/hijri';
import { trackFeatureCompletion } from '../utils/analyticsStorage';
import { safeSetItem } from '../utils/storage';

interface KhushuQiyamTrackerProps {
  settings: AppSettings;
  prayerLogs: Record<string, Record<string, PrayerLog>>;
  setPrayerLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, PrayerLog>>>>;
  onNavigateTab?: (tab: string) => void;
}

interface QiyamJournalEntry {
  date: string;
  hijriDate: string;
  rakahs: number;
  witrRakahs: number;
  rating: number;
  surahs: string;
  notes: string;
}

const KHUSHU_STEPS = [
  {
    id: 'wudu',
    title: 'إسباغ الوضوء والدعاء بعده',
    desc: 'الوضوء بتمهل مع استحضار تساقط الذنوب مع قطرات الماء، وقراءة الذكر المأثور بعده.',
    category: 'preparation',
    tip: 'عن النبي ﷺ: «من توضأ فأحسن الوضوء خرجت خطايا جَسَدِهِ حَتَّى تَخْرُجَ مِنْ تَحْتِ أَظْفَارِهِ».'
  },
  {
    id: 'mindset',
    title: 'تفريغ الذهن وقطع المشتتات',
    desc: 'إغلاق الهاتف والشواغل، واستحضار عظمة الوقوف بين يدي الخالق جل وعلا.',
    category: 'preparation',
    tip: 'تذكر أن الصلاة مناجاة خاصة بينك وبين الله، فاستحضر حياء القرب وطمأنينة الإقبال.'
  },
  {
    id: 'gaze',
    title: 'حصر النظر في موضع السجود',
    desc: 'تجنب الالتفات بالبصر أو الذهن، وتركيز العينين على مكان سجودك فقط.',
    category: 'during',
    tip: 'الالتفات في الصلاة اختلاس يختلسه الشيطان من صلاة العبد، فحافظ على جمع بصرك.'
  },
  {
    id: 'tranquility',
    title: 'الطَّمَأْنِينَة الكاملة في الأركان',
    desc: 'أن يرجع كل عظم إلى موضعه في الركوع والرفع والسجود دون عجلة أو نقر.',
    category: 'during',
    tip: 'قال ﷺ للمسيء صلاته: «ارْجِعْ فَصَلِّ فَإِنَّكَ لَمْ تُصَلِّ»، فالطمأنينة ركن أساسي لصحة الصلاة.'
  },
  {
    id: 'tadabbur',
    title: 'ترتيل القرآن وتدبُّر معانيه',
    desc: 'القراءة بتمهل (ورادداً مع الآيات) والاستعاذة عند آيات العذاب والمسألة عند الرحمة.',
    category: 'during',
    tip: 'كان النبي ﷺ إذا مر بآية فيها تسبيح سبَّح، وإذا مر بسؤال سأل، وإذا مر بتعوذ تعوَّذ.'
  },
  {
    id: 'shaitan_refuge',
    title: 'الاستعاذة عند هجوم الوسواس',
    desc: 'إذا هاجمك وسواس الصلاة (خنزب)، اتفل عن يسارك ثلاثاً واستعذ بالله بثبات.',
    category: 'during',
    tip: 'عثمان بن أبي العاص شكا للشيطان بالصلاة، فقال ﷺ: «ذاك شيطان يقال له خنزب، فإذا أحسسته فتعوذ بالله منه واتفل عن يسارك ثلاثاً».'
  },
  {
    id: 'sujood_munajat',
    title: 'الإطالة في السجود والمناجاة',
    desc: 'أقرب ما يكون العبد من ربه وهو ساجد؛ فأكثروا فيه من الدعاء والابتهال.',
    category: 'post',
    tip: 'سل الله حاجتك في سجودك وأنت موقن بالإجابة، واستشعر قُربه القريب منك.'
  }
];

const QIYAM_RECOMMENDED_SURAHS = [
  {
    id: 'mulk',
    name: 'سورة الملك',
    verses: 30,
    virtue: 'المنجية من عذاب القبر، تُشفع لصاحبها حتى يُغفر له.',
    recommendation: 'يُستحب قراءتها قبل النوم وفي ركعات القيام.'
  },
  {
    id: 'waqiah',
    name: 'سورة الواقعة',
    verses: 96,
    virtue: 'سورة الغنى والبركة، تنفي الفقر وتذكر بيوم القيامة.',
    recommendation: 'تمنح القلب يقين الخشوع وتكتب بها من القانتين عند ضمها لأخرى.'
  },
  {
    id: 'yasin',
    name: 'سورة يٰس',
    verses: 83,
    virtue: 'قلب القرآن الكريـم، يقرأ بها لغفران الذنوب وتيسير الأمور.',
    recommendation: 'ممتازة لركعات القيام الطويلة بتدبر وتأنٍّ.'
  },
  {
    id: 'muzzammil',
    name: 'سورة المزمل',
    verses: 20,
    virtue: 'سورة قيام الليل والتبتل، فيها أمر الله لنبيه بالقيام: ﴿قُمِ اللَّيْلَ إِلَّا قَلِيلًا﴾.',
    recommendation: 'توقظ في الروح محبة الخلوة بالله ومناجاته.'
  },
  {
    id: 'sajdah',
    name: 'سورة السجدة',
    verses: 30,
    virtue: 'كان النبي ﷺ لا ينام حتى يقرأ ألم تنزيل السجدة وتبارك.',
    recommendation: 'تتضمن سجَدة تلاوة تزيد العبد خضوعاً وخشوعاً.'
  }
];

const QIYAM_DUAS = [
  {
    id: 'istiftah_qiyam',
    title: 'دعاء الاستفتاح في قيام الليل',
    category: 'istiftah',
    arabic: 'اللَّهُمَّ لَكَ الْحَمْدُ أَنْتَ نُورُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الْحَمْدُ أَنْتَ قَيِّمُ السَّمَاوَاتِ وَالأَرْضِ وَمَنْ فِيهِنَّ، وَلَكَ الْحَمْدُ أَنْتَ الْحَقُّ وَوَعْدُكَ الْحَقُّ، وَلِقَاؤُكَ حَقٌّ، وَالْجَنَّةُ حَقٌّ، وَالنَّارُ حَقٌّ، وَالنَّبِيُّونَ حَقٌّ، وَمُحَمَّدٌ ﷺ حَقٌّ، وَالسَّاعَةُ حَقٌّ...',
    source: 'صحيح البخاري ومسلم - عن ابن عباس رضي الله عنهما'
  },
  {
    id: 'qunut_witr',
    title: 'دعاء القنوت المأثور في صلاة الوتر',
    category: 'qunut',
    arabic: 'اللَّهُمَّ اهْدِنِي فِيمَنْ هَدَيْتَ، وَعَافِنِي فِيمَنْ عَافَيْتَ، وَتَوَلَّنِي فِيمَنْ تَوَلَّيْتَ، وَبَارِكْ لِي فِيمَا أَعْطَيْتَ، وَقِنِي شَرَّ مَا قَضَيْتَ، فَإِنَّكَ تَقْضِي وَلا يُقْضَى عَلَيْكَ، إِنَّهُ لا يَذِلُّ مَنْ وَالَيْتَ، وَلا يَعِزُّ مَنْ عَادَيْتَ، تَبَارَكْتَ رَبَّنَا وَتَعَالَيْتَ.',
    source: 'سنن أَبِي داود والترمذي - تعليم النبي ﷺ للحسن بن علي'
  },
  {
    id: 'suhoor_istighfar',
    title: 'أذكار واستغفار الأسحار (قبل الفجر)',
    category: 'istighfar',
    arabic: 'أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ (وَبِالأَسْحَارِ هُمْ يَسْتَغْفِرُونَ).',
    source: 'القرآن الكريم - سورة الذاريات'
  },
  {
    id: 'sayyid_istighfar',
    title: 'سيد الاستغفار المبارك',
    category: 'istighfar',
    arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ.',
    source: 'صحيح البخاري'
  },
  {
    id: 'munajat_night',
    title: 'مناجاة الثلث الأخير من الليل',
    category: 'munajat',
    arabic: 'يَا رَبِّ، هَا أَنَا ذَا بَيْنَ يَدَيْكَ، عَبْدُكَ الْفَقِيرُ إِلَى رَحْمَتِكَ، أَتَيْتُكَ فِي ظُلْمَةِ اللَّيْلِ أَرْجُو نُورَ هِدَايَتِكَ، اللَّهُمَّ هَبْ لِي قَلْبًا خَاشِعًا، وَلِسَانًا ذَاكِرًا، وَيَقِينًا صَادِقًا، وَتَوْبَةً نَصُوحًا قَبْلَ الْمَوْتِ.',
    source: 'من دعاء الصالحين في خلوة الليل'
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [copiedDuaId, setCopiedDuaId] = useState<string | null>(null);
  const [logSuccessMsg, setLogSuccessMsg] = useState<string>('');

  // Live Focus Mode State (وضع الخلوة الحية)
  const [isFocusModeActive, setIsFocusModeActive] = useState<boolean>(false);
  const [liveRakahCounter, setLiveRakahCounter] = useState<number>(2);
  const [selectedFocusDua, setSelectedFocusDua] = useState<string>(QIYAM_DUAS[1].arabic);

  // Khushu Step Category Filter
  const [stepCategoryFilter, setStepCategoryFilter] = useState<'all' | 'preparation' | 'during' | 'post'>('all');
  const [selectedStepDetail, setSelectedStepDetail] = useState<typeof KHUSHU_STEPS[0] | null>(null);

  // Supplication Category Filter
  const [duaCategoryFilter, setDuaCategoryFilter] = useState<'all' | 'istiftah' | 'qunut' | 'istighfar' | 'munajat'>('all');

  // Ambient background audio generator state
  const [activeAmbient, setActiveAmbient] = useState<'none' | 'rain' | 'breeze' | 'stream'>('none');
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stopAmbientAudio = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setActiveAmbient('none');
  };

  const playAmbientAudio = (type: 'rain' | 'breeze' | 'stream') => {
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
      masterGain.gain.value = type === 'stream' ? 0.05 : 0.08;
      masterGain.connect(ctx.destination);

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
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 700;
      } else if (type === 'breeze') {
        filter.type = 'bandpass';
        filter.frequency.value = 350;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 450;
      }

      whiteNoise.connect(filter);
      filter.connect(masterGain);
      whiteNoise.start();

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
    
    const nightDurationMins = (1440 - maghribMins) + fajrMins;
    const thirdMins = Math.floor(nightDurationMins / 3);
    const halfMins = Math.floor(nightDurationMins / 2);

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

    const currentMinsNow = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    let isCurrentlyInLastThird = false;
    const lastThirdAbsMins = lastThirdStartMinsFromMaghrib;
    if (lastThirdAbsMins > maghribMins) {
      if (currentMinsNow >= lastThirdAbsMins || currentMinsNow < fajrMins) {
        isCurrentlyInLastThird = true;
      }
    } else {
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

  // Saved Qiyam Journal History
  const [qiyamJournalHistory, setQiyamJournalHistory] = useState<QiyamJournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem('qiyam_journal_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const getCurrentPrayerName = () => {
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const fajr = parseTimeToMinutes(todayTimes.Fajr || '04:30');
    const dhuhr = parseTimeToMinutes(todayTimes.Dhuhr || '12:00');
    const asr = parseTimeToMinutes(todayTimes.Asr || '15:30');
    const maghrib = parseTimeToMinutes(todayTimes.Maghrib || '18:00');
    const isha = parseTimeToMinutes(todayTimes.Isha || '19:30');

    if (currentMins >= fajr && currentMins < dhuhr) return 'Fajr';
    if (currentMins >= dhuhr && currentMins < asr) return 'Dhuhr';
    if (currentMins >= asr && currentMins < maghrib) return 'Asr';
    if (currentMins >= maghrib && currentMins < isha) return 'Maghrib';
    return 'Isha';
  };

  const [khushuResetMode, setKhushuResetMode] = useState<'daily' | 'prayer'>(() => {
    return (localStorage.getItem('khushu_reset_mode') as 'daily' | 'prayer') || 'prayer';
  });

  const currentPrayerName = getCurrentPrayerName();
  const currentKhushuKey = khushuResetMode === 'prayer' 
    ? `khushu_steps_${todayStr}_${currentPrayerName}`
    : `khushu_steps_${todayStr}`;

  // Completed Khushu checklist
  const [completedKhushuSteps, setCompletedKhushuSteps] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(currentKhushuKey);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(currentKhushuKey);
      setCompletedKhushuSteps(saved ? new Set(JSON.parse(saved)) : new Set());
    } catch {
      setCompletedKhushuSteps(new Set());
    }
  }, [currentKhushuKey]);

  const toggleKhushuStep = (id: string) => {
    setCompletedKhushuSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (navigator.vibrate) navigator.vibrate(20);
      }
      safeSetItem(currentKhushuKey, JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const handleResetKhushuSteps = () => {
    setCompletedKhushuSteps(new Set());
    localStorage.removeItem(currentKhushuKey);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleModeChange = (mode: 'daily' | 'prayer') => {
    setKhushuResetMode(mode);
    safeSetItem('khushu_reset_mode', mode);
  };

  // Handle saving Qiyam log
  const handleSaveQiyam = (qRakahs: number, wRakahs: number) => {
    setQiyamRakahs(qRakahs);
    setWitrRakahs(wRakahs);

    const updatedQiyamStatus = qRakahs > 0 ? 'A' : 'not_yet';
    const updatedWitrStatus = wRakahs > 0 ? 'A' : 'not_yet';

    if (qRakahs > 0 || wRakahs > 0) {
      trackFeatureCompletion('khushu');
    }

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

    safeSetItem(`khushu_rating_${todayStr}`, khushuRating.toString());
    safeSetItem(`qiyam_surahs_${todayStr}`, surahsRead);
    safeSetItem(`qiyam_notes_${todayStr}`, personalNotes);

    // Save to journal history
    if (qRakahs > 0 || wRakahs > 0 || personalNotes.trim()) {
      const newEntry: QiyamJournalEntry = {
        date: todayStr,
        hijriDate: hijri.fullString,
        rakahs: qRakahs,
        witrRakahs: wRakahs,
        rating: khushuRating,
        surahs: surahsRead,
        notes: personalNotes
      };
      const updatedHistory = [newEntry, ...qiyamJournalHistory.filter(e => e.date !== todayStr)].slice(0, 30);
      setQiyamJournalHistory(updatedHistory);
      safeSetItem('qiyam_journal_history', JSON.stringify(updatedHistory));
    }

    setLogSuccessMsg(`تم حفظ صلاة قيام الليل (${toArabicNumbers(qRakahs)} ركعات) والوتر (${toArabicNumbers(wRakahs)} ركعات) بنجاح! تقبل الله.`);
    setTimeout(() => setLogSuccessMsg(''), 4000);
  };

  const handleCopyDua = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDuaId(id);
    setTimeout(() => setCopiedDuaId(null), 2500);
  };

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
      safeSetItem('salah_custom_alarms', JSON.stringify(next));

      setLogSuccessMsg(`تم إضافة ${newAlarm.title} الساعة (${toArabicNumbers(timeStr)}) بنجاح! ⏰`);
      if (onNavigateTab) {
        setTimeout(() => onNavigateTab('alarms'), 1200);
      }
    } catch (e) {
      console.error(e);
    }
  };

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

  const filteredSteps = stepCategoryFilter === 'all' 
    ? KHUSHU_STEPS 
    : KHUSHU_STEPS.filter(s => s.category === stepCategoryFilter);

  const filteredDuas = duaCategoryFilter === 'all'
    ? QIYAM_DUAS
    : QIYAM_DUAS.filter(d => d.category === duaCategoryFilter);

  return (
    <div className="space-y-6 text-end pb-12 animate-fade-in" dir="rtl">
      
      {/* 1. HERO BANNER & LIVE FOCUS MODE TRIGGER */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c121e] via-[#151c2d] to-[#1f1636] p-6 text-white border border-indigo-500/30 shadow-xl">
        <div className="absolute top-0 end-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
                <Moon className="w-7 h-7 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>الخشوع وقيام الليل والتهجد</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    شرف المؤمن 🌙
                  </span>
                </h2>
                <p className="text-[11px] text-slate-300 font-medium">
                  حاسبة ثلث الليل الآخر، وضع الخلوة والتركيز المباشر، ودليل الخشوع والمناجاة
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFocusModeActive(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-amber-400/30"
              >
                <Maximize2 className="w-4 h-4 text-amber-200" />
                <span>وضع الخلوة والتهجد الحية ✨</span>
              </button>

              <div className="text-start font-mono bg-white/5 px-3 py-1.5 rounded-2xl border border-white/10 hidden sm:block">
                <span className="text-xs text-indigo-300 font-bold block">{hijri.fullString}</span>
                <span className="text-[10px] text-slate-400 font-bold">{toArabicNumbers(todayStr)}</span>
              </div>
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

      {/* FULLSCREEN LIVE FOCUS MODE MODAL (وضع الخلوة الحية والمناجاة) */}
      {isFocusModeActive && (
        <div className="fixed inset-0 z-50 bg-[#080d1a]/95 backdrop-blur-xl text-white p-4 sm:p-8 flex flex-col justify-between overflow-y-auto animate-fade-in" dir="rtl">
          {/* Focus Mode Top Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              <h3 className="text-base font-black text-amber-200">وضع الخلوة المتبتلة والتهجد المباشر</h3>
            </div>

            <button
              type="button"
              onClick={() => setIsFocusModeActive(false)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all cursor-pointer"
              title="إغلاق وضع الخلوة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Focus Mode Central Content */}
          <div className="my-auto max-w-2xl mx-auto w-full space-y-6 py-6 text-center">
            {/* Pulsing Breathing Circle */}
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping duration-1000 pointer-events-none" />
              <div className="absolute inset-2 bg-purple-500/30 rounded-full blur-md pointer-events-none" />
              <div className="relative z-10 w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-900 to-purple-800 border-2 border-indigo-400/50 flex flex-col items-center justify-center space-y-1 shadow-2xl">
                <Moon className="w-8 h-8 text-amber-300" />
                <span className="text-xs font-black text-indigo-100">بَيْنَ يَدَيِ اللَّهِ</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-black text-amber-100">«واستشعر قرب السميع العليم في خلوتك»</h4>
              <p className="text-xs text-slate-300 font-medium max-w-md mx-auto leading-relaxed">
                فرّغ قلبك من الشواغل، وصَلِّ ركعتين خفيفتين افتتاحاً ثم تبتل في محرابك مثنى مثنى.
              </p>
            </div>

            {/* Live Rakah Counter */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-3xl max-w-md mx-auto space-y-3">
              <span className="text-xs font-extrabold text-indigo-300 block">عدّاد ركعات التهجد الحالية:</span>
              <div className="flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setLiveRakahCounter(prev => Math.max(0, prev - 2))}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black transition-all active:scale-95 cursor-pointer"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-3xl font-black text-amber-300 font-mono">
                  {toArabicNumbers(liveRakahCounter)} ركعة
                </span>
                <button
                  type="button"
                  onClick={() => setLiveRakahCounter(prev => prev + 2)}
                  className="p-3 bg-amber-500 hover:bg-amber-600 rounded-2xl text-white font-black transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">صلاة الليل مثنى مثنى (ركعتان ركعتان)</p>
            </div>

            {/* Live Supplication Selection Box */}
            <div className="p-4 bg-indigo-950/60 border border-indigo-500/30 rounded-3xl text-end space-y-2">
              <span className="text-xs font-black text-indigo-300 block text-center">دعاء ومناجاة حية للمحراب:</span>
              <p className="text-sm font-black text-amber-100 leading-relaxed font-serif text-center py-2">
                «{selectedFocusDua}»
              </p>
              <div className="flex justify-center gap-2 flex-wrap pt-2">
                {QIYAM_DUAS.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedFocusDua(d.arabic)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-[10px] font-bold rounded-xl border border-white/10 text-slate-200 transition-all cursor-pointer"
                  >
                    {d.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Ambient Sound Toggles in Focus Mode */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => playAmbientAudio('rain')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeAmbient === 'rain' ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                🌧️ مطر خفيف
              </button>
              <button
                type="button"
                onClick={() => playAmbientAudio('breeze')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activeAmbient === 'breeze' ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-300'
                }`}
              >
                🍃 نسيم السحر
              </button>
            </div>
          </div>

          {/* Focus Mode Bottom Bar */}
          <div className="border-t border-white/10 pt-4 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold">
              تقبل الله طاعتك وقيامك 🌿
            </span>
            <button
              type="button"
              onClick={() => {
                handleSaveQiyam(liveRakahCounter, witrRakahs || 1);
                setIsFocusModeActive(false);
              }}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer transition-all active:scale-95"
            >
              حفظ ونقل لركعات اليوم ({toArabicNumbers(liveRakahCounter)} ركعة)
            </button>
          </div>
        </div>
      )}

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

        {/* Ambient Background Audio Controls */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>صوتيات خفيفة لخشوع التهجد (بدون إنترنت):</span>
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
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
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
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                activeAmbient === 'breeze'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              <span>🍃 نسيم السحر</span>
            </button>

            <button
              type="button"
              onClick={() => playAmbientAudio('stream')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1 ${
                activeAmbient === 'stream'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-teal-400'
              }`}
            >
              <span>جداول الماء</span>
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

          <div className="text-start">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Auto-reset Mode Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700/50 text-[10px]">
              <button
                type="button"
                onClick={() => handleModeChange('prayer')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  khushuResetMode === 'prayer'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                تصفير كل صلاة
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('daily')}
                className={`px-2 py-0.5 rounded-lg font-bold transition-all cursor-pointer ${
                  khushuResetMode === 'daily'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                تصفير يومي
              </button>
            </div>

            {/* Steps Counter */}
            <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              {toArabicNumbers(completedKhushuSteps.size)} / {toArabicNumbers(KHUSHU_STEPS.length)}
            </span>

            {/* Manual Reset button */}
            <button
              type="button"
              onClick={handleResetKhushuSteps}
              title="تصفير القائمة الآن"
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-500 rounded-xl text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>تصفير</span>
            </button>
          </div>
        </div>

        {/* Step Categories Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setStepCategoryFilter('all')}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              stepCategoryFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            جميع الخطوات ({toArabicNumbers(KHUSHU_STEPS.length)})
          </button>
          <button
            type="button"
            onClick={() => setStepCategoryFilter('preparation')}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              stepCategoryFilter === 'preparation'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            قبل الصلاة (التهيئة)
          </button>
          <button
            type="button"
            onClick={() => setStepCategoryFilter('during')}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              stepCategoryFilter === 'during'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            أثناء الصلاة (الحضور)
          </button>
          <button
            type="button"
            onClick={() => setStepCategoryFilter('post')}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
              stepCategoryFilter === 'post'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            بعد الصلاة (المناجاة)
          </button>
        </div>

        {/* Khushu Steps Checklist */}
        <div className="space-y-2">
          {filteredSteps.map((step) => {
            const isDone = completedKhushuSteps.has(step.id);
            return (
              <div
                key={step.id}
                className={`p-3.5 rounded-2xl border text-end transition-all space-y-2 ${
                  isDone
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200'
                    : 'bg-slate-50/60 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleKhushuStep(step.id)}
                    className="flex items-start gap-2.5 flex-1 cursor-pointer text-end"
                  >
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <h4 className={`text-xs font-black ${isDone ? 'line-through opacity-80 text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-white'}`}>
                        {step.title}
                      </h4>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-normal">
                        {step.desc}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStepDetail(selectedStepDetail?.id === step.id ? null : step)}
                    className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg text-[10px] font-extrabold shrink-0 cursor-pointer"
                  >
                    {selectedStepDetail?.id === step.id ? 'إخفاء الفائدة' : 'فائدة نبوية 💡'}
                  </button>
                </div>

                {selectedStepDetail?.id === step.id && (
                  <div className="p-3 bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs text-indigo-950 dark:text-indigo-200 font-medium leading-relaxed animate-fade-in">
                    <span className="font-black block text-indigo-700 dark:text-indigo-300 mb-0.5">💡 أصل السنة والدليل:</span>
                    {step.tip}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. RECOMMENDED SURAHS FOR QIYAM (سور مستحبة لقيام الليل) */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white">
              سور وآيات كريمة لقيام الليل وتلاوة المحراب
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
              مقترحات للسور المباركة التي يورث تدبرها الخشوع والطمأنينة في القيام
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {QIYAM_RECOMMENDED_SURAHS.map((surah) => (
            <div
              key={surah.id}
              className="p-4 bg-gradient-to-br from-indigo-50/60 via-purple-50/30 to-slate-50/80 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 dark:text-indigo-200">
                    {surah.name}
                  </span>
                  <span className="text-[10px] font-mono font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-lg">
                    {toArabicNumbers(surah.verses)} آية
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                  {surah.virtue}
                </p>
              </div>

              <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30 flex items-center justify-between">
                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium">
                  {surah.recommendation}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSurahsRead(prev => prev ? `${prev}، ${surah.name}` : surah.name);
                    setLogSuccessMsg(`تم إدراج ${surah.name} في قائمة تلاوتك لليوم!`);
                  }}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-all shrink-0 active:scale-95"
                >
                  إضافة للتلاوة +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. QIYAM & TAHAJJUD SUPPLICATIONS (أدعية ومناجاة التهجد) */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-white">
                أدعية ومناجاة قيام الليل والوتر والأسحار
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                الأدعية المأثورة للتهجد والقنوت والاستغفار في السحر
              </p>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setDuaCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                duaCategoryFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setDuaCategoryFilter('istiftah')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                duaCategoryFilter === 'istiftah'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              الاستفتاح
            </button>
            <button
              type="button"
              onClick={() => setDuaCategoryFilter('qunut')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                duaCategoryFilter === 'qunut'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              القنوت
            </button>
            <button
              type="button"
              onClick={() => setDuaCategoryFilter('istighfar')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                duaCategoryFilter === 'istighfar'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              الاستغفار
            </button>
            <button
              type="button"
              onClick={() => setDuaCategoryFilter('munajat')}
              className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0 ${
                duaCategoryFilter === 'munajat'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              المناجاة
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredDuas.map((dua) => {
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
                    className="py-1 px-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
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

      {/* 7. TAHAJJUD PLAN GENERATOR & ROUTINE SELECTOR */}
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
                className="w-full mt-3 py-1.5 px-3 bg-purple-600/10 hover:bg-purple-600/20 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-black transition-all cursor-pointer border border-purple-500/20 text-center active:scale-95"
              >
                اعتماد هذه الخطة ⚡
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 8. QIYAM JOURNAL HISTORY (سجل وخواطر القيام السابقة) */}
      {qiyamJournalHistory.length > 0 && (
        <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">
                  سجل الخواطر والمناجاة في قيام الليل
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                  مراجعة سجلك وخواطرك الإيمانية في الخلوات السابقة
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl">
              {toArabicNumbers(qiyamJournalHistory.length)} ليلة موثقة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {qiyamJournalHistory.slice(0, 6).map((entry, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5">
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">{toArabicNumbers(entry.date)}</span>
                  <span className="text-amber-500 font-black">{'⭐'.repeat(entry.rating)}</span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  <span>قيام: {toArabicNumbers(entry.rakahs)} ركعة</span>
                  <span>وتر: {toArabicNumbers(entry.witrRakahs)} ركعة</span>
                </div>

                {entry.surahs && (
                  <p className="text-[10.5px] font-bold text-indigo-700 dark:text-indigo-300">
                    التلاوة: {entry.surahs}
                  </p>
                )}

                {entry.notes && (
                  <p className="text-[11px] font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                    «{entry.notes}»
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. QIYAM HADITHS & VIRTUES */}
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

      {/* 10. QURAN VERSES TARGETS (10, 100, 1000 VERSES) */}
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
