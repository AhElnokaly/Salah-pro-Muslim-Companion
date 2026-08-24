import { BackdropType, BackdropRenderMode } from '../types';

import fridayBackdrop from '../assets/images/friday_mosque_backdrop.jpg';
import goldBackdrop from '../assets/images/mosque_backdrop_dark.jpg';
import classicBackdrop from '../assets/images/mosque_backdrop_light.jpg';
import bannerBackdrop from '../assets/images/mosque_banner.jpg';
import lightMosqueBackdrop from '../assets/images/mosque_backdrop_light.jpg';
import darkMosqueBackdrop from '../assets/images/mosque_backdrop_dark.jpg';

export const LIGHT_MOSQUE_BACKDROP = lightMosqueBackdrop;
export const DARK_MOSQUE_BACKDROP = darkMosqueBackdrop;

export const BACKDROP_IMAGE_MAP: Record<string, string> = {
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

  // For 'auto', 'illustrated', 'preset', prefer illustrated PNG images if available
  return AVAILABLE_PNG_BACKDROPS.has(backdropKey) ? 'illustrated' : 'lineArt';
}

/**
 * Gets local image asset URL if available.
 */
export function getBackdropImagePath(type: string): string | null {
  const key = type === 'auto' ? 'classic' : type;
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  if (key === 'classic' || key === 'auto') {
    return isDark ? darkMosqueBackdrop : lightMosqueBackdrop;
  }
  if (key === 'gold' || key === 'dark_mosque') {
    return darkMosqueBackdrop;
  }
  if (key === 'light_mosque') {
    return lightMosqueBackdrop;
  }

  if (BACKDROP_IMAGE_MAP[key]) {
    return BACKDROP_IMAGE_MAP[key];
  }
  return isDark ? darkMosqueBackdrop : lightMosqueBackdrop;
}


