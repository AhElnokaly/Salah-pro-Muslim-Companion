/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Book, 
  Plus, 
  Trash2, 
  PlusCircle, 
  BookOpen, 
  Award, 
  Compass, 
  Check, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { QuranKhatma, QuranSession } from '../types';
import { toArabicNumbers, formatArabicDayCount } from '../utils/hijri';

interface QuranTrackerProps {
  khatmat: QuranKhatma[];
  setKhatmat: React.Dispatch<React.SetStateAction<QuranKhatma[]>>;
  quranSessions: QuranSession[];
  setQuranSessions: React.Dispatch<React.SetStateAction<QuranSession[]>>;
}

export default function QuranTracker({
  khatmat,
  setKhatmat,
  quranSessions,
  setQuranSessions,
}: QuranTrackerProps) {
  const [activeTab, setActiveTab] = useState<'khatma' | 'sessions'>('khatma');
  
  // States for creating a new Khatma
  const [showAddKhatma, setShowAddKhatma] = useState(false);
  const [khatmaName, setKhatmaName] = useState('ختمتي المباركة');
  const [durationDays, setDurationDays] = useState(30);
  
  // States for updating current page
  const [updatingKhatmaId, setUpdatingKhatmaId] = useState<string | null>(null);
  const [newPageVal, setNewPageVal] = useState<number>(0);
  
  // States for creating a new session
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionType, setSessionType] = useState<'read' | 'memorize' | 'review'>('read');
  const [unitType, setUnitType] = useState<'pages' | 'juz' | 'surah'>('pages');
  const [unitValue, setUnitValue] = useState<number>(5);

  const activeKhatma = khatmat.find(k => k.status === 'active');

  const handleCreateKhatma = (e: React.FormEvent) => {
    e.preventDefault();
    // Complete or archive any previous active khatmat
    const updatedKhatmat = khatmat.map(k => k.status === 'active' ? { ...k, status: 'completed' as const } : k);
    
    const finalDuration = isNaN(durationDays) || durationDays <= 0 ? 30 : durationDays;
    const newKhatma: QuranKhatma = {
      id: crypto.randomUUID(),
      name: khatmaName,
      startDate: new Date().toISOString().split('T')[0],
      durationDays: finalDuration,
      totalPages: 604,
      currentPage: 0,
      status: 'active'
    };

    setKhatmat([...updatedKhatmat, newKhatma]);
    setShowAddKhatma(false);
  };

  const handleUpdatePage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingKhatmaId) return;

    setKhatmat(prev => prev.map(k => {
      if (k.id === updatingKhatmaId) {
        const val = isNaN(newPageVal) ? k.currentPage : newPageVal;
        const page = Math.min(604, Math.max(0, val));
        const status = page >= 604 ? 'completed' : 'active';
        
        // Log a read session automatically as well!
        if (page > k.currentPage) {
          const loggedPages = page - k.currentPage;
          const newSession: QuranSession = {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            sessionType: 'read',
            khatmaId: k.id,
            unitType: 'pages',
            unitValue: loggedPages
          };
          setQuranSessions(prevSess => [newSession, ...prevSess]);
        }
        
        return {
          ...k,
          currentPage: page,
          status
        };
      }
      return k;
    }));

    setUpdatingKhatmaId(null);
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUnitValue = isNaN(unitValue) || unitValue <= 0 ? 1 : unitValue;
    const newSession: QuranSession = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      sessionType,
      unitType,
      unitValue: finalUnitValue,
      khatmaId: activeKhatma?.id
    };

    setQuranSessions([newSession, ...quranSessions]);
    setShowAddSession(false);
    
    // If we read pages and there is an active Khatma, advance the pages on the active Khatma too!
    if (sessionType === 'read' && unitType === 'pages' && activeKhatma) {
      setKhatmat(prev => prev.map(k => {
        if (k.id === activeKhatma.id) {
          const page = Math.min(604, k.currentPage + finalUnitValue);
          const status = page >= 604 ? 'completed' : 'active';
          return { ...k, currentPage: page, status };
        }
        return k;
      }));
    }
  };

  const handleDeleteSession = (id: string) => {
    setQuranSessions(prev => prev.filter(s => s.id !== id));
  };

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'read': return 'تلاوة وقراءة';
      case 'memorize': return 'حفظ جديد';
      case 'review': return 'مراجعة وتثبيت';
      default: return type;
    }
  };

  const getUnitTypeLabel = (type: string, value: number) => {
    const isArabicPlural = value > 2 && value <= 10;
    switch (type) {
      case 'pages': 
        return isArabicPlural ? 'صفحات' : 'صفحة';
      case 'juz': 
        return isArabicPlural ? 'أجزاء' : 'جزء';
      case 'surah': 
        return isArabicPlural ? 'سور' : 'سورة';
      default: return type;
    }
  };

  return (
    <div id="quran-tracker-root" className="space-y-6 text-right" dir="rtl">
      
      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('khatma')}
          className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'khatma'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          متابعة الختمة اليومية
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'sessions'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          أوراد الحفظ والمراجعة
        </button>
      </div>

      {/* TAB 1: Khatma Tracker */}
      {activeTab === 'khatma' && (
        <div className="space-y-6">
          {activeKhatma ? (
            <div className="bg-white dark:bg-[#161d26] rounded-3xl p-6 border border-[#e2e8f0] dark:border-slate-800/80 space-y-6 transition-colors duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-right">
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">{activeKhatma.name}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    مدة الختمة: <span className="font-bold text-slate-600 dark:text-slate-400">{formatArabicDayCount(activeKhatma.durationDays)}</span>
                  </p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>

              {/* Progress visual indicator */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-indigo-700 dark:text-indigo-400">
                    نسبة الإنجاز: {toArabicNumbers(Math.round((activeKhatma.currentPage / activeKhatma.totalPages) * 100))}%
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-semibold">
                    الصفحة {toArabicNumbers(activeKhatma.currentPage)} من {toArabicNumbers(activeKhatma.totalPages)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(activeKhatma.currentPage / activeKhatma.totalPages) * 100}%` }}
                  />
                </div>
              </div>

              {/* Suggested daily target calculation with adaptive, non-judgmental missed-day redistribution */}
              {(() => {
                const start = new Date(activeKhatma.startDate);
                const now = new Date();
                start.setHours(0,0,0,0);
                now.setHours(0,0,0,0);
                const diffTime = now.getTime() - start.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const daysRemaining = Math.max(1, activeKhatma.durationDays - diffDays);
                const suggestedPages = Math.ceil((activeKhatma.totalPages - activeKhatma.currentPage) / daysRemaining);
                const isBehind = activeKhatma.currentPage < (activeKhatma.totalPages / activeKhatma.durationDays) * Math.min(activeKhatma.durationDays, diffDays + 1);

                return (
                  <div className="space-y-2">
                    <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                      <div className="flex items-start gap-2 text-right">
                        <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="space-y-1.5">
                          <span className="font-semibold leading-relaxed block">
                            معدلك اليومي المقترح لإتمام الختمة في وقتها: <span className="font-black text-amber-700 dark:text-amber-400">{toArabicNumbers(suggestedPages)} {suggestedPages > 10 ? 'صفحة' : 'صفحات'} يومياً</span> (متبقي {toArabicNumbers(daysRemaining)} {daysRemaining > 10 ? 'يوم' : 'أيام'})
                          </span>
                          {isBehind && (
                            <span className="text-[10px] text-amber-800/80 dark:text-amber-300/85 font-semibold block leading-relaxed">
                              💡 تم إعادة توزيع الصفحات الفائتة بهدوء ولطف على الأيام المتبقية، لتبدأ من جديد دون أي ضغط أو إحساس بالتقصير 🤍
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Update Current Page Button */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setUpdatingKhatmaId(activeKhatma.id);
                    setNewPageVal(activeKhatma.currentPage);
                  }}
                  className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-sm transition-all text-center cursor-pointer shadow-md shadow-indigo-100/50 dark:shadow-none"
                >
                  تحديث الصفحة التي وصلت إليها
                </button>
                <button
                  onClick={() => {
                    if (confirm('هل أنت متأكد من رغبتك في إلغاء أو أرشفة هذه الختمة وبدء واحدة جديدة؟')) {
                      setKhatmat(prev => prev.map(k => k.id === activeKhatma.id ? { ...k, status: 'completed' as const } : k));
                    }
                  }}
                  className="py-3 px-4 bg-rose-50 dark:bg-rose-950/25 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#161d26] rounded-3xl p-8 border border-[#e2e8f0] dark:border-slate-800/80 text-center space-y-6 transition-colors duration-300">
              <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full">
                <Book className="w-12 h-12" />
              </div>
              <div className="space-y-1.5 max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">لا توجد ختمة نشطة حالياً</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  ابدأ الآن ختمتك الرمضانية أو اليومية لتقسيم ورد تلاوة القرآن ومتابعته يوماً بعد يوم بسهولة ويسر.
                </p>
              </div>
              <button
                onClick={() => setShowAddKhatma(true)}
                className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-2xl text-sm transition-colors cursor-pointer inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                تخطيط وبدء ختمة جديدة
              </button>
            </div>
          )}

          {/* Completed Khatmat List */}
          {khatmat.filter(k => k.status === 'completed').length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-400">ختمات سابقة مكتملة</h4>
              <div className="grid grid-cols-1 gap-2">
                {khatmat.filter(k => k.status === 'completed').map((k) => (
                  <div key={k.id} className="p-4 bg-white dark:bg-[#161d26] rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{k.name}</span>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">الصفحة {toArabicNumbers(k.currentPage)} / {toArabicNumbers(k.totalPages)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full">مكتملة</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Sessions (Hifdh & Review) Log */}
      {activeTab === 'sessions' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">سجل أوراد الحفظ والمراجعة</h3>
            <button
              onClick={() => setShowAddSession(true)}
              className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              تسجيل ورد جديد
            </button>
          </div>

          {quranSessions.length === 0 ? (
            <div className="bg-white dark:bg-[#161d26] rounded-3xl p-8 border border-[#e2e8f0] dark:border-slate-800/80 text-center space-y-4 transition-colors duration-300">
              <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full">
                <BookOpen className="w-10 h-10" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">لم تقم بتسجيل أي جلسات تلاوة أو حفظ مؤخراً.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {quranSessions.map((session) => (
                <div key={session.id} className="p-4 bg-white dark:bg-[#161d26] rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl text-xs font-black ${
                      session.sessionType === 'memorize' 
                        ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' 
                        : session.sessionType === 'review'
                        ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400'
                        : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
                    }`}>
                      {session.sessionType === 'memorize' ? 'حفظ' : session.sessionType === 'review' ? 'مراجعة' : 'تلاوة'}
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-sm font-bold text-slate-800 dark:text-white">
                        {toArabicNumbers(session.unitValue)} {getUnitTypeLabel(session.unitType, session.unitValue)}
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">تم في تاريخ: {toArabicNumbers(session.date)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POPUP 1: Create New Khatma Modal */}
      {showAddKhatma && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleCreateKhatma} className="bg-white dark:bg-[#161d26] w-full max-w-md rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-5 shadow-2xl text-right">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">تخطيط وبدء ختمة جديدة</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">اسم الختمة:</label>
                <input
                  type="text"
                  required
                  value={khatmaName}
                  onChange={(e) => setKhatmaName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">المدة الزمنية المقترحة لإتمامها (يوم):</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={365}
                  value={isNaN(durationDays) ? '' : durationDays}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setDurationDays(NaN);
                    } else {
                      setDurationDays(parseInt(val));
                    }
                  }}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddKhatma(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm text-center cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-sm text-center cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none"
              >
                بدء الختمة المباركة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP 2: Update Khatma Current Page Modal */}
      {updatingKhatmaId && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleUpdatePage} className="bg-white dark:bg-[#161d26] w-full max-w-md rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-5 shadow-2xl text-right">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">تحديث الصفحة الحالية</h3>
            
            <div className="space-y-3">
              <div className="space-y-1 text-center">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">أدخل رقم الصفحة التي وصلت إليها حالياً (من ١ إلى ٦٠٤):</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={604}
                  value={isNaN(newPageVal) ? '' : newPageVal}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setNewPageVal(NaN);
                    } else {
                      setNewPageVal(parseInt(val));
                    }
                  }}
                  className="w-24 text-center mx-auto p-3 mt-2 bg-slate-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/50 rounded-2xl text-xl font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUpdatingKhatmaId(null)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm text-center cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-sm text-center cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none"
              >
                تحديث وحفظ الورد
              </button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP 3: Add Session Modal */}
      {showAddSession && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleCreateSession} className="bg-white dark:bg-[#161d26] w-full max-w-md rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-5 shadow-2xl text-right">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">تسجيل ورد قرآن</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">نوع الورد:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['read', 'memorize', 'review'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSessionType(type)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        sessionType === type
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-black'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {type === 'read' ? 'تلاوة' : type === 'memorize' ? 'حفظ جديد' : 'مراجعة'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">وحدة الحساب والقياس:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['pages', 'juz', 'surah'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUnitType(type)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        unitType === type
                          ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-black'
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {type === 'pages' ? 'صفحات' : type === 'juz' ? 'أجزاء' : 'سور'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400">الكمية / المقدار:</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={604}
                  value={isNaN(unitValue) ? '' : unitValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setUnitValue(NaN);
                    } else {
                      setUnitValue(parseInt(val));
                    }
                  }}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSession(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm text-center cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-sm text-center cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none"
              >
                تسجيل الورد وحفظه
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
