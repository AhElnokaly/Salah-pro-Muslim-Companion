/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DhikrCategory, DhikrItem } from '../../utils/adhkarData';
import { PrayerKey } from '../../utils/adhkarCalc';
import { DhikrCategoryHeader, PrayerSwitcherItem } from './DhikrCategoryHeader';
import { DhikrStepCard } from './DhikrStepCard';
import { DhikrListItem } from './DhikrListItem';
import { DhikrCelebration } from './DhikrCelebration';

export interface DhikrCategoryDetailViewProps {
  category: DhikrCategory;
  viewMode: 'cards' | 'list';
  onChangeViewMode: (mode: 'cards' | 'list') => void;
  fontSize: 'md' | 'lg' | 'xl';
  onChangeFontSize: (size: 'md' | 'lg' | 'xl') => void;
  selectedPrayerForPostAdhkar: PrayerKey;
  activePrayerKey: string | null;
  prayerSwitcher: PrayerSwitcherItem[];
  onBack: () => void;
  onMarkAllDone: () => void;
  onOpenFocusMode: () => void;
  onResetCategory: () => void;
  onSelectPostPrayer: (prayerKey: PrayerKey) => void;
  getItemCurrentCount: (catId: string, itemId: string, prayerKey?: PrayerKey) => number;
  getItemTargetCount: (catId: string, item: DhikrItem, prayerKey?: PrayerKey) => number;
  getCategoryVisibleItems: (cat: DhikrCategory, prayerKey?: PrayerKey) => DhikrItem[];
  showCelebration: boolean;
  onReturnFromCelebration: () => void;
  currentDhikrIdx: number;
  setCurrentDhikrIdx: React.Dispatch<React.SetStateAction<number>>;
  favoriteDhikrIds: string[];
  onToggleFavoriteDhikr: (id: string, e?: React.MouseEvent) => void;
  copiedItemId: string | null;
  onCopyText: (text: string, id: string) => void;
  particles: Array<{ id: number; text: string; x: number; y: number }>;
  onIncrementItem: (item: DhikrItem) => void;
  onMarkItemDone: (category: DhikrCategory, item: DhikrItem) => void;
}

export const DhikrCategoryDetailView: React.FC<DhikrCategoryDetailViewProps> = ({
  category,
  viewMode,
  onChangeViewMode,
  fontSize,
  onChangeFontSize,
  selectedPrayerForPostAdhkar,
  activePrayerKey,
  prayerSwitcher,
  onBack,
  onMarkAllDone,
  onOpenFocusMode,
  onResetCategory,
  onSelectPostPrayer,
  getItemCurrentCount,
  getItemTargetCount,
  getCategoryVisibleItems,
  showCelebration,
  onReturnFromCelebration,
  currentDhikrIdx,
  setCurrentDhikrIdx,
  favoriteDhikrIds,
  onToggleFavoriteDhikr,
  copiedItemId,
  onCopyText,
  particles,
  onIncrementItem,
  onMarkItemDone,
}) => {
  const visibleCategoryItems = getCategoryVisibleItems(category, selectedPrayerForPostAdhkar);

  return (
    <div className="space-y-5">
      <DhikrCategoryHeader
        category={category}
        viewMode={viewMode}
        fontSize={fontSize}
        selectedPrayerForPostAdhkar={selectedPrayerForPostAdhkar}
        activePrayerKey={activePrayerKey}
        prayerSwitcher={prayerSwitcher}
        onBack={onBack}
        onChangeViewMode={onChangeViewMode}
        onChangeFontSize={onChangeFontSize}
        onMarkAllDone={onMarkAllDone}
        onOpenFocusMode={onOpenFocusMode}
        onResetCategory={onResetCategory}
        onSelectPostPrayer={onSelectPostPrayer}
        getItemCurrentCount={getItemCurrentCount}
        getItemTargetCount={getItemTargetCount}
        getCategoryVisibleItems={getCategoryVisibleItems}
      />

      {!showCelebration ? (
        <>
          {/* MODE 1: Interactive Step-by-Step Cards */}
          {viewMode === 'cards' && (() => {
            const safeDhikrIdx = Math.min(currentDhikrIdx, Math.max(0, visibleCategoryItems.length - 1));
            const currentItem = visibleCategoryItems[safeDhikrIdx] || visibleCategoryItems[0];
            if (!currentItem) return null;

            const currentCount = getItemCurrentCount(category.id, currentItem.id, selectedPrayerForPostAdhkar);
            const targetCount = getItemTargetCount(category.id, currentItem, selectedPrayerForPostAdhkar);
            const isCompleted = currentCount >= targetCount;
            const isFavorited = favoriteDhikrIds.includes(currentItem.id);

            return (
              <DhikrStepCard
                currentItem={currentItem}
                safeDhikrIdx={safeDhikrIdx}
                totalItems={visibleCategoryItems.length}
                currentCount={currentCount}
                targetCount={targetCount}
                isCompleted={isCompleted}
                isFavorited={isFavorited}
                fontSize={fontSize}
                isCopied={copiedItemId === currentItem.id}
                particles={particles}
                onToggleFavorite={(e) => onToggleFavoriteDhikr(currentItem.id, e)}
                onCopyText={() => onCopyText(currentItem.text, currentItem.id)}
                onIncrement={() => onIncrementItem(currentItem)}
                onMarkDone={() => onMarkItemDone(category, currentItem)}
                onPrev={() => setCurrentDhikrIdx((prev) => Math.max(0, prev - 1))}
                onNext={() => setCurrentDhikrIdx((prev) => Math.min(visibleCategoryItems.length - 1, prev + 1))}
              />
            );
          })()}

          {/* MODE 2: Full List Mode */}
          {viewMode === 'list' && (
            <div className="space-y-4">
              {visibleCategoryItems.map((item, idx) => {
                const currentCount = getItemCurrentCount(category.id, item.id, selectedPrayerForPostAdhkar);
                const targetCount = getItemTargetCount(category.id, item, selectedPrayerForPostAdhkar);
                const isCompleted = currentCount >= targetCount;
                const isFavorited = favoriteDhikrIds.includes(item.id);

                return (
                  <DhikrListItem
                    key={item.id}
                    item={item}
                    idx={idx}
                    currentCount={currentCount}
                    targetCount={targetCount}
                    isCompleted={isCompleted}
                    isFavorited={isFavorited}
                    fontSize={fontSize}
                    isCopied={copiedItemId === item.id}
                    onToggleFavorite={(e) => onToggleFavoriteDhikr(item.id, e)}
                    onCopyText={() => onCopyText(item.text, item.id)}
                    onIncrement={() => onIncrementItem(item)}
                    onMarkDone={() => onMarkItemDone(category, item)}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : (
        <DhikrCelebration
          categoryArabicName={category.arabicName}
          isAfterPrayer={category.id === 'after_prayer'}
          postPrayerName={prayerSwitcher.find((p) => p.key === selectedPrayerForPostAdhkar)?.name}
          onReturn={onReturnFromCelebration}
        />
      )}
    </div>
  );
};

export default DhikrCategoryDetailView;
