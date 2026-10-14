/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Local-first source resolution for athan previews.
 *
 * Order: bundled file -> locally cached/downloaded copy -> network URL (only when online) -> bundled default (last resort).
 * The resolver is injected (normally `getAudioUrl`) so this stays pure and unit-testable.
 */

export type PreviewSourceKind = 'bundled' | 'local' | 'remote' | 'default';

export interface PreviewTrackLike {
  id?: string;
  url?: string;
}

export interface PreviewFallbacks {
  fajr: string;
  general: string;
}

export type PreviewUrlResolver = (url: string, trackId?: string, isFajr?: boolean) => Promise<string>;

export interface PreviewSource {
  src: string;
  kind: PreviewSourceKind;
}

export async function resolvePreviewSource(
  track: PreviewTrackLike | undefined,
  isFajr: boolean,
  resolver: PreviewUrlResolver,
  fallbacks: PreviewFallbacks,
  isOnline: boolean = true
): Promise<PreviewSource> {
  const fallback = isFajr ? fallbacks.fajr : fallbacks.general;
  const url = track?.url;

  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { src: fallback, kind: 'default' };
  }

  // Files shipped inside the app need no resolution.
  if (url.startsWith('/audio/')) {
    return { src: url, kind: 'bundled' };
  }

  try {
    const resolved = await resolver(url, track?.id, isFajr);
    if (!resolved || typeof resolved !== 'string') {
      return { src: fallback, kind: 'default' };
    }
    if (resolved.startsWith('blob:')) {
      return { src: resolved, kind: 'local' };
    }
    if (resolved.startsWith('/audio/')) {
      // The resolver itself fell back to a bundled default.
      return { src: resolved, kind: 'default' };
    }
    // A network URL is useless when the device is offline and the resolver found no cached copy
    // (getAudioUrl returns the https URL even offline). Go straight to the default instead of
    // waiting for the request to fail. Cached copies (blob:) are decided above and still win offline.
    if (!isOnline) {
      return { src: fallback, kind: 'default' };
    }
    return { src: resolved, kind: 'remote' };
  } catch {
    return { src: fallback, kind: 'default' };
  }
}

export function describePreviewSource(kind: PreviewSourceKind): string {
  switch (kind) {
    case 'local':
      return 'من التخزين المحلي';
    case 'remote':
      return 'من الإنترنت';
    case 'default':
      return 'الصوت الافتراضي لأن المؤذن المختار غير متاح';
    case 'bundled':
    default:
      return 'الصوت المدمج';
  }
}
