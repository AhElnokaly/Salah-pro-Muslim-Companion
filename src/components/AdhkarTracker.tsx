/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { safeSetJSON, safeGetJSON } from '../utils/storage';
import type { PrayerTimes } from '../types';
import { ADHKAR_DATA, DhikrCategory, DhikrItem } from '../utils/adhkarData';
import { getSevenStationsProgress, SEVEN_STATIONS, PrayerKey, AdhkarStation } from '../utils/adhkarCalc';
import SmartAdhkarSuggestions from './SmartAdhkarSuggestions';
import SevenSegmentProgressBar from './adhkar/SevenSegmentProgressBar';
import ElectronicTasbeeh from './adhkar/ElectronicTasbeeh';
import AdhkarFocusModal from './adhkar/AdhkarFocusModal';
import DhikrCategoryDetailView from './adhkar/DhikrCategoryDetailView';
import DhikrFavoritesView from './adhkar/DhikrFavoritesView';
import AdhkarHubView from './adhkar/AdhkarHubView';
import AdhkarNavigationTabs from './adhkar/AdhkarNavigationTabs';
import PrayerAdhkarBanner from './adhkar/PrayerAdhkarBanner';
import { useAdhkarTasbeeh } from '../hooks/useAdhkarTasbeeh';
import { useAdhkarFeedback } from '../hooks/useAdhkarFeedback';
import { useAdhkarCounter } from '../hooks/useAdhkarCounter';
import { formatDateKey } from '../utils/prayerDayBoundary';

interface AdhkarTrackerProps {
  dhikrLogs: Record<string, Record<string, number>>;
  setDhikrLogs: React.Dispatch<React.SetStateAction<Record<string, Record<string, number>>>>;
  currentPrayer?: string;
  prayerTimes?: PrayerTimes;
  onNavigateTab?: (tab: string) => void;
  onOpenNotificationsModal?: () => void;
  targetPrayerKey?: PrayerKey | null;
}



export const PRAYER_SWITCHER: Array<{ key: PrayerKey; name: string; icon: string }> = [
  { key: 'fajr', name: 'الفجر', icon: '🌅' },
  { key: 'dhuhr', name: 'الظهر', icon: '☀️' },
  { key: 'asr', name: 'العصر', icon: '🌤️' },
  { key: 'maghrib', name: 'المغرب', icon: '🌆' },
  { key: 'isha', name: 'العشاء', icon: '🌌' },
];

export default function AdhkarTracker({
  dhikrLogs,
  setDhikrLogs,
  currentPrayer = 'Fajr',
  onNavigateTab,
  onOpenNotificationsModal,
  targetPrayerKey,
}: AdhkarTrackerProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'favorites' | 'smart_suggestions' | 'tasbeeh'>('categories');
  const [hubSection, setHubSection] = useState<'main' | 'adhkar' | 'duas' | 'ruqyah' | 'hisn'>('main');
  const [selectedCategory, setSelectedCategory] = useState<DhikrCategory | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Search & Font states
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState<'md' | 'lg' | 'xl'>('lg');
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);

  // Persistent Favorite Dhikr Category Pages list
  const [favoriteCategoryIds, setFavoriteCategoryIds] = useState<string[]>(() => {
    return safeGetJSON<string[]>('mc_favorite_dhikr_categories', ['morning', 'evening', 'after_prayer']);
  });

  useEffect(() => {
    safeSetJSON('mc_favorite_dhikr_categories', favoriteCategoryIds);
  }, [favoriteCategoryIds]);

  const toggleFavoriteCategory = (catId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteCategoryIds(prev =>
      prev.includes(catId)
        ? prev.filter(id => id !== catId)
        : [...prev, catId]
    );
    triggerFeedback('tap');
  };

  // Persistent Favorite Dhikrs list
  const [favoriteDhikrIds, setFavoriteDhikrIds] = useState<string[]>(() => {
    return safeGetJSON<string[]>('mc_favorite_dhikrs', []);
  });

  useEffect(() => {
    safeSetJSON('mc_favorite_dhikrs', favoriteDhikrIds);
  }, [favoriteDhikrIds]);

  const toggleFavoriteDhikr = (dhikrId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteDhikrIds(prev =>
      prev.includes(dhikrId)
        ? prev.filter(id => id !== dhikrId)
        : [...prev, dhikrId]
    );
    triggerFeedback('tap');
  };

  const allFavoriteDhikrObjects = useMemo(() => {
    if (favoriteDhikrIds.length === 0) return [];
    const result: Array<{ category: DhikrCategory; item: DhikrItem }> = [];
    ADHKAR_DATA.forEach(cat => {
      cat.items.forEach(item => {
        if (favoriteDhikrIds.includes(item.id)) {
          result.push({ category: cat, item });
        }
      });
    });
    return result;
  }, [favoriteDhikrIds]);

  const handleCopyText = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedItemId(id);
      setTimeout(() => setCopiedItemId(null), 2000);
    }
  };

  // Map string currentPrayer ('Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha') to PrayerKey
  const activePrayerKey: PrayerKey = useMemo(() => {
    const p = (currentPrayer || '').toLowerCase();
    if (p.includes('dhuhr') || p.includes('zuhr')) return 'dhuhr';
    if (p.includes('asr')) return 'asr';
    if (p.includes('maghrib')) return 'maghrib';
    if (p.includes('isha')) return 'isha';
    return 'fajr';
  }, [currentPrayer]);

  // Selected Prayer for Post-Prayer Adhkar (أذكار بعد الصلاة)
  const [selectedPrayerForPostAdhkar, setSelectedPrayerForPostAdhkar] = useState<PrayerKey>(activePrayerKey);

  // Keep post-prayer selection aligned when targetPrayerKey or current active prayer changes
  useEffect(() => {
    if (targetPrayerKey) {
      setSelectedPrayerForPostAdhkar(targetPrayerKey);
      const afterPrayerCat = ADHKAR_DATA.find(c => c.id === 'after_prayer');
      if (afterPrayerCat) {
        setSelectedCategory(afterPrayerCat);
        setActiveTab('categories');
        setViewMode('cards');
        setCurrentDhikrIdx(0);
      }
    } else {
      setSelectedPrayerForPostAdhkar(activePrayerKey);
    }
  }, [targetPrayerKey, activePrayerKey]);

  // States for Category Sequence Reader
  const [currentDhikrIdx, setCurrentDhikrIdx] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);


  // Computed global search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.trim().toLowerCase();
    const results: Array<{ category: DhikrCategory; item: DhikrItem; itemIndex: number }> = [];

    ADHKAR_DATA.forEach(cat => {
      cat.items.forEach((item, idx) => {
        if (
          (item.title && item.title.toLowerCase().includes(query)) ||
          (item.text && item.text.toLowerCase().includes(query)) ||
          (item.reward && item.reward.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (cat.arabicName && cat.arabicName.toLowerCase().includes(query))
        ) {
          results.push({ category: cat, item, itemIndex: idx });
        }
      });
    });
    return results;
  }, [searchQuery]);

  // States for interactive particles
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; text: string }>>([]);

  const todayStr = formatDateKey(new Date());

  // Audio and Haptic Feedback Hook
  const { triggerFeedback } = useAdhkarFeedback(soundEnabled);

  const spawnParticle = (text: string) => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 - 40;
    const y = -40 - Math.random() * 30;
    const newParticle = { id, x, y, text };
    setParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id));
    }, 900);
  };

  const handleSpawnTapParticles = () => {
    const sparks = ['+١', '✨', '🤍', '📿', 'أجر', 'نور'];
    const randomSpark = sparks[Math.floor(Math.random() * sparks.length)];
    spawnParticle(randomSpark);
  };

  const tasbeeh = useAdhkarTasbeeh({
    triggerFeedback,
    onSpawnTapParticles: handleSpawnTapParticles,
  });

  const {
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
  } = useAdhkarCounter({
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
  });

  // Select station from 7-Segment Bar
  const handleStationSelect = (station: AdhkarStation) => {
    const cat = ADHKAR_DATA.find(c => c.id === station.categoryType);
    if (cat) {
      if (station.prayerKey) {
        setSelectedPrayerForPostAdhkar(station.prayerKey);
      }
      setSelectedCategory(cat);
      setCurrentDhikrIdx(0);
      setShowCelebration(false);
      setViewMode('cards');
    }
  };

  return (
    <div id="adhkar-tracker-root" className="space-y-6 text-right" dir="rtl">
      
      {/* Header Navigation Tabs */}
      {!selectedCategory && (
        <AdhkarNavigationTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          favoritesCount={favoriteCategoryIds.length + favoriteDhikrIds.length}
        />
      )}

      {/* VIEW: Favorite Dhikrs & Categories Tab */}
      {activeTab === 'favorites' && !selectedCategory && (
        <DhikrFavoritesView
          favoriteCategoryIds={favoriteCategoryIds}
          favoriteDhikrIds={favoriteDhikrIds}
          allFavoriteDhikrObjects={allFavoriteDhikrObjects}
          fontSize={fontSize}
          copiedItemId={copiedItemId}
          activePrayerKey={activePrayerKey}
          selectedPrayerForPostAdhkar={selectedPrayerForPostAdhkar}
          getItemCurrentCount={getItemCurrentCount}
          getItemTargetCount={getItemTargetCount}
          getCategoryVisibleItems={getCategoryVisibleItems}
          toggleFavoriteCategory={toggleFavoriteCategory}
          toggleFavoriteDhikr={toggleFavoriteDhikr}
          onOpenCategoryCards={(cat) => {
            setSelectedCategory(cat);
            setViewMode('cards');
            setCurrentDhikrIdx(0);
            setShowCelebration(false);
          }}
          onOpenCategoryList={(cat) => {
            setSelectedCategory(cat);
            setViewMode('list');
            setShowCelebration(false);
          }}
          onIncrementItem={(cat, item) => updateItemCount(cat, item, 1)}
          onCopyText={handleCopyText}
          onMarkItemDone={handleMarkItemDone}
        />
      )}

      {/* VIEW: Main Categories List with 7-Segment Progress Bar */}
      {activeTab === 'categories' && !selectedCategory && (
        <div className="space-y-6">
          
          {/* THE 7-SEGMENT DAILY PROGRESS BAR */}
          <SevenSegmentProgressBar 
            dayLogs={dayLogs}
            activePrayerKey={activePrayerKey}
            onStationSelect={handleStationSelect}
          />

          {/* Contextual Smart Suggestion Banner */}
          <PrayerAdhkarBanner
            activePrayerKey={activePrayerKey}
            onStartPrayerAdhkar={() => {
              const targetStation = SEVEN_STATIONS.find(s => s.prayerKey === activePrayerKey) || SEVEN_STATIONS[0];
              handleStationSelect(targetStation);
            }}
          />

          {/* Adhkar Hub: Search, 5 Main Sections & Level-2 Circular Categories */}
          <AdhkarHubView
            soundEnabled={soundEnabled}
            onToggleSound={() => setSoundEnabled(prev => !prev)}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchResults={searchResults}
            hubSection={hubSection}
            onSelectHubSection={setHubSection}
            onSelectCategory={(cat, itemIndex) => {
              setSelectedCategory(cat);
              if (itemIndex !== undefined) {
                setViewMode('cards');
                setCurrentDhikrIdx(itemIndex);
              } else {
                setViewMode('cards');
                setCurrentDhikrIdx(0);
              }
              setShowCelebration(false);
            }}
            onSelectTasbeehTab={() => setActiveTab('tasbeeh')}
            favoriteDhikrIds={favoriteDhikrIds}
            favoriteCategoryIds={favoriteCategoryIds}
            onToggleFavoriteDhikr={toggleFavoriteDhikr}
            getCategoryVisibleItems={getCategoryVisibleItems}
            activePrayerKey={activePrayerKey}
          />
        </div>
      )}

      {/* VIEW: Selected Category Details */}
      {selectedCategory && (
        <DhikrCategoryDetailView
          category={selectedCategory}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          fontSize={fontSize}
          onChangeFontSize={setFontSize}
          selectedPrayerForPostAdhkar={selectedPrayerForPostAdhkar}
          activePrayerKey={activePrayerKey}
          prayerSwitcher={PRAYER_SWITCHER}
          onBack={() => setSelectedCategory(null)}
          onMarkAllDone={() => handleMarkAllCategoryItemsDone(selectedCategory)}
          onOpenFocusMode={() => setIsFocusMode(true)}
          onResetCategory={() => handleResetCategory(selectedCategory)}
          onSelectPostPrayer={(prayerKey) => {
            setSelectedPrayerForPostAdhkar(prayerKey);
            setCurrentDhikrIdx(0);
            setShowCelebration(false);
          }}
          getItemCurrentCount={getItemCurrentCount}
          getItemTargetCount={getItemTargetCount}
          getCategoryVisibleItems={getCategoryVisibleItems}
          showCelebration={showCelebration}
          onReturnFromCelebration={() => setSelectedCategory(null)}
          currentDhikrIdx={currentDhikrIdx}
          setCurrentDhikrIdx={setCurrentDhikrIdx}
          favoriteDhikrIds={favoriteDhikrIds}
          onToggleFavoriteDhikr={toggleFavoriteDhikr}
          copiedItemId={copiedItemId}
          onCopyText={handleCopyText}
          particles={particles}
          onIncrementItem={handleIncrementCategoryItem}
          onMarkItemDone={handleMarkItemDone}
        />
      )}

      {/* VIEW: Smart Suggestions & AI Assistant */}
      {activeTab === 'smart_suggestions' && (
        <SmartAdhkarSuggestions
          onAddToCustomTasbeeh={(text) => {
            tasbeeh.addCustomTasbeeh(text);
            setActiveTab('tasbeeh');
          }}
          onNavigateTab={(tab) => {
            if (tab === 'adhkar' || tab === 'categories' || tab === 'stations') {
              setActiveTab('categories');
            } else if (tab === 'tasbeeh') {
              setActiveTab('tasbeeh');
            } else if (onNavigateTab) {
              onNavigateTab(tab);
            }
          }}
          onOpenNotificationsModal={() => {
            if (onOpenNotificationsModal) {
              onOpenNotificationsModal();
            } else {
              window.dispatchEvent(new CustomEvent('open-spiritual-notifications'));
            }
          }}
          completedStationsCount={
            getSevenStationsProgress(dayLogs, activePrayerKey).completedStationsCount
          }
          activePrayerName={activePrayerKey}
          isPushGranted={'Notification' in window && Notification.permission === 'granted'}
        />
      )}

      {/* VIEW: Electronic Tasbeeh (المسبحة الإلكترونية) */}
      {activeTab === 'tasbeeh' && (
        <ElectronicTasbeeh tasbeeh={tasbeeh} />
      )}

      {/* Fullscreen Focus Mode Modal */}
      <AdhkarFocusModal
        isOpen={isFocusMode}
        selectedCategory={selectedCategory}
        selectedPrayerForPostAdhkar={selectedPrayerForPostAdhkar}
        currentDhikrIdx={currentDhikrIdx}
        onClose={() => setIsFocusMode(false)}
        onPrevDhikr={() => setCurrentDhikrIdx((prev) => Math.max(0, prev - 1))}
        onNextDhikr={() => {
          if (selectedCategory) {
            const count = getCategoryVisibleItems(selectedCategory, selectedPrayerForPostAdhkar).length;
            setCurrentDhikrIdx((prev) => Math.min(count - 1, prev + 1));
          }
        }}
        onIncrementItem={handleIncrementCategoryItem}
        getItemCurrentCount={getItemCurrentCount}
        getItemTargetCount={getItemTargetCount}
        getCategoryVisibleItems={getCategoryVisibleItems}
      />

    </div>
  );
}
