import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Sun, 
  Moon, 
  Download, 
  Pin, 
  Check, 
  Clock, 
  Volume2, 
  Eye, 
  Maximize2 
} from 'lucide-react';
import { toArabicNumbers } from '../utils/hijri';

interface WidgetSimulatorProps {
  prayerTimes: any;
  settings: any;
  setSettings?: React.Dispatch<React.SetStateAction<any>>;
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
  { id: 'slate', name: 'رمادي', style: 'bg-slate-900 border-slate-750' },
  { id: 'desert', name: 'صحراء', style: 'bg-gradient-to-tr from-[#1f1235] via-[#481d3d] to-[#99413b] border-pink-900/30' },
  { id: 'forest', name: 'غابة', style: 'bg-gradient-to-b from-[#061f18] via-[#0c2e26] to-[#143d34] border-emerald-950' },
  { id: 'starry', name: 'نجوم', style: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950 via-slate-950 to-black border-sky-950' }
];

export default function WidgetSimulator({
  prayerTimes,
  settings,
  setSettings,
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
  const [isPinned, setIsPinned] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Local timer for mock clock hands and updates
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

  const getCompactCountdown = () => {
    const parts = timeRemainingStr.split(':');
    if (parts.length < 3) return timeRemainingStr;
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    return `-${toArabicNumbers(h)}س ${toArabicNumbers(m)}د`;
  };

  // Clock calculations
  const sec = internalTime.getSeconds();
  const min = internalTime.getMinutes();
  const hr = internalTime.getHours();

  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = (hr % 12) * 30 + min * 0.5;

  const currentDayDigit = hijri?.day || internalTime.getDate();
  const currentMonthName = hijri?.monthName || 'شوال';
  const currentYear = hijri?.year || 1448;

  // Pin Widget configuration to local settings (which persist)
  const handlePinWidget = () => {
    if (setSettings) {
      setSettings((prev: any) => ({
        ...prev,
        pinnedWidget: {
          type: widgetType,
          theme: widgetTheme,
          wallpaper: activeWallpaper
        }
      }));
      setIsPinned(true);
      setToastMessage('📌 تم تثبيت هذا الـ Widget بنجاح! سيظهر الآن بشكل مخصص في شاشتك الرئيسية للتطبيق 🥳🤍');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  // SVG High-Quality Vector Download Generator
  const handleDownloadWidgetSVG = () => {
    let svgContent = '';
    const width = 400;
    const height = 220;

    // Define colors & gradients based on widgetTheme
    let bgGradient = '';
    let borderStroke = '';
    let textPrimary = '';
    let textAccent = '';

    if (widgetType === 'teal') {
      bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#029587" /><stop offset="50%" stop-color="#05ab95" /><stop offset="100%" stop-color="#0ea185" /></linearGradient>';
      borderStroke = '#14b8a6';
      textPrimary = '#ffffff';
      textAccent = '#f59e0b';
    } else {
      switch (widgetTheme) {
        case 'green':
          bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#022c22" /><stop offset="100%" stop-color="#115e59" /></linearGradient>';
          borderStroke = '#10b981';
          textPrimary = '#ffffff';
          textAccent = '#10b981';
          break;
        case 'gold':
          bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1c1917" /><stop offset="100%" stop-color="#292524" /></linearGradient>';
          borderStroke = '#d97706';
          textPrimary = '#fef3c7';
          textAccent = '#f59e0b';
          break;
        case 'glass':
          bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1e293b" stop-opacity="0.95" /><stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" /></linearGradient>';
          borderStroke = '#ffffff';
          textPrimary = '#ffffff';
          textAccent = '#38bdf8';
          break;
        case 'dark-blue':
        default:
          bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0c1826" /><stop offset="100%" stop-color="#112236" /></linearGradient>';
          borderStroke = '#1e3a8a';
          textPrimary = '#ffffff';
          textAccent = '#60a5fa';
          break;
      }
    }

    const startSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" dir="rtl">
      <defs>
        ${bgGradient}
        <clipPath id="rectClip">
          <rect width="${width}" height="${height}" rx="24" />
        </clipPath>
      </defs>
      <rect width="${width}" height="${height}" rx="24" fill="url(#widgetGrad)" stroke="${borderStroke}" stroke-width="1.5" />
      <g clip-path="url(#rectClip)">
    `;

    const endSvg = `</g></svg>`;

    // Render contents inside SVG based on widgetType
    if (widgetType === 'timeline') {
      const timesArr = [
        { name: 'الفجر', time: prayerTimes.Fajr || '٠٤:٣٠', key: 'Fajr' },
        { name: 'الظهر', time: prayerTimes.Dhuhr || '١٢:١٥', key: 'Dhuhr' },
        { name: 'العصر', time: prayerTimes.Asr || '١٥:٤٥', key: 'Asr' },
        { name: 'المغرب', time: prayerTimes.Maghrib || '١٩:٠٢', key: 'Maghrib' },
        { name: 'العشاء', time: prayerTimes.Isha || '٢٠:٣٥', key: 'Isha' }
      ];

      let timelineDots = '';
      timesArr.forEach((p, idx) => {
        const x = 50 + idx * 75;
        const isActive = currentPrayer === p.key;
        const dotColor = isActive ? '#fbbf24' : '#ffffff';
        const opacVal = isActive ? '1' : '0.4';
        timelineDots += `
          <circle cx="${x}" cy="130" r="${isActive ? '8' : '5'}" fill="${dotColor}" />
          ${isActive ? `<circle cx="${x}" cy="130" r="12" fill="none" stroke="#fbbf24" stroke-width="1" opacity="0.6" />` : ''}
          <text x="${x}" y="160" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" opacity="${opacVal}">${p.name}</text>
          <text x="${x}" y="180" fill="${isActive ? '#fbbf24' : textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="900" text-anchor="middle" opacity="${isActive ? '1' : '0.5'}">${toArabicNumbers(p.time)}</text>
        `;
      });

      svgContent = `
        <!-- Header -->
        <rect x="25" y="25" width="40" height="40" rx="10" fill="#fbbf24" />
        <text x="45" y="44" fill="#1e293b" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle">${toArabicNumbers(currentDayDigit)}</text>
        <text x="45" y="56" fill="#1e293b" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${currentMonthName}</text>
        
        <text x="80" y="38" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="start">${dayNameArabic}</text>
        <text x="80" y="54" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="500" text-anchor="start" opacity="0.6">${toArabicNumbers(gregorianStr.split(' ').slice(0, 3).join(' '))}</text>
        
        <!-- Countdown -->
        <text x="375" y="38" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end" opacity="0.5">متبقي للأذان</text>
        <text x="375" y="58" fill="#fbbf24" font-family="monospace, system-ui" font-size="18" font-weight="900" text-anchor="end">-${toArabicNumbers(timeRemainingStr)}</text>
        
        <!-- Line divider -->
        <line x1="25" y1="80" x2="375" y2="80" stroke="${textPrimary}" stroke-width="1" opacity="0.1" />
        
        <!-- Timeline track line -->
        <line x1="50" y1="130" x2="350" y2="130" stroke="${textPrimary}" stroke-width="2" opacity="0.2" />
        
        <!-- Dots and text -->
        ${timelineDots}
      `;
    } else if (widgetType === 'teal') {
      svgContent = `
        <!-- Mosque outline silhouette vector representation -->
        <path d="M 20 220 L 20 180 Q 25 180 30 170 Q 30 150 45 150 Q 60 150 60 170 Q 65 180 70 180 L 70 220 Z" fill="#ffffff" opacity="0.08" />
        <path d="M 330 220 L 330 170 L 340 120 L 350 170 L 350 220 Z" fill="#ffffff" opacity="0.08" />
        <circle cx="340" cy="115" r="4" fill="#ffffff" opacity="0.08" />

        <!-- Header -->
        <text x="25" y="40" fill="#ccfbf1" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="start">📍 ${settings.cityName || 'الإسكندرية'}</text>
        <text x="375" y="40" fill="#ccfbf1" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="end">${toArabicNumbers(currentDayDigit)} ${currentMonthName} ${toArabicNumbers(currentYear)}هـ</text>
        
        <line x1="25" y1="55" x2="375" y2="55" stroke="#ffffff" stroke-width="1" opacity="0.15" />
        
        <!-- Center core content -->
        <text x="25" y="90" fill="#ccfbf1" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="start" opacity="0.8">الأذان القادم</text>
        <text x="25" y="125" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="start">صلاة ${getArabicName(nextPrayer)}</text>
        
        <text x="375" y="120" fill="#fcd34d" font-family="monospace, system-ui" font-size="34" font-weight="900" text-anchor="end">${toArabicNumbers(timeRemainingStr)}</text>
        
        <!-- Mini-table of prayers -->
        <rect x="25" y="155" width="350" height="40" rx="10" fill="#000000" fill-opacity="0.15" />
        <g transform="translate(10, 0)">
          <text x="45" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">الفجر</text>
          <text x="45" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Fajr || '٠٤:٣٠')}</text>
          
          <text x="115" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">الظهر</text>
          <text x="115" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Dhuhr || '١٢:١٥')}</text>
          
          <text x="185" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">العصر</text>
          <text x="185" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Asr || '١٥:٤٥')}</text>
          
          <text x="255" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">المغرب</text>
          <text x="255" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Maghrib || '١٩:٠٢')}</text>
          
          <text x="325" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">العشاء</text>
          <text x="325" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Isha || '٢٠:٣٥')}</text>
        </g>
      `;
    } else if (widgetType === 'analog') {
      svgContent = `
        <!-- Analog Clock face -->
        <circle cx="100" cy="110" r="75" fill="#0c1a2c" stroke="${borderStroke}" stroke-width="3" />
        <circle cx="100" cy="110" r="71" fill="none" stroke="#ffffff" stroke-dasharray="2, 5" stroke-width="1" opacity="0.1" />
        
        <!-- Hands -->
        <g transform="translate(100, 110)">
          <!-- Hour Hand -->
          <line x1="0" y1="0" x2="0" y2="-40" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" transform="rotate(${hrDeg})" />
          <!-- Minute Hand -->
          <line x1="0" y1="0" x2="0" y2="-60" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" transform="rotate(${minDeg})" />
          <!-- Second Hand -->
          <line x1="0" y1="10" x2="0" y2="-65" stroke="#ef4444" stroke-width="1" stroke-linecap="round" transform="rotate(${secDeg})" />
          <!-- Center Pin -->
          <circle cx="0" cy="0" r="5" fill="#ef4444" />
          <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
        </g>
        
        <!-- Numbers on clock face -->
        <text x="100" y="51" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="9" font-weight="900" text-anchor="middle" opacity="0.5">١٢</text>
        <text x="163" y="113" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="9" font-weight="900" text-anchor="middle" opacity="0.5">٣</text>
        <text x="100" y="174" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="9" font-weight="900" text-anchor="middle" opacity="0.5">٦</text>
        <text x="37" y="113" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="9" font-weight="900" text-anchor="middle" opacity="0.5">٩</text>

        <!-- Right Side Stats -->
        <text x="210" y="55" fill="${textAccent}" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="start">ساعة الصلاة الذكية 🕰️</text>
        <text x="210" y="85" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="start">صلاة ${getArabicName(nextPrayer)}</text>
        <text x="210" y="110" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="start" opacity="0.5">متبقي للأذان:</text>
        <text x="210" y="145" fill="#fbbf24" font-family="monospace, system-ui" font-size="28" font-weight="900" text-anchor="start">${toArabicNumbers(timeRemainingStr)}</text>
        
        <!-- Location details -->
        <text x="210" y="185" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="start" opacity="0.4">📍 ${settings.cityName || 'الإسكندرية'} • رفيق المسلم</text>
      `;
    } else if (widgetType === 'grid') {
      const gTimes = [
        { name: 'الفجر', val: prayerTimes.Fajr || '٠٤:٣٠', key: 'Fajr' },
        { name: 'الشروق', val: prayerTimes.Sunrise || '٠٦:٠٨', key: 'Sunrise' },
        { name: 'الظهر', val: prayerTimes.Dhuhr || '١٢:١٥', key: 'Dhuhr' },
        { name: 'العصر', val: prayerTimes.Asr || '١٥:٤٥', key: 'Asr' },
        { name: 'المغرب', val: prayerTimes.Maghrib || '١٩:٠٢', key: 'Maghrib' },
        { name: 'العشاء', val: prayerTimes.Isha || '٢٠:٣٥', key: 'Isha' }
      ];

      let gridBlocks = '';
      gTimes.forEach((p, idx) => {
        const row = Math.floor(idx / 3);
        const col = idx % 3;
        const x = 25 + col * 120;
        const y = 80 + row * 60;
        const isActive = currentPrayer === p.key;

        gridBlocks += `
          <rect x="${x}" y="${y}" width="110" height="50" rx="12" fill="#ffffff" fill-opacity="${isActive ? '0.12' : '0.03'}" stroke="${isActive ? '#fbbf24' : 'none'}" stroke-width="1" />
          <text x="${x + 55}" y="${y + 22}" fill="${isActive ? '#fbbf24' : textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${p.name}</text>
          <text x="${x + 55}" y="${y + 38}" fill="${isActive ? '#ffffff' : textPrimary}" font-family="monospace, system-ui" font-size="11" font-weight="900" text-anchor="middle" opacity="${isActive ? '1' : '0.5'}">${toArabicNumbers(p.val)}</text>
        `;
      });

      svgContent = `
        <!-- Top bar info -->
        <text x="25" y="40" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="start">${dayNameArabic} • ${toArabicNumbers(currentDayDigit)} ${currentMonthName}</text>
        <text x="375" y="40" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end">📍 ${settings.cityName || 'الإسكندرية'}</text>
        
        <line x1="25" y1="55" x2="375" y2="55" stroke="${textPrimary}" stroke-width="1" opacity="0.1" />
        
        <!-- Grid list -->
        ${gridBlocks}
      `;
    } else if (widgetType === 'compact') {
      svgContent = `
        <!-- Compact Pill layout -->
        <rect x="25" y="80" width="350" height="60" rx="30" fill="#000000" fill-opacity="0.2" stroke="${borderStroke}" stroke-width="1" />
        <circle cx="55" cy="110" r="5" fill="#10b981" />
        <text x="75" y="115" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="start">${getArabicName(currentPrayer)} ${getCompactCountdown()}</text>
        
        <text x="345" y="114" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="end">📍 ${settings.cityName || 'مكة المكرمة'}</text>
      `;
    }

    const fullSvg = startSvg + svgContent + endSvg;
    const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `muslim_companion_${widgetType}_widget.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage('📥 تم تحميل ملف الـ Widget كملف SVG شعاعي عالي الدقة بنجاح! يمكنك الآن استخدامه 🥳');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const isFaithBright = settings.appStyle === 'faith-bright';

  return (
    <div 
      id="widget-simulator-section" 
      className={`rounded-3xl border transition-all duration-300 relative overflow-hidden ${
        isFaithBright
          ? 'bg-gradient-to-b from-[#faf8f2] to-[#f4f0e4] border-[#e4dcbf] shadow-md text-slate-800'
          : 'bg-[#0d131b]/95 backdrop-blur-md border-slate-800/80 shadow-2xl text-slate-100'
      }`}
      dir="rtl"
    >
      {/* Dynamic Animated Status Toast */}
      {showToast && (
        <div className="absolute top-4 inset-x-4 z-50 bg-emerald-600 text-white font-black text-xs py-3 px-4 rounded-2xl shadow-xl flex items-center justify-between gap-2 animate-bounce">
          <div className="flex items-center gap-2">
            <span className="text-base">✨</span>
            <p className="text-right leading-relaxed">{toastMessage}</p>
          </div>
          <button 
            type="button"
            onClick={() => setShowToast(false)} 
            className="text-white hover:opacity-80 text-xs font-bold bg-white/10 px-2 py-1 rounded-lg shrink-0"
          >
            حسناً
          </button>
        </div>
      )}

      {/* Header Panel */}
      <div className={`p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b ${
        isFaithBright ? 'border-slate-200/60' : 'border-white/5'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
            isFaithBright ? 'bg-amber-100 text-amber-700' : 'bg-indigo-500/10 text-indigo-400'
          }`}>
            📱
          </div>
          <div className="text-right">
            <h3 className="text-sm font-black leading-tight">تطبيقات شاشة الهاتف (Widgets Lab)</h3>
            <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
              صمّم، جرب، وحمل المكونات الذكية التفاعلية الخاصة بهاتفك مباشرة بالأسفل
            </p>
          </div>
        </div>

        {/* Wallpapers inside header - ultra compact */}
        <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
          isFaithBright ? 'bg-slate-100/85 border-slate-200' : 'bg-slate-900/65 border-white/5'
        }`}>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-1">الخلفية:</span>
          <div className="flex gap-1">
            {WALLPAPERS.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => setActiveWallpaper(w.id)}
                className={`w-4 h-4 rounded-full border transition-all hover:scale-125 cursor-pointer ${
                  w.style
                } ${activeWallpaper === w.id ? 'ring-2 ring-indigo-500 scale-110' : ''}`}
                title={w.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID LAB: Sleek, compact and highly interactive */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-4 sm:p-5">
        
        {/* Left Column: Quick Config Panels (7 cols) */}
        <div className="md:col-span-7 space-y-3.5 flex flex-col justify-between">
          
          {/* Quick Choice Grid: Widget Type */}
          <div className="space-y-1.5 text-right">
            <label className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 animate-pulse" />
              ١. اختر شكل وتخطيط الـ Widget:
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: 'timeline', label: 'الشريط الزمني 📊', size: 'medium', desc: 'Timeline Slider' },
                { id: 'grid', label: 'شبكة الصلاة 🗂️', size: 'large', desc: 'Six Grid Cards' },
                { id: 'teal', label: 'عداد الوقت المضيء 🕌', size: 'medium', desc: 'Modern Teal' },
                { id: 'analog', label: 'الساعة الكلاسيكية 🕒', size: 'medium', desc: 'Analog Dial' },
                { id: 'compact', label: 'الوجت الرياضي المصغر ⚡', size: 'small', desc: 'Compact Pill' }
              ].map((type) => {
                const isSel = widgetType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setWidgetType(type.id as any);
                      if (type.id === 'teal') {
                        setWidgetTheme('glass');
                      } else if (type.id === 'analog') {
                        setWidgetTheme('dark-blue');
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-right transition-all duration-200 hover:scale-[1.01] cursor-pointer flex flex-col justify-between h-[54px] ${
                      isSel
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : isFaithBright
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'bg-slate-900/45 border-white/5 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-[10.5px] font-black leading-none block">{type.label}</span>
                    <span className={`text-[8px] font-bold block mt-0.5 ${isSel ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {type.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Themes & Palettes (Visible if not overridden by teal template) */}
          {widgetType !== 'teal' && widgetType !== 'compact' && (
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                ٢. النمط البصري والألوان:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'dark-blue', label: '🔵 كحلي إيماني', activeBg: 'bg-blue-900/10 border-blue-400 text-blue-600 dark:text-blue-400' },
                  { id: 'green', label: '🟢 أخضر مكة', activeBg: 'bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' },
                  { id: 'gold', label: '🟡 ذهبي كلاسيك', activeBg: 'bg-amber-950/20 border-amber-500 text-amber-600 dark:text-amber-400' },
                  { id: 'glass', label: '💎 زجاجي بلوري', activeBg: 'bg-white/10 border-slate-300 text-slate-700 dark:text-slate-200' }
                ].map(t => {
                  const isThemeSel = widgetTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setWidgetTheme(t.id as any)}
                      className={`py-1.5 px-2.5 rounded-xl border text-[10px] font-black cursor-pointer text-center transition-all ${
                        isThemeSel
                          ? t.activeBg + ' shadow-inner font-black scale-[1.01]'
                          : isFaithBright
                          ? 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          : 'bg-slate-900/40 border-white/5 text-slate-400 hover:bg-slate-800/80'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive Actions Group - Pin & Download SVG side-by-side */}
          <div className={`p-3 rounded-2xl border ${
            isFaithBright ? 'bg-amber-50/55 border-amber-100/80' : 'bg-slate-900/40 border-white/5'
          } space-y-2.5 text-right`}>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 block uppercase">٣. حفظ المكون وتصديره لهاتفك:</span>
              <span className="text-[8.5px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Volume2 className="w-2.5 h-2.5" />
                الدال على الخير كفاعله
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Pin Action */}
              <button
                type="button"
                onClick={handlePinWidget}
                className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-[10.5px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-indigo-100"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>📌 تثبيت باللوحة الرئيسية للتطبيق</span>
              </button>

              {/* Download Action (Real vector SVG download) */}
              <button
                type="button"
                onClick={handleDownloadWidgetSVG}
                className={`py-2.5 px-3 font-black text-[10.5px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  isFaithBright
                    ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs'
                    : 'bg-slate-900 border-white/10 text-white hover:bg-slate-800 shadow-sm'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>📥 تحميل الـ Widget كملف SVG بدقة عالية</span>
              </button>
            </div>
          </div>

          {/* Quick installation short manual */}
          <div className={`p-3 rounded-2xl text-right leading-relaxed font-medium space-y-1 ${
            isFaithBright ? 'bg-slate-50 border border-slate-200/50' : 'bg-slate-900/20 border border-white/5'
          }`}>
            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">💡 دليل التثبيت السريع لشاشة الهاتف الفعلية:</span>
            <div className="text-[9.5px] text-slate-500 dark:text-slate-400 space-y-0.5 font-bold">
              <p>• <strong className="text-slate-700 dark:text-slate-300">أندرويد:</strong> انقر مطولاً على الشاشة الرئيسية ← أدوات (Widgets) ← ابحث عن <span className="text-indigo-500">رفيق المسلم</span> ← اسحب الوجت للشاشة.</p>
              <p>• <strong className="text-slate-700 dark:text-slate-300">آيفون (iOS):</strong> انقر مطولاً بالخلفية ← علامة (+) بالأعلى ← ابحث عن <span className="text-indigo-500">رفيق المسلم</span> ← إضافة أداة.</p>
            </div>
          </div>

        </div>

        {/* Right Column: Smartphone frame with live-reacting Widget preview (5 cols) */}
        <div className="md:col-span-5 flex justify-center items-center">
          <div className="relative w-full max-w-[230px] rounded-[36px] border-[7px] border-slate-800 dark:border-slate-900 bg-black overflow-hidden aspect-[9/16] shadow-xl flex flex-col justify-between p-2.5 pb-4">
            
            {/* Dynamic Island / Notch */}
            <div className="absolute top-0 inset-x-0 h-4 flex justify-center z-20">
              <div className="w-16 h-3 bg-black rounded-b-lg flex items-center justify-center gap-1 px-2">
                <span className="w-1 h-1 rounded-full bg-slate-950" />
                <span className="w-7 h-1 bg-slate-950 rounded-full" />
              </div>
            </div>

            {/* Simulated wallpaper background */}
            <div className={`absolute inset-0 z-0 ${currentWallpaper.style} transition-all duration-700`} />

            {/* Mobile Status bar */}
            <div className="flex justify-between items-center z-10 text-[7.5px] text-white/95 font-sans font-bold px-2 pt-1">
              <span dir="ltr">{internalTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex items-center gap-0.5" dir="ltr">
                <span>📶</span>
                <span>🛜</span>
                <span className="text-[7px]">🔋 ٩٥٪</span>
              </div>
            </div>

            {/* Centered Widget Area - Real-time reacting */}
            <div className="my-auto z-10 w-full flex items-center justify-center py-2 px-0.5 min-h-[120px]">
              
              {/* STYLE 1: Timeline widget */}
              {widgetType === 'timeline' && (
                <div className={`w-full rounded-[18px] p-2.5 flex flex-col justify-between transition-all duration-500 border text-right select-none scale-100 ${getWidgetThemeClass()}`}>
                  {/* Top line */}
                  <div className="flex justify-between items-start border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex flex-col items-center justify-center shadow-xs font-sans scale-90">
                        <span className="text-[10px] font-black leading-none">{toArabicNumbers(currentDayDigit)}</span>
                        <span className="text-[6px] font-bold leading-none">{currentMonthName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black block text-white/90 leading-none">{dayNameArabic}</span>
                        <span className="text-[6px] font-bold block text-white/40 mt-0.5">{toArabicNumbers(gregorianStr.split(' ').slice(0, 2).join(' '))}</span>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-[6px] font-bold block text-white/40">متبقي للأذان</span>
                      <span className="text-[10px] font-extrabold block text-amber-400 font-mono leading-none mt-0.5" dir="ltr">
                        -{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Timeline */}
                  <div className="relative py-2.5 my-0.5 flex items-center justify-between">
                    <div className="absolute inset-x-1.5 h-[1.5px] bg-white/20 top-1/2 -translate-y-1/2 z-0 rounded-full" />
                    <div 
                      className="absolute right-1.5 h-[1.5px] bg-amber-400 top-1/2 -translate-y-1/2 z-0 rounded-full transition-all duration-1000"
                      style={{ 
                        left: currentPrayer === 'Fajr' ? '80%' : currentPrayer === 'Dhuhr' ? '60%' : currentPrayer === 'Asr' ? '40%' : currentPrayer === 'Maghrib' ? '20%' : '5%' 
                      }}
                    />

                    {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName, idx) => {
                      const isActive = currentPrayer === pName;
                      const prayerTime = prayerTimes[pName] || '٠٠:٠٠';
                      const isPast = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].indexOf(currentPrayer) >= idx;

                      return (
                        <div key={pName} className="flex flex-col items-center relative z-10 scale-90">
                          <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-all ${
                            isActive ? 'bg-amber-400 text-slate-900 ring-2 ring-white scale-110 shadow-xs' : isPast ? 'bg-amber-400/90' : 'bg-[#1b2b3c] border border-white/10'
                          }`} />
                          <span className={`text-[6.5px] font-bold mt-1 block ${isActive ? 'text-amber-400' : 'text-white/60'}`}>{getArabicName(pName)}</span>
                          <span className={`text-[7px] font-black font-mono mt-0.2 block ${isActive ? 'text-white' : 'text-white/30'}`}>{toArabicNumbers(prayerTime)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center border-t border-white/5 pt-1.5 text-[7px] text-white/40 font-bold leading-none">
                    <span className="flex items-center gap-0.5">📍 {settings.cityName || 'الإسكندرية'}</span>
                    <span className="flex items-center gap-0.5">الشروق {toArabicNumbers(prayerTimes.Sunrise || '٠٦:٠٨')} ص</span>
                  </div>
                </div>
              )}

              {/* STYLE 2: Grid view */}
              {widgetType === 'grid' && (
                <div className={`w-full rounded-[18px] p-2 flex flex-col justify-between transition-all duration-500 border text-right select-none ${getWidgetThemeClass()}`}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[7.5px] font-black">
                    <span className="text-white">{dayNameArabic} • {toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
                    <span className="text-amber-400 flex items-center gap-0.5">📍 {settings.cityName || 'الإسكندرية'}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 py-1.5">
                    {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                      const isActive = currentPrayer === pName;
                      const prayerTime = prayerTimes[pName] || '٠٠:٠٠';

                      return (
                        <div 
                          key={pName}
                          className={`p-1 rounded-lg border flex flex-col items-center justify-center text-center transition-all scale-95 ${
                            isActive ? 'bg-[#15273b]/95 border-amber-400' : 'bg-white/[0.03] border-white/5'
                          }`}
                        >
                          <span className={`text-[7px] font-black ${isActive ? 'text-amber-400' : 'text-white/70'}`}>{getArabicName(pName)}</span>
                          <span className={`text-[7px] font-black font-mono mt-0.5 ${isActive ? 'text-white' : 'text-white/35'}`}>{toArabicNumbers(prayerTime)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center text-[6px] text-white/30 border-t border-white/5 pt-1 leading-none font-bold">
                    مواقيت الصلاة • رفيق المسلم المطور
                  </div>
                </div>
              )}

              {/* STYLE 3: Teal elegant countdown */}
              {widgetType === 'teal' && (
                <div className="w-full rounded-[18px] p-3 flex flex-col justify-between transition-all duration-500 bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white shadow-lg relative overflow-hidden select-none border border-teal-400/30 scale-100">
                  <div className="absolute -left-3 -bottom-5 opacity-10 pointer-events-none text-4xl">🕌</div>
                  
                  <div className="flex justify-between items-center border-b border-white/15 pb-1 text-[7.5px] font-black">
                    <span className="flex items-center gap-0.5">📍 {settings.cityName || 'الإسكندرية'}</span>
                    <span className="text-teal-100">{toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
                  </div>

                  <div className="py-1.5 text-right space-y-0.5">
                    <span className="text-[6px] font-bold text-teal-100/70 block leading-none">الصلاة القادمة</span>
                    <h3 className="text-[10px] font-black text-white flex justify-between items-center leading-none">
                      <span>صلاة {getArabicName(nextPrayer)}</span>
                      <span className="text-[11px] font-black font-mono text-amber-300" dir="ltr">{toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-5 gap-0.5 text-center bg-black/15 rounded-lg p-0.5 border border-white/5 scale-90">
                    {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                      const isActive = currentPrayer === pName;
                      const prayerTime = prayerTimes[pName] || '٠٠:٠٠';
                      return (
                        <div key={pName} className={`p-0.5 rounded transition-all ${isActive ? 'bg-white/20 text-white font-extrabold' : ''}`}>
                          <span className="text-[5.5px] block font-bold opacity-80 leading-none">{getArabicName(pName)}</span>
                          <span className="text-[6.5px] block font-extrabold font-mono mt-0.5 leading-none">{toArabicNumbers(prayerTime)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STYLE 4: Analog style dial */}
              {widgetType === 'analog' && (
                <div className={`w-full rounded-[18px] p-2.5 flex items-center justify-center gap-2 transition-all duration-500 border text-right select-none ${getWidgetThemeClass()}`}>
                  {/* Miniature Clock Face */}
                  <div className="w-[60px] h-[60px] rounded-full bg-[#0a1520] border border-[#192f44] relative flex items-center justify-center shrink-0">
                    <div className="absolute inset-0.5 rounded-full border border-dashed border-white/5 pointer-events-none" />
                    <span className="absolute top-0.5 text-[6px] font-black text-white/30 font-sans">١٢</span>
                    <span className="absolute right-0.5 text-[6px] font-black text-white/30 font-sans">٣</span>
                    <span className="absolute bottom-0.5 text-[6px] font-black text-white/30 font-sans">٦</span>
                    <span className="absolute left-0.5 text-[6px] font-black text-white/30 font-sans">٩</span>

                    {/* Clock Hands */}
                    <div className="absolute w-[1.5px] h-4.5 bg-white rounded-full origin-bottom" style={{ transform: `rotate(${hrDeg}deg)`, top: 'calc(50% - 4.5px)' }} />
                    <div className="absolute w-[1px] h-6 bg-white rounded-full origin-bottom" style={{ transform: `rotate(${minDeg}deg)`, top: 'calc(50% - 6px)' }} />
                    <div className="absolute w-[0.5px] h-6 bg-red-500 origin-bottom" style={{ transform: `rotate(${secDeg}deg)`, top: 'calc(50% - 6px)' }} />
                    <div className="w-1 h-1 rounded-full bg-red-500 border border-white z-10" />
                  </div>

                  <div className="flex-1 space-y-0.5 text-right">
                    <span className="text-[6px] font-black text-amber-400 block uppercase leading-none">صلاة {getArabicName(nextPrayer)}</span>
                    <h4 className="text-[8px] font-black text-white leading-none">متبقي للأذان</h4>
                    <span className="text-[9px] font-black text-white block font-mono leading-none mt-0.5" dir="ltr">
                      {toArabicNumbers(timeRemainingStr.split(':').slice(0, 2).join(':'))}
                    </span>
                    <div className="text-[6px] font-bold text-white/30 pt-0.5 border-t border-white/5 leading-none">
                      📍 {settings.cityName || 'الإسكندرية'}
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE 5: Compact Pill style */}
              {widgetType === 'compact' && (
                <div className="w-full bg-[#eeeeee] dark:bg-[#1a242d] text-slate-800 dark:text-white rounded-full py-2 px-3 flex items-center justify-between shadow-md border border-slate-200 dark:border-white/5 select-none scale-100">
                  <div className="flex items-center gap-1 leading-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] font-extrabold font-sans">
                      {getArabicName(currentPrayer)} {getCompactCountdown()}
                    </span>
                  </div>
                  <span className="text-[6.5px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-0.5 leading-none">
                    📍 {settings.cityName || 'مكة'}
                  </span>
                </div>
              )}

            </div>

            {/* Bottom launcher shortcuts */}
            <div className="mt-auto flex justify-center gap-4 z-10 py-0.5 border-t border-white/5 pt-1.5">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">📞</div>
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">💬</div>
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px]">🌐</div>
              <div className="w-5 h-5 rounded-full bg-indigo-600/80 flex items-center justify-center text-[9px] border border-indigo-400/20 shadow-inner">🕌</div>
            </div>

            {/* Swipe home bar */}
            <div className="absolute bottom-0.5 inset-x-0 h-0.5 flex justify-center z-20">
              <div className="w-12 h-0.5 bg-white/50 rounded-full" />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
