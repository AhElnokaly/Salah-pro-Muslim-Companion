# R12: حل مشكلة كتم صوت المنبه المخصص مع الخشوع (B3)

## 1. المشكلة والدليل (Problem & Evidence)
- **دليل فحص الجهاز (Test B - 2026-11-05):**
  - منبه المقارنة (بدون خشوع) سُمع بوضوح.
  - منبه الخشوع (مع `autoKhushu=true`) لم يُسمع نهائياً.
  - سجلات النظام وثقت: `ringerMode = SILENT (0)`، والفارق الزمني بين استلام المنبه وتفعيل الخشوع هو **239 ملي ثانية فقط**. النتيجة الموثقة في فحص B3: `SUPPORTS_HYPOTHESIS`.
- **السبب الجذري في الكود:**
  - في `AthanAlarmReceiver.kt`: كان يتم استدعاء `showCustomAlarmNotification(...)`، وبعده بـ 239ms مباشرة يُستدعى `KhushuRestoreReceiver.activateKhushuDirectly(...)`.
  - في `KhushuRestoreReceiver.kt`: يتم ضبط `audioManager.ringerMode = RINGER_MODE_SILENT` و`INTERRUPTION_FILTER_NONE`.
  - كتم رنين النظام في أندرويد يؤدي فوراً إلى كتم أو قطع نغمة الإشعار الصوتي التي تصدرها قناة الإشعار قبل أن يتمكن المستخدم من سماعها.

## 2. الحالة الفعلية الحالية (Current Status)
- **المرحلة الحالية (R12b مكتملة):**
  - تم ربط وتفعيل منطق القرار المجرد `CustomAlarmKhushuDecision` داخل المستقبلات الحية:
    1. `AthanAlarmReceiver.kt` (فرع `custom` فقط).
    2. `KhushuRestoreReceiver.kt` (معالجة `ACTION_ACTIVATE_KHUSHU_DEFERRED`).
- **تنبيه صريح وحاسم:**
  - مشكلة B3 **لم تُعلن محلولة (PASS)** برمجياً بعد؛ لأن التثبت النهائي من السلوك الصوتي على أندرويد وحل التعارض بين نغمة الإشعار وكتم الخشوع **مشروط حصرياً بفحص الجهاز الفعلي (Physical Device Verification - Test B)**.

## 3. تفاصيل التغييرات في الكود في R12b (What Changed by File & Lines)

### أ. `AthanAlarmReceiver.kt`
1. **استدعاء منطق القرار المجرد:**
   - استدعاء `CustomAlarmKhushuDecision.DecisionInput` وتمرير `durationMs` المقاس عبر `getSoundDurationMs(context, soundType)`.
   - استدعاء `CustomAlarmKhushuDecision.resolveOverlap` لحل التعارض مع أي منبه مؤجل سابق (A).
   - استدعاء `CustomAlarmKhushuDecision.evaluate` لتحديد توقيت وطريقة التفعيل.
2. **الجدولة المؤجلة والتراجع الآمن (Deferred Scheduling & Fallback):**
   - في المسار الصوتي: جدولة الخشوع بتأخير تقديري `delayMs = durationMs + 1500L` عبر `KhushuRestoreReceiver.scheduleDeferredKhushu`.
   - فحص صلاحية الأذونات الدقيقة `canScheduleExactAlarms()` لـ API 31+.
   - في حال فشل الجدولة أو إرجاع `null`: التراجع الفوري لتفعيل الخشوع مباشرة مع تسجيل `AUDIO_ERROR`.
   - في حال فشل `notify()` للإشعار: تسجيل `AUDIO_ERROR` وتفعيل الخشوع فوراً دون تركه معلقاً.
3. **حذف الكود الميت (Dead Code Cleanup):**
   - حذف دالة `playAlarmAudio(context, soundType)` بالكامل بعد إثبات عدم استدعائها في أي مكان بالمشروع عبر `grep`.
   - حذف متغير `lastSoundTriggerTimeMs` والـ debounce المرتبط به (15 ثانية).
4. **تسجيل الأحداث الحية عبر `AthanAlarmPlugin.logNativeEvent`:**
   - `AUDIO_START_REQUESTED`: يُسجل قبل إرسال الإشعار.
   - `NOTIFICATION_POSTED`: يُسجل بعد نجاح `notify()`.
   - `AUDIO_ERROR`: يُسجل عند فشل قياس الصوت، فشل الجدولة، أو فشل الإشعار.
   - `KHUSHU_DEFERRED`: يُسجل عند نجاح الجدولة المؤجلة مع `delayMs` و`isEstimated=true` والسبب.
   - `KHUSHU_ACTIVATED`: يُسجل عند التفعيل الفوري أو عند تراجع الفشل.
   - **ممنوع صراحة:** لم يتم تسجيل `AUDIO_STARTED` أو `AUDIO_COMPLETED` نهائياً لمسار الإشعارات.
5. **حماية مسار الأذان:**
   - فرع `alarmType == "athan"` وكلاس `AthanForegroundService.kt` لم يُمس منهما سطر واحد (0 تغيير).

### ب. `KhushuRestoreReceiver.kt`
1. **معالجة التفعيل المؤجل (`ACTION_ACTIVATE_KHUSHU_DEFERRED`):**
   - إضافة الثابت `CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE = 998878` مع أعلام `FLAG_UPDATE_CURRENT or FLAG_IMMUTABLE`.
   - إضافة دوال الإدارة: `scheduleDeferredKhushu`، `cancelDeferredKhushu`، و`hasPendingDeferredKhushu`.
2. **حارس عدم التكرار (Idempotency Guard):**
   - إذا وصل حدث التفعيل المؤجل والخشوع مفعّل بالفعل (`isKhushuActive`): يتم تجاهل الطلب وتسجيل `KHUSHU_ALREADY_ACTIVE` دون تصفير `KEY_ACTIVATED_AT` ودون تمديد المدة.
3. **حل التعارضات (Overlap Resolutions):**
   - `MAINTAIN_PENDING_A`: الحفاظ على تأجيل A عند وصول B بدون خشوع.
   - `PREEMPT_IMMEDIATE_B`: إلغاء تأجيل A وتفعيل B فوراً عند وصول B صامت/اهتزاز مع خشوع.
   - `RESCHEDULE_FOR_B`: إلغاء تأجيل A وإعادة الجدولة لـ B عند وصول B مسموع مع خشوع.

## 4. تصنيف الأدلة (Evidence Classification)
- `android/app/src/main/java/com/salahpro/app/plugins/CustomAlarmKhushuDecision.kt`: **`KOTLIN_STATIC`**
- `android/app/src/test/java/com/salahpro/app/plugins/CustomAlarmKhushuDecisionTest.kt`: **`KOTLIN_STATIC`**
- `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt`: **`KOTLIN_STATIC`**
- `android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt`: **`KOTLIN_STATIC`**
- `src/domain/khushu/customAlarmKhushuDecision.ts`: **`TS_SPEC_MIRROR`**
- `src/domain/khushu/customAlarmKhushuDecision.test.ts`: **`TS_SPEC_MIRROR`**
- `src/utils/prayerTimestamp.ts` & `src/utils/prayerTimestamp.test.ts`: **`TS_VERIFIED`**

## 5. بيانات صريحة ومخاطر متبقية (Explicit Disclaimers & Residual Risks)
1. **بناء أندرويد لم يتم محلياً:** بيئة الحاوية تفتقر لمحرك Java وGradle؛ كل كود Kotlin تم فحصه بالتحليل السكوني والمطابقة الدقيقة.
2. **تطابق نغمة القناة والصوت المقاس:** فرضية أن قناة الإشعار تشغل نفس ملف الـ raw المقاس مثبتة من كود التطبيق فقط. إذا قام المستخدم بتعديل صوت القناة يدوياً من إعدادات نظام أندرويد، فقد تختلف مدة التشغيل الفعلية عن المدة التقديرية.
3. **كتم `INTERRUPTION_FILTER_NONE` وتأثير وضع عدم الإزعاج (DND):**
   - لم يتم إثبات سلوك `INTERRUPTION_FILTER_NONE` عبر مختلف واجهات الشركات المصنعة (OEM Skins: Samsung OneUI, Xiaomi HyperOS/MIUI, Oppo ColorOS, Huawei EMUI).
   - في بعض الأجهزة، وضع `INTERRUPTION_FILTER_NONE` (Total Silence) يكتم حتى تدفق صوت المنبهات (`STREAM_ALARM` / `USAGE_ALARM`)، وفي أجهزة أخرى يُستثنى المنبه طبقاً لإعدادات المستخدم لـ DND.
   - هذا لا يمكن التحقق منه أو إثباته إلا بالفحص الفيزيائي المباشر على الأجهزة المستهدفة (`PHYSICAL_DEVICE_ONLY`).
4. **أوضاع الحفاظ على الطاقة وDoze Mode:** إطلاق المنبهات المؤجلة في وضع الخمول العميق (Doze) يعتمد على `setExactAndAllowWhileIdle`؛ وفي حال سحب صلاحية `SCHEDULE_EXACT_ALARM` على أندرويد 12+ سيتراجع النظام إلى `setAndAllowWhileIdle` مع احتمالية تأخير بضع ثوانٍ بسبب تجميع النظام.
5. **فقدان الخشوع المؤجل عند إعادة تشغيل الجهاز (Reboot):** الخشوع المؤجل بيضيع لو حصل reboot للجهاز أثناء فترة الثواني المعدودة لتأخير الصوت وقبل أن يشتغل المنبه، لعدم وجود إعادة جدولة للمنبه المؤجل عبر `BOOT_COMPLETED`.

## 6. خطوات التحقق على الجهاز الفعلي (Physical Device Verification Guide - For User)
لتنفيذ فحص التحقق على الجهاز في المرحلة القادمة:
1. بناء الـ APK وتثبيته على الجهاز.
2. فتح التطبيق وضبط "منبه مخصص" بصوت مسموع (مثلاً صوت التكبير أو التذكير مدته 3-5 ثوانٍ) مع تفعيل خيار "وضع الخشوع التلقائي" (`autoKhushu = true`).
3. إغلاق التطبيق وقفل الشاشة، والانتظار حتى إطلاق المنبه.
4. **الملاحظة السمعية:**
   - هل سُمع صوت نغمة المنبه بالكامل ودون انقطاع؟
   - هل تفعّل وضع الخشوع (كتم الصوت وظهور إشعار الخشوع) **بعد** انتهاء نغمة المنبه بهامش الأمان المقدر؟
5. فتح واجهة تشخيصات الأذان (`AthanDiagnosticsModal` / سجل الأحداث الأصلي):
   - التحقق من تسلسل السجلات: `fire_received` -> `AUDIO_START_REQUESTED` -> `NOTIFICATION_POSTED` -> `KHUSHU_DEFERRED (delayMs=..., estimated=true)` -> `KHUSHU_ACTIVATED`.
   - التأكد من عدم وجود كتم فوري بعد 239 ملي ثانية كما كان في فحص Test B السابق.

## 7. خطة التراجع (Rollback Plan)
في حال أظهر فحص الجهاز أي سلوك غير مرغوب:
- التراجع عن تعديلات R12b يتم عبر تطبيق `git revert` لكوميتات R12b بالترتيب العكسي (من الأحدث للأقدم):
  1. `fix(R12b): dynamic delayMs in fallback error log and finalize documentation`
  2. `fix(R12b): align custom logging without new events and dual-log fallback deferred khushu`
  3. `fix(R12b): align custom branch logging and pre/post alert baseline`
  4. `fix(R12b): remove custom overlap events, embed overlap in AUDIO_START_REQUESTED, and fix notify failure status`
  5. `feat(R12b): implement deferred khushu activation and event logging in receivers`
- هذا التراجع يعيد مستقبلي `AthanAlarmReceiver.kt` و`KhushuRestoreReceiver.kt` للحالة قبل أول commit من R12b.
- لا تتأثر مسارات الأذان الأساسية (`athan`) إطلاقاً لأنها معزولة تماماً في `AthanForegroundService`.

## 8. توثيق سلسلة الكوميتات المعتمدة (Commits Sequence Documentation)
- نظراً لطبيعة الحاوية المعزولة، يتم تتبع المراحل حصرياً برسائل الكوميتات دون الاعتماد على قيم hashes:
- **سلسلة الكوميتات برسائلها:**
  - كوميت الأساس: `chore: baseline before R13a`
  - كوميت: `feat(R13a): implement pure buildPrayerTimestampMs with timezone and carry handling`
  - كوميت: `feat(R12a): extract pure custom alarm khushu decision logic and tests`
  - كوميتات تنفيذ وتصحيحات R12b:
    - `feat(R12b): implement deferred khushu activation and event logging in receivers`
    - `fix(R12b): remove custom overlap events, embed overlap in AUDIO_START_REQUESTED, and fix notify failure status`
    - `fix(R12b): align custom branch logging and pre/post alert baseline`
    - `fix(R12b): align custom logging without new events and dual-log fallback deferred khushu`
    - `fix(R12b): dynamic delayMs in fallback error log and finalize documentation`
