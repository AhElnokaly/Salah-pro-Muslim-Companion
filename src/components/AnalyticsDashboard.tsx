/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  getWomenExcuseMode,
  setWomenExcuseMode
} from '../utils/analyticsStorage';
import {
  getCardSummaries,
  getTopFeaturePraise,
  getSmartFeatureNudges,
  type CardFeatureSummaryItem,
  type FeaturePraiseInfo,
  type FeatureNudgeInfo
} from '../utils/analyticsEngine';
import AnalyticsHero from './analytics/AnalyticsHero';
import AnalyticsToolbar from './analytics/AnalyticsToolbar';
import FeatureCardsView from './analytics/FeatureCardsView';
import BadgesGalleryView from './analytics/BadgesGalleryView';
import AnalyticsTableView from './analytics/AnalyticsTableView';
import SmartNudgesView from './analytics/SmartNudgesView';

interface AnalyticsDashboardProps {
  onSelectTab: (tab: string, subTab?: string) => void;
}

export default function AnalyticsDashboard({ onSelectTab }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
  const [viewMode, setViewMode] = useState<'cards' | 'badges' | 'table' | 'nudges'>('cards');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTierFilter, setSelectedTierFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cardSummaries, setCardSummaries] = useState<CardFeatureSummaryItem[]>([]);
  const [topPraise, setTopPraise] = useState<FeaturePraiseInfo | null>(null);
  const [smartNudges, setSmartNudges] = useState<FeatureNudgeInfo[]>([]);
  const [womenExcuse, setWomenExcuse] = useState<boolean>(false);

  const refreshData = () => {
    const cards = getCardSummaries(period);
    setCardSummaries(cards);
    setTopPraise(getTopFeaturePraise(period));
    setSmartNudges(getSmartFeatureNudges(period));
    setWomenExcuse(getWomenExcuseMode());
  };

  useEffect(() => {
    refreshData();

    const handleUpdate = () => {
      refreshData();
    };

    window.addEventListener('analytics-updated', handleUpdate);
    return () => {
      window.removeEventListener('analytics-updated', handleUpdate);
    };
  }, [period]);

  const handleToggleExcuse = (active: boolean) => {
    setWomenExcuse(active);
    setWomenExcuseMode(active);
  };

  // Filter cards
  const filteredCards = cardSummaries.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.feature.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      item.feature.name.includes(searchQuery) ||
      item.feature.description.includes(searchQuery) ||
      item.feature.completionCriteria.includes(searchQuery);
    const matchesTier = selectedTierFilter === 'all' || item.badgeTier.tierLevel === selectedTierFilter;
    return matchesCategory && matchesSearch && matchesTier;
  });

  // Calculate high level totals
  const totalLifetimeUsage = cardSummaries.reduce((acc, curr) => acc + curr.lifetimeCount, 0);
  const totalLifetime100 = cardSummaries.reduce((acc, curr) => acc + curr.lifetime100Completion, 0);
  const totalTodayUsage = cardSummaries.reduce((acc, curr) => acc + curr.todayCount, 0);
  const totalTodayCompletion = cardSummaries.reduce((acc, curr) => acc + curr.todayCompletion, 0);

  // Badge tier counters
  const crystalCount = cardSummaries.filter(c => c.badgeTier.tierLevel === 4).length;
  const goldCount = cardSummaries.filter(c => c.badgeTier.tierLevel === 3).length;
  const silverCount = cardSummaries.filter(c => c.badgeTier.tierLevel === 2).length;
  const bronzeCount = cardSummaries.filter(c => c.badgeTier.tierLevel === 1).length;

  return (
    <div className="space-y-6 text-end animate-fade-in pb-12" id="analytics-dashboard-root">
      {/* 1. HERO BANNER & OVERVIEW STATS */}
      <AnalyticsHero
        period={period}
        setPeriod={setPeriod}
        womenExcuse={womenExcuse}
        onToggleExcuse={handleToggleExcuse}
        totalLifetimeUsage={totalLifetimeUsage}
        totalLifetime100={totalLifetime100}
        totalTodayUsage={totalTodayUsage}
        totalTodayCompletion={totalTodayCompletion}
        crystalCount={crystalCount}
      />

      {/* 2. VIEW MODE & FILTER TOOLBAR */}
      <AnalyticsToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* 3. VIEW CONTENT AREA */}
      <AnimatePresence mode="wait">
        {/* VIEW 1: INTERACTIVE FEATURE CARDS GRID */}
        {viewMode === 'cards' && (
          <FeatureCardsView
            key="cards-view"
            filteredCards={filteredCards}
            onSelectTab={onSelectTab}
          />
        )}

        {/* VIEW 2: GAMIFIED BADGES SHOWCASE GALLERY */}
        {viewMode === 'badges' && (
          <BadgesGalleryView
            key="badges-view"
            filteredCards={filteredCards}
            cardSummaries={cardSummaries}
            selectedTierFilter={selectedTierFilter}
            setSelectedTierFilter={setSelectedTierFilter}
            crystalCount={crystalCount}
            goldCount={goldCount}
            silverCount={silverCount}
            bronzeCount={bronzeCount}
            onSelectTab={onSelectTab}
          />
        )}

        {/* VIEW 3: MODERN TABLE VIEW */}
        {viewMode === 'table' && (
          <AnalyticsTableView
            key="table-view"
            filteredCards={filteredCards}
            onSelectTab={onSelectTab}
          />
        )}

        {/* VIEW 4: SMART NUDGES & RECOMMENDATIONS */}
        {viewMode === 'nudges' && (
          <SmartNudgesView
            key="nudges-view"
            topPraise={topPraise}
            smartNudges={smartNudges}
            onSelectTab={onSelectTab}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
