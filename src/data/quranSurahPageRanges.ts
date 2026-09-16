/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SurahPageRange {
  number: number;
  name: string;
  startPage: number;
  endPage: number;
}

/**
 * Standard Madani Mushaf (604 pages) Surah start and end page mappings.
 */
export const SURAH_PAGE_RANGES: SurahPageRange[] = [
  { number: 1, name: 'الفاتحة', startPage: 1, endPage: 1 },
  { number: 2, name: 'البقرة', startPage: 2, endPage: 49 },
  { number: 3, name: 'آل عمران', startPage: 50, endPage: 76 },
  { number: 4, name: 'النساء', startPage: 77, endPage: 106 },
  { number: 5, name: 'المائدة', startPage: 106, endPage: 127 },
  { number: 6, name: 'الأنعام', startPage: 128, endPage: 150 },
  { number: 7, name: 'الأعراف', startPage: 151, endPage: 176 },
  { number: 8, name: 'الأنفال', startPage: 177, endPage: 186 },
  { number: 9, name: 'التوبة', startPage: 187, endPage: 207 },
  { number: 10, name: 'يونس', startPage: 208, endPage: 221 },
  { number: 11, name: 'هود', startPage: 221, endPage: 235 },
  { number: 12, name: 'يوسف', startPage: 235, endPage: 248 },
  { number: 13, name: 'الرعد', startPage: 249, endPage: 255 },
  { number: 14, name: 'إبراهيم', startPage: 255, endPage: 261 },
  { number: 15, name: 'الحجر', startPage: 262, endPage: 267 },
  { number: 16, name: 'النحل', startPage: 267, endPage: 281 },
  { number: 17, name: 'الإسراء', startPage: 282, endPage: 293 },
  { number: 18, name: 'الكهف', startPage: 293, endPage: 304 },
  { number: 19, name: 'مريم', startPage: 305, endPage: 312 },
  { number: 20, name: 'طه', startPage: 312, endPage: 321 },
  { number: 21, name: 'الأنبياء', startPage: 322, endPage: 331 },
  { number: 22, name: 'الحج', startPage: 332, endPage: 341 },
  { number: 23, name: 'المؤمنون', startPage: 342, endPage: 349 },
  { number: 24, name: 'النور', startPage: 350, endPage: 359 },
  { number: 25, name: 'الفرقان', startPage: 359, endPage: 366 },
  { number: 26, name: 'الشعراء', startPage: 367, endPage: 376 },
  { number: 27, name: 'النمل', startPage: 377, endPage: 385 },
  { number: 28, name: 'القصص', startPage: 385, endPage: 396 },
  { number: 29, name: 'العنكبوت', startPage: 396, endPage: 404 },
  { number: 30, name: 'الروم', startPage: 404, endPage: 410 },
  { number: 31, name: 'لقمان', startPage: 411, endPage: 414 },
  { number: 32, name: 'السجدة', startPage: 415, endPage: 417 },
  { number: 33, name: 'الأحزاب', startPage: 418, endPage: 427 },
  { number: 34, name: 'سبأ', startPage: 428, endPage: 434 },
  { number: 35, name: 'فاطر', startPage: 434, endPage: 440 },
  { number: 36, name: 'يس', startPage: 440, endPage: 445 },
  { number: 37, name: 'الصافات', startPage: 446, endPage: 452 },
  { number: 38, name: 'ص', startPage: 453, endPage: 458 },
  { number: 39, name: 'الزمر', startPage: 458, endPage: 467 },
  { number: 40, name: 'غافر', startPage: 467, endPage: 476 },
  { number: 41, name: 'فصلت', startPage: 477, endPage: 482 },
  { number: 42, name: 'الشورى', startPage: 483, endPage: 489 },
  { number: 43, name: 'الزخرف', startPage: 489, endPage: 495 },
  { number: 44, name: 'الدخان', startPage: 496, endPage: 498 },
  { number: 45, name: 'الجاثية', startPage: 499, endPage: 502 },
  { number: 46, name: 'الأحقاف', startPage: 502, endPage: 506 },
  { number: 47, name: 'محمد', startPage: 507, endPage: 510 },
  { number: 48, name: 'الفتح', startPage: 511, endPage: 515 },
  { number: 49, name: 'الحجرات', startPage: 515, endPage: 517 },
  { number: 50, name: 'ق', startPage: 518, endPage: 520 },
  { number: 51, name: 'الذاريات', startPage: 520, endPage: 523 },
  { number: 52, name: 'الطور', startPage: 523, endPage: 525 },
  { number: 53, name: 'النجم', startPage: 526, endPage: 528 },
  { number: 54, name: 'القمر', startPage: 528, endPage: 531 },
  { number: 55, name: 'الرحمن', startPage: 531, endPage: 534 },
  { number: 56, name: 'الواقعة', startPage: 534, endPage: 537 },
  { number: 57, name: 'الحديد', startPage: 537, endPage: 541 },
  { number: 58, name: 'المجادلة', startPage: 542, endPage: 545 },
  { number: 59, name: 'الحشر', startPage: 545, endPage: 548 },
  { number: 60, name: 'الممتحنة', startPage: 549, endPage: 551 },
  { number: 61, name: 'الصف', startPage: 551, endPage: 552 },
  { number: 62, name: 'الجمعة', startPage: 553, endPage: 554 },
  { number: 63, name: 'المنافقون', startPage: 554, endPage: 555 },
  { number: 64, name: 'التغابن', startPage: 556, endPage: 557 },
  { number: 65, name: 'الطلاق', startPage: 558, endPage: 559 },
  { number: 66, name: 'التحريم', startPage: 560, endPage: 561 },
  { number: 67, name: 'الملك', startPage: 562, endPage: 564 },
  { number: 68, name: 'القلم', startPage: 564, endPage: 566 },
  { number: 69, name: 'الحاقة', startPage: 566, endPage: 568 },
  { number: 70, name: 'المعارج', startPage: 568, endPage: 570 },
  { number: 71, name: 'نوح', startPage: 570, endPage: 571 },
  { number: 72, name: 'الجن', startPage: 572, endPage: 573 },
  { number: 73, name: 'المزمل', startPage: 574, endPage: 575 },
  { number: 74, name: 'المدثر', startPage: 575, endPage: 577 },
  { number: 75, name: 'القيامة', startPage: 577, endPage: 578 },
  { number: 76, name: 'الإنسان', startPage: 578, endPage: 580 },
  { number: 77, name: 'المرسلات', startPage: 580, endPage: 581 },
  { number: 78, name: 'النبأ', startPage: 582, endPage: 583 },
  { number: 79, name: 'النازعات', startPage: 583, endPage: 584 },
  { number: 80, name: 'عبس', startPage: 585, endPage: 586 },
  { number: 81, name: 'التكوير', startPage: 586, endPage: 586 },
  { number: 82, name: 'الانفطار', startPage: 587, endPage: 587 },
  { number: 83, name: 'المطففين', startPage: 587, endPage: 589 },
  { number: 84, name: 'الانشقاق', startPage: 589, endPage: 590 },
  { number: 85, name: 'البروج', startPage: 590, endPage: 590 },
  { number: 86, name: 'الطارق', startPage: 591, endPage: 591 },
  { number: 87, name: 'الأعلى', startPage: 591, endPage: 592 },
  { number: 88, name: 'الغاشية', startPage: 592, endPage: 593 },
  { number: 89, name: 'الفجر', startPage: 593, endPage: 594 },
  { number: 90, name: 'البلد', startPage: 594, endPage: 595 },
  { number: 91, name: 'الشمس', startPage: 595, endPage: 595 },
  { number: 92, name: 'الليل', startPage: 595, endPage: 596 },
  { number: 93, name: 'الضحى', startPage: 596, endPage: 596 },
  { number: 94, name: 'الشرح', startPage: 596, endPage: 597 },
  { number: 95, name: 'التين', startPage: 597, endPage: 597 },
  { number: 96, name: 'العلق', startPage: 597, endPage: 598 },
  { number: 97, name: 'القدر', startPage: 598, endPage: 598 },
  { number: 98, name: 'البينة', startPage: 598, endPage: 599 },
  { number: 99, name: 'الزلزلة', startPage: 599, endPage: 599 },
  { number: 100, name: 'العاديات', startPage: 599, endPage: 600 },
  { number: 101, name: 'القارعة', startPage: 600, endPage: 600 },
  { number: 102, name: 'التكاثر', startPage: 600, endPage: 600 },
  { number: 103, name: 'العصر', startPage: 601, endPage: 601 },
  { number: 104, name: 'الهمزة', startPage: 601, endPage: 601 },
  { number: 105, name: 'الفيل', startPage: 601, endPage: 601 },
  { number: 106, name: 'قريش', startPage: 602, endPage: 602 },
  { number: 107, name: 'الماعون', startPage: 602, endPage: 602 },
  { number: 108, name: 'الكوثر', startPage: 602, endPage: 602 },
  { number: 109, name: 'الكافرون', startPage: 603, endPage: 603 },
  { number: 110, name: 'النصر', startPage: 603, endPage: 603 },
  { number: 111, name: 'المسد', startPage: 603, endPage: 603 },
  { number: 112, name: 'الإخلاص', startPage: 604, endPage: 604 },
  { number: 113, name: 'الفلق', startPage: 604, endPage: 604 },
  { number: 114, name: 'الناس', startPage: 604, endPage: 604 },
];

/**
 * Returns the primary Surah name corresponding to a given page number.
 */
export function getSurahForPage(page: number): string {
  const normalizedPage = Math.max(1, Math.min(604, page));
  const found = SURAH_PAGE_RANGES.find(
    (s) => normalizedPage >= s.startPage && normalizedPage <= s.endPage
  );
  return found ? found.name : 'القرآن الكريم';
}
