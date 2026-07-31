import React, { useState } from 'react';
import { 
  Moon, 
  Sun, 
  Calendar, 
  Sparkles, 
  Info, 
  Eye, 
  Compass, 
  BookOpen, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Clock, 
  Bell, 
  Award, 
  Flame,
  ArrowRight
} from 'lucide-react';

interface MoonPhasesProps {
  now?: Date;
  hijriDay?: number;
  hijriMonthName?: string;
  hijriYear?: number;
  cityName?: string;
  toArabicNumbers: (val: any) => string;
  onNavigateTab?: (tab: string) => void;
}

// 28 Lunar Mansions (منازل القمر) Data
export interface LunarMansion {
  id: number;
  name: string;
  transliteration: string;
  stars: string;
  meaning: string;
  heritageNote: string;
  poetry: string;
  poet: string;
  season: string;
}

export const LUNAR_MANSIONS: LunarMansion[] = [
  {
    id: 1,
    name: "الشَّرَطَيْن",
    transliteration: "Al-Sharatan",
    stars: "قرنا الحمل (الحمل)",
    meaning: "أول منازل القمر، وسميت بذلك لأنها علامة ابتداء السنة الشمسية والتغير الفلكي.",
    heritageNote: "كانت العرب تستدل بها على أول الربيع وإقبال الخير والخصب.",
    poetry: "إِذَا الشَّرَطَانِ اصْطَفَّ نَجْمُهُمَا بَدَا *** شُعَاعُ الهِلاَلِ المُرْتَجَى فِي المَشَارِقِ",
    poet: "التراث القديم",
    season: "الربيع"
  },
  {
    id: 2,
    name: "البُطَيْن",
    transliteration: "Al-Butayn",
    stars: "ثلاثة كواكب خفية في بطن الحمل",
    meaning: "تصغير بطن، وهي من المنازل الخفية اليمانية.",
    heritageNote: "قيل عنها: إذا طلع البطين، اقتُضي الدين، وظهرت الزينة في العالمين.",
    poetry: "وَبُطَيْنُ نَجْمٍ فِي السَّمَاءِ مُشَعْشِعٌ *** يَهْدِي السُّرَاةَ إِلاَى الطَّرِيقِ الأَعْظَمِ",
    poet: "الأعشى",
    season: "الربيع"
  },
  {
    id: 3,
    name: "الثُّرَيَّا",
    transliteration: "Al-Thurayya",
    stars: "عنقود الثريا في برج الثور",
    meaning: "أشهر المنازل عند العرب، وتسمى 'النجوم'، لغزارة بركتها وجمال منظرها.",
    heritageNote: "ورد ذكرها في الأحاديث والأشعار، ويستبشر العرب بطلوعها ورؤيتها.",
    poetry: "إِذَا المَرْءُ لَمْ يَطْلُبْ مَعَالِيَ هِمَّةٍ *** وَلَوْ جَاوَزَتْ نَجْمَ الثُّرَيَّا خَصَائِلُهْ",
    poet: "أبو تمام",
    season: "الربيع"
  },
  {
    id: 4,
    name: "الدَّبَرَان",
    transliteration: "Al-Dabaran",
    stars: "عين الثور (عين الثريا)",
    meaning: "سمي الدبران لأنه يدبر الثريا، أي يتبعها ويمشي خلفها في قبة السماء.",
    heritageNote: "نجم أحمر وقاد شديد الضياء يرى بالعين المجردة بوضوح.",
    poetry: "وَيَتْبَعُهَا الدَّبَرَانُ الفَرْدُ يَرْقُبُهَا *** كَأَنَّهُ خَادِمٌ يَرْعَى لَهَا الأَمَلَا",
    poet: "ابن المعتز",
    season: "الربيع"
  },
  {
    id: 5,
    name: "الهَقْعَة",
    transliteration: "Al-Haq'ah",
    stars: "رأس الجوزاء (أوريون)",
    meaning: "ثلاثة كواكب متقاربة تشبه الأثافي التي توضع عليها القدر.",
    heritageNote: "تنزل بها الشدة في الحر ويستظل الناس في كنها.",
    poetry: "وَمَنَازِلُ القَمَرِ المُنِيرِ كَأَنَّهَا *** عِقْدٌ مِنَ الدُّرِّ النَّفِيسِ المُنْتَظَمْ",
    poet: "البحترِي",
    season: "الصيف"
  },
  {
    id: 6,
    name: "الهَنْعَة",
    transliteration: "Al-Han'ah",
    stars: "كوكبان في برج التوأمين",
    meaning: "الهنعة هي المنعطف أو المنحنى، وكوكباها بين الجوزاء والسرطان.",
    heritageNote: "عند دخول القمر فيها يشتد الحر وتطيب ثمار النخيل.",
    poetry: "تَرَى الهَنْعَةَ الزَّهْرَاءِ فِي الغَسَقِ ابْتَهَجَتْ *** كَأَنَّ ضِيَاهَا سِرَاجٌ فِي صَفَا السَّحَرِ",
    poet: "الشريف الرضي",
    season: "الصيف"
  },
  {
    id: 7,
    name: "الذِّرَاع",
    transliteration: "Al-Dhira",
    stars: "ذراع الأسد المقبوضة",
    meaning: "كوكبان نيران متجاوران في برج التوأمين.",
    heritageNote: "تسمى الذراع المبسوطة، وكانت العرب تعدها من يمن المنازل.",
    poetry: "تَبَارَكَ مَنْ صَاغَ النُّجُومَ وَزَيَّنَا *** بِذِرَاعِهَا السَّامِي الفَضَاءَ الحَالِكَا",
    poet: "ابن الرومي",
    season: "الصيف"
  },
  {
    id: 8,
    name: "النَّثْرَة",
    transliteration: "Al-Nathrah",
    stars: "أنف الأسد ونثرته",
    meaning: "كوكبان وبينهما لطخة سحابية تشبه العطسة أو النثرة.",
    heritageNote: "من أبرد المنازل ليلاً وأطيبها نسماً عند هبوب الريح.",
    poetry: "وَالنَّثْرَةُ العَلْيَاءُ تَنْثُرُ نُورَهَا *** فَوْقَ الرُّبَى وَالأَبْطَحِ المَمْطُورِ",
    poet: "أبو فراس الحمداني",
    season: "الصيف"
  },
  {
    id: 9,
    name: "الطَّرْف",
    transliteration: "Al-Tarf",
    stars: "عَيْنَا الأسد",
    meaning: "كوكبان خفيان هما طرف عين الأسد.",
    heritageNote: "منزل من المنازل الصيفية الشريفة.",
    poetry: "وَطَرْفٌ مِنَ الأَفْلاَكِ يَرْنُو بِسِحْرِهِ *** كَأَنَّ عَلَيْهِ مِنْ سَنَا البَدْرِ مِعْصَمَا",
    poet: "ابن زيدون",
    season: "الصيف"
  },
  {
    id: 10,
    name: "الجَبْهَة",
    transliteration: "Al-Jabhah",
    stars: "جبهة الأسد (أربعة كواكب)",
    meaning: "منزل شريف عظيم، وهي جبهة الأسد الملكية.",
    heritageNote: "تعتبر من ألمع وأبها المنازل النجمية في قبة السماء.",
    poetry: "إِذَا طَلَعَتْ جَبْهَةُ الأَفْلاَكِ وَامْتَزَجَتْ *** بِسَاطُ سَناءٍ يَمْلأُ الآفَاقَا",
    poet: "المتنبي",
    season: "الخريف"
  },
  {
    id: 11,
    name: "الزُّبْرَة",
    transliteration: "Al-Zubrah",
    stars: "كاهل الأسد وشعره",
    meaning: "كوكبان مضيئان يمثلان زبرة الأسد.",
    heritageNote: "تسمى الخصاتين، ويتلطف عندها جو الليل.",
    poetry: "وَزُبْرَةُ لَيْلٍ تَنْجَلِي عَنْ صَبَاحِهَا *** كَمَا انْجَلَتِ الحَسْنَاءُ عَنْ خَدِّهَا النَّضِرْ",
    poet: "ابن هاني الأندلسي",
    season: "الخريف"
  },
  {
    id: 12,
    name: "الصَّرْفَة",
    transliteration: "Al-Sarfah",
    stars: "ذنب الأسد المفرد",
    meaning: "سميت الصرفة لانصراف الحر عند طلوعها وانصراف البرد عند سقوطها.",
    heritageNote: "تعد علامة تحول فصول السنة بين الحر والبرد.",
    poetry: "وَصَرْفَةُ نَجْمٍ يَنْصَرِيفُ لَهَا الصَّدَى *** وَيَبْدُو لِعَيْنِ النَّاظِرِينَ سَنَاهَا",
    poet: "أبو العلاء المعري",
    season: "الخريف"
  },
  {
    id: 13,
    name: "العَوَّاء",
    transliteration: "Al-'Awwa",
    stars: "خمسة كواكب في برج العذراء",
    meaning: "تشبه زاوية أو كتابة رقم أربعة بلغة الفلك القديمة.",
    heritageNote: "من المنازل الطيبة التي يستبشر بها الفلاحون.",
    poetry: "وَالعَوَّاءُ تَزْهُو فِي السَّمَاءِ كَأَنَّهَا *** ثُرَيَّا مَنَارٍ فِي ظَلاَمٍ مُعَسْعَسِ",
    poet: "ابن الفارض",
    season: "الخريف"
  },
  {
    id: 14,
    name: "السِّمَاك",
    transliteration: "Al-Simak",
    stars: "السماك الأعزل في العذراء",
    meaning: "نجم نير أبيض من ألمع نجوم السماء.",
    heritageNote: "سمي أعزل لأنه لا سلاح معه بخلاف السماك الرامح.",
    poetry: "وَرُبَّ سِمَاكٍ فِي السَّمَاوَاتِ سَامِقٍ *** يَنَالُ بَدِيعَ الشَّأْوِ فَوْقَ المَجَرَّاتِ",
    poet: "ابن خفاجة",
    season: "الخريف"
  },
  {
    id: 15,
    name: "الغَفْر",
    transliteration: "Al-Ghafr",
    stars: "ثلاثة كواكب خفية في العذراء",
    meaning: "سميت الغفر لأنها سترت بنورها وضعف ضيائها.",
    heritageNote: "تعتبر من أصلح المنازل لطلب الحاجات وستر العيوب.",
    poetry: "وَبِالغَفْرِ يَسْتَخْفِي الفَتَى مَنْ عُيُوبِهِ *** إِذَا سَتَرَتْ نُورَ السَّمَاءِ السَّحَائِبُ",
    poet: "الطرماح",
    season: "الشتاء"
  },
  {
    id: 16,
    name: "الزُّبَانَى",
    transliteration: "Al-Zubana",
    stars: "قرنا الميزان",
    meaning: "كوكبان مضيئان متباعدان يشبهان قرني العقرب.",
    heritageNote: "منزل الاعتدال الخريفي ودخول البرد اللطيف.",
    poetry: "زُبَانَى المَوَازِينِ الَّتِي أُقِيمَتْ حِكْمَةً *** تُمَيِّزُ حَقّاً فِي حَيَاةِ الخَلاَئِقِ",
    poet: "ابن حزم",
    season: "الشتاء"
  },
  {
    id: 17,
    name: "الإِكْلِيل",
    transliteration: "Al-Iklil",
    stars: "رأس العقرب (ثلاثة كواكب)",
    meaning: "الإكليل هو التاج، وهي ثلاثة كواكب متراصفة كالعصابة.",
    heritageNote: "تتوسط الشتاء وتشتد فيها برودة الليل.",
    poetry: "وَإِكْلِيلُ سَعْدٍ فِي السَّمَاءِ مُكَلَّلٌ *** بِدُرٍّ وَيَاقُوتٍ وَنُورٍ مُبَارَكِ",
    poet: "ابن سناء الملك",
    season: "الشتاء"
  },
  {
    id: 18,
    name: "القَلْب",
    transliteration: "Al-Qalb",
    stars: "قلب العقرب (الأحمر النير)",
    meaning: "قلب العقرب الوقاد الأحمري الضياء.",
    heritageNote: "نجم أحمر عملاق تعده العرب من أشد النجوم هيبة.",
    poetry: "قَلْبُ السَّمَاءِ المُلْتَهِبُ شَوْقاً وَسَناءً *** كَأَنَّهُ القَبَسُ فِي دَجَى المِحْرَابِ",
    poet: "أبو العتاهية",
    season: "الشتاء"
  },
  {
    id: 19,
    name: "الشَّوْلَة",
    transliteration: "Al-Shawlah",
    stars: "ذنب العقرب إبرتها",
    meaning: "كوكبان متقاربان كإبرة العقرب المرفوعة.",
    heritageNote: "قيل: إذا طلعت الشولة، توق الشتاء وحذر الصولة.",
    poetry: "وَشَوْلَةُ نَجْمٍ كَالشِّهَابِ إِذَا هَوَى *** لِيَحْرُسَ أَرْضَ اللَّهِ مِنْ كُلِّ مَارِقِ",
    poet: "ابن القيسراني",
    season: "الشتاء"
  },
  {
    id: 20,
    name: "النَّعَائِم",
    transliteration: "Al-Na'a'im",
    stars: "ثمانية كواكب في برج القوس",
    meaning: "ثمانية كواكب أربعة منها في المَجَرَّة وتسمى الواردة، وأربعة خارجها الصادرة.",
    heritageNote: "تشبه النعام الوارد للماء والصادر عنه.",
    poetry: "وَالنَّعَائِمُ الزَّهْرُ فِي نَهْرِ المَجَرَّةِ شُرَّعٌ *** يُرَوِّينَ بالأنْوَارِ رُوحَ المُنَاجِي",
    poet: "ابن خفاجة",
    season: "الشتاء"
  },
  {
    id: 21,
    name: "البَلْدَة",
    transliteration: "Al-Baldah",
    stars: "رقعة خالية بين النعائم وسعد الذابح",
    meaning: "رقعة خالية من الكواكب كأنها بلدة أفقية جردة.",
    heritageNote: "تسمى الفضاء النقي، ويكثر فيها الضباب والفجر الصادق.",
    poetry: "وَبَلْدَةُ نَجْمٍ فِي الفَضَاءِ نَقِيَّةٌ *** يَطُوفُ بِهَا بَدْرُ السَّمَاءِ المُظَفَّرُ",
    poet: "ابن دريد",
    season: "الشتاء"
  },
  {
    id: 22,
    name: "سَعْد الذَّابِح",
    transliteration: "Sa'd al-Dhabih",
    stars: "كوكبان في الجدي",
    meaning: "أول السعودات الأربعة عند العرب.",
    heritageNote: "سميت بالذنوب والسعود للبشرى بتراجع اشتداد البرد.",
    poetry: "وَسَعْدٌ أَتَى بِالبُشْرِ فِي كُلِّ مَشْهَدٍ *** فَيَفْرَحُ قَلْبُ الصَّالِحِينَ بِذِكْرِهِ",
    poet: "ابن المعتز",
    season: "الربيع"
  },
  {
    id: 23,
    name: "سَعْد بُلَع",
    transliteration: "Sa'd Bula'",
    stars: "كوكبان أحدهما خفي والآخر نير",
    meaning: "ثاني السعودات القبلية.",
    heritageNote: "قيل بلع لأن الأرض تبتلع ماءها ويمر الشتاء.",
    poetry: "وَسَعْدُ بُلَعٍ إِذَا بَدَا فِي سَمَائِهِ *** أَرَارَ مِيَاهَ الأَرْضِ فِي كُلِّ جَدْوَلِ",
    poet: "ابن عبد ربه",
    season: "الربيع"
  },
  {
    id: 24,
    name: "سَعْد السُّعُود",
    transliteration: "Sa'd al-Su'ud",
    stars: "ثلاثة كواكب في الدلو",
    meaning: "أبرك المنازل وسعدها الأكبر عند العرب.",
    heritageNote: "عند طلوعها تخضر الأرض وتتدفق المياة بالماء المبارك.",
    poetry: "طَلَعَ سَعْدُ السُّعُودِ وَاخْضَرَّتِ الأَرْ *** ضُ وَغَنَّى فِي كُلِّ غُصْنٍ هَزَارُ",
    poet: "البحتري",
    season: "الربيع"
  },
  {
    id: 25,
    name: "سَعْد الأَخْبِيَة",
    transliteration: "Sa'd al-Akhbiyah",
    stars: "أربعة كواكب كالأثافي في الدلو",
    meaning: "تخرج عندها ذوات السموم والحشرات من أخبية الأرض.",
    heritageNote: "يبدأ الدفء الحقيقي وتزهر فيه الأشجار.",
    poetry: "وَسَعْدُ الأَخْبِيَةِ المَيْمُونُ يُشْرِقُ نُورُهُ *** فَتَخْرُجُ أَزْهَارُ الرُّبَى مِنْ خِبَائِهَا",
    poet: "أبو تمام",
    season: "الربيع"
  },
  {
    id: 26,
    name: "فَرْغُ الدَّلْوِ المُقَدَّم",
    transliteration: "Fargh al-Muqaddam",
    stars: "كوكبان نيران في الفرس الأعظم",
    meaning: "مصب الماء من الدلو العظيم.",
    heritageNote: "تستعد فيه الأرض لأمطار الربيع الغزيرة.",
    poetry: "وَبِالفَرْغِ يُسْقَى كُلُّ رَوْضٍ وَرَبْوَةٍ *** مِيَاهَ حَيَاةٍ أُنْزِلَتْ مِنْ غَمَامِهَا",
    poet: "المتنبي",
    season: "الربيع"
  },
  {
    id: 27,
    name: "فَرْغُ الدَّلْوِ المُمَؤَخَّر",
    transliteration: "Fargh al-Mu'akhkhar",
    stars: "كوكبان نيران متجاوران",
    meaning: "مصب الدلو الثاني المؤخر.",
    heritageNote: "من أواخر المنازل المشرقة في الدلو.",
    poetry: "فَرْغٌ مُؤَخَّرُ فِي السَّمَاوَاتِ سَاطِعٌ *** كَأَنَّ ضِيَاهُ الفَضُّ المُرَقْرَقُ",
    poet: "ابن الرومي",
    season: "الربيع"
  },
  {
    id: 28,
    name: "الرَّشَاء (بَطْنُ الحُوت)",
    transliteration: "Al-Rasha / Batn al-Hut",
    stars: "عدة كواكب كالحبل في الحوت",
    meaning: "الرشاء هو حبل الدلو، وهي آخر المنازل القمرية الـ ٢٨.",
    heritageNote: "تكتمل بها دورة القمر كاملة ليبدأ شهر جديد وهلال جديد.",
    poetry: "وَبِالرَّشَاءِ تَمَّتْ لِلْقَمَرِ دَوْرَةٌ *** يَعُودُ بِهَا بَدْرًا جَدِيدًا مُكَرَّمَا",
    poet: "التراث الأندلسي",
    season: "الربيع"
  }
];

export const MoonPhases: React.FC<MoonPhasesProps> = ({
  now = new Date(),
  hijriDay = 14,
  hijriMonthName = 'شوال',
  hijriYear = 1447,
  cityName = 'الإسكندرية',
  toArabicNumbers,
  onNavigateTab
}) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'mansions' | 'islamic' | 'phenomena'>('overview');

  // Compute target date based on day offset slider
  const targetDate = new Date(now.valueOf() + selectedDayOffset * 86400000);
  
  // Simulated Hijri calculation for offset
  let targetHijriDay = ((hijriDay + selectedDayOffset - 1) % 30);
  if (targetHijriDay <= 0) targetHijriDay += 30;

  // Moon Phase Determination
  const getMoonPhaseDetails = (day: number) => {
    if (day === 1 || day === 30) {
      return {
        name: 'المحاق',
        enName: 'New Moon',
        illumination: 2,
        age: day,
        icon: '🌑',
        desc: 'بداية الشهر الهجري وولادة الهلال الجديد. يقع القمر بين الأرض والشمس.',
        fastingNote: 'استحباب تحري الهلال وسنة الدعاء عند رؤيته.'
      };
    } else if (day >= 2 && day <= 6) {
      return {
        name: 'الهلال المتزايد',
        enName: 'Waxing Crescent',
        illumination: Math.round((day / 15) * 50),
        age: day,
        icon: '🌒',
        desc: 'يظهر قوس نحيل من الضوء الفضي في جهة الغرب بعد غروب الشمس.',
        fastingNote: 'بداية الشهر المبارك وأوقات الدعاء والابتهال.'
      };
    } else if (day >= 7 && day <= 9) {
      return {
        name: 'التربيع الأول',
        enName: 'First Quarter',
        illumination: 50,
        age: day,
        icon: '🌓',
        desc: 'نصف القمر مضيء بحجم دقيق يمتد في سماء المساء.',
        fastingNote: 'اقتراب الانتصاف الهجري والاستعداد للعبادات.'
      };
    } else if (day >= 10 && day <= 12) {
      return {
        name: 'الأحدب المتزايد',
        enName: 'Waxing Gibbous',
        illumination: Math.round(50 + ((day - 7) / 7) * 45),
        age: day,
        icon: '🌔',
        desc: 'اكتمل معظم وجه القمر بالضوء الباهر مع اقتراب ليلة البدر.',
        fastingNote: 'استحباب الاستعداد لصيام أيام البيض (١٣، ١٤، ١٥).'
      };
    } else if (day >= 13 && day <= 15) {
      return {
        name: 'البدر المكتمل',
        enName: 'Full Moon',
        illumination: 100,
        age: day,
        icon: '🌕',
        desc: 'يكتمل نور القمر تماماً في كبد السماء ليلتي ١٤ و١٥.',
        fastingNote: '✨ صيام أيام البيض مستحب مؤكد (١٣ - ١٤ - ١٥ من الشهر الهجري).'
      };
    } else if (day >= 16 && day <= 19) {
      return {
        name: 'الأحدب المتناقص',
        enName: 'Waning Gibbous',
        illumination: Math.round(95 - ((day - 15) / 7) * 45),
        age: day,
        icon: '🌖',
        desc: 'يبدأ جانب من الضوء ينحسر تدريجياً بعد ليلة البدر.',
        fastingNote: 'فرصة للاستمرار في النوافل واستغلال بركة الشهر.'
      };
    } else if (day >= 20 && day <= 23) {
      return {
        name: 'التربيع الأخير',
        enName: 'Third Quarter',
        illumination: 50,
        age: day,
        icon: '🌗',
        desc: 'يضيء النصف الآخر من القمر ويشرق في وقت متأخر من الليل.',
        fastingNote: 'أوقات قيام الليل ومناجاة السحر تحت ضياء السحر.'
      };
    } else {
      return {
        name: 'الهلال المتناقص',
        enName: 'Waning Crescent',
        illumination: Math.max(3, Math.round(50 - ((day - 22) / 7) * 45)),
        age: day,
        icon: '🌘',
        desc: 'قوس دقيق كالعرجون القديم يظهر قبل شروق الشمس بالفجر.',
        fastingNote: 'قرب نهاية الشهر واستحضار إحياء ختامه بالاستغفار.'
      };
    }
  };

  const currentPhase = getMoonPhaseDetails(targetHijriDay);
  const currentMansionIndex = Math.min(27, Math.max(0, targetHijriDay - 1));
  const currentMansion = LUNAR_MANSIONS[currentMansionIndex];

  // Distance estimate simulated ~384,400 km
  const estimatedDistance = (363300 + Math.sin(targetHijriDay * 0.2) * 21000).toFixed(0);

  // Check if Ayyam al-Beed
  const isAyyamBeed = targetHijriDay >= 13 && targetHijriDay <= 15;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-slate-100 bg-[#090d16] p-3 sm:p-6 rounded-3xl border border-indigo-950/80 shadow-2xl transition-colors">
      
      {/* TOP HERO CANVAS: Realistic Animated 3D Moon Canvas */}
      <div 
        className="relative rounded-3xl overflow-hidden border border-indigo-500/20 shadow-2xl p-6 sm:p-8 flex flex-col items-center justify-center min-h-[380px] bg-slate-950"
        style={{ background: 'radial-gradient(ellipse at top, #131b2e 0%, #090d16 60%, #030712 100%)' }}
      >
        {/* Ambient Twinkling Stars Background */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />
        
        {/* Soft Moon Glow */}
        <div className={`absolute w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700 ${
          isAyyamBeed ? 'bg-amber-300' : 'bg-sky-400'
        }`} />

        {/* Top Header Badge */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 w-full border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-amber-300 shrink-0">
              <Moon className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>أطوار ومنازل القمر</span>
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  التقويم القمري
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {hijriMonthName} {toArabicNumbers(hijriYear)} هـ • {cityName}
              </p>
            </div>
          </div>

          <div className="text-start font-mono shrink-0">
            <span className="text-xs text-slate-400 block font-bold">اليوم الهجري</span>
            <span className="text-xl font-black text-amber-400">
              {toArabicNumbers(targetHijriDay)} {hijriMonthName}
            </span>
          </div>
        </div>

        {/* MAIN VISUAL MOON DISK */}
        <div className="relative z-10 my-4 flex flex-col items-center group cursor-pointer">
          {/* Outer Ring Atmosphere */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full flex items-center justify-center p-2 bg-gradient-to-b from-white/10 to-transparent border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.15)] transition-transform duration-500 group-hover:scale-105">
            {/* The Spherical Moon Texture Surface */}
            <div className="w-full h-full rounded-full bg-[#111827] relative overflow-hidden shadow-inner border border-slate-700 flex items-center justify-center">
              {/* Moon Craters Simulation */}
              <div className="absolute w-8 h-8 rounded-full bg-slate-800/40 top-8 start-10 blur-[1px]" />
              <div className="absolute w-12 h-12 rounded-full bg-slate-800/30 bottom-10 end-8 blur-[1px]" />
              <div className="absolute w-6 h-6 rounded-full bg-slate-800/50 top-20 end-14 blur-[1px]" />
              <div className="absolute w-10 h-10 rounded-full bg-slate-800/25 bottom-12 start-12 blur-[1px]" />

              {/* Illuminated Phase Overlay Gradient */}
              <div 
                className="absolute inset-0 rounded-full transition-all duration-700 bg-gradient-to-r from-amber-100 via-sky-100 to-white opacity-90 shadow-[0_0_30px_rgba(255,255,255,0.8)]"
                style={{
                  clipPath: currentPhase.illumination >= 98 
                    ? 'inset(0 0 0 0)' 
                    : currentPhase.illumination <= 5 
                    ? 'inset(0 100% 0 0)' 
                    : `polygon(0 0, ${currentPhase.illumination}% 0, ${currentPhase.illumination}% 100%, 0 100%)`
                }}
              />

              {/* Moon Emoji Icon Representation overlay */}
              <span className="relative z-10 text-7xl select-none filter drop-shadow-md opacity-30">
                {currentPhase.icon}
              </span>
            </div>
          </div>

          {/* Current Phase Title */}
          <div className="mt-4 text-center space-y-2 px-2">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none drop-shadow-xs">
                {currentPhase.name}
              </h1>
              <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-md dir-ltr shadow-xs">
                {currentPhase.enName}
              </span>
              {isAyyamBeed && (
                <span className="text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2.5 py-0.5 rounded-full shadow-xs">
                  ✨ أيام البيض
                </span>
              )}
            </div>
            <p className="text-xs text-amber-300 font-bold max-w-md mx-auto">
              نسبة الإضاءة: %{toArabicNumbers(currentPhase.illumination)} • عمر القمر: {toArabicNumbers(currentPhase.age)} يوم
            </p>
          </div>
        </div>

        {/* DAY SLIDER SELECTOR */}
        <div className="relative z-10 w-full max-w-md bg-slate-900/80 p-3 rounded-2xl border border-white/10 mt-2 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
            <button
              type="button"
              onClick={() => setSelectedDayOffset(prev => prev - 1)}
              className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>اليوم السابق</span>
            </button>
            <span className="text-amber-400 font-mono text-xs">
              {selectedDayOffset === 0 ? 'اليوم الحقيقي' : `تصفح (${selectedDayOffset > 0 ? '+' : ''}${toArabicNumbers(selectedDayOffset)} يوم)`}
            </span>
            <button
              type="button"
              onClick={() => setSelectedDayOffset(prev => prev + 1)}
              className="flex items-center gap-1 hover:text-amber-300 transition-colors cursor-pointer"
            >
              <span>اليوم التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <input 
            type="range"
            min="-15"
            max="15"
            value={selectedDayOffset}
            onChange={(e) => setSelectedDayOffset(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
        </div>

        {/* Quick Reset Button if Offset */}
        {selectedDayOffset !== 0 && (
          <button
            type="button"
            onClick={() => setSelectedDayOffset(0)}
            className="relative z-10 mt-2 text-[10px] font-extrabold text-amber-300 hover:underline cursor-pointer"
          >
            العودة لليوم الحالي
          </button>
        )}
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Card 1: Current Mansion */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            <span>المنزلة القمرية ({toArabicNumbers(currentMansionIndex + 1)}/٢٨)</span>
          </span>
          <p className="text-sm font-black text-amber-300">{currentMansion.name}</p>
          <span className="text-[10px] text-slate-400 font-bold block truncate">{currentMansion.stars}</span>
        </div>

        {/* Card 2: Ayyam al-Beed Status */}
        <div className={`border rounded-2xl p-3.5 space-y-1 ${
          isAyyamBeed 
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-100' 
            : 'bg-slate-900/90 border-slate-800 text-slate-300'
        }`}>
          <span className="text-[10px] font-bold block flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>أيام البيض (١٣-١٤-١٥)</span>
          </span>
          <p className="text-sm font-black text-amber-300">
            {isAyyamBeed ? '🌕 أيام البيض الآن!' : `متبقي ${toArabicNumbers(Math.max(1, 13 - targetHijriDay))} يوم`}
          </p>
          <span className="text-[10px] opacity-80 block">
            {isAyyamBeed ? 'يستحب الصيام اليوم' : 'استعد لصيام منتصف الشهر'}
          </span>
        </div>

        {/* Card 3: Distance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>المسافة عن الأرض</span>
          </span>
          <p className="text-sm font-black text-white font-mono">{toArabicNumbers(estimatedDistance)} كم</p>
          <span className="text-[10px] text-slate-400 block font-bold">متوسط ٣٨٤,٤٠٠ كم</span>
        </div>

        {/* Card 4: Hilal Sighting */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>إمكانية الرؤية بالعين</span>
          </span>
          <p className="text-sm font-black text-emerald-400">
            {targetHijriDay <= 2 ? 'ممكنة بالأجهزة' : targetHijriDay >= 28 ? 'صعبة في الفجر' : 'واضحة ممتازة'}
          </p>
          <span className="text-[10px] text-slate-400 block font-bold">زاوية الرصد مناسبة</span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'overview'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>الأطوار والتحليل</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('mansions')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'mansions'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>منازل القمر الـ ٢٨</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('islamic')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'islamic'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>الشعائر والعبادات القمريّة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('phenomena')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'phenomena'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>الظواهر والتراث العربي</span>
        </button>
      </div>

      {/* SUBTAB 1: OVERVIEW & FASTING ACTION */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                <span>تفاصيل الطور الحالي: {currentPhase.name}</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">
                اليوم {toArabicNumbers(targetHijriDay)} من الشهر
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              {currentPhase.desc}
            </p>

            <div className="bg-indigo-950/40 border border-indigo-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-black text-amber-300 block">✨ التوجيه العبادي والروحي:</span>
                <p className="text-xs text-indigo-200 font-bold">{currentPhase.fastingNote}</p>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('fasting')}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                >
                  <span>سجل صيام النوافل</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 8 MOON PHASES CYCLE SUMMARY GRID */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black text-slate-300">أطوار القمر الثمانية الرئيسية في الإسلام:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { name: 'المحاق', days: '١ - ٣٠', icon: '🌑', desc: 'رؤية الهلال وولادته' },
                { name: 'الهلال', days: '٢ - ٦', icon: '🌒', desc: 'أول أيام الشهر' },
                { name: 'التربيع الأول', days: '٧ - ٨', icon: '🌓', desc: 'ربع الشهر' },
                { name: 'الأحدب المتزايد', days: '٩ - ١٢', icon: '🌔', desc: 'اقتراب البدر' },
                { name: 'البدر المكتمل', days: '١٣ - ١٥', icon: '🌕', desc: 'أيام البيض' },
                { name: 'الأحدب المتناقص', days: '١٦ - ١٩', icon: '🌖', desc: 'بعد البدر' },
                { name: 'التربيع الأخير', days: '٢٠ - ٢٣', icon: '🌗', desc: 'ثلاثة أرباع الشهر' },
                { name: 'الهلال المتناقص', days: '٢٤ - ٢٩', icon: '🌘', desc: 'آخر الشهر الهجري' },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                  <span className="text-2xl block">{item.icon}</span>
                  <span className="text-xs font-black text-amber-300 block">{item.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono block">أيام {toArabicNumbers(item.days)}</span>
                  <span className="text-[10px] text-slate-500 block">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: THE 28 LUNAR MANSIONS */}
      {activeSubTab === 'mansions' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>المنزلة الحالية: منزلة {currentMansion.name}</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">{currentMansion.transliteration} • {currentMansion.stars}</p>
              </div>
              <span className="text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full">
                المنزلة رقم {toArabicNumbers(currentMansion.id)} من ٢٨
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-black text-amber-400 block">📖 المعنى والموقع الفلكي:</span>
                <p className="text-xs text-slate-300 leading-relaxed">{currentMansion.meaning}</p>
              </div>

              <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-black text-emerald-400 block">🌿 التراث العربي والأثر الفلاحي:</span>
                <p className="text-xs text-slate-300 leading-relaxed">{currentMansion.heritageNote}</p>
              </div>
            </div>

            {/* POETRY BOX */}
            <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-indigo-950/30 border border-amber-500/30 rounded-2xl p-4 text-center space-y-2">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">✨ من شعر العرب في هذه المنزلة</span>
              <p className="text-sm font-serif font-black text-amber-100 leading-loose" dir="rtl">
                "{currentMansion.poetry}"
              </p>
              <span className="text-[10px] text-slate-400 font-bold block">— {currentMansion.poet}</span>
            </div>
          </div>

          {/* ALL 28 MANSIONS EXPLORER */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black text-slate-300">دليل منازل القمر الـ ٢٨ كاملة:</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-80 overflow-y-auto pe-1">
              {LUNAR_MANSIONS.map((mansion) => {
                const isCurrent = mansion.id === currentMansion.id;
                return (
                  <div
                    key={mansion.id}
                    className={`p-2.5 rounded-xl border transition-all text-end ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 border-amber-300 font-extrabold shadow-md'
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span>منزلة {toArabicNumbers(mansion.id)}</span>
                      <span className={isCurrent ? 'text-slate-900' : 'text-slate-500'}>{mansion.season}</span>
                    </div>
                    <span className="text-xs font-black block mt-0.5">{mansion.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ISLAMIC OBSERVANCES & HILAL */}
      {activeSubTab === 'islamic' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Box 1: Ayyam al-Beed */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>أيام البيض (١٣، ١٤، ١٥ هجرياً)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                عن أبي هريرة رضي الله عنه قال: «أَوْصَانِي خَلِيلِي صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ بِثَلاَثٍ: صِيَامِ ثَلاَثَةِ أَيَّامٍ مِنْ كُلِّ شَهْرٍ...».
              </p>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>اليوم الأول (١٣):</span>
                  <span className="font-bold text-amber-400">{targetHijriDay === 13 ? 'اليوم!' : 'متوقع قريباً'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>اليوم الثاني (١٤):</span>
                  <span className="font-bold text-amber-400">{targetHijriDay === 14 ? 'اليوم!' : 'منتصف الشهر'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>اليوم الثالث (١٥):</span>
                  <span className="font-bold text-amber-400">{targetHijriDay === 15 ? 'اليوم!' : 'ختام البيض'}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Hilal Sighting & Sacred Months */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-black text-sm border-b border-slate-800 pb-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>استطلاع الهلال والأشهر الحُرُم</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                سُنّة الدعاء عند رؤية الهلال: «اللَّهُمَّ أَهِلَّهُ عَلَيْنَا بِالأَمْنِ وَالإِيمَانِ وَالسَّلاَمَةِ وَالإِسْلاَمِ، رَبِّي وَرَبُّكَ اللَّهُ».
              </p>
              <div className="bg-indigo-950/40 p-3 rounded-2xl border border-indigo-900/50 text-xs space-y-1.5">
                <span className="font-black text-indigo-300 block">الأشهر الحرم الأربعة:</span>
                <p className="text-[11px] text-slate-300">
                  ذو القعدة • ذو الحجة • المحرم • رجب. يعظم فيها أجر الطاعات وتضاعف الحسنات.
                </p>
              </div>
            </div>
          </div>

          {/* ECLIPSE & SUNNAH PRAYER GUIDANCE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h4 className="text-xs font-black text-amber-300 flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>صلاة الخسوف والكسوف عند الظواهر القمرية:</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              قال النبي ﷺ: «إنَّ الشَّمْسَ والقَمَرَ آيَتانِ مِنْ آياتِ اللَّهِ، لا يَخْسِفانِ لِمَوْتِ أحَدٍ ولا لِحَياتِهِ، فَإذا رأَيْتُمُوهُما فادْعُوا اللَّهَ وكَبِّرُوا وصَلُّوا وتَصَدَّقُوا».
            </p>
            <div className="grid sm:grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="font-bold text-amber-400 block">صفة الصلاة</span>
                <span className="text-[11px] text-slate-400 mt-1 block">ركعتان في كل ركعة قيامان وقراءتان وركوعان</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="font-bold text-amber-400 block">وقتها</span>
                <span className="text-[11px] text-slate-400 mt-1 block">من بداية انكساف القمر حتى انجلاؤه ورجوعه</span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <span className="font-bold text-amber-400 block">المستحبات</span>
                <span className="text-[11px] text-slate-400 mt-1 block">الإكثار من التكبير والاستغفار والصدقة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PHENOMENA & HERITAGE */}
      {activeSubTab === 'phenomena' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2 border-b border-slate-800 pb-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>الظواهر الفلكية القمرية والتراث العربي</span>
            </h3>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-black text-amber-400 block">🌕 القمر العملاق (Supermoon)</span>
                <p className="text-xs text-slate-300">
                  حدث فلكي يقع عندما يكون القمر في أقرب نقطة له من الأرض (الحضيض)، فيبدو أكبر حجماً بـ ١٤٪ وأشد ضياءً بـ ٣٠٪.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-black text-amber-400 block">🌑 القمر الدموي (Blood Moon)</span>
                <p className="text-xs text-slate-300">
                  ظاهرة تقع أثناء الخسوف الكلي حيث يمر القمر بظل الأرض وينعكس عليه الضوء الأحمر عبر الغلاف الجوي للأرض.
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-black text-amber-400 block">🌊 أثر المد والجزر</span>
                <p className="text-xs text-slate-300">
                  تصل قوة جاذبية القمر لقمّتها في ليلتي المحاق والبدر المكتمل، مما يؤدي لأعلى ارتفاع في منسوب مياه البحار (المد العالي).
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs font-black text-amber-400 block">🐪 القمر في الملاحة والأسفار</span>
                <p className="text-xs text-slate-300">
                  اعتمدت العرب والمسافرون قديماً على منازل القمر الـ ٢٨ لتحديد الاتجاهات في الفيافي والبحار ومعرفة نضج المحاصيل.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MoonPhases;
