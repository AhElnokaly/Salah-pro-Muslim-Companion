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
import { parseTimeToMinutes } from '../utils/prayerCalc';
import { getMoonPhaseInfo } from '../utils/moonPhase';
export { getMoonPhaseInfo };

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
  { id: 'starry', name: 'نجوم', style: 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-950 via-slate-950 to-black border-sky-950' },
  { id: 'desert', name: 'صحراء', style: 'bg-gradient-to-tr from-[#1f1235] via-[#481d3d] to-[#99413b] border-pink-900/30' },
  { id: 'forest', name: 'غابة', style: 'bg-gradient-to-b from-[#061f18] via-[#0c2e26] to-[#143d34] border-emerald-950' },
  { id: 'slate', name: 'رمادي', style: 'bg-slate-900 border-slate-750' },
  { id: 'light', name: 'نهار', style: 'bg-gradient-to-br from-amber-50 via-sky-50 to-emerald-50 border-amber-200' }
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
  const [widgetType, setWidgetType] = useState<
    'custom' | 'timeline' | 'grid' | 'teal' | 'analog' | 'compact' | 'dhikr' | 'qibla' | 'calendar'
  >((settings?.pinnedWidget?.type as any) || 'custom');
  const [widgetTheme, setWidgetTheme] = useState<'green' | 'gold' | 'glass' | 'dark-blue' | 'amber' | 'onyx'>(
    (settings?.pinnedWidget?.theme as any) || 'dark-blue'
  );
  const [activeWallpaper, setActiveWallpaper] = useState(settings?.pinnedWidget?.wallpaper || 'starry');
  const [internalTime, setInternalTime] = useState<Date>(new Date());
  const [subhaCount, setSubhaCount] = useState<number>(0);
  const [isPinned, setIsPinned] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Modular Custom Widget Toggles
  const [clockStyle, setClockStyle] = useState<'none' | 'digital' | 'analog'>(
    settings?.pinnedWidget?.clockStyle || 'digital'
  );
  const [showMoonPhase, setShowMoonPhase] = useState<boolean>(
    settings?.pinnedWidget?.showMoonPhase ?? true
  );
  const [prayerDisplay, setPrayerDisplay] = useState<'none' | 'next_only' | 'all_prayers'>(
    settings?.pinnedWidget?.prayerDisplay || 'next_only'
  );
  const [showDate, setShowDate] = useState<boolean>(
    settings?.pinnedWidget?.showDate ?? true
  );
  const [showDhikr, setShowDhikr] = useState<boolean>(
    settings?.pinnedWidget?.showDhikr ?? true
  );
  const [showAyah, setShowAyah] = useState<boolean>(
    settings?.pinnedWidget?.showAyah ?? false
  );
  const [showQibla, setShowQibla] = useState<boolean>(
    settings?.pinnedWidget?.showQibla ?? false
  );
  const [showSubhaBtn, setShowSubhaBtn] = useState<boolean>(
    settings?.pinnedWidget?.showSubhaBtn ?? true
  );
  const [showProgressBar, setShowProgressBar] = useState<boolean>(
    settings?.pinnedWidget?.showProgressBar ?? true
  );
  const [cardSize, setCardSize] = useState<'compact' | 'medium' | 'large'>(
    settings?.pinnedWidget?.cardSize || 'medium'
  );

  // Local timer for mock clock hands and updates
  useEffect(() => {
    const timer = setInterval(() => {
      setInternalTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentWallpaper = WALLPAPERS.find(w => w.id === activeWallpaper) || WALLPAPERS[0];

  const getWidgetThemeClass = () => {
    if (widgetType === 'teal') {
      return 'bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white border border-teal-400/30 shadow-xl';
    }
    switch (widgetTheme) {
      case 'green':
        return 'bg-gradient-to-b from-emerald-950/95 via-emerald-900/95 to-teal-950/95 border border-emerald-500/30 text-white shadow-xl';
      case 'gold':
        return 'bg-gradient-to-b from-[#1c1b18]/95 via-[#23201a]/95 to-[#2b2720]/95 border border-amber-500/30 text-amber-100 shadow-xl';
      case 'glass':
        return 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-xl';
      case 'amber':
        return 'bg-gradient-to-tr from-[#2d1706]/95 via-[#452309]/95 to-[#1c0f04]/95 border border-amber-600/30 text-amber-100 shadow-xl';
      case 'onyx':
        return 'bg-gradient-to-b from-[#090d12]/95 via-[#111823]/95 to-[#080b0f]/95 border border-slate-700/40 text-slate-100 shadow-xl';
      case 'dark-blue':
      default:
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

  const getFormattedTimeRemaining = (tStr: string) => {
    if (!tStr) return '';
    const clean = tStr.replace('-', '').trim();
    const parts = clean.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (h > 0) {
        return `${toArabicNumbers(h)} س و ${toArabicNumbers(m)} د`;
      }
      return `${toArabicNumbers(m)} دقيقة`;
    }
    return toArabicNumbers(clean);
  };

  const getPrayerProgressPercent = () => {
    if (!prayerTimes || !currentPrayer || !nextPrayer) return 50;
    const currMin = parseTimeToMinutes(prayerTimes[currentPrayer] || '');
    let nextMin = parseTimeToMinutes(prayerTimes[nextPrayer] || '');
    const nowMin = internalTime.getHours() * 60 + internalTime.getMinutes();
    if (nextMin <= currMin) nextMin += 24 * 60;
    let currentAdjusted = nowMin;
    if (currentAdjusted < currMin && nextMin > 24 * 60) currentAdjusted += 24 * 60;
    const total = nextMin - currMin;
    if (total <= 0) return 50;
    const elapsed = currentAdjusted - currMin;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const getCompactCountdown = () => {
    const parts = timeRemainingStr.split(':');
    if (parts.length < 3) return timeRemainingStr;
    const h = parseInt(parts[0]);
    const m = parseInt(parts[1]);
    return `${toArabicNumbers(h)} س ${toArabicNumbers(m)} د`;
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
          wallpaper: activeWallpaper,
          clockStyle,
          showMoonPhase,
          prayerDisplay,
          showDate,
          showDhikr,
          showAyah,
          showQibla,
          showSubhaBtn,
          showProgressBar,
          cardSize
        }
      }));
      setIsPinned(true);
      setToastMessage('📌 تم تثبيت الـ Widget المخصص بنجاح! سيظهر الآن بجميع مكوناته على شاشتك الرئيسية 🥳🤍');
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
        <text x="210" y="185" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="start" opacity="0.4">📍 ${settings.cityName || 'الإسكندرية'} • هِمَّتِي</text>
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
    } else if (widgetType === 'dhikr') {
      svgContent = `
        <!-- Dhikr Card layout -->
        <text x="25" y="40" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="12" font-weight="900" text-anchor="start">✨ ذكر اليوم والبركة</text>
        <text x="375" y="40" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end" opacity="0.6">${dayNameArabic}</text>
        <line x1="25" y1="55" x2="375" y2="55" stroke="${textPrimary}" stroke-width="1" opacity="0.1" />
        
        <text x="200" y="105" fill="#fef3c7" font-family="Traditional Arabic, serif" font-size="16" font-weight="bold" text-anchor="middle">«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ»</text>
        
        <rect x="130" y="130" width="140" height="36" rx="18" fill="#f59e0b" />
        <text x="200" y="152" fill="#0f172a" font-family="system-ui, sans-serif" font-size="12" font-weight="900" text-anchor="middle">📿 تسبيحة البركة</text>
        
        <text x="25" y="195" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="start" opacity="0.5">الصلاة القادمة: ${getArabicName(nextPrayer)}</text>
        <text x="375" y="195" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end" opacity="0.5">📍 ${settings.cityName || 'مكة المكرمة'}</text>
      `;
    } else if (widgetType === 'qibla') {
      svgContent = `
        <!-- Qibla Compass layout -->
        <circle cx="80" cy="110" r="50" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
        <text x="80" y="108" fill="#f59e0b" font-family="system-ui" font-size="20" text-anchor="middle">🕌</text>
        <text x="80" y="125" fill="#f59e0b" font-family="monospace" font-size="10" font-weight="900" text-anchor="middle">١٣٦°</text>
        
        <text x="150" y="80" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="start">بوصلة القبلة المباشرة</text>
        <text x="150" y="110" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="start">اتجاه الكعبة المشرفة</text>
        <text x="150" y="135" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="start" opacity="0.6">موقعك: ${settings.cityName || 'الإسكندرية'}</text>
        
        <rect x="150" y="155" width="225" height="35" rx="10" fill="#000000" fill-opacity="0.2" />
        <text x="165" y="176" fill="${textPrimary}" font-family="system-ui" font-size="10" opacity="0.7">الأذان القادم:</text>
        <text x="360" y="177" fill="#f59e0b" font-family="monospace" font-size="14" font-weight="900" text-anchor="end">${toArabicNumbers(timeRemainingStr)}</text>
      `;
    } else if (widgetType === 'calendar') {
      svgContent = `
        <!-- Calendar layout -->
        <rect x="25" y="25" width="45" height="45" rx="10" fill="#10b981" />
        <text x="47" y="48" fill="#ffffff" font-family="system-ui" font-size="16" font-weight="900" text-anchor="middle">${toArabicNumbers(currentDayDigit)}</text>
        <text x="47" y="62" fill="#ffffff" font-family="system-ui" font-size="9" font-weight="bold" text-anchor="middle">${currentMonthName}</text>
        
        <text x="80" y="42" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="start">${dayNameArabic}</text>
        <text x="80" y="60" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="start">${toArabicNumbers(currentYear)} هجرية</text>
        
        <rect x="280" y="30" width="95" height="30" rx="8" fill="#ffffff" fill-opacity="0.1" />
        <text x="327" y="49" fill="#ffffff" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="middle">مستحب الصيام 🌙</text>
        
        <line x1="25" y1="85" x2="375" y2="85" stroke="${textPrimary}" stroke-width="1" opacity="0.1" />
        
        <!-- Prayers strip -->
        <text x="50" y="120" fill="${textPrimary}" font-family="system-ui" font-size="10" text-anchor="middle">الظهر</text>
        <text x="50" y="140" fill="${textPrimary}" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Dhuhr || '١٢:١٥')}</text>
        
        <text x="150" y="120" fill="${textPrimary}" font-family="system-ui" font-size="10" text-anchor="middle">العصر</text>
        <text x="150" y="140" fill="${textPrimary}" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Asr || '١٥:٤٥')}</text>
        
        <text x="250" y="120" fill="#f59e0b" font-family="system-ui" font-size="10" font-weight="bold" text-anchor="middle">المغرب</text>
        <text x="250" y="140" fill="#f59e0b" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Maghrib || '١٩:٠٢')}</text>
        
        <text x="350" y="120" fill="${textPrimary}" font-family="system-ui" font-size="10" text-anchor="middle">العشاء</text>
        <text x="350" y="140" fill="${textPrimary}" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Isha || '٢٠:٣٥')}</text>
        
        <text x="25" y="195" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="start" opacity="0.4">📍 ${settings.cityName || 'مصر'}</text>
        <text x="375" y="195" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end" opacity="0.4">${toArabicNumbers(gregorianStr)}</text>
      `;
    }

    const fullSvg = startSvg + svgContent + endSvg;
    const blob = new Blob([fullSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hemmaty_${widgetType}_widget.svg`;
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
            <p className="text-end leading-relaxed">{toastMessage}</p>
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
          <div className="text-end">
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
                { id: 'custom', label: 'وجت مخصص 🎨', desc: 'بطاقة قابلة للتحكم' },
                { id: 'timeline', label: 'الشريط الزمني 📊', desc: 'Timeline' },
                { id: 'grid', label: 'شبكة الصلاة 🗂️', desc: 'Grid' },
                { id: 'teal', label: 'العداد المضيء 🕌', desc: 'Teal' },
                { id: 'analog', label: 'الساعة التناظرية 🕒', desc: 'Analog' },
                { id: 'compact', label: 'الكبسولة المصغرة ⚡', desc: 'Compact' },
                { id: 'dhikr', label: 'الذكر والتسبيح 📿', desc: 'Dhikr' },
                { id: 'qibla', label: 'بوصلة القبلة 🧭', desc: 'Qibla' },
                { id: 'calendar', label: 'التقويم الهجري 📅', desc: 'Calendar' }
              ].map((type) => {
                const isSel = widgetType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setWidgetType(type.id as any)}
                    className={`p-2 rounded-xl border text-right transition-all duration-200 hover:scale-[1.01] cursor-pointer flex flex-col justify-between h-[52px] ${
                      isSel
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm font-black ring-2 ring-indigo-400'
                        : isFaithBright
                        ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        : 'bg-slate-900/45 border-white/5 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-[10px] font-black leading-none block">{type.label}</span>
                    <span className={`text-[7.5px] font-bold block mt-0.5 ${isSel ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {type.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modular Customization Panel for Custom Card */}
          {widgetType === 'custom' && (
            <div className={`p-3 rounded-2xl border space-y-2.5 ${
              isFaithBright ? 'bg-amber-50/60 border-amber-200/80' : 'bg-slate-900/80 border-white/10'
            }`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                <span className="text-[11px] font-black text-amber-500 flex items-center gap-1">
                  🛠️ لوحة تخصيص المكونات:
                </span>
                <span className="text-[9px] font-bold text-slate-400">
                  تحكم بجميع العناصر
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                {/* Clock style */}
                <div className="space-y-1 col-span-1">
                  <label className="font-black text-slate-400 dark:text-slate-300 block">🕒 نمط الساعة:</label>
                  <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
                    {[
                      { id: 'none', label: 'بدون' },
                      { id: 'digital', label: 'رقمية' },
                      { id: 'analog', label: 'عقارب' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setClockStyle(opt.id as any)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-black cursor-pointer transition-all ${
                          clockStyle === opt.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prayer times display */}
                <div className="space-y-1 col-span-1">
                  <label className="font-black text-slate-400 dark:text-slate-300 block">🕌 عرض الصلوات:</label>
                  <div className="flex gap-1 bg-black/20 p-1 rounded-xl">
                    {[
                      { id: 'none', label: 'بدون' },
                      { id: 'next_only', label: 'القادمة' },
                      { id: 'all_prayers', label: 'الكل' },
                    ].map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPrayerDisplay(opt.id as any)}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-black cursor-pointer transition-all ${
                          prayerDisplay === opt.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Moon Phase Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMoonPhase(!showMoonPhase)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showMoonPhase ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-black' : 'bg-black/10 border-white/5 text-slate-400'
                  }`}
                >
                  <span>🌙 طور القمر الهجري</span>
                  <span className="text-[10px] font-black">{showMoonPhase ? 'مفعل ✓' : 'معطل'}</span>
                </button>

                {/* Date & Calendar Toggle */}
                <button
                  type="button"
                  onClick={() => setShowDate(!showDate)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showDate ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-black' : 'bg-black/10 border-white/5 text-slate-400'
                  }`}
                >
                  <span>📅 التاريخ والتقويم</span>
                  <span className="text-[10px] font-black">{showDate ? 'مفعل ✓' : 'معطل'}</span>
                </button>

                {/* Daily Dhikr Toggle */}
                <button
                  type="button"
                  onClick={() => setShowDhikr(!showDhikr)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showDhikr ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-black' : 'bg-black/10 border-white/5 text-slate-400'
                  }`}
                >
                  <span>✨ ذكر ودعاء اليوم</span>
                  <span className="text-[10px] font-black">{showDhikr ? 'مفعل ✓' : 'معطل'}</span>
                </button>

                {/* Quranic Ayah Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAyah(!showAyah)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showAyah ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-black' : 'bg-black/10 border-white/5 text-slate-400'
                  }`}
                >
                  <span>📖 آية قرأنية مباركة</span>
                  <span className="text-[10px] font-black">{showAyah ? 'مفعل ✓' : 'معطل'}</span>
                </button>

                {/* Qibla Direction Toggle */}
                <button
                  type="button"
                  onClick={() => setShowQibla(!showQibla)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showQibla ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-black' : 'bg-black/10 border-white/5 text-slate-400'
                  }`}
                >
                  <span>🧭 اتجاه القبلة</span>
                  <span className="text-[10px] font-black">{showQibla ? 'مفعل ✓' : 'معطل'}</span>
                </button>

                {/* Subha Button Toggle */}
                <button
                  type="button"
                  onClick={() => setShowSubhaBtn(!showSubhaBtn)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showSubhaBtn ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-black' : 'bg-black/10 border-white/5 text-slate-400'
                  }`}
                >
                  <span>📿 زر التسبيح المباشر</span>
                  <span className="text-[10px] font-black">{showSubhaBtn ? 'مفعل ✓' : 'معطل'}</span>
                </button>

                {/* Progress Bar Toggle */}
                <button
                  type="button"
                  onClick={() => setShowProgressBar(!showProgressBar)}
                  className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    showProgressBar ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-black' : 'bg-black/10 border-white/5 text-slate-400'
                  }`}
                >
                  <span>⏳ شريط تقدم الصلاة القادمة</span>
                  <span className="text-[10px] font-black">{showProgressBar ? 'مفعل ✓' : 'معطل'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Color Themes & Palettes */}
          {widgetType !== 'teal' && widgetType !== 'compact' && (
            <div className="space-y-1.5 text-right">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                ٢. النمط البصري والألوان:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {[
                  { id: 'dark-blue', label: '🔵 كحلي إيماني', activeBg: 'bg-blue-900/10 border-blue-400 text-blue-600 dark:text-blue-400' },
                  { id: 'green', label: '🟢 أخضر مكة', activeBg: 'bg-emerald-950/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' },
                  { id: 'gold', label: '🟡 ذهبي كلاسيك', activeBg: 'bg-amber-950/20 border-amber-500 text-amber-600 dark:text-amber-400' },
                  { id: 'glass', label: '💎 زجاج بلوري', activeBg: 'bg-white/10 border-slate-300 text-slate-700 dark:text-slate-200' },
                  { id: 'amber', label: '🟠 غروب الشمس', activeBg: 'bg-amber-900/20 border-amber-600 text-amber-500' },
                  { id: 'onyx', label: '⬛ ليلي داكن', activeBg: 'bg-slate-900/80 border-slate-500 text-slate-200' }
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
          } space-y-2.5 text-end`}>
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
          <div className={`p-3.5 rounded-2xl text-end leading-relaxed font-medium space-y-1.5 ${
            isFaithBright ? 'bg-amber-50/50 border border-amber-100/60' : 'bg-slate-900/40 border border-white/5'
          }`}>
            <span className="text-[9.5px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider block flex items-center gap-1">
              <span>💡 توضيح هام بخصوص الـ Widgets على شاشة الهاتف:</span>
            </span>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1.5 font-bold">
              <p>
                نظراً للقيود الأمنية والتقنية لأنظمة التشغيل (<span className="text-indigo-500">iOS</span> و <span className="text-indigo-500">Android</span>)، فإن تطبيقات الويب المضافة للشاشة الرئيسية (<span className="text-amber-500 font-extrabold">PWA</span>) لا يُسمح لها برمجياً بإضافة "مكونات تفاعلية" (Widgets) مباشرة في درج الأدوات الرسمي للهاتف. هذا الامتياز حكر فقط على التطبيقات التي يتم تحميلها من المتاجر الرسمية.
              </p>
              <div className="pt-1 border-t border-slate-200 dark:border-white/5 space-y-1">
                <p className="text-slate-700 dark:text-slate-300 font-black">ولكن، يقدم لك تطبيق هِمَّتِي البدائل المبتكرة التالية:</p>
                <p>• <strong className="text-indigo-500">١. التثبيت داخل التطبيق:</strong> انقر على زر <strong className="text-slate-700 dark:text-slate-300">"تثبيت باللوحة الرئيسية"</strong> بالأعلى، ليظهر الـ Widget المخصص لك داخل واجهة التطبيق الرئيسية مباشرة عند فتحه!</p>
                <p>• <strong className="text-indigo-500">٢. تطبيق أدوات الصور المخصصة:</strong> يمكنك تحميل الـ Widget بصيغة <strong className="text-slate-700 dark:text-slate-300">SVG بدقة عالية</strong> ثم استخدام تطبيقات ودجات الصور المجانية مثل (<span className="text-amber-500">Widgetsmith</span> للآيفون أو <span className="text-amber-500">Simple Photo Widget</span> للأندرويد) لعرض الوجت كصورة جميلة على شاشتك!</p>
              </div>
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
              
              {/* STYLE 0: Custom Modular Card */}
              {widgetType === 'custom' && (
                <div className={`w-full rounded-[18px] p-3 flex flex-col justify-between transition-all duration-500 border text-right select-none space-y-2 ${getWidgetThemeClass()}`}>
                  {/* Header: Date + Moon Phase */}
                  {showDate && (
                    <div className="flex justify-between items-center border-b border-white/10 pb-1.5 text-[8px] font-black">
                      <span className="text-white flex items-center gap-1">
                        {dayNameArabic} • {toArabicNumbers(currentDayDigit)} {currentMonthName} {toArabicNumbers(currentYear)} هـ
                      </span>
                      {showMoonPhase && (
                        <span className="text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-full text-[7.5px] flex items-center gap-0.5 font-bold">
                          {getMoonPhaseInfo(currentDayDigit).icon} {getMoonPhaseInfo(currentDayDigit).name}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Clock Block */}
                  {clockStyle === 'digital' && (
                    <div className="text-center py-1 bg-black/20 rounded-xl border border-white/5">
                      <span className="text-[18px] font-black font-mono tracking-widest text-white leading-none block">
                        {toArabicNumbers(internalTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))}
                      </span>
                      <span className="text-[6.5px] font-bold text-amber-400 block mt-0.5">التوقيت المحلي لمدينتك</span>
                    </div>
                  )}

                  {clockStyle === 'analog' && (
                    <div className="flex items-center justify-center gap-3 py-1">
                      <div className="w-[52px] h-[52px] rounded-full bg-[#0a1520] border-2 border-[#1e3448] relative flex items-center justify-center shrink-0 shadow-lg">
                        <div className="absolute inset-0.5 rounded-full border border-dashed border-white/10 pointer-events-none" />
                        <span className="absolute top-1 text-[6px] font-black text-amber-400/80 leading-none">١٢</span>
                        <span className="absolute end-1 text-[6px] font-black text-white/40 leading-none">٣</span>
                        <span className="absolute bottom-1 text-[6px] font-black text-white/40 leading-none">٦</span>
                        <span className="absolute start-1 text-[6px] font-black text-white/40 leading-none">٩</span>

                        {/* Hour Hand */}
                        <div 
                          className="absolute bg-gradient-to-t from-amber-400 to-amber-200 rounded-full shadow-xs"
                          style={{
                            width: '2.5px',
                            height: '14px',
                            left: '50%',
                            bottom: '50%',
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${hrDeg}deg)`
                          }}
                        />

                        {/* Minute Hand */}
                        <div 
                          className="absolute bg-white rounded-full shadow-xs"
                          style={{
                            width: '1.5px',
                            height: '19px',
                            left: '50%',
                            bottom: '50%',
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${minDeg}deg)`
                          }}
                        />

                        {/* Second Hand */}
                        <div 
                          className="absolute bg-red-500 rounded-full"
                          style={{
                            width: '1px',
                            height: '21px',
                            left: '50%',
                            bottom: '50%',
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${secDeg}deg)`
                          }}
                        />

                        {/* Center Pivot Dot */}
                        <div className="w-2 h-2 rounded-full bg-red-500 border border-white z-10 shadow-xs" />
                      </div>
                      <div className="text-right">
                        <span className="text-[7.5px] font-black text-amber-400 block">الساعة التناظرية</span>
                        <span className="text-[10px] font-mono font-bold text-white block">{toArabicNumbers(internalTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }))}</span>
                      </div>
                    </div>
                  )}

                  {/* Prayer Display */}
                  {prayerDisplay === 'next_only' && (
                    <div className="bg-black/25 p-2 rounded-xl border border-white/10 space-y-1.5 overflow-hidden">
                      <div className="flex justify-between items-center text-[8.5px] gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <span className="font-black text-white truncate">
                            الصلاة القادمة: صلاة {getArabicName(nextPrayer)}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono font-black text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20 shrink-0">
                          {toArabicNumbers(prayerTimes[nextPrayer] || '')}
                        </span>
                      </div>

                      {showProgressBar && (
                        <div className="space-y-1 pt-0.5 border-t border-white/5">
                          <div className="flex justify-between items-center text-[7.5px] font-bold px-0.5">
                            <span className="text-amber-200/90 flex items-center gap-1">
                              <span>⏳ متبقي للأذان:</span>
                              <span className="font-mono font-black text-amber-300">
                                {getFormattedTimeRemaining(timeRemainingStr)}
                              </span>
                            </span>
                            <span className="text-white/50 text-[7px] font-mono">
                              ({toArabicNumbers(getPrayerProgressPercent())}%)
                            </span>
                          </div>
                          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                            <div 
                              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 h-full rounded-full transition-all duration-700 shadow-sm"
                              style={{ width: `${getPrayerProgressPercent()}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {prayerDisplay === 'all_prayers' && (
                    <div className="grid grid-cols-5 gap-0.5 text-center bg-black/25 rounded-xl p-1 border border-white/10">
                      {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => {
                        const isActive = currentPrayer === pName;
                        const prayerTime = prayerTimes[pName] || '٠٠:٠٠';
                        return (
                          <div key={pName} className={`p-0.5 rounded transition-all ${isActive ? 'bg-amber-400 text-slate-950 font-black' : 'text-white/80'}`}>
                            <span className="text-[6px] block font-bold leading-none">{getArabicName(pName)}</span>
                            <span className="text-[7px] block font-black font-mono mt-0.5 leading-none">{toArabicNumbers(prayerTime)}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Dhikr Quote */}
                  {showDhikr && (
                    <div className="text-center py-0.5">
                      <p className="text-[8.5px] font-black text-amber-100 font-serif leading-snug">
                        «سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ»
                      </p>
                    </div>
                  )}

                  {/* Quranic Ayah */}
                  {showAyah && (
                    <div className="text-center py-0.5 bg-white/5 rounded-lg p-1 border border-white/5">
                      <p className="text-[8px] font-black text-emerald-200 font-serif leading-snug">
                        «أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ» [الرعد: ٢٨]
                      </p>
                    </div>
                  )}

                  {/* Qibla Indicator */}
                  {showQibla && (
                    <div className="flex justify-between items-center bg-black/20 px-2 py-1 rounded-lg text-[7.5px]">
                      <span className="font-bold text-amber-300">🕋 اتجاه القبلة: ١٣٦° جنوب شرق</span>
                      <span className="text-white/60">موقعك: {settings.cityName || 'الإسكندرية'}</span>
                    </div>
                  )}

                  {/* Subha Button */}
                  {showSubhaBtn && (
                    <div className="flex justify-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => setSubhaCount(c => c + 1)}
                        className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-[9px] px-3 py-1 rounded-full shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span>📿 تسبيح مباشر ({toArabicNumbers(subhaCount)})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STYLE 1: Timeline widget */}
              {widgetType === 'timeline' && (
                <div className={`w-full rounded-[18px] p-2.5 flex flex-col justify-between transition-all duration-500 border text-end select-none scale-100 ${getWidgetThemeClass()}`}>
                  {/* Top line */}
                  <div className="flex justify-between items-start border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 flex flex-col items-center justify-center shadow-xs font-sans scale-90">
                        <span className="text-[10px] font-black leading-none">{toArabicNumbers(currentDayDigit)}</span>
                        <span className="text-[6px] font-bold leading-none">{currentMonthName}</span>
                      </div>
                      <div className="text-end">
                        <span className="text-[8px] font-black block text-white/90 leading-none">{dayNameArabic}</span>
                        <span className="text-[6px] font-bold block text-white/40 mt-0.5">{toArabicNumbers(gregorianStr.split(' ').slice(0, 2).join(' '))}</span>
                      </div>
                    </div>
                    <div className="text-start">
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
                      className="absolute end-1.5 h-[1.5px] bg-amber-400 top-1/2 -translate-y-1/2 z-0 rounded-full transition-all duration-1000"
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
                <div className={`w-full rounded-[18px] p-2 flex flex-col justify-between transition-all duration-500 border text-end select-none ${getWidgetThemeClass()}`}>
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
                    مواقيت الصلاة • تطبيق هِمَّتِي
                  </div>
                </div>
              )}

              {/* STYLE 3: Teal elegant countdown */}
              {widgetType === 'teal' && (
                <div className="w-full rounded-[18px] p-3 flex flex-col justify-between transition-all duration-500 bg-gradient-to-tr from-[#029587] via-[#05ab95] to-[#0ea185] text-white shadow-lg relative overflow-hidden select-none border border-teal-400/30 scale-100">
                  <div className="absolute -start-3 -bottom-5 opacity-10 pointer-events-none text-4xl">🕌</div>
                  
                  <div className="flex justify-between items-center border-b border-white/15 pb-1 text-[7.5px] font-black">
                    <span className="flex items-center gap-0.5">📍 {settings.cityName || 'الإسكندرية'}</span>
                    <span className="text-teal-100">{toArabicNumbers(currentDayDigit)} {currentMonthName}</span>
                  </div>

                  <div className="py-1.5 text-end space-y-0.5">
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
                <div className={`w-full rounded-[18px] p-2.5 flex items-center justify-center gap-3 transition-all duration-500 border text-end select-none ${getWidgetThemeClass()}`}>
                  {/* Miniature Clock Face */}
                  <div className="w-[56px] h-[56px] rounded-full bg-[#0a1520] border-2 border-[#1e3448] relative flex items-center justify-center shrink-0 shadow-md">
                    <div className="absolute inset-0.5 rounded-full border border-dashed border-white/10 pointer-events-none" />
                    <span className="absolute top-1 text-[6px] font-black text-amber-400/80 leading-none">١٢</span>
                    <span className="absolute end-1 text-[6px] font-black text-white/40 leading-none">٣</span>
                    <span className="absolute bottom-1 text-[6px] font-black text-white/40 leading-none">٦</span>
                    <span className="absolute start-1 text-[6px] font-black text-white/40 leading-none">٩</span>

                    {/* Hour Hand */}
                    <div 
                      className="absolute bg-gradient-to-t from-amber-400 to-amber-200 rounded-full shadow-xs"
                      style={{
                        width: '2.5px',
                        height: '15px',
                        left: '50%',
                        bottom: '50%',
                        transformOrigin: 'bottom center',
                        transform: `translateX(-50%) rotate(${hrDeg}deg)`
                      }}
                    />

                    {/* Minute Hand */}
                    <div 
                      className="absolute bg-white rounded-full shadow-xs"
                      style={{
                        width: '1.5px',
                        height: '21px',
                        left: '50%',
                        bottom: '50%',
                        transformOrigin: 'bottom center',
                        transform: `translateX(-50%) rotate(${minDeg}deg)`
                      }}
                    />

                    {/* Second Hand */}
                    <div 
                      className="absolute bg-red-500 rounded-full"
                      style={{
                        width: '1px',
                        height: '23px',
                        left: '50%',
                        bottom: '50%',
                        transformOrigin: 'bottom center',
                        transform: `translateX(-50%) rotate(${secDeg}deg)`
                      }}
                    />

                    <div className="w-2 h-2 rounded-full bg-red-500 border border-white z-10 shadow-xs" />
                  </div>

                  <div className="flex-1 space-y-1 text-right">
                    <span className="text-[7.5px] font-black text-amber-400 block uppercase leading-none">صلاة {getArabicName(nextPrayer)}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-bold text-white/70">متبقي للأذان:</span>
                      <span className="text-[10px] font-black text-amber-300 font-mono leading-none">
                        {getFormattedTimeRemaining(timeRemainingStr)}
                      </span>
                    </div>
                    <div className="text-[6.5px] font-bold text-white/30 pt-0.5 border-t border-white/5 leading-none">
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

              {/* STYLE 6: Dhikr & Digital Subha */}
              {widgetType === 'dhikr' && (
                <div className={`w-full rounded-[18px] p-2.5 flex flex-col justify-between transition-all duration-500 border text-right select-none ${getWidgetThemeClass()}`}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1 text-[7.5px] font-black">
                    <span className="text-amber-400">✨ ذكر اليوم والبركة</span>
                    <span className="text-white/60">{dayNameArabic}</span>
                  </div>
                  <div className="py-1 text-center">
                    <p className="text-[8.5px] font-extrabold text-amber-100 leading-snug">«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ»</p>
                    <button
                      type="button"
                      onClick={() => setSubhaCount(c => c + 1)}
                      className="mt-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-[9px] rounded-full shadow-md transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>📿 تسبيح ({toArabicNumbers(subhaCount)})</span>
                    </button>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/5 pt-1 text-[6.5px] text-white/50 font-bold">
                    <span>الصلاة القادمة: {getArabicName(nextPrayer)}</span>
                    <span>📍 {settings.cityName || 'مكة'}</span>
                  </div>
                </div>
              )}

              {/* STYLE 7: Qibla Compass Widget */}
              {widgetType === 'qibla' && (
                <div className={`w-full rounded-[18px] p-2.5 flex items-center justify-between gap-2 transition-all duration-500 border text-right select-none ${getWidgetThemeClass()}`}>
                  <div className="w-12 h-12 rounded-full bg-slate-900 border-2 border-amber-500/80 flex flex-col items-center justify-center shrink-0 shadow-inner relative">
                    <span className="text-xs">🕌</span>
                    <span className="text-[6.5px] font-black font-mono text-amber-400">١٣٦°</span>
                  </div>
                  <div className="flex-1 text-right space-y-0.5">
                    <span className="text-[6.5px] font-black text-amber-400 block uppercase">بوصلة القبلة</span>
                    <h4 className="text-[8.5px] font-black text-white leading-tight">اتجاه الكعبة المشرفة</h4>
                    <span className="text-[6.5px] text-white/60 block font-bold">موقعك: {settings.cityName || 'الإسكندرية'}</span>
                  </div>
                </div>
              )}

              {/* STYLE 8: Hijri Calendar Widget */}
              {widgetType === 'calendar' && (
                <div className={`w-full rounded-[18px] p-2.5 flex flex-col justify-between transition-all duration-500 border text-right select-none ${getWidgetThemeClass()}`}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex flex-col items-center justify-center font-black">
                        <span className="text-[9px] leading-none">{toArabicNumbers(currentDayDigit)}</span>
                        <span className="text-[5.5px] leading-none font-bold">{currentMonthName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] font-black text-white block">{dayNameArabic}</span>
                        <span className="text-[6.5px] font-bold text-amber-400 block">{toArabicNumbers(currentYear)} هجرية</span>
                      </div>
                    </div>
                    <span className="text-[6.5px] font-bold text-white/40 bg-white/5 px-1.5 py-0.5 rounded">مستحب الصيام 🌙</span>
                  </div>
                  <div className="grid grid-cols-4 gap-0.5 py-1 text-center">
                    {(['Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((pName) => (
                      <div key={pName} className="p-0.5 rounded bg-white/5">
                        <span className="text-[5.5px] text-white/60 block">{getArabicName(pName)}</span>
                        <span className="text-[6.5px] font-black text-white font-mono">{toArabicNumbers(prayerTimes[pName] || '١٢:٠٠')}</span>
                      </div>
                    ))}
                  </div>
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
