/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DhikrCategory, DhikrItem, isDhikrItemVisible, getDhikrItemRequiredCount } from '../utils/adhkarData';
import { PrayerKey } from '../utils/adhkarCalc';
import { trackFeatureCompletion } from '../utils/analyticsStorage';

export interface UseAdhkarCounterProps {
  dhikrLogs: Record<string, Record<string, number>>;
  setDhikrLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  todayStr: string;
  selectedPrayerForPostAdhkar: PrayerKey;
  selectedCategory: DhikrCategory | null;
  currentDhikrIdx: number;
  setCurrentDhikrIdx: React.Dispatch<React.SetStateAction<number>>;
  setShowCelebration: React.Dispatch<React.SetStateAction<boolean>>;
  triggerFeedback: (type: 'tap' | 'completed_dhikr' | 'completed_category') => void;
  handleSpawnTapParticles: () => void;
}

export function useAdhkarCounter({
  dhikrLogs,
  setDhikrLogs,
  todayStr,
  selectedPrayerForPostAdhkar,
  selectedCategory,
  currentDhikrIdx,
  setCurrentDhikrIdx,
  setShowCelebration,
  triggerFeedback,
  handleSpawnTapParticles,
}: UseAdhkarCounterProps) {
  const dayLogs = dhikrLogs[todayStr] || {};

  const getCategoryVisibleItems = (cat: DhikrCategory, prayerKey: PrayerKey = selectedPrayerForPostAdhkar) => {
    if (cat.id === 'after_prayer') {
      return cat.items.filter(it => isDhikrItemVisible(it, prayerKey));
    }
    return cat.items;
  };

  const getItemTargetCount = (catId: string, item: DhikrItem, prayerKey: PrayerKey = selectedPrayerForPostAdhkar) => {
    if (catId === 'after_prayer') {
      return getDhikrItemRequiredCount(item, prayerKey);
    }
    return item.count;
  };

  const getItemStorageKey = (catId: string, itemId: string, prayerKey: PrayerKey = selectedPrayerForPostAdhkar) => {
    if (catId === 'after_prayer') {
      return `${prayerKey}_${itemId}`;
    }
    return itemId;
  };

  const getItemCurrentCount = (catId: string, itemId: string, prayerKey: PrayerKey = selectedPrayerForPostAdhkar) => {
    const storageKey = getItemStorageKey(catId, itemId, prayerKey);
    return dayLogs[storageKey] !== undefined ? dayLogs[storageKey] : 0;
  };

  const updateItemCount = (cat: DhikrCategory, item: DhikrItem, delta: number = 1, setExact?: number) => {
    const storageKey = getItemStorageKey(cat.id, item.id, selectedPrayerForPostAdhkar);
    const visibleItems = getCategoryVisibleItems(cat, selectedPrayerForPostAdhkar);

    setDhikrLogs(prev => {
      const currentDay = prev[todayStr] || {};
      const currentItemCount = currentDay[storageKey] !== undefined ? currentDay[storageKey] : 0;
      
      let updatedCount = setExact !== undefined ? setExact : currentItemCount + delta;
      if (updatedCount < 0) updatedCount = 0;

      const updatedDay = {
        ...currentDay,
        [storageKey]: updatedCount
      };

      let completedCount = 0;
      visibleItems.forEach(it => {
        const k = getItemStorageKey(cat.id, it.id, selectedPrayerForPostAdhkar);
        const countVal = updatedDay[k] !== undefined ? updatedDay[k] : 0;
        const target = getItemTargetCount(cat.id, it, selectedPrayerForPostAdhkar);
        if (countVal >= target) {
          completedCount++;
        }
      });

      const catSummaryKey = cat.id === 'after_prayer' ? `after_prayer_${selectedPrayerForPostAdhkar}` : cat.id;
      updatedDay[catSummaryKey] = completedCount;

      if (completedCount === visibleItems.length && visibleItems.length > 0) {
        trackFeatureCompletion('adhkar');
      }

      return {
        ...prev,
        [todayStr]: updatedDay
      };
    });
  };

  const handleIncrementCategoryItem = (item: DhikrItem) => {
    if (!selectedCategory) return;
    const currentCount = getItemCurrentCount(selectedCategory.id, item.id);
    const targetCount = getItemTargetCount(selectedCategory.id, item, selectedPrayerForPostAdhkar);
    const visibleItems = getCategoryVisibleItems(selectedCategory, selectedPrayerForPostAdhkar);
    
    handleSpawnTapParticles();

    if (currentCount + 1 < targetCount) {
      triggerFeedback('tap');
      updateItemCount(selectedCategory, item, 1);
    } else {
      triggerFeedback('completed_dhikr');
      updateItemCount(selectedCategory, item, 1);

      let allDone = true;
      visibleItems.forEach(it => {
        const req = getItemTargetCount(selectedCategory.id, it, selectedPrayerForPostAdhkar);
        const countVal = it.id === item.id ? req : getItemCurrentCount(selectedCategory.id, it.id);
        if (countVal < req) allDone = false;
      });

      if (allDone) {
        triggerFeedback('completed_category');
        setShowCelebration(true);
      } else if (currentDhikrIdx + 1 < visibleItems.length) {
        let nextIdx = currentDhikrIdx + 1;
        while (nextIdx < visibleItems.length) {
          const nextItem = visibleItems[nextIdx];
          const req = getItemTargetCount(selectedCategory.id, nextItem, selectedPrayerForPostAdhkar);
          const c = getItemCurrentCount(selectedCategory.id, nextItem.id);
          if (c < req) {
            break;
          }
          nextIdx++;
        }
        if (nextIdx < visibleItems.length) {
          setCurrentDhikrIdx(nextIdx);
        }
      }
    }
  };

  const handleMarkItemDone = (cat: DhikrCategory, item: DhikrItem) => {
    const targetCount = getItemTargetCount(cat.id, item, selectedPrayerForPostAdhkar);
    const visibleItems = getCategoryVisibleItems(cat, selectedPrayerForPostAdhkar);

    triggerFeedback('completed_dhikr');
    updateItemCount(cat, item, 0, targetCount);

    let allDone = true;
    visibleItems.forEach(it => {
      const req = getItemTargetCount(cat.id, it, selectedPrayerForPostAdhkar);
      const c = it.id === item.id ? req : getItemCurrentCount(cat.id, it.id);
      if (c < req) allDone = false;
    });

    if (allDone) {
      triggerFeedback('completed_category');
      setShowCelebration(true);
    }
  };

  const handleMarkAllCategoryItemsDone = (cat: DhikrCategory) => {
    const visibleItems = getCategoryVisibleItems(cat, selectedPrayerForPostAdhkar);

    setDhikrLogs(prev => {
      const currentDay = { ...(prev[todayStr] || {}) };
      visibleItems.forEach(it => {
        const k = getItemStorageKey(cat.id, it.id, selectedPrayerForPostAdhkar);
        const target = getItemTargetCount(cat.id, it, selectedPrayerForPostAdhkar);
        currentDay[k] = target;
      });
      const catSummaryKey = cat.id === 'after_prayer' ? `after_prayer_${selectedPrayerForPostAdhkar}` : cat.id;
      currentDay[catSummaryKey] = visibleItems.length;
      return {
        ...prev,
        [todayStr]: currentDay
      };
    });

    triggerFeedback('completed_category');
    setShowCelebration(true);
  };

  const handleResetCategory = (cat: DhikrCategory) => {
    const visibleItems = getCategoryVisibleItems(cat, selectedPrayerForPostAdhkar);
    setDhikrLogs(prev => {
      const currentDay = { ...(prev[todayStr] || {}) };
      visibleItems.forEach(it => {
        const k = getItemStorageKey(cat.id, it.id, selectedPrayerForPostAdhkar);
        delete currentDay[k];
      });
      const catSummaryKey = cat.id === 'after_prayer' ? `after_prayer_${selectedPrayerForPostAdhkar}` : cat.id;
      delete currentDay[catSummaryKey];
      return {
        ...prev,
        [todayStr]: currentDay
      };
    });
    setCurrentDhikrIdx(0);
    setShowCelebration(false);
  };

  return {
    dayLogs,
    getCategoryVisibleItems,
    getItemTargetCount,
    getItemStorageKey,
    getItemCurrentCount,
    updateItemCount,
    handleIncrementCategoryItem,
    handleMarkItemDone,
    handleMarkAllCategoryItemsDone,
    handleResetCategory,
  };
}

export default useAdhkarCounter;
