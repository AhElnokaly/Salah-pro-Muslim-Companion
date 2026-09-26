/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { BarChart3, Sparkles } from 'lucide-react';
import AnalyticsToolbar from './analytics/AnalyticsToolbar';
import FeatureCardsView from './analytics/FeatureCardsView';
import AnalyticsTableView from './analytics/AnalyticsTableView';
import SmartNudgesView from './analytics/SmartNudgesView';
import {
  getCardSummaries,
  getTopPraise,
  getSmartNudges,
  CardFeatureSummaryItem,
} from '../utils/analyticsEngine';

export interface AnalyticsDashboardProps {
  onSelectTab: (tab: string, subTab?: string) => void;
}

export default function AnalyticsDashboard({ onSelectTab }: AnalyticsDashboardProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'badges' | 'table' | 'nudges'>('cards');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const allCards = useMemo(() => getCardSummaries('weekly'), []);
  const topPraise = useMemo(() => getTopPraise(), []);
  const smartNudges = useMemo(() => getSmartNudges(), []);

  const filteredCards = useMemo(() => {
    return allCards.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.feature.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesTitle = item.feature.title.toLowerCase().includes(query);
        const matchesDesc = item.feature.description.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });
  }, [allCards, selectedCategory, searchQuery]);

  return (
    <div className="pb-16 space-y-5 animate-fade-in" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-indigo-950 rounded-3xl p-6 text-white border border-emerald-500/20 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/15">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">لوحة الإحصائيات والإنجاز الإيماني</h1>
            <p className="text-xs text-emerald-200/80 font-medium mt-0.5">
              تتبع عباداتك، طاعاتك، واستمرارية عاداتك الإيمانية المباركة
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <AnalyticsToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* View Mode Outlets */}
      {(viewMode === 'cards' || viewMode === 'badges') && (
        <FeatureCardsView
          filteredCards={filteredCards}
          onSelectTab={onSelectTab}
        />
      )}

      {viewMode === 'table' && (
        <AnalyticsTableView
          filteredCards={filteredCards}
          onSelectTab={onSelectTab}
        />
      )}

      {viewMode === 'nudges' && (
        <SmartNudgesView
          topPraise={topPraise}
          smartNudges={smartNudges}
          onSelectTab={onSelectTab}
        />
      )}
    </div>
  );
}
