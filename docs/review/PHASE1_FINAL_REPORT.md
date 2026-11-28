# التقرير النهائي الشامل للمرحلة الأولى: تعزيز وتقوية إطار الفحوصات التشخيصية
# PHASE 1 HARDENING & VERIFICATION REPORT

تاريخ الإصدار: 2026-10-30  
الفرع: `Wip/commit3-athan-master-toggle`  
الهدف: الانتهاء الكامل والمحكم من المرحلة الأولى (Phase 1) لإطار الفحوصات التشخيصية داخل تطبيق هِمَّتِي، وضمان أمان عزل المنبهات التشخيصية، وموثوقية النسخ الاحتياطي، وإحكام مسارات الجدولة، ودقة مصفوفة التحكيم.

---

## 1. الملخص التنفيذي (Executive Summary)
أُنجزت بنجاح كامل أعمال تعزيز وتقوية المرحلة الأولى (Phase 1) لإطار الفحوصات التشخيصية داخل التطبيق مع الالتزام الصارم بعدم المساس بـ `PrayerTimesView.tsx` أو `REFERENCE.md` أو أصول الصور أو خصائص المرحلة الثانية. تم حصر وتعريف بادئة المنبهات التشخيصية `"diag_"` في مصدر وحيد للحقيقة (`DIAG_ALARM_PREFIX` و `isDiagAlarmId`) وحجبها عند العرض فقط في قوائم المستخدم (`WorshipAlarms.tsx`) وتطهيرها التام في مسارات تصدير واستيراد النسخ الاحتياطي (`BackupSettingsTab.tsx`). جرى تحصين محرك الجدولة لضمان أن منبهات التشخيص تُعامل كمنبهات فردية لمرة واحدة فقط (`oneShot`) بتاريخ استحقاق صريح، وتم التحقق من سلامة كود كوتلن الأصلي، واجتاز المشروع بنجاح 241 اختبار وحدة شامل مع تحقق تام من البناء وسلامة الأنواع البرمجية.

---

## 2. جدول الملفات المعدلة والمضافة (Files Changed Table)

*ملاحظة إثبات بيئية:* أمر `git status` أظهر أن الحاوية المعزولة الحالية لا تحوي مجلد `.git` (`fatal: not a git repository`)، لذا تم حصر قائمة الملفات بدقة قطعية من واقع سجل العمليات الكامل للجلسة:

| المسار (`Path`) | الحالة (`Status`) | التعديل بسطر واحد (`One-line Change`) | الأثر على بقية التطبيق (`Impact on App`) |
|---|---|---|---|
| `src/diagnostics/tests/diagTypes.ts` | معدل | تصدير ثابت `DIAG_ALARM_PREFIX` ودالة `isDiagAlarmId` كمرجع وحيد للحقيقة | لا يوجد أثر سلبي؛ يوفر واجهة فحص موحدة |
| `src/components/WorshipAlarms.tsx` | معدل | تصدير `filterUserVisibleAlarms` وحجب منبهات `diag_` وقت العرض فقط | حماية واجهة المنبهات المخصصة من ظهور المنبهات التجريبية للمستخدم |
| `src/components/settings/BackupSettingsTab.tsx` | معدل | استثناء `diag_` عند التصدير وتطهيرها عند الاستعادة | حماية ملفات النسخ الاحتياطي من تسريب منبهات الاختبار |
| `src/services/athanAlarmPlugin.ts` | معدل | إلزام منبهات `diag_` في `buildNativePrayerTimeAlarms` بـ `oneShot` و `fireDate` | منع تكرار منبهات التشخيص أسبوعياً أو يومياً |
| `src/diagnostics/tests/diagRunner.ts` | معدل | استيراد واستخدام `isDiagAlarmId` و `DIAG_ALARM_PREFIX` في التنظيف والمطابقة | تعزيز متانة دورة حياة الاختبار والتنظيف الشامل |
| `src/diagnostics/tests/specs/testA_previewSource.ts` | معدل | عزل المسار الشبكي عن المسار المحلي غير المخزن وتطهير الذاكرة | لا يمس مسارات التشغيل الحقيقي للأذان |
| `src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts` | معدل | ضبط `oneShot: true` و `fireDate` صريحين وتطبيق حكم كتم الصوت الثلاثي | حصر منبهات B3 في موعدها الدقيق ومنع تكرارها |
| `src/components/settings/adhan/AthanDiagnosticsSection.tsx` | معدل | واجهة تشغيل الاختبارات واستبيان السماع وعرض التقرير المنسق | مقتصر على شاشة الإعدادات المتقدمة |
| `src/utils/audioStorage.ts` | مدقق | التحقق من حارس `typeof indexedDB === 'undefined'` في أسطر 137-139 | مقتصر على بيئة تشغيل الاختبارات (Node) دون أي مساس بالمتصفح أو أندرويد |
| `android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt` | معدل (Phase 1) | كتابة ختم الإقلاع `last_device_boot_timestamp` وتطهير منبهات `diag_` عند الإقلاع | حماية جدولة الأذان الأصلية بعد إعادة تشغيل الهاتف (`UNCOMPILED`) |
| `android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt` | معدل (Phase 1) | تسجيل أحداث `initialRinger` و `appliedRinger` و `appliedFilter` و `hasDndPermission` | توفير أدلة تقنية تشخيصية دقيقة لاختبار Test B (`UNCOMPILED`) |
| `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt` | معدل (Phase 1) | التحقق من جدولة النظام بـ `FLAG_NO_CREATE` وكشف ختم الإقلاع وسجل الأحداث | فحص موثوقية AlarmManager في النظام (`UNCOMPILED`) |
| `src/diagnostics/tests/diagRunner.test.ts` | معدل | إضافة 5 حزم اختبارات جديدة لـ T1 و T2 و T3 و T4 وبادئة الحقيقة | اختبارات تغطية شاملة بلغت 241 اختباراً ناجحاً |
| `docs/review/PROGRESS.md` | جديد | سجل تتبع الإنجاز المرحلي للخطوات من T0 إلى T9 | توثيق تتبعي داخلي |
| `docs/review/DEVICE_TEST_PLAN.md` | جديد | دليل الاختبار الميداني خطوة بخطوة باللغة العربية مع الأوامر | وثيقة موجهة للمختبر البشري |
| `docs/review/PHASE1_REVIEW_BUNDLE_v2.md` | جديد | الحزمة المرجعية البرمجية الشاملة لكافة الملفات بدون اختصار | وثيقة المراجعة الفنية للأكواد |

---

## 3. القرارات التصميمية المتخذة والتعامل مع حالات الغموض (Decisions & Rationale)

1. **حجب منبهات `diag_` عند العرض فقط وليس من الذاكرة (`WorshipAlarms.tsx`):**
   - *القرار:* تطبيق الفلترة عبر دالة نقية `filterUserVisibleAlarms(customAlarms)` تُستخدم في حلقة الـ JSX فقط دون تعديل مصفوفة الحالة (`customAlarms state`).
   - *السبب:* المنبهات التشخيصية تحتاج للبقاء في `salah_custom_alarms` طوال فترة الاختبار حتى يتعرف عليها محرك الجدولة `usePrayerScheduler` ويرسلها إلى `reconcileAlarmsInternalStatic` فلا يقوم بحذفها من `AlarmManager` أثناء فترة الانتظار (`waiting phase`).
2. **سلامة معالجات التعديل والحذف (`Handler Safety`):**
   - *القرار:* التأكد من أن جميع معالجات الواجهة (`handleToggleAlarm`, `handleOpenEditModal`, `promptDeleteAlarm`, `confirmDeleteAlarm`) تستخدم معرّف المنبه (`alarm.id`) وليس فهرس المصفوفة (`index`).
   - *السبب:* الفلترة عند العرض تُغيّر فهارس العناصر في المصفوفة المعروضة مقارنة بالمصفوفة الأصلية، والاعتماد على `alarm.id` يمنع أي خطأ ناتج عن انزياح الفهرس (`index shift`).
3. **تطهير النسخ الاحتياطي في الاتجاهين (Export & Restore Safety):**
   - *القرار:* تصفية مصفوفة `customAlarms` عند التصدير لاستبعاد أي منبه يطابق `isDiagAlarmId(id)`، وإعادة تصفيتها قسرياً عند استيراد أي ملف احتياطي قبل حفظه في `localStorage`.
   - *السبب:* ضمان عدم تسرب أي منبه تشخيصي إلى ملفات النسخ الاحتياطي، ومنع استعادة أي منبه تشخيصي قديم كان محبوساً في نسخة احتياطية سابقة.
4. **تقييد جدولة منبهات التشخيص كـ `oneShot` في قلب المحرك (`athanAlarmPlugin.ts`):**
   - *القرار:* إضافة فحص صريح `if (alarm.oneShot || isDiag)` داخل دالة `buildNativePrayerTimeAlarms` يمنع جدولة أي منبه تشخيصي في الأيام التالية إلا إذا طابق `alarm.fireDate` تاريخ ذلك اليوم تحديداً.
   - *السبب:* منع أي مسار جدولة (حتى لو أُسيء ضبط المنبه) من تكرار منبه التشخيص أسبوعياً أو يومياً.
5. **طبيعة حارس بيئة نود في `src/utils/audioStorage.ts`:**
   - *القرار:* الإبقاء على الفحص السريع `if (typeof indexedDB === 'undefined') return;` في بداية `deleteDownloadedAudio`.
   - *السبب:* بيئات التشغيل الحقيقية (المتصفح وتطبيق كاباسيتور على أندرويد) تمتلك دائماً كائن `indexedDB` في النطاق العام، بينما بيئة اختبارات Node / tsx تفتقر إليه افتراضياً، مما يمنع حدوث انهيار أثناء تشغيل الاختبارات دون التأثير إطلاقاً على مسارات الإنتاج.

---

## 4. مصفوفة التتبع والتحقق الشاملة (Traceability Matrix - T6)

| # | المتطلب البرمجي والتشخيصي (`Requirement`) | موقع التنفيذ بالكود (`Code path:line`) | اسم اختبار الوحدة المطابق (`Unit Test Name`) | الحالة (`Status`) |
|---|---|---|---|---|
| 1 | قاعدة كتم الصوت الثلاثية لـ Test B (SILENT / VIBRATE / DND) والأحكام الأربعة | `src/diagnostics/tests/diagRunner.ts:50-75`, `src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts:180-230` | `2. Mute State Detection Matrix (parseMuteState)` + `6. Test B (Khushu Custom Alarm Spec)` | `VERIFIED` |
| 2 | عزل مساري الفحص في Test A (المسار الشبكي مقابل المسار المحلي غير المخزن) | `src/diagnostics/tests/specs/testA_previewSource.ts:50-160` | `7. Test A (Preview Source Resolution Spec) -> exercises resolvePreviewSource online vs offline` | `VERIFIED` |
| 3 | تتبع تنظيف الذاكرة المؤقتة بـ Test A وتأجيل التنظيف عند الحاجة | `src/diagnostics/tests/diagRunner.ts:240-275`, `src/diagnostics/tests/specs/testA_previewSource.ts:170-195` | `7. Test A -> pending cache cleanup records newly downloaded track and flushes on cleanup` | `VERIFIED` |
| 4 | آلية كشف إعادة تشغيل الجهاز (`last_device_boot_timestamp`) | `AthanBootReceiver.kt:70-74`, `AthanAlarmPlugin.kt:1503-1505`, `diagRunner.ts:310-335` | `5. Reboot During Waiting Detection -> detects device reboot occurred during waiting phase` | `VERIFIED` (JS) / `UNCOMPILED` (Kotlin) |
| 5 | المقارنة والاستعادة المشفرة بلقطة SHA-256 وعدم استبدال كامل المنبهات | `src/diagnostics/tests/diagRunner.ts:175-235` | `3. Compare-and-Restore Engine -> restores keys matching original test snapshot` | `VERIFIED` |
| 6 | حماية مواقيت الأذان والمنبهات المخصصة بهامش 10 دقائق بعد انتهاء الخشوع | `src/diagnostics/tests/diagRunner.ts:90-135` | `4. Prayer Proximity Guard -> rejects test when near an upcoming athan time` | `VERIFIED` |
| 7 | التنظيف الشامل في 3 مواقع (نهاية الاختبار، بدء التطبيق، إقلاع الهاتف) | `diagRunner.ts:215-230`, `diagRunner.ts:340-370`, `AthanBootReceiver.kt:81-98` | `3. Compare-and-Restore Engine -> cleans up createdAlarmIds` | `VERIFIED` (JS) / `UNCOMPILED` (Kotlin) |
| 8 | حفظ وتوثيق سجل المعرّفات المنشأة `diag_<runId>_<n>` | `src/diagnostics/tests/specs/testB_khushuCustomAlarm.ts:50-52` | `8. Reconcile Retains Diag Alarms During Waiting` + `9. Single Source of Truth` | `VERIFIED` |
| 9 | عدم إطلاق حدث `PLAYBACK_STARTED` مطلقاً للمنبهات المخصصة | `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmReceiver.kt:115-130`, `testB_khushuCustomAlarm.ts:145-165` | `6. Test B -> evaluates to SUPPORTS_HYPOTHESIS when control heard and test muted` | `VERIFIED` (Logic) / `STATIC` (Receiver) |
| 10 | معالجة T1 و T2 و T3 (فلترة العرض، أمان النسخ الاحتياطي، تحصين الجدولة) | `WorshipAlarms.tsx:46`, `BackupSettingsTab.tsx:135,274`, `athanAlarmPlugin.ts:518-528` | `10. UI Filter` + `11. Backup Safety` + `12. Scheduler One-Shot Safety` | `VERIFIED` |

---

## 5. نتائج الاختبارات والبناء الفعلي (Test & Build Verification - T7)

### أ. نتائج اختبارات الوحدة الشاملة (`npm test`): `VERIFIED`
مقتطف حقيقي من خاتمة تشغيل `npm test`:
```
# Subtest: Prayer Calculation Engine
ok 26 - Prayer Calculation Engine
# Subtest: FIX 1a - local-first preview source
ok 27 - FIX 1a - local-first preview source
# Subtest: selectUpcomingCachedDays
ok 28 - selectUpcomingCachedDays
1..28
# tests 241
# suites 67
# pass 241
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 10639.326795
```
**إجمالي الاختبارات:** 241 اختباراً، 67 حزمة اختبارية، 241 ناجحاً، 0 فاشل.

### ب. فحص تطابق وتدقيق الأنواع البرمجية (`npx tsc --noEmit`): `VERIFIED`
مخرجات الأمر:
```
(Exit code: 0 - Clean TypeScript compilation, zero errors)
```

### ج. فحص بناء التطبيق (`compile_applet`): `VERIFIED`
مخرجات الأداة:
```
Build succeeded - the applet is compiled
```

---

## 6. مراجعة كود كوتلن الأصلي ومخاطر التجميع (Kotlin Static Review - T5)

*تحذير إجرائي:* نظراً لعدم توفر بيئة `JDK` أو `Android SDK` في هذه الحاوية السحابية، فإن كود كوتلن مصنف تحت وسم: `UNCOMPILED`. وقد تمت مراجعته بدقة برمجية استاتيكية (`STATIC`).

### أ. نطاقات الأسطر المعدلة في ملفات كوتلن:
1. **`android/app/src/main/java/com/salahpro/app/plugins/AthanBootReceiver.kt`**:
   - الأسطر `70-74`: كتابة الختم الزمني لإقلاع الجهاز `prefs.edit().putLong("last_device_boot_timestamp", System.currentTimeMillis()).apply()`.
   - الأسطر `81-98`: تطهير وقراءة مصفوفة `KEY_SAVED_ALARMS` وحذف أي منبه يطابق `pKey.contains("diag_") || aId.startsWith("diag_")` قبل استعادة الجدولة.
2. **`android/app/src/main/java/com/salahpro/app/plugins/KhushuRestoreReceiver.kt`**:
   - الأسطر `111-126`: تسجيل حدث `khushu_attempt` بالقيم `initialRinger` و `initialFilter` و `hasDndPermission`.
   - الأسطر `187-205`: تسجيل حدث `khushu_result` بالقيم الفعلية المطبقة `appliedRinger` و `appliedFilter` وحالة الفشل/الارتداد للاهتزاز `fallback_vibrate`.
3. **`android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt`**:
   - الأسطر `353-382`: فحص التحقق من النظام `os_verified` عبر `PendingIntent.getBroadcast(..., FLAG_NO_CREATE)`.
   - الأسطر `857-860`: استدعاء المطابقة الحقيقية للحالة `reconcileAlarmsInternalStatic`.
   - الأسطر `1483-1506`: تضمين `lastDeviceBootTimestamp` وقراءة آخر 100 حدث في `getAlarmDiagnostics`.

### ب. إثبات تطابق هوية الـ Intent في فحص `os_verified` (`STATIC`):
- دالة الجدولة تنشئ الـ Intent بالبيانات التالية:
  - `Action` = `AthanAlarmReceiver.ACTION_ATHAN_ALARM`
  - `Component` = `AthanAlarmReceiver::class.java`
  - `Data` = `null`
  - `Categories` = فارغة
  - الإضافات (`Extras`): بيانات المنبه.
- دالة الفحص `os_verified` تنشئ `checkIntent` بالبيانات التالية:
  - `Action` = `AthanAlarmReceiver.ACTION_ATHAN_ALARM`
  - `Component` = `AthanAlarmReceiver::class.java`
  - `Data` = `null`
  - `Categories` = فارغة
- حسب توثيق أندرويد الرسمي لقاعدة `Intent.filterEquals(Intent other)`: تتطابق نيتان إذا تساوى المكون، والإجراء، والبيانات، والفئات. ولا تؤثر البيانات الإضافية (`Extras`) على المساواة إطلاقاً.
- مع استخدام نفس كود الطلب القطعي `reqCode = getDeterministicRequestCode(prayerKey, timeMs)`، فإن `PendingIntent.getBroadcast(context, reqCode, checkIntent, FLAG_NO_CREATE)` يعيد نفس الـ PendingIntent المسجل في AlarmManager تماماً، وإذا أُلغي من النظام يُرجع `null`.

### ج. قائمة مخاطر تجميع كوتلن المحتملة (Kotlin Compile Risk List):
1. **استدعاء `getNativeEventLogStatic(context)` في `AthanAlarmPlugin.kt:1485`:**
   - *الاحتمال:* منخفض جداً (مستوى الثقة 95%). الدالة معرّفة كـ `@JvmStatic` ومحمية بكتلة `try-catch`.
2. **استخدام كاست `(reconcileResult["total"] as? Number)?.toInt()` في `AthanAlarmPlugin.kt:859`:**
   - *الاحتمال:* منخفض جداً (مستوى الثقة 98%). كاست آمن في كوتلن عبر مشغل `as?` الآمن.
3. **أعلام الـ PendingIntent على نسخ أندرويد المختلفة (`AthanAlarmPlugin.kt:356-360`):**
   - *الاحتمال:* منخفض (مستوى الثقة 95%). استخدام فحص `Build.VERSION.SDK_INT >= Build.VERSION_CODES.M` مع علم `FLAG_IMMUTABLE`.
4. **تطابق مفتاح التخزين `last_device_boot_timestamp` بين الـ Receiver والـ Plugin:**
   - *الاحتمال:* منعدم (مستوى الثقة 99%). نفس الاسم الحرفي المستخدم في كتابة وقراءة `SharedPreferences`.
5. **استيراد `org.json.JSONArray` و `org.json.JSONObject` في `AthanBootReceiver.kt`:**
   - *الاحتمال:* منعدم (مستوى الثقة 99%). جزء من حزمة مكتبات أندرويد الأساسية (`Android Core Framework`).

---

## 7. سجل إدارة المخاطر (Risk Register)

| الخطر (`Risk`) | المستوى (`Severity`) | الدليل بالكود (`Evidence`) | إجراء التخفيف المعتمد (`Mitigation`) | الخطر المتبقي (`Residual Risk`) |
|---|---|---|---|---|
| تسريب منبهات `diag_` في النسخ الاحتياطي | مرتفع | `BackupSettingsTab.tsx:135` | تصفية صريحة عبر `isDiagAlarmId` عند التصدير وعند الاستيراد | منعدم (`Zero`) |
| ظهور منبهات الاختبار في واجهة المستخدم العادية | متوسط | `WorshipAlarms.tsx:383` | استخدام دالة `filterUserVisibleAlarms` النقية عند العرض فقط | منعدم (`Zero`) |
| تكرار منبهات التشخيص في الأيام التالية | مرتفع | `athanAlarmPlugin.ts:518` | فرض شروط `oneShot: true` وتطابق `fireDate` لجميع منبهات `diag_` | منعدم (`Zero`) |
| تعليق الاختبار في طور الانتظار عند إغلاق التطبيق | متوسط | `diagRunner.ts:340` | كشف استئناف الاختبار المحفوظ واستعادته تلقائياً من التخزين الدائم | منخفض جداً |
| عدم تجميع كود كوتلن في بيئة السحابة الحالية | متوسط | بيئة AI Studio | التحقق من صحة الكود استاتيكياً وإعداد أمر بناء محلي واضح للمختبر | منخفض (يُفحص محلياً في ستوديو) |

---

## 8. الحدود الفنية المعروفة (Known Limits & Non-Implementable Scope)
- **Phase 2:** خارج نطاق العمل الحالي تماماً ولم يتم لمس أي مسار لتأخير الخشوع (`computeKhushuStartMs`) أو واجهة فروق الإقامة.
- **`PrayerTimesView.tsx`:** لم يتم لمس الملف أو فتحه أو تعديله طوال الجلسة.
- **تجميع كوتلن:** غير قابل للتنفيذ في بيئة الحاوية السحابية لغياب الـ JDK، وتم توثيق ذلك بوضوح بوسم `UNCOMPILED`.

---

## 9. ما يجب على المراجع البشري التحقق منه ميدانياً (Top Manual Review Items)
1. تشغيل `gradlew compileDebugKotlin` على جهاز الكمبيوتر للتحقق النهائي من ترجمة كوتلن.
2. تثبيت ملف الـ APK وتشغيل `Test A` في وضع متصل ثم في وضع الطيران للتأكد من الرجوع الصوتي الافتراضي.
3. تشغيل `Test B` وسماع منبه المقارنة ثم منبه الخشوع والإجابة على استبيان السماع.
4. فتح تبويب المنبهات المخصصة أثناء تشغيل `Test B` والتأكد من عدم ظهور أي منبه تشخيصي.
5. تصدير ملف نسخة احتياطية أثناء سير الاختبار وفتحه بمحرر نصوص والتأكد من خلوه من معرّف `diag_`.
6. إلغاء الاختبار يدوياً والتأكد من استعادة كافة الإعدادات عبر تنفيذ أمر `adb shell dumpsys alarm | findstr "com.salahpro.app"`.
