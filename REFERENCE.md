# الدليل المرجعي الشامل لتطبيق «همّتي» (Master Reference Index)

---

مرحباً بك في الدليل المرجعي الفني والتنفيذي الشامل لمشروع وتطبيق **«همّتي» (Hemmaty)**. تم تقسيم التوثيق المرجعي إلى **ستة أجزاء مفصلة ومستقلة** تغطي كافة الجوانب المعمارية، الحسابية، الأصلية، والصوتية للتطبيق.

---

## 📚 فهرس المراجع التفصيلية (Reference Documents Index)

### 1️⃣ [البنية التحتية والأساس البرمجي (Architecture & Core)](./docs/reference/01_ARCHITECTURE_AND_CORE.md)
> يتناول المعمارية العامة للتطبيق (React + TypeScript + Vite + Capacitor)، هيكلية الملفات، محرك التخزين الآمن الوقائي (`src/utils/storage.ts`)، معالجة الأخطاء الشاملة (`ErrorBoundary`)، والتحميل الديناميكي الموزع (`React.lazy`).

### 2️⃣ [مواقيت الصلاة والحسابات الدينية (Prayer & Calculations)](./docs/reference/02_PRAYER_AND_CALCULATIONS.md)
> يشرح المحرك الرياضي لحساب مواقيت الصلاة (`prayerCalc.ts`)، طرق الحساب الفقهية والمذاهب، إدارة التاريخ المحلي واليوم الهجري (`prayerDayBoundary.ts`)، نموذج سجل الصلاة الشامل (`PrayerLog`)، تكييف الواجهة ليوم الجمعة، ونظام قضاء الفوائت.

### 3️⃣ [التكامل مع الأندرويد والخدمات الأصلية (Android & Native Integration)](./docs/reference/03_ANDROID_AND_NATIVE_PLUGINS.md)
> يتضمن التوثيق التفصيلي لإضافة أندرويد الأصلية (`AthanAlarmPlugin.kt`)، خدمة الأذان في الواجهة الأمامية (`AthanForegroundService.kt`)، استعادة الجدولة عند إعادة التشغيل (`AthanBootReceiver.kt`)، عامل الخلفية للتجديد (`ScheduleRenewalWorker.kt`)، ودجت الشاشة الرئيسية (`SalahWidgetProvider.kt`)، وإدارة الصلاحيات الحساسة (`SCHEDULE_EXACT_ALARM`).

### 4️⃣ [منظومة الإشعارات والصوتيات (Notification & Audio Systems)](./docs/reference/04_NOTIFICATION_AND_AUDIO_SYSTEMS.md)
> يستعرض الحل الآمن لمنشئ الإشعارات `sendLocalNotification` والدعم المزدوج للـ ServiceWorker ومتصفحات الجوال وسطح المكتب، محرك تشغيل الصوتيات والتلاوات (`useAthanPlayer.ts`)، إستراتيجية البدائل المحلية عند انقطاع الإنترنت، والتخزين الصوتي المحلي (`IndexedDB`).

### 5️⃣ [الوظائف والأقسام الإيمانية (Feature Modules)](./docs/reference/05_FEATURE_MODULES.md)
> يغطي الأذكار والسبحة الإلكترونية الحرة، المحرك الذكي لاقتراح الأذكار (`smartAdhkarEngine.ts`)، تتبع ورسم الختمات والمراجعة للقرآن الكريم، حاسبة الثلث الأخير وتتبع قيام الليل، بوصلة القبلة التفاعلية (`QiblaCompass.tsx`)، التقويم الهجري وأطوار القمر، والمنبهات الإيمانية والإحصائيات.

### 6️⃣ [واجهة المستخدم والنسخ الاحتياطي وإمكانية الوصول (UX, UI, Accessibility & Backup)](./docs/reference/06_UX_UI_AND_BACKUP.md)
> يشرح تصميم الشاشة الرئيسية ولوحة التحكم، نظام الزر العائم الذكي (`SmartFabSystem.tsx`)، هيكل وتنسيق ملف النسخ الاحتياطي (`Backup JSON Schema`) مع معايير الأمان، ومعايير إمكانية الوصول والتوافق مع قارئات الشاشة (`aria-label`).

---

## 🛠️ نظرة سريعة على أوامر التطوير والصيانة

| الأمر | الوصف |
| :--- | :--- |
| `npm run dev` | تشغيل خادم التطوير المحلي على البورت 3000 |
| `npm run build` | بناء وتجميع مشروع الـ Web والـ Assets المخصصة للإنتاج |
| `npm run lint` | الفحص البرمجي الكامل عبر `tsc --noEmit` للتحقق من سلامة الأنماط |
| `npx cap sync android` | مزامنة كود الـ Web المبني مع مشروع الأندرويد الأصلي |
