import { BackdropType } from '../components/MosqueBackdrop';
import { BackdropRenderMode } from '../types';

import fridayBackdrop from '../assets/images/friday_mosque_backdrop_1785488098914.jpg';
import goldBackdrop from '../assets/images/mosque_backdrop_gold_1784097866777.jpg';
import classicBackdrop from '../assets/images/mosque_backdrop_1784095267677.jpg';
import bannerBackdrop from '../assets/images/mosque_banner_1784014914575.jpg';

export const BACKDROP_IMAGE_MAP: Record<string, string> = {
  friday: fridayBackdrop,
  gold: goldBackdrop,
  classic: classicBackdrop,
  banner: bannerBackdrop,
  ramadan: classicBackdrop,
  eid_fitr: goldBackdrop,
  eid_adha: bannerBackdrop,
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
  'eid_adha'
]);

/**
 * Resolves the actual render mode ('lineArt' | 'illustrated')
 * based on user preference and available PNG assets.
 */
export function resolveRenderMode(
  type: BackdropType | string,
  preference: BackdropRenderMode = 'auto'
): 'lineArt' | 'illustrated' {
  const backdropKey = type === 'auto' ? 'classic' : type;

  if (preference === 'illustrated') {
    return AVAILABLE_PNG_BACKDROPS.has(backdropKey) ? 'illustrated' : 'lineArt';
  }
  if (preference === 'lineArt') {
    return 'lineArt';
  }
  // 'auto': prefers illustrated if available, otherwise lineArt
  return AVAILABLE_PNG_BACKDROPS.has(backdropKey) ? 'illustrated' : 'lineArt';
}

/**
 * Gets local image asset URL if available.
 */
export function getBackdropImagePath(type: string): string | null {
  const key = type === 'auto' ? 'classic' : type;
  if (BACKDROP_IMAGE_MAP[key]) {
    return BACKDROP_IMAGE_MAP[key];
  }
  return null;
}

