import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  compareSemver,
  formatFileSize,
  checkForAppUpdates,
  DEFAULT_GITHUB_REPO,
} from './updateChecker';

describe('GitHub UpdateChecker Engine', () => {
  describe('compareSemver', () => {
    it('returns 1 when remote version is higher than local version', () => {
      assert.strictEqual(compareSemver('1.0.6', '1.0.5'), 1);
      assert.strictEqual(compareSemver('2.0.0', '1.9.9'), 1);
      assert.strictEqual(compareSemver('1.1.0', '1.0.9'), 1);
    });

    it('returns -1 when remote version is lower than local version', () => {
      assert.strictEqual(compareSemver('1.0.4', '1.0.5'), -1);
      assert.strictEqual(compareSemver('0.9.9', '1.0.0'), -1);
    });

    it('returns 0 when versions are equal', () => {
      assert.strictEqual(compareSemver('1.0.5', '1.0.5'), 0);
      assert.strictEqual(compareSemver('v1.0.5', '1.0.5'), 0);
      assert.strictEqual(compareSemver('1.0.5', 'v1.0.5'), 0);
    });

    it('gracefully handles v prefix and whitespace', () => {
      assert.strictEqual(compareSemver(' v1.0.7 ', '1.0.5'), 1);
      assert.strictEqual(compareSemver('v1.0.5', ' v1.0.5 '), 0);
    });

    it('handles differing segment counts', () => {
      assert.strictEqual(compareSemver('1.0.5.1', '1.0.5'), 1);
      assert.strictEqual(compareSemver('1.0', '1.0.0'), 0);
    });
  });

  describe('formatFileSize', () => {
    it('converts bytes to formatted Arabic megabytes', () => {
      const bytes = 25 * 1024 * 1024; // 25 MB
      assert.strictEqual(formatFileSize(bytes), '25.0 ميجابايت');
    });

    it('handles zero or negative byte inputs gracefully', () => {
      assert.strictEqual(formatFileSize(0), '');
      assert.strictEqual(formatFileSize(-50), '');
    });
  });

  describe('checkForAppUpdates API integration & mock handling', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      // Clear mock storage if present
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    });

    it('successfully parses newer release with APK download link', async () => {
      const fakeRelease = {
        tag_name: 'v1.0.9',
        name: 'هِمَّتِي - التحديث الرمضاني المبارك',
        body: '- إضافة ميزة مواقيت الإمساك\n- تحسين سرعة الويدجت',
        published_at: '2026-09-08T10:00:00Z',
        html_url: 'https://github.com/AhElnokaly/Salah-pro-Muslim-Companion/releases/tag/v1.0.9',
        assets: [
          {
            name: 'app-release-signed.apk',
            browser_download_url: 'https://github.com/downloads/app-release-signed.apk',
            size: 20 * 1024 * 1024,
          },
        ],
      };

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => fakeRelease,
      }) as unknown as Response;

      try {
        const result = await checkForAppUpdates({ force: true, repo: DEFAULT_GITHUB_REPO });
        assert.strictEqual(result.hasUpdate, true);
        assert.strictEqual(result.latestRelease?.version, '1.0.9');
        assert.strictEqual(result.latestRelease?.apkDownloadUrl, 'https://github.com/downloads/app-release-signed.apk');
        assert.strictEqual(result.latestRelease?.apkFileName, 'app-release-signed.apk');
        assert.strictEqual(result.latestRelease?.apkSizeFormatted, '20.0 ميجابايت');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('returns hasUpdate false when remote version matches or is older', async () => {
      const fakeRelease = {
        tag_name: 'v1.0.4',
        name: 'إصدار قديم',
        body: 'ملاحظات',
        assets: [],
      };

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => fakeRelease,
      }) as unknown as Response;

      try {
        const result = await checkForAppUpdates({ force: true });
        assert.strictEqual(result.hasUpdate, false);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('gracefully handles 404 when no releases are yet published', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 404,
      }) as unknown as Response;

      try {
        const result = await checkForAppUpdates({ force: true });
        assert.strictEqual(result.hasUpdate, false);
        assert.ok(result.error?.includes('لم يُنشر أي إصدار'));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
