import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Compass,
  BookOpen,
  Sparkles,
  Clock,
  Calendar,
  Smartphone,
  Bell,
  Sliders,
  Moon,
  Volume2,
  CheckCircle2,
  Zap,
  Play,
  Heart,
  HelpCircle,
  Award
} from 'lucide-react';

interface FeatureTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string, subTab?: string) => void;
}

interface TourStep {
  id: string;
  subTab?: string;
  title: string;
  subtitle: string;
  category: string;
  badge: string;
  icon: React.ElementType;
  color: {
    bg: string;
    border: string;
    text: string;
    gradient: string;
    accent: string;
  };
  description: string;
  highlights: string[];
  tips: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'home',
    title: 'الرئيسية والمواقيت الأفقية',
    subtitle: 'متابعة حية لمواقيت الصلاة الست والعد التنازلي الحاد',
    category: 'الصلوات والأذان',
    badge: 'تفاعلي وبث حي',
    icon: Clock,
    color: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-600 to-teal-600',
      accent: 'emerald'
    },
    description: 'شاشة عرض أفقية مبتكرة للصلوات الست اليومية مع تمييز تلقائي للصلاة القادمة وشريط تقدم دقيق بالدقائق والثواني، واستماع للأذان مباشرة عند دخول الوقت.',
    highlights: [
      'بطاقات تفاعلية للصلوات الخمس + صلاة الشروق والضحى',
      'تشغيل واستماع لصوت الأذان بضغطة زر واحدة 🔊',
      'تسجيل سريع لأداء الفريضة والسنن الرواتب من القائمة مباشرة',
      'شريط أداء الإيمان اليومي والأسبوعي'
    ],
    tips: 'انقر على أي صلاة في القائمة الأفقية لفتح بطاقات تسجيل الفروض والسنن فوراً!'
  },
  {
    id: 'salah',
    title: 'إدارة الصلاة وسجل السنن والفوائت',
    subtitle: 'تتبع صلاة الجماعة، السنن الرواتب، وقضاء الفوائت',
    category: 'الصلوات والأذان',
    badge: 'سجل إيماني شامل',
    icon: Sliders,
    color: {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/30',
      text: 'text-indigo-600 dark:text-indigo-400',
      gradient: 'from-indigo-600 to-blue-600',
      accent: 'indigo'
    },
    description: 'سجل يومي دقيق لتسجيل حالة كل صلاة (في وقتها، جماعة، قضاء، أو سنة)، مع حاسبة ذكية لقضاء الفوائت وإحصائيات الالتزام الصارم.',
    highlights: [
      'تسجيل صلاة الجماعة في المسجد والسنن القبلية والبعدية',
      'حاسبة قضائية أوتوماتيكية لحساب الصلوات المتبقية عليك',
      'عرض تقويم شهر كامل يبين الصلوات المكتملة بالألوان',
      'إحصائيات ونسبة المداومة على الصلاة في وقتها'
    ],
    tips: 'استخدم زر "تسجيل القضاء السريع" لإنقاص عداد الفوائت بسهولة!'
  },
  {
    id: 'quran',
    title: 'المصحف الشريف والختمات وسورة الكهف',
    subtitle: 'متابعة الختمة القرأنية، تلاوات الأجزاء، وقراءة الجمعة',
    category: 'القرآن والأذكار',
    badge: 'تلاوة وختمات',
    icon: BookOpen,
    color: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-600 to-yellow-600',
      accent: 'amber'
    },
    description: 'مساعد القرآن الكريم لتنظيم الختمات الشهيرة واليومية، حفظ آخر صفحة وآية قرأتها، وتنبيه خاص بقراءة سورة الكهف كل يوم جمعة.',
    highlights: [
      'متابعة أجزاء القرآن وورد القراءة اليومي بسهولة',
      'تحديد العلامة والمرجع التلقائي لصفحة التوقف',
      'قسم سورة الكهف المخصص مع عداد وقت الجمعة المباركة',
      'حاسبة مدة الختمة وتوزيع الأوراق على أوقات الصلاة'
    ],
    tips: 'يمكنك إنشاء أكثر من ورد للختمة (ختمة تدبر، ختمة حفظ، ختمة شهرية)!'
  },
  {
    id: 'adhkar',
    title: 'حصن المسلم والمسبحة الإلكترونية',
    subtitle: 'أذكار الصباح والمساء، أذكار النوم، والمسبحة التفاعلية',
    category: 'القرآن والأذكار',
    badge: 'تفاعل واهتزاز',
    icon: Sparkles,
    color: {
      bg: 'bg-teal-500/10',
      border: 'border-teal-500/30',
      text: 'text-teal-600 dark:text-teal-400',
      gradient: 'from-teal-600 to-emerald-600',
      accent: 'teal'
    },
    description: 'مجموعة حصن المسلم المعتمدة مع مسبحة ذكية حساسة للمس توفر عداداً تفاعلياً مع إشارة لمسية واهتزاز خفيف للتركيز في التسبيح.',
    highlights: [
      'أذكار الصباح، المساء، النوم، الاستيقاظ، وأذكار بعد الصلاة',
      'عداد مسبحة ذكي بفرقعة صوتية واهتزاز هادئ عند إتمام المائة',
      'إمكانية إضافة أدعية واستغفارات مخصصة في قائمة أذكارك',
      'مؤشر ذكي يُظهر الأذكار المستحبة حسب الوقت الحالي من اليوم'
    ],
    tips: 'اضغط على زر المسبحة في أي مكان بالصفحة للعد التلقائي والسريع!'
  },
  {
    id: 'khushu',
    title: 'قيام الليل والثلث الأخير ودعاء السحر',
    subtitle: 'الحساب الفلكي الدقيق لأوقات إجابة الدعاء بالليل',
    category: 'القيام والصيام',
    badge: 'حساب فلكي دقيق',
    icon: Moon,
    color: {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/30',
      text: 'text-violet-600 dark:text-violet-400',
      gradient: 'from-violet-600 to-purple-600',
      accent: 'violet'
    },
    description: 'أداة فلكية متخصصة تحسب بدقة متناهية بداية ونهاية الثلث الأخير من الليل ومنتصف الليل بناءً على وقت غروب الشمس والفجر في مدينتك.',
    highlights: [
      'حساب فلكي أوتوماتيكي لساعة السحر والثلث الأخير',
      'عداد تنازلي يبين الوقت المتبقي لحلول ثلث الليل الأخير',
      'قائمة أدعية مأثورة للقيام والاستغفار في السحر',
      'سجل تتبع عدد ركعات الشفع والوتر والقيام'
    ],
    tips: 'فّعل منبه الثلث الأخير لتستيقظ للاستغفار والدعاء المستجاب!'
  },
  {
    id: 'qibla',
    title: 'اتجاه القبلة الفلكية 360°',
    subtitle: 'بوصلة حية تحدد اتجاه الكعبة المشرفة بدون إنترنت',
    category: 'الخدمات الذكية',
    badge: 'بوصلة GPS حية',
    icon: Compass,
    color: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-600 to-teal-600',
      accent: 'emerald'
    },
    description: 'بوصلة تفاعلية ثلاثية الأبعاد تعتمد على حساس الجهاز والـ GPS لتحديد زاوية واتجاه الكعبة المشرّفة من أي مكان في العالم بالدرجات.',
    highlights: [
      'تحديد زاوية انحراف القبلة بالدرجات الدقيقة',
      'مؤشر بصري ذهبي يضيء فور محاذاة الهاتف باتجاه الكعبة',
      'عرض المسافة المباشرة بالكيلومترات بين موقعك والحرم المكي',
      'تعمل بدون اتصال بالإنترنت في الرحلات والسفر'
    ],
    tips: 'ضع هاتفك على سطح مستوٍ وبعيداً عن الأجسام المغناطيسية لدقة 100%!'
  },
  {
    id: 'fasting',
    title: 'تتبع الصيام والأيام البيض',
    subtitle: 'صيام الإثنين والخميس، الأيام البيض، وسجل القضاء',
    category: 'القيام والصيام',
    badge: 'تطوع ورمضان',
    icon: Calendar,
    color: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-600 dark:text-rose-400',
      gradient: 'from-rose-600 to-pink-600',
      accent: 'rose'
    },
    description: 'مساعد الصيام اليومي والموسمي لتتبع صيام الأيام البيض (13، 14، 15 هجرياً)، صيام السنة، وتتبع أيام القضاء من رمضان.',
    highlights: [
      'تنبيهات تلقائية عشية صيام الإثنين والخميس والأيام البيض',
      'سجل خاص لأيام القضاء المتبقية من رمضان مع عداد تنازلي',
      'ساعات الصيام المتبقية يومياً حتى الإفطار',
      'أدعية الإفطار المأثورة عن النبي ﷺ'
    ],
    tips: 'تحقق من شاشة الصيام للتعرف على مواعيد الأيام البيض للشهر الهجري الحالي!'
  },
  {
    id: 'widgets',
    title: 'أدوات الشاشة الذكية والخلفيات',
    subtitle: 'مصمم ودجت للآيفون والأندرويد وخلفيات إسلامية',
    category: 'الخدمات الذكية',
    badge: 'تخصيص الهاتف',
    icon: Smartphone,
    color: {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      text: 'text-cyan-600 dark:text-cyan-400',
      gradient: 'from-cyan-600 to-blue-600',
      accent: 'cyan'
    },
    description: 'محاكي ودجت تفاعلي لتصميم ودجت جذاب لشاشة هاتفك الرئيسية، مع مكتبة خلفيات مساجد وعمارة إسلامية عالية الجودة للتنزيل.',
    highlights: [
      'تصاميم متنوعة للودجت (شكل الساعة، بطاقة الصلاة، والأذكار)',
      'تخصيص الألوان والشفافية وحجم الخروج للودجت',
      'تحميل وتنزيل خلفيات مساجد الحرمين الشريفين بجودة عالية',
      'دليل خطوة بخطوة لإضافة الودجت لشاشة هاتفك'
    ],
    tips: 'اضغط على زر "تنزيل بصيغة صورة" لحفظ تصميم الودجت على هاتفك!'
  },
  {
    id: 'alarms',
    title: 'منبهات العبادات وأصوات المؤذنين',
    subtitle: 'تنبيهات الأذان، أذكار الصباح والمساء، وصلاة الضحى',
    category: 'الخدمات الذكية',
    badge: 'تنبيهات مخصصة',
    icon: Bell,
    color: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-600 to-orange-600',
      accent: 'amber'
    },
    description: 'مركز تنبيهات شامل يتيح لك تفعيل منبهات مخصصة لصلاة الضحى، قيام الليل، أذكار الصباح والمساء، واختيار المؤذن المفضل لكل صلاة.',
    highlights: [
      'تخصيص صوت أذان منفصل لكل صلاة (مكة، المدينة، الأقصى، إلخ)',
      'تنبيهات إشعار ذكية قبل الصلاة بـ 15 دقيقة للاستعداد',
      'منبه يومي لصلاة الضحى والورد القرآني',
      'إشعار تذكير بقراءة سورة الكهف والصلاة على النبي يوم الجمعة'
    ],
    tips: 'يمكنك اختيار مؤذن مخصص لصلاة الفجر يختلف عن باقي الصلوات!'
  },
  {
    id: 'settings',
    subTab: 'location',
    title: 'الموقع الجغرافي المطور والـ GPS',
    subtitle: 'ضبط المدينة وإدخال الإحداثيات اليدوية والقبلة',
    category: 'الضبط والتخصيص',
    badge: 'دقة فلكية',
    icon: Sliders,
    color: {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-700 dark:text-slate-300',
      gradient: 'from-slate-700 to-slate-900',
      accent: 'slate'
    },
    description: 'صفحة إعدادات متكاملة في القائمة الجانبية تتيح لك تحديث المدينة بالـ GPS، واختيار المذهب الفلكي (قياسي/حنفي)، وتعديل التقويم الهجري.',
    highlights: [
      'تحديث تلقائي سريع بالـ GPS أو شبكة IP للموقع الجغرافي',
      'قائمة شاملة تحتوي على جميع مدن ومحافظات الوطن العربي',
      'إمكانية إدخال خطوط الطول والعرض يدوياً للرحلات البرية',
      'ضبط فروق التقويم الهجري واسترداد النسخ الاحتياطية'
    ],
    tips: 'تصفح قائمة الإعدادات الجانبية للتحكم التام في كافة تفاصيل التطبيق!'
  }
];

export default function FeatureTourModal({ isOpen, onClose, onSelectTab }: FeatureTourModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleJumpToFeature = () => {
    onSelectTab(currentStep.id, currentStep.subTab);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white dark:bg-[#131922] w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-right"
        >
          {/* Header Banner */}
          <div className={`p-4 sm:p-5 bg-gradient-to-r ${currentStep.color.gradient} text-white relative flex items-center justify-between shrink-0`}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-white/20 font-extrabold px-2 py-0.5 rounded-full border border-white/20">
                    خطوة {currentStepIndex + 1} من {TOUR_STEPS.length}
                  </span>
                  <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full shadow-xs">
                    {currentStep.badge}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-white mt-1 leading-tight">
                  {currentStep.title}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-black/20 hover:bg-black/40 text-white/90 hover:text-white rounded-full transition-all cursor-pointer"
              title="إغلاق الجولة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
            {/* Subtitle / Category */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                الفئة: <strong className="text-slate-700 dark:text-slate-300">{currentStep.category}</strong>
              </span>
              <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                {currentStep.subtitle}
              </span>
            </div>

            {/* Main Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {currentStep.description}
            </p>

            {/* Bullet Highlights */}
            <div className={`p-4 rounded-2xl ${currentStep.color.bg} border ${currentStep.color.border} space-y-2.5`}>
              <h4 className={`text-xs font-black ${currentStep.color.text} flex items-center gap-1.5`}>
                <Zap className="w-4 h-4 shrink-0" />
                <span>أبرز المميزات والوظائف المتاحة:</span>
              </h4>
              <ul className="space-y-1.5">
                {currentStep.highlights.map((item, idx) => (
                  <li key={idx} className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 flex items-start gap-2 leading-tight">
                    <CheckCircle2 className={`w-3.5 h-3.5 ${currentStep.color.text} shrink-0 mt-0.5`} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tip Box */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
              <span className="text-amber-500 text-base shrink-0">💡</span>
              <p>
                <strong>نصيحة استكشاف:</strong> {currentStep.tips}
              </p>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 bg-slate-50 dark:bg-[#0f141b] border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Step Progress Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 bg-emerald-600 dark:bg-emerald-400'
                      : 'w-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                  title={`الذهاب للخطوة ${idx + 1}`}
                />
              ))}
            </div>

            {/* Buttons Row */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {/* Direct Jump to Feature */}
              <button
                type="button"
                onClick={handleJumpToFeature}
                className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>جرب هذه الميزة الآن 👈</span>
              </button>

              {/* Back Step */}
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
              )}

              {/* Next / Finish */}
              <button
                type="button"
                onClick={handleNext}
                className="py-2.5 px-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1"
              >
                <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'إنهاء الجولة ✨' : 'التالي'}</span>
                {currentStepIndex < TOUR_STEPS.length - 1 && <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
