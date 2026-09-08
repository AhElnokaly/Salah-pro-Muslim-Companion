/**
 * GitHub In-App Update Checker Service
 * Safely queries GitHub Releases API to detect newer APK versions,
 * parses semver tags, extracts direct APK download links, and caches checks.
 */

import { APP_VERSION } from '../version';

export interface AppReleaseInfo {
  tagName: string;
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
  apkDownloadUrl: string | null;
  apkFileName?: string;
  apkSizeFormatted?: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestRelease?: AppReleaseInfo;
  error?: string;
  lastCheckedAt: number;
}

export const DEFAULT_GITHUB_REPO = 'AhElnokaly/Salah-pro-Muslim-Companion';
const STORAGE_LAST_CHECK_KEY = 'hemmaty_last_update_check_v1';
const THROTTLE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Strips 'v' prefix and compares two semantic version strings.
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = v1.trim().replace(/^v/i, '');
  const clean2 = v2.trim().replace(/^v/i, '');

  const parts1 = clean1.split(/[.-]/).map(p => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  const parts2 = clean2.split(/[.-]/).map(p => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} ميجابايت`;
}

/**
 * Checks GitHub repository releases for a newer version than currently running.
 */
export async function checkForAppUpdates(options?: {
  force?: boolean;
  repo?: string;
}): Promise<UpdateCheckResult> {
  const repo = options?.repo || DEFAULT_GITHUB_REPO;
  const currentVersion = APP_VERSION.version;
  const now = Date.now();

  // Check throttle unless forced
  if (!options?.force && typeof window !== 'undefined') {
    try {
      const rawCached = localStorage.getItem(STORAGE_LAST_CHECK_KEY);
      if (rawCached) {
        const cached = JSON.parse(rawCached) as UpdateCheckResult;
        if (cached && now - (cached.lastCheckedAt || 0) < THROTTLE_DURATION_MS) {
          return cached;
        }
      }
    } catch {
      // Ignore cache read errors
    }
  }

  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (response.status === 404) {
      const result: UpdateCheckResult = {
        hasUpdate: false,
        currentVersion,
        error: 'لم يُنشر أي إصدار رسمي بعد على مستودع GitHub.',
        lastCheckedAt: now,
      };
      saveToCache(result);
      return result;
    }

    if (!response.ok) {
      throw new Error(`تعذر الاتصال بـ GitHub API (رمز: ${response.status})`);
    }

    const data = await response.json();
    const tagName: string = data.tag_name || '';
    const remoteVersion = tagName.replace(/^v/i, '');

    // Look for APK artifact in assets
    let apkDownloadUrl: string | null = null;
    let apkFileName: string | undefined;
    let apkSizeFormatted: string | undefined;

    if (Array.isArray(data.assets) && data.assets.length > 0) {
      const apkAsset = data.assets.find((asset: { name?: string; browser_download_url?: string; size?: number }) =>
        asset.name?.toLowerCase().endsWith('.apk')
      );
      if (apkAsset) {
        apkDownloadUrl = apkAsset.browser_download_url || null;
        apkFileName = apkAsset.name;
        if (apkAsset.size) {
          apkSizeFormatted = formatFileSize(apkAsset.size);
        }
      }
    }

    // Determine if remote version is strictly newer
    const isNewer = compareSemver(remoteVersion, currentVersion) > 0;

    const releaseInfo: AppReleaseInfo = {
      tagName,
      version: remoteVersion,
      name: data.name || `إصدار ${remoteVersion}`,
      body: data.body || '',
      publishedAt: data.published_at || new Date().toISOString(),
      htmlUrl: data.html_url || `https://github.com/${repo}/releases`,
      apkDownloadUrl,
      apkFileName,
      apkSizeFormatted,
    };

    const result: UpdateCheckResult = {
      hasUpdate: isNewer,
      currentVersion,
      latestRelease: releaseInfo,
      lastCheckedAt: now,
    };

    saveToCache(result);
    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'حدث خطأ أثناء فحص التحديثات';
    return {
      hasUpdate: false,
      currentVersion,
      error: errorMsg,
      lastCheckedAt: now,
    };
  }
}

function saveToCache(result: UpdateCheckResult): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_LAST_CHECK_KEY, JSON.stringify(result));
    } catch {
      // Storage unavailable or quota exceeded
    }
  }
}
