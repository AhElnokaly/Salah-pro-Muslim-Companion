import React, { useState, useRef, useEffect } from 'react';
import { Menu, Sun, Moon, Monitor, Bell, AlarmClock, Lightbulb, MapPin, MoreHorizontal, Sparkles, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, TabId } from '../../types';
import { WeatherWidget } from '../WeatherWidget';
import companionIcon from '../../assets/images/hemmaty_logo.png';

export interface AppHeaderProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setIsSidebarOpen: (open: boolean) => void;
  setActiveTab: (tab: TabId) => void;
  activeTab?: TabId;
  notificationsCount?: number;
  setIsTourModalOpen: (open: boolean) => void;
  setShowSpiritualModal: (show: boolean) => void;
  headerRippleActive: boolean;
  setHeaderRippleActive: (active: boolean) => void;
  headerParticles: Array<{ id: number; emoji: string; x: number; y: number; scale: number; rotate: number }>;
  triggerHeaderParticles: () => void;
  playSpiritualChime: (freq: number) => void;
  isSyncing: boolean;
  isOnline: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  settings,
  setSettings,
  setIsSidebarOpen,
  setActiveTab,
  activeTab,
  notificationsCount,
  setIsTourModalOpen,
  setShowSpiritualModal,
  headerRippleActive,
  setHeaderRippleActive,
  headerParticles,
  triggerHeaderParticles,
  playSpiritualChime,
  isSyncing,
  isOnline
}) => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMoreMenuOpen]);

  return (
    <header className="w-full max-w-md md:max-w-xl bg-white/95 dark:bg-[#121820]/95 backdrop-blur-md border-b border-[#e2e8f0]/80 dark:border-slate-800/80 px-3 md:px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-xs transition-colors duration-300 rounded-b-3xl">
      {/* Right side: Menu + App Brand & Location */}
      <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
          title="افتح القائمة الجانبية"
          aria-label="فتح القائمة الجانبية والضبط"
        >
          <Menu className="w-4.5 h-4.5 md:w-5 md:h-5" />
        </button>
        
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative flex items-center justify-center shrink-0">
            {/* Concentric Expanding Spiritual Ripples */}
            {headerRippleActive && (
              <>
                <motion.span
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 rounded-2xl border-2 border-indigo-500/60 pointer-events-none z-0"
                />
                <motion.span
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 3.2, opacity: 0 }}
                  transition={{ duration: 1.1, ease: "easeOut", delay: 0.15 }}
                  className="absolute inset-0 rounded-2xl border-2 border-emerald-400/50 pointer-events-none z-0"
                />
                <motion.span
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 4.2, opacity: 0 }}
                  transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
                  className="absolute inset-0 rounded-2xl border border-teal-300/30 pointer-events-none z-0"
                />
              </>
            )}

            {/* Floating Spiritual Particles */}
            <AnimatePresence>
              {headerParticles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 0.1, rotate: 0 }}
                  animate={{ 
                    opacity: 0, 
                    x: p.x, 
                    y: p.y, 
                    scale: p.scale, 
                    rotate: p.rotate 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1.3, 
                    ease: [0.19, 1, 0.22, 1]
                  }}
                  className="absolute text-sm pointer-events-none z-20 select-none drop-shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                >
                  {p.emoji}
                </motion.span>
              ))}
            </AnimatePresence>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setHeaderRippleActive(true);
                triggerHeaderParticles();
                setTimeout(() => setHeaderRippleActive(false), 1400);
                playSpiritualChime(523.25);
                setTimeout(() => {
                  setShowSpiritualModal(true);
                }, 250);
              }}
              className="relative w-10 h-10 md:w-11 md:h-11 rounded-2xl overflow-hidden border-2 border-emerald-500/40 dark:border-amber-400/50 flex items-center justify-center shrink-0 cursor-pointer shadow-md shadow-emerald-500/20 focus:outline-hidden z-10 transition-all duration-300 bg-[#121d2a]"
              title="اضغط لتفتح بوابة النفحات الإيمانية 🌸"
            >
              <img 
                src={companionIcon} 
                alt="هِمَّتِي" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/hemmaty_logo.png';
                }}
                className="w-full h-full object-cover select-none transition-transform duration-300 hover:scale-105"
                referrerPolicy="no-referrer" 
              />
              <span className="absolute inset-0 ring-1 ring-inset ring-white/20 rounded-2xl pointer-events-none" />
              
              {/* Dynamic Smart Network & Sync Status Indicator Dot */}
              {isSyncing ? (
                <span 
                  className="absolute bottom-0.5 end-0.5 w-3 h-3 bg-amber-400 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_10px_#f59e0b] animate-ping"
                  title="جاري التحديث ومزامنة المواقيت أونلاين... 🟡"
                />
              ) : isOnline ? (
                <span 
                  className="absolute bottom-0.5 end-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_8px_#10b981]"
                  title="متصل بالشبكة - الخدمة أونلاين 🟢"
                />
              ) : (
                <span 
                  className="absolute bottom-0.5 end-0.5 w-2.5 h-2.5 bg-rose-500 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_8px_#f43f5e] animate-pulse"
                  title="غير متصل بالشبكة - يعمل أوفلاين بالكامل 🔴"
                />
              )}
            </motion.button>
          </div>

          <div className="flex flex-col text-right min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <h1 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">هِمَّتِي</h1>
            </div>
            <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('trigger-gps-sync'));
                }}
                className="text-[9px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-0.5 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer truncate"
                title="اضغط لتحديث موقعك ومزامنة المواقيت تلقائياً عبر الـ GPS 📡"
                aria-label="مزامنة وتحديث الموقع الجغرافي والمواقيت"
              >
                <MapPin className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                <span className="truncate max-w-[80px] sm:max-w-[120px]">{settings.cityName || 'الإسكندرية'}</span>
              </button>
              <WeatherWidget lat={settings.latitude} lng={settings.longitude} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Left side: Streamlined High-Priority Action Panel */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* App Notifications Button (Bell 🔔) */}
        <button 
          onClick={() => {
            if (activeTab && activeTab !== 'home') {
              setActiveTab('home');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('open-spiritual-notifications'));
              }, 120);
            } else {
              window.dispatchEvent(new CustomEvent('open-spiritual-notifications'));
            }
          }}
          className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 relative shadow-2xs"
          title="الإشعارات والتنبيهات الإيمانية 🔔"
          aria-label="عرض الإشعارات والتنبيهات الإيمانية"
        >
          <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          {typeof notificationsCount === 'number' && notificationsCount > 0 ? (
            <span className="absolute -top-1 -end-1 min-w-[17px] h-[17px] px-1 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs animate-pulse">
              {notificationsCount > 9 ? '+9' : notificationsCount}
            </span>
          ) : null}
        </button>

        {/* Worship Alarms Shortcut Button (Alarm Clock ⏰) */}
        <button 
          onClick={() => setActiveTab('alarms')}
          className="w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs"
          title="منبهات العبادات والصلوات ⏰"
          aria-label="منبهات العبادات والصلوات"
        >
          <AlarmClock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </button>

        {/* Quick Actions Dropdown Menu (⋯ More Menu) */}
        <div className="relative" ref={moreMenuRef}>
          <button 
            onClick={() => setIsMoreMenuOpen(prev => !prev)}
            className={`w-8.5 h-8.5 md:w-9.5 md:h-9.5 rounded-xl border transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0 shadow-2xs ${
              isMoreMenuOpen
                ? 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border-indigo-500/40 ring-2 ring-indigo-500/20'
                : 'bg-slate-100/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200/70 dark:border-slate-700/60'
            }`}
            title="المزيد من الأدوات السريعة ⋯"
            aria-label="فتح قائمة الأدوات السريعة"
            aria-expanded={isMoreMenuOpen}
          >
            <MoreHorizontal className="w-4.5 h-4.5" />
          </button>

          {/* Floating Dropdown Card */}
          <AnimatePresence>
            {isMoreMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -6 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute left-0 mt-2 w-64 bg-white/98 dark:bg-[#141b26]/98 backdrop-blur-xl rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 p-2.5 z-50 text-right overflow-hidden space-y-2"
              >
                {/* Header title */}
                <div className="flex items-center justify-between px-1.5 pb-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] font-black text-slate-800 dark:text-slate-200">أدوات سريعة</span>
                  <span className="text-[10px] text-slate-400 font-medium">خيارات همّتي</span>
                </div>

                {/* Theme Switcher Segmented Control */}
                <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'light' }))}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      settings.theme === 'light'
                        ? 'bg-white text-amber-600 shadow-xs dark:bg-slate-700'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    title="المظهر النهاري"
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>نهاري</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'dark' }))}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      settings.theme === 'dark'
                        ? 'bg-[#1e2736] text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    title="المظهر الليلي"
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>ليلي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, theme: 'system' }))}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      settings.theme === 'system'
                        ? 'bg-white text-slate-700 shadow-xs dark:bg-slate-700 dark:text-slate-200'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                    title="المظهر التلقائي حسب النظام"
                  >
                    <Monitor className="w-3.5 h-3.5 text-slate-400" />
                    <span>تلقائي</span>
                  </button>
                </div>

                {/* Menu items list */}
                <div className="space-y-1">
                  {/* Minaret / Athan Simulator Item */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent('trigger-athan-simulation'));
                      }, 100);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 text-right cursor-pointer group"
                  >
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Volume2 className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">محاكاة تجربة الأذان</span>
                      <span className="text-[9px] text-slate-400 truncate">سماع صوت وتكبيرات الأذان الحية</span>
                    </div>
                  </button>

                  {/* Interactive Guide / Tour Item */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setIsTourModalOpen(true);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl hover:bg-indigo-500/10 dark:hover:bg-indigo-500/15 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 text-right cursor-pointer group"
                  >
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Lightbulb className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">جولة في مزايا همّتي</span>
                      <span className="text-[9px] text-slate-400 truncate">استكشاف المزايا والخصائص التفاعلية</span>
                    </div>
                  </button>

                  {/* Spiritual Portal Shortcut */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setShowSpiritualModal(true);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl hover:bg-amber-500/10 dark:hover:bg-amber-500/15 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 text-right cursor-pointer group"
                  >
                    <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">النفحات والرسائل الإيمانية</span>
                      <span className="text-[9px] text-slate-400 truncate">إشراقات وأذكار لرفع الهمّة</span>
                    </div>
                  </button>

                  {/* GPS Location Refresh */}
                  <button
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      window.dispatchEvent(new CustomEvent('trigger-gps-sync'));
                    }}
                    className="w-full px-2.5 py-2 rounded-xl hover:bg-teal-500/10 dark:hover:bg-teal-500/15 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-2.5 text-right cursor-pointer group"
                  >
                    <span className="w-7 h-7 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">تحديث الموقع عبر GPS</span>
                      <span className="text-[9px] text-slate-400 truncate">مزامنة مواقيت {settings.cityName || 'المدينة'}</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};
