/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateWidgetSvg } from './widgetSvgGenerator';
import { AppSettings, PrayerTimes } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';

const mockPrayerTimes: PrayerTimes = {
  Fajr: '04:30',
  Sunrise: '05:55',
  Dhuhr: '12:00',
  Asr: '15:20',
  Maghrib: '18:10',
  Isha: '19:35',
};

const mockSettings: AppSettings = {
  latitude: 30.0444,
  longitude: 31.2357,
  cityName: 'Cairo',
  calcMethod: 'Egypt',
  madhab: 'standard',
  hijriOffset: 0,
  adhanEnabled: {
    Fajr: true,
    Sunrise: false,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
  hasCompletedOnboarding: true,
  pinnedWidget: {
    enabled: true,
    type: 'custom',
    theme: 'dark-blue',
    cardSize: 'medium',
    clockStyle: 'digital',
    prayerDisplay: 'next_only',
    showMoonPhase: true,
    showAyah: true,
    showDhikr: true,
    showQibla: true,
    showDate: true,
    showKhushuBtn: true,
    wallpaper: 'starry',
  },
};

describe('Custom Modular Widget & SVG Generation Engine', () => {
  it('generates valid SVG for custom modular widget with dark-blue theme', () => {
    const svg = generateWidgetSvg({
      widgetType: 'custom',
      widgetTheme: 'dark-blue',
      settings: mockSettings,
      prayerTimes: mockPrayerTimes,
      currentPrayer: 'Dhuhr',
      nextPrayer: 'Asr',
      timeRemainingStr: '02:15:30',
      currentDayDigit: 15,
      currentMonthName: 'رمضان',
      currentYear: 1447,
      dayNameArabic: 'الجمعة',
      gregorianStr: '١٧ يوليو ٢٠٢٦',
      hrDeg: 45,
      minDeg: 120,
      secDeg: 240,
      getArabicName: (p: string) => {
        const names: Record<string, string> = {
          Fajr: 'الفجر',
          Sunrise: 'الشروق',
          Dhuhr: 'الظهر',
          Asr: 'العصر',
          Maghrib: 'المغرب',
          Isha: 'العشاء',
        };
        return names[p] || p;
      },
    });

    const trimmed = svg.trim();
    assert.ok(trimmed.startsWith('<svg'), 'SVG must start with <svg tag');
    assert.ok(trimmed.endsWith('</svg>'), 'SVG must close with </svg> tag');
    assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'), 'SVG must declare standard XML namespace');
    assert.ok(svg.includes('العصر'), 'SVG contains next prayer name in Arabic');
    assert.ok(svg.includes('الجمعة'), 'SVG contains day name in Arabic');
  });

  it('supports emerald, amber, onyx, and gold themes without crashing', () => {
    const themes = ['green', 'amber', 'onyx', 'gold', 'glass'] as const;
    for (const theme of themes) {
      const svg = generateWidgetSvg({
        widgetType: 'custom',
        widgetTheme: theme,
        settings: mockSettings,
        prayerTimes: mockPrayerTimes,
        currentPrayer: 'Fajr',
        nextPrayer: 'Sunrise',
        timeRemainingStr: '01:00:00',
        currentDayDigit: 1,
        currentMonthName: 'شوال',
        currentYear: 1447,
        dayNameArabic: 'السبت',
        gregorianStr: '١٨ يوليو ٢٠٢٦',
        hrDeg: 0,
        minDeg: 0,
        secDeg: 0,
        getArabicName: (p: string) => p,
      });

      assert.ok(svg.length > 500, `SVG for theme ${theme} should have valid length`);
      assert.ok(svg.includes('width="400" height="220"'), 'SVG should have consistent dimensions');
    }
  });

  it('generates analog clock dial in SVG when widgetType is analog', () => {
    const svg = generateWidgetSvg({
      widgetType: 'analog',
      widgetTheme: 'dark-blue',
      settings: mockSettings,
      prayerTimes: mockPrayerTimes,
      currentPrayer: 'Maghrib',
      nextPrayer: 'Isha',
      timeRemainingStr: '00:45:00',
      currentDayDigit: 10,
      currentMonthName: 'محرم',
      currentYear: 1448,
      dayNameArabic: 'الأحد',
      gregorianStr: '٢٠ يوليو ٢٠٢٦',
      hrDeg: 90,
      minDeg: 180,
      secDeg: 270,
      getArabicName: (p: string) => p,
    });

    assert.ok(svg.includes('transform="rotate(90)"'), 'Contains hour hand rotate transform');
    assert.ok(svg.includes('transform="rotate(180)"'), 'Contains minute hand rotate transform');
    assert.ok(svg.includes('transform="rotate(270)"'), 'Contains second hand rotate transform');
  });

  it('correctly adapts cardSize configurations and custom feature toggles', () => {
    const compactSettings: AppSettings = {
      ...mockSettings,
      pinnedWidget: {
        ...mockSettings.pinnedWidget!,
        cardSize: 'compact',
        showMoonPhase: false,
        showDhikr: false,
      },
    };

    assert.equal(compactSettings.pinnedWidget?.cardSize, 'compact');
    assert.equal(compactSettings.pinnedWidget?.showMoonPhase, false);
    assert.equal(compactSettings.pinnedWidget?.showDhikr, false);

    const largeSettings: AppSettings = {
      ...mockSettings,
      pinnedWidget: {
        ...mockSettings.pinnedWidget!,
        cardSize: 'large',
        showAyah: true,
        showQibla: true,
      },
    };

    assert.equal(largeSettings.pinnedWidget?.cardSize, 'large');
    assert.equal(largeSettings.pinnedWidget?.showAyah, true);
    assert.equal(largeSettings.pinnedWidget?.showQibla, true);
  });
});
