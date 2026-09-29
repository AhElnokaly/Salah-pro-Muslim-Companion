/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DhikrCategory, DhikrItem, ADHKAR_DATA } from '../../utils/adhkarData';
import { PrayerKey } from '../../utils/adhkarCalc';
import { AdhkarHubHeader } from './hub/AdhkarHubHeader';
import { AdhkarSearchResultsList } from './hub/AdhkarSearchResultsList';
import { AdhkarMainSectionsGrid } from './hub/AdhkarMainSectionsGrid';
import { AdhkarSubCategoriesView } from './hub/AdhkarSubCategoriesView';
import { AyatKursiFeaturedCard } from './hub/AyatKursiFeaturedCard';

export interface AdhkarHubViewProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  searchResults: Array<{ category: DhikrCategory; item: DhikrItem; itemIndex: number }>;
  hubSection: 'main' | 'adhkar' | 'duas' | 'ruqyah' | 'hisn';
  onSelectHubSection: (section: 'main' | 'adhkar' | 'duas' | 'ruqyah' | 'hisn') => void;
  onSelectCategory: (category: DhikrCategory, itemIndex?: number) => void;
  onSelectTasbeehTab: () => void;
  favoriteDhikrIds: string[];
  favoriteCategoryIds: string[];
  onToggleFavoriteDhikr: (id: string, e: React.MouseEvent) => void;
  getCategoryVisibleItems: (cat: DhikrCategory, prayerKey?: PrayerKey | null) => DhikrItem[];
  activePrayerKey: PrayerKey | null;
  onOpenTimingModal?: (tab?: 'morning' | 'evening') => void;
}

export const AdhkarHubView: React.FC<AdhkarHubViewProps> = ({
  soundEnabled,
  onToggleSound,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  hubSection,
  onSelectHubSection,
  onSelectCategory,
  onSelectTasbeehTab,
  favoriteDhikrIds,
  favoriteCategoryIds,
  onToggleFavoriteDhikr,
  getCategoryVisibleItems,
  activePrayerKey,
  onOpenTimingModal,
}) => {
  const ayatKursiCategory = ADHKAR_DATA.find((c) => c.id === 'ayat_kursi') || ADHKAR_DATA[0];

  return (
    <>
      {/* Header Bar & Global Search Input */}
      <AdhkarHubHeader
        soundEnabled={soundEnabled}
        onToggleSound={onToggleSound}
        searchQuery={searchQuery}
        onSearchQueryChange={onSearchQueryChange}
      />

      {/* SEARCH RESULTS MODE */}
      {searchQuery.trim() ? (
        <AdhkarSearchResultsList
          searchQuery={searchQuery}
          searchResults={searchResults}
          favoriteDhikrIds={favoriteDhikrIds}
          onToggleFavoriteDhikr={onToggleFavoriteDhikr}
          onSelectCategory={onSelectCategory}
          onClearSearch={() => onSearchQueryChange('')}
        />
      ) : hubSection === 'main' ? (
        /* LEVEL 1: MAIN HUB GRID WITH AYAT AL-KURSI & TIMING SCHEDULE BAR */
        <div className="space-y-4">
          {/* Quick Schedule Access Banner */}
          {onOpenTimingModal && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-indigo-500/10 border border-slate-200/80 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  ⏰
                </div>
                <div>
                  <h4 className="font-black text-slate-800 dark:text-white">
                    التحكم بمواعيد أذكار الصباح والمساء
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    تحديد أوقات التذكير والتنبيه الصوتي اليومي (وقت محدد أو بعد الصلاة)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenTimingModal('morning')}
                  className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-extrabold flex items-center gap-1.5 border border-amber-500/30 transition-all cursor-pointer"
                >
                  <span>🌅 موعد الصباح</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTimingModal('evening')}
                  className="py-1.5 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-extrabold flex items-center gap-1.5 border border-indigo-500/30 transition-all cursor-pointer"
                >
                  <span>🌆 موعد المساء</span>
                </button>
              </div>
            </div>
          )}

          {/* Ayat Al-Kursi Featured Majestic Card */}
          <AyatKursiFeaturedCard
            ayatKursiCategory={ayatKursiCategory}
            onSelectCategory={onSelectCategory}
          />

          {/* Hub Sections */}
          <AdhkarMainSectionsGrid
            onSelectHubSection={onSelectHubSection}
            onSelectTasbeehTab={onSelectTasbeehTab}
          />
        </div>
      ) : (
        /* LEVEL 2: SECTION VIEW WITH CIRCULAR SUB-CATEGORIES */
        <AdhkarSubCategoriesView
          hubSection={hubSection}
          onBackToMainHub={() => onSelectHubSection('main')}
          onSelectCategory={onSelectCategory}
          getCategoryVisibleItems={getCategoryVisibleItems}
          favoriteCategoryIds={favoriteCategoryIds}
          activePrayerKey={activePrayerKey}
        />
      )}
    </>
  );
};

export default AdhkarHubView;
