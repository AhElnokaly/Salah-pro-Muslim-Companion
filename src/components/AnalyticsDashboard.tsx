import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Award,
  Sliders,
  BookOpen,
  Moon,
  Calendar,
  Compass,
  CalendarDays,
  Smartphone,
  Bell,
  Heart,
  ChevronLeft,
  Search,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Lightbulb,
  ShieldCheck,
  Flame,
  Star,
  ThumbsUp,
  Target,
  ArrowRight,
  Trophy,
  Grid,
  Table,
  Crown,
  Info,
  Filter,
  Check,
  ZapOff
} from 'lucide-react';
import {
  FEATURES_LIST,
  getAnalyticsForPeriod,
  getSpiritualRecommendations,
  getTopFeaturePraise,
  getSmartFeatureNudges,
  trackFeatureUsage,
  trackFeatureCompletion,
  getCardSummaries,
  getBadgeTierForRate,
  getWomenExcuseMode,
  setWomenExcuseMode,
  CardFeatureSummaryItem,
  BadgeTierInfo,
  BADGE_TIERS_MAP,
  FeaturePraiseInfo,
  FeatureNudgeInfo
} from '../utils/analyticsStorage';

interface AnalyticsDashboardProps {
  onSelectTab: (tab: string, subTab?: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Clock,
  Sliders,
  BookOpen,
  Sparkles,
  Moon,
  Calendar,
  Compass,
  CalendarDays,
  Smartphone,
  Bell,
  Heart
};

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
  const grayCount = cardSummaries.filter(c => c.badgeTier.tierLevel === 0).length;

  return (
    <div className="space-y-6 text-end animate-fade-in pb-12">
      {/* 1. HEADER HERO BANNER */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute -start-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 bg-emerald-500/20 rounded-2xl border border-emerald-400/30 text-emerald-300">
                <Trophy className="w-6 h-6 text-amber-300 animate-bounce" />
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full font-black">
                نظام الأوسمة والإتقان الإيماني التفاعلي 📊
              </span>
              {womenExcuse && (
                <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-3 py-1 rounded-full font-black animate-pulse flex items-center gap-1">
                  🤍 رخصة العذر الشرعي مُفعلة
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
              لوحة تحليلات وإنجاز الخدمات الإيمانية
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-2xl font-medium leading-relaxed">
              تستبدل الجداول النمطية ببطاقات تفاعلية وأوسمة إيمانية متدرجة (برنزي، فضي، ذهبي، كريستالي 💎) مع تتبع تلقائي للأيام والأسابيع والأشهر ومراعاة الظروف الشرعية.
            </p>
          </div>

          {/* Timeframe Selector Pills */}
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 flex items-center gap-1 shrink-0 self-stretch md:self-auto justify-center">
            {[
              { id: 'daily', label: 'اليوم' },
              { id: 'weekly', label: 'الأسبوع' },
              { id: 'monthly', label: 'الشهر' },
              { id: 'all', label: 'الإجمالي' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as any)}
                className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  period === p.id
                    ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. OVERVIEW STAT CARDS & WOMEN EXCUSE TOGGLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Usage */}
        <div className="bg-white dark:bg-[#161d26] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 block truncate">
              استخدامات {period === 'daily' ? 'اليوم' : period === 'weekly' ? 'الأسبوع' : period === 'monthly' ? 'الشهر' : 'شاملة'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {period === 'daily' ? totalTodayUsage : totalLifetimeUsage}
              </span>
              <span className="text-[10px] font-bold text-slate-500">مرة</span>
            </div>
          </div>
        </div>

        {/* Total 100% Completions */}
        <div className="bg-white dark:bg-[#161d26] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 block truncate">
              الإتقان الكامل 100%
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {period === 'daily' ? totalTodayCompletion : totalLifetime100}
              </span>
              <span className="text-[10px] font-bold text-slate-500">مرة</span>
            </div>
          </div>
        </div>

        {/* Crystal Badges Achieved */}
        <div className="bg-white dark:bg-[#161d26] rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl border border-cyan-500/20 shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-extrabold text-slate-400 dark:text-slate-500 block truncate">
              الأوسمة الكريستالية 💎
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                {crystalCount}
              </span>
              <span className="text-[10px] font-bold text-slate-500">من {FEATURES_LIST.length}</span>
            </div>
          </div>
        </div>

        {/* Women Excuse Toggle Banner Card */}
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-2xl p-3.5 border border-indigo-500/30 shadow-xs flex items-center justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-200 block truncate">
              رخصة العذر الشرعي 🤍
            </span>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium truncate">
              استثناء أيام العذر للمرأة
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggleExcuse(!womenExcuse)}
            className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              womenExcuse
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
            }`}
          >
            {womenExcuse ? 'مُفعّلة ✨' : 'تفعيل'}
          </button>
        </div>
      </div>

      {/* 3. VIEW MODE & FILTER TOOLBAR */}
      <div className="bg-white dark:bg-[#161d26] rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800/80 space-y-3 shadow-xs">
        {/* View Switcher Tabs - Horizontal Scrollable */}
        <div className="bg-slate-100 dark:bg-[#111720] p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: 'cards', label: 'بطاقات الخدمات 🎴', icon: Grid },
            { id: 'badges', label: 'معرض الأوسمة 🏆', icon: Trophy },
            { id: 'table', label: 'الجدول المطور 📊', icon: Table },
            { id: 'nudges', label: 'التوجيهات والتحليلات 🎯', icon: Target }
          ].map(v => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setViewMode(v.id as any)}
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

      {/* 4. VIEW CONTENT AREA */}
      <AnimatePresence mode="wait">
        {/* VIEW 1: INTERACTIVE FEATURE CARDS GRID (PRIMARY NEW SYSTEM) */}
        {viewMode === 'cards' && (
          <motion.div
            key="cards-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredCards.map((item) => {
              const IconComp = ICON_MAP[item.feature.iconName] || Clock;
              const tier = item.badgeTier;

              return (
                <div
                  key={item.feature.id}
                  className={`bg-white dark:bg-[#161d26] rounded-3xl p-5 border-2 shadow-sm transition-all hover:shadow-md flex flex-col justify-between space-y-4 relative overflow-hidden group ${tier.colorClasses.border}`}
                >
                  {/* Top Badge Glow Accent Line */}
                  <div className={`absolute top-0 start-0 end-0 h-1.5 ${tier.colorClasses.bg}`} />

                  {/* Header Row: Icon + Title + Category Badge */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl border ${item.feature.color.bg} ${item.feature.color.border} shrink-0`}>
                          <IconComp className={`w-6 h-6 ${item.feature.color.text}`} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                            {item.feature.name}
                          </h3>
                          <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md inline-block mt-0.5 ${item.feature.color.badge}`}>
                            {item.feature.category}
                          </span>
                        </div>
                      </div>

                      {/* Quick Manual +1 Test Button */}
                      <button
                        type="button"
                        onClick={() => trackFeatureCompletion(item.feature.id)}
                        className="p-2 bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950/80 text-slate-500 hover:text-emerald-600 dark:text-slate-400 rounded-xl transition-all cursor-pointer active:scale-90"
                        title="تسجيل إتقان 100% (+1)"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                      {item.feature.description}
                    </p>
                  </div>

                  {/* BADGE TIER SHOWCASE BANNER */}
                  <div className={`p-3 rounded-2xl border flex flex-col space-y-1.5 ${tier.colorClasses.bg} ${tier.colorClasses.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Award className={`w-4 h-4 ${tier.colorClasses.iconColor}`} />
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {tier.title}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${tier.colorClasses.badgeBg}`}>
                        %{item.completionRate}
                      </span>
                    </div>

                    {/* Progress Bar to next level */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 via-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.completionRate}%` }}
                      />
                    </div>

                    <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-bold italic truncate">
                      «{tier.quranQuote}»
                    </span>
                  </div>

                  {/* MICRO COUNTERS GRID (اليوم، الأسبوع، الشهر، الإجمالي، الإتقان) */}
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-50/80 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                    {/* اليوم */}
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 block">
                        اليوم
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                        {item.todayCount} <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">({item.todayCompletion})</span>
                      </span>
                    </div>

                    {/* الأسبوع */}
                    <div className="space-y-0.5 border-e border-s border-slate-200/80 dark:border-slate-800 px-1">
                      <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 block" title="يتراكم ويصفر أسبوعياً مع حفظ الإجمالي">
                        الأسبوع 🔄
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                        {item.weeklyCount}
                      </span>
                    </div>

                    {/* الشهر */}
                    <div className="space-y-0.5">
                      <span className="text-[9.5px] font-extrabold text-slate-400 dark:text-slate-500 block" title="يتراكم ويصفر شهرياً مع حفظ الإجمالي">
                        الشهر 🔄
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                        {item.monthlyCount}
                      </span>
                    </div>

                    {/* إجمالي المرات */}
                    <div className="col-span-1 border-t border-slate-200/80 dark:border-slate-800 pt-1.5 mt-1">
                      <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 block">
                        الإجمالي
                      </span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                        {item.lifetimeCount}
                      </span>
                    </div>

                    {/* مرات الإتقان 100% */}
                    <div className="col-span-2 border-t border-slate-200/80 dark:border-slate-800 pt-1.5 mt-1 pe-1">
                      <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 block">
                        الإتقان الكامل 100%
                      </span>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                        {item.lifetime100Completion} مرة 🌟
                      </span>
                    </div>
                  </div>

                  {/* MAIN CTA BUTTON / RESULT BADGE */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectTab(item.feature.id)}
                      className={`w-full py-2.5 px-4 rounded-2xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-between gap-2 ${item.smartCTA.badgeStyle}`}
                    >
                      <span className="truncate">{item.smartCTA.buttonText}</span>
                      <ChevronLeft className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* VIEW 2: GAMIFIED BADGES SHOWCASE GALLERY */}
        {viewMode === 'badges' && (
          <motion.div
            key="badges-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Tiers Summary Bar */}
            <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h2 className="text-base font-black text-slate-900 dark:text-white">
                      معرض الشارات والأوسمة الإيمانية 🏆
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    احرز الأوسمة الذهبية والبلورية بالاستمرار على العبادات وتوثيق إنجازاتك اليومية.
                  </p>
                </div>

                {/* Tier Filter Buttons */}
                <div className="w-full md:w-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth pb-0.5 shrink-0">
                  <button
                    onClick={() => setSelectedTierFilter('all')}
                    className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      selectedTierFilter === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    الكل ({cardSummaries.length})
                  </button>
                  <button
                    onClick={() => setSelectedTierFilter(4)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      selectedTierFilter === 4
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    }`}
                  >
                    💎 الكريستالي ({crystalCount})
                  </button>
                  <button
                    onClick={() => setSelectedTierFilter(3)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      selectedTierFilter === 3
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    🥇 الذهبي ({goldCount})
                  </button>
                  <button
                    onClick={() => setSelectedTierFilter(2)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      selectedTierFilter === 2
                        ? 'bg-slate-400 text-white shadow-md'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    🥈 الفضي ({silverCount})
                  </button>
                  <button
                    onClick={() => setSelectedTierFilter(1)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                      selectedTierFilter === 1
                        ? 'bg-amber-900 text-white shadow-md'
                        : 'bg-amber-900/10 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    🥉 البرنزي ({bronzeCount})
                  </button>
                </div>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCards.map((item) => {
                const IconComp = ICON_MAP[item.feature.iconName] || Clock;
                const tier = item.badgeTier;
                const isUnlocked = tier.tierLevel > 0;

                return (
                  <div
                    key={item.feature.id}
                    className={`rounded-3xl p-5 border-2 shadow-sm relative overflow-hidden transition-all hover:scale-102 ${tier.colorClasses.bg} ${tier.colorClasses.border}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-3.5 rounded-2xl border shadow-inner ${tier.colorClasses.badgeBg}`}>
                          <Award className={`w-7 h-7 ${tier.colorClasses.iconColor}`} />
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 block">
                            وسام ميزة ({item.feature.name})
                          </span>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                            {tier.title}
                          </h3>
                        </div>
                      </div>

                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${tier.colorClasses.badgeBg}`}>
                        %{item.completionRate}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        <span>التقدم لنيل تاج الكريستال (100%)</span>
                        <span>{item.lifetime100Completion} إتقان كامل</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 via-teal-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.completionRate}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-[10.5px] text-slate-600 dark:text-slate-300 font-bold italic mt-3 text-center">
                      «{tier.quranQuote}»
                    </p>

                    <button
                      type="button"
                      onClick={() => onSelectTab(item.feature.id)}
                      className="w-full mt-3 py-2 px-3 bg-white/80 dark:bg-slate-900/80 hover:bg-white text-slate-900 dark:text-white font-black text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>الانتقال لخدمة {item.feature.name}</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: MODERN TABLE VIEW */}
        {viewMode === 'table' && (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white dark:bg-[#161d26] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
                  جدول المتابعة والإحصائيات المباشرة (+1)
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  عرض مكثف للخدمات والأرقام المتراكمة
                </p>
              </div>

              <span className="text-xs font-extrabold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/60">
                {filteredCards.length} خدمة
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-end border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 text-[11px] font-black border-b border-slate-200/80 dark:border-slate-800">
                    <th className="p-3.5 pe-5">الخدمة الإيمانية</th>
                    <th className="p-3.5 text-center">اليوم</th>
                    <th className="p-3.5 text-center">الأسبوع 🔄</th>
                    <th className="p-3.5 text-center">الشهر 🔄</th>
                    <th className="p-3.5 text-center">الإجمالي</th>
                    <th className="p-3.5 text-center">الإتقان 100%</th>
                    <th className="p-3.5 text-center">وسام المستوى</th>
                    <th className="p-3.5 text-start ps-5">الجراء والتفاعل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredCards.map(item => {
                    const Icon = ICON_MAP[item.feature.iconName] || Clock;
                    return (
                      <tr key={item.feature.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors">
                        <td className="p-3.5 pe-5">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl border ${item.feature.color.bg} ${item.feature.color.border} shrink-0`}>
                              <Icon className={`w-4 h-4 ${item.feature.color.text}`} />
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-800 dark:text-white">
                                {item.feature.name}
                              </h4>
                              <span className="text-[10px] text-slate-400 block">
                                {item.feature.category}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-center font-black text-xs text-slate-800 dark:text-slate-200">
                          {item.todayCount}
                        </td>

                        <td className="p-3.5 text-center font-black text-xs text-slate-800 dark:text-slate-200">
                          {item.weeklyCount}
                        </td>

                        <td className="p-3.5 text-center font-black text-xs text-slate-800 dark:text-slate-200">
                          {item.monthlyCount}
                        </td>

                        <td className="p-3.5 text-center font-black text-xs text-slate-800 dark:text-slate-200">
                          {item.lifetimeCount}
                        </td>

                        <td className="p-3.5 text-center font-black text-xs text-emerald-600 dark:text-emerald-400">
                          {item.lifetime100Completion}
                        </td>

                        <td className="p-3.5 text-center">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${item.badgeTier.colorClasses.badgeBg}`}>
                            {item.badgeTier.title}
                          </span>
                        </td>

                        <td className="p-3.5 text-start ps-5">
                          <button
                            type="button"
                            onClick={() => onSelectTab(item.feature.id)}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 inline-flex"
                          >
                            <span>فتح الميزة</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* VIEW 4: SMART NUDGES & RECOMMENDATIONS */}
        {viewMode === 'nudges' && (
          <motion.div
            key="nudges-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Praise for top feature */}
            {topPraise && (
              <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-teal-500/15 dark:from-amber-950/40 dark:to-emerald-950/30 p-5 rounded-3xl border border-amber-500/30 shadow-md space-y-3 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-300 rounded-2xl border border-amber-400/40 shrink-0">
                      <ThumbsUp className="w-6 h-6 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-lg">
                          {topPraise.badgeLabel}
                        </span>
                        <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                          {topPraise.praiseTitle}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-bold leading-relaxed">
                        {topPraise.praiseMessage}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectTab(topPraise.feature.id)}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-2xl shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
                  >
                    <span>متابعة ميزتك المفضلة ({topPraise.feature.name})</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Smart Nudges */}
            {smartNudges.length > 0 && (
              <div className="bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-slate-900/5 dark:from-indigo-950/40 dark:to-purple-950/30 p-5 rounded-3xl border border-indigo-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-500 animate-pulse" />
                    <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      توجيهات مخصصة للمزايا الأقل استخداماً 🎯
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                    توجيه مخصص
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {smartNudges.map((nudge, idx) => {
                    const IconComp = ICON_MAP[nudge.iconName] || Lightbulb;
                    return (
                      <div
                        key={idx}
                        className="bg-white dark:bg-[#111720] rounded-2xl p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-3 hover:border-indigo-400 transition-all group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`p-2 rounded-xl border ${nudge.feature.color.bg} ${nudge.feature.color.border}`}>
                                <IconComp className={`w-4 h-4 ${nudge.feature.color.text}`} />
                              </span>
                              <h4 className="text-xs font-black text-slate-900 dark:text-slate-100">
                                {nudge.nudgeTitle}
                              </h4>
                            </div>
                            <span className="text-[9.5px] font-extrabold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md">
                              {nudge.badgeText}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                            {nudge.nudgeMessage}
                          </p>
                        </div>

                        <button
                          onClick={() => onSelectTab(nudge.targetTab)}
                          className="w-full mt-2 py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-[11px] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-between gap-1.5 group-hover:shadow-md"
                        >
                          <span>{nudge.buttonLabel}</span>
                          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
