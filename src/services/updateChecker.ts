/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CURRENT_RELEASE } from '../data/changelog';
import { safeGetItem, safeSetItem } from '../utils/storage';

export const DEFAULT_GITHUB_REPO = 'AhElnokaly/Salah-pro-Muslim-Companion';
const LAST_CHECK_KEY = 'hemmaty_last_update_check_time';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AppReleaseInfo {
  version: string;
  title: string;
  releaseNotes: string;
  name?: string;
  body?: string;
  publishedAt: string;
  htmlUrl: string;
  apkDownloadUrl?: string;
  apkFileName?: string;
  apkSizeFormatted?: string;
}

export interface CheckUpdateResult {
  hasUpdate: boolean;
  latestRelease?: AppReleaseInfo | null;
  error?: string;
}

export type UpdateCheckResult = CheckUpdateResult;

/**
 * Compare two semver strings (e.g. "1.1.0" vs "1.0.9", "v1.2.0" vs "1.1.0").
 * Returns 1 if v1 > v2, -1 if v1 < v2, and 0 if equal.
 */
export function compareSemver(v1: string, v2: string): number {
  const clean1 = (v1 || '').trim().replace(/^v/i, '');
  const clean2 = (v2 || '').trim().replace(/^v/i, '');

  const parts1 = clean1.split(/[.-]/).map((p) => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  const parts2 = clean2.split(/[.-]/).map((p) => {
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

/**
 * Format bytes into Arabic megabyte format e.g. "25.0 ميجابايت".
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} ميجابايت`;
}

/**
 * Checks GitHub Releases API for new releases.
 */
export async function checkForAppUpdates(options?: {
  force?: boolean;
  repo?: string;
}): Promise<CheckUpdateResult> {
  const repo = options?.repo || DEFAULT_GITHUB_REPO;
  const force = options?.force || false;

  if (!force) {
    const lastCheckStr = safeGetItem(LAST_CHECK_KEY);
    if (lastCheckStr) {
      const lastCheckTime = parseInt(lastCheckStr, 10);
      if (!isNaN(lastCheckTime) && Date.now() - lastCheckTime < CHECK_INTERVAL_MS) {
        return { hasUpdate: false, latestRelease: null };
      }
    }
  }

  try {
    const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    safeSetItem(LAST_CHECK_KEY, String(Date.now()));

    if (!response.ok) {
      if (response.status === 404) {
        return {
          hasUpdate: false,
          latestRelease: null,
          error: 'لم يُنشر أي إصدار حتى الآن على المستودع',
        };
      }
      return {
        hasUpdate: false,
        latestRelease: null,
        error: `خطأ في الاتصال بالخادم (${response.status})`,
      };
    }

    const data = await response.json();
    if (!data || !data.tag_name) {
      return { hasUpdate: false, latestRelease: null };
    }

    const remoteVersion = (data.tag_name || '').trim().replace(/^v/i, '');
    const currentVersion = CURRENT_RELEASE.version;

    // Check APK asset
    let apkDownloadUrl: string | undefined;
    let apkFileName: string | undefined;
    let apkSizeFormatted: string | undefined;

    if (Array.isArray(data.assets)) {
      const apkAsset = data.assets.find(
        (a: any) => typeof a.name === 'string' && a.name.toLowerCase().endsWith('.apk')
      );
      if (apkAsset) {
        apkDownloadUrl = apkAsset.browser_download_url;
        apkFileName = apkAsset.name;
        if (typeof apkAsset.size === 'number') {
          apkSizeFormatted = formatFileSize(apkAsset.size);
        }
      }
    }

    const latestRelease: AppReleaseInfo = {
      version: remoteVersion,
      title: data.name || `تحديث ${remoteVersion}`,
      releaseNotes: data.body || '',
      publishedAt: data.published_at || new Date().toISOString(),
      htmlUrl: data.html_url || `https://github.com/${repo}/releases`,
      apkDownloadUrl,
      apkFileName,
      apkSizeFormatted,
    };

    const isNewer = compareSemver(remoteVersion, currentVersion) > 0;

    return {
      hasUpdate: isNewer,
      latestRelease,
    };
  } catch (err: any) {
    console.warn('[UpdateChecker] Network or parse failure:', err);
    return {
      hasUpdate: false,
      latestRelease: null,
      error: 'تعذر الاتصال بخدمة التحقق من التحديثات',
    };
  }
}
