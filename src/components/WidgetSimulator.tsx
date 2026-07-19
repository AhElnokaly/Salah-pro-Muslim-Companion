import React, { useState, useEffect } from 'react';
import { Smartphone, BookOpen, Clock, Heart, Sparkles, RotateCw, MapPin, Calendar, Sun, Moon, ArrowRight, ChevronLeft, Volume2, Shield } from 'lucide-react';
import { toArabicNumbers } from '../utils/hijri';

interface WidgetSimulatorProps {
  prayerTimes: any;
  settings: any;
  currentPrayer?: string;
  nextPrayer?: string;
  timeRemainingStr?: string;
  hijri?: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  dayNameArabic?: string;
  gregorianStr?: string;
}

const WALLPAPERS = [
  { id: 'slate', name: 'رمادي غامق', style: 'bg-slate-950' },
  { id: 'desert', name: 'غروب الصحراء', style: 'bg-gradient-to-tr from-[#1f1235] via-[#481d3d] to-[#99413b]' },
  { id: 'forest', name: 'أوراق الشجر الخضراء', style: 'bg-gradient-to-b from-[#061f18] via-[#0c2e26] to-[#143d34]' },
  { id: 'starry', name: 'سماء مرصعة بالنجوم', style: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950 via-slate-950 to-black' }
];

export default function WidgetSimulator({
  prayerTimes,
  settings,
  currentPrayer = 'Dhuhr',
  nextPrayer = 'Asr',
  timeRemainingStr = '02:15:30',
  hijri,
  dayNameArabic = 'الجمعة',
  gregorianStr = '١٧ يوليو ٢٠٢٦'
}: WidgetSimulatorProps) {
  const [widgetType, setWidgetType] = useState<'timeline' | 'grid' | 'teal' | 'analog' | 'compact'>('timeline');
  const [widgetTheme, setWidgetTheme] = useState<'green' | 'gold' | 'glass' | 'dark-blue'>('dark-blue');
  const [activeWallpaper, setActiveWallpaper] = useState('starry');
  const [internalTime, setInternalTime] = useState<Date>(new Date());

  // Keep a local timer for the analog clock hands
  useEffect(() => {
    const timer = setInterval(() => {
      setInternalTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentWallpaper = WALLPAPERS.find(w => w.id === activeWallpaper) || WALLPAPERS[3];

  const getWidgetThemeClass = () => {
    switch (widgetTheme) {
      case 'green':
        return 'bg-gradient-to-b from-emerald-950/95 to-teal-900/95 border border-emerald-500/30 text-white shadow-xl';
      case 'gold':
        return 'bg-gradient-to-b from-[#1c1b18]/95 via-[#23201a]/95 to-[#2b2720]/95 border border-amber-500/20 text-amber-100 shadow-xl';
      case 'glass':
        return 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl';
      case 'dark-blue':
        return 'bg-gradient-to-b from-[#0c1826]/95 to-[#112236]/95 border border-blue-900/40 text-white shadow-2xl';
    }
  };

  const getThemeTextClass = () => {
    if (widgetTheme === 'gold') return 'text-amber-300';
    if (widgetTheme === 'green') return 'text-emerald-400';
    return 'text-amber-400';
  };

  // Helper to translate prayer names to Arabic
  const getArabicName = (p: string) => {
    const names: Record<string, string> = {
      Fajr: 'الفجر',
      Sunrise: 'الشروق',
      Dhuhr: 'الظهر',
      Asr: 'العصر',
      Maghrib: 'المغرب',
      Isha: 'العشاء'
    };
    if (p === 'Dhuhr' && internalTime.getDay() === 5) return 'الجمعة';
    return names[p] || p;
  };

  // Get countdown string in compact form (e.g. - 2h 15m)
  const getCompactCountdown = () => {
    const parts = timeRemainingStr.split(':');
    if (parts.length < 3) return timeRemainingStr;
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    const s = parseInt(parts[2]);
    return `-${toArabicNumbers(h)}س ${toArabicNumbers(m)}د`;
  };

  // Calculate coordinates for analog clock mockup
  const sec = internalTime.getSeconds();
  const min = internalTime.getMinutes();
  const hr = internalTime.getHours();

  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = (hr % 12) * 30 + min * 0.5;

  const currentDayDigit = hijri?.day || internalTime.getDate();
  const currentMonthName = hijri?.monthName || 'شوال';
  const currentYear = hijri?.year || 1448;

  return (
    <div 
      id="widget-simulator-section" 
      className={`rounded-3xl p-6 border transition-all duration-300 space-y-6 ${
        settings.appStyle === 'glass-dark'
          ? 'bg-[#111723]/80 backdrop-blur-md border-white/5 shadow-2xl text-slate-100'
          : 'bg-white border-[#e2e8f0] shadow-sm text-slate-800'
      }`}
      dir="rtl"
    >
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/40 dark:border-slate-800/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center text-lg shadow-inner">
            📱
          </div>
          <div className="text-right">
            <h3 className="text-base font-black text-slate-850 dark:text-white leading-none">تطبيقات شاشة الهاتف الذكية (HomeScreen Widgets)</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-bold mt-1">
              حاكي وجرب المكونات التفاعلية الراقية المستوحاة من تطبيقات الصلاة على هاتفك
            </p>
          </div>
        </div>
        
        {/* Wallpapers Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/30 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-1">الخلفية:</span>
          {WALLPAPERS.map(w => (
            <button
              key={w.id}
              type="button"
              onClick={() => setActiveWallpaper(w.id)}
              className={`py-1 px-2.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                activeWallpaper === w.id
                  ? 'bg-white dark:bg-slate-700 text-slate-850 dark:text-white shadow-xs'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {w.name}
            </button>
          ))}
        </div>
      </div>

      {/* Selector of Widget Presets - Inspired by Salatuk Images */}
      <div className="space-y-2.5 text-right">
        <label className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          اختر أحد تصميمات الـ Widgets المستوحاة من صورك لتجربتها مباشرة:
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {[
            { id: 'timeline', label: 'الشريط الزمني المطور 📊', size: 'medium', desc: 'Salatuk Timeline' },
            { id: 'grid', label: 'شبكة بطاقات الصلاة 🗂️', size: 'large', desc: 'Six Prayer Cards' },
            { id: 'teal', label: 'عداد الوقت المضيء 🕌', size: 'medium', desc: 'Teal Modern Card' },
            { id: 'analog', label: 'الساعة الكلاسيكية 🕒', size: 'medium', desc: 'Analog Clock Widget' },
            { id: 'compact', label: 'الوجت الرياضي المصغر ⚡', size: 'small', desc: 'Compact Bar' }
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setWidgetType(type.id as any);
                // Auto adjust wallpaper or settings for optimal view if desired
                if (type.id === 'teal') {
                  setWidgetTheme('glass');
                } else if (type.id === 'analog') {
                  setWidgetTheme('dark-blue');
                }
              }}
              className={`p-3 rounded-2xl border text-right transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col justify-between ${
                widgetType === type.id
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-850 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
              }`}
            >
              <span className="text-[11px] font-black leading-tight block">{type.label}</span>
              <span className={`text-[8px] font-extrabold mt-1 block ${widgetType === type.id ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                {type.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Interface Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Mockup Frame Settings & Customization */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between bg-slate-50 dark:bg-slate-900/40 p-5 rounded-3xl border border-slate-100 dark:border-white/5">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-800 dark:text-white border-b border-slate-200/50 dark:border-slate-800 pb-2">لوحة تخصيص المكون اللاسلكي</h4>
            
            {/* Theme Selector - Hidden or overridden for Teal gradient layout */}
            {widgetType !== 'teal' && widgetType !== 'compact' && (
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">النمط البصري للمكون (Theme)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'dark-blue', label: '🔵 كحلي إيماني', style: 'border-blue-900/30' },
                    { id: 'green', label: '🟢 أخضر مكة', style: 'border-emerald-500/20' },
                    { id: 'gold', label: '🟡 ذهبي كلاسيك', style: 'border-amber-500/20' },
                    { id: 'glass', label: '💎 زجاجي بلوري', style: 'border-white/10' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setWidgetTheme(t.id as any)}
                      className={`py-2 px-3 rounded-xl border text-[11px] font-black cursor-pointer text-center transition-all ${
                        widgetTheme === t.id
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-600 dark:text-indigo-400 font-black shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Simulated Live Info Block */}
            <div className="p-3 bg-white dark:bg-slate-800/40 border border-slate-200/40 dark:border-white/5 rounded-2xl text-right space-y-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">بيانات الهاتف المستشعرة</span>
              <div className="text-[10px] text-slate-600 dark:text-slate-300 font-bold space-y-0.5">
                <p className="flex justify-between"><span>الموقع الجغرافي النشط:</span> <span className="text-amber-500 dark:text-amber-400">{settings.cityName || 'سان ستيفانو'} 📍</span></p>
                <p className="flex justify-between"><span>التوقيت المحلي:</span> <span className="text-indigo-500 dark:text-indigo-400" dir="ltr">{internalTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></p>
                <p className="flex justify-between"><span>الحدث القادم:</span> <span className="text-emerald-500 dark:text-emerald-400">صلاة {getArabicName(nextPrayer)} بعد {toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}</span></p>
              </div>
            </div>
          </div>

          {/* Educational Quick Setup Steps */}
          <div className="bg-amber-50/40 dark:bg-amber-950/10 p-4 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 text-right space-y-2">
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase block flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5" />
              كيفية تثبيت الـ Widgets على هاتفك الفعلي:
            </span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5 font-bold leading-relaxed">
              <p>• <strong className="text-slate-750 dark:text-slate-200">هواتف الأندرويد (Android):</strong> انقر نقرة مطولة على مساحة فارغة بشاشتك الرئيسية ← اختر "أدوات / Widgets" ← ابحث عن تطبيق <span className="text-amber-600">رفيق المسلم</span> ← اسحب الـ Widget المفضل وضعه في أي مكان.</p>
              <p>• <strong className="text-slate-750 dark:text-slate-200">هواتف الآيفون (iOS):</strong> اضغط مطولاً على أي أيقونة تطبيق ← اضغط على زر (+) في الزاوية العلوية ← ابحث عن <span className="text-amber-600">رفيق المسلم</span> ← اختر الحجم المناسب واضغط "إضافة أداة".</p>
            </div>
          </div>
        </div>

        {/* Right Side: Smartphone Live View Mockup Frame */}
        <div className="lg:col-span-7 flex justify-center items-center">
          <div className="relative w-full max-w-[320px] rounded-[48px] border-[10px] border-slate-800 dark:border-slate-900 bg-black overflow-hidden aspect-[9/16] shadow-2xl flex flex-col justify-between p-3.5 pb-6">
            
            {/* Dynamic Island / Phone Notch */}
            <div className="absolute top-0 inset-x-0 h-5 flex justify-center z-20">
              <div className="w-24 h-4 bg-black rounded-b-xl flex items-center justify-center gap-1.5 px-3">
                <span className="w-2 h-2 rounded-full bg-slate-900" />
                <span className="w-10 h-1.5 bg-slate-900 rounded-full" />
              </div>
            </div>

            {/* Live Mobile Wallpaper */}
            <div className={`absolute inset-0 z-0 ${currentWallpaper.style} transition-all duration-700`} />

            {/* Phone Status bar */}
            <div className="flex justify-between items-center z-10 text-[9px] text-white/95 font-sans font-bold px-3 pt-1.5">
              <span dir="ltr">{internalTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex items-center gap-1" dir="ltr">
                <span>📶</span>
                <span>🛜</span>
                <span className="text-[8px]">🔋 ٩٥٪</span>
              </div>
            </div>

            {/* Central Simulated Widget Area - Dynamic based on widgetType state */}
            <div className="my-auto z-10 w-full flex items-center justify-center py-4 px-1 min-h-[170px]">
              
              {/* STYLE 1: Salatuk Timeline Widget (4x2 / Medium) */}
              {widgetType === 'timeline' && (
                <div className={`w-full rounded-[24px] p-4 flex flex-col justify-between transition-all duration-500 border text-right select-none ${getWidgetThemeClass()}`}>
                  {/* Header Row */}
                  <div className="flex justify-between items-start border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex flex-col items-center justify-center shadow-md font-sans">
                        <span className="text-[12px] font-black leading-none">{toArabicNumbers(currentDayDigit)}</span>
                        <span className="text-[7px] font-bold leading-none">{currentMonthName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black block text-white/90">{dayNameArabic}</span>
                        <span className="text-[8px] font-bold block text-white/50">{toArabicNumbers(gregorianStr.split(' ').slice(0, 3).join(' '))}</span>
                      </div>
                    </div>
                    {/* Golden Countdown Display */}
                    <div className="text-left">
                      <span className="text-[8px] font-bold block text-white/40">الوقت المتبقي للأذان</span>
                      <span className="text-[13px] font-extrabold block text-amber-400 font-mono" dir="ltr">
                        - {toArabicNumbers(timeRemainingStr)}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Timeline Slider (Core of Salatuk layout) */}
                  <div className="relative py-4 my-1 flex items-center justify-between">
                    {/* The slider grey line */}
                    <div className="absolute inset-x-2 h-[2px] bg-white/20 top-1/2 -translate-y-1/2 z-0 rounded-full" />
                    
                    {/* Yellow progress line connecting past prayers to current */}
                    <div 
                      className="absolute right-2 h-[2.5px] bg-amber-400 top-1/2 -translate-y-1/2 z-0 rounded-full transition-all duration-1000"
                      style={{ 
                        left: currentPrayer === 'Fajr' ? '80%' : currentPrayer === 'Dhuhr' ? '60%' : currentPrayer === 'Asr' ? '40%' : currentPrayer === 'Maghrib' ? '20%' : '2%' 
                      }}
                    />

                    {/* Timeline Dot Items */}
                    {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName, idx) => {
                      const isActive = currentPrayer === pName;
                      const isNext = nextPrayer === pName;
                      const prayerTime = prayerTimes[pName] || '٠٠:٠٠';

                      // Determine state of past/future for styling
                      const isPast = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].indexOf(currentPrayer) >= idx;

                      return (
                        <div key={pName} className="flex flex-col items-center relative z-10">
                          {/* Dot */}
                          <div 
                            className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                              isActive 
                                ? 'bg-amber-400 text-slate-900 border-2 border-white scale-125 shadow-lg shadow-amber-400/50' 
                                : isPast 
                                  ? 'bg-amber-400/90 text-slate-950 scale-100'
                                  : 'bg-[#1b2b3c] border border-white/10'
                            }`}
                          >
                            {isActive && <div className="w-1.5 h-1.5 bg-slate-950 rounded-full animate-ping" />}
                          </div>

                          {/* Time label */}
                          <span className={`text-[7px] font-bold font-sans mt-1.5 block ${isActive ? 'text-amber-400' : 'text-white/60'}`}>
                            {getArabicName(pName)}
                          </span>
                          <span className={`text-[8px] font-extrabold font-mono mt-0.5 block ${isActive ? 'text-white' : 'text-white/40'}`}>
                            {toArabicNumbers(prayerTime)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer metadata */}
                  <div className="flex justify-between items-center border-t border-white/5 pt-2 text-[8px] text-white/50 font-bold">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-amber-400" />
                      {settings.cityName || 'الإسكندرية'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Sun className="w-2.5 h-2.5 text-amber-300" />
                      الشروق {toArabicNumbers(prayerTimes.Sunrise || '٠٦:٠٨')} ص
                    </span>
                  </div>
                </div>
              )}

              {/* STYLE 2: Salatuk Six Grid Cards Widget (4x4 / Large) */}
              {widgetType === 'grid' && (
                <div className={`w-full rounded-[24px] p-3 flex flex-col justify-between transition-all duration-500 border text-right select-none h-[220px] ${getWidgetThemeClass()}`}>
                  {/* Top Bar info */}
                  <div className="flex justify-between items-center border-b border-white/10 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[9px] font-black text-white">{dayNameArabic} - {toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
                    </div>
                    <span className="text-[8px] font-black text-amber-400 font-mono tracking-wider flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" />
                      {settings.cityName || 'الإسكندرية'}
                    </span>
                  </div>

                  {/* Grid layout of 6 cards */}
                  <div className="grid grid-cols-3 gap-1.5 py-2">
                    {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                      const isActive = currentPrayer === pName;
                      const isNext = nextPrayer === pName;
                      const prayerTime = prayerTimes[pName] || '٠٠:٠٠';

                      return (
                        <div 
                          key={pName}
                          className={`p-1.5 rounded-xl border flex flex-col items-center justify-between text-center transition-all ${
                            isActive 
                              ? 'bg-[#15273b]/90 border-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.2)]' 
                              : 'bg-white/[0.03] border-white/5'
                          }`}
                        >
                          {/* Dot / Indicator */}
                          <div className="flex justify-between items-center w-full px-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400' : isNext ? 'bg-indigo-400' : 'bg-white/10'}`} />
                            {isActive && (
                              <span className="text-[6px] font-black bg-amber-400/25 text-amber-400 px-1 py-0.2 rounded-sm" dir="ltr">
                                {getCompactCountdown()}
                              </span>
                            )}
                          </div>

                          <span className={`text-[8px] font-black mt-1 ${isActive ? 'text-amber-400' : 'text-white/70'}`}>
                            {getArabicName(pName)}
                          </span>
                          
                          <span className={`text-[9px] font-black font-mono mt-0.5 ${isActive ? 'text-white' : 'text-white/40'}`}>
                            {toArabicNumbers(prayerTime)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Widget Footer */}
                  <div className="text-center text-[7px] text-white/30 font-bold border-t border-white/5 pt-1.5">
                    مواقيت الصلاة المزامنة • رفيق المسلم المطور
                  </div>
                </div>
              )}

              {/* STYLE 3: Teal Countdown Card Widget (4x2 / Medium) */}
              {widgetType === 'teal' && (
                <div className="w-full rounded-[24px] p-4 flex flex-col justify-between transition-all duration-500 bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white shadow-2xl relative overflow-hidden select-none border border-teal-400/30">
                  {/* Mosque Background Accents */}
                  <div className="absolute -left-4 -bottom-6 opacity-10 pointer-events-none">
                    <span className="text-[90px]">🕌</span>
                  </div>

                  {/* Header */}
                  <div className="flex justify-between items-center border-b border-white/15 pb-1.5">
                    <span className="text-[8px] font-black flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-teal-200" />
                      {settings.cityName || 'الإسكندرية'}
                    </span>
                    <span className="text-[8px] font-bold text-teal-100 font-mono">
                      {toArabicNumbers(currentDayDigit)} {currentMonthName} {toArabicNumbers(currentYear)}هـ
                    </span>
                  </div>

                  {/* Large countdown statement */}
                  <div className="py-2.5 text-right space-y-0.5">
                    <span className="text-[8px] font-black text-teal-100/70 block uppercase">الصلاة القادمة بعد قليل</span>
                    <h3 className="text-[13px] font-black text-white flex justify-between items-center leading-none">
                      <span>صلاة {getArabicName(nextPrayer)}</span>
                      <span className="text-[15px] font-black font-mono tracking-tight text-amber-300" dir="ltr">
                        {toArabicNumbers(timeRemainingStr.split(':').slice(0, 3).join(':'))}
                      </span>
                    </h3>
                  </div>

                  {/* Mini-table of prayers underneath */}
                  <div className="grid grid-cols-5 gap-1 text-center bg-black/10 rounded-xl p-1 border border-white/5">
                    {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                      const isActive = currentPrayer === pName;
                      const prayerTime = prayerTimes[pName] || '٠٠:٠٠';

                      return (
                        <div key={pName} className={`p-1 rounded-lg transition-all ${isActive ? 'bg-white/20 text-white font-extrabold' : ''}`}>
                          <span className="text-[7px] block font-bold opacity-80">{getArabicName(pName)}</span>
                          <span className="text-[8px] block font-extrabold font-mono mt-0.5">{toArabicNumbers(prayerTime)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STYLE 4: Salatuk Analog Clock Widget (2x2 / Small / Medium) */}
              {widgetType === 'analog' && (
                <div className={`w-full rounded-[24px] p-3.5 flex flex-col sm:flex-row items-center justify-center gap-3 transition-all duration-500 border text-right select-none ${getWidgetThemeClass()}`}>
                  {/* Left: Clock Face itself */}
                  <div className="w-[85px] h-[85px] rounded-full bg-[#0a1520] border-2 border-[#192f44] relative flex items-center justify-center shadow-inner">
                    {/* Clock ticks circle */}
                    <div className="absolute inset-1 rounded-full border border-dashed border-white/5 pointer-events-none" />

                    {/* Clock Numbers */}
                    <span className="absolute top-1 text-[8px] font-black text-white/40 font-sans">١٢</span>
                    <span className="absolute right-1 text-[8px] font-black text-white/40 font-sans">٣</span>
                    <span className="absolute bottom-1 text-[8px] font-black text-white/40 font-sans">٦</span>
                    <span className="absolute left-1 text-[8px] font-black text-white/40 font-sans">٩</span>

                    {/* Digital center readout */}
                    <div className="absolute top-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <span className="text-[8px] font-bold text-sky-400 font-mono tracking-tight opacity-90 block pt-4">
                        {toArabicNumbers(internalTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }))}
                      </span>
                      {/* Arabic day name inside dial bottom part */}
                      <span className="text-[7px] font-black text-amber-400/80 leading-none block mt-0.5">
                        {dayNameArabic}
                      </span>
                    </div>

                    {/* Hour Hand */}
                    <div 
                      className="absolute w-1 h-7 bg-white rounded-full origin-bottom"
                      style={{ 
                        transform: `rotate(${hrDeg}deg)`, 
                        top: 'calc(50% - 28px)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                      }} 
                    />

                    {/* Minute Hand */}
                    <div 
                      className="absolute w-0.5 h-10 bg-white rounded-full origin-bottom"
                      style={{ 
                        transform: `rotate(${minDeg}deg)`, 
                        top: 'calc(50% - 40px)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.4)'
                      }} 
                    />

                    {/* Second Hand */}
                    <div 
                      className="absolute w-[1px] h-10 bg-red-500 origin-bottom"
                      style={{ 
                        transform: `rotate(${secDeg}deg)`, 
                        top: 'calc(50% - 40px)'
                      }} 
                    />

                    {/* Center Pin */}
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 border border-white z-10" />
                  </div>

                  {/* Right: Companion stats panel (Making it 4x2 representation) */}
                  <div className="flex-1 space-y-1 text-center sm:text-right">
                    <span className="text-[8px] font-black text-amber-400 block uppercase tracking-wider">ساعة الصلاة الكلاسيكية</span>
                    <h4 className="text-[10px] font-black text-white leading-tight">صلاة {getArabicName(nextPrayer)} القادمة بعد قليل</h4>
                    <span className="text-[8px] font-bold text-white/50 block font-mono">
                      متبقي {toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join('س ') + 'د')}
                    </span>
                    <div className="text-[7px] font-bold text-white/30 pt-1 border-t border-white/5 flex items-center justify-center sm:justify-start gap-1">
                      <MapPin className="w-2.5 h-2.5 text-white/35" />
                      {settings.cityName || 'الإسكندرية'}
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 5: Salatuk Minimal Compact Pill Widget (4x1 / Small) */}
              {widgetType === 'compact' && (
                <div className="w-full bg-[#eeeeee] dark:bg-[#1a242d] text-slate-800 dark:text-white rounded-[20px] py-2.5 px-4 flex items-center justify-between shadow-xl border border-slate-200 dark:border-white/5 select-none transition-all duration-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-extrabold font-sans">
                      {getArabicName(currentPrayer)} {getCompactCountdown()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 dark:text-slate-500">
                    <MapPin className="w-2.5 h-2.5 text-amber-500" />
                    <span>{settings.cityName || 'مكة المكرمة'}</span>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom simulated navigation shortcuts */}
            <div className="mt-auto flex justify-center gap-5 z-10 py-1">
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">📞</div>
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">💬</div>
              <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs">🌐</div>
              <div className="w-7 h-7 rounded-full bg-indigo-600/60 flex items-center justify-center text-xs border border-indigo-400/20 shadow-inner">🕌</div>
            </div>

            {/* Simulated home swipe indicator bar */}
            <div className="absolute bottom-1 inset-x-0 h-1 flex justify-center z-20">
              <div className="w-20 h-1 bg-white/60 rounded-full" />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
