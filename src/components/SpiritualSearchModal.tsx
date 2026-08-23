/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { safeSetJSON } from '../utils/storage';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  BookOpen, 
  Sparkles, 
  Clock, 
  Calendar, 
  Moon, 
  Flame, 
  Copy, 
  Check, 
  ExternalLink,
  ChevronLeft,
  Command,
  Compass,
  Zap,
  Volume2,
  VolumeX,
  History,
  Trash2
} from 'lucide-react';
import { TabId } from '../types';
import { SURAHS_LIST, SAMPLE_AYAHS } from '../data/quranData';
import { ADHKAR_DATA } from '../utils/adhkarData';
import { playSpiritualSpeech } from '../utils/spiritualAudio';

export interface SpiritualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: TabId) => void;
  setToastMessage: (msg: string | null) => void;
}

type SearchCategory = 'all' | 'quran' | 'adhkar' | 'prayers' | 'events';

interface SearchResultItem {
  id: string;
  type: SearchCategory;
  typeLabel: string;
  title: string;
  subtitle?: string;
  content?: string;
  reward?: string;
  targetTab: TabId;
  metadata?: string;
  highlightText?: string;
}

const RECENT_SEARCHES_KEY = 'mc_recent_spiritual_searches';

export const SpiritualSearchModal: React.FC<SpiritualSearchModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  setToastMessage,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load recent searches', e);
    }
  }, []);

  // Save query to recent searches
  const saveSearchToHistory = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const filtered = recentSearches.filter(s => s !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 6);
      setRecentSearches(updated);
      safeSetJSON(RECENT_SEARCHES_KEY, updated);
    } catch (e) {
      console.warn('Failed to save search term', e);
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setToastMessage('تم مسح سجل البحث بنجاح 🧹');
  };

  // Popular quick search suggestions
  const QUICK_SUGGESTIONS = [
    'آية الكرسي',
    'سورة الكهف',
    'أذكار المساء',
    'دعاء القنوت',
    'صلاة الضحى',
    'قيام الليل',
    'الأيام البيض'
  ];

  // Pre-built index of static worship items & prayer actions
  const PRAYERS_AND_EVENTS_INDEX: SearchResultItem[] = [
    {
      id: 'p_fajr',
      type: 'prayers',
      typeLabel: 'فريضة',
      title: 'صلاة الفجر والصبح',
      subtitle: 'فريضة • ركعتان جهرية',
      content: 'يبدأ وقتها من الفجر الصادق إلى طلوع الشمس. ركعتا الفجر خير من الدنيا وما فيها.',
      targetTab: 'salah',
      metadata: 'ركعتان'
    },
    {
      id: 'p_dhuhr',
      type: 'prayers',
      typeLabel: 'فريضة',
      title: 'صلاة الظهر',
      subtitle: 'فريضة • ٤ ركعات سرية',
      content: 'يبدأ وقتها عند زوال الشمس وتعامدها حتى يصير ظل كل شيء مثله.',
      targetTab: 'salah',
      metadata: '٤ ركعات'
    },
    {
      id: 'p_asr',
      type: 'prayers',
      typeLabel: 'فريضة',
      title: 'صلاة العصر (الصلاة الوسطى)',
      subtitle: 'فريضة • ٤ ركعات سرية',
      content: 'حافظوا على الصلوات والصلاة الوسطى. من ترك صلاة العصر فقد حبط عمله.',
      targetTab: 'salah',
      metadata: '٤ ركعات'
    },
    {
      id: 'p_maghrib',
      type: 'prayers',
      typeLabel: 'فريضة',
      title: 'صلاة المغرب',
      subtitle: 'فريضة • ٣ ركعات (٢ جهرية + ١ سرية)',
      content: 'يبدأ وقتها بتمكّن غروب الشمس إلى غياب الشفق الأحمر.',
      targetTab: 'salah',
      metadata: '٣ ركعات'
    },
    {
      id: 'p_isha',
      type: 'prayers',
      typeLabel: 'فريضة',
      title: 'صلاة العشاء',
      subtitle: 'فريضة • ٤ ركعات (٢ جهرية + ٢ سرية)',
      content: 'يبدأ وقتها بغياب الشفق الأحمر ويمتد إلى منتصف الليل الشرقي.',
      targetTab: 'salah',
      metadata: '٤ ركعات'
    },
    {
      id: 'p_duha',
      type: 'prayers',
      typeLabel: 'سنة مؤكدة',
      title: 'صلاة الضحى (صلاة الأوابين)',
      subtitle: 'نافلة • ركعتان إلى ٨ ركعات',
      content: 'تُجزئ عن ٣٦٠ صدقة عن كل مفصل في جسم الإنسان. وقتها من بعد الشروق بـ ١٥ دقيقة إلى قبل الظهر بـ ١٠ دقائق.',
      targetTab: 'khushu',
      metadata: 'صدقة المفاصل'
    },
    {
      id: 'p_qiyam',
      type: 'prayers',
      typeLabel: 'سنة مؤكدة',
      title: 'قيام الليل والتهجد',
      subtitle: 'نافلة • أفضل الصلاة بعد الفريضة',
      content: 'ينزل ربنا تبارك وتعالى كل ليلة إلى السماء الدنيا حين يبقى ثلث الليل الآخر فيقول: من يدعوني فأستجيب له؟',
      targetTab: 'khushu',
      metadata: 'الثلث الأخير'
    },
    {
      id: 'p_witr',
      type: 'prayers',
      typeLabel: 'سنة مؤكدة',
      title: 'صلاة الوتر ودعاء القنوت',
      subtitle: 'نافلة • ركعة أو ٣ ركعات فردية',
      content: 'إن الله وتر يحب الوتر، فأوتروا يا أهل القرآن. ختام صلاة الليل.',
      targetTab: 'khushu',
      metadata: 'ختام الليل'
    },
    {
      id: 'e_ramadan',
      type: 'events',
      typeLabel: 'مناسبة مباركة',
      title: 'شهر رمضان المبارك',
      subtitle: 'شهر القرآن والصيام',
      content: 'شهر رمضان الذي أنزل فيه القرآن هدى للناس وبينات من الهدى والفرقان.',
      targetTab: 'fasting',
      metadata: 'ركن الإسلام'
    },
    {
      id: 'e_white_days',
      type: 'events',
      typeLabel: 'صيام نافلة',
      title: 'صيام الأيام البيض (١٣، ١٤، ١٥ من كل شهر هجري)',
      subtitle: 'تعدل صيام الدهر كله',
      content: 'صيام ثلاثة أيام من كل شهر صيام الدهر كله، وهي الأيام المباركة التي يكتمل فيها القمر.',
      targetTab: 'fasting',
      metadata: '١٣ و١٤ و١٥ هـ'
    },
    {
      id: 'e_mon_thu',
      type: 'events',
      typeLabel: 'صيام نافلة',
      title: 'صيام الإثنين والخميس',
      subtitle: 'تُعرض فيهما الأعمال على الله',
      content: 'تعرض الأعمال يوم الإثنين والخميس وأحب أن يُعرض عملي وأنا صائم.',
      targetTab: 'fasting',
      metadata: 'أسبوعي'
    },
    {
      id: 'e_ashura',
      type: 'events',
      typeLabel: 'صيام نافلة',
      title: 'صوم يوم عاشوراء (١٠ محرم)',
      subtitle: 'يكفّر السنة الماضية',
      content: 'صيام يوم عاشوراء أحتسب على الله أن يكفر السنة التي قبله.',
      targetTab: 'calendar',
      metadata: '١٠ محرم'
    },
    {
      id: 'e_arafah',
      type: 'events',
      typeLabel: 'صيام نافلة',
      title: 'صوم يوم عرفة (٩ ذو الحجة)',
      subtitle: 'يكفّر سنتين: الماضية والباقية',
      content: 'أفضل الأيام عند الله، وصيامه يكفّر السنة الماضية والسنة الباقية لغير الحاج.',
      targetTab: 'calendar',
      metadata: '٩ ذو الحجة'
    }
  ];

  // Helper to normalize Arabic text for search (remove diacritics & normalize alef/ta)
  const normalizeArabic = (text: string) => {
    return text
      .replace(/[\u064B-\u0652]/g, '') // remove tashkeel
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .toLowerCase();
  };

  // Compile search results dynamically
  const results = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const normalizedQuery = normalizeArabic(trimmed);
    const searchResults: SearchResultItem[] = [];

    // 1. Search Surahs & Sample Ayahs (Quran Category)
    SURAHS_LIST.forEach((surah) => {
      const normName = normalizeArabic(surah.name);
      const normEnglish = surah.englishName.toLowerCase();
      if (normName.includes(normalizedQuery) || normEnglish.includes(normalizedQuery) || surah.number.toString() === trimmed) {
        searchResults.push({
          id: `quran_surah_${surah.number}`,
          type: 'quran',
          typeLabel: 'سورة قرآنية',
          title: `سورة ${surah.name}`,
          subtitle: `السورة رقم ${surah.number} • ${surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • ${surah.numberOfAyahs} آية`,
          content: `ترتيبها في المصحف: ${surah.number}، وعدد آياتها ${surah.numberOfAyahs} آية.`,
          targetTab: 'quran',
          metadata: `الصفحة / السورة ${surah.number}`
        });
      }
    });

    SAMPLE_AYAHS.forEach((ayah) => {
      const normText = normalizeArabic(ayah.text);
      const normSurah = normalizeArabic(ayah.surahName);
      if (normText.includes(normalizedQuery) || normSurah.includes(normalizedQuery)) {
        searchResults.push({
          id: `quran_ayah_${ayah.id}`,
          type: 'quran',
          typeLabel: 'آية مباركة',
          title: `${ayah.surahName} (آية ${ayah.ayahNumber})`,
          subtitle: `كلمة التدبر: ${ayah.wisdomWord || 'سكينة'}`,
          content: ayah.text,
          targetTab: 'quran',
          metadata: 'آية قرآنية'
        });
      }
    });

    // 2. Search Adhkar & Duas
    ADHKAR_DATA.forEach((cat) => {
      cat.items.forEach((item) => {
        const normTitle = normalizeArabic(item.title || '');
        const normText = normalizeArabic(item.text);
        const normReward = normalizeArabic(item.reward || '');
        const normCat = normalizeArabic(cat.arabicName);

        if (
          normTitle.includes(normalizedQuery) ||
          normText.includes(normalizedQuery) ||
          normReward.includes(normalizedQuery) ||
          normCat.includes(normalizedQuery)
        ) {
          searchResults.push({
            id: `adhkar_${item.id}`,
            type: 'adhkar',
            typeLabel: cat.arabicName,
            title: item.title || cat.arabicName,
            subtitle: item.reward ? `الفضل: ${item.reward}` : cat.description,
            content: item.text,
            reward: item.reward,
            targetTab: 'adhkar',
            metadata: `التكرار: ${item.count} مرات`
          });
        }
      });
    });

    // 3. Search Prayers & Events
    PRAYERS_AND_EVENTS_INDEX.forEach((item) => {
      const normTitle = normalizeArabic(item.title);
      const normSub = normalizeArabic(item.subtitle || '');
      const normContent = normalizeArabic(item.content || '');

      if (
        normTitle.includes(normalizedQuery) ||
        normSub.includes(normalizedQuery) ||
        normContent.includes(normalizedQuery)
      ) {
        searchResults.push(item);
      }
    });

    // Filter by active category if selected
    if (activeCategory !== 'all') {
      return searchResults.filter((item) => item.type === activeCategory);
    }

    return searchResults;
  }, [query, activeCategory]);

  // Copy handler for items
  const handleCopyText = (id: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setToastMessage('تم نسخ النص بنجاح 📋✨');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      setToastMessage('تعذر النسخ تلقائياً');
    }
  };

  // Play audio speech for ayahs / adhkar
  const handlePlayAudio = async (id: string, text: string) => {
    if (playingId === id) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setPlayingId(null);
      return;
    }
    setPlayingId(id);
    setToastMessage('جاري القراءة الصوتية... 🔊');
    const ok = await playSpiritualSpeech(text);
    if (!ok) setToastMessage('القراءة الصوتية غير متاحة في هذا المتصفح');
    setPlayingId(null);
  };

  // Click handler to navigate to target tab
  const handleItemClick = (item: SearchResultItem) => {
    saveSearchToHistory(query || item.title);
    setActiveTab(item.targetTab);
    onClose();
    setToastMessage(`تم الانتقال إلى قسم ${item.typeLabel} 🚀`);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 md:pt-16 px-3 pb-6" dir="rtl">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#121924] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] z-50"
          >
            {/* Header / Search Input */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 space-y-3">
              <div className="flex items-center gap-3">
                <div className="relative flex-1 flex items-center">
                  <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute start-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث عن آية، سورة، ذكر، دعاء، أو صلاة..."
                    autoFocus
                    className="w-full bg-white dark:bg-[#18212e] text-slate-800 dark:text-slate-100 text-sm font-extrabold ps-11 pe-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-inner"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      className="absolute end-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={onClose}
                  className="p-2.5 rounded-2xl bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                {[
                  { id: 'all', label: 'الكل' },
                  { id: 'quran', label: 'القرآن الكريم' },
                  { id: 'adhkar', label: 'الأذكار والأدعية' },
                  { id: 'prayers', label: 'المواقيت والسنن' },
                  { id: 'events', label: 'المناسبات والصيام' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id as SearchCategory)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-emerald-600 text-white font-black shadow-xs'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/40'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* If no search query yet -> Show Suggestions, Recent Searches & Fast Shortcuts */}
              {!query.trim() && (
                <div className="space-y-5 py-2">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <History className="w-4 h-4 text-emerald-500" />
                          <span>عمليات البحث الأخيرة</span>
                        </div>
                        <button
                          onClick={clearRecentSearches}
                          className="text-[10px] text-rose-500 hover:text-rose-600 flex items-center gap-1 font-extrabold cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>مسح السجل</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term, idx) => (
                          <button
                            key={idx}
                            onClick={() => setQuery(term)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <History className="w-3 h-3 text-slate-400" />
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400">
                      <Zap className="w-4 h-4 text-amber-500 fill-current" />
                      <span>مقترحات البحث السريع الشائعة</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {QUICK_SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuery(sug)}
                          className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <Search className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>استكشف محتويات التطبيق الشاملة</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-start">
                      <button
                        onClick={() => {
                          setActiveCategory('quran');
                          setQuery('سورة');
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs">
                          <BookOpen className="w-4 h-4" />
                          <span>القرآن الكريم (١١٤ سورة)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                          بحث في أسماء السور والآيات والمقاطع
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setActiveCategory('adhkar');
                          setQuery('أذكار');
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-xs">
                          <Sparkles className="w-4 h-4" />
                          <span>الأذكار والأدعية (١٧٦+)</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                          أذكار الصباح، المساء، النوم، والأدعية
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setActiveCategory('prayers');
                          setQuery('صلاة');
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs">
                          <Clock className="w-4 h-4" />
                          <span>الصلوات والسنن</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                          الفرائض، الضحى، قيام الليل، والوتر
                        </p>
                      </button>

                      <button
                        onClick={() => {
                          setActiveCategory('events');
                          setQuery('صيام');
                        }}
                        className="p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 border border-slate-200 dark:border-slate-700/50 rounded-2xl transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-black text-xs">
                          <Moon className="w-4 h-4" />
                          <span>الصيام والتقويم</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-1">
                          الأيام البيض، الإثنين والخميس، وعاشوراء
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Search Results List */}
              {query.trim() && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-500 dark:text-slate-400 px-1">
                    <span>نتائج البحث عن «{query}»</span>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                      {results.length} نتيجة
                    </span>
                  </div>

                  {results.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <Search className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-black text-slate-700 dark:text-slate-300">
                        لم نجد نتائج تطابق «{query}»
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        جرب البحث بكلمات أخرى مثل "الكهف"، "الصباح"، "الوتر"، "الضحى"
                      </p>
                    </div>
                  ) : (
                    results.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl transition-all group space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5 flex-1 cursor-pointer" onClick={() => handleItemClick(item)}>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                {item.typeLabel}
                              </span>
                              {item.metadata && (
                                <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-bold">
                                  • {item.metadata}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {item.title}
                            </h4>

                            {item.subtitle && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                                {item.subtitle}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {item.content && (
                              <>
                                <button
                                  onClick={() => handlePlayAudio(item.id, item.content || item.title)}
                                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                                    playingId === item.id
                                      ? 'bg-amber-500 text-slate-900 animate-pulse'
                                      : 'bg-slate-200/60 dark:bg-slate-700/60 hover:bg-amber-500 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                  }`}
                                  title="قراءة صوتية مباركة"
                                >
                                  {playingId === item.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                </button>

                                <button
                                  onClick={() => handleCopyText(item.id, item.content || item.title)}
                                  className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 hover:bg-emerald-500 text-slate-600 dark:text-slate-300 hover:text-white transition-all cursor-pointer"
                                  title="نسخ النص"
                                >
                                  {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => handleItemClick(item)}
                              className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black"
                              title="انتقال للقسم"
                            >
                              <span>عرض</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {item.content && (
                          <div 
                            onClick={() => handleItemClick(item)}
                            className="p-2.5 bg-white/80 dark:bg-slate-900/60 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-bold leading-relaxed border border-slate-200/50 dark:border-slate-800/80 cursor-pointer line-clamp-3"
                          >
                            {item.content}
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 font-bold flex items-center justify-between">
              <span>البحث الروحي الشامل • القرآن، الأذكار، المواقيت والتقويم</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black">هِمَّتِي 🕌</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SpiritualSearchModal;
