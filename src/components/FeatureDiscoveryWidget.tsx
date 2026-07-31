import React, { useState } from 'react';
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
  Search
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const filteredFeatures = ALL_FEATURES.filter(f => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchesSearch = !searchQuery || 
      f.title.includes(searchQuery) || 
      f.subtitle.includes(searchQuery) || 
      f.categoryLabel.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-[#161d26] rounded-3xl p-4 sm:p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 shadow-sm transition-all duration-300 text-end">
      {/* Widget Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-xs">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white">
                دليل ومزايا رفيق المسلم 🚀
              </h3>
              <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-extrabold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/60">
                10 خدمات مميزة
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              استكشف جميع الأدوات والخدمات المتاحة بالتطبيق وانتقل إليها بنقرة واحدة
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onOpenTour}
            className="py-2 px-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>الجولة التفاعلية 💡</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
          >
            {isExpanded ? 'طي الدليل' : 'عرض الكل'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Categories & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {[
                { id: 'all', label: '🌟 جميع المزايا' },
                { id: 'salah', label: '🕌 الصلاة والأذان' },
                { id: 'quran', label: '📖 القرآن والأذكار' },
                { id: 'fasting', label: '🌙 القيام والصيام' },
                { id: 'services', label: '📱 خدمات وودجت' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`py-1.5 px-3 rounded-xl text-[11px] font-black transition-all cursor-pointer shrink-0 border ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:border-indigo-400'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick Search Input */}
            <div className="relative shrink-0 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute end-3 top-2.5" />
              <input
                type="text"
                placeholder="ابحث عن ميزة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#111720] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-xl pe-8 ps-3 py-1.5 text-[11px] font-bold outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Features Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFeatures.map(item => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.id + (item.subTab || '')}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="bg-slate-50/80 dark:bg-[#111720]/80 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-2.5 shadow-2xs group"
                >
                  <div className="space-y-2">
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2.5 bg-gradient-to-br ${item.gradient} text-white rounded-xl shadow-2xs group-hover:scale-105 transition-transform`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold block">
                            {item.categoryLabel}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[9.5px] font-extrabold px-2 py-0.5 rounded-md border border-black/5 dark:border-white/5 shrink-0 ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {item.subtitle}
                    </p>

                    {/* Bullets */}
                    <div className="space-y-1 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                      {item.bullets.map((bullet, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Direct Launch Button */}
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.id, item.subTab)}
                    className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-600 font-black text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs group-hover:shadow-xs active:scale-98"
                  >
                    <span>فتح وتجربة الميزة الآن</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
