# Hemmaty — Locked Architecture & Features Registry

هذا السجل يوثق الميزات والأنماط المعمارية المستقرة والمحققة بعد جولات التدقيق والاختبار، والتي يُحظر كسرها أو الرجوع عنها في التطوير المستقبلي.

---

## 1. المعرفات الحتمية وإلغاء المنبهات المستقلة (Deterministic Alarm IDs & Static Cancellation)
- **الحالة:** `[Verified: v4b]`
- **الملفات:**
  - `src/domain/notifications/AlarmIdentifier.ts`
  - `android/app/src/main/java/.../AthanAlarmPlugin.java`
  - `src/services/athanAlarmPlugin.ts`
- **القواعد:**
  - يتم توليد رمز الطلب `requestCode` بشكل حتمي من التاريخ واسم الصلاة/المنبه (Deterministic Hashing) لمنع تضارب المعرفات.
  - دالة `cancelSingleAlarmStatic` تلغي المنبه المستهدف بدقة دون الحاجة لإعادة جدولة أو مسح كافة منبهات اليوم.

---

## 2. تقسيم معمارية لوحة التحكم (Dashboard.tsx Modular Split)
- **الحالة:** `[Verified: v4b]`
- **الملفات:**
  - `src/components/Dashboard.tsx`
  - `src/components/dashboard/blocks/*`
  - `src/components/dashboard/registry/blockRegistry.ts`
  - `src/components/dashboard/DashboardBanners.tsx`
  - `src/components/dashboard/MainPrayerCardContainer.tsx`
- **القواعد:**
  - عدم إعادة تجميع منطق اللوحة في ملف واحد ضخم.
  - الحفاظ على كتل اللوحة (Blocks) مستقلة ومسجلة عبر الـ Registry.

---

## 3. تقسيم وحدة الأذكار والتسبيح (AdhkarTracker.tsx Modular Split)
- **الحالة:** `[Verified: v4b]`
- **الملفات:**
  - `src/components/AdhkarTracker.tsx`
  - `src/components/adhkar/*` (`DhikrStepCard.tsx`, `ElectronicTasbeeh.tsx`, `DhikrCelebration.tsx`, `DhikrFavoritesView.tsx`, `AdhkarFocusModal.tsx`, `DhikrCategoryDetailView.tsx`, `DhikrListItem.tsx`, `DhikrCategoryHeader.tsx`, `AdhkarHubView.tsx`)
- **القواعد:**
  - فصل منطق العداد، والتسبيح الإلكتروني، والمفضلة، وعرض الفئات في مكونات فرعية متخصصة.

---

## 4. تقسيم وحدة إدارة ومواقيت الصلاة (PrayerManager.tsx Modular Split)
- **الحالة:** `[Verified: v4b]`
- **الملفات:**
  - `src/components/PrayerManager.tsx`
  - `src/components/prayer/*` (`PrayerTimesView.tsx`, `PrayerTodayWorshipView.tsx`, `PrayerQadaView.tsx`, `PrayerWorshipView.tsx`, `PrayerAnalogClock.tsx`, `prayerUtils.ts`)
- **القواعد:**
  - فصل شاشات مواقيت الصلاة اليومية، وقضاء الفوائت، والسنن، والساعة التناظرية في مكونات فرعية.

---

## 5. الحماية الآمنة للتخزين المحلي (Storage Hardening)
- **الحالة:** `[Verified: v4b]`
- **الملفات:**
  - `src/utils/storage.ts`
  - كافة مكونات ومسارات القراءة والكتابة
- **القواعد:**
  - استخدام `safeGetItem`, `safeSetItem`, `safeGetJSON`, `safeSetJSON` لمنع انهيارات التخزين في حالات القيود الصارمة للمتصفحات.

---

## 6. الأمان النوعي الشامل (Full TypeScript Type Safety)
- **الحالة:** `[Verified: v4b]`
- **الملفات:**
  - `src/types.ts`
  - `src/components/dashboard/blocks/index.ts`
  - كافة مكونات اللوحة وإعدادات التطبيق
- **القواعد:**
  - منع استخدام `any` واستبداله بالواجهات الصريحة والأنواع المحددة (`AppSettings`, `DashboardTab`, `CardBlockSharedProps`, `ClockFaceType`, إلخ).

---

## 7. التنسيق الموحد للإشعارات (Unified Notification Orchestrator)
- **الحالة:** `[Verified: v6]`
- **التحقق:** `grep -n "AthanAlarm\." src/services/AlarmReconciliationService.ts` → صفر
  نتائج (كان سطر 80، 115). الاستبدال بـ `UnifiedNotificationOrchestrator.syncAllNotificationChannels`
  اتأكد فعليًا. باقي المراجع لـ `AthanAlarm`/`NotificationScheduler` هي طبقة أساسية
  (base layer) بيستخدمها الـ orchestrator نفسه، مش مسارات متوازية منافسة.
- **الملفات:**
  - `src/domain/notifications/UnifiedNotificationOrchestrator.ts`
  - ~~`src/domain/notifications/NotificationPlanner.ts`~~ — **محذوف نهائيًا (راجع بند 14، WP-01.4)**، كان dead code 100%. تحديث توثيقي فقط، لا يُعتبر كسر لهذا البند.
  - `src/services/NotificationScheduler.ts`
  - `src/services/AlarmReconciliationService.ts` (نقطتا الاستدعاء اتحوّلتا)
- **القواعد:**
  - توحيد قنوات إرسال وجدولة وإلغاء الإشعارات والتنبيهات بين نظام أندرويد الأصلي وخدمات الويب Service Worker.
  - أي كود جديد يحتاج جدولة/إلغاء تنبيه لازم يعدي عبر `UnifiedNotificationOrchestrator`، مش نداء مباشر لـ `AthanAlarm`.

### تحديث فرعي (v8) — إصلاح الإلغاء الفردي (كان مكسور تمامًا)
- **المشكلة المكتشفة:** `AlarmIdentifier.ts` كان بيستخدم خوارزمية FNV-1a مختلفة تمامًا
  عن `getDeterministicRequestCode` في `AthanAlarmPlugin.kt` (Java `hashCode`) — نفس
  الصلاة بتطلع رقمين مختلفين، فالإلغاء الفردي كان بيفشل بصمت (الـ `PendingIntent` في
  أندرويد مايتلغيش لأن الـ `requestCode` المرسل من JS مش مطابق للمسجل فعليًا).
- **الإصلاح:** `AlarmIdentifier.generateId()` بقى بورت حرفي (JS) لنفس خوارزمية Kotlin —
  نفس المدخلات (`prayerKey` + `timeMs` مبني على دقيقة)، نفس الهاش (`Math.imul(31, hash) + charCode`
  بديل JS المطابق لـ Java `String.hashCode()`)، نفس الصيغة النهائية.
- **الحالة:** `[Verified: v8]`
- **التحقق:**
  - `node -e '...AlarmIdentifier.generateId("Fajr", 1735689600000)...'` → `6288406`
    (اتأكد بحساب مستقل، مش بس نسخة الـ agent، ونفس الرقم).
  - محاكاة يدوية لخوارزمية Kotlin لنفس المدخلات → نفس الرقم `6288406` حرفيًا.
  - `grep -rn "AlarmIdentifier" src` (غير مفلتر) → استخدام في 3 ملفات بس، كلهم
    بالـ signature الجديد `(prayerKey, timeMs)`، صفر استخدام قديم متبقي.
  - `sha256sum` قبل/بعد → 3 ملفات اتغيرت بالظبط، مفيش ملف زيادة أو حذف.
- **الملفات:**
  - `src/domain/notifications/AlarmIdentifier.ts`
  - ~~`src/domain/notifications/NotificationPlanner.ts`~~ — محذوف نهائيًا، راجع بند 14.
  - `src/domain/notifications/UnifiedNotificationOrchestrator.ts`
- **قاعدة جديدة:** أي خوارزمية هاش/ID بتتولد في JS ولازم تتطابق مع native، لازم تكون
  بورت حرفي موثق (مش إعادة اختراع مستقلة) — ده كان سبب الباج الأصلي.

---

## 8. TypeScript strictNullChecks
- **الحالة:** `[Verified: v7]`
- **التحقق:** `grep -A1 "strict" tsconfig.json` → `"strictNullChecks": true` موجودة فعليًا.
- **الملف:** `tsconfig.json`

---

## 9. R8 Minify + Shrink Resources (Release Build)
- **الحالة:** `[Verified: v7]`
- **التحقق:** `grep -n "minifyEnabled\|shrinkResources\|proguard" android/app/build.gradle`
  → `minifyEnabled true`, `shrinkResources true`, `proguardFiles` بتشاور على
  `proguard-android-optimize.txt` + `proguard-rules.pro`. اتأكد كمان إن
  `android/app/proguard-rules.pro` موجود فعليًا (21 سطر) قبل القفل — لو كان مفقود،
  التفعيل كان هيبوّظ الـ release build.
- **الملف:** `android/app/build.gradle`

---

## 10. Storage Safety — صفر استخدام مباشر لـ localStorage
- **الحالة:** `[Verified: v6]`
- **التحقق:** `grep -rn "localStorage\.\(setItem\|getItem\|removeItem\)" src --include="*.ts" --include="*.tsx" | grep -v "safeSetItem\|safeGetItem\|StorageFacade\|storage.ts" | wc -l`
  → 0 (كان 108 في v5، 103 في v4b).
- **ملاحظة:** ده تحسن أشمل من المتوقع، حصل ضمن دفعة تعديلات storage واسعة في v5 مش
  اتفحصت ملف-بملف وقتها، لكن الرقم الإجمالي اتأكد.

---

## 11. Accessibility — Modal aria-label (دفعة 1 من 2)
- **الحالة:** `[Verified: v9]`
- **النطاق:** 9 من 18 modal (الدفعة الأولى).
- **التحقق:** عدّ `aria-label` مستقل لكل ملف، مطابق 100% للتقرير:
  FeatureTourModal=3, AppModal=1, PwaInstallModal=2, SpiritualSearchModal=4,
  PostOnboardingWelcomeModal=1, NightPrayersQuickLogModal=3, PrayerQuickLogModal=5,
  CustomNoticeModal=1, BadgesShowcaseModal=2.
- **الملفات:** الـ 9 المذكورة فوق (`src/components/*.tsx`).
- **القاعدة:** أيقونات بدون نص مرئي تاخد `aria-label` وصفي محدد بالعربي (مش عام).
  عناصر بنص مرئي واضح ما تاخدش `aria-label` مكرر.
- **تحديث (v11):** الدفعة الثانية (باقي ملفات الـ Modal) اتراجعت فعليًا وقُفلت —
  راجع بند 15.

---

## 12. Lazy Loading Resilience (safeLazy)
- **الحالة:** `[Verified: v9]`
- **المشكلة الأصلية:** نوافذ lazy-loaded كانت بتستدعى بشكل غير مشروط، فأي تعثر في
  تحميل chunk واحد كان بيوقف الـ ErrorBoundary التطبيق كله.
- **الإصلاح:** دالة `safeLazy` بتعيد محاولة تحميل الـ chunk تلقائيًا مرة واحدة قبل
  ما تفشل، + تحميل مشروط للنوافذ (بس وقت الفتح الفعلي).
- **التحقق:** `grep -rn "safeLazy" src` → الدالة نفسها في `src/utils/safeLazy.ts`،
  ومستخدمة في تحميل كل المكونات الرئيسية والنوافذ.
- **الملف:** `src/utils/safeLazy.ts`
- **تحديث (v11):** بعد تقسيم `App.tsx` (بند 15)، كل استدعاءات `safeLazy` انتقلت
  لملفين متخصصين (`src/components/layout/AppTabRouter.tsx` و
  `AppModalOutlets.tsx`) بدل ما تكون كلها جوه `App.tsx` — الدالة والسلوك نفسهم لم
  يتغيروا، النقل معماري بس. تم التحقق بـ `diff` بايت-لبايت إن `App.tsx` نفسه
  الآن **640 سطر** (كان 2000+، ثم 1025)، تحت الحد الحرج 800.

---

## 13. TypeScript Type Fixes — دفعة الأخطاء التسعة
- **الحالة:** `[Verified: v9]`
- **التحقق:** `npx tsc --noEmit` غير مفلتر → صفر أخطاء من الملفات الخمسة المستهدفة
  (`pushNotificationService.ts`, `NightPrayersQuickLogModal.tsx`,
  `PrayerHeatmapStats.tsx`, `DuhaQuickLogModal.tsx`,
  `UnifiedNotificationOrchestrator.ts`). تحديد نوع `PrayerTimeAlarm[]` صراحة،
  وحذف حقل `requestCode` غير المستخدم من `nativeAlarmsToSchedule.push()`.
- **ملاحظة:** 11 خطأ `spiritualAudioCtx is possibly 'null'` في `App.tsx` ظهروا
  في نفس الفحص — كانوا خارج نطاق هذه المهمة وقتها. راجع بند 15 لحالتهم الحالية.

---

## 14. توحيد المعرّف الكانوني للصلاة عبر دومين الإشعارات (prayerKey Canonicalization — WP-01)
- **الحالة:** `[Verified: v10]`
- **السياق:** نفس الصلاة كانت بتتكتب بـ3 صيغ مختلفة لـ`prayerKey` حسب مين بعتها
  (`day_0_fajr` من مسار الـ60 يوم، `Fajr` من `UnifiedNotificationOrchestrator`،
  `renewed_N_fajr` من `ScheduleRenewalWorker`)، فالـ`requestCode` كان بيطلع مختلف
  تمامًا بين المسارات → إلغاء فردي بيفشل بصمت لأي صلاة متجدولة عبر المسار الرئيسي.
- **التحقق (مستقل، من zip مباشرة، مش من تقرير الـ agent):**
  - `grep -n "prayerCanonicalNames" src/services/athanAlarmPlugin.ts` → mapping
    فعلي بيحوّل كل المفاتيح لـ`Fajr/Dhuhr/Asr/Maghrib/Isha`، صفر `day_N_` باقي
    في `prayerKey` الفعلي.
  - `grep -n "canonicalPrayerNames" android/.../ScheduleRenewalWorker.kt` → نفس
    الـ mapping بالضبط في Kotlin، صفر `renewed_` باقي.
  - `grep -n "999999\|scheduleTestAlarm" src/services/AlarmReconciliationService.ts`
    → السطر الفعلي موجود: `id: 1` + تعليق صريح يذكر نطاقي `[1,999]` و
    `[1000, 10000999]` باسم `getDeterministicRequestCode`.
  - `test -f src/domain/notifications/NotificationPlanner.ts` → غير موجود.
    `grep -rn "NotificationPlanner" src` → صفر استدعاء في أي مكان.
  - اختبار القبول: حساب `requestCode` يدويًا لـ`"Fajr"` بنفس `timeMs` عبر خوارزمية
    `AlarmIdentifier.ts` (JS) وخوارزمية `getDeterministicRequestCode` (Kotlin) →
    تطابق تام (نفس الرقم من المسارين).
- **الملفات:**
  - `src/services/athanAlarmPlugin.ts`
  - `android/app/src/main/java/com/salahpro/app/plugins/ScheduleRenewalWorker.kt`
  - `src/services/AlarmReconciliationService.ts`
  - `src/domain/notifications/AlarmIdentifier.ts` / `AthanAlarmPlugin.kt`
- **القواعد:**
  - `prayerKey` الكانوني = الاسم الخام فقط بدون أي prefix/suffix: `Fajr` | `Dhuhr`
    | `Asr` | `Maghrib` | `Isha`. التاريخ يُمثَّل حصرًا في `timeMs`، مش في الاسم.
  - ممنوع أي صيغة `day_N_fajr` أو `renewed_N_fajr` في أي مسار كتابة جديد.
  - نطاقات ID محجوزة وغير قابلة للتداخل: `[1, 999]` اختبار فقط، `[1000, 10000999]`
    صلوات حقيقية عبر `getDeterministicRequestCode`.

---

## 15. إغلاق دومين الإشعارات بالكامل + تقسيم App.tsx + مراجعة aria-label الكاملة
- **الحالة:** `[Verified: v11]`
- **التحقق (مستقل، من zip مباشرة، بما فيه `npx tsc --noEmit` مُشغَّل فعليًا مش
  منسوخ من تقرير):**

### 15.1 — WP-01.5: `NotificationScheduler.schedule()` (كان آخر فجوة مفتوحة في دومين الإشعارات)
  - ملف مشترك جديد `src/domain/notifications/prayerCanonicalNames.ts` بيصدّر
    نفس الـmapping، و`athanAlarmPlugin.ts` بقى بيستورد منه بدل نسخة محلية.
  - `NotificationScheduler.schedule()`: الـ`numericId` الميت اتشال، و`prayerKey`
    بقى بيتحول كانوني (`prayerCanonicalNames[rawTag.toLowerCase()] || rawTag`)
    قبل الإرسال للـ native.
  - **`diff` بايت-لبايت** على الأربعة ملفات المقفولة في بند 14
    (`ScheduleRenewalWorker.kt`, `AlarmReconciliationService.ts`,
    `AlarmIdentifier.ts`, `AthanAlarmPlugin.kt`) → **صفر تغيير**، مفيش كسر لبند
    14.
  - **دومين الإشعارات (prayerKey canonicalization) مقفول بالكامل الآن** — بند
    14 + 15.1 مع بعض = صفر فجوات معروفة.

### 15.2 — تقسيم `App.tsx`
  - `wc -l src/App.tsx` → **640 سطر** (كان 1025، وقبلها 2000+).
  - 4 ملفات جديدة: `AppTabRouter.tsx` (349 سطر)، `AppModalOutlets.tsx` (193)،
    `AppBanners.tsx` (128)، `AppFeedbackOverlays.tsx` (73)،
    `useAppGlobalEvents.ts` (187)، `useAppSync.ts` (150) — كلهم تحت حد التحذير
    500 سطر.
  - `safeLazy` (بند 12) اتأكد إنه لسه شغال بالضبط، بس اتنقل لملفين متخصصين —
    راجع تحديث بند 12.
  - أخطاء `spiritualAudioCtx is possibly 'null'` (11 خطأ، بند 13) — لم تعد
    موجودة بعد التقسيم (اتأكد بـ `tsc --noEmit` كامل صفر أخطاء).

### 15.3 — مراجعة `aria-label` الحقيقية (تُغلق الدفعة الثانية من بند 11)
  - مراجعة يدوية فعلية (مش عدّ بس) لكل زرار في ملفات الـ Modal المتبقية —
    تأكيد إن كل زرار إما له نص مرئي واضح أو `aria-label` مناسب.
  - إضافة فعلية واحدة: `aria-label` لعنصر الـ dialog نفسه في
    `DuhaQuickLogModal.tsx`.
  - **دفعة 2 من بند 11 مقفولة الآن.**

- **`npx tsc --noEmit` (مستقل، الكود كامل، غير مفلتر):** صفر أخطاء.
- **الملفات المتأثرة الكلية:**
  - `src/domain/notifications/prayerCanonicalNames.ts` (جديد)
  - `src/services/athanAlarmPlugin.ts`
  - `src/services/NotificationScheduler.ts`
  - `src/App.tsx`
  - `src/components/layout/AppTabRouter.tsx` (جديد)
  - `src/components/layout/AppModalOutlets.tsx` (جديد)
  - `src/components/app/AppBanners.tsx` (جديد)
  - `src/components/app/AppFeedbackOverlays.tsx` (جديد)
  - `src/components/app/useAppGlobalEvents.ts` (جديد)
  - `src/components/app/useAppSync.ts` (جديد)
  - `src/components/DuhaQuickLogModal.tsx`
- **القواعد:**
  - أي مسار جديد لجدولة/إلغاء تنبيه لازم يستخدم `prayerCanonicalNames`
    (نفس ملف بند 14/15.1)، ممنوع تكرار الـmapping في ملف تالت.
  - `App.tsx` دوره تنسيقي (orchestration) بس — منطق تفصيلي جديد يروح لملف فرعي
    مخصص، مش يترّاكم في `App.tsx` نفسه.
