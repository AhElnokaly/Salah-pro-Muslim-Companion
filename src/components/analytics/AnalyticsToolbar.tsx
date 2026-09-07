/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Grid, Trophy, Table, Target, Search } from 'lucide-react';

interface AnalyticsToolbarProps {
  viewMode: 'cards' | 'badges' | 'table' | 'nudges';
  setViewMode: (mode: 'cards' | 'badges' | 'table' | 'nudges') => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function AnalyticsToolbar({
  viewMode,
  setViewMode,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery
}: AnalyticsToolbarProps) {
  return (
    <div className="bg-white dark:bg-[#161d26] rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-xs">
      {/* View Switcher Tabs - Horizontal Scrollable */}
      <div className="bg-slate-100 dark:bg-[#111720] p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
        {[
          { id: 'cards' as const, label: 'بطاقات الخدمات 🎴', icon: Grid },
          { id: 'badges' as const, label: 'معرض الأوسمة 🏆', icon: Trophy },
          { id: 'table' as const, label: 'الجدول المطور 📊', icon: Table },
          { id: 'nudges' as const, label: 'التوجيهات والتحليلات 🎯', icon: Target }
        ].map(v => {
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setViewMode(v.id)}
              className={`py-2 px-3 sm:px-4 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                viewMode === v.id
                  ? 'bg-emerald-600 text-white shadow-xs scale-102'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar scroll-smooth">
          {[
            { id: 'all', label: '🌟 الكل' },
            { id: 'الصلاة', label: '🕌 الصلاة' },
            { id: 'القرآن والأذكار', label: '📖 القرآن والأذكار' },
            { id: 'القيام والصيام', label: '🌙 القيام والصيام' },
            { id: 'الخدمات الذكية', label: '📱 الخدمات الذكية' }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap border ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative shrink-0 sm:w-52">
          <Search className="w-4 h-4 text-slate-400 absolute end-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث عن ميزة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl pe-9 ps-3 py-2 text-xs font-bold outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
