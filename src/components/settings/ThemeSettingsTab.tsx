import React from 'react';
import { Settings, Sun, Moon, Monitor, Heart, Clock, Sparkles } from 'lucide-react';
import { AppSettings, BackdropRenderMode } from '../../types';
import SpiritualThemePicker from '../SpiritualThemePicker';

interface ThemeSettingsTabProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

export default function ThemeSettingsTab({
  settings,
  setSettings,
}: ThemeSettingsTabProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h2 className="text-lg font-black text-slate-800 dark:text-white">مظهر التطبيق وشكل الساعة</h2>
      </div>

      {/* Theme Selector */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 dark:text-white">مظهر وسمة واجهة التطبيق</h3>
        
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'light', name: 'مضيء', icon: Sun },
            { id: 'dark', name: 'ليلي', icon: Moon },
            { id: 'system', name: 'تلقائي', icon: Monitor }
          ].map((t) => {
            const Icon = t.icon;
            const isSelected = settings.theme === t.id || (!settings.theme && t.id === 'system');
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, theme: t.id as any }))}
                className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 font-black text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-350'
                    : 'border-slate-150 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gender Selector */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm animate-fade-in">
        <div className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">تحديد الجنس ومستند الرخصة الشرعية</h3>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
          تحديد الجنس يسمح للمرأة المسلمة بتفعيل «وضع الرخصة الشرعية» لعدم احتساب صلوات الفترات الخاصة كصلوات فائتة أو كسر التتابع الإيماني لتتبع الطاعات والورد اليومي.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, gender: 'male' }))}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              (settings.gender || 'male') === 'male'
                ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-350 font-bold shadow-xs scale-[1.02]'
                : 'border-slate-150 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:scale-[1.01]'
            }`}
          >
            <span className="text-lg">👨</span>
            <span className="text-xs font-black">ذكر</span>
          </button>
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, gender: 'female' }))}
            className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
              settings.gender === 'female'
                ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-350 font-bold shadow-xs scale-[1.02]'
                : 'border-slate-150 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:scale-[1.01]'
            }`}
          >
            <span className="text-lg">👩</span>
            <span className="text-xs font-black">أنثى</span>
          </button>
        </div>
        {settings.gender === 'female' && (
          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold leading-relaxed animate-fade-in text-center bg-rose-50/30 dark:bg-rose-950/10 p-2.5 rounded-xl border border-rose-500/10">
            ✨ يتيح وضع المرأة المسلمة تسجيل صلواتك كـ «عذر شرعي رخصة» لا ينقص من إنجازكِ أو يقطع تتابعكِ الإيماني المبارك 🤍.
          </p>
        )}
      </div>

      {/* Clock Style Toggle */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">شكل وعرض الساعة</h3>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
          اختر مظهر عرض الساعة على الكارت الرئيسي؛ إما ساعة حائط بعقارب تقليدية أنيقة أو ساعة رقمية عصرية مع العد التنازلي.
        </p>
        <div className="flex bg-slate-50 dark:bg-[#111720] p-1 rounded-2xl border border-slate-150 dark:border-slate-800/60">
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, clockStyle: 'digital' }))}
            className={`flex-1 py-3 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              (settings.clockStyle || 'digital') === 'digital'
                ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-sm border border-[#e2e8f0]/40 dark:border-slate-700/50'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
            }`}
          >
            <span>⏰</span>
            <span>ساعة رقمية حديثة</span>
          </button>
          <button
            type="button"
            onClick={() => setSettings(prev => ({ ...prev, clockStyle: 'analog' }))}
            className={`flex-1 py-3 rounded-xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              (settings.clockStyle || 'digital') === 'analog'
                ? 'bg-white dark:bg-[#1e293b] text-indigo-600 dark:text-indigo-400 shadow-sm border border-[#e2e8f0]/40 dark:border-slate-700/50'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350'
            }`}
          >
            <span>🕒</span>
            <span>ساعة عقارب تقليدية</span>
          </button>
        </div>
      </div>

      {/* App Style Toggle (Faith vs Glass) */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">شكل وأسلوب التطبيق</h3>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
          غيّر النمط العام للتطبيق بين المظهر الإيماني المشرق والمضيء، والأسلوب الزجاجي المتألق الحديث ذي الألوان الداكنة والعميقة المريحة للعين.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'faith-bright', name: 'النمط الإيماني 🕌', desc: 'ألوان مشرقة مستوحاة من كسوة الكعبة والزخارف الذهبية' },
            { id: 'glass-dark', name: 'النمط الزجاجي 🌌', desc: 'مظهر زجاجي شفاف مع تدرجات داكنة وهادئة ومريحة' }
          ].map((style) => {
            const isSelected = (settings.appStyle || 'glass-dark') === style.id;
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, appStyle: style.id as any }))}
                className={`p-3 rounded-2xl border text-end flex flex-col justify-between gap-1 transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-400/20 shadow-xs'
                    : 'border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-slate-500'
                }`}
              >
                <span className="text-xs font-black text-slate-800 dark:text-white block">
                  {style.name}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 leading-snug font-medium block">
                  {style.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mosque Backdrop Selector */}
      <div className="bg-white dark:bg-[#161d26] rounded-3xl p-5 border border-[#e2e8f0] dark:border-slate-800/80 space-y-4 transition-colors duration-300 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-black text-slate-800 dark:text-white">خلفية كارت الصلاة الرئيسي</h3>
        </div>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium">
          اختر مظهر وخلفية المسجد الأنيقة المعروضة في الكارت الرئيسي بقمة الشاشة ليتناسب مع ذوقك ومزاجك اليومي.
        </p>

        {/* Backdrop Render Mode Selection (LineArt vs Illustrated vs Auto) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 block">
            نمط عرض الرسم والتفاصيل
          </span>
          <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            {[
              { id: 'lineArt', name: '🪶 خط ذهبي رفيع', desc: 'رسم متجهات ذهبي خفيف' },
              { id: 'illustrated', name: '🖼️ صور مصوّرة', desc: 'صور دقيقة (عند توفرها)' },
              { id: 'auto', name: '⚡ تلقائي ذكي', desc: 'صور إن وُجدت، وإلا خط ذهبي' },
            ].map((m) => {
              const active = (settings.backdropRenderMode || 'auto') === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSettings(prev => ({ ...prev, backdropRenderMode: m.id as BackdropRenderMode }))}
                  className={`py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                    active
                      ? 'bg-white dark:bg-[#1f2937] text-indigo-600 dark:text-indigo-400 font-extrabold shadow-xs border border-indigo-200/50 dark:border-indigo-800/50'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs leading-tight">{m.name}</span>
                  <span className="text-[8px] opacity-75 hidden sm:block">{m.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Opacity Control Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              درجة شفافية صورة خلفية بطاقة الصلاة ({settings.backdropOpacity ?? 75}%)
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
        </div>

        {/* Visual Spiritual Theme Cards */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800 dark:text-white">
              السمات الإيمانية والمعالم الإسلامية (7 سمات مرئية):
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
              عرض مرئي فاخر 🎨
            </span>
          </div>
          <SpiritualThemePicker
            currentThemeId={settings.backdropStyle || 'auto'}
            onSelectTheme={(themeId) => {
              setSettings(prev => ({ ...prev, backdropStyle: themeId as any }));
            }}
            columns={2}
          />
        </div>
      </div>
    </div>
  );
}
