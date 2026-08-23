import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Sliders, Moon, Sun, Monitor, Clock, Image, Sparkles, Check } from 'lucide-react';
import { AppSettings, BackdropRenderMode } from '../types';

interface QuickSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setToastMessage: (msg: string) => void;
  onOpenFullSettings: () => void;
}

export const QuickSettingsModal: React.FC<QuickSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
  setToastMessage,
  onOpenFullSettings,
}) => {
  if (!isOpen) return null;

  const currentRenderMode: BackdropRenderMode = settings.backdropRenderMode || 'lineArt';
  const currentStyle = settings.backdropStyle || 'auto';

  const themesList = [
    { id: 'auto', name: 'تلقائي مع الوقت', icon: '🌅', desc: 'يتغير مع وقت الصلاة' },
    { id: 'classic', name: 'الكلاسيكي الفاخر', icon: '🕌', desc: 'مظهر إسلامي زاهي' },
    { id: 'kaaba', name: 'المسجد الحرام والكعبة', icon: '🕋', desc: 'أنوار الحرم المكي' },
    { id: 'madinah', name: 'المسجد النبوي الشريف', icon: '🕌', desc: 'الروضة السكينة' },
    { id: 'aqsa', name: 'المسجد الأقصى المبارك', icon: '🕌', desc: 'قبة الصخرة المعظمة' },
    { id: 'friday', name: 'الجمعة المباركة', icon: '✨', desc: 'أجواء الجمعة العطرة' },
    { id: 'gold', name: 'الذهبي الملكي', icon: '🪙', desc: 'زخارف ذهبية راقية' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="bg-white dark:bg-[#161d26] border border-slate-200/80 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          dir="rtl"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white">التحكم والإعدادات السريعة</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">خصّص مظهر بطاقة الصلاة والساعة والمذهب مباشرة</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Scrollable */}
          <div className="p-5 overflow-y-auto space-y-5 text-end">
            
            {/* 1. Backdrop Render Mode: SVG vs Presets */}
            <div className="space-y-2.5 bg-indigo-50/40 dark:bg-indigo-950/20 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  نوع خلفية بطاقة الصلاة:
                </span>
                <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                  {currentRenderMode === 'illustrated' ? 'صور ثيمات جاهزة 🖼️' : 'رسم متجهي SVG 🎨'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, backdropRenderMode: 'lineArt' }));
                    setToastMessage("تم اختيار رسم المتجهي SVG الفاخر 🎨");
                  }}
                  className={`p-3 rounded-xl border text-end transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    currentRenderMode === 'lineArt' || currentRenderMode === 'auto'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black">رسم متجهي SVG 🎨</span>
                    {(currentRenderMode === 'lineArt' || currentRenderMode === 'auto') && <Check className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] opacity-80 leading-snug">خطوط وتصاميم إسلامية متجهية عالية الدقة ومتفاعلة مع أوقات الصلاة.</span>
                </button>

                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, backdropRenderMode: 'illustrated' }));
                    setToastMessage("تم اختيار خلفيات الصور الإيمانية الطبيعية 🖼️");
                  }}
                  className={`p-3 rounded-xl border text-end transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    currentRenderMode === 'illustrated'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-black">صور ثيمات جاهزة 🖼️</span>
                    {currentRenderMode === 'illustrated' && <Check className="w-4 h-4" />}
                  </div>
                  <span className="text-[10px] opacity-80 leading-snug">صور وخلفيات طبيعية خلابة للمساجد والمعالم الإسلامية العظيمة.</span>
                </button>
              </div>

              {/* Theme Picker Grid */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-2">اختر الصورة أو الثيم المفضل:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {themesList.map(t => {
                    const isSelected = currentStyle === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setSettings(prev => ({ ...prev, backdropStyle: t.id as any }));
                          setToastMessage(`تم تفعيل ثيم: ${t.name} ✨`);
                        }}
                        className={`p-2 rounded-xl text-end border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-500 font-bold shadow-sm'
                            : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm">{t.icon}</span>
                          <span className="text-[11px] font-black truncate">{t.name}</span>
                        </div>
                        <span className="text-[9px] opacity-80">{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Backdrop Opacity Slider Bar */}
              <div className="pt-3 border-t border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-200">
                    درجة شفافية الصورة ووضوح خلفية البطاقة:
                  </span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    {settings.backdropOpacity ?? 75}%
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={settings.backdropOpacity ?? 75}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setSettings(prev => ({ ...prev, backdropOpacity: val }));
                  }}
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between text-[9.5px] text-slate-500 dark:text-slate-400 font-bold px-0.5">
                  <span>خفيفة جداً (10%)</span>
                  <span>متوازنة (75%)</span>
                  <span>ظهور كامل (100%)</span>
                </div>
              </div>

            </div>

            {/* 2. Theme App Mode (Light / Dark / System) */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">مظهر التطبيق العام:</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'light', label: 'نهار ☀️', icon: Sun },
                  { id: 'dark', label: 'ليل 🌙', icon: Moon },
                  { id: 'system', label: 'تلقائي 📱', icon: Monitor },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSettings(prev => ({ ...prev, theme: t.id as any }));
                      setToastMessage(`تم تغيير المظهر إلى: ${t.label}`);
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      settings.theme === t.id
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Clock Style */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">نمط عرض الساعة الرئيسية:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, clockStyle: 'digital' }));
                    setToastMessage("تم اختيار الساعة الرقمية ⏱️");
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settings.clockStyle === 'digital'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>ساعة رقمية ⏱️</span>
                </button>
                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, clockStyle: 'analog' }));
                    setToastMessage("تم اختيار ساعة العقارب الكلاسيكية 🕰️");
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    settings.clockStyle === 'analog'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>ساعة عقارب 🕰️</span>
                </button>
              </div>
            </div>

            {/* 4. Madhab Selection */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">المذهب الفقهي (حساب صلاة العصر):</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, madhab: 'standard' }));
                    setToastMessage("تم اختيار مذهب جمهور العلماء (الشافعي والمالكي والحنبلي)");
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    settings.madhab === 'standard'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>جمهور العلماء 🕌</span>
                </button>
                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, madhab: 'hanafi' }));
                    setToastMessage("تم اختيار المذهب الحنفي");
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    settings.madhab === 'hanafi'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>المذهب الحنفي 📖</span>
                </button>
              </div>
            </div>

            {/* 5. Hijri Offset Adjustment */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
              <div>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">تعديل التاريخ الهجري:</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">لضبط مع رؤية الهلال المحلية</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, hijriOffset: Math.max(-2, prev.hijriOffset - 1) }));
                  }}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-sm flex items-center justify-center shadow-xs cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-600"
                >
                  -
                </button>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 px-2 min-w-[3rem] text-center">
                  {settings.hijriOffset > 0 ? `+${settings.hijriOffset}` : settings.hijriOffset} يوم
                </span>
                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, hijriOffset: Math.min(2, prev.hijriOffset + 1) }));
                  }}
                  className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-sm flex items-center justify-center shadow-xs cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-600"
                >
                  +
                </button>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                onOpenFullSettings();
              }}
              className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>فتح الإعدادات الشاملة ⚙️</span>
            </button>
            <button
              onClick={onClose}
              className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md cursor-pointer"
            >
              حفظ وإغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
