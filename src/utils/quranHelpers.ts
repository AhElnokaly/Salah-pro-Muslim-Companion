/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { QuranKhatma, QuranSession } from '../types';
import { getHijriDate } from './hijri';

export function attributeKhatmaToHijriYear(
  khatma: QuranKhatma,
  sessions: QuranSession[]
): {
  hijriYear: number;
  needsUserChoice: boolean;
  pageShares: Array<{ year: number; pages: number; days: number }>;
} {
  const khatmaSessions = sessions.filter(s => s.khatmaId === khatma.id);
  const fallbackSessions = khatmaSessions.length > 0 ? khatmaSessions : sessions.filter(s => s.sessionType === 'read');

  if (fallbackSessions.length === 0) {
    const currentYear = getHijriDate(new Date()).year;
    return { hijriYear: currentYear, needsUserChoice: false, pageShares: [] };
  }

  const byYear: Record<number, QuranSession[]> = {};
  fallbackSessions.forEach(s => {
    const dateObj = new Date(s.date);
    const hYear = getHijriDate(dateObj).year;
    if (!byYear[hYear]) byYear[hYear] = [];
    byYear[hYear].push(s);
  });

  const years = Object.keys(byYear).map(Number);
  if (years.length === 1) {
    return { hijriYear: years[0], needsUserChoice: false, pageShares: [{ year: years[0], pages: 604, days: 1 }] };
  }

  const totalPages = fallbackSessions.reduce((sum, s) => sum + Math.max(0, s.unitValue), 0);

  const pageShares = years.map(y => {
    const ySessions = byYear[y];
    const pages = ySessions.reduce((sum, s) => sum + Math.max(0, s.unitValue), 0);
    const distinctDays = new Set(ySessions.map(s => s.date)).size;
    return { year: y, pages, days: distinctDays };
  });

  const majority = pageShares.find(p => totalPages > 0 && (p.pages / totalPages) >= 0.5);
  if (majority) {
    return { hijriYear: majority.year, needsUserChoice: false, pageShares };
  }

  const sortedByDays = [...pageShares].sort((a, b) => b.days - a.days);
  if (sortedByDays.length >= 2 && sortedByDays[0].days === sortedByDays[1].days) {
    return { hijriYear: sortedByDays[0].year, needsUserChoice: true, pageShares };
  }

  return { hijriYear: sortedByDays[0].year, needsUserChoice: false, pageShares };
}
