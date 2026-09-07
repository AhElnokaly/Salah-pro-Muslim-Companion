import React from 'react';
import { Sparkles, CheckCircle2, Heart, BookOpen, X } from 'lucide-react';
import { toArabicNumbers } from '../../utils/hijri';

interface KhushuPostPrayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAthkar?: () => void;
}

const POST_PRAYER_BRIEF_ATHKAR = [
  {
    title: 'الاستغفار والسلام',
    text: 'أَسْتَغْفِرُ اللهَ (ثَلَاثًا)، اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الجَلَالِ وَالإِكْرَامِ.',
    count: 1,
  },
  {
    title: 'التهليل بعد الصلاة',
    text: 'لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ.',
    count: 1,
  },
  {
    title: 'التسبيح والتحميد والتكبير',
    text: 'سُبْحَانَ اللهِ (٣٣)، الحَمْدُ لِلَّهِ (٣٣)، اللهُ أَكْبَرُ (٣٣)، وتَمام المائة: لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ.',
    count: 33,
  },
];

export const KhushuPostPrayerModal: React.FC<KhushuPostPrayerModalProps> = ({
  isOpen,
  onClose,
  onOpenAthkar,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="khushu-post-prayer-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none"
      dir="rtl"
    >
      <div className="bg-slate-900 border border-emerald-500/30 text-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* زر الإغلاق */}
        <button
          id="btn-close-post-prayer"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* رأس النافذة */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              تقبّل الله صلاتك وطاعتك
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              انقضت فترة الخشوع واستُعيد نمط الصوت بنجاح
            </p>
          </div>
        </div>

        {/* كروت أذكار ما بعد الصلاة السريعة */}
        <div className="space-y-3 mb-6 max-h-[50vh] overflow-y-auto pr-1">
          {POST_PRAYER_BRIEF_ATHKAR.map((thikr, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-emerald-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-emerald-300">
                  {thikr.title}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                  {thikr.count > 1 ? `${toArabicNumbers(thikr.count)} مرة` : 'مرة واحدة'}
                </span>
              </div>
              <p className="text-sm font-serif leading-relaxed text-slate-200">
                {thikr.text}
              </p>
            </div>
          ))}
        </div>

        {/* الإجراءات السفلية */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {onOpenAthkar && (
            <button
              id="btn-open-full-athkar"
              onClick={() => {
                onClose();
                onOpenAthkar();
              }}
              className="w-full sm:w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/40"
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>أذكار الصلاة كاملة</span>
            </button>
          )}

          <button
            id="btn-confirm-post-prayer"
            onClick={onClose}
            className={`py-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
              onOpenAthkar ? 'w-full sm:w-1/2' : 'w-full'
            }`}
          >
            <Heart className="w-4 h-4 text-pink-400 shrink-0" />
            <span>حفظكم الله وتمم بالخير</span>
          </button>
        </div>
      </div>
    </div>
  );
};
