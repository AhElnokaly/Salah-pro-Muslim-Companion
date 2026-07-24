/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  Send, 
  Plus, 
  Clock, 
  Compass, 
  Zap, 
  BookmarkCheck,
  ChevronLeft
} from 'lucide-react';
import { 
  SITUATIONAL_CATEGORIES, 
  getSmartAdhkarSuggestions, 
  generateLocalCustomSuggestion, 
  SmartDhikrRecommendation,
  getSmartAppRecommendations,
  SmartAppRecommendation
} from '../utils/smartAdhkarEngine';
import { toArabicNumbers } from '../utils/hijri';

interface SmartAdhkarSuggestionsProps {
  onAddToCustomTasbeeh?: (text: string) => void;
  onNavigateTab?: (tab: string) => void;
  onOpenNotificationsModal?: () => void;
  completedStationsCount?: number;
  activePrayerName?: string;
  isPushGranted?: boolean;
}

export default function SmartAdhkarSuggestions({
  onAddToCustomTasbeeh,
  onNavigateTab,
  onOpenNotificationsModal,
  completedStationsCount = 0,
  activePrayerName = 'الظهر',
  isPushGranted = false
}: SmartAdhkarSuggestionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('tranquility');
  const [customInput, setCustomInput] = useState<string>('');
  const [suggestionsList, setSuggestionsList] = useState<SmartDhikrRecommendation[]>(() => 
    getSmartAdhkarSuggestions('tranquility')
  );

  const [counterState, setCounterState] = useState<Record<string, number>>({});
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  // App recommendations
  const appRecommendations = getSmartAppRecommendations(
    completedStationsCount,
    activePrayerName,
    isPushGranted
  );

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setSuggestionsList(getSmartAdhkarSuggestions(catId));
  };

  const handleGenerateLocalSuggestions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const results = generateLocalCustomSuggestion(customInput);
    setSuggestionsList(results);
  };

  const handleIncrementCount = (id: string, goal: number) => {
    setCounterState(prev => {
      const curr = prev[id] || 0;
      const next = curr + 1;
      
      // Feedback sound & vibration
      if (navigator.vibrate) navigator.vibrate(20);

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, ctx.currentTime);
          gain.gain.setValueAtTime(0.03, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        }
      } catch (e) {}

      return { ...prev, [id]: next >= goal ? goal : next };
    });
  };

  const handleSaveToTasbeeh = (item: SmartDhikrRecommendation) => {
    if (onAddToCustomTasbeeh) {
      onAddToCustomTasbeeh(item.text);
    }
    setSavedItems(prev => new Set(prev).add(item.id));
  };

  const handleAppRecommendationClick = (rec: SmartAppRecommendation) => {
    if (rec.targetAction === 'open_notifications_modal' && onOpenNotificationsModal) {
      onOpenNotificationsModal();
    } else if (rec.targetTab && onNavigateTab) {
      onNavigateTab(rec.targetTab);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* HEADER BANNER */}
      <div className="p-6 bg-gradient-to-r from-indigo-900 via-indigo-800 to-[#111720] text-white rounded-3xl shadow-lg border border-indigo-700/50 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>المستشار الإيماني الذكي المباشر (يعمل بدون إنترنت)</span>
          </div>

          <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
            اقتراحات ذكية وتوصيات مخصصة لحالتك الإيمانية
          </h2>

          <p className="text-xs md:text-sm text-indigo-100/90 leading-relaxed max-w-2xl">
            اختر غايتك أو اكتب شعورك وحالتك الحالية لترشيح الأذكار والأدعية المأثورة المناسبة بفضلها الصحيح من السُنّة والتنزيل المباشر فورياً بدون أي اتصالات خارجية.
          </p>
        </div>
      </div>

      {/* SECTION 1: SMART APP FEATURE RECOMMENDATIONS */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-slate-800 dark:text-white">
              توصيات واقتراحات تطبيقك الإيماني اليوم
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">تحليل تلقائي متجدد</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {appRecommendations.map((rec) => (
            <div 
              key={rec.id}
              className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between gap-3 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl p-2 bg-white dark:bg-slate-700/80 rounded-xl shadow-xs shrink-0">
                  {rec.icon}
                </span>
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug">
                    {rec.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleAppRecommendationClick(rec)}
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{rec.actionText}</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: SMART ADHKAR SEARCH & SITUATIONAL SELECTOR */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200/90 dark:border-slate-800/80 shadow-xs space-y-5">
        
        {/* Custom Local Search / Analysis Form */}
        <form onSubmit={handleGenerateLocalSuggestions} className="space-y-2">
          <label className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>اكتب شعورك أو غايتك الآن لتحليل الأذكار المناسبة لك (تحليل ذكي محلي):</span>
          </label>

          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="مثال: أشعر بضيق أو قلق، امتحان ومذاكرة، طلب رزق وبركة، شفاء مريض..."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!customInput.trim()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black rounded-2xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all shrink-0 active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>تحليل واقتراح</span>
            </button>
          </div>
        </form>

        {/* Situational Categories Pills */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 block">
            أو اختر الفئة أو الغاية الإيمانية المباشرة:
          </span>

          <div className="flex flex-wrap gap-2">
            {SITUATIONAL_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`py-2 px-3.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-105'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RECOMMENDED ADHKAR CARDS */}
        <div className="space-y-4 pt-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>الأذكار المقترحة المناسبة ({toArabicNumbers(suggestionsList.length)} أذكار):</span>
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {suggestionsList.map((item) => {
              const currentCount = counterState[item.id] || 0;
              const isDone = currentCount >= item.recommendedCount;
              const isSaved = savedItems.has(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl border transition-all space-y-4 text-right shadow-xs ${
                    isDone
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {/* Category & Time Tag Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-2.5">
                    <span className="text-xs font-black text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-1">
                      <span>{item.categoryIcon}</span>
                      <span>{item.categoryName}</span>
                    </span>

                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-lg border border-amber-100 dark:border-amber-900/30 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.bestTime}</span>
                    </span>
                  </div>

                  {/* Dhikr Arabic Text */}
                  <p className="text-base md:text-lg font-black text-slate-800 dark:text-white leading-relaxed text-center py-2 select-text">
                    {item.text}
                  </p>

                  {/* Reward / Hadith Virtue Box */}
                  <div className="p-3.5 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-amber-600 dark:text-amber-400 block mb-0.5">الفضل والحديث الأصيل:</span>
                      <span>{item.reward}</span>
                    </div>
                  </div>

                  {/* Actions & Practice Counter */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => handleSaveToTasbeeh(item)}
                      disabled={isSaved}
                      className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSaved
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4" />}
                      <span>{isSaved ? 'تمت الإضافة للمسبحة ✓' : 'أضف لمسبحتي المخصصة'}</span>
                    </button>

                    <button
                      onClick={() => handleIncrementCount(item.id, item.recommendedCount)}
                      className={`py-2.5 px-5 rounded-2xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-2 active:scale-95 ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      <span>{isDone ? 'مكتمل بنجاح ✓' : `تسبيح مباشر (${toArabicNumbers(currentCount)} / ${toArabicNumbers(item.recommendedCount)})`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
