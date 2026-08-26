/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, Filter, BookOpen, Share2, Trash2 } from 'lucide-react';
import ExpandableCard from './ExpandableCard';
import VerseCardMaker from './VerseCardMaker';
import { QuranSession } from '../../types';
import { getHijriDate, toArabicNumbers } from '../../utils/hijri';

interface QuranHistoryTabProps {
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
}

export default function QuranHistoryTab({
  quranSessions,
  setQuranSessions,
}: QuranHistoryTabProps) {
  const [filterType, setFilterType] = useState<'all' | 'read' | 'memorize' | 'review'>('all');
  const [showVerseCardMaker, setShowVerseCardMaker] = useState(false);

  // Group sessions by date
  const filteredSessions = quranSessions.filter(s => {
    if (filterType === 'all') return true;
    return s.sessionType === filterType;
  });

  const groupedByDate: Record<string, QuranSession[]> = {};
  filteredSessions.forEach(s => {
    if (!groupedByDate[s.date]) groupedByDate[s.date] = [];
    groupedByDate[s.date].push(s);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  const handleDeleteSession = (id: string) => {
    setQuranSessions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-4 animate-fadeIn" dir="rtl">
      {/* FILTER BAR */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'all'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          الكل
        </button>

        <button
          type="button"
          onClick={() => setFilterType('read')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'read'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          📗 قراءة
        </button>

        <button
          type="button"
          onClick={() => setFilterType('memorize')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'memorize'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          📖 حفظ
        </button>

        <button
          type="button"
          onClick={() => setFilterType('review')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
            filterType === 'review'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
          }`}
        >
          📘 مراجعة
        </button>
      </div>

      {/* DAILY LOG CARDS */}
      {sortedDates.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 text-xs">
          لا توجد جلسات مسجلة في السجل لهذا الفلتر بعد.
        </div>
      ) : (
        sortedDates.map((dateStr, idx) => {
          const sessions = groupedByDate[dateStr];
          const dateObj = new Date(dateStr);
          const hijri = getHijriDate(dateObj);

          // Summarize day
          const readCount = sessions.filter(s => s.sessionType === 'read').reduce((a, b) => a + Math.max(0, b.unitValue), 0);
          const memoCount = sessions.filter(s => s.sessionType === 'memorize').reduce((a, b) => a + Math.max(0, b.unitValue), 0);
          const reviewCount = sessions.filter(s => s.sessionType === 'review').reduce((a, b) => a + Math.max(0, b.unitValue), 0);

          const summaryParts: string[] = [];
          if (readCount > 0) summaryParts.push(`📗 قراءة: ${toArabicNumbers(readCount)} صفحة`);
          if (memoCount > 0) summaryParts.push(`📖 حفظ: ${toArabicNumbers(memoCount)} unit`);
          if (reviewCount > 0) summaryParts.push(`📘 مراجعة: ${toArabicNumbers(reviewCount)} unit`);

          return (
            <ExpandableCard
              key={dateStr}
              defaultExpanded={idx === 0}
              title={hijri.fullString}
              subtitle={summaryParts.join(' · ') || 'نشاط قرآني'}
              icon={<Calendar className="w-4 h-4 text-emerald-600" />}
            >
              <div className="space-y-2 pt-1 divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map(s => (
                  <div key={s.id} className="pt-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {s.sessionType === 'read' ? '📗 قراءة' : s.sessionType === 'memorize' ? '📖 حفظ جديد' : '📘 مراجعة'}:
                      </span>
                      <span>
                        {toArabicNumbers(s.unitValue)} {s.unitType === 'pages' ? 'صفحة' : s.unitType === 'verses' ? 'آية' : 'جزء'}
                        {s.surahOrJuzName ? ` (${s.surahOrJuzName})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {(s.sessionType === 'memorize' || s.sessionType === 'review') && (
                        <button
                          type="button"
                          onClick={() => setShowVerseCardMaker(true)}
                          className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>بطاقة</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteSession(s.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="حذف الجلسة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableCard>
          );
        })
      )}

      {/* VERSE CARD MAKER MODAL */}
      {showVerseCardMaker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-5 shadow-xl my-auto animate-fadeIn">
            <VerseCardMaker
              onClose={() => setShowVerseCardMaker(false)}
              isModal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
