/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { toArabicNumbers } from '../../utils/hijri';
import { AppSettings, PrayerTimes } from '../../types';

interface WidgetSvgParams {
  widgetType: 'custom' | 'timeline' | 'grid' | 'teal' | 'analog' | 'compact' | 'dhikr' | 'qibla' | 'calendar';
  widgetTheme: 'green' | 'gold' | 'glass' | 'dark-blue' | 'amber' | 'onyx';
  settings: AppSettings;
  prayerTimes: PrayerTimes | Record<string, string>;
  currentPrayer: string;
  nextPrayer: string;
  timeRemainingStr: string;
  currentDayDigit: number;
  currentMonthName: string;
  currentYear: number;
  dayNameArabic: string;
  gregorianStr: string;
  hrDeg: number;
  minDeg: number;
  secDeg: number;
  getArabicName: (p: string) => string;
}

export function generateWidgetSvg({
  widgetType,
  widgetTheme,
  settings,
  prayerTimes,
  currentPrayer,
  nextPrayer,
  timeRemainingStr,
  currentDayDigit,
  currentMonthName,
  currentYear,
  dayNameArabic,
  gregorianStr,
  hrDeg,
  minDeg,
  secDeg,
  getArabicName
}: WidgetSvgParams): string {
  const width = 400;
  const height = 220;

  let bgGradient = '';
  let borderStroke = '';
  let textPrimary = '';
  let textAccent = '';

  if (widgetType === 'teal') {
    bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#029587" /><stop offset="50%" stop-color="#05ab95" /><stop offset="100%" stop-color="#0ea185" /></linearGradient>';
    borderStroke = '#14b8a6';
    textPrimary = '#ffffff';
    textAccent = '#f59e0b';
  } else {
    switch (widgetTheme) {
      case 'green':
        bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#022c22" /><stop offset="100%" stop-color="#115e59" /></linearGradient>';
        borderStroke = '#10b981';
        textPrimary = '#ffffff';
        textAccent = '#10b981';
        break;
      case 'gold':
        bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#1c1917" /><stop offset="100%" stop-color="#451a03" /></linearGradient>';
        borderStroke = '#f59e0b';
        textPrimary = '#fef3c7';
        textAccent = '#f59e0b';
        break;
      case 'glass':
        bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#334155" stop-opacity="0.8" /><stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" /></linearGradient>';
        borderStroke = '#94a3b8';
        textPrimary = '#f8fafc';
        textAccent = '#38bdf8';
        break;
      case 'amber':
        bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2d1706" /><stop offset="50%" stop-color="#452309" /><stop offset="100%" stop-color="#1c0f04" /></linearGradient>';
        borderStroke = '#d97706';
        textPrimary = '#fef3c7';
        textAccent = '#fbbf24';
        break;
      case 'onyx':
        bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#090d12" /><stop offset="100%" stop-color="#111823" /></linearGradient>';
        borderStroke = '#334155';
        textPrimary = '#f1f5f9';
        textAccent = '#94a3b8';
        break;
      case 'dark-blue':
      default:
        bgGradient = '<linearGradient id="widgetGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0c1826" /><stop offset="100%" stop-color="#112236" /></linearGradient>';
        borderStroke = '#1e3a8a';
        textPrimary = '#ffffff';
        textAccent = '#60a5fa';
        break;
    }
  }

  const startSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" dir="rtl">
      <defs>
        ${bgGradient}
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.4" />
        </filter>
      </defs>
      
      <!-- Outer Card Surface -->
      <rect x="5" y="5" width="${width - 10}" height="${height - 10}" rx="28" fill="url(#widgetGrad)" stroke="${borderStroke}" stroke-width="1.5" filter="url(#shadow)" />
  `;

  const endSvg = `</svg>`;

  let svgContent = '';

  if (widgetType === 'timeline' || widgetType === 'custom') {
    const timelinePrayers = [
      { name: 'الفجر', time: prayerTimes.Fajr || '٠٤:٣٠', key: 'Fajr' },
      { name: 'الظهر', time: prayerTimes.Dhuhr || '١٢:١٥', key: 'Dhuhr' },
      { name: 'العصر', time: prayerTimes.Asr || '١٥:٤٥', key: 'Asr' },
      { name: 'المغرب', time: prayerTimes.Maghrib || '١٩:٠٢', key: 'Maghrib' },
      { name: 'العشاء', time: prayerTimes.Isha || '٢٠:٣٥', key: 'Isha' }
    ];

    let timelineDots = '';
    const startX = 65;
    const endX = 335;
    const step = (endX - startX) / (timelinePrayers.length - 1);

    timelinePrayers.forEach((p, idx) => {
      const x = startX + idx * step;
      const isActive = currentPrayer === p.key;
      const dotColor = isActive ? '#fbbf24' : '#ffffff';
      const opacVal = isActive ? '1' : '0.4';
      timelineDots += `
        <circle cx="${x}" cy="130" r="${isActive ? '8' : '5'}" fill="${dotColor}" />
        ${isActive ? `<circle cx="${x}" cy="130" r="12" fill="none" stroke="#fbbf24" stroke-width="1" opacity="0.6" />` : ''}
        <text x="${x}" y="160" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" opacity="${opacVal}">${p.name}</text>
        <text x="${x}" y="180" fill="${isActive ? '#fbbf24' : textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="900" text-anchor="middle" opacity="${isActive ? '1' : '0.5'}">${toArabicNumbers(p.time)}</text>
      `;
    });

    svgContent = `
      <!-- Header -->
      <rect x="25" y="25" width="40" height="40" rx="10" fill="#fbbf24" />
      <text x="45" y="44" fill="#1e293b" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="middle">${toArabicNumbers(currentDayDigit)}</text>
      <text x="45" y="56" fill="#1e293b" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${currentMonthName}</text>
      
      <text x="80" y="38" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="start">${dayNameArabic}</text>
      <text x="80" y="54" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="500" text-anchor="start" opacity="0.6">${toArabicNumbers(gregorianStr.split(' ').slice(0, 3).join(' '))}</text>
      
      <!-- Countdown -->
      <text x="375" y="38" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end" opacity="0.5">متبقي للأذان</text>
      <text x="375" y="58" fill="#fbbf24" font-family="monospace, system-ui" font-size="18" font-weight="900" text-anchor="end">-${toArabicNumbers(timeRemainingStr)}</text>
      
      <!-- Line divider -->
      <line x1="25" y1="80" x2="375" y2="80" stroke="${textPrimary}" stroke-width="1" opacity="0.1" />
      
      <!-- Timeline track line -->
      <line x1="50" y1="130" x2="350" y2="130" stroke="${textPrimary}" stroke-width="2" opacity="0.2" />
      
      <!-- Dots and text -->
      ${timelineDots}
    `;
  } else if (widgetType === 'teal') {
    svgContent = `
      <path d="M 20 220 L 20 180 Q 25 180 30 170 Q 30 150 45 150 Q 60 150 60 170 Q 65 180 70 180 L 70 220 Z" fill="#ffffff" opacity="0.08" />
      <path d="M 330 220 L 330 170 L 340 120 L 350 170 L 350 220 Z" fill="#ffffff" opacity="0.08" />
      <circle cx="340" cy="115" r="4" fill="#ffffff" opacity="0.08" />

      <!-- Header -->
      <text x="25" y="40" fill="#ccfbf1" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="start">📍 ${settings.cityName || 'الإسكندرية'}</text>
      <text x="375" y="40" fill="#ccfbf1" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="end">${toArabicNumbers(currentDayDigit)} ${currentMonthName} ${toArabicNumbers(currentYear)}هـ</text>
      
      <line x1="25" y1="55" x2="375" y2="55" stroke="#ffffff" stroke-width="1" opacity="0.15" />
      
      <!-- Center core content -->
      <text x="25" y="90" fill="#ccfbf1" font-family="system-ui, sans-serif" font-size="12" font-weight="bold" text-anchor="start" opacity="0.8">الأذان القادم</text>
      <text x="25" y="125" fill="#ffffff" font-family="system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="start">صلاة ${getArabicName(nextPrayer)}</text>
      
      <text x="375" y="120" fill="#fcd34d" font-family="monospace, system-ui" font-size="34" font-weight="900" text-anchor="end">${toArabicNumbers(timeRemainingStr)}</text>
      
      <!-- Mini-table of prayers -->
      <rect x="25" y="155" width="350" height="40" rx="10" fill="#000000" fill-opacity="0.15" />
      <g transform="translate(10, 0)">
        <text x="45" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">الفجر</text>
        <text x="45" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Fajr || '٠٤:٣٠')}</text>
        
        <text x="115" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">الظهر</text>
        <text x="115" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Dhuhr || '١٢:١٥')}</text>
        
        <text x="185" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">العصر</text>
        <text x="185" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Asr || '١٥:٤٥')}</text>
        
        <text x="255" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">المغرب</text>
        <text x="255" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Maghrib || '١٩:٠٢')}</text>
        
        <text x="325" y="172" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" text-anchor="middle" opacity="0.6">العشاء</text>
        <text x="325" y="187" fill="#ffffff" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Isha || '٢٠:٣٥')}</text>
      </g>
    `;
  } else if (widgetType === 'analog') {
    svgContent = `
      <circle cx="100" cy="110" r="75" fill="#0c1a2c" stroke="${borderStroke}" stroke-width="3" />
      <circle cx="100" cy="110" r="71" fill="none" stroke="#ffffff" stroke-dasharray="2, 5" stroke-width="1" opacity="0.1" />
      
      <g transform="translate(100, 110)">
        <line x1="0" y1="0" x2="0" y2="-40" stroke="#ffffff" stroke-width="4.5" stroke-linecap="round" transform="rotate(${hrDeg})" />
        <line x1="0" y1="0" x2="0" y2="-60" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" transform="rotate(${minDeg})" />
        <line x1="0" y1="10" x2="0" y2="-65" stroke="#ef4444" stroke-width="1" stroke-linecap="round" transform="rotate(${secDeg})" />
        <circle cx="0" cy="0" r="5" fill="#ef4444" />
        <circle cx="0" cy="0" r="1.5" fill="#ffffff" />
      </g>
      
      <text x="100" y="51" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="9" font-weight="900" text-anchor="middle" opacity="0.5">١٢</text>
      <text x="163" y="113" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="9" font-weight="900" text-anchor="middle" opacity="0.5">٣</text>
      <text x="100" y="174" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="9" font-weight="900" text-anchor="middle" opacity="0.5">٦</text>
      <text x="37" y="113" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="9" font-weight="900" text-anchor="middle" opacity="0.5">٩</text>

      <text x="210" y="55" fill="${textAccent}" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="start">ساعة الصلاة الذكية 🕰️</text>
      <text x="210" y="85" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="start">صلاة ${getArabicName(nextPrayer)}</text>
      <text x="210" y="110" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="start" opacity="0.5">متبقي للأذان:</text>
      <text x="210" y="145" fill="#fbbf24" font-family="monospace, system-ui" font-size="28" font-weight="900" text-anchor="start">${toArabicNumbers(timeRemainingStr)}</text>
      
      <text x="210" y="185" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="start" opacity="0.4">📍 ${settings.cityName || 'الإسكندرية'} • هِمَّتِي</text>
    `;
  } else if (widgetType === 'grid') {
    const gTimes = [
      { name: 'الفجر', val: prayerTimes.Fajr || '٠٤:٣٠', key: 'Fajr' },
      { name: 'الشروق', val: prayerTimes.Sunrise || '٠٦:٠٨', key: 'Sunrise' },
      { name: 'الظهر', val: prayerTimes.Dhuhr || '١٢:١٥', key: 'Dhuhr' },
      { name: 'العصر', val: prayerTimes.Asr || '١٥:٤٥', key: 'Asr' },
      { name: 'المغرب', val: prayerTimes.Maghrib || '١٩:٠٢', key: 'Maghrib' },
      { name: 'العشاء', val: prayerTimes.Isha || '٢٠:٣٥', key: 'Isha' }
    ];

    let gridBlocks = '';
    gTimes.forEach((p, idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;
      const x = 25 + col * 120;
      const y = 80 + row * 60;
      const isActive = currentPrayer === p.key;

      gridBlocks += `
        <rect x="${x}" y="${y}" width="110" height="50" rx="12" fill="#ffffff" fill-opacity="${isActive ? '0.12' : '0.03'}" stroke="${isActive ? '#fbbf24' : 'none'}" stroke-width="1" />
        <text x="${x + 55}" y="${y + 22}" fill="${isActive ? '#fbbf24' : textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${p.name}</text>
        <text x="${x + 55}" y="${y + 38}" fill="${isActive ? '#ffffff' : textPrimary}" font-family="monospace, system-ui" font-size="11" font-weight="900" text-anchor="middle" opacity="${isActive ? '1' : '0.5'}">${toArabicNumbers(p.val)}</text>
      `;
    });

    svgContent = `
      <text x="25" y="40" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="start">${dayNameArabic} • ${toArabicNumbers(currentDayDigit)} ${currentMonthName}</text>
      <text x="375" y="40" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end">📍 ${settings.cityName || 'الإسكندرية'}</text>
      
      <line x1="25" y1="55" x2="375" y2="55" stroke="${textPrimary}" stroke-width="1" opacity="0.1" />
      
      ${gridBlocks}
    `;
  } else if (widgetType === 'compact') {
    const compactCountdown = () => {
      const parts = timeRemainingStr.split(':');
      if (parts.length < 3) return timeRemainingStr;
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      return `${toArabicNumbers(h)} س ${toArabicNumbers(m)} د`;
    };

    svgContent = `
      <rect x="25" y="80" width="350" height="60" rx="30" fill="#000000" fill-opacity="0.2" stroke="${borderStroke}" stroke-width="1" />
      <circle cx="55" cy="110" r="5" fill="#10b981" />
      <text x="75" y="115" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="start">${getArabicName(currentPrayer)} ${compactCountdown()}</text>
      
      <text x="345" y="114" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="end">📍 ${settings.cityName || 'مكة المكرمة'}</text>
    `;
  } else if (widgetType === 'dhikr') {
    svgContent = `
      <text x="25" y="40" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="12" font-weight="900" text-anchor="start">✨ ذكر اليوم والبركة</text>
      <text x="375" y="40" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end" opacity="0.6">${dayNameArabic}</text>
      <line x1="25" y1="55" x2="375" y2="55" stroke="${textPrimary}" stroke-width="1" opacity="0.1" />
      
      <text x="200" y="105" fill="#fef3c7" font-family="Traditional Arabic, serif" font-size="16" font-weight="bold" text-anchor="middle">«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ»</text>
      
      <rect x="130" y="130" width="140" height="36" rx="18" fill="#f59e0b" />
      <text x="200" y="152" fill="#0f172a" font-family="system-ui, sans-serif" font-size="12" font-weight="900" text-anchor="middle">📿 تسبيحة البركة</text>
      
      <text x="25" y="195" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="start" opacity="0.5">الصلاة القادمة: ${getArabicName(nextPrayer)}</text>
      <text x="375" y="195" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end" opacity="0.5">📍 ${settings.cityName || 'مكة المكرمة'}</text>
    `;
  } else if (widgetType === 'qibla') {
    svgContent = `
      <circle cx="80" cy="110" r="50" fill="#0f172a" stroke="#f59e0b" stroke-width="2" />
      <text x="80" y="108" fill="#f59e0b" font-family="system-ui" font-size="20" text-anchor="middle">🕌</text>
      <text x="80" y="125" fill="#f59e0b" font-family="monospace" font-size="10" font-weight="900" text-anchor="middle">١٣٦°</text>
      
      <text x="150" y="80" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="11" font-weight="900" text-anchor="start">بوصلة القبلة المباشرة</text>
      <text x="150" y="110" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="start">اتجاه الكعبة المشرفة</text>
      <text x="150" y="135" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="start" opacity="0.6">موقعك: ${settings.cityName || 'الإسكندرية'}</text>
      
      <rect x="150" y="155" width="225" height="35" rx="10" fill="#000000" fill-opacity="0.2" />
      <text x="165" y="176" fill="${textPrimary}" font-family="system-ui" font-size="10" opacity="0.7">الأذان القادم:</text>
      <text x="360" y="177" fill="#f59e0b" font-family="monospace" font-size="14" font-weight="900" text-anchor="end">${toArabicNumbers(timeRemainingStr)}</text>
    `;
  } else if (widgetType === 'calendar') {
    svgContent = `
      <rect x="25" y="25" width="45" height="45" rx="10" fill="#10b981" />
      <text x="47" y="48" fill="#ffffff" font-family="system-ui" font-size="16" font-weight="900" text-anchor="middle">${toArabicNumbers(currentDayDigit)}</text>
      <text x="47" y="62" fill="#ffffff" font-family="system-ui" font-size="9" font-weight="bold" text-anchor="middle">${currentMonthName}</text>
      
      <text x="80" y="42" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="14" font-weight="900" text-anchor="start">${dayNameArabic}</text>
      <text x="80" y="60" fill="#f59e0b" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" text-anchor="start">${toArabicNumbers(currentYear)} هجرية</text>
      
      <rect x="280" y="30" width="95" height="30" rx="8" fill="#ffffff" fill-opacity="0.1" />
      <text x="327" y="49" fill="#ffffff" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="middle">مستحب الصيام 🌙</text>
      
      <line x1="25" y1="85" x2="375" y2="85" stroke="${textPrimary}" stroke-width="1" opacity="0.1" />
      
      <text x="50" y="120" fill="${textPrimary}" font-family="system-ui" font-size="10" text-anchor="middle">الظهر</text>
      <text x="50" y="140" fill="${textPrimary}" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Dhuhr || '١٢:١٥')}</text>
      
      <text x="150" y="120" fill="${textPrimary}" font-family="system-ui" font-size="10" text-anchor="middle">العصر</text>
      <text x="150" y="140" fill="${textPrimary}" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Asr || '١٥:٤٥')}</text>
      
      <text x="250" y="120" fill="#f59e0b" font-family="system-ui" font-size="10" font-weight="bold" text-anchor="middle">المغرب</text>
      <text x="250" y="140" fill="#f59e0b" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Maghrib || '١٩:٠٢')}</text>
      
      <text x="350" y="120" fill="${textPrimary}" font-family="system-ui" font-size="10" text-anchor="middle">العشاء</text>
      <text x="350" y="140" fill="${textPrimary}" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">${toArabicNumbers(prayerTimes.Isha || '٢٠:٣٥')}</text>
      
      <text x="25" y="195" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="start" opacity="0.4">📍 ${settings.cityName || 'مصر'}</text>
      <text x="375" y="195" fill="${textPrimary}" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" text-anchor="end" opacity="0.4">${toArabicNumbers(gregorianStr)}</text>
    `;
  }

  return startSvg + svgContent + endSvg;
}
