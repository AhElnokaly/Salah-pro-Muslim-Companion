/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { safeSetJSON, safeGetJSON, safeRemoveItem } from '../utils/storage';
import { motion, AnimatePresence } from 'motion/react';
import { Search } from 'lucide-react';
import { TabId } from '../types';
import { SURAHS_LIST, SAMPLE_AYAHS } from '../data/quranData';
import { ADHKAR_DATA } from '../utils/adhkarData';
import { playSpiritualSpeech } from '../utils/spiritualAudio';
import {
  SearchCategory,
  SearchResultItem,
  PRAYERS_AND_EVENTS_INDEX,
  normalizeArabic,
} from '../data/spiritualSearchData';
import SearchResultCard from './search/SearchResultCard';
import SearchHeaderInput from './search/SearchHeaderInput';
import SearchDiscoverySection from './search/SearchDiscoverySection';

export interface SpiritualSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: TabId) => void;
  setToastMessage: (msg: string | null) => void;
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
    const stored = safeGetJSON<string[]>(RECENT_SEARCHES_KEY, []);
    setRecentSearches(stored);
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
    safeRemoveItem(RECENT_SEARCHES_KEY);
    setToastMessage('تم مسح سجل البحث بنجاح 🧹');
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
    } catch {
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
            role="dialog"
            aria-modal="true"
            aria-label="نافذة البحث الروحي الشامل"
            className="relative w-full max-w-2xl bg-white dark:bg-[#121924] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] z-50"
          >
            {/* Header / Search Input & Filters */}
            <SearchHeaderInput
              query={query}
              setQuery={setQuery}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onClose={onClose}
            />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* If no search query yet -> Show Suggestions, Recent Searches & Fast Shortcuts */}
              {!query.trim() && (
                <SearchDiscoverySection
                  recentSearches={recentSearches}
                  onSelectTerm={(term) => setQuery(term)}
                  onClearRecentSearches={clearRecentSearches}
                  onSelectCategoryExplore={(cat, initialQuery) => {
                    setActiveCategory(cat);
                    setQuery(initialQuery);
                  }}
                />
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
                        <Search className="w-6 h-6" aria-hidden="true" />
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
                      <SearchResultCard
                        key={item.id}
                        item={item}
                        playingId={playingId}
                        copiedId={copiedId}
                        onItemClick={handleItemClick}
                        onPlayAudio={handlePlayAudio}
                        onCopyText={handleCopyText}
                      />
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
