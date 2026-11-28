# خطة معمارية وتنفيذية (النسخة المحدّثة): Task 10 (`RingCoordinator`) و Task 10.5 (`KhushuManager`)

> **حالة الوثيقة:** خطة تصميمية + **تم تنفيذ `Commit 0a` و`Commit 0b` فقط** (تلتزم الوثيقة بالقواعد المقفولة في `AGENTS.md` و`docs/locked-registry.md`، ولا تمس `REFERENCE.md` ولا `getDeterministicRequestCode`).

---

## ما تغيّر عن النسخة السابقة (Changelog & Reasons)

| البند | التغيير المنفذ | السبب |
|---|---|---|
| 1. حارس التصادم في `Commit 5` (أقسام `3.3` و`3.5` و`5` و`7`) | تحويل `resolveUniqueRequestCodes` من إزاحة/إعادة توليد `requestCode` (`+1`) إلى **اكتشاف وتسجيل `request_code_collision` فقط** في `KEY_NATIVE_EVENT_LOG` دون تعديل `requestCode`. | JS يحسب نفس `requestCode` حرفياً عبر `src/domain/notifications/AlarmIdentifier.ts:15-20` لإلغاء المنبهات؛ فلو غيّر Native الرقم وحده سيفشل الإلغاء وتظهر منبهات شبحية، كما أن `prayerKey` يتضمن `alarm.id` أصلاً (`athanAlarmPlugin.ts:562-564, 626`). |
| 2. أمان واستعادة الهاتف وقائمة تنظيف `Commit 0a` (قسم `3.0 أ`) | إلزام استعادة `ringerMode` و`interruptionFilter` داخل `try/finally` + حفظ الحالة الأصلية مسبقاً بـ `commit()` في `SharedPreferences` + استعادتها تلقائياً في `AthanAlarmPlugin.load()` عند بدء التطبيق لو قُتل أثناء الاختبار، مع توثيق أماكن تعليق `// TEMP: remove after Commit 0a result`. | حماية المستخدم من بقاء الهاتف في وضع `SILENT` أو `INTERRUPTION_FILTER_NONE` إذا فشل المسبار أو قُتل التطبيق في المنتصف، وتسهيل الحذف النظيف بعد انتهاء القياس. |
| 3. سعة السجل وحل فصل المخزن في `Commit 0b` (قسم `3.0 ب`) | فحص وتوثيق سعة `KEY_NATIVE_EVENT_LOG` (`AthanAlarmPlugin.kt:60, 83-92, 1487, 1778-1782`: ring buffer بحد `300` سجل والواجهة تعرض أحدث `100` افتراضياً)، ونقل سجلات `Commit 0b` إلى **مفتاح منفصل** `KEY_RING_DIAG_LOG = "ring_diag_log_json"` (ring buffer `300`) مع دالة قراءة `getRingDiagnosticLog(limit=200)` وبطاقة وزر نسخ مستقلين. | منع تزاحم سجلات تتبع الرنين المزدوج اليومية مع سجلات الحوادث الحرجة (`fire_received`, `reconcile`, `KHUSHU_*`) في `KEY_NATIVE_EVENT_LOG` أثناء المراقبة ليوم كامل. |
| 4. إثبات إضافي في قسم `3.6` (الـ slider في Kotlin) | توثيق أمر `grep -rnE "salah_audio_volume|setVolume|audioVolume" android/app/src/main/java` ونتيجته الفارغة (`exit code 1`) في القسم `3.6`. | إثبات قاطع من الكود الفعلي بأن مسار Kotlin (`AthanForegroundService.kt` و`AthanAlarmReceiver.kt`) لا يقرأ `salah_audio_volume` ولا يستدعي `setVolume` مطلقاً. |
| ما سبق (النسخة المحدّثة الأولى) | إضافة `0a`/`0b`، مفتاح `ring_coordinator_enabled`، تقسيم `4a`/`4b`، عمود اختبار الجهاز، إثبات تفرد `requestCode`، تحليل `USAGE_ALARM` على الشريط، واعتماد قرارات القسم `9`. | السياق الأساسي للخطة قبل بدء تنفيذ `Commit 0a` و`Commit 0b`. |

---

## 1. إثبات السبب الجذري لحادثة العصر (من الكود الفعلي)

**السيناريو المُبلَّغ عنه:**
- أذان العصر: `2:42`
- الخشوع التلقائي: يبدأ بعد الأذان بـ `10` دقائق (`2:52`) لمدة `15` دقيقة (ينتهي `3:07`).
- منبه مخصص ("تنبيه بعد الأذان"): مضبوط بعد الأذان بـ `10` دقائق (`2:52` — نفس دقيقة بداية الخشوع).
- النتيجة الفعلية: الإشعار ظهر في `3:08`، أي أن المنبه **تأجل** إلى ما بعد انتهاء الخشوع **وتم كتمه**.

### 1.1 ما هو مثبت 100% من الكود الفعلي

1. **لماذا تأجّل المنبه من `2:52` إلى `3:07` وقت الجدولة؟**
   - في `src/services/athanAlarmPlugin.ts` داخل الدالة `buildNativePrayerTimeAlarms` → `addCustomAlarmsForDay` (أسطر `602–621`):
     - لأي منبه مخصص نسبي (`alarm.relation === 'after'`) مع تفعيل الخشوع التلقائي (`khushuEnabled`)، يحسب الكود نافذة الخشوع:
       - `iqamaTimeMs = computeKhushuStartMs(prayerTimeMs, iqamaOffset)` (`2:42 + 10m = 2:52`)
       - `khushuEndTimeMs = iqamaTimeMs + duration * 60000` (`2:52 + 15m = 3:07`)
     - ثم ينفذ فحص التصادم صراحةً (أسطر `616–620`):
       ```ts
       if (timeMs >= iqamaTimeMs && timeMs < khushuEndTimeMs) {
         const oldTime = timeMs;
         timeMs = khushuEndTimeMs;
         console.log(`[ALARM] kind=custom shifted from=${new Date(oldTime).toISOString()} to=${new Date(timeMs).toISOString()} reason=khushu_window_collision`);
       }
       ```
     - لأن `2:52 >= 2:52 && 2:52 < 3:07`، تم تعديل وقت المنبه وقت الجدولة من **`2:52` إلى `3:07`** قبل أن يرن أصلاً.

2. **لماذا تم كتم المنبه عند وصوله قرب `3:07`؟**
   - منبه الخشوع (`Asr_khushu` عند `2:52`) يستدعي `AthanAlarmReceiver.onReceive` (`AthanAlarmReceiver.kt:654–667`) → `KhushuRestoreReceiver.activateKhushuDirectly` (`KhushuRestoreReceiver.kt:302–457`).
   - دالة جدولة الاستعادة `KhushuRestoreReceiver.scheduleRestoreAlarmSafely` (`KhushuRestoreReceiver.kt:206`) تحسب موعد الاستعادة من لحظة التنفيذ الفعلية وليس من `2:52:00.000` الحتمية:
     `val triggerAt = System.currentTimeMillis() + (durationMinutes * 60_000L)`
   - إذا استلم نظام أندرويد بث `Asr_khushu` بعد `2:52:00` ولو بثوانٍ (أو دقائق إذا غاب إذن `canScheduleExactAlarms()` وسقط في مسار `setAndAllowWhileIdle` في `KhushuRestoreReceiver.kt:244–254`)، يصبح وقت انتهاء الخشوع الفعلي `3:07:xx` متأخراً عن `3:07:00.000`.
   - عندما يصل المنبه المخصص عند `3:07` قبل تشغيل `KhushuRestoreReceiver` للاستعادة، يتحقق `AthanAlarmReceiver.onReceive` (`AthanAlarmReceiver.kt:383`) من `KhushuRestoreReceiver.isKhushuActive(context)` (`KhushuRestoreReceiver.kt:165–184`)، والتي ترى `elapsedMs < totalMs` فتُرجِع `true`.
   - يمرَّر `isKhushuActive = true` إلى `AlertDuringKhushuPolicy.evaluate` (`AlertDuringKhushuPolicy.kt:46–56, 65–66`)، فيفرض:
     - `effectiveIsSilent = true`
     - `soundUriRequired = false`
     - `channelId = "salah_custom_alarms_silent"`
     - `reason = "muted_for_khushu"`
   - بالتالي يُنشر الإشعار عبر القناة الصامتة بلا صوت عبر `showCustomAlarmNotification` (`AthanAlarmReceiver.kt:182–273`).

3. **لماذا ظهر الإشعار في `3:08` بدلاً من `3:07`؟ (احتمالان مثبتان في الكود + ملاحظة عدم التعطيل)**
   - **المسار الكودي المثبت أ (`same_minute_priority` + منبه آخر في النافذة):**
     - في `src/utils/alarmUtils.ts:67–78` يوجد منبه افتراضي مفعّل (`alarm_evening_adhkar` — "أذكار المساء") مضبوط بعد العصر بـ `20` دقيقة (`2:42 + 20m = 3:02`).
     - لو كان هذا المنبه (أو أي منبه مخصص آخر بين `2:52` و`3:06`) مفعلاً، فإن `addCustomAlarmsForDay` (`athanAlarmPlugin.ts:616–620`) يحول **كلا المنبهين** إلى `3:07`.
     - بعد ذلك، تمر مصفوفة المنبهات على حلقة حل تصادم نفس الدقيقة في `buildNativePrayerTimeAlarms` (`athanAlarmPlugin.ts:822–858`)، والتي تُبقي الأول عند `3:07` وتدفع الثاني **دقيقة كاملة للأمام** (سطر `852`):
       `curr.timeMs = (Math.floor(curr.timeMs / 60000) + 1) * 60000 + (curr.timeMs % 60000)` → **`3:08`**!
   - **المسار النظامي ب (إزاحة `AlarmManager` / Doze):**
     - إذا كان هناك منبه واحد فقط عند `3:07:00`، فإن نظام أندرويد في وضع الخمول/توفير البطارية قد يؤخر بث `AlarmManager` من `3:07:00` لبضع عشرات من الثواني فيُعرض ختم الإشعار في `3:08`، ويكون الخشوع لا يزال نشطاً إذا تأخر تفعيله بالمثل أو كان وضع `INTERRUPTION_FILTER_NONE` مفعّلاً.
   - **ملاحظة حسم المسار:** السبب الدقيق لتأخر الإشعار إلى `3:08` (مسار أ أم مسار ب) غير محسوم بالسجلات بعد، **لكنه غير معطِّل للتنفيذ** لأن الخطة تزيل المسارين معاً (إزالة `khushu_window_collision` وإزالة `same_minute_priority` للمنبهات المخصصة، وتشغيل الصوت عبر `RingCoordinator` بـ `USAGE_ALARM`).

### 1.2 ما الذي ينقص لحسم المسار التاريخي اختيارياً وكيفية جمعه
إذا رغبنا في التحقق التاريخي من مسار `3:08` فقط: استدعاء `getAlarmDiagnostics()` (`AthanAlarmPlugin.kt:1399–1508`) و`getNativeEventLog(100)` (`AthanAlarmPlugin.kt:1775–1805`) من شاشة التشخيص (`AthanDiagnosticsSection.tsx`) لقراءة `savedAlarms` و`fire_received` (`AthanAlarmReceiver.kt:364–371`) و`khushu_result` و`athan_fire_events`.

**الأصل المعماري للخطأ:** تم التعامل مع وضع الخشوع كأنه **قفل يمنع الصوت**. الصحيح معمارياً:
- **الخشوع حالة زمنية مستقلة** تتحكم في كتم رنين الهاتف وإشعاراته العامة (مع بقاء المنبهات والأذان عبر `USAGE_ALARM`).
- **`RingCoordinator` هو المالك الوحيد للصوت وقت الرنين.**

---

## 2. خريطة الملكية الحالية (Current Ownership Map)

### 2.1 جدول المكونات الحالية في الكود

| المكون / الملف | الدالة / المسؤولية الحالية | ما يملكه فعلياً الآن | ملاحظات |
|---|---|---|---|
| `src/domain/notifications/UnifiedNotificationOrchestrator.ts` | `orchestratePrayerAlarms` (سطر `50`) و`syncAllNotificationChannels` (سطر `158`) | نقطة الدخول الموحدة (المقفولة في `docs/locked-registry.md` بند 7) لمزامنة الـ SW وبناء وإرسال جدول Native | المسار الثاني لا يبني المنبهات المخصصة |
| `src/services/athanAlarmPlugin.ts` | `buildNativePrayerTimeAlarms` (`492`)، `addCustomAlarmsForDay` (`509`)، `syncPrayerMuezzinsToNative` (`1329`) | بناء قائمة 30 يوم، إزاحة المنبهات عن الخشوع (`602–621`)، إزاحة تعارض نفس الدقيقة (`822–858`)، رفع ملفات الأذان | يعدّل أوقات المنبهات عند الجدولة بناءً على حالة الخشوع |
| `src/services/AlarmReconciliationService.ts` | `reconcileAlarms` (`26`) | مصالحة يومين فقط عبر `syncAllNotificationChannels` | مسار موازٍ لـ `usePrayerScheduler` |
| `src/services/NotificationScheduler.ts` | `schedule` (`23`)، `cancel` (`114`) | جدولة فورية لـ Native أو `setTimeout` للويب | يستخدمه `AlarmReconciliationService.scheduleTestAlarm` |
| `android/.../AthanAlarmPlugin.kt` | `reconcileAlarmsInternalStatic` (`241`)، `saveAthanFileChunk` (`1096`)، `getDeterministicRequestCode` (`123`) | تسجيل نافذة 14 يوم في `AlarmManager`، التحقق من ملفات الأذان | `saveAthanFileChunk` يقيس `durationMs` (`1145`) ثم يتجاهله ولا يحفظه |
| `android/.../ScheduleRenewalWorker.kt` | `doWork` (`22`) | تجديد نافذة 14 يوم من `KEY_SAVED_ALARMS` عبر WorkManager | يحذف الأذانات المعطلة فقط |
| `android/.../AthanBootReceiver.kt` | `onReceive` (`18`)، `restoreAlarms` (`60`)، `restoreKhushuState` (`43`) | إعادة تسجيل المنبهات بعد الإقلاع وتحديث مدة استعادة الخشوع النشط | يعيد جدولة الخشوع النشط فقط؛ لا يملك قائمة فترات |
| `android/.../AthanAlarmReceiver.kt` | `onReceive` (`276`)، `showCustomAlarmNotification` (`182`)، `showPreAlertNotification` (`767`)، `showPostAlertNotification` (`847`) | تشغيل الأذان بتمريره إلى `AthanForegroundService` (`684–696`)، وتشغيل صوت المنبهات عبر `NotificationChannel.setSound` (`227, 802, 892`)، وتفعيل الخشوع | يربط القرار الصوتي مباشرة مع `AlertDuringKhushuPolicy` |
| `android/.../AthanForegroundService.kt` | `onStartCommand` (`60`)، `playLocalAthanAudio` (`95`) | المالك Native الوحيد لـ `MediaPlayer` للأذان (`USAGE_ALARM`)، مهلة `TIMEOUT_MS = 600000L` (`31`) | لا يطلب `AudioFocus`، لا يطلق `AUDIO_STARTED`/`AUDIO_COMPLETED`، ولا يقرأ `salah_audio_volume` |
| `android/.../AlertDuringKhushuPolicy.kt` | `evaluate` (`41`) | فرض الكتم (`effectiveIsSilent = true`) وتحويل المنبه المخصص والبعدي لقنوات صامتة أثناء الخشوع | يتناقض مع قاعدة عدم منع الخشوع للمنبهات |
| `android/.../CustomAlarmKhushuDecision.kt` | `evaluate` (`39`)، `resolveOverlap` (`104`) | حساب تأجيل الخشوع التابع للمنبه المخصص بمدة تقديرية (`measuredDurationMs + 4000ms`) | حل مؤقت (`R12a`) قبل وجود `AUDIO_COMPLETED` الفعلي |
| `android/.../KhushuRestoreReceiver.kt` | `activateKhushuDirectly` (`302`)، `restoreOriginalState` (`498`)، `scheduleDeferredKhushu` (`86`) | مالك حالة هاتف واحدة فقط (`KEY_IS_ACTIVE`)، يحفظ `KEY_ORIGINAL_RINGER` و`KEY_ORIGINAL_FILTER` | يرفض أي طلب متداخل (`ALREADY_ACTIVE`) ولا يفحص تعديل المستخدم اليدوي |
| `android/.../KhushuActivationCoordinator.kt` | `execute` (`22`) | تغليف تفعيل الخشوع بمعاملة أحادية الجلسة | يمنع التمديد أو الدمج عبر حارس `isAlreadyActive()` (`24`) |
| `android/.../KhushuModePlugin.kt` | `activate` (`76`)، `deactivate` (`111`)، `getStatus` (`126`) | جسر Capacitor بين الواجهة و`KhushuRestoreReceiver` | لا يعرض معلومات الفترات المدمجة |
| `android/.../SalahWidgetProvider.kt` | `onReceive` (`335`) | زر تفعيل/إلغاء الخشوع السريع من الودجت | يستدعي `activateKhushuDirectly` / `restoreOriginalState` مباشرة |
| `src/hooks/usePrayerScheduler.ts` | `checkTimesAndAlarms` (`164`) | حلقة ثانية بالـ Worker لتشغيل الأذان (`204`) والمنبهات (`305–326`) في JS | يحسب `getAlarmPriorityScore` (`211–231`)، ويُصمّت كل منبهات نفس الدقيقة بعد الأول (`308, 326`) |
| `src/hooks/useAthanPlayer.ts` | `triggerAthan` (`358`)، `playAudioTrack` (`143`) | تشغيل الأذان بالـ Web `HTMLAudioElement` داخل التطبيق | يستدعي `stopNativeAthan()` (`369`) لقتل الخدمة الأصلية عند فتح التطبيق |
| `src/hooks/useCustomAlarmTrigger.ts` | `executeCustomAlarmTrigger` (`25`) | تشغيل المنبهات في الواجهة عبر `playSpiritualSound` (`48`) | ينافس مسار Native بدون فحص إن كان Native قد رن أو يعمل |
| `src/domain/khushu/useKhushuAutoScheduler.ts` | `checkCycle` (`49`) | فحص كل 15 ثانية لتفعيل الخشوع التلقائي في الواجهة (`autoWithIqama`) | يستدعي `activate` بشكل موازٍ لمنبه Native `_khushu` |
| `src/utils/spiritualAudio.ts` | `playSpiritualSound` (`104`)، `playSpiritualChime` (`6`)، `playSpiritualSpeech` (`65`) | تشغيل صوتيات التذكير في الويب على `STREAM_MUSIC` | بدون طابور أو تنسيق مع الأذان |
| `src/hooks/useMuezzinSettings.ts` و`AdhanVolumeControls.tsx` | `salah_audio_volume`، `AdhanVolumeControls` (`43–51`) | التحكم في `HTMLAudioElement.volume` (`useAthanPlayer.ts:202`, `useAdhanAudioLogic.ts:72,203`) | يتحكم في الويب والمعاينة فقط؛ غير مرتبط بالمسار الأصلي (`USAGE_ALARM`) |
| `src/hooks/useSmartNotifications.ts` و`useKhushuAudio.ts` | `playAyahAt` (`108`)، `playAmbientAudio` (`35`) | مشغلات ويب مستقلة للتلاوة والأصوات الخلفية | لا تمر عبر منسق صوت موحد |

### 2.2 التداخلات والتعارضات المكتشفة + الرموز غير الموجودة حالياً

1. **جدولة vs وقت الرنين:** منطق الخشوع (`athanAlarmPlugin.ts:602–621`) ومنطق نفس الدقيقة (`822–858`) يغيّران أوقات المنبهات وقت الجدولة بدلاً من معالجة التزاحم وقت الرنين.
2. **صوت قناة الإشعارات vs `MediaPlayer`:** الأذان يعمل بـ `MediaPlayer` (`USAGE_ALARM`) بينما المنبهات المخصصة تعتمد على `NotificationChannel.setSound()` (`AthanAlarmReceiver.kt:227`)، فتنعدم إشارة `AUDIO_COMPLETED` ويخضع المنبه لكتم القناة.
3. **تنافس JS vs Native:** `useAthanPlayer.triggerAthan` يوقف الخدمة الأصلية (`369`) ويعزف عبر WebView؛ و`usePrayerScheduler` يطلق `triggerCustomAlarm` (`306, 326`) بدون تحقق من Native.
4. **غياب الرموز المعمارية المطلوبة حالياً:** `RingCoordinator`، `RingRequest`، `KhushuManager`، `GAP_AFTER_MS`، `DHIKR_MAX_DEFER_MS`، `fadeInMs`، `AUDIO_STARTED`، `AUDIO_COMPLETED`، و`requestAudioFocus`، وأي استخدام لـ `salah_audio_volume`/`setVolume` في Kotlin — كلها **مش موجودة** في الكود الحالي.

---

## 3. مرحلة القياس المسبقة (`Commit 0a` و `Commit 0b`) وتصميم Task 10 (`RingCoordinator`)

### 3.0 خطوات القياس والتثبت المسبقة (قبل `Commit 3`)

#### أ. `Commit 0a`: اختبار سلوك DND مع `MediaPlayer(USAGE_ALARM)` على الجهاز
- **المقارنة والبديل الأبسط:**
  - *الحل المقترح بالأصل:* إنشاء `Activity` تشخيصية مؤقتة في `AndroidManifest.xml`.
  - *البديل الأبسط الموصى به (أقل تعقيداً وأسهل حذفاً):* إضافة `@PluginMethod fun runDndAudioProbe(call: PluginCall)` مؤقتة داخل `AthanAlarmPlugin.kt` (مع زر 4 حالات داخل وضع المطورين الموجود أصلاً في `src/components/settings/adhan/AthanDiagnosticsSection.tsx:123` `testsDevMode`).
  - *لماذا البديل أفضل؟*
    1. **لا يعدّل `AndroidManifest.xml`** ولا يضيف واجهة Android XML أو شاشة إضافية قابلة للنسيان.
    2. **يستدعي نفس `MediaPlayer` + `AudioAttributes.USAGE_ALARM`** + `AudioManager` + `NotificationManager.setInterruptionFilter()` من قلب عملية التطبيق الحقيقية.
    3. **يعيد حالة الهاتف تلقائياً** بعد `3.5` ثوانٍ ويحفظ النتيجة آلياً في `KEY_NATIVE_EVENT_LOG` ليقرأها المستخدم فوراً من شاشة التشخيص ويزيلها لاحقاً بسهولة.
- **الضمانات الأمنية واستعادة حالة الهاتف (`Crash-Safe Restore`):** *(السبب: ضمان عدم ترك هاتف المستخدم صامتاً إذا حدث استثناء أو قُتل التطبيق أثناء الاختبار)*:
  1. قبل تعديل `ringerMode` أو `interruptionFilter`، يتحقق المسبار أولاً من `NotificationManager.isNotificationPolicyAccessGranted` (API 23+): إذا كانت `false` لا يغير أي حالة، يسجل `DND_PROBE` (`permission_missing`)، ويفتح `Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS` بـ `FLAG_ACTIVITY_NEW_TASK`، ويرجع `{ started: false, permissionMissing: true }`.
  2. يحفظ الحالة السابقة (`origRinger` و`origFilter`) في `SharedPreferences(PREFS_NAME)` عبر **`commit()` المتزامن** (`KEY_DND_PROBE_PENDING_RESTORE = true`) قبل أي تغيير للحالة.
  3. ينفذ التشغيل والاستعادة داخل **`try { ... } finally { ... }`**: في كتلة `finally` يوقف/يحرر `MediaPlayer`، يستعيد `origFilter` ثم `origRinger`، ويمسح `KEY_DND_PROBE_PENDING_RESTORE` بـ `commit()`.
  4. **استعادة ما بعد القتل المفاجئ (`Startup Guard`):** يطبّق `AthanAlarmPlugin.load()` (المحمّل تلقائياً عند إقلاع التطبيق لأن `MainActivity.kt:16` يسجّل `AthanAlarmPlugin::class.java`) فحص `KEY_DND_PROBE_PENDING_RESTORE` عند أول تشغيل ليستعيد الحالة فوراً ويسجل `DND_PROBE_STARTUP_RESTORE` إن كان التطبيق قد قُتل وسط الاختبار.
- **خطوات الاختبار بالتفصيل (خطوة واحدة في كل مرة):**
  1. افتح الإعدادات ← الأذان ← التشخيص، واضغط زر "أدوات الفحص" (`AthanDiagnosticsSection.tsx:573`) لتفعيل `testsDevMode` (`123`)، وتأكد من منح صلاحية الوصول لعدم الإزعاج.
  2. **الحالة 1 (`RINGER_MODE_SILENT`):** اضغط زر "1. اختبار `RINGER_MODE_SILENT`". يقوم المسبار بالحفظ المسبق (`commit`)، ضبط `audioManager.ringerMode = RINGER_MODE_SILENT`، تشغيل عينة `R.raw.athan_default` لمدة ~3 ثوانٍ عبر `MediaPlayer(USAGE_ALARM)`، ثم الاستعادة داخل `finally`. اضغط **"سمعت الصوت ✓"** أو **"لم أسمع الصوت ✕"**.
  3. **الحالة 2 (`INTERRUPTION_FILTER_NONE`):** اضغط زر "2. اختبار `INTERRUPTION_FILTER_NONE`". يضبط `INTERRUPTION_FILTER_NONE` ويشغل نفس `MediaPlayer(USAGE_ALARM)` لـ ~3 ثوانٍ ثم يستعيد داخل `finally`. سجّل النتيجة بالأزرار.
  4. **الحالة 3 (`INTERRUPTION_FILTER_ALARMS`):** اضغط زر "3. اختبار `INTERRUPTION_FILTER_ALARMS`". يضبط `INTERRUPTION_FILTER_ALARMS` ويشغل العينة ثم يستعيد داخل `finally`. سجّل النتيجة.
  5. **الحالة 4 (`INTERRUPTION_FILTER_PRIORITY`):** اضغط زر "4. اختبار `INTERRUPTION_FILTER_PRIORITY`". يضبط `INTERRUPTION_FILTER_PRIORITY` ويشغل العينة ثم يستعيد داخل `finally`. سجّل النتيجة.
- **أين تُسجَّل النتيجة؟**
  - تقنياً: تُحفظ كل خطوة تلقائياً في `KEY_NATIVE_EVENT_LOG` عبر `AthanAlarmPlugin.logNativeEvent(context, "DND_PROBE", ...)` و`"DND_PROBE_RESTORE"` و`"DND_PROBE_VERDICT"`، وتظهر في سجل الأحداث الأصلي داخل `AthanDiagnosticsSection.tsx`.
  - توثيقياً: تُثبَّت نتيجة الحالات الأربع قبل تنفيذ `Commit 3` و`Commit 7`: إذا كتمت الحالة 2 (`INTERRUPTION_FILTER_NONE`) الصوت، يُعتمد `INTERRUPTION_FILTER_ALARMS` لوضع `dnd` في `KhushuManager` (حسب القرار المعتمد في القسم `9`).
- **قائمة التنظيف الإلزامية بعد أخذ النتيجة (`// TEMP: remove after Commit 0a result`):**
  1. `android/app/src/main/java/com/salahpro/app/plugins/AthanAlarmPlugin.kt`: ثوابت `KEY_DND_PROBE_*`، استدعاء `restoreDndProbeSnapshotIfNeeded` (و`load()` إن لم يبقَ له استخدام)، ودوال `runDndAudioProbe` / `recordDndProbeVerdict` و`resolveDndRawResId` (المعلمة جميعها بـ `// TEMP: remove after Commit 0a result`).
  2. `src/services/athanAlarmPlugin.ts`: أنواع ودوال `runDndAudioProbe` و`recordDndProbeVerdict` والـ web fallbacks المعلمة بـ `// TEMP: remove after Commit 0a result`.
  3. `src/components/settings/adhan/AthanDiagnosticsSection.tsx`: state وبطاقة اختبار DND المؤقتة داخل `testsDevMode` المعلمة بـ `{/* TEMP: remove after Commit 0a result */}`.

#### ب. `Commit 0b`: قياس الرنين المزدوج (`JS` مقابل `NATIVE`) قبل التعديل (Telemetry فقط)
- **فحص سعة `KEY_NATIVE_EVENT_LOG` وسياسة الحذف (من الكود الفعلي):**
  - في `AthanAlarmPlugin.kt:60` يُخزَّن السجل العام في `KEY_NATIVE_EVENT_LOG = "native_event_log_json"`.
  - في `AthanAlarmPlugin.kt:83–92` سياسة الحذف هي Ring Buffer بحد أقصى **`300` سجل** (`if (array.length() > 300) ... startIdx = array.length() - 300`).
  - في `AthanAlarmPlugin.kt:1487` (`getAlarmDiagnostics`) و`AthanAlarmPlugin.kt:1778–1782` (`getNativeEventLog`) يُقتطع العرض افتراضياً لآخر **`100` سجل** فقط (الأحدث أولاً).
  - **خطر مشاركة نفس السجل:** عند تشغيل التطبيق ليوم كامل (مع `usePrayerScheduler` و5 صلوات + منبهات مخصصة + فتح/إغلاق متكرر للتطبيق)، قد تزاحم سجلات التتبع اليومية (`0b`) أحدث `100` سجل في `KEY_NATIVE_EVENT_LOG` وتُخفي أو تطرد أحداث الحوادث الحرجة مثل `fire_received` أو `reconcile` أو `KHUSHU_*`.
  - **الحل الأفضل المُعتمد (فصل المخزن):** استخدام مفتاح مستقل تماماً **`KEY_RING_DIAG_LOG = "ring_diag_log_json"`** (ring buffer بسعة `300` سجل أيضاً) داخل `AthanAlarmPlugin.kt` مع `@JvmStatic fun logRingDiagEvent(...)` و`@PluginMethod logRingDiagnosticEvent` و`@PluginMethod getRingDiagnosticLog(limit = 200)` + بطاقة مستقلة مع زر نسخ خاص في `AthanDiagnosticsSection.tsx`. *(السبب: عزل تام لسجلات قياس `0b` يمنع أي طرد لأحداث `KEY_NATIVE_EVENT_LOG` ويسهّل فحص تداخلات `JS` و`NATIVE` وحدها في خط زمني صافٍ).*
- **الأماكن الدقيقة لإضافة سجلات `0b` (ملف + سطر، بدون تغيير أي شرط `if` أو ترتيب استدعاء):**

| المصدر | الملف والسطر الدقيق | الحدث المسجَّل والبيانات |
|---|---|---|
| `NATIVE` (استقبال المنبه) | `AthanAlarmReceiver.kt:~375` (بعد `fire_received` مباشرة) | `logRingDiagEvent(context, "NATIVE", resolvedType, prayerKey, "receiver_on_receive", ...)` |
| `NATIVE` (منبه مخصص) | `AthanAlarmReceiver.kt:~451` (قبل `showCustomAlarmNotification`) | `logRingDiagEvent(context, "NATIVE", "custom", prayerKey, "custom_notif_post", ...)` |
| `NATIVE` (قبل الأذان) | `AthanAlarmReceiver.kt:~626` (قبل `showPreAlertNotification`) | `logRingDiagEvent(context, "NATIVE", "prealert", prayerKey, "prealert_notif_post", ...)` |
| `NATIVE` (بعد الأذان) | `AthanAlarmReceiver.kt:~644` (قبل `showPostAlertNotification`) | `logRingDiagEvent(context, "NATIVE", "postalert", prayerKey, "postalert_notif_post", ...)` |
| `NATIVE` (طلب تشغيل أذان) | `AthanAlarmReceiver.kt:~690` (قبل `startForegroundService`) | `logRingDiagEvent(context, "NATIVE", "athan", prayerKey, "start_foreground_service", ...)` |
| `NATIVE` (بدء خدمة الأذان) | `AthanForegroundService.kt:~78` و`~162` و`~212` | `logRingDiagEvent(applicationContext, "NATIVE", "athan", rawPrayerKey, "service_on_start" / "native_mp_start", ...)` |
| `JS` (فحص الأذان في Scheduler) | `src/hooks/usePrayerScheduler.ts:~199` و`~204` | `logRingDiagnosticEvent({ source: 'JS', alarmType: 'athan', alarmId: prayer, stage: 'skip_native_running' / 'scheduler_trigger_athan' })` |
| `JS` (قتل Native وتشغيل Web Athan) | `src/hooks/useAthanPlayer.ts:~369` و`~265` | `logRingDiagnosticEvent` عند `stopNativeAthan()` (`stage: 'stop_native_called'`) وقبل `audio.play()` (`stage: 'html_audio_play'`) |
| `JS` (تشغيل المنبه المخصص والذكر) | `src/hooks/usePrayerScheduler.ts:~306, 308, 326` و`src/hooks/useCustomAlarmTrigger.ts:~48, 103` | تسجيل `custom_dispatch_audible` / `custom_dispatch_muted_busy` / `custom_dispatch_muted_secondary` و`custom_play_sound` / `dhikr_play_speech` (بشرط Fire-and-forget غير معطّل داخل `try/catch`). |

- **كيف تقرأ النتيجة؟**
  1. اترك التطبيق يعمل يوماً كاملاً أو افتحه عند أذان ومنبه مخصص.
  2. افتح **الإعدادات ← الأذان ← التشخيص ← بطاقة "سجل قياس الرنين المزدوج (Commit 0b)"** واضغط **"نسخ سجل الرنين 📋"** (كما يُضاف ملخصه لتقرير التشخيص الشامل).
  3. ستجد أسطر `JS` و`NATIVE` معزولة في خط زمني موحد بالملي ثانية (`timeMs`, `source`, `alarmType`, `alarmId`, `stage`, `details`) تُظهر إن كان `stop_native_called` أو `html_audio_play` أو `custom_play_sound` يطلق بالتوازي مع `native_mp_start` أو `custom_notif_post`.

---

### 3.1 القواعد والحدود المعمارية لـ Task 10 (محدّثة بالقرارات المعتمدة)

- **سلم الأولوية الصوتية (الثابت):**
  `ATHAN (4) > CUSTOM_ALARM (3) > PRE/POST_ATHAN (2) > DHIKR (1)`
- **منبه مقطوع بالأذان:** يتوقف الصوت الحالي فوراً ويُعاد إدراج المنبه (`CUSTOM_ALARM` أو `PRE/POST_ATHAN`) في الطابور بحالة **`deferred`** (لا يُلغى) ليعاد تشغيله بعد `AUDIO_COMPLETED` + `GAP_AFTER_MS`.
- **حالة `DHIKR` عند المقاطعة (قرار معتمد):**
  - إذا قُطع `DHIKR` بطلب أعلى منه (`ATHAN` / `CUSTOM_ALARM` / `PRE/POST_ATHAN`)، يصبح **`deferred`** بحد أقصى **`DHIKR_MAX_DEFER_MS = 600_000L` (10 دقائق)** من وقت إنشائه/أوّل تأجيل له.
  - عند حلول دوره في الطابور، إذا كان `now - enqueuedAtMs > DHIKR_MAX_DEFER_MS`، يتحول مصيره إلى **`skipped`** (`reason = "dhikr_defer_expired_10m"`) ويُسجَّل في السجل دون تشغيل.
- **منبهين في نفس الدقيقة:** يرنّان بالترتيب نفسه الموجود في قائمة منبهات المستخدم (`salah_custom_alarms` عبر `listOrder`) مع فاصل ثابت **`GAP_AFTER_MS = 2000L` (2 ثانية)** بين `AUDIO_COMPLETED` للأول و`AUDIO_STARTED` للثاني. لا توجد أولوية يختارها المستخدم ولا شاشة حل تعارض.
- **صوت واحد في كل مرة + تسجيل كل طلب:** كل طلب صوتي يدخل المنسق يُسجَّل مصيره: `played` | `deferred` | `skipped` | `error`.
- **نهاية الصوت بالحدث الفعلي:** تحدد من `MediaPlayer.OnCompletionListener` (تُطلق `AUDIO_COMPLETED`) مع مؤقت أمان احتياطي `safetyTimeoutMs`:
  - للملفات المقاسة: **`safetyTimeoutMs = measuredDurationMs + SAFETY_TIMEOUT_PADDING_MS`** (`+ 30_000L`).
  - للأذان الجديد غير المقاس فقط: **`DEFAULT_ATHAN_EXPECTED_DURATION_MS = 240_000L`** + هامش `30_000L` (`safetyTimeoutMs = 270_000L`).
- **الأحداث الصادرة:** `AUDIO_STARTED(requestId, kind, triggerId, startedAtMs)` و`AUDIO_COMPLETED(requestId, kind, triggerId, completedAtMs, reason)`.
- **الخشوع لا يمنع المنبه أبداً:** تشغيل كل الأصوات عبر `MediaPlayer` بـ `AudioAttributes.USAGE_ALARM` + `AudioManager.requestAudioFocus` (`AUDIOFOCUS_GAIN_TRANSIENT`) داخل خدمة Foreground، مع بقاء الإشعار مرئياً صامتاً لضمان `AUDIO_COMPLETED` وتخطي الكتم.
- **pre-roll كـ `fadeInMs` (قرار معتمد):**
  - الأذان (`ATHAN`): `fadeInMs = 1500L` (1.5 ثانية).
  - المنبهات المخصصة (`CUSTOM_ALARM` و`PRE/POST_ATHAN`): `fadeInMs = 500L` (0.5 ثانية).
  - (تدرج خطي لطيف على `MediaPlayer.setVolume` من `0.05f` إلى مستوى التشغيل المستهدف).
- **مفتاح الأمان والرجوع السريع (`ring_coordinator_enabled`):**
  - مفتاح Boolean في `SharedPreferences(AthanAlarmPlugin.PREFS_NAME)` باسم `"ring_coordinator_enabled"`.
  - يتيح إيقاف التوجيه إلى `RingCoordinator` وإعادة الأذان فوراً إلى المسار القديم غير الممسوس `AthanForegroundService` دون الحاجة إلى `git revert`.
- **خارج نطاق Task 10:** قاعدة بيانات الجدولة المركزية وrolling-window، والميكروفون قبل الأذان.

### 3.2 الواجهات وهياكل البيانات والثوابت الجديدة

#### أ. `RingConstants.kt` و`RingModels.kt` (منطق نقي خالٍ من `Context` وقابل لاختبار JVM)
```kotlin
object RingConstants {
    const val GAP_AFTER_MS = 2_000L
    const val DHIKR_MAX_DEFER_MS = 600_000L // 10 minutes
    const val DEFAULT_ATHAN_FADE_IN_MS = 1_500L
    const val DEFAULT_CUSTOM_FADE_IN_MS = 500L
    const val DEFAULT_ATHAN_EXPECTED_DURATION_MS = 240_000L // 4 minutes (unmeasured athan only)
    const val SAFETY_TIMEOUT_PADDING_MS = 30_000L
    const val COALESCE_WINDOW_MS = 200L
}

enum class RingPriority(val rank: Int) {
    ATHAN(4),
    CUSTOM_ALARM(3),
    PRE_POST_ATHAN(2),
    DHIKR(1);

    companion object {
        fun fromAlarmType(alarmType: String): RingPriority = when (alarmType.lowercase().trim()) {
            "athan" -> ATHAN
            "custom" -> CUSTOM_ALARM
            "prealert", "postalert" -> PRE_POST_ATHAN
            "dhikr" -> DHIKR
            else -> CUSTOM_ALARM
        }
    }
}

enum class RingOutcome { PLAYED, DEFERRED, SKIPPED, ERROR }

data class RingRequest(
    val requestId: String,
    val triggerId: String,
    val priority: RingPriority,
    val alarmType: String,          // "athan" | "custom" | "prealert" | "postalert" | "dhikr"
    val listOrder: Int,             // ترتيب الظهور في قائمة منبهات المستخدم
    val scheduledMinuteBucket: Long,
    val createdAtMs: Long,
    val soundSource: RingAudioSource,
    val notifyMode: String = "both", // "both" | "sound" | "notification" | "silent"
    val fadeInMs: Long = when (alarmType) {
        "athan" -> RingConstants.DEFAULT_ATHAN_FADE_IN_MS
        "custom", "prealert", "postalert" -> RingConstants.DEFAULT_CUSTOM_FADE_IN_MS
        else -> 0L
    },
    val measuredDurationMs: Long? = null, // للأذان المقاس وقت الحفظ/التحميل أو ملفات raw المقاسة
    val title: String,
    val body: String,
    val isFajr: Boolean = false,
    val prayerKey: String = ""
) {
    fun resolveSafetyTimeoutMs(): Long {
        val baseMs = measuredDurationMs ?: if (priority == RingPriority.ATHAN) {
            RingConstants.DEFAULT_ATHAN_EXPECTED_DURATION_MS
        } else {
            60_000L
        }
        return baseMs + RingConstants.SAFETY_TIMEOUT_PADDING_MS
    }
}
```
*(مع `RingAudioSource` و`RingEvent("AUDIO_STARTED" | "AUDIO_COMPLETED", requestId, triggerId, alarmType, timestampMs, reason)` كما في التصميم).*

#### ب. `RingQueuePolicy.kt` (منطق القرار الصرف لاختبارات JVM Unit)
- `decideIncoming(currentActive, newRequest, queue, nowMs)`:
  1. إذا `notifyMode in ["notification", "silent"]` أو `soundType in ["silent", "vibrate"]` → **`SKIPPED`** فوراً.
  2. إزالة التكرار أو الأذان الفائت (`staleAthanWindowMs`) → **`SKIPPED`** (`duplicate_or_stale`).
  3. عند عدم وجود صوت نشط → **`PLAYED`** فوراً.
  4. عند وجود صوت نشط:
     - إن كان `newRequest.priority.rank > currentActive.priority.rank`: يقطع الحالي ويُعيد إدراج الحالي في الطابور بحالة **`DEFERRED`** (`preempted_by_${newRequest.alarmType}`) — ينطبق على `CUSTOM_ALARM`, `PRE_POST_ATHAN`, وكذلك **`DHIKR`** (مع تقييده بحد أقصى `DHIKR_MAX_DEFER_MS = 600_000L`).
     - وإلا → يدخل الطلب الجديد الطابور بحالة **`DEFERRED`**.
- `popNextPlayable(queue, nowMs)`:
  - عند سحب العنصر التالي بعد `GAP_AFTER_MS = 2000L`: إذا كان `item.priority == RingPriority.DHIKR` و`nowMs - item.createdAtMs > DHIKR_MAX_DEFER_MS` → يُسجَّل **`SKIPPED`** (`reason = "dhikr_defer_expired_10m"`) ويُسحب العنصر الذي يليه!
- ترتيب الطابور: `priority DESC`, ثم `scheduledMinuteBucket ASC`, ثم `listOrder ASC`, ثم `createdAtMs ASC`.

### 3.3 الملفات الجديدة والمعدّلة في Task 10 (مع السبب لكل تغيير)

| المسار | نوع التغيير | السبب |
|---|---|---|
| `android/.../AthanAlarmPlugin.kt` + `src/services/athanAlarmPlugin.ts` + `src/components/settings/adhan/AthanDiagnosticsSection.tsx` | **تعديل مؤقت/قياس (`0a` و`0b`)** | `0a`: إضافة `@PluginMethod runDndAudioProbe` + `load()` للـ Crash-safe restore + أزرار DevMode لاختبار 4 حالات DND على الجهاز؛ `0b`: إضافة مخزن مستقل `KEY_RING_DIAG_LOG` + `logRingDiagnosticEvent` + `getRingDiagnosticLog` لعرض ونسخ تتبع `JS` و`NATIVE` دون مزاحمة `KEY_NATIVE_EVENT_LOG`. |
| `src/hooks/usePrayerScheduler.ts`, `useAthanPlayer.ts`, `useCustomAlarmTrigger.ts`, `AthanAlarmReceiver.kt`, `AthanForegroundService.kt` | **تعديل logging فقط (`0b`)** | إرسال سجلات `KEY_RING_DIAG_LOG` دون تغيير أي شرط `if` أو توقيت لإثبات الرنين المزدوج قبل بدء التنفيذ. |
| `android/.../ring/RingModels.kt` & `RingQueuePolicy.kt` | **جديد (`Commit 1`)** | نماذج وثوابت Task 10 (`GAP_AFTER_MS=2000`, `DHIKR_MAX_DEFER_MS=600_000`, `fadeInMs`) وخوارزمية الطابور الصافية لاختبارها بـ JVM بدون `Context`. |
| `android/.../plugins/AthanAlarmPlugin.kt` | **تعديل (`Commit 2`)** | حفظ `durationMs` المقاس بـ `MediaMetadataRetriever` في `saveAthanFileChunk` (`1145`), `saveAthanFile` (`1224`), `setNativeAthanFiles` (`1257`) داخل `SharedPreferences` (`athan_duration_ms_<key>`) لتغذية `safetyTimeoutMs = measured + 30000ms`. |
| `android/.../ring/RingPlaybackService.kt` + `AndroidManifest.xml` | **جديد (`Commit 3`)** | خدمة Foreground مستقلة للتشغيل الموحد عبر `MediaPlayer` + `USAGE_ALARM` + `AudioFocusRequest` + `fadeInMs` + `WakeLock` + إشارة `AUDIO_COMPLETED` الحقيقية؛ مع **إبقاء `AthanForegroundService.kt` سليماً كمسار رجوع** عند `ring_coordinator_enabled=false`. *(السبب: عزل مخاطر كسر الأذان عن الخدمة الحالية).* |
| `android/.../ring/RingCoordinator.kt` | **جديد (`Commit 3`)** | المنسق التسلسلي الوحيد للصوت (`HandlerThread` Actor)، إدارة الطابور و`GAP_AFTER_MS = 2000L`، انتهاء صلاحية `DHIKR` بعد `10m`، إطلاق `AUDIO_STARTED`/`AUDIO_COMPLETED`، وتسجيل `played`/`deferred`/`skipped`/`error`. |
| `android/.../plugins/AthanAlarmReceiver.kt` & `AthanAlarmPlugin.kt` | **تعديل (`Commit 4a` ثم `4b`)** | `4a`: توجيه الأذان فقط (`alarmType == "athan"`) عبر `RingCoordinator` عند `ring_coordinator_enabled=true` (مع إتاحة زر/method لتبديل المفتاح). `4b`: توجيه `custom`, `prealert`, `postalert` عبر `RingCoordinator` مع إشعارات مرئية صامتة. |
| `android/.../plugins/AlertDuringKhushuPolicy.kt`, `AthanAlarmPlugin.kt`, `KhushuRestoreReceiver.kt`, `src/services/athanAlarmPlugin.ts`, `src/hooks/usePrayerScheduler.ts`, `useAthanPlayer.ts`, `useCustomAlarmTrigger.ts` | **تعديل (`Commit 5`)** | 1) إزالة كتم الخشوع وقت الرنين (`effectiveIsSilent = isOriginallySilent`)؛ 2) إزالة `khushu_window_collision` (`602–621`) و`same_minute_priority` للمنبهات المخصصة (`822–858`) مع تمرير `listOrder`؛ 3) إضافة **حارس اكتشاف وتسجيل تصادم `desiredMap` فقط (`request_code_collision`)** وتمرير `requestCode` extra في `AthanAlarmPlugin.kt` دون تغيير `requestCode` (انظر `3.5`)؛ 4) منع منافسة JS لـ Native عند فتح التطبيق (حل B4)؛ 5) ربط تأجيل الخشوع مؤقتاً بـ `RingCoordinator` حتى `Task 10.5`. |

### 3.4 نقطة الاتصال المؤقتة مع الخشوع حتى Task 10.5
*(تُنفذ في `Commit 5`)*:
1. حذف إزاحة `khushu_window_collision` (`athanAlarmPlugin.ts:602–621`) ليبقى منبه `2:52` في موعده.
2. تعديل `AlertDuringKhushuPolicy.kt:46–56` ليكون `effectiveIsSilent = isOriginallySilent` بغض النظر عن `isKhushuActive`.
3. فحص `RingCoordinator.isAudioActive()` مؤقتاً في `KhushuRestoreReceiver` قبل `activateKhushuDirectly` لتأجيل الكتم حتى `AUDIO_COMPLETED` مع بقاء وقت الانتهاء محسوباً من موعد بدء الخشوع المجدول (ويُستبدل هذا الربط المؤقت بالكامل بـ `KhushuManager` في `Commit 7`).

### 3.5 إثبات تفرد `requestCode` بعد إزالة إزاحة `same_minute_priority` (المشكلة 5)

بعد إزالة إزاحة `same_minute_priority` (`athanAlarmPlugin.ts:822–858`)، يمكن أن يُجدول منبهان على نفس `timeMs` بالضبط. وبقراءة الكود الفعلي نثبت ما يلي:

1. **هل `getDeterministicRequestCode` (`AthanAlarmPlugin.kt:123–128`) يتضمن معرّف المنبه؟**
   - نص الدالة الفعلي (`AthanAlarmPlugin.kt:123–128`):
     ```kotlin
     val minuteBucket = timeMs / 60000L
     val identifier = "${prayerKey}_$minuteBucket"
     return (identifier.hashCode() and 0x7FFFFFFF) % 10000000 + 1000
     ```
     وتطابقه الحرفي في TypeScript في `src/domain/notifications/AlarmIdentifier.ts:15–20` (مقفول في `docs/locked-registry.md` بند 7 و14).
   - بالتحقق من مُنشئ `prayerKey` في `src/services/athanAlarmPlugin.ts`:
     - المنبه الثابت (`562–564`): `prayerKey = "custom_${alarm.id}_${timeMs}"` (أو `custom_snooze_${alarm.snoozeOf}_${alarm.id}_${timeMs}`).
     - المنبه النسبي (`626`): `prayerKey = "custom_${alarm.id}_${lowerTarget}_${timeMs}"`.
     - الأذان (`674`): `prayerKey = canonicalKey` (مثل `"Asr"`).
     - الخشوع التلقائي (`694`): `prayerKey = "${canonicalKey}_khushu"`.
   - **النتيجة المثبتة:** بما أن `prayerKey` لكل منبه مخصص يتضمن **`alarm.id`** فعلياً، فإن منبهين مختلفين على نفس `timeMs` ينتجان نصي `identifier` مختلفين (`"custom_alarm1_asr_..."` مقابل `"custom_alarm2_asr_..."`)، وبالتالي يولّد `getDeterministicRequestCode` قيمتي `requestCode` مختلفتين عادةً دون الحاجة لكسر معادلة الهاش المقفولة في `docs/locked-registry.md`.

2. **أين تقع الثغرة الحقيقية المتبقية في `AthanAlarmPlugin.kt`؟ (لماذا نحتاج إصلاحاً في `Commit 5`)**
   - **ثغرة `desiredMap` في `AthanAlarmPlugin.kt:252–258`:**
     ```kotlin
     val desiredMap = mutableMapOf<Int, org.json.JSONObject>()
     for (item in active14DayList) {
         val reqCode = getDeterministicRequestCode(prayerKey, timeMs)
         desiredMap[reqCode] = item // <-- استبدال صامت إذا تساوى reqCode!
     }
     ```
     إذا تساوى `reqCode` بسبب تصادم هاش نادر في `% 10_000_000` أو تكرار `prayerKey` في أي مسار مستقبلي، يقوم `desiredMap[reqCode] = item` باستبدال المنبه الأول بالثاني بصمت، كما يستبدل `PendingIntent.getBroadcast` (`315–328`) الأول في `AlarmManager`!
   - **ثغرة `requestCode` extra الغائب:** `AthanAlarmReceiver.kt:283` يقرأ `intent.getIntExtra("requestCode", -1)`، بينما `createAthanIntent` (`AthanAlarmPlugin.kt:157–169`) لا يمرر `"requestCode"` داخل `Intent` أصلاً (يصل دائماً `-1`)!
   - **الإصلاح المضاف إلى خطة `Commit 5` (دون كسر `locked-registry.md` ولا كسر الإلغاء من JS):**
     1. الحفاظ على صيغة `getDeterministicRequestCode` نفسها (`AthanAlarmPlugin.kt:123–128` ↔ `AlarmIdentifier.ts:15–20`) **دون أي تعديل أو إعادة توليد للـ `requestCode`** في `Native` *(السبب: الـ JS يحسب نفس الرقم بنفس المعادلة لإلغاء المنبهات، فلو غيّر Native الرقم وحده فسيفشل الإلغاء وتظهر منبهات شبحية)*.
     2. إضافة فحص **اكتشاف وتسجيل فقط (`resolveUniqueRequestCodes` / collision detector)** في `reconcileAlarmsInternalStatic`: إذا كان `desiredMap.containsKey(reqCode)` بالفعل، يُسجَّل الحدث **`"request_code_collision"`** في `KEY_NATIVE_EVENT_LOG` (متضمناً `reqCode` و`existingPrayerKey` و`incomingPrayerKey` و`timeMs`) دون تغيير `reqCode`.
     3. تمرير `reqCode` في `createAthanIntent` (`AthanAlarmPlugin.kt:157–169`) ليظهر صحيحاً في سجلات `fire_received`.
     4. التحقق من أن معرف إشعار Android (`notifId` في `AthanAlarmReceiver.kt:264`: `(alarmKey.hashCode() and 0x7FFFFFFF) % 10000 + 7000`) يستخدم `alarmKey` الكامل المتضمن `alarm.id`.
     5. **إضافة اختبار JVM في `Commit 5`:** يتحقق من تفرد `requestCode` لمنبهين مخصصين (وأذان + منبه مخصص) على نفس `timeMs`، ومن أن كاشف التصادم يطلق تحذير `"request_code_collision"` عند فرض تصادم هاش مصطنع دون تغيير `requestCode`.

### 3.6 تأثير `USAGE_ALARM` على شريط (Slider) صوت الأذان (المشكلة 6 — للتوضيح والقرار لاحقاً)

#### أ. ما الذي يحدث حالياً للشريط بالضبط (مع المراجع والإثبات من الكود)؟
- يوجد شريط التحكم `"شدة ومستوى صوت الأذان"` في `src/components/settings/adhan/AdhanVolumeControls.tsx:43–51` (وشريط مماثل في شاشة المنبهات `src/components/alarms/AlarmHeader.tsx:73–89`)، وكلاهما مربوط بالقيمة `audioVolume` المحفوظة في `localStorage` بمفتاح `salah_audio_volume` (`src/hooks/useMuezzinSettings.ts:20–23, 35–41` و`src/components/MoreSettings.tsx:85–101`، مع دعم `prayerVolumes` في `src/components/prayer/PrayerTimesView.tsx:363`).
- هذه القيمة (`0.0` إلى `1.0`) تضبط **فقط خاصية `.volume` على عناصر صوت الويب (`HTMLAudioElement` و`SpeechSynthesisUtterance`)** التي يعزفها المتصفح/WebView على **قناة الوسائط (`STREAM_MUSIC`)**:
  - معاينة المؤذنين في الإعدادات (`src/components/settings/adhan/useAdhanAudioLogic.ts:69–74, 203`).
  - تشغيل الأذان في الواجهة (`src/hooks/useAthanPlayer.ts:202, 332, 352, 397`).
  - تشغيل المنبهات في الواجهة (`src/hooks/useCustomAlarmTrigger.ts:48` → `src/utils/spiritualAudio.ts:73, 144, 159`).
- **أما المسار الأصلي في الخلفية (`AthanForegroundService.kt:141–145, 227–231`):** فلا يقرأ `salah_audio_volume` إطلاقاً ولا يستدعي `setVolume` مطلقاً؛ بل يشغّل `MediaPlayer` بـ `AudioAttributes.USAGE_ALARM` (المرتبط بـ **`STREAM_ALARM`** في نظام أندرويد).
  - **إثبات بالبحث الفعلي على مجلد Kotlin:** تنفيذ الأمر `grep -rnE "salah_audio_volume|setVolume|audioVolume" android/app/src/main/java` أعاد **`exit code 1` (مخرجات فارغة تماماً — 0 نتائج)**، مما يثبت أن `salah_audio_volume` و`setVolume` **مش موجودة** في `AthanForegroundService.kt` ولا `AthanAlarmReceiver.kt` ولا أي ملف Kotlin.

#### ب. ما الذي سيتغير بعد `Commit 3` (و`Commit 4a/4b`)؟
- عند توحيد جميع أصوات الرنين الفعلية على Android (`ATHAN`, `CUSTOM_ALARM`, `PRE/POST_ATHAN`, `DHIKR`) داخل `RingCoordinator` / `RingPlaybackService` باستخدام `MediaPlayer(USAGE_ALARM)`:
  1. سيصبح مستوى الصوت الفعلي وقت الرنين (سواء والتطبيق مغلق أو مفتوح على Native) خاضعاً لـ **`STREAM_ALARM` في أندرويد**، وليس `STREAM_MUSIC`.
  2. لن يؤثر slider "شدة ومستوى صوت الأذان" (`AdhanVolumeControls.tsx:43–51`) على الأذان أو المنبهات الفعلية في أندرويد (سيؤثر فقط على المعاينة داخل الإعدادات وعلى متصفح الويب).
  3. هذا قد يربك المستخدم إذا ضبط الشريط داخل التطبيق على `10%` أو `0%` ثم رن الأذان بصوت `STREAM_ALARM` للنظام عند `100%` (أو العكس: كان `STREAM_ALARM` في جهازه `0%` بينما الشريط في التطبيق `100%`).

#### ج. الخيارات المتاحة للتعامل معه لاحقاً (بدون تنفيذ أو اختيار — القرار لك)

| الخيار | الوصف | المزايا | العيوب |
|---|---|---|---|
| **الخيار 1: معامل خفض نسبي على `MediaPlayer`** | تمرير `salah_audio_volume` إلى `SharedPreferences` وتطبيقه عبر `mediaPlayer.setVolume(scale, scale)` فوق `USAGE_ALARM` (بينما يستمر تدرج `fadeInMs` من `0.05f` إلى `scale`). | يحافظ على عزل الأذان عن كتم الوسائط (`STREAM_MUSIC`) + يحترم تقليل الصوت النسبي من داخل التطبيق دون لمس إعدادات منبه الساعة بالنظام. | السقف الأقصى مقيد بـ `STREAM_ALARM` للنظام؛ وإذا ضبط المستخدم الشريط على `0` داخل التطبيق قد يُكتم الأذان سهواً ما لم يوضع حد أدنى مثل `0.1f` أو تحذير عند الصفر. |
| **الخيار 2: ربط الشريط بمستوى `STREAM_ALARM` بالنظام** | في Android، قراءة وكتابة `audioManager.getStreamVolume / setStreamVolume(STREAM_ALARM)` من الشريط مباشرة. | تطابق تام 1:1 بين الشريط في التطبيق وأزرار الصوت في الهاتف؛ يكشف للمستخدم لو كان منبه النظام مكتوماً. | يغيّر مستوى صوت منبه الاستيقاظ الرسمي في الهاتف؛ خطواته خشنة (مثلاً `0..7`)؛ وقد يرمي `SecurityException` في بعض الأجهزة أثناء وضع DND عند تعديل stream النظام برمجياً. |
| **الخيار 3: فصل الدور في الواجهة (بدون ربط بالـ stream)** | على Android: توضيح أن الشريط خاص بالمعاينة (أو استبداله بمؤشر قراءة لمستوى `STREAM_ALARM` + زر يفتح إعدادات صوت النظام). | يتبع معايير Android الصارمة لتطبيقات المنبهات؛ صفر تعارض مع أزرار الجهاز ولا كتم عرضي للأذان. | يفقد المستخدم إمكانية جعل الأذان أهدأ من منبه الساعة الصباحي من داخل التطبيق. |

---

## 4. تصميم Task 10.5: `KhushuManager` (المالك الوحيد لدورة الخشوع وحالة الهاتف)

*(محفوظ من النسخة الأولى مع تطبيق قراراتك المعتمدة)*:
- **الفترات المطلوبة والدمج (`KhushuIntervalModels.kt` و`KhushuIntervalMerger.kt`):**
  - تخزين `KhushuRequestedInterval(triggerId, source, startMs, endMs, mode, label)`.
  - إهمال المكرر لنفس `triggerId` (Idempotency).
  - اتحاد الفترات المتداخلة أو الملزوقة (`B.startMs <= currentEndMs`) كفترة واحدة دون تقصير أي فترة (`newEnd = max(currentEnd, N.endMs)`).
  - **اعتماد نمط `dnd` عند دمج `silent` + `dnd`** (قرار معتمد، بشرط توفر إذن DND `isNotificationPolicyAccessGranted`).
  - **قيمة وضع `dnd` عند التفعيل:** تُحدَّد حتمياً من نتيجة `Commit 0a`: استخدام `INTERRUPTION_FILTER_ALARMS` إذا أثبت اختبار `0a` أن `INTERRUPTION_FILTER_NONE` يكتم `MediaPlayer(USAGE_ALARM)` (قرار معتمد).
- **التكامل المبني على الأحداث مع `RingCoordinator`:**
  - إذا كان الصوت يعمل عند `startMs`، ينتظر الكتم حتى `AUDIO_COMPLETED` مع **ثبات وقت النهاية `endMs` المطلق** دون ترحيل.
- **الإلغاء اليدوي أثناء فترة مدمجة (قرار معتمد):**
  - ضغط المستخدم على إلغاء الخشوع/استعادة الصوت من التطبيق أو الإشعار أو الودجت أثناء فترة مدمجة **يُنهي الفترة المدمجة كلها فوراً** ويستعيد حالة الهاتف (وفق قاعدة عدم تعديل المستخدم لحالة الهاتف يدوياً).
- **ملكية حالة الهاتف (`KhushuPhoneStateController.kt`) والاستمرارية (`AthanBootReceiver.kt`) والواجهة (`mergedCount > 1`):**
  - حفظ لقطة `original` و`applied` عند الانتقال من `IDLE -> ACTIVE` فقط، واستعادتها فقط إذا لم يغيرها المستخدم يدوياً (`current == applied`).
  - حفظ الفترات واللقطة في `SharedPreferences("KhushuManagerPrefs")` + جدولة الانتهاء بـ `AlarmManager` + تصحيح الحالة في `AthanBootReceiver`.
  - عرض سطر شرح الدمج في `KhushuModeDashboardCard.tsx` و`KhushuModeSheet.tsx` وإشعار الخشوع **فقط عندما `mergedCount > 1`**.

---

## 5. خطة الـ Commits الصغيرة المستقلة مع قابلية الاختبار على الجهاز

| Commit | الوصف المختصر | ما يُختبر على الجهاز بعده؟ (عمود الاختبار المطلوب) | ما **لا** يمكن اختباره بعده بعد |
|---|---|---|---|
| **Commit 0a** | مسبار DND المؤقت (`runDndAudioProbe` + `load()` للـ Crash-safe restore في `AthanAlarmPlugin.kt` + أزرار DevMode في `AthanDiagnosticsSection.tsx`) | **نعم — مُنفَّذ وجاهز للاختبار الفوري على الجهاز:** تشغيل `MediaPlayer(USAGE_ALARM)` تحت 4 حالات (`SILENT`, `NONE`, `ALARMS`, `PRIORITY`) مع استعادة آمنة تلقائية. | لا يختبر أي منبهات أو خشوع فعلي. |
| **Commit 0b** | تسجيل الرنين المزدوج (`KEY_RING_DIAG_LOG` + `logRingDiagnosticEvent` في `usePrayerScheduler`, `useAthanPlayer`, `useCustomAlarmTrigger`, `AthanAlarmReceiver`, `AthanForegroundService`) | **نعم — مُنفَّذ وجاهز للقياس:** فتح التطبيق أو تركه يوماً كاملاً ثم نسخ بطاقة "سجل قياس الرنين المزدوج" لإثبات تداخل `JS`/`NATIVE` بالملي ثانية. | لا يغيّر سلوك الصوت (ما زال الرنين المزدوج موجوداً). |
| **Commit 1** | نماذج وثوابت وقواعد الطابور الصافية (`RingModels.kt`, `RingQueuePolicy.kt`) + اختبارات JVM | **لا يحتاج جهاز (JVM Unit Tests فقط):** اختبار الأولويات، الترتيب بـ `listOrder`، `DHIKR_MAX_DEFER_MS`، والخصم. | لم يُربط بخدمة الصوت بعد. |
| **Commit 2** | قياس وحفظ مدة ملف الأذان وقت الحفظ (`saveAthanFileChunk`, `saveAthanFile`, `setNativeAthanFiles` في `AthanAlarmPlugin.kt`) | **نعم جزئياً:** حفظ مؤذن مخصص من الإعدادات والتأكد من تسجيل `athan_duration_ms_<key>` وتمرير `240_000L` للأذان غير المقاس. | لا يشغّل الطابور بعد. |
| **Commit 3** | بناء `RingPlaybackService.kt` و`RingCoordinator.kt` (مع إبقاء `AthanForegroundService.kt` سليماً ومفتاح `ring_coordinator_enabled` الافتراضي `false`) | **اختبار أمان سلبي:** التأكد أن الأذان العادي لا يزال يعمل بـ `AthanForegroundService` دون أي انكسار (`ring_coordinator_enabled=false`)، وبناء التطبيق بنجاح. | لم يُحوَّل `AthanAlarmReceiver` إلى `RingCoordinator` بعد. |
| **Commit 4a** | توجيه **الأذان فقط** عبر `RingCoordinator` (`ring_coordinator_enabled = true` افتراضياً مع إمكانية إعادته `false` فوراً) | **نعم — بوابة قبول إلزامية للأذان:**<br>1. أذان حقيقي والشاشة مغلقة: مسموع بـ `USAGE_ALARM` + إشعار شاشة كاملة + `fadeInMs=1500`.<br>2. تسجيل `AUDIO_STARTED` و`AUDIO_COMPLETED(natural)` و`played`.<br>3. زر إيقاف الأذان يوقفه (`stopped`).<br>4. قلب `ring_coordinator_enabled=false` يعيده لـ `AthanForegroundService` فوراً. | المنبهات المخصصة لا تزال على القنوات القديمة؛ **ممنوع اختبار حادثة العصر هنا** (لا تزال تُزاح وتُكتم). |
| **Commit 4b** | *(بعد اجتياز بوابة `4a`)* توجيه `custom`, `prealert`, `postalert` عبر `RingCoordinator` + إشعارات مرئية صامتة | **نعم:** أذان + منبه مخصص في نفس الوقت (تأجيل المنبه `deferred` حتى انتهاء الأذان + `2000ms` ثم تشغيله)، و`fadeInMs=500`. | **لا تزال حادثة العصر (`2:52`) غير قابلة للاختبار** لأن `athanAlarmPlugin.ts:602-621` و`AlertDuringKhushuPolicy.kt` لا يزالان يزيحان ويكتمان! |
| **Commit 5** | إزالة `khushu_window_collision` و`same_minute_priority` في TS، تمرير `listOrder`، إزالة كتم `AlertDuringKhushuPolicy`، كاشف تصادم `desiredMap` (تسجيل `request_code_collision` فقط) + `requestCode` extra، منع منافسة JS لـ Native، وربط تأجيل الخشوع المؤقت بـ `RingCoordinator` | **نعم — الآن فقط تُختبر حادثة العصر (`2:52`) بالكامل!**<br>+ منبهين في نفس الدقيقة بالترتيب مع فاصل `2000ms`.<br>+ عدم وجود رنين مزدوج عند فتح التطبيق.<br>+ منبه مخصص مسموع أثناء الخشوع النشط. | دمج فترات الخشوع المتداخلة واستعادة حالة الهاتف المتقدمة مؤجلة لـ `Task 10.5`. |
| **Commit 6** | خوارزمية دمج الفترات ومتحكم حالة الهاتف (`KhushuIntervalModels.kt`, `KhushuIntervalMerger.kt`, `KhushuPhoneStateController.kt`) + JVM Tests | **JVM Unit Tests فقط.** | غير مربوط بـ `AthanAlarmReceiver` بعد. |
| **Commit 7** | بناء `KhushuManager.kt` وربط `AUDIO_STARTED`/`AUDIO_COMPLETED`، إزالة الربط المؤقت من `Commit 5`، تحديث `BootReceiver`, `KhushuRestoreReceiver`, `KhushuModePlugin`, `SalahWidgetProvider` | **نعم:** دمج فترتين (`1:00–1:15` + `1:10–1:20`)، انتظار `AUDIO_COMPLETED` بثبات `endMs`، احترام تعديل المستخدم للهاتف، إعادة التشغيل، والإلغاء اليدوي الكامل. | عرض شرح الدمج بالواجهة فقط. |
| **Commit 8** | عرض شرح الدمج بالواجهة عند `mergedCount > 1` (`KhushuModeDashboardCard`, `KhushuModeSheet`) وتهدئة `useKhushuAutoScheduler` | **نعم (القبول النهائي):** التحقق من اختفاء الشرح لفترة واحدة وظهوره عند الدمج الفعلي. | لا شيء (اكتمال Task 10 و10.5). |

**تحليل بديل لترتيب `Commit 5` (هل يمكن حل حادثة العصر أبكر؟):**
- قد يبدو للوهلة الأولى أن إزالة `khushu_window_collision` (`athanAlarmPlugin.ts:602–621`) وكتم `AlertDuringKhushuPolicy.kt` أبكر (قبل `Commit 4b`) يحل الحادثة أسرع. لكن من الكود الفعلي: قبل `Commit 4b` لا يزال المنبه المخصص يعمل عبر `NotificationChannel.setSound()` (`AthanAlarmReceiver.kt:227`)، وهي قناة إشعارات يكتمها أندرويد نفسه في وضع `RINGER_MODE_SILENT` / `DND`! كما أن إزالة `same_minute_priority` قبل `4b` تجعل منبهين في نفس الدقيقة يتصادمان صوتياً بلا طابور.
- البديل الوحيد الأسرع نظرياً هو دمج `Commit 4b + Commit 5` في commit واحد، لكننا نوصي بإبقائهما منفصلين: `4b` يثبت أن تشغيل المنبهات عبر `RingPlaybackService` سليم أولاً، ثم `5` يزيل إزاحات الجدولة وكتم الخشوع وحارس `requestCode` مع إمكانية `git revert` نظيفة لكل خطوة.

---

## 6. المخاطر وحالات السباق (Risks & Race Conditions)

1. **تزامن أذان + انتهاء منبه + بداية خشوع في نفس اللحظة (`±50ms`):** يعالج بتشغيل كل من `RingCoordinator` و`KhushuManager` كـ Single-Threaded Serial Actor عبر `HandlerThread` مخصص مع ربط `requestId`.
2. **ترتيب بث `AlarmManager` لمنبهين في نفس الدقيقة:** استخدام نافذة تجميع `COALESCE_WINDOW_MS = 200ms` للمنبهات غير الأذان لترتيبها وفق `(priority DESC, listOrder ASC)`، بينما الأذان ينطلق بـ `0ms` تأخير.
3. **سلوك DND (`INTERRUPTION_FILTER_NONE` مقابل `ALARMS`):** يُحسم عملياً في **`Commit 0a`** قبل بناء المحرك.
4. **قيود `startForegroundService` في Android 12+:** استدعاء `startForeground()` في السطر الأول لـ `RingPlaybackService.onStartCommand` قبل فك الصوت أو `prepareAsync()` مع `PARTIAL_WAKE_LOCK`.
5. **تضارب `useAthanPlayer` (`369`) و`usePrayerScheduler` (`204, 306`):** منعه في `Commit 5` بحيث يعرض التطبيق شاشة التنبيه فقط مرتبطة بحالة `RingCoordinator` دون قتل الخدمة الأصلية أو تشغيل صوت HTML ثانٍ.

---

## 7. اختبارات القبول لـ Task 10 (11 سيناريو إلزامي + تفاصيل التنفيذ)

> **ملاحظة البيئة:** الحاوية الحالية لا تحتوي Java/Gradle لاختبارات Kotlin (تُنفَّذ عبر CI/Android Studio)، بينما تعمل اختبارات TS عبر `npm test` (`tsx --test`). الاختبارات الـ 11 محدثة لتعكس الثوابت المعتمدة (`GAP_AFTER_MS = 2000L`, `DHIKR_MAX_DEFER_MS = 600_000L`, `fadeInMs = 1500/500`, `240_000L + 30_000L`).

| # | السيناريو المطلوب اختباره | الملف المقترح | نوع التنفيذ | المعطيات (Fixtures) | النتيجة المتوقعة |
|---|---|---|---|---|---|
| 1 | أذان منفرد يرن حتى نهايته الطبيعية | `RingQueuePolicyTest.kt` + Device (`4a`) | `unit` (JVM) + `device` | طلب `ATHAN` بملف صوت مدته `15s` مقاس مسبقاً | إطلاق `AUDIO_STARTED(reqId)`، ثم `AUDIO_COMPLETED(reqId, "natural")` عند انتهاء `MediaPlayer` فعلياً، وتسجيل `played`. |
| 2 | أذان ومنبه مخصص (`CUSTOM_ALARM`) متزامنان / `ATHAN` يقطع منبهاً | `RingQueuePolicyTest.kt` + Device (`4b`) | `unit` (JVM) + `device` | `CUSTOM_ALARM` جارٍ عند `T=0`، يصل `ATHAN` عند `T=2s` | يتوقف المنبه فوراً ويُسجَّل **`deferred`**، يرن الأذان حتى `AUDIO_COMPLETED`، ثم بعد **`2000ms`** يُعاد تشغيل المنبه ويُسجَّل **`played`**. |
| 3 | منبهين في نفس الدقيقة بالترتيب + تفرد `requestCode` | `RingQueuePolicyTest.kt` + `RequestCodeCollisionTest.kt` + `athanAlarmPlugin.ts` tests | `unit` (JVM & TS) + `device` (`5`) | منبه A (`listOrder=0`) ومنبه B (`listOrder=1`) على `15:00` | لا ترحيل لـ `15:01`؛ لكل منهما `requestCode` فريد؛ كاشف التصادم يسجّل `request_code_collision` عند التصادم المصطنع فقط دون تغيير `requestCode`؛ يرن A أولاً حتى `AUDIO_COMPLETED`، يليه فاصل **`2000ms`**، ثم يرن B. |
| 4 | ترتيب الأولويات الأربع + انتهاء صلاحية تأجيل الذكر | `RingQueuePolicyTest.kt` | `unit` (JVM) | 4 طلبات متزامنة + حالة `DHIKR` مؤجل لأكثر من `600_000ms` (10د) | ترتيب التنفيذ `ATHAN > CUSTOM_ALARM > PRE/POST_ATHAN > DHIKR`؛ الذكر المتأخر أقل من `10د` يُعاد تشغيله (`deferred -> played`)، وفوق `10د` يُلغى كـ **`skipped`** (`dhikr_defer_expired_10m`). |
| 5 | **حادثة العصر:** منبه بعد الأذان عند `2:52` مع خشوع `2:52–3:07` | `athanAlarmPlugin.khushu.test.ts` + `AlertDuringKhushuPolicyTest.kt` + Device (`5`) | `unit` (TS & JVM) + `device` (`5`) | أذان `2:42`، إقامة `+10m` (`2:52`)، منبه `after +10m` (`2:52`) | جدول TS يبقي المنبه عند **`2:52`**؛ عند الرنين عند `2:52` لا يُكتم المنبه ويرن صوته كاملاً (`played`)، وتأجيل الخشوع يتم في `Commit 5/7`. |
| 6 | منبه مخصص أثناء خشوع نشط (`SILENT` و`DND`) | `AlertDuringKhushuPolicyTest.kt` + Device (`5`) | `unit` (JVM) + `device` (`5`) | خشوع نشط (بالنمط المعتمد من `0a`) + منبه مخصص | المنبه يرن بصوت مسموع عبر `USAGE_ALARM` + `AudioFocus` (لا `salah_custom_alarms_silent`) وتسجل النتيجة `played`. |
| 7 | مهلة الأمان (`measured + 30000ms`) مقابل `AUDIO_COMPLETED` الفعلي | `RingQueuePolicyTest.kt` + `device` (`4a`) | `unit` (JVM) + `device` | 1) ملف مقاس `10s` (`safetyTimeoutMs = 40_000ms`). 2) تعليق مصطنع لـ `MediaPlayer` | 1) الطبيعي ينتهي عند `10s`. 2) المعلق يقطعه timeout بعد **`measured + 30_000ms`** ويسجل `error/timeout` ويفرج عن الطابور. |
| 8 | قياس مدة الأذان وقت الحفظ مقابل أذان غير مقاس | `RingQueuePolicyTest.kt` + `AthanAlarmPlugin.kt` (`Commit 2`) | `unit` (JVM) + `device` | 1) ملف محفظ مدته `185,000ms`. 2) مسار غير مقاس (`null`) | 1) `safetyTimeoutMs = 185_000 + 30_000 = 215_000ms`. 2) للأذان غير المقاس تُستخدم الافتراضية **`240_000ms`** (`+ 30_000ms` للـ timeout). |
| 9 | ميزة `fadeInMs` (`1500`/`500`) و`AudioFocus` | `RingQueuePolicyTest.kt` + `device` (`4a/4b`) | `unit` (JVM) + `device` | تطبيق وسائط يعمل في الخلفية عند إطلاق أذان (`1500ms`) ومنبه (`500ms`) | طلب `AudioFocus`، تصاعد الصوت خلال `1500ms` للأذان و`500ms` للمنبه، ثم تحرير `AudioFocus` عند `AUDIO_COMPLETED`. |
| 10 | منبه صامت أو ملف تالف | `RingQueuePolicyTest.kt` + `device` (`4b`) | `unit` (JVM) + `device` | 1) `soundType="silent"`. 2) مسار مفقود/تالف | 1) نشر الإشعار المرئي وتسجيل **`skipped`**. 2) السقوط لـ `RawResource`/`SystemDefaultAlarm` أو تسجيل **`error`** دون تعليق الطابور. |
| 11 | قتل التطبيق/فتحه وقت الرنين (منع الرنين المزدوج B4) | `RingCoordinatorDedupTest.kt` + `usePrayerScheduler.test.ts` + `device` (`5`) | `unit` (JVM & TS) + `device` | فتح التطبيق لحظة رنين أذان أو منبه أو بعد قتله عند `15:00` | عدم قتل الأذان الأصلي من `useAthanPlayer`، عدم تشغيل صوت HTML ثانٍ موازٍ، وعدم إعادة تشغيل أذان مكتمل. |

---

## 8. خطة الاختبارات الأولية لـ Task 10.5 (`KhushuManager`)

| # | حالة الاختبار | نوع التنفيذ | التحقق المطلوب |
|---|---|---|---|
| 1 | اتحاد فترتين متداخلتين (`1:00–1:15` + `1:10–1:20`) | `unit` (JVM) | فترة واحدة `1:00–1:20`، `mergedCount == 2`، `isMerged == true`. |
| 2 | اتحاد فترتين ملزوقتين (`1:00–1:15` + `1:15–1:25`) | `unit` (JVM) | تمديد مستمر في فترة واحدة حتى `1:25` دون فك الكتم عند `1:15`. |
| 3 | عدم التقصير (`1:00–1:25` + `1:05–1:15`) | `unit` (JVM) | بقاء `effectiveEndMs` عند `1:25`، `mergedCount == 2`. |
| 4 | تطابق `triggerId` مكرر | `unit` (JVM) | تجاهل المكرر دون تغيير اللقطة أو الأوقات أو الإشعار. |
| 5 | تأجيل الكتم أثناء صوت `RingCoordinator` بثبات `endMs` المطلق | `unit` (JVM) + `device` (`7`) | خشوع `2:52–3:07` ومنبه `2:52` ينتهي عند `2:52:48` → الكتم عند `2:52:48` والاستعادة عند **`3:07:00`**. |
| 6 | حفظ واستعادة حالة الهاتف مع احترام التعديل اليدوي | `unit` (JVM) + `device` (`7`) | استعادة `original` فقط إذا لم يغيّر المستخدم الهاتف يدوياً، وتسجيل `skipped_user_modified` إن غيّره. |
| 7 | الإلغاء اليدوي أثناء فترة مدمجة + إعادة التشغيل | `unit` (JVM) + `device` (`7`) | الإلغاء اليدوي يُنهي **الفترة المدمجة كلها** فوراً؛ والإقلاع يعيد جدولة المتبقي أو ينظف المنتهي. |
| 8 | دمج `silent` + `dnd` وعرض سطر الشرح بالواجهة (`mergedCount > 1`) | `unit` (JVM & TS/React) | اعتماد `dnd` عند الدمج (مع توفر الإذن)؛ وإظهار سطر الشرح بالواجهة فقط عند `mergedCount >= 2`. |

---

## 9. القرارات المعتمدة (Approved Decisions) — لم تعد نقاطاً مفتوحة

1. **الإلغاء اليدوي أثناء فترة خشوع مدمجة:** **يُنهي الفترة المدمجة كلها فوراً** (ويستعيد حالة الهاتف إذا كان التطبيق هو من غيّرها ولم يعدلها المستخدم يدوياً).
2. **`DHIKR` عند المقاطعة:** يتحول إلى **`deferred`** بحد أقصى 10 دقائق (`DHIKR_MAX_DEFER_MS = 600_000L`)، وإذا انقضت 10 دقائق قبل دوره يتحول إلى **`skipped`** ويُسجَّل السبب في السجل.
3. **الثوابت المعتمدة:**
   - `GAP_AFTER_MS = 2_000L` (فاصل ثانيتين بين منبهات نفس الدقيقة أو بعد الأذان).
   - `fadeInMs`: **`1_500L`** للأذان و**`500L`** للمنبهات المخصصة.
   - المدة الافتراضية للأذان الجديد غير المقاس فقط: **`DEFAULT_ATHAN_EXPECTED_DURATION_MS = 240_000L`**.
   - مهلة الأمان: **`safetyTimeoutMs = measuredDurationMs + 30_000L`** (وللأذان غير المقاس: `240_000L + 30_000L`).
4. **DND على أندرويد:** اعتماد **`INTERRUPTION_FILTER_ALARMS`** في `KhushuManager` إذا أثبت اختبار **`Commit 0a`** أن `INTERRUPTION_FILTER_NONE` يكتم `MediaPlayer(USAGE_ALARM)`.
5. **اختيار النمط عند دمج `silent` و`dnd`:** يُعتمد **`dnd`** دائماً عند الدمج (بشرط توفر إذن DND `isNotificationPolicyAccessGranted`).

---

## 10. حلول بديلة ومقارنات معمارية (مقترحة للمقارنة فقط دون تنفيذ)

1. **`@PluginMethod runDndAudioProbe` في `AthanDiagnosticsSection` مقابل `Activity` تشخيصية مستقلة (`Commit 0a`):** الأول لا يضيف شاشات للـ Manifest ويكتب تلقائياً في `getNativeEventLog` ويعيد حالة الهاتف آلياً، مما يجعله أبسط وأنظف في الحذف بعد القياس.
2. **تجميع سجلات `0b` في مفتاح مستقل `KEY_RING_DIAG_LOG` مقابل مشاركة `KEY_NATIVE_EVENT_LOG` أو `console.log`/`logcat`:** الفصل في `KEY_RING_DIAG_LOG` يجمع `JS` و`NATIVE` زمنياً في شاشة التشخيص دون حاجة لحاسوب وفي نفس الوقت يمنع طرد سجلات الحوادث المهمة من `KEY_NATIVE_EVENT_LOG`.
3. **إبقاء `AthanForegroundService.kt` سليماً + إضافة `RingPlaybackService.kt` مقابل تعديل `AthanForegroundService` مباشرة:** إبقاء الخدمة القديمة دون مساس مع مفتاح `ring_coordinator_enabled` يتيح رجوعاً فورياً آمناً من `SharedPreferences` دون `git revert`.
4. **تشغيل المنبهات عبر `MediaPlayer(USAGE_ALARM)` + إشعار مرئي صامت مقابل `NotificationChannel.setSound()`:** الوحيد الذي يوفّر `AUDIO_COMPLETED` الفعلي، `fadeInMs`، `GAP_AFTER_MS`، واستئناف المنبهات المؤجلة بعد الأذان، وتخطي الكتم أثناء الخشوع.
5. **معالجة slider صوت الأذان (`STREAM_ALARM` مقابل `STREAM_MUSIC`):** الخيارات الثلاثة موثقة بالكامل في القسم `3.6` بانتظار قرارك لاحقاً (خارج تنفيذ Task 10 الأساسي ما لم تقرر ربطه).

---

## Closing status
- Completed: تم تطبيق التعديلات الأربعة على `/task10-plan.md` مع أسبابها، وتم تنفيذ `Commit 0a` (مسبار DND المؤقت بـ `try/finally` + حفظ/استعادة `SharedPreferences` عند الإقلاع + أزرار DevMode) و`Commit 0b` (قياس الرنين المزدوج في مخزن مستقل `KEY_RING_DIAG_LOG` بالملفات المحددة دون تغيير أي سلوك أو شروط `if`). لم يُمس `REFERENCE.md` ولا `docs/locked-registry.md` ولا `getDeterministicRequestCode`.
- Remaining: تشغيل اختبار `Commit 0a` (4 خطوات DND) على الهاتف الفعلي وتثبيت نتائجه، وتشغيل التطبيق ليوم أو وقت أذان ومنبه مخصص لقراءة سجل `Commit 0b`، ثم مراجعة النتائج قبل الإذن ببدء `Commit 1`.
- Blocked or needs a decision:
  - نتيجة اختبار `Commit 0a` على الجهاز الفعلي لحسم `INTERRUPTION_FILTER_NONE` مقابل `INTERRUPTION_FILTER_ALARMS` قبل `Commit 3`.
  - اختيارك المستقبلي لآلية التعامل مع slider صوت الأذان من الخيارات الثلاثة في القسم `3.6`.
  - ملاحظة بيئة التنفيذ: الحاوية لا تضم Java/Gradle ولا `.git`؛ لذا تجميع وبناء Android APK/JVM يتطلبان Android Studio / CI / جهازاً فعلياً.
