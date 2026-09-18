import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  Home,
  Moon,
  BarChart3,
  Calendar,
  BookOpen,
  Bell,
  Compass,
  Smartphone,
  MapPin,
  Volume2,
  Settings,
  Clock,
  Heart,
  RotateCcw,
  Lightbulb,
  Share2,
  Download,
  Sunrise,
  ListChecks,
  MoreHorizontal,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TabId, SettingsSubTabId, AppSettings } from '../../types';
import { APP_VERSION } from '../../version';
import { getUnreadVersionStatus } from '../../data/changelog';
import { SidebarSection } from './SidebarSection';

const MosqueIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v4M12 6a4 4 0 0 0-4 4v3h8v-3a4 4 0 0 0-4-4zM6 13h12v7H6zM3 13v7M21 13v7M12 16h.01" />
  </svg>
);

interface NavItem { id: TabId; label: string; icon: React.ElementType }
interface SettingsNavItem { id: SettingsSubTabId; label: string; icon: React.ElementType }

const WORSHIP_NAV_GROUPS: { key: string; title: string; icon: React.ElementType; items: NavItem[] }[] = [
  {
    key: 'daily',
    title: 'العبادات اليومية',
    icon: MosqueIcon,
    items: [
      { id: 'home', label: 'الرئيسية ولوحة التحكم', icon: Home },
      { id: 'salah', label: 'مواقيت الصلاة ومتابعتها', icon: MosqueIcon },
      { id: 'alarms', label: 'منبهات العبادات والصلوات ⏰', icon: Bell },
      { id: 'qibla', label: 'تحديد اتجاه القبلة', icon: Compass },
      { id: 'khushu', label: 'الخشوع وقيام الليل والتهجد 🌙', icon: Moon },
      { id: 'fasting', label: 'متابعة وتتبع الصيام', icon: Sunrise },
    ],
  },
  {
    key: 'quran',
    title: 'القرآن والأذكار',
    icon: BookOpen,
    items: [
      { id: 'quran', label: 'القرآن الكريم والختمات', icon: BookOpen },
      { id: 'adhkar', label: 'الأذكار اليومية والاستغفار', icon: Sparkles },
    ],
  },
  {
    key: 'tools',
    title: 'أدوات ومتابعة',
    icon: ListChecks,
    items: [
      { id: 'calendar', label: 'التقويم والتقرير الإحصائي', icon: Calendar },
      { id: 'analytics', label: 'جدول الاستخدام والإتقان 📊', icon: BarChart3 },
      { id: 'moon', label: 'أطوار ومنازل القمر 🌙✨', icon: Moon },
      { id: 'widgets', label: 'أدوات الشاشة الذكية (Widgets) 📱', icon: Smartphone },
    ],
  },
];

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { id: 'dashboard', label: 'تخصيص الشاشة الرئيسية', icon: Sliders },
  { id: 'smartNotifications', label: 'الإشعارات الذكية والورد اليومي', icon: Bell },
  { id: 'prayer', label: 'إعدادات الصلاة والمذهب', icon: Sliders },
  { id: 'location', label: 'إعدادات الموقع الجغرافي والـ GPS', icon: MapPin },
  { id: 'adhan', label: 'أصوات الأذان وتنبيهات المؤذنين', icon: Volume2 },
  { id: 'calendar', label: 'تعديل التقويم الهجري', icon: Calendar },
  { id: 'theme', label: 'مظهر التطبيق وشكل الساعة', icon: Settings },
  { id: 'qada', label: 'سجل القضاء وتتبع الفوائت', icon: Clock },
  { id: 'duas', label: 'الأدعية المخصصة المحفوظة', icon: Heart },
  { id: 'backup', label: 'نسخ احتياطي واسترداد البيانات', icon: RotateCcw },
];

export interface AppSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  activeSettingsSubTab: SettingsSubTabId;
  setActiveSettingsSubTab: (subTab: SettingsSubTabId) => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setIsQuickSettingsOpen: (open: boolean) => void;
  setIsTourModalOpen: (open: boolean) => void;
  setIsVersionModalOpen: (open: boolean) => void;
  isInstalled: boolean;
  handleInstallApp: () => void;
  handleShareApp: () => void;
  setToastMessage: (msg: string | null) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  activeTab,
  setActiveTab,
  activeSettingsSubTab,
  setActiveSettingsSubTab,
  settings,
  setSettings,
  setIsQuickSettingsOpen,
  setIsTourModalOpen,
  setIsVersionModalOpen,
  isInstalled,
  handleInstallApp,
  handleShareApp,
  setToastMessage,
}) => {
  // Which nav group contains the currently active tab — that group opens by default,
  // so the sidebar shows where you already are instead of dumping every item on screen.
  const activeWorshipGroupKey = WORSHIP_NAV_GROUPS.find(g =>
    g.items.some(item => item.id === activeTab)
  )?.key;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    daily: activeWorshipGroupKey ? activeWorshipGroupKey === 'daily' : true,
    quran: activeWorshipGroupKey === 'quran',
    tools: activeWorshipGroupKey === 'tools',
    settings: activeTab === 'settings',
    more: false,
  });

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black z-50 cursor-pointer"
          />

          {/* Sidebar Body */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white dark:bg-[#161d26] z-50 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            dir="rtl"
          >
            <div className="space-y-6">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <MosqueIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-black text-slate-800 dark:text-white">القائمة والضبط</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer text-xs font-bold"
                  aria-label="إغلاق القائمة الجانبية"
                >
                  إغلاق
                </button>
              </div>

              {/* Gender/Spiritual Identity Selection Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/20 dark:to-slate-800/40 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">تخصيص الهوية الإيمانية</span>
                  </div>
                  <span className="text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md font-black">ذكي</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSettings(prev => ({ ...prev, gender: 'male' }));
                      setToastMessage("تم تخصيص فقه وأحكام الرجال: مواقيت الجمعة، سنن الجماعة، والأذكار المخصصة تلقائياً 🕌");
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 border ${
                      (settings.gender || 'male') === 'male'
                        ? 'bg-indigo-600 text-white shadow-sm border-indigo-500 font-black'
                        : 'bg-white dark:bg-[#161d26] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-100 dark:border-slate-800/60'
                    }`}
                    aria-label="اختيار الهوية الإيمانية: ذكر"
                  >
                    <span>ذكر 👨</span>
                  </button>
                  <button
                    onClick={() => {
                      setSettings(prev => ({ ...prev, gender: 'female' }));
                      setToastMessage("تم تخصيص فقه وأحكام النساء: تتبع الأعذار الشرعية، أيام قضاء الصيام، وتخصيص الصلوات تلقائياً 🌸");
                    }}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 border ${
                      settings.gender === 'female'
                        ? 'bg-rose-600 text-white shadow-sm border-rose-500 font-black'
                        : 'bg-white dark:bg-[#161d26] text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 border-slate-100 dark:border-slate-800/60'
                    }`}
                    aria-label="اختيار الهوية الإيمانية: أنثى"
                  >
                    <span>أنثى 👩</span>
                  </button>
                </div>

                {/* Smart Dynamic helper tip */}
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className={`p-2 rounded-xl border text-[9.5px] leading-relaxed font-bold ${
                    settings.gender === 'female'
                      ? 'bg-rose-50/50 dark:bg-rose-950/10 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-950/20'
                      : 'bg-indigo-50/50 dark:bg-indigo-950/10 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-950/20'
                  }`}
                >
                  {settings.gender === 'female' ? (
                    <span>وضع المرأة نشط: تفعيل تتبع الأعذار، قضاء الصيام، وسنن الصلوات النسائية تلقائياً. 🌸</span>
                  ) : (
                    <span>وضع الرجل نشط: تفعيل سنن الجماعة بالمسجد، شعائر الجمعة، والأحكام المخصصة تلقائياً. 🕌</span>
                  )}
                </motion.div>
              </div>

              {/* Single Clean Menu Item for Quick Settings Page/Modal */}
              <button
                onClick={() => {
                  setIsQuickSettingsOpen(true);
                  setIsSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-indigo-500/5 to-transparent dark:from-indigo-500/20 dark:via-indigo-500/10 dark:to-transparent border border-indigo-200/80 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 font-extrabold hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 transition-all cursor-pointer shadow-xs active:scale-98"
                aria-label="التحكم والإعدادات السريعة"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="">
                    <div className="text-xs font-black">التحكم والإعدادات السريعة ⚙️</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">المظهر، خلفية البطاقات، المذهب والساعة</div>
                  </div>
                </div>
              </button>

              {/* Worship Navigation — grouped into collapsible categories instead of one long list */}
              <div className="space-y-3">
                {WORSHIP_NAV_GROUPS.map(group => (
                  <SidebarSection
                    key={group.key}
                    title={group.title}
                    icon={group.icon}
                    isOpen={openGroups[group.key]}
                    onToggle={() => toggleGroup(group.key)}
                  >
                    {group.items.map(item => {
                      const Icon = item.icon;
                      const isSelected = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold  transition-all cursor-pointer w-full ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-black'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 text-slate-500 dark:text-slate-450 shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </SidebarSection>
                ))}
              </div>

              {/* Settings Pages — one collapsible group instead of 10 always-visible buttons */}
              <SidebarSection
                title="إعدادات وضبط التطبيق"
                icon={Settings}
                isOpen={openGroups.settings}
                onToggle={() => toggleGroup('settings')}
              >
                {SETTINGS_NAV_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isSelected = activeTab === 'settings' && activeSettingsSubTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab('settings');
                        setActiveSettingsSubTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold  transition-all cursor-pointer w-full ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-black border border-amber-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-500 dark:text-slate-450 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </SidebarSection>

              {/* More — tour / share / install, collapsed into compact rows instead of 3 full promo cards */}
              <SidebarSection
                title="المزيد"
                icon={MoreHorizontal}
                isOpen={openGroups.more}
                onToggle={() => toggleGroup('more')}
              >
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsTourModalOpen(true);
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold  transition-all cursor-pointer w-full text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>دليل وجولة مزايا التطبيق 💡</span>
                </button>

                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    handleShareApp();
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold  transition-all cursor-pointer w-full text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <Share2 className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>مشاركة التطبيق مع الأصدقاء 📤</span>
                </button>

                {!isInstalled && (
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleInstallApp();
                    }}
                    className="flex items-center gap-3 p-2.5 rounded-xl text-xs font-bold  transition-all cursor-pointer w-full text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <Download className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>تثبيت التطبيق كـ App 📱</span>
                  </button>
                )}
              </SidebarSection>

            </div>

            {/* Sidebar Footer with App Version Badge */}
            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-4 text-center space-y-2">
              {/* App Version Tag Trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsVersionModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-full text-[10px] font-black border border-slate-200 dark:border-slate-700/60 transition-all cursor-pointer active:scale-95 relative"
                title="عرض تفاصيل الإصدار وسجل التحديثات"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>هِمَّتِي v{APP_VERSION.version} (بناء {APP_VERSION.buildNumber})</span>
                {getUnreadVersionStatus().isNew && (
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full animate-bounce shadow-xs">
                    جديد ✨
                  </span>
                )}
              </button>

              <span className="text-[9px] text-slate-400/80 dark:text-slate-500/80 block">
                يعمل بالكامل دون خوادم لخصوصية تامة 🤍
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
