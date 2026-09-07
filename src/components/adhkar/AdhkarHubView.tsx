/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DhikrCategory, DhikrItem } from '../../utils/adhkarData';
import { PrayerKey } from '../../utils/adhkarCalc';
import { AdhkarHubHeader } from './hub/AdhkarHubHeader';
import { AdhkarSearchResultsList } from './hub/AdhkarSearchResultsList';
import { AdhkarMainSectionsGrid } from './hub/AdhkarMainSectionsGrid';
import { AdhkarSubCategoriesView } from './hub/AdhkarSubCategoriesView';

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
}) => {
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
        /* LEVEL 1: MAIN HUB GRID */
        <AdhkarMainSectionsGrid
          onSelectHubSection={onSelectHubSection}
          onSelectTasbeehTab={onSelectTasbeehTab}
        />
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
