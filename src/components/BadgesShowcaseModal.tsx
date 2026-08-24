/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Flame, 
  Calendar, 
  ShieldCheck, 
  Star, 
  ArrowLeft,
  ChevronLeft,
  Info
} from 'lucide-react';
import { 
  PROGRESS_TIERS_MAP, 
  ProgressTierInfo, 
  UnifiedPeriodProgress 
} from '../utils/progressEngine';
import { toArabicNumbers } from '../utils/hijri';
import darkMosqueBackdrop from '../assets/images/mosque_backdrop_dark.jpg';

interface BadgesShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressData: Record<'daily' | 'weekly' | 'monthly', UnifiedPeriodProgress>;
  hijriDateStr?: string;
  onNavigateTab?: (tab: string) => void;
}

export default function BadgesShowcaseModal({
  isOpen,
  onClose,
  progressData,
  hijriDateStr = '',
  onNavigateTab
}: BadgesShowcaseModalProps) {
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  if (!isOpen) return null;

  const currentPeriodProgress = progressData[selectedTab];
  const overallTier = currentPeriodProgress.overallTier;

  // Count total badges earned across all tiers
  const allItems = [
    ...progressData.daily.items,
    ...progressData.weekly.items,
    ...progressData.monthly.items
  ];

  const crystalAndAboveCount = allItems.filter(i => i.tier.tierLevel >= 5).length;
  const goldAndAboveCount = allItems.filter(i => i.tier.tierLevel >= 4).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-sans" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-5 relative overflow-hidden shrink-0">
            {/* Ambient Mosque Watermark */}
            <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden select-none">
              <img 
                src={darkMosqueBackdrop} 
                alt="Grand Mosque" 
                className="w-full h-full object-cover object-center scale-105 filter blur-[0.3px]" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-transparent to-slate-950/80" />
            </div>

            <div className="absolute -start-12 -bottom-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 shadow-lg text-2xl font-black shrink-0 animate-bounce">
                  🏆
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>معرض الأوسمة والإتقان الإيماني</span>
                  </h2>
                  <p className="text-xs text-emerald-200/90 font-medium mt-0.5">
                    تتويج طاعاتك اليومية والأسبوعية والشهرية بالأوسمة الملونة
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stats Summary Bar */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10">
                <span className="text-[10px] text-emerald-200 block font-bold">الأوسمة الكريستالية 💎</span>
                <span className="text-sm font-black text-amber-300 font-mono">{toArabicNumbers(crystalAndAboveCount)}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10">
                <span className="text-[10px] text-emerald-200 block font-bold">الأوسمة الذهبية 🥇</span>
                <span className="text-sm font-black text-amber-300 font-mono">{toArabicNumbers(goldAndAboveCount)}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/10">
                <span className="text-[10px] text-emerald-200 block font-bold">الدرجة الإجمالية ✨</span>
                <span className="text-sm font-black text-amber-300 font-mono">{toArabicNumbers(currentPeriodProgress.overallPercentage)}%</span>
              </div>
            </div>
          </div>

          {/* Timeframe Selector Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
            {(['daily', 'weekly', 'monthly'] as const).map(period => (
              <button
                key={period}
                type="button"
                onClick={() => setSelectedTab(period)}
                className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedTab === period
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {period === 'daily' ? 'الأوسمة اليومية' : period === 'weekly' ? 'الأوسمة الأسبوعية' : 'الأوسمة الشهرية'}
                </span>
              </button>
            ))}
          </div>

          {/* Scrollable Content */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1">
            
            {/* Overall Status Badge Banner */}
            <div className={`p-4 rounded-2xl border ${overallTier.colorClasses.bg} ${overallTier.colorClasses.border} flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm`}>
              <div className="flex items-center gap-3 text-end">
                <div className={`w-12 h-12 rounded-2xl ${overallTier.colorClasses.badgeBg} flex items-center justify-center text-2xl shrink-0 ${overallTier.colorClasses.glow}`}>
                  {overallTier.badgeSymbol}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block">
                    الوسام الإجمالي لـ {selectedTab === 'daily' ? 'اليوم' : selectedTab === 'weekly' ? 'الأسبوع' : 'الشهر'}
                  </span>
                  <h3 className={`text-base font-black ${overallTier.colorClasses.text}`}>
                    {overallTier.title}
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium italic mt-0.5">
                    "{overallTier.quranQuote}"
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-start shrink-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block">نسبة الإنجاز</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {toArabicNumbers(currentPeriodProgress.overallPercentage)}%
                </span>
              </div>
            </div>

            {/* List of 5 Core Progress Badges for Selected Period */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                بادجات العبادات الخمس الأساسية
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPeriodProgress.items.map(item => {
                  const tier = item.tier;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onClose();
                        if (onNavigateTab) {
                          if (item.id === 'salah' || item.id === 'sunnah') onNavigateTab('salah');
                          else if (item.id === 'adhkar') onNavigateTab('adhkar');
                          else if (item.id === 'fasting') onNavigateTab('fasting');
                          else if (item.id === 'quran') onNavigateTab('quran');
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between space-y-2.5 ${tier.colorClasses.bg} ${tier.colorClasses.border}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <h5 className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                              {item.title}
                            </h5>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {item.detailText}
                            </span>
                          </div>
                        </div>

                        {/* Badge Pill */}
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 ${tier.colorClasses.badgeBg} ${tier.colorClasses.glow}`}>
                          <span>{tier.badgeSymbol}</span>
                          <span>{item.percentage}%</span>
                        </div>
                      </div>

                      {/* Progress Bar Track */}
                      <div className="w-full space-y-1">
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${tier.colorClasses.barGradient} transition-all duration-700`}
                            style={{ width: `${Math.min(100, item.percentage)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 dark:text-slate-400">
                          <span>المرتبة: {tier.shortLabel}</span>
                          {item.percentage > 100 && (
                            <span className="text-amber-500 font-black animate-pulse">فوق المائة ✨</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Metal Tiers Legend & Rules */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-200">
                <Info className="w-4 h-4 text-emerald-500" />
                <span>دليل مستويات الأوسمة الملونة (من 0% إلى أكثر من 100%):</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-bold">
                {Object.values(PROGRESS_TIERS_MAP).map(t => (
                  <div
                    key={t.tierLevel}
                    className={`p-2 rounded-xl border flex items-center gap-1.5 ${t.colorClasses.bg} ${t.colorClasses.border}`}
                  >
                    <span className="text-sm">{t.badgeSymbol}</span>
                    <div>
                      <span className={`block font-black ${t.colorClasses.text}`}>{t.shortLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-500 shrink-0">
            <span>تقبل الله طاعتكم وجعلكم من السابقين للخيرات 🌟</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-colors cursor-pointer"
            >
              إغلاق المعرض
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
