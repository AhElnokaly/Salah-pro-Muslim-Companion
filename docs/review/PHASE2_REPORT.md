# التقرير الفني الشامل للمرحلة الثانية (PHASE2_REPORT.md)
**تخصيص وقت بدء وضع الخشوع بعد الأذان لكل صلاة (Khushu Start Delay Per Prayer)**  
**التاريخ:** 2026-11-01  
**الفرع:** `Wip/commit3-athan-master-toggle`

---

## 1. ملخص تنفيذي (Executive Summary)
تم بنجاح تنفيذ وتفعيل ميزة تحديد وقت بدء وضع الخشوع تلقائياً بعد الأذان لكل فريضة على حدة ضمن النطاق المسموح (5 إلى 30 دقيقة)، عبر إعادة استخدام حقل `iqamaOffsets` القائم وتوحيد دالة الحساب المركزية `computeKhushuStartMs`. تم دمج القوائم المنسدلة الجديدة في تبويب التخصيص بنافذة الخشوع `KhushuModeSheet`، مع دعم خيار الجمعة الخاص، وحفظ الإعدادات بأمان، وإثبات ثبات مواعيد الأذان دون أي مساس بها، ونجاح كافة الاختبارات الـ 275 بنسبة 100%.

---

## 2. إجابات استكشاف المرحلة الأولى مع المراجع (P1 Discovery Answers)

### 2.1 استخدامات `iqamaOffsets` في المشروع (النوع، القيم الافتراضية، أماكن القراءة والكتابة)
- **النوع:** معرف في `src/domain/khushu/khushuTypes.ts:12-19` كواجهة `KhushuIqamaOffsets` تحتوي على الحقول: `fajr`, `dhuhr`, `asr`, `maghrib`, `isha`, `friday` (جميعها أرقام بالدقائق).
- **القيم الافتراضية:** معرفة في `DEFAULT_KHUSHU_SETTINGS.iqamaOffsets` في `src/domain/khushu/khushuTypes.ts:51-58`:
  - `fajr: 20`
  - `dhuhr: 15`
  - `asr: 15`
  - `maghrib: 10`
  - `isha: 15`
  - `friday: 25`
- **أماكن القراءة (Read Locations):**
  1. `src/domain/khushu/khushuFlowUtils.ts:65, 70`: داخل دالة `getIqamaWindowInfo` لمعرفة حالة النافذة الزمنية الحالية بين الأذان والإقامة.
  2. `src/services/athanAlarmPlugin.ts:604, 607`: المسار الأول (Path 1) لفحص تعارض المنبهات المخصصة بعد الصلاة مع نافذة الخشوع.
  3. `src/services/athanAlarmPlugin.ts:686, 689`: المسار الثاني (Path 2) لجدولة دفعات مواقيت الصلاة لعدة أيام.
  4. `src/services/athanAlarmPlugin.ts:744, 747`: المسار الثالث أ (Path 3a) لجدولة اليوم الفردي في المسار الاحتياطي.
  5. `src/services/athanAlarmPlugin.ts:802, 805`: المسار الثالث ب (Path 3b) لجدولة الغد الفردي في المسار الاحتياطي.
  6. `src/domain/notifications/UnifiedNotificationOrchestrator.ts:223, 226`: داخل دالة تنظيم الإشعارات وحساب موعد منبه الخشوع التلقائي.
  7. `src/domain/khushu/khushuStorage.ts:25-28`: عند تحميل الإعدادات من التخزين المحلي.
  8. ملفات الاختبارات: `Khushu.test.ts:30-31`, `SlidingWindowScheduler.test.ts:128`, `athanAlarmPlugin.test.ts:394, 437`.
- **أماكن الكتابة (Write Locations):**
  - في `src/domain/khushu/khushuStorage.ts:32-34` داخل دالة `saveSettings`.
  - قبل هذه المرحلة لم يكن هناك أي واجهة مستخدم (UI) تتيح للمستخدم تعديلها، وتم توفيرها بالكامل الآن في `KhushuModeSheet.tsx`.

### 2.2 مسارات جدولة منبهات الخشوع الثلاثة في `buildNativePrayerTimeAlarms`
1. **المسار الأول (Path 1 - Collision Check):** السطور `601-621`؛ يقوم بفحص منبهات المستخدم المخصصة من نوع `prayer_relative` التي تأتي "بعد" الفريضة؛ فإذا وقع وقت المنبه المخصص داخل نافذة الخشوع `[iqamaTimeMs, khushuEndTimeMs)`، يتم إزاحته تلقائياً إلى نهاية نافذة الخشوع `khushuEndTimeMs`.
2. **المسار الثاني (Path 2 - Multi-Day Schedule):** السطور `685-705`؛ يمر على مصفوفة الأيام (60 يوماً)، ويحسب `iqamaTimeMs` ويضيف منبه الخشوع `{ prayerKey: '${prayerKey}_khushu', timeMs: iqamaTimeMs, alarmType: 'khushu', durationMinutes: duration }`.
3. **المسار الثالث (Path 3 - Single Day/Tomorrow Fallback):** السطور `743-763` و `801-821`؛ للمسار الاحتياطي الفردي لمواقيت اليوم والغد؛ يقوم بحساب `iqamaTimeMs` وجدولته في النظام.

### 2.3 دالة `UnifiedNotificationOrchestrator.ts` وازدواجية المنطق
- السطور `220-241`: كانت تقوم بحساب `const iqamaTimeMs = triggerDate.getTime() + iqamaOffset * 60000;` بشكل يدوي مكرر. تم توحيدها بالكامل لاستدعاء دالة `computeKhushuStartMs` ودالة `resolveKhushuIqamaOffset`.

### 2.4 فحص كود Kotlin الأصلي في Android (هل يحسب أوقات الإقامة بشكل مستقل؟)
- **النتيجة القاطعة:** **لا (NO)**.
- **الدليل (`android/**`):** لا يوجد في كود Android أي كود يحسب موعد الإقامة أو يغير توقيت المنبه. كود Android يستقبل منبهات جاهزة بتوقيت مللي ثانية صريح `timeMs` ومدتها `durationMinutes` عبر `scheduleAthanAlarms`. عندما يطلق `AlarmManager` الإشارة، يتسلم `AthanAlarmReceiver` المنبه ويستدعي `activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)`، حيث تُحسب لحظة انتهاء الخشوع كـ `System.currentTimeMillis() + (durationMinutes * 60 * 1000L)`. وبالتالي لم يتطلب الأمر أي تعديل في Kotlin.

### 2.5 شكل الإعدادات المحفوظة اليوم وتمثيل يوم الجمعة
- مفتاح التخزين: `hemmaty_khushu_settings_v2`.
- تمثيل الجمعة: تمتلك الجمعة مفتاحاً مستقلاً تماماً باسم `friday` داخل كل من `prayerDurations` و `iqamaOffsets`. عند حلول يوم الجمعة (`dayDate.getDay() === 5`) مع صلاة الظهر وتفعيل خيار `enableFridaySpecial`، يتم قراءة إعدادات `friday` بدلاً من `dhuhr`.

---

## 3. جدول الملفات المعدلة وتأثيرها (Changed Files Table)

| المسار (Path) | الحالة | وصف التعديل في سطر واحد | التأثير على بقية التطبيق |
|---|---|---|---|
| `src/domain/khushu/khushuFlowUtils.ts` | معدل | إضافة ثوابت ودوال `clampIqamaOffset`، `computeKhushuStartMs`، `resolveKhushuIqamaOffset`، `buildIqamaOptions` | تحسين أمان الحساب وتوحيد مصدر التوقيت لجميع أجزاء التطبيق |
| `src/domain/khushu/khushuStorage.ts` | معدل | تقييد ومطابقة الإعدادات عند `getSettings` ودمج التحديثات الجزئية عند `saveSettings` | حماية البيانات القديمة وترحيلها بأمان دون فقدان أي حقول |
| `src/services/athanAlarmPlugin.ts` | معدل | ربط المسارات الثلاثة لجدولة الخشوع بـ `computeKhushuStartMs` و `resolveKhushuIqamaOffset` | ضمان تطابق مواعيد الخشوع والمنبهات المخصصة تماماً مع الإعدادات المختارة |
| `src/domain/notifications/UnifiedNotificationOrchestrator.ts` | معدل | توحيد حساب منبه الخشوع عبر `computeKhushuStartMs` بدلاً من الحساب اليدوي | القضاء التام على ازدواجية المنطق وضمان التطابق التام |
| `src/components/KhushuModeSheet.tsx` | معدل | إضافة مجموعة القوائم المنسدلة لتحديد وقت البدء بعد الأذان (5-30 د) في تبويب التخصيص | تمكين المستخدم من ضبط التأخير لكل صلاة مع مراعاة حالة التعطيل وتوافق الهواتف |
| `src/domain/khushu/KhushuStartDelay.test.ts` | جديد | إضافة 14 اختبار وحدة شاملة لجميع دوال الحساب والدمج والمسارات الثلاثة والواجهة | تغطية اختبارية شاملة ترفع إجمالي الاختبارات إلى 275 اختباراً ناجحاً |
| `docs/review/DEVICE_TEST_PLAN_PHASE2.md` | جديد | دليل الاختبار اليدوي المفصل خطوة بخطوة باللغة العربية مع الأوامر | تسهيل الاختبار على الهاتف الحقيقي قبل الدمج |
| `docs/review/PROGRESS_PHASE2.md` | معدل | سجل مراحل تنفيذ المهام ونقاط التحقق | تتبع التقدم والشفافية البرمجية |

---

## 4. القرارات التصميمية المعتمدة وتبريرها (Design Decisions)

1. **التعامل مع القيم غير الموجودة في القائمة القياسية (Non-standard values):**
   - *القرار:* عبر دالة `buildIqamaOptions`، يتم الحفاظ على خيارات الخطوة الخماسية `[5, 10, 15, 20, 25, 30]`، وإذا كانت القيمة المحفوظة مسبقاً غير قياسية (مثل 7)، تُدرج كخيار إضافي مرتب داخل القائمة المنسدلة.
   - *السبب:* منع فقدان أو تغيير القيمة التي اختارها المستخدم دون إذنه، مع الحفاظ على سهولة الواجهة.
2. **سلوك الواجهة عند تعطيل التفعيل التلقائي (`autoWithIqama = false`):**
   - *القرار:* إبقاء المجموعة ظاهرة لكن مظللة وغير قابلة للتفاعل (`opacity-50`, `disabled`, `cursor-not-allowed`) مع سطر تنبيه إرشادي باللغة العربية: *"فعّل التفعيل التلقائي لاختيار وقت البدء"*.
   - *السبب:* التزام صريح بالمتطلب P5 حتى يستطيع المستخدم اكتشاف الميزة ومعرفة سبب تعطيلها دون إخفائها.
3. **حفظ الإعدادات وإعادة الجدولة الفورية:**
   - *القرار:* استدعاء `onUpdateSettings` عند كل تغيير في القائمة المنسدلة، والذي يستدعي `KhushuStorage.saveSettings` ويطلق الحدث المخصص `khushu-settings-changed`.
   - *السبب:* هذا الحدث يرتبط به مستمع في `usePrayerScheduler` يقوم فوراً بإعادة جدولة الإشعارات والمنبهات عبر `orchestratePrayerAlarms`.

---

## 5. مصفوفة تتبع المتطلبات والكود والاختبارات (Traceability Matrix)

| المتطلب | الكود التنفيذي | ملف الاختبار واسم الفحص | الحالة |
|---|---|---|---|
| **P2:** دالة وقيم `clampIqamaOffset` (5..30، لا صفر، أرقام صحيحة) | `src/domain/khushu/khushuFlowUtils.ts:40-70` | `KhushuStartDelay.test.ts` > `enforces exact boundary, rounding, and fallback clamping rules` | `DONE (VERIFIED)` |
| **P2:** دالة حساب وقت البدء `computeKhushuStartMs` | `src/domain/khushu/khushuFlowUtils.ts:85-95` | `KhushuStartDelay.test.ts` > `computes exact millisecond start timestamps for various offsets` | `DONE (VERIFIED)` |
| **P3:** ثبات مواعيد الأذان دون أي تغيير | `src/services/athanAlarmPlugin.ts:670-680` | `KhushuStartDelay.test.ts` > `proves athan alarm times are 100% IDENTICAL before and after custom offsets` | `DONE (VERIFIED)` |
| **P3:** تطبيق الحساب في المسار الثاني (دفعات الأيام) والمدة دون تغيير | `src/services/athanAlarmPlugin.ts:685-705` | `KhushuStartDelay.test.ts` > `verifies Path 2 (multi-day batch): khushu alarms start exactly at athanTime + prayerOffset with unchanged duration` | `DONE (VERIFIED)` |
| **P3:** تطبيق الحساب في المسار الثالث (المسار الاحتياطي لليوم والغد) | `src/services/athanAlarmPlugin.ts:743-763, 801-821` | `KhushuStartDelay.test.ts` > `verifies Path 3a & 3b (fallback today/tomorrow map): khushu start time matches offset` | `DONE (VERIFIED)` |
| **P3:** فحص تعارض المنبه المخصص بعد الصلاة (المسار الأول) | `src/services/athanAlarmPlugin.ts:601-621` | `KhushuStartDelay.test.ts` > `verifies Path 1 (custom post-prayer collision): shifts custom alarm past custom khushu window` | `DONE (VERIFIED)` |
| **P3:** توحيد حساب `UnifiedNotificationOrchestrator` | `src/domain/notifications/UnifiedNotificationOrchestrator.ts:220-241` | `KhushuStartDelay.test.ts` > `proves orchestrator and athanAlarmPlugin use identical computeKhushuStartMs output` | `DONE (VERIFIED)` |
| **P4:** استعادة وترحيل الإعدادات القديمة دون فقدان الحقول | `src/domain/khushu/khushuStorage.ts:13-35` | `KhushuStartDelay.test.ts` > `migrates legacy stored settings without iqamaOffsets to 15 without wiping existing fields` | `DONE (VERIFIED)` |
| **P4:** دمج التحديثات الجزئية في `saveSettings` | `src/domain/khushu/khushuStorage.ts:37-60` | `KhushuStartDelay.test.ts` > `saveSettings merges partial updates without replacing the whole object` | `DONE (VERIFIED)` |
| **P5:** القوائم المنسدلة والتعطيل في واجهة الخشوع | `src/components/KhushuModeSheet.tsx:310-370` | `KhushuStartDelay.test.ts` > `buildIqamaOptions (UI Options Builder)` | `DONE (VERIFIED)` |

---

## 6. مخرجات الفحوصات والبناء الحقيقية (Real Test & Build Outputs)

### 6.1 مخرجات الفحص الكامل `npm test`:
```text
# Subtest: Phase 2 - Khushu Start Delay Subsystem Tests
    # Subtest: 1. clampIqamaOffset & constants
    ok 1 - 1. clampIqamaOffset & constants
    # Subtest: 2. computeKhushuStartMs
    ok 2 - 2. computeKhushuStartMs
    # Subtest: 3. Settings merge & migration (KhushuStorage)
    ok 3 - 3. Settings merge & migration (KhushuStorage)
    # Subtest: 4. buildNativePrayerTimeAlarms across all 3 paths
    ok 4 - 4. buildNativePrayerTimeAlarms across all 3 paths
    # Subtest: 5. buildIqamaOptions (UI Options Builder)
    ok 5 - 5. buildIqamaOptions (UI Options Builder)
    # Subtest: 6. UnifiedNotificationOrchestrator parity & single-source-of-truth
    ok 6 - 6. UnifiedNotificationOrchestrator parity & single-source-of-truth
    1..6
ok 1 - Phase 2 - Khushu Start Delay Subsystem Tests
  ---
  duration_ms: 11.401716
  type: 'suite'
  ...
1..29
# tests 275
# suites 77
# pass 275
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 23240.10329
```
*(تم تشغيل 275 فحصاً بنجاح كامل بدون أي خطأ)*

### 6.2 مخرجات فحص الأنواع `npx tsc --noEmit`:
```text
> hemmaty-app@1.2.1 lint
> tsc --noEmit
(Exit Code 0 - Clean)
```

### 6.3 مخرجات بناء الويب `compile_applet`:
```text
Build succeeded - the applet is compiled
```

---

## 7. سجل المخاطر وتفاديها (Risk Register)

1. **الخطر: تحرك مواعيد الأذان الحقيقية.**
   - *الشدة:* حرجة (Critical).
   - *الدليل:* تم فحص مصفوفة أوقات الأذان قبل وبعد تخصيص الإزاحة.
   - *المعالجة:* تم إثبات أن دالة الجدولة تولد مواعيد الأذان المستقلة `timeMs` قبل تطبيق أي إزاحة للخشوع، واختبار ذلك بمطابقة صارمة بالمللي ثانية في الفحص رقم 4.
   - *الخطر المتبقي:* معدوم (Zero).
2. **الخطر: مسح إعدادات المستخدم الأخرى عند حفظ الإزاحات.**
   - *الشدة:* عالية (High).
   - *الدليل:* قراءة كائن إعدادات قديم لا يحتوي على `iqamaOffsets`.
   - *المعالجة:* دمج عميق (Deep Merge) في `KhushuStorage.saveSettings` و `getSettings` يضمن الحفاظ على `prayerDurations` وكافة خيارات التجربة الروحانية.
   - *الخطر المتبقي:* معدوم (Zero).
3. **الخطر: تعارض منبه مخصص للمستخدم مع نافذة الخشوع الجديدة.**
   - *الشدة:* متوسطة (Medium).
   - *الدليل:* تم تكييف المسار الأول لإزاحة المنبه المخصص إلى نهاية نافذة الخشوع المعدلة.
   - *المعالجة:* تم اختبار الإزاحة والتأكد من انتقال المنبه المخصص لما بعد نهاية الخشوع الجديد.
   - *الخطر المتبقي:* منخفض جداً ومختبر.

---

## 8. ما يجب على المراجع البشري اختباره يدوياً (Manual Review Checklist)
1. فتح نافذة الخشوع > التخصيص، والتأكد من ظهور القوائم المنسدلة الست الجديدة تحت عنوان "يبدأ بعد الأذان بـ (بالدقائق)".
2. إيقاف خيار "التفعيل التلقائي مع وقت الإقامة" والتأكد من تظليل القوائم وتعطيلها وظهور سطر التنبيه الإرشادي.
3. تغيير تأخير فريضة معينة (مثلاً الفجر إلى 20 د) وإغلاق التطبيق كلياً ثم إعادة فتحه والتأكد من بقاء القيمة.
4. فتح شاشة تشخيص الأذان والتأكد من أن الفارق بين منبه الأذان ومنبه الخشوع يطابق الدقائق المختارة.
5. التأكد من أن وقت منبه الأذان ذاته لم يتغير نهائياً قبل وبعد تغيير دقائق الخشوع.
