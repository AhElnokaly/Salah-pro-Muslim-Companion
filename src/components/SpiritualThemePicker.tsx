import React, { memo } from 'react';
import { BackdropType } from '../types';
import { Check } from 'lucide-react';
import fridayImg from '../assets/images/friday_mosque_backdrop.jpg';
import darkMosqueImg from '../assets/images/mosque_backdrop_dark.jpg';
import lightMosqueImg from '../assets/images/mosque_backdrop_light.jpg';
import bannerImg from '../assets/images/mosque_banner.jpg';

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
        <div className="w-full h-full relative overflow-hidden select-none bg-slate-900">
          <img
            src="/images/classic_theme.jpg"
            alt="الكلاسيكي الفاخر"
            className="w-full h-full object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
        </div>
      );

    case 'madinah':
      // The Prophet's Mosque Green Dome & White Minarets
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-sky-900">
          <img
            src="/images/madinah_mosque.jpg"
            alt="المسجد النبوي الشريف"
            className="w-full h-full object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
        </div>
      );

    case 'kaaba':
      // The Holy Kaaba with Illuminated Night Glow
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-slate-950">
          <img
            src="/images/makkah_kaaba.jpg"
            alt="المسجد الحرام والكعبة"
            className="w-full h-full object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
        </div>
      );

    case 'aqsa':
      // The Golden Dome of the Rock (Qubbat As-Sakhrah)
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-cyan-900">
          <img
            src="/images/aqsa_mosque.jpg"
            alt="المسجد الأقصى المبارك"
            className="w-full h-full object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
        </div>
      );

    case 'friday':
      // The Friday Minbar & Luminous Mosque Interior
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-emerald-950">
          <img 
            src="/images/friday_mosque.jpg" 
            alt="الجمعة المباركة" 
            className="w-full h-full object-cover shrink-0" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 via-transparent to-black/20" />
          <div className="absolute top-2 start-2 bg-emerald-500/80 backdrop-blur-xs text-white text-[9px] font-black px-1.5 py-0.5 rounded-md">
            سورة الكهف 📖
          </div>
        </div>
      );

    case 'gold':
      // Royal Islamic Golden Ornament
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-amber-950">
          <img 
            src="/images/gold_theme.jpg" 
            alt="الذهبي الملكي" 
            className="w-full h-full object-cover shrink-0" 
            referrerPolicy="no-referrer"
          />
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
            <div className="p-2 sm:p-2.5 flex flex-col items-center justify-center gap-1 min-h-[66px] w-full text-center">
              <div className="flex items-center justify-center gap-1 w-full flex-wrap">
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white leading-tight break-words text-center">
                  {theme.name}
                </span>
                {theme.icon && <span className="text-xs shrink-0 select-none">{theme.icon}</span>}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-tight break-words text-center">
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
