/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SmartDhikrRecommendation {
  id: string;
  categoryName: string;
  categoryIcon: string;
  text: string;
  transliteration?: string;
  reward: string; // Virtue / Hadith / Quran Source
  recommendedCount: number;
  bestTime: string; // e.g. "بعد صلاة الفجر والظهر", "عند القلق والشدة"
  tags: string[];
}

export interface SmartAppRecommendation {
  id: string;
  title: string;
  description: string;
  actionText: string;
  category: 'dhikr' | 'prayer' | 'notification' | 'quran' | 'fasting';
  icon: string;
  targetTab?: string;
  targetAction?: string;
}

export const SITUATIONAL_CATEGORIES = [
  { id: 'tranquility', name: 'راحة البال والسكينة', icon: '🕊️', desc: 'للطمأنينة والتخلص من القلق والتوتر' },
  { id: 'rizq', name: 'توسيع الرزق والبركة', icon: '🌿', desc: 'لطلب البركة وتيسير المعيشة والدَيْن' },
  { id: 'relief', name: 'قضاء الحاجة وتيسير العسير', icon: '⚡', desc: 'لتفريج الهموم وفتح الأبواب المغلقة والتوفيق' },
  { id: 'forgiveness', name: 'التوبة ومحو الذنوب', icon: '🤍', desc: 'تجديد العهد والاستغفار ورفع الدرجات' },
  { id: 'protection', name: 'التحصين ودرء الشرور', icon: '🛡️', desc: 'للحفظ من العين والحسد والوسواس' },
  { id: 'healing', name: 'الشفاء والرقية والعافية', icon: '🩺', desc: 'للتعافي من الآلام والأمراض النفسية والبدنية' },
  { id: 'friday', name: 'نفحات يوم الجمعة', icon: '✨', desc: 'الصلاة على النبي ﷺ وقراءة سورة الكهف' },
  { id: 'sleep', name: 'أذكار النوم والهدوء', icon: '🌙', desc: 'لنوم هادئ وتحصين الفراش والتخلص من الأرق' },
  { id: 'family', name: 'صلاح الأهل والذُّرّيّة', icon: '🏡', desc: 'لإصلاح البيوت وهداية الأبناء والمودة' },
  { id: 'gratitude', name: 'شكر النعم والثناء', icon: '👑', desc: 'لإدامة النعم وزيادة الفضل والخير' },
];

export const SMART_DHIKR_DATABASE: SmartDhikrRecommendation[] = [
  // 1. Tranquility & Anxiety (راحة البال)
  {
    id: 'trq_1',
    categoryName: 'راحة البال والسكينة',
    categoryIcon: '🕊️',
    text: 'الَّذِينَ آمَنُوا وَتَطْمَئِنُّ قُلُوبُهُم بِذِكْرِ اللَّهِ ۗ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    reward: 'سورة الرعد (الآية 28): الذكر هو أسرع طريق لسكينة القلب وتفريج كرب النفوس.',
    recommendedCount: 3,
    bestTime: 'عند الضيق، أوقات الخوف، وقبل الخروج أو العمل',
    tags: ['tranquility', 'quran', 'قلق', 'خوف', 'ضيق', 'حزن', 'سكينة']
  },
  {
    id: 'trq_2',
    categoryName: 'راحة البال والسكينة',
    categoryIcon: '🕊️',
    text: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    reward: 'عن ابن عباس رضي الله عنهما: قالها إبراهيم عليه السلام حين أُلقي في النار، وقالها محمد ﷺ يوم أحد.',
    recommendedCount: 7,
    bestTime: 'عند مواجهة المخاوف والقرارات المصيرية والظلم',
    tags: ['tranquility', 'relief', 'خوف', 'هم', 'توكل', 'ظلم']
  },
  {
    id: 'trq_3',
    categoryName: 'راحة البال والسكينة',
    categoryIcon: '🕊️',
    text: 'اللَّهُمَّ إِنِّي عَبْدُكَ، ابْنُ عَبْدِكَ، ابْنُ أَمَتِكَ، نَاصِيَتِي بِيَدِكَ، مَاضٍ فِيَّ حُكْمُكَ، عَدْلٌ فِيَّ قَضَاؤُكَ، أَسْأَلُكَ بِكُلِّ اسْمٍ هُوَ لَكَ سَمَّيْتَ بِهِ نَفْسَكَ، أَوْ أَنْزَلْتَهُ فِي كِتَابِكَ، أَوْ عَلَّمْتَهُ أَحَدًا مِنْ خَلْقِكَ، أَوْ اسْتَأْثَرْتَ بِهِ فِي عِلْمِ الْغَيْبِ عِنْدَكَ، أَنْ تَجْعَلَ الْقُرْآنَ رَبِيعَ قَلْبِي، وَنُورَ صَدْرِي، وَجَلَاءَ حُزْنِي، وَذَهَابَ هَمِّي',
    reward: 'حديث صحيح (أحمد): ما قالها عبد قط أذهب الله همه وأبدله مكان حزنه فرجاً.',
    recommendedCount: 1,
    bestTime: 'أثناء نزلات الحزن والضيق وتراكم الهموم',
    tags: ['tranquility', 'relief', 'هم', 'حزن', 'ضيق', 'قرآن']
  },

  // 2. Rizq & Wealth (الرزق)
  {
    id: 'rzq_1',
    categoryName: 'توسيع الرزق والبركة',
    categoryIcon: '🌿',
    text: 'أسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لاَ إِلَهَ إِلاَّ هُوَ الْحَيَّ الْقَيُّومَ وَأَتُوبُ إِلَيْهِ',
    reward: 'سورة نوح: «فَقُلْتُ اسْتَغْفِرُوا رَبَّكُمْ إِنَّهُ كَانَ غَفَّارًا * يُرْسِلِ السَّمَاءَ عَلَيْكُم مِّدْرَارًا * وَيُمْدِدْكُم بِأَمْوَالٍ وَبَنِينَ».',
    recommendedCount: 100,
    bestTime: 'في الأسحار ومطلع الصباح وبعد صلاة الفجر',
    tags: ['rizq', 'forgiveness', 'رزق', 'مال', 'استغفار', 'بركة', 'عمل']
  },
  {
    id: 'rzq_2',
    categoryName: 'توسيع الرزق والبركة',
    categoryIcon: '🌿',
    text: 'اللَّهُمَّ اكْفِنِي بِحَلاَلِكَ عَنْ حَرَامِكَ، وَأَغْنِنِي بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    reward: 'رواه الترمذي وحسنه: لو كان عليك مثل جبل ثبير دَيْناً أداه الله عنك.',
    recommendedCount: 3,
    bestTime: 'صباحاً ومساءً وقبل النوم وبثقة في الفرج',
    tags: ['rizq', 'relief', 'دين', 'ديون', 'مال', 'فقر', 'حلال']
  },

  // 3. Relief & Success (قضاء الحاجة والتوفيق والامتحانات)
  {
    id: 'rlf_1',
    categoryName: 'قضاء الحاجة وتيسير العسير',
    categoryIcon: '⚡',
    text: 'لاَّ إِلَهَ إِلاَّ أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',
    reward: 'دعوة ذي النون في بطن الحوت: لم يدعُ بها رجل مسلم في شيء قط إلا استجاب الله له.',
    recommendedCount: 40,
    bestTime: 'عند شدة الكرب، وقت الامتحانات، وحلول المعضلات',
    tags: ['relief', 'tranquility', 'كرب', 'امتحان', 'توفيق', 'شدة', 'صعب']
  },
  {
    id: 'rlf_2',
    categoryName: 'قضاء الحاجة وتيسير العسير',
    categoryIcon: '⚡',
    text: 'لاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ الْعَلِيِّ الْعَظِيمِ',
    reward: 'كنز من كنز الجنة، وتدفع تسعين باباً من الضر أيسرها الهم وتحول الحال للأفضل.',
    recommendedCount: 33,
    bestTime: 'طوال اليوم وأثناء العمل والدراسة والمصاعب',
    tags: ['relief', 'power', 'تيسير', 'مذاكرة', 'توفيق', 'عجز', 'تعب']
  },
  {
    id: 'rlf_3',
    categoryName: 'قضاء الحاجة وتيسير العسير',
    categoryIcon: '⚡',
    text: 'اللَّهُمَّ لاَ سَهْلَ إِلاَّ مَا جَعَلْتَهُ سَهْلاً، وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلاً',
    reward: 'دعاء مأثور لتيسير الأمور المعقدة والامتحانات وفتح الفهم.',
    recommendedCount: 3,
    bestTime: 'قبل دخول الامتحان، المقابلات الشخصية، والمهام الجديدة',
    tags: ['relief', 'امتحان', 'دراسة', 'توفيق', 'سهل', 'عمل', 'مقابلة']
  },

  // 4. Forgiveness & repentance (التوبة)
  {
    id: 'fgv_1',
    categoryName: 'التوبة ومحو الذنوب',
    categoryIcon: '🤍',
    text: 'اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ',
    reward: 'سيد الاستغفار (البخاري): من قالها موقناً بها ومات من يومه أو ليلته دخل الجنة.',
    recommendedCount: 1,
    bestTime: 'صباحاً ومساءً وقبل النوم للعهد الجديد',
    tags: ['forgiveness', 'توبة', 'استغفار', 'ذنب', 'ستر']
  },

  // 5. Protection & Ruqyah (التحصين والحفظ)
  {
    id: 'prt_1',
    categoryName: 'التحصين ودرء الشرور',
    categoryIcon: '🛡️',
    text: 'بِسْمِ اللَّهِ الَّذِي لاَ يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الأَرْضِ وَلاَ فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
    reward: 'حديث صحيح: من قالها ثلاثاً إذا أصبح وثلاثاً إذا أسرى لم يضره فجأة بلاء حتى يمسي أو يصبح.',
    recommendedCount: 3,
    bestTime: 'مع أذكار الصباح والمساء وعند دخول أمكنة جديدة',
    tags: ['protection', 'حفظ', 'تحصين', 'عين', 'حسد', 'خوف', 'أمان']
  },
  {
    id: 'prt_2',
    categoryName: 'التحصين ودرء الشرور',
    categoryIcon: '🛡️',
    text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
    reward: 'من نزل منزلاً ثم قالها لم يضره شيء حتى يرتحل من منزله ذلك.',
    recommendedCount: 3,
    bestTime: 'عند نزول البيت، السفر، أو الاستراحة في مكان جديد',
    tags: ['protection', 'حفظ', 'سفر', 'بيت', 'خروج']
  },

  // 6. Healing & Health (الشفاء والعافية)
  {
    id: 'hlg_1',
    categoryName: 'الشفاء والرقية والعافية',
    categoryIcon: '🩺',
    text: 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ، اشْفِ وَأَنْتَ الشَّافِي، لاَ شِفَاءَ إِلاَّ شِفَاؤُكَ، شِفَاءً لاَ يُغَادِرُ سَقَمًا',
    reward: 'من رقية النبي ﷺ للمريض (متفق عليه): سبب للشفاء التام والسكينة البدنية.',
    recommendedCount: 3,
    bestTime: 'عند المرض، الألم البدني، أو زيارة المريض',
    tags: ['healing', 'مرض', 'شفاء', 'وجع', 'ألم', 'رقية', 'عافية']
  },
  {
    id: 'hlg_2',
    categoryName: 'الشفاء والرقية والعافية',
    categoryIcon: '🩺',
    text: 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَك',
    reward: 'عن النبي ﷺ: ما من عبد مسلم يعود مريضاً لم يحضر أجله فيقولها سبع مرات إلا عوفِي.',
    recommendedCount: 7,
    bestTime: 'عند عيادة المريض أو الرقية النفسية',
    tags: ['healing', 'مرض', 'شفاء', 'رقية']
  },

  // 7. Friday (الجمعة)
  {
    id: 'fri_1',
    categoryName: 'نفحات يوم الجمعة',
    categoryIcon: '✨',
    text: 'اللَّهُمَّ صَلِّ وَسَلِّمْ وَبَارِكْ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ',
    reward: 'عن النبي ﷺ: «من صلى عليّ صلاة واحدة صلى الله عليه بها عشراً، وحطت عنه عشر خطايا».',
    recommendedCount: 100,
    bestTime: 'ليلة الجمعة ويوم الجمعة كاملاً وسائر الأوقات',
    tags: ['friday', 'salawat', 'جمعة', 'صلاة على النبي', 'نبي', 'بركة']
  },

  // 8. Sleep & Rest (النوم والهدوء)
  {
    id: 'slp_1',
    categoryName: 'أذكار النوم والهدوء',
    categoryIcon: '🌙',
    text: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ، إِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
    reward: 'تحصين النوايا والجسد والروح طوال النوم حتى الاستيقاظ.',
    recommendedCount: 1,
    bestTime: 'عند الاضجاع على الفراش للراحة أو النوم',
    tags: ['sleep', 'نوم', 'أرق', 'راحة', 'فراش']
  },

  // 9. Family & Kids (صلاح الأهل والذرية)
  {
    id: 'fam_1',
    categoryName: 'صلاح الأهل والذُّرِّيّة',
    categoryIcon: '🏡',
    text: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ وَاجْعَلْنَا لِلْمُتَّقِينَ إِمَامًا',
    reward: 'سورة الفرقان (الآية 74): دعاء قرآني مبارك لجمع الشمل والبركة في الأبناء.',
    recommendedCount: 3,
    bestTime: 'في السجود، بعد الصلوات، وعند إصلاح البيوت',
    tags: ['family', 'أبناء', 'أهل', 'زوج', 'زوجة', 'بيت', 'هداية', 'ذرية']
  },

  // 10. Gratitude (الشكر والثناء)
  {
    id: 'grt_1',
    categoryName: 'شكر النعم والثناء',
    categoryIcon: '👑',
    text: 'اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لاَ شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
    reward: 'من قالها حين أصبح فقد أدّى شكر يومه، ومن قالها حين يُمسي فقد أدّى شكر ليلته.',
    recommendedCount: 1,
    bestTime: 'عند إشراقة الصباح وعند دخول المساء',
    tags: ['gratitude', 'شكر', 'حمد', 'نعم', 'بركة']
  }
];

/**
 * Filter smart suggestions locally using keyword search and semantic tag weights
 */
export function getSmartAdhkarSuggestions(tagOrQuery?: string): SmartDhikrRecommendation[] {
  if (!tagOrQuery || tagOrQuery === 'all') {
    return SMART_DHIKR_DATABASE;
  }

  const queryLower = tagOrQuery.toLowerCase().trim();
  
  const filtered = SMART_DHIKR_DATABASE.filter(item => {
    return item.tags.some(t => t.toLowerCase().includes(queryLower)) ||
           item.categoryName.includes(queryLower) ||
           item.text.includes(queryLower) ||
           item.reward.includes(queryLower);
  });

  return filtered.length > 0 ? filtered : SMART_DHIKR_DATABASE.slice(0, 4);
}

/**
 * Highly Professional Local NLP Smart Matching Algorithm (No External API required!)
 */
export function generateLocalCustomSuggestion(
  userSituationText: string
): SmartDhikrRecommendation[] {
  const text = userSituationText.trim().toLowerCase();
  if (!text) return getSmartAdhkarSuggestions('tranquility').slice(0, 3);

  // Score each item based on keyword matches
  const scored = SMART_DHIKR_DATABASE.map(item => {
    let score = 0;

    item.tags.forEach(tag => {
      if (text.includes(tag)) score += 5;
    });

    if (text.includes(item.categoryName.toLowerCase())) score += 4;
    
    // Key arabic word roots
    const keywords = ['حزن', 'هم', 'ضيق', 'خوف', 'رزق', 'دين', 'مال', 'امتحان', 'نجاح', 'مذاكرة', 'توفيق', 'مرض', 'شفاء', 'توبة', 'استغفار', 'نوم', 'أرق', 'عين', 'حسد', 'أبناء', 'زوج', 'شكر'];
    keywords.forEach(kw => {
      if (text.includes(kw) && (item.tags.includes(kw) || item.text.includes(kw) || item.reward.includes(kw))) {
        score += 3;
      }
    });

    return { item, score };
  });

  // Sort by highest score
  scored.sort((a, b) => b.score - a.score);

  const bestMatches = scored.filter(s => s.score > 0).map(s => s.item);

  if (bestMatches.length >= 2) {
    return bestMatches.slice(0, 4);
  }

  // Fallback if no specific keywords matched: pick 3 universally uplifting supplications
  return [
    SMART_DHIKR_DATABASE[0], // Tranquility
    SMART_DHIKR_DATABASE[3], // Rizq
    SMART_DHIKR_DATABASE[5], // Relief
  ];
}

/**
 * Generate Smart App & Habit Improvement Recommendations (100% Offline)
 */
export function getSmartAppRecommendations(
  completedStationsCount: number,
  activePrayerName: string,
  isPushGranted: boolean
): SmartAppRecommendation[] {
  const recommendations: SmartAppRecommendation[] = [];

  // 1. Station Completion Insight
  if (completedStationsCount < 7) {
    const remaining = 7 - completedStationsCount;
    recommendations.push({
      id: 'rec_stations',
      title: `متبقي لك ${remaining} محطات لإكمال تاج الورد اليومي 🏆`,
      description: 'إكمال محطات الأذكار السبع يمنحك حصناً متكاملاً وبركة طول اليوم.',
      actionText: 'الانتقال لشريط المحطات 📿',
      category: 'dhikr',
      icon: '✨',
      targetTab: 'adhkar'
    });
  } else {
    recommendations.push({
      id: 'rec_stations_done',
      title: 'ما شاء الله! أكملت جميع محطات الأذكار السبع اليوم 🏆',
      description: 'ثبتك الله وكتب أجر تحصينك اليومي كاملاً. يمكنك زيارة المسبحة الإلكترونية للورد المفتوح.',
      actionText: 'فتح المسبحة المفتوحة 📿',
      category: 'dhikr',
      icon: '🌟',
      targetTab: 'adhkar'
    });
  }

  // 2. Push Notification Recommendation
  if (!isPushGranted) {
    recommendations.push({
      id: 'rec_push',
      title: 'تفعيل الإشعارات الفورية للأذان والأذكار 🔔',
      description: 'احرص على ألا تفوتك مواقيت الصلوات وتذكيرات أذكار الصباح والمساء عند إغلاق التطبيق.',
      actionText: 'تفعيل الإشعارات الفورية الآن ⚡',
      category: 'notification',
      icon: '🔔',
      targetAction: 'open_notifications_modal'
    });
  }

  // 3. Friday Recommendation
  const todayDay = new Date().getDay();
  if (todayDay === 5) { // Friday
    recommendations.push({
      id: 'rec_friday',
      title: 'اليوم الجمعة المباركة: اقرأ سورة الكهف وأكثر من الصلاة على النبي ﷺ ✨',
      description: 'سورة الكهف نور ما بين الجمعتين والصلاة على النبي سبب لكفاية الهم وغفران الذنب.',
      actionText: 'فتح ورد الجمعة 📖',
      category: 'quran',
      icon: '🕌',
      targetTab: 'quran'
    });
  }

  // 4. Pre-Prayer Preparation
  recommendations.push({
    id: 'rec_prayer_prep',
    title: `تفعيل تنبيه الاستعداد قبل أذان ${activePrayerName} بـ ١٥ دقيقة`,
    description: 'يمنحك وقتاً كافياً للوضوء وتهيئة الخشوع والطمأنينة قبل دخول الوقت.',
    actionText: 'ضبط تنبيه الاستعداد ⏰',
    category: 'prayer',
    icon: '🕌',
    targetAction: 'open_prayer_settings'
  });

  return recommendations;
}
