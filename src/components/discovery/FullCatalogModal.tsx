/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, Search, ChevronLeft } from 'lucide-react';
import { ALL_FEATURES } from '../../data/featureDiscoveryData';

interface FullCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFeature: (id: string, subTab?: string) => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: '🌟 الكل' },
  { id: 'salah', label: '🕌 الصلاة' },
  { id: 'quran', label: '📖 القرآن' },
  { id: 'fasting', label: '🌙 القيام' },
  { id: 'services', label: '📱 خدمات' },
];

export const FullCatalogModal: React.FC<FullCatalogModalProps> = ({
  isOpen,
  onClose,
  onSelectFeature,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const filteredFeatures = ALL_FEATURES.filter((f) => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      f.title.includes(searchQuery) ||
      f.subtitle.includes(searchQuery) ||
      f.categoryLabel.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-[#161d26] w-full max-w-2xl max-h-[85vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-end"
        >
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-600 text-white rounded-2xl">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800 dark:text-white">
                  كتالوج جميع مزايا تطبيق هِمَّتِي 🚀
                </h3>
                <p className="text-xs text-slate-400 font-medium">10 أدوات وخدمات متكاملة</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
            {/* Search & Categories */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`py-1 px-3 rounded-xl text-[11px] font-black transition-all cursor-pointer shrink-0 border ${
                      activeCategory === cat.id
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative shrink-0 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ابحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl pe-8 ps-3 py-1.5 text-[11px] font-bold outline-hidden"
                />
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredFeatures.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id + (item.subTab || '')}
                    className="bg-slate-50 dark:bg-[#111720] rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-2.5"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 bg-gradient-to-br ${item.gradient} text-white rounded-xl`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-white">
                            {item.title}
                          </h4>
                        </div>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
                        {item.subtitle}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectFeature(item.id, item.subTab);
                      }}
                      className="w-full py-1.5 px-3 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-black text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>فتح وتجربة الميزة</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FullCatalogModal;
