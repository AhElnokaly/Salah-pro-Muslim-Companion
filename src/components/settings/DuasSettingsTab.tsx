import React from 'react';
import { Heart, Plus, Trash2 } from 'lucide-react';
import { CustomDua } from '../../types';
import { safeUUID } from '../../utils/uuid';

interface DuasSettingsTabProps {
  customDuas: CustomDua[];
  setCustomDuas: React.Dispatch<React.SetStateAction<CustomDua[]>>;
}

export default function DuasSettingsTab({
  customDuas,
  setCustomDuas,
}: DuasSettingsTabProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-black text-slate-800 dark:text-white">الأدعية المخصصة المحفوظة</h2>
      </div>

      {/* Add Custom Dua Form */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 dark:text-white">حفظ دعاء مخصص وجديد</h3>

        <div className="space-y-3">
          <textarea
            id="new-dua-textarea"
            rows={3}
            placeholder="اكتب دعاءك هنا بصدق وإخلاص (مثال: اللهم آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار)..."
            className="w-full bg-slate-50 dark:bg-[#111720] border border-[#e2e8f0]/85 dark:border-slate-800 text-slate-850 dark:text-slate-100 rounded-2xl p-4 text-xs font-bold leading-relaxed outline-hidden focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                id="new-dua-show-home"
                defaultChecked
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span>عرض هذا الدعاء في الشاشة الرئيسية</span>
            </label>

            <button
              type="button"
              onClick={() => {
                const txtEl = document.getElementById('new-dua-textarea') as HTMLTextAreaElement;
                const checkEl = document.getElementById('new-dua-show-home') as HTMLInputElement;
                if (txtEl && txtEl.value.trim()) {
                  const newDua: CustomDua = {
                    id: safeUUID(),
                    text: txtEl.value.trim(),
                    showOnHome: checkEl ? checkEl.checked : true,
                    order: customDuas.length,
                  };
                  setCustomDuas((prev) => [...prev, newDua]);
                  txtEl.value = '';
                }
              }}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              حفظ الدعاء
            </button>
          </div>
        </div>
      </div>

      {/* List of Custom Duas */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 dark:text-white">أدعيتك المخصصة والخاصة</h3>

        {customDuas.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6 font-semibold">
            لا يوجد أي دعاء مخصص حتى الآن. أضف دعاءك الأول المبارك بالأعلى!
          </p>
        ) : (
          <div className="space-y-3">
            {customDuas.map((dua) => (
              <div
                key={dua.id}
                className="p-4 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/40 space-y-3"
              >
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-end font-sans">
                  {dua.text}
                </p>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/30 pt-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-500 dark:text-slate-400 font-bold">
                    <input
                      type="checkbox"
                      checked={dua.showOnHome}
                      onChange={(e) => {
                        setCustomDuas((prev) =>
                          prev.map((d) => (d.id === dua.id ? { ...d, showOnHome: e.target.checked } : d))
                        );
                      }}
                      className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>عرض على لوحة التحكم</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomDuas((prev) => prev.filter((d) => d.id !== dua.id));
                    }}
                    className="text-rose-500 hover:text-rose-600 dark:text-rose-450 dark:hover:text-rose-350 font-black flex items-center gap-1 cursor-pointer text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
