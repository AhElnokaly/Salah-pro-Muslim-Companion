# المرجع التقني (1): البنية التحتية والأساس البرمجي (Architecture & Core)

---

## 1. التوصيف المعماري العام (Architectural Overview)

يعتمد تطبيق **«همّتي» (Hemmaty)** على بنية هجينة خفيفة وعالية الكفاءة تضم:
- **الواجهة الأمامية:** React 18+ مع TypeScript وVite وTailwind CSS.
- **التغليف المكتبي والمحمولي:** Capacitor CLI لربط العرض بخصائص الأجهزة الذكية (Android Native Plugins).
- **التخزين المحلي الآمن:** نظام حماية وتخزين محلّي مبني على حزم وقائية تمنع أخطاء الـ Quota و أخطاء `JSON.parse`.
- **دعم اللغة والاتجاه:** دعم أصلي كامل للغة العربية والاتجاه من اليمين إلى اليسار (RTL) مع استخدام الخصائص المنطقية للـ CSS (`ms-`, `me-`, `ps-`, `pe-`).

---

## 2. الهيكل التنظيمي للملفات (Project Directory Structure)

```
/
├── android/                    # مشروع الأندرويد الأصلي (Kotlin & Gradle)
│   └── app/src/main/java/com/salahpro/app/
│       ├── MainActivity.kt
│       ├── plugins/           # إضافة أذان أصلية وأجهزة الاستقبال
│       └── widget/            # ودجت الشاشة الرئيسية
├── src/
│   ├── assets/                 # أصول الأيقونات والخلفيات
│   ├── components/             # المكونات البرمجية للواجهات
│   │   ├── dashboard/          # كتل لوحة التحكم
│   │   ├── quran/              # تتبع ومراجعة القرآن الكريم
│   │   ├── settings/           # إعدادات التطبيق والنسخ الاحتياطي
│   │   ├── shared/             # المكونات المشتركة والنوافذ العائمة
│   │   └── ui/                 # مكونات الواجهة الأساسية
│   ├── data/                   # البيانات الثابتة للأذكار والبحث الإيماني
│   ├── hooks/                  # الخطافات المخصصة (Custom Hooks)
│   ├── services/               # الخدمات التقنية وطبقة الاتصال بالأندرويد
│   ├── types/                  # التعريفات والمخططات النمطية (TypeScript Interfaces)
│   └── utils/                  # المحركات الرياضية والحسابية والتخزين
└── docs/reference/             # ملفات التوثيق المرجعي التفصيلية
```

---

## 3. طبقة التخزين المحلي والوقاية من الأعطال (Safe Storage Engine)

توجد آليات التخزين في `src/utils/storage.ts` لحماية التطبيق من الانهيار الناجم عن تلف البيانات في `localStorage` أو تجاوز المساحة المتاحة (`QuotaExceededError`).

### الدوال المرجعية في `src/utils/storage.ts`:

1. **`safeGetItem(key: string, fallback: string = ''): string`**
   - تقوم بقراءة المفتاح مع تغليف العملية بـ `try/catch`.
   - في حال عدم وجود المفتاح أو وجود خطأ في الوصول، ترجع القيمة الافتراضية `fallback`.

2. **`safeSetItem(key: string, value: string): boolean`**
   - تقوم بكتابة القيمة في `localStorage`.
   - تتعامل مع أخطاء المساحة الممتلئة بدون إيقاف التطبيق وتُرجع `false` عند الفشل.

3. **`safeGetJSON<T>(key: string, fallback: T): T`**
   - تقوم بقراءة نص الـ JSON وتحويله بأمان للنمط المطلوب `T`.
   - إذا كان النص تالفاً أو غير صالح كـ JSON، تعود مباشرة بـ `fallback` مع تسجيل تحذير دون رفع Exception.

4. **`safeSetJSON<T>(key: string, value: T): boolean`**
   - تقوم بتحويل الكائن `value` إلى نص JSON ثم كتابته بآمان عبر `safeSetItem`.

---

## 4. معالجة الأخطاء الشاملة (Error Boundary)

يتضمن التطبيق مكون `ErrorBoundary` لتغليف الشجرة البرمجية:
- **الموقع:** `src/components/ErrorBoundary.tsx`
- **الوظيفة:** التقاط أخطاء الـ Rendering الميدانية ومنع شاشة الموت البيضاء.
- **التصميم:** عرض واجهة إيمانية أنيقة مع خيار لإعادة تحميل التطبيق أو استعادة الإعدادات الافتراضية.

---

## 5. تحميل المكونات الديناميكي (Dynamic Lazy Imports)

لتحسين زمن التحميل الأول واستهلاك الذاكرة، يتم تحميل التبويبات الثانوية باستخدام `React.lazy` و`Suspense`:
- المكونات المحملة ديناميكياً: `QuranTracker`, `KhushuQiyamTracker`, `WorshipAlarms`, `IslamicCalendar`, `AnalyticsDashboard`, `QiblaCompass`, `FastingTracker`.
- مؤشر التحميل: مكون `Suspense` مع هيكل بديل أنيق يطابق المظهر العام للتطبيق.

---

## 6. قواعد الأداء والذاكرة (Performance Standards)

1. **التقليل من إعادة الرسم (Memoization):**
   - استخدام `React.memo` للمكونات التي تعتمد على عداد الثواني اللحظي مثل `ClockBlock` و `DateHeaderBlock`.
2. **تنظيف المؤقتات (Cleanup):**
   - يجب تنظيف كافة مؤقتات `setInterval` و `setTimeout` ومستمعات الأحداث `addEventListener` في دالة الإرجاع الخاصة بـ `useEffect`.
