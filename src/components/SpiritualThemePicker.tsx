import React, { memo, useState, useEffect, useRef } from 'react';
import { BackdropType } from '../types';
import { Check, Plus, Trash2, ImagePlus, Loader2, Clock, X, Sparkles, Sun, Moon } from 'lucide-react';
import {
  CustomWallpaper,
  WallpaperTimingSlot,
  getAllCustomWallpapersSync,
  subscribeCustomWallpapers,
  saveCustomWallpaper,
  deleteCustomWallpaper,
  getCustomWallpaperSync,
  assignTimingToWallpaper,
  renameCustomWallpaper,
} from '../utils/customWallpaperStorage';

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

export const DEFAULT_MOSQUE_THEMES: ThemeOption[] = [
  {
    id: 'auto',
    name: 'تلقائي مع الوقت',
    desc: 'يتغير مع وقت الصلاة والجمعة',
    icon: '🔄',
  },
  {
    id: 'mosque_1',
    name: 'صورة مسجد ١',
    desc: 'المسجد النهاري المشرق',
    icon: '🕌',
  },
  {
    id: 'mosque_2',
    name: 'صورة مسجد ٢',
    desc: 'المسجد الليلي الروحاني',
    icon: '🌙',
  },
  {
    id: 'mosque_3',
    name: 'صورة مسجد ٣',
    desc: 'أجواء يوم الجمعة المباركة',
    icon: '✨',
  },
  {
    id: 'mosque_4',
    name: 'صورة مسجد ٤',
    desc: 'المحراب والمآذن العالية',
    icon: '🕌',
  },
];

// Backward-compatible alias for existing imports
export const SPIRITUAL_THEMES = DEFAULT_MOSQUE_THEMES;

export interface TimingSlotOption {
  id: WallpaperTimingSlot;
  label: string;
  icon: string;
  desc: string;
}

export const TIMING_SLOT_OPTIONS: TimingSlotOption[] = [
  { id: 'none', label: 'يدوي فقط (بدون توقيت)', icon: '🖼️', desc: 'يظهر فقط عند اختياره يدويًا' },
  { id: 'fajr', label: 'صلاة الفجر', icon: '🌌', desc: 'من أذان الفجر حتى الشروق' },
  { id: 'sunrise', label: 'الشروق والضحى', icon: '🌅', desc: 'من الشروق حتى الظهر' },
  { id: 'dhuhr', label: 'صلاة الظهر', icon: '☀️', desc: 'من أذان الظهر حتى العصر' },
  { id: 'asr', label: 'صلاة العصر', icon: '🌤️', desc: 'من أذان العصر حتى المغرب' },
  { id: 'maghrib', label: 'صلاة المغرب', icon: '🌇', desc: 'من أذان المغرب حتى العشاء' },
  { id: 'isha', label: 'صلاة العشاء والليل', icon: '🌙', desc: 'من أذان العشاء حتى الفجر' },
  { id: 'day', label: 'كامل النهار', icon: '☀️', desc: 'طوال ساعات النهار' },
  { id: 'night', label: 'كامل الليل', icon: '✨', desc: 'طوال ساعات الليل' },
  { id: 'friday', label: 'يوم الجمعة المبارك', icon: '🕌', desc: 'طوال يوم الجمعة' },
];

/**
 * Thumbnail Preview Graphic for preset themes or custom wallpapers
 */
export const ThemeCardThumbnail = memo(function ThemeCardThumbnail({
  themeId,
}: {
  themeId: string;
}) {
  // Custom user uploaded wallpaper
  if (themeId.startsWith('custom_') || themeId.startsWith('data:')) {
    const dataUrl = themeId.startsWith('data:') ? themeId : getCustomWallpaperSync(themeId);
    if (dataUrl) {
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-slate-900 shrink-0">
          <img
            src={dataUrl}
            alt="صورة مخصصة"
            className="w-full h-full object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }
  }

  switch (themeId) {
    case 'auto':
      // 6-Quadrant Collage Thumbnail (Fajr, Duha, Dhuhr, Asr, Maghrib, Isha)
      return (
        <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-[1px] bg-slate-200 dark:bg-slate-700 overflow-hidden relative select-none shrink-0">
          <div className="bg-gradient-to-b from-indigo-900 via-purple-900 to-sky-700 flex items-center justify-center relative overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-300 opacity-80" />
          </div>
          <div className="bg-gradient-to-b from-sky-400 via-sky-200 to-amber-100 flex items-center justify-center relative overflow-hidden">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
          </div>
          <div className="bg-gradient-to-b from-amber-200 via-sky-300 to-sky-500 flex items-center justify-center relative overflow-hidden">
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
          </div>
          <div className="bg-gradient-to-b from-amber-300 via-orange-400 to-rose-500 flex items-center justify-center relative overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-200" />
          </div>
          <div className="bg-gradient-to-b from-purple-900 via-rose-700 to-amber-600 flex items-center justify-center relative overflow-hidden">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
          </div>
          <div className="bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center relative overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-yellow-100" />
          </div>
        </div>
      );

    case 'mosque_1':
    case 'classic':
    case 'light_mosque':
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-slate-900 shrink-0">
          <img
            src="/images/mosque_light.jpg"
            alt="صورة مسجد 1"
            className="w-full h-full object-cover shrink-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = lightMosqueImg;
            }}
          />
        </div>
      );

    case 'mosque_2':
    case 'gold':
    case 'dark_mosque':
    case 'night_sky':
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-slate-950 shrink-0">
          <img
            src="/images/mosque_dark.jpg"
            alt="صورة مسجد 2"
            className="w-full h-full object-cover shrink-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = darkMosqueImg;
            }}
          />
        </div>
      );

    case 'mosque_3':
    case 'friday':
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-emerald-950 shrink-0">
          <img
            src="/images/friday_mosque.jpg"
            alt="صورة مسجد 3"
            className="w-full h-full object-cover shrink-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fridayImg;
            }}
          />
          <div className="absolute top-1.5 start-1.5 bg-emerald-700/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
            يوم الجمعة 🌿
          </div>
        </div>
      );

    case 'mosque_4':
    case 'banner':
      return (
        <div className="w-full h-full relative overflow-hidden select-none bg-slate-900 shrink-0">
          <img
            src="/images/mosque_banner.jpg"
            alt="صورة مسجد 4"
            className="w-full h-full object-cover shrink-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = bannerImg;
            }}
          />
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs shrink-0">
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
 * Renders an uncluttered, modern grid of mosque wallpapers plus user custom uploads.
 */
export const SpiritualThemePicker: React.FC<SpiritualThemePickerProps> = ({
  currentThemeId,
  onSelectTheme,
  className = '',
  columns = 2,
}) => {
  const [customWallpapers, setCustomWallpapers] = useState<CustomWallpaper[]>(() => getAllCustomWallpapersSync());
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timing Slot Assignment Modal State
  const [editingWallpaper, setEditingWallpaper] = useState<CustomWallpaper | null>(null);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [selectedTimingSlot, setSelectedTimingSlot] = useState<WallpaperTimingSlot>('none');
  const [wallpaperCustomName, setWallpaperCustomName] = useState<string>('');

  useEffect(() => {
    setCustomWallpapers(getAllCustomWallpapersSync());
    return subscribeCustomWallpapers(() => {
      setCustomWallpapers(getAllCustomWallpapersSync());
    });
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPEG أو PNG أو WebP)');
      return;
    }

    // Open timing slot assignment modal for newly selected image
    setPendingUploadFile(file);
    const count = customWallpapers.length + 1;
    setWallpaperCustomName(`صورة خاصة ${count}`);
    setSelectedTimingSlot('none');

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleConfirmUploadWithTiming = async () => {
    if (!pendingUploadFile) return;

    setIsUploading(true);
    try {
      const saved = await saveCustomWallpaper(pendingUploadFile, wallpaperCustomName, selectedTimingSlot);
      if (saved) {
        onSelectTheme(saved.id, saved.name);
      }
    } catch (err) {
      console.error('[SpiritualThemePicker] Error saving wallpaper:', err);
    } finally {
      setIsUploading(false);
      setPendingUploadFile(null);
    }
  };

  const handleOpenAssignTimingModal = (e: React.MouseEvent, custom: CustomWallpaper) => {
    e.stopPropagation();
    setEditingWallpaper(custom);
    setSelectedTimingSlot(custom.timingSlot || 'none');
    setWallpaperCustomName(custom.name);
  };

  const handleSaveTimingSlot = async () => {
    if (!editingWallpaper) return;

    try {
      if (wallpaperCustomName.trim() && wallpaperCustomName !== editingWallpaper.name) {
        await renameCustomWallpaper(editingWallpaper.id, wallpaperCustomName);
      }
      await assignTimingToWallpaper(editingWallpaper.id, selectedTimingSlot);
    } catch (err) {
      console.error('[SpiritualThemePicker] Error updating wallpaper timing:', err);
    } finally {
      setEditingWallpaper(null);
    }
  };

  const handleDeleteCustom = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    const confirmed = window.confirm(`هل أنت متأكد من حذف "${name}"؟`);
    if (!confirmed) return;

    await deleteCustomWallpaper(id);
    if (currentThemeId === id) {
      onSelectTheme('auto', 'تلقائي مع الوقت');
    }
  };

  // Helper to test if a theme is active (handling legacy alias mappings)
  const isThemeActive = (id: string): boolean => {
    const active = currentThemeId || 'auto';
    if (active === id) return true;
    if (id === 'mosque_1' && (active === 'classic' || active === 'light_mosque')) return true;
    if (id === 'mosque_2' && (active === 'gold' || active === 'dark_mosque' || active === 'night_sky')) return true;
    if (id === 'mosque_3' && active === 'friday') return true;
    if (id === 'mosque_4' && active === 'banner') return true;
    return false;
  };

  return (
    <div className={`space-y-3 ${className}`} dir="rtl">
      {/* Hidden file input for uploading without compression */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="إضافة صورة من جهازك"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className={`grid ${columns === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'} gap-2.5`}>
        {/* 1. Default preset mosque wallpapers */}
        {DEFAULT_MOSQUE_THEMES.map((theme) => {
          const isSelected = isThemeActive(theme.id);

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelectTheme(theme.id, theme.name)}
              className={`group rounded-2xl overflow-hidden border text-center transition-all duration-200 cursor-pointer flex flex-col justify-between bg-white dark:bg-[#18202c] relative shadow-xs hover:shadow-sm ${
                isSelected
                  ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/30 dark:ring-indigo-400/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-full aspect-[16/10] relative overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                <ThemeCardThumbnail themeId={theme.id} />

                {isSelected && (
                  <div className="absolute top-2 start-2 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md z-20">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Label */}
              <div className="p-2 flex flex-col items-center justify-center gap-0.5 w-full text-center">
                <div className="flex items-center justify-center gap-1 w-full">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {theme.name}
                  </span>
                  {theme.icon && <span className="text-[11px] shrink-0">{theme.icon}</span>}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate max-w-full">
                  {theme.desc}
                </span>
              </div>
            </button>
          );
        })}

        {/* 2. User's custom wallpapers */}
        {customWallpapers.map((custom) => {
          const isSelected = currentThemeId === custom.id;
          const assignedSlot = TIMING_SLOT_OPTIONS.find(s => s.id === custom.timingSlot && s.id !== 'none');

          return (
            <div
              key={custom.id}
              onClick={() => onSelectTheme(custom.id, custom.name)}
              className={`group rounded-2xl overflow-hidden border text-center transition-all duration-200 cursor-pointer flex flex-col justify-between bg-white dark:bg-[#18202c] relative shadow-xs hover:shadow-sm ${
                isSelected
                  ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/30 dark:ring-indigo-400/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-full aspect-[16/10] relative overflow-hidden bg-slate-100 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                <ThemeCardThumbnail themeId={custom.id} />

                {isSelected && (
                  <div className="absolute top-2 start-2 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md z-20">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}

                {/* Timing Badge if assigned */}
                {assignedSlot && (
                  <div className="absolute top-2 start-2 w-auto max-w-[80%] px-1.5 py-0.5 rounded-full bg-indigo-900/90 text-amber-300 border border-amber-400/40 text-[9px] font-medium flex items-center gap-1 shadow-md z-20 backdrop-blur-xs">
                    <span>{assignedSlot.icon}</span>
                    <span className="truncate">{assignedSlot.label}</span>
                  </div>
                )}

                {/* Action buttons: Timing slot edit + Delete */}
                <div className="absolute top-1.5 end-1.5 flex items-center gap-1 z-20">
                  <button
                    type="button"
                    aria-label={`تحديد وقت ظهور ${custom.name}`}
                    onClick={(e) => handleOpenAssignTimingModal(e, custom)}
                    className="w-6 h-6 rounded-full bg-slate-900/85 hover:bg-indigo-600 text-amber-300 hover:text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                    title="تحديد موعد ظهور الصورة مع الصلاة"
                  >
                    <Clock className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    aria-label={`حذف ${custom.name}`}
                    onClick={(e) => handleDeleteCustom(e, custom.id, custom.name)}
                    className="w-6 h-6 rounded-full bg-red-600/90 text-white hover:bg-red-700 flex items-center justify-center shadow-sm opacity-90 hover:opacity-100 transition-opacity cursor-pointer"
                    title="حذف هذه الصورة"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Label */}
              <div className="p-2 flex flex-col items-center justify-center gap-0.5 w-full text-center">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-full">
                  {custom.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {assignedSlot ? `مخصصة لـ ${assignedSlot.label}` : 'صورة خاصة (يدوي)'}
                </span>
              </div>
            </div>
          );
        })}

        {/* 3. Add custom image button card */}
        <button
          type="button"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 dark:hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center p-4 min-h-[140px] text-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            {isUploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ImagePlus className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 block">
              {isUploading ? 'جارٍ إضافة الصورة...' : '➕ أضف صورة من جهازك'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              جودة أصلية كاملة بدون ضغط
            </span>
          </div>
        </button>
      </div>

      {/* Modal 1: Upload Confirmation & Prayer Timing Assignment Modal */}
      {pendingUploadFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🕌</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  إضافة صورة جديدة وتحديد توقيتها
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingUploadFile(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم الصورة
              </label>
              <input
                type="text"
                value={wallpaperCustomName}
                onChange={(e) => setWallpaperCustomName(e.target.value)}
                placeholder="مثال: محراب الفجر، غروب المسجد..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Timing Selection Grid */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                متى ترغب بظهور هذه الصورة؟ (تلقائي بدون تداخل)
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                {TIMING_SLOT_OPTIONS.map((slot) => {
                  const isSlotActive = selectedTimingSlot === slot.id;
                  // Check if another wallpaper currently has this slot
                  const conflictWallpaper = slot.id !== 'none'
                    ? customWallpapers.find(w => w.timingSlot === slot.id)
                    : null;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedTimingSlot(slot.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-0.5 cursor-pointer ${
                        isSlotActive
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <span>{slot.icon}</span>
                          <span>{slot.label}</span>
                        </span>
                        {isSlotActive && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] opacity-75 font-normal">
                        {slot.desc}
                      </span>
                      {conflictWallpaper && !isSlotActive && (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
                          ⚠️ ستستبدل: {conflictWallpaper.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notice about zero overlap */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>
                عند تخصيص توقيت محدد (مثل الفجر أو المغرب)، سيتم إزالة هذا التوقيت تلقائياً من أي صورة سابقة لمنع التداخل تماماً.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPendingUploadFile(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={handleConfirmUploadWithTiming}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>حفظ وتطبيق الصورة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Timing for Existing Custom Wallpaper */}
      {editingWallpaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  تحديد توقيت ظهور الصورة
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingWallpaper(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                تعديل اسم الصورة
              </label>
              <input
                type="text"
                value={wallpaperCustomName}
                onChange={(e) => setWallpaperCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Timing Slot Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                اختر وقت الصلاة أو الفترة المناسبة
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                {TIMING_SLOT_OPTIONS.map((slot) => {
                  const isSlotActive = selectedTimingSlot === slot.id;
                  const conflictWallpaper = slot.id !== 'none'
                    ? customWallpapers.find(w => w.timingSlot === slot.id && w.id !== editingWallpaper.id)
                    : null;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedTimingSlot(slot.id)}
                      className={`p-2.5 rounded-xl border text-right transition-all flex flex-col gap-0.5 cursor-pointer ${
                        isSlotActive
                          ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <span>{slot.icon}</span>
                          <span>{slot.label}</span>
                        </span>
                        {isSlotActive && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 stroke-[3]" />}
                      </div>
                      <span className="text-[10px] opacity-75 font-normal">
                        {slot.desc}
                      </span>
                      {conflictWallpaper && !isSlotActive && (
                        <span className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
                          ⚠️ ستستبدل: {conflictWallpaper.name}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanatory note */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-2.5 text-[11px] text-indigo-800 dark:text-indigo-300 flex items-start gap-1.5">
              <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
              <span>
                تغيير هذا الاختيار سيجعل الخلفية تتغير تلقائياً في هذا الموعد عند تفعيل النمط التلقائي للخلفيات.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingWallpaper(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveTimingSlot}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpiritualThemePicker;
