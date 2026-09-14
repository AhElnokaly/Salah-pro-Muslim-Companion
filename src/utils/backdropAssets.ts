import { BackdropType, BackdropRenderMode } from '../types';
import { getCustomWallpaperSync } from './customWallpaperStorage';

import fridayBackdrop from '../assets/images/friday_mosque_backdrop.jpg';
import goldBackdrop from '../assets/images/mosque_backdrop_dark.jpg';
import classicBackdrop from '../assets/images/mosque_backdrop_light.jpg';
import bannerBackdrop from '../assets/images/mosque_banner.jpg';
import lightMosqueBackdrop from '../assets/images/mosque_backdrop_light.jpg';
import darkMosqueBackdrop from '../assets/images/mosque_backdrop_dark.jpg';

export const LIGHT_MOSQUE_BACKDROP = lightMosqueBackdrop;
export const DARK_MOSQUE_BACKDROP = darkMosqueBackdrop;

export const BACKDROP_IMAGE_MAP: Record<string, string> = {
  mosque_1: lightMosqueBackdrop,
  mosque_2: darkMosqueBackdrop,
  mosque_3: fridayBackdrop,
  mosque_4: bannerBackdrop,
  friday: fridayBackdrop,
  gold: darkMosqueBackdrop,
  classic: lightMosqueBackdrop,
  banner: bannerBackdrop,
  ramadan: darkMosqueBackdrop,
  eid_fitr: lightMosqueBackdrop,
  eid_adha: bannerBackdrop,
  night_sky: darkMosqueBackdrop,
  emerald: darkMosqueBackdrop,
  madinah: lightMosqueBackdrop,
  kaaba: darkMosqueBackdrop,
  aqsa: lightMosqueBackdrop,
  andulas: darkMosqueBackdrop,
  light_mosque: lightMosqueBackdrop,
  dark_mosque: darkMosqueBackdrop,
};

/**
 * Set of backdrop keys that currently have a valid image asset.
 */
export const AVAILABLE_PNG_BACKDROPS: Set<string> = new Set([
  'mosque_1',
  'mosque_2',
  'mosque_3',
  'mosque_4',
  'friday',
  'gold',
  'classic',
  'banner',
  'ramadan',
  'eid_fitr',
  'eid_adha',
  'night_sky',
  'emerald',
  'madinah',
  'kaaba',
  'aqsa',
  'andulas',
  'light_mosque',
  'dark_mosque',
]);

/**
 * Resolves the actual render mode ('lineArt' | 'illustrated')
 * based on user preference and available PNG assets.
 */
export function resolveRenderMode(
  type: BackdropType | string,
  preference: BackdropRenderMode | string = 'auto'
): 'lineArt' | 'illustrated' {
  const backdropKey = type === 'auto' ? 'classic' : type;

  if (preference === 'lineArt') {
    return 'lineArt';
  }

  // Custom user wallpapers are always rendered as illustrated image
  if (backdropKey.startsWith('custom_') || backdropKey.startsWith('data:')) {
    return 'illustrated';
  }

  // For 'auto', 'illustrated', 'preset', prefer illustrated PNG images if available
  return AVAILABLE_PNG_BACKDROPS.has(backdropKey) ? 'illustrated' : 'lineArt';
}

/**
 * Gets local image asset URL if available.
 */
export function getBackdropImagePath(type: string): string | null {
  if (!type) return null;

  // Custom user-uploaded wallpaper check
  if (type.startsWith('custom_') || type.startsWith('data:')) {
    if (type.startsWith('data:')) return type;
    const customImg = getCustomWallpaperSync(type);
    if (customImg) return customImg;
  }

  const key = type === 'auto' ? 'classic' : type;
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  if (key === 'classic' || key === 'auto') {
    return isDark ? darkMosqueBackdrop : lightMosqueBackdrop;
  }
  if (key === 'gold' || key === 'dark_mosque' || key === 'mosque_2') {
    return darkMosqueBackdrop;
  }
  if (key === 'light_mosque' || key === 'mosque_1') {
    return lightMosqueBackdrop;
  }
  if (key === 'friday' || key === 'mosque_3') {
    return fridayBackdrop;
  }
  if (key === 'banner' || key === 'mosque_4') {
    return bannerBackdrop;
  }

  if (BACKDROP_IMAGE_MAP[key]) {
    return BACKDROP_IMAGE_MAP[key];
  }
  return isDark ? darkMosqueBackdrop : lightMosqueBackdrop;
}



