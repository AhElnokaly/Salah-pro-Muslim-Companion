import React, { useState } from 'react';
import { safeSetItem, safeRemoveItem } from '../utils/storage';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  BookOpen,
  Sparkles,
  Clock,
  Calendar,
  Smartphone,
  Bell,
  Sliders,
  Moon,
  Volume2,
  ChevronLeft,
  Zap,
  HelpCircle,
  Play,
  Heart,
  Layers,
  CheckCircle2,
  MapPin,
  Globe,
  Radio,
  Search,
  X
} from 'lucide-react';

interface FeatureDiscoveryWidgetProps {
  onSelectTab: (tab: string, subTab?: string) => void;
  onOpenTour: () => void;
}

interface FeatureItem {
  id: string;
  subTab?: string;
  category: 'salah' | 'quran' | 'fasting' | 'services';
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  icon: React.ElementType;
  gradient: string;
  bullets: string[];
}

const ALL_FEATURES: FeatureItem[] = [
  {
    id: 'salah',
    category: 'salah',
    categoryLabel: 'الصلاة والأذان',
    title: 'سجل الصلاة والسنن الرواتب',
    subtitle: 'تتبع صلاة الجماعة، السنن القبلية والبعدية، وقضاء الفوائت',
    badge: 'سجل إيماني',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300',
    icon: Sliders,
    gradient: 'from-indigo-600 to-blue-600',
    bullets: ['تسجيل صلاة الجماعة والسنن', 'حاسبة أوتوماتيكية لقضاء الصلوات الفائتة']
  },
  {
    id: 'khushu',
    category: 'fasting',
    categoryLabel: 'القيام والصيام',
    title: 'قيام الليل والثلث الأخير',
    subtitle: 'الحساب الفلكي الدقيق لساعات إجابة الدعاء بدقة ثانية',
    badge: 'دقة فلكية',
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300',
    icon: Moon,
    gradient: 'from-violet-600 to-purple-600',
    bullets: ['تحديد بداية ثلث الليل الأخير بدقة', 'عداد استغفار السحر وأدعية القيام']
  },
  {
    id: 'quran',
    category: 'quran',
    categoryLabel: 'القرآن والأذكار',
    title: 'مساعد المصحف والختمات',
    subtitle: 'متابعة الورد القرآني، حفظ الصفحة، وسورة الكهف للجمعة',
    badge: 'تلاوة وختمات',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    icon: BookOpen,
    gradient: 'from-amber-600 to-yellow-600',
    bullets: ['تتبع أجزاء الختمة وتحديد الصفحة', 'تنبيه ورابط مباشر لسورة الكهف يوم الجمعة']
  },
  {
    id: 'adhkar',
    category: 'quran',
    categoryLabel: 'القرآن والأذكار',
    title: 'حصن المسلم والمسبحة الذكية',
    subtitle: 'أذكار الصباح والمساء ومسبحة لمسية تفاعلية باهتزاز',
    badge: 'اهتزاز وتفاعل',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300',
    icon: Sparkles,
    gradient: 'from-teal-600 to-emerald-600',
    bullets: ['عداد تسبيح تفاعلي بالصوت واللمس', 'أذكار الصباح والمساء والنوم المؤكدة']
  },
  {
    id: 'qibla',
    category: 'services',
    categoryLabel: 'الخدمات الذكية',
    title: 'اتجاه القبلة الفلكية 360°',
    subtitle: 'بوصلة حية ثلاثية الأبعاد تحدد الكعبة الشريفة بدون إنترنت',
    badge: 'بوصلة GPS',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300',
    icon: Compass,
    gradient: 'from-emerald-600 to-teal-600',
    bullets: ['تحديد زاوية الكعبة بدقة 100%', 'تعمل بدون اتصال بالإنترنت بالسفر']
  },
  {
    id: 'fasting',
    category: 'fasting',
    categoryLabel: 'القيام والصيام',
    title: 'تتبع الصيام والأيام البيض',
    subtitle: 'صيام الإثنين والخميس، الأيام البيض، وسجل القضاء',
    badge: 'تطوع ورمضان',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300',
    icon: Calendar,
    gradient: 'from-rose-600 to-pink-600',
    bullets: ['مواعيد الأيام البيض (13-14-15)', 'ساعات الصيام المتبقية حتى الإفطار']
  },
  {
    id: 'widgets',
    category: 'services',
    categoryLabel: 'الخدمات الذكية',
    title: 'مصمم الودجت وخلفيات المساجد',
    subtitle: 'تصميم ودجت الشاشة للهاتف وتنزيل خلفيات مساجد الحرمين',
    badge: 'تخصيص الهاتف',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300',
    icon: Smartphone,
    gradient: 'from-cyan-600 to-blue-600',
    bullets: ['أشكال ودجت متنوعة للساعة والأذكار', 'خلفيات عالية الجودة للتنزيل']
  },
  {
    id: 'alarms',
    category: 'services',
    categoryLabel: 'الخدمات الذكية',
    title: 'منبهات العبادات وأصوات المؤذنين',
    subtitle: 'اختيار صوت أذان الحرم المكي أو المدني والتنبيهات المخصصة',
    badge: 'أصوات الحرمين',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300',
    icon: Bell,
    gradient: 'from-orange-600 to-amber-600',
    bullets: ['تخصيص صوت أذان منفصل لكل صلاة', 'تنبيهات صلاة الضحى والورد اليومي']
  },
  {
    id: 'calendar',
    category: 'services',
    categoryLabel: 'الخدمات الذكية',
    title: 'التقويم الهجري والمناسبات',
    subtitle: 'النتيجة الهجرية والميلادية والمناسبات الإسلامية القادمة',
    badge: 'التقويم الإسلامي',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300',
    icon: Calendar,
    gradient: 'from-amber-600 to-yellow-600',
    bullets: ['النتيجة المزدوجة هجري وميلادي', 'ضبط وتعديل الرؤية الهجرية']
  },
  {
    id: 'settings',
    subTab: 'location',
    category: 'services',
    categoryLabel: 'الضبط والتخصيص',
    title: 'تحديد الموقع بالـ GPS والمدن',
    subtitle: 'ضبط إحداثيات موقعك بدقة بالـ GPS واختيار المذهب الفلكي',
    badge: 'إعدادات الموقع',
    badgeColor: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    icon: MapPin,
    gradient: 'from-slate-700 to-slate-900',
    bullets: ['تحديث موقعك بالـ GPS بنقرة زر', 'جميع مدن ومحافظات العالم العربي']
  }
];

export default function FeatureDiscoveryWidget({ onSelectTab, onOpenTour }: FeatureDiscoveryWidgetProps) {
  const [currentTipIdx, setCurrentTipIdx] = useState(0);
  const [isFullCatalogOpen, setIsFullCatalogOpen] = useState(false);
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(() => {
    return localStorage.getItem('mc_discovery_bubble_dismissed') === 'true';
  });
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentFeature = ALL_FEATURES[currentTipIdx % ALL_FEATURES.length];

  const handleNextTip = () => {
    setCurrentTipIdx((prev) => (prev + 1) % ALL_FEATURES.length);
  };

  const handlePrevTip = () => {
    setCurrentTipIdx((prev) => (prev - 1 + ALL_FEATURES.length) % ALL_FEATURES.length);
  };

  const dismissBubble = () => {
    setIsBubbleDismissed(true);
    safeSetItem('mc_discovery_bubble_dismissed', 'true');
  };

  const restoreBubble = () => {
    setIsBubbleDismissed(false);
    safeRemoveItem('mc_discovery_bubble_dismissed');
  };

  const filteredFeatures = ALL_FEATURES.filter(f => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchesSearch = !searchQuery || 
      f.title.includes(searchQuery) || 
      f.subtitle.includes(searchQuery) || 
      f.categoryLabel.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // If dismissed, render a subtle micro-badge option to restore if needed
  if (isBubbleDismissed) {
    return (
      <div className="flex justify-center py-1">
        <button
          onClick={restoreBubble}
          className="text-[11px] font-extrabold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 border border-slate-200/80 dark:border-slate-700/80 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>إظهار فقاعة الاكتشاف والخدمات 💬</span>
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Compact Interactive Discovery Speech Bubble */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-3.5 sm:p-4 border border-indigo-500/30 shadow-xl relative overflow-hidden transition-all duration-300 text-end">
        {/* Background glow accents */}
        <div className="absolute top-0 end-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-2.5">
          {/* Bubble Header */}
          <div className="flex items-center justify-between gap-2 border-b border-indigo-500/20 pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 rounded-xl shadow-xs font-black text-xs shrink-0 flex items-center justify-center">
                <Sparkles className="w-4 h-4 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-black text-amber-300">
                    دليل ومزايا التطبيق 💬
                  </h3>
                  <span className="text-[9.5px] bg-amber-500/20 text-amber-200 font-extrabold px-2 py-0.5 rounded-full border border-amber-500/30">
                    تلميح {currentTipIdx + 1} من {ALL_FEATURES.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onOpenTour}
                className="py-1 px-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10.5px] font-black rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                title="الجولة التفاعلية"
              >
                <Play className="w-3 h-3 fill-current" />
                <span className="hidden sm:inline">الجولة</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullCatalogOpen(true)}
                className="py-1 px-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-[10.5px] font-bold rounded-lg transition-all cursor-pointer"
              >
                عرض المزايا (10)
              </button>

              <button
                type="button"
                onClick={dismissBubble}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="إغلاق الفقاعة"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Speech Bubble Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFeature.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-indigo-500/20"
            >
              <div className="flex items-start gap-2.5 flex-1">
                <div className={`p-2.5 bg-gradient-to-br ${currentFeature.gradient} text-white rounded-xl shrink-0 mt-0.5`}>
                  <currentFeature.icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{currentFeature.title}</span>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${currentFeature.badgeColor}`}>
                      {currentFeature.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium leading-tight">
                    {currentFeature.subtitle}
                  </p>
                </div>
              </div>

              {/* Navigation & Action */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 border-t sm:border-t-0 border-slate-700/60 pt-2 sm:pt-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePrevTip}
                    className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="السابق"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNextTip}
                    className="p-1.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    title="التالي"
                  >
                    ›
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectTab(currentFeature.id, currentFeature.subTab)}
                  className="py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <span>جرب الميزة الآن</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Full Features Catalog Dialog / Modal */}
      <AnimatePresence>
        {isFullCatalogOpen && (
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
                    <p className="text-xs text-slate-400 font-medium">
                      10 أدوات وخدمات متكاملة
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsFullCatalogOpen(false)}
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
                    {[
                      { id: 'all', label: '🌟 الكل' },
                      { id: 'salah', label: '🕌 الصلاة' },
                      { id: 'quran', label: '📖 القرآن' },
                      { id: 'fasting', label: '🌙 القيام' },
                      { id: 'services', label: '📱 خدمات' }
                    ].map(cat => (
                      <button
                        key={cat.id}
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
                  {filteredFeatures.map(item => {
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
                            setIsFullCatalogOpen(false);
                            onSelectTab(item.id, item.subTab);
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
        )}
      </AnimatePresence>
    </>
  );
}
