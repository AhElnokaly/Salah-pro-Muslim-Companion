import React, { memo } from 'react';
import { BackdropType } from '../types';
import { Check } from 'lucide-react';
import fridayImg from '../assets/images/friday_mosque_backdrop_1785488098914.jpg';
import darkMosqueImg from '../assets/images/mosque_backdrop_dark_1785869917166.jpg';
import lightMosqueImg from '../assets/images/mosque_backdrop_light_1785869903259.jpg';
import bannerImg from '../assets/images/mosque_banner_1784014914575.jpg';

export interface ThemeOption {
  id: BackdropType | string;
  name: string;
  desc: string;
  icon?: string;
  badge?: string;
}

export const SPIRITUAL_THEMES: ThemeOption[] = [
  {
    id: 'auto',
    name: 'تلقائي مع الوقت',
    desc: 'يتغير مع وقت الصلاة',
    icon: '🔄',
  },
  {
    id: 'classic',
    name: 'الكلاسيكي الفاخر',
    desc: 'مظهر إسلامي زاهي',
    icon: '🕌',
  },
  {
    id: 'madinah',
    name: 'المسجد النبوي الشريف',
    desc: 'الروضة والسكينة',
    icon: '🕌',
  },
  {
    id: 'kaaba',
    name: 'المسجد الحرام والكعبة',
    desc: 'أنوار الحرم المكي',
    icon: '🕋',
  },
  {
    id: 'aqsa',
    name: 'المسجد الأقصى المبارك',
    desc: 'قبة الصخرة المعظمة',
    icon: '🕌',
  },
  {
    id: 'friday',
    name: 'الجمعة المباركة',
    desc: 'أجواء الجمعة العطرة',
    icon: '✨',
  },
  {
    id: 'gold',
    name: 'الذهبي الملكي',
    desc: 'زخارف ذهبية راقية',
    icon: '🪙',
  },
];

/**
 * Thumbnail Preview Graphic for each Spiritual Theme
 * Inspired by the reference design with high fidelity artwork
 */
export const ThemeCardThumbnail = memo(function ThemeCardThumbnail({
  themeId,
}: {
  themeId: string;
}) {
  switch (themeId) {
    case 'auto':
      // 6-Quadrant Collage Thumbnail (Dawn, Morning, Noon, Afternoon, Sunset, Night)
      return (
        <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-[1px] bg-slate-200 dark:bg-slate-700 overflow-hidden relative select-none">
          {/* Dawn / Fajr */}
          <div className="bg-gradient-to-b from-indigo-900 via-purple-900 to-sky-700 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 100 80" className="w-full h-full object-cover">
              <path d="M 50,35 Q 35,45 35,60 L 65,60 Q 65,45 50,35 Z" fill="#38bdf8" opacity="0.7" />
              <rect x="20" y="20" width="8" height="45" fill="#bae6fd" opacity="0.8" />
              <circle cx="75" cy="25" r="5" fill="#fef08a" opacity="0.9" />
            </svg>
          </div>
          {/* Morning / Duha */}
          <div className="bg-gradient-to-b from-sky-400 via-sky-200 to-amber-100 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 100 80" className="w-full h-full object-cover">
              <circle cx="50" cy="20" r="8" fill="#f59e0b" />
              <path d="M 50,40 Q 30,50 30,70 L 70,70 Q 70,50 50,40 Z" fill="#ffffff" opacity="0.9" />
              <rect x="15" y="25" width="8" height="45" fill="#f1f5f9" />
              <rect x="77" y="25" width="8" height="45" fill="#f1f5f9" />
            </svg>
          </div>
          {/* Noon / Dhuhr */}
          <div className="bg-gradient-to-b from-amber-200 via-sky-300 to-sky-500 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 100 80" className="w-full h-full object-cover">
              <circle cx="75" cy="18" r="9" fill="#fbbf24" />
              <path d="M 50,38 Q 30,48 30,70 L 70,70 Q 70,48 50,38 Z" fill="#f8fafc" opacity="0.95" />
            </svg>
          </div>
          {/* Afternoon / Asr */}
          <div className="bg-gradient-to-b from-amber-300 via-orange-400 to-rose-500 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 100 80" className="w-full h-full object-cover">
              <path d="M 50,36 Q 30,46 30,70 L 70,70 Q 70,46 50,36 Z" fill="#fef3c7" opacity="0.85" />
              <rect x="18" y="28" width="7" height="42" fill="#fed7aa" />
              <rect x="75" y="28" width="7" height="42" fill="#fed7aa" />
            </svg>
          </div>
          {/* Sunset / Maghrib */}
          <div className="bg-gradient-to-b from-purple-900 via-rose-700 to-amber-600 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 100 80" className="w-full h-full object-cover">
              <circle cx="50" cy="50" r="14" fill="#fb923c" opacity="0.8" />
              <path d="M 50,35 Q 32,45 32,70 L 68,70 Q 68,45 50,35 Z" fill="#0f172a" opacity="0.75" />
              <rect x="16" y="22" width="6" height="48" fill="#0f172a" opacity="0.8" />
              <rect x="78" y="22" width="6" height="48" fill="#0f172a" opacity="0.8" />
            </svg>
          </div>
          {/* Night / Isha & Qiyam */}
          <div className="bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
            <svg viewBox="0 0 100 80" className="w-full h-full object-cover">
              <circle cx="75" cy="20" r="2" fill="#ffffff" />
              <circle cx="25" cy="25" r="1.5" fill="#fef08a" />
              <path d="M 75,12 A 8,8 0 1,1 66,21 A 6.5,6.5 0 1,0 75,12 Z" fill="#fef08a" />
              <path d="M 50,35 Q 32,45 32,70 L 68,70 Q 68,45 50,35 Z" fill="#1e293b" />
            </svg>
          </div>
        </div>
      );

    case 'classic':
      // Islamic Arch / Mihrab Arabesque Artwork
      return (
        <div className="w-full h-full bg-gradient-to-b from-[#1b4332] via-[#081c15] to-[#1b4332] relative overflow-hidden select-none flex items-center justify-center">
          <svg viewBox="0 0 200 150" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="mihrab-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#78350f" />
              </linearGradient>
              <pattern id="arabesque-tile" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 10,0 L 20,10 L 10,20 L 0,10 Z" fill="none" stroke="#2d6a4f" strokeWidth="0.8" opacity="0.6" />
                <circle cx="10" cy="10" r="3" fill="none" stroke="#d97706" strokeWidth="0.5" opacity="0.7" />
              </pattern>
            </defs>
            {/* Tile Background */}
            <rect width="200" height="150" fill="url(#arabesque-tile)" />
            {/* Outer Frame */}
            <rect x="15" y="10" width="170" height="130" rx="6" fill="none" stroke="url(#mihrab-gold)" strokeWidth="2.5" />
            {/* Mihrab Arch */}
            <path
              d="M 40,140 L 40,65 Q 40,25 100,18 Q 160,25 160,65 L 160,140 Z"
              fill="#081c15"
              stroke="url(#mihrab-gold)"
              strokeWidth="2"
            />
            {/* Inner Multi-cusp Arch */}
            <path
              d="M 55,140 L 55,75 Q 75,45 100,38 Q 125,45 145,75 L 145,140 Z"
              fill="#1b4332"
              fillOpacity="0.8"
              stroke="#fbbf24"
              strokeWidth="1.2"
              strokeDasharray="4 2"
            />
            {/* Hanging Lantern */}
            <line x1="100" y1="38" x2="100" y2="70" stroke="#f59e0b" strokeWidth="1" />
            <polygon points="100,70 108,82 100,92 92,82" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
            <circle cx="100" cy="82" r="3" fill="#ffffff" />
          </svg>
        </div>
      );

    case 'madinah':
      // The Prophet's Mosque Green Dome & White Minarets
      return (
        <div className="w-full h-full bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-[#f8fafc] relative overflow-hidden select-none flex items-center justify-center">
          <svg viewBox="0 0 200 150" className="w-full h-full object-cover">
            {/* Sky Tint */}
            <rect width="200" height="150" fill="#e0f2fe" />
            {/* Palm Silhouettes */}
            <path d="M 15,130 Q 30,90 20,80 Q 35,95 40,85 Q 40,110 35,130 Z" fill="#047857" opacity="0.6" />
            <path d="M 185,130 Q 170,90 180,80 Q 165,95 160,85 Q 160,110 165,130 Z" fill="#047857" opacity="0.6" />
            {/* Mosque White Courtyard Base */}
            <rect x="0" y="105" width="200" height="45" fill="#f1f5f9" />
            <line x1="0" y1="105" x2="200" y2="105" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Left Nabawi Minaret */}
            <rect x="35" y="30" width="10" height="75" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
            <polygon points="40,10 35,30 45,30" fill="#047857" stroke="#065f46" strokeWidth="0.8" />
            <circle cx="40" cy="8" r="1.5" fill="#fbbf24" />
            {/* Right Nabawi Minaret */}
            <rect x="155" y="30" width="10" height="75" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
            <polygon points="160,10 155,30 165,30" fill="#047857" stroke="#065f46" strokeWidth="0.8" />
            <circle cx="160" cy="8" r="1.5" fill="#fbbf24" />
            {/* White Small Dome */}
            <path d="M 62,105 Q 62,80 77,80 Q 92,80 92,105 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            {/* Iconic Green Dome */}
            <g transform="translate(100, 50)">
              <path
                d="M -30,55 L -30,28 Q -30,0 0,-12 Q 30,0 30,28 L 30,55 Z"
                fill="#047857"
                stroke="#065f46"
                strokeWidth="1.5"
              />
              {/* Crescent Spire */}
              <line x1="0" y1="-12" x2="0" y2="-24" stroke="#fbbf24" strokeWidth="1.8" />
              <circle cx="0" cy="-24" r="3" fill="#fbbf24" />
            </g>
            {/* Mosque Arched Windows */}
            {[50, 75, 100, 125, 150].map((cx, i) => (
              <path key={i} d={`M ${cx - 5},125 L ${cx - 5},115 Q ${cx},110 ${cx + 5},115 L ${cx + 5},125 Z`} fill="#0f172a" opacity="0.75" />
            ))}
          </svg>
        </div>
      );

    case 'kaaba':
      // The Holy Kaaba with Illuminated Night Glow
      return (
        <div className="w-full h-full bg-gradient-to-b from-[#020617] via-[#090d16] to-[#020617] relative overflow-hidden select-none flex items-center justify-center">
          <svg viewBox="0 0 200 150" className="w-full h-full object-cover">
            <defs>
              <radialGradient id="kaaba-halo" cx="50%" cy="55%" r="45%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#d97706" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>
            </defs>
            {/* Glow Behind Kaaba */}
            <circle cx="100" cy="80" r="70" fill="url(#kaaba-halo)" />
            {/* Haram Illuminated Arches & Minarets in Background */}
            <g opacity="0.6">
              <rect x="55" y="15" width="8" height="85" fill="#f8fafc" stroke="#fbbf24" strokeWidth="0.8" />
              <polygon points="59,3 55,15 63,15" fill="#fbbf24" />
              <rect x="137" y="15" width="8" height="85" fill="#f8fafc" stroke="#fbbf24" strokeWidth="0.8" />
              <polygon points="141,3 137,15 145,15" fill="#fbbf24" />
              {/* Colonnade */}
              <rect x="20" y="65" width="160" height="40" fill="#1e293b" opacity="0.8" />
              {[30, 50, 70, 90, 110, 130, 150, 170].map((x, i) => (
                <path key={i} d={`M ${x},85 Q ${x + 6},75 ${x + 12},85 L ${x + 12},105 L ${x},105 Z`} fill="#fef08a" opacity="0.85" />
              ))}
            </g>
            {/* White Marble Mataf Floor */}
            <rect x="0" y="100" width="200" height="50" fill="#f8fafc" />
            <ellipse cx="100" cy="115" rx="80" ry="25" fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
            {/* Holy Kaaba Structure */}
            <g transform="translate(70, 55)">
              <rect x="0" y="0" width="60" height="58" rx="2" fill="#09090b" stroke="#27272a" strokeWidth="1.5" />
              {/* Golden Kiswa Belt */}
              <rect x="0" y="10" width="60" height="6" fill="#fbbf24" stroke="#d97706" strokeWidth="0.5" />
              <line x1="0" y1="12" x2="60" y2="12" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 1" />
              {/* Golden Door (Bab al-Kaaba) */}
              <rect x="38" y="20" width="15" height="28" rx="1" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
              <path d="M 40,24 L 51,24 M 40,30 L 51,30 M 40,36 L 51,36" stroke="#92400e" strokeWidth="0.6" />
              {/* Hijr Ismail Arc */}
              <path d="M -8,50 Q -16,40 -16,28" fill="none" stroke="#d97706" strokeWidth="1.2" />
            </g>
          </svg>
        </div>
      );

    case 'aqsa':
      // The Golden Dome of the Rock (Qubbat As-Sakhrah)
      return (
        <div className="w-full h-full bg-gradient-to-b from-[#0e7490] via-[#155e75] to-[#164e63] relative overflow-hidden select-none flex items-center justify-center">
          <svg viewBox="0 0 200 150" className="w-full h-full object-cover">
            {/* Sky */}
            <rect width="200" height="150" fill="url(#aqsa-sky)" />
            <defs>
              <linearGradient id="aqsa-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0891b2" />
                <stop offset="100%" stopColor="#155e75" />
              </linearGradient>
              <linearGradient id="gold-dome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            {/* Courtyard Floor */}
            <rect x="0" y="115" width="200" height="35" fill="#f8fafc" />
            {/* Octagonal Base Building */}
            <g transform="translate(50, 65)">
              {/* Lower Marble Section */}
              <rect x="10" y="32" width="80" height="25" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              {/* Upper Turquoise Ceramic Tile Band */}
              <rect x="10" y="16" width="80" height="16" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
              {[18, 30, 42, 54, 66, 78].map((x, i) => (
                <rect key={i} x={x} y="19" width="6" height="10" rx="1" fill="#0f172a" />
              ))}
              {/* Iconic Golden Dome */}
              <path
                d="M 15,16 Q 10,-28 50,-38 Q 90,-28 85,16 Z"
                fill="url(#gold-dome)"
                stroke="#d97706"
                strokeWidth="1.5"
              />
              {/* Golden Crescent Finial */}
              <line x1="50" y1="-38" x2="50" y2="-48" stroke="#fef08a" strokeWidth="1.8" />
              <circle cx="50" cy="-48" r="2.5" fill="#fbbf24" />
            </g>
            {/* Famous Mawazin (Scale Arches) of Al-Aqsa */}
            <g transform="translate(10, 80)" opacity="0.8">
              <path d="M 0,35 L 0,10 Q 15,0 30,10 L 30,35" fill="none" stroke="#f8fafc" strokeWidth="1.8" />
              <path d="M 150,35 L 150,10 Q 165,0 180,10 L 180,35" fill="none" stroke="#f8fafc" strokeWidth="1.8" />
            </g>
          </svg>
        </div>
      );

    case 'friday':
      // The Friday Minbar & Luminous Mosque Interior
      return (
        <div className="w-full h-full relative overflow-hidden select-none">
          <img 
            src={fridayImg} 
            alt="Friday Mosque Atmosphere" 
            className="w-full h-full object-cover object-center transform scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-black/30" />
          <div className="absolute top-2 start-2 bg-emerald-500/80 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
            سورة الكهف 📖
          </div>
        </div>
      );

    case 'gold':
      // Royal Islamic Golden Ornament Medallions
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-gradient-to-br from-amber-600 via-amber-400 to-amber-700">
          <img 
            src={darkMosqueImg} 
            alt="Royal Gold Mosque" 
            className="w-full h-full object-cover object-center mix-blend-multiply opacity-80" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950/80 via-transparent to-amber-900/40" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-2 border-amber-300/80 flex items-center justify-center bg-amber-500/20 backdrop-blur-xs shadow-lg">
              <span className="text-2xl drop-shadow-md">👑</span>
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-slate-400 text-xs">
          <span>{themeId}</span>
        </div>
      );
  }
});

interface SpiritualThemePickerProps {
  currentThemeId: string;
  onSelectTheme: (themeId: string, themeName: string) => void;
  className?: string;
  columns?: 2 | 3;
}

/**
 * SpiritualThemePicker Component
 * Renders the 2-column or 3-column interactive visual card grid inspired by the reference image.
 */
export const SpiritualThemePicker: React.FC<SpiritualThemePickerProps> = ({
  currentThemeId,
  onSelectTheme,
  className = '',
  columns = 2,
}) => {
  return (
    <div className={`grid ${columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-3 ${className}`} dir="rtl">
      {SPIRITUAL_THEMES.map((theme, idx) => {
        const isSelected = (currentThemeId || 'auto') === theme.id;
        const isLastOdd = idx === SPIRITUAL_THEMES.length - 1 && SPIRITUAL_THEMES.length % 2 !== 0;

        return (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelectTheme(theme.id, theme.name)}
            className={`group rounded-2xl overflow-hidden border-2 text-center transition-all duration-300 cursor-pointer flex flex-col justify-between bg-white dark:bg-[#1a2332] shadow-xs hover:shadow-md hover:scale-[1.02] active:scale-[0.99] relative ${
              isLastOdd && columns === 2 ? 'col-span-2 sm:col-span-1 sm:col-start-1 sm:translate-x-1/2' : ''
            } ${
              isSelected
                ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 dark:ring-amber-400/30 shadow-amber-500/10'
                : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-300 dark:hover:border-slate-700'
            }`}
          >
            {/* Top Visual Preview Area */}
            <div className="w-full aspect-[4/3] relative overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80">
              <ThemeCardThumbnail themeId={theme.id} />

              {/* Active Selection Checkmark Badge */}
              {isSelected && (
                <div className="absolute top-2 start-2 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md animate-scaleUp z-20">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Bottom Label and Subtitle Area */}
            <div className="p-2.5 sm:p-3 flex flex-col items-center justify-center gap-0.5 min-h-[58px]">
              <div className="flex items-center justify-center gap-1.5 w-full">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white truncate">
                  {theme.name}
                </span>
                {theme.icon && <span className="text-xs shrink-0">{theme.icon}</span>}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-400 line-clamp-1">
                {theme.desc}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default SpiritualThemePicker;
