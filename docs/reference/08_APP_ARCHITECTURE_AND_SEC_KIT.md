# المرجع الشامل لمعمارية التطبيق وحزمة الأمان (Hemmaty App Architecture & Security Kit)

---

## 🏗️ الجزء الأول: المعمارية الهندسية الشاملة (System Architecture Blueprint)

### 1. مخطط التدفق المعماري الشامل (Full Architectural ASCII Diagram)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER (PWA & Native)                         │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │  Web / PWA (Browser)  │                       │  Android App (Native) │
     │  (Service Worker +    │                       │  (Capacitor 8 Bridge  │
     │   IndexedDB Audio)    │                       │   + Kotlin Plugins)   │
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         │
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      CORE APPLICATION ENGINE (React 19 + TS)                     │
├──────────────────────────────────────────────────────────────────────────────────┤
│  • Safe Storage Engine (localStorage + Quota & Exception Resilience)            │
│  • Prayer Engine (Offline Adhan.js + Dynamic Angles + Math Geolocation)         │
│  • Spiritual State Store (Quran, Khatmat, Dhikr Logs, Worship Alarms)           │
│  • Audio Pipeline (IndexedDB + Cached Assets + Local Fallback Data-URLs)        │
│  • Realtime Notification Scheduler (Capacitor Athan Alarm Plugin Bridge)        │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
┌─────────────────────────────────┐             ┌──────────────────────────────────┐
│     ANDROID NATIVE SUBSYSTEM    │             │       CI/CD AUTOMATION STACK     │
├─────────────────────────────────┤             ├──────────────────────────────────┤
│ • AthanAlarmPlugin.kt (Bridge)  │             │ • deploy.yml (PWA to GH Pages)   │
│ • AthanForegroundService (Audio)│             │ • build-apk.yml (Debug Package)  │
│ • AthanBootReceiver (Re-alarm)  │             │ • build-release-apk.yml (Signed) │
│ • ScheduleRenewalWorker (Renew) │             │ • setup-gradle@v4 (Auto-Healing) │
│ • SalahWidgetProvider (Widget)  │             │ • Java 21 + Node 22 Matrix       │
└─────────────────────────────────┘             └──────────────────────────────────┘
```

---

### 2. مصفوفة الطبقات والمسؤوليات (Layer Responsibilities Matrix)

| الطبقة (Layer) | المكونات الرئيسية | المسؤولية الوظيفية | معيار الأمان والاستقرار |
| :--- | :--- | :--- | :--- |
| **Presentation Layer** | `Dashboard`, `QuranTracker`, `SmartFabSystem`, `ClockBlock` | عرض الواجهات، إدارة الإدخال، التفاعل اللحظي بالثواني، وتوفير تجربة مستخدم خالية من التأخير. | استخدام `React.memo`، التفكيك الديناميكي عبر `React.lazy`، وتوافق تام مع معايير الـ RTL و `aria-label`. |
| **Business Logic Layer** | `prayerTimes.ts`, `athanSoundEngine.ts`, `islamicCalendarEngine.ts` | حساب مواقيت الصلاة رياضياً محلياً 100% دون خوادم، جدولة التنبيهات، وإدارة دورة حياة الختمات. | عزل الدوال الرياضية الحسابية النقية (Pure Functions) مع اختبارات أداء سريعة. |
| **Safe Storage Layer** | `storage.ts`, `audioStorage.ts` | تخزين إعدادات وسجلات المستخدم محلياً مع حماية ضد انهيارات المساحة وتلف الـ JSON. | `safeGetJSON` و `safeSetJSON` مع آليات Fallback وقائية تمنع شاشات التعطل. |
| **Native Integration** | `AthanAlarmPlugin.kt`, `AthanForegroundService.kt` | تشغيل الأذان في الخلفية، الاستيقاظ أثناء `Doze Mode`، وتحديث ودجت الشاشة الرئيسية. | استخدام `WakeLock` مؤقت (بحد أقصى 3 دقائق) والتحقق من صلاحية `SCHEDULE_EXACT_ALARM`. |

---

## 🛡️ الجزء الثاني: حزمة الأمان والتحصين الشامل (Security Kit - Sec Kit)

### 1. معايير أمان التوقيع الرقمي ومفاتيح الإنتاج (Keystore & Release Security)

```ini
[Production Keystore Standards]
Algorithm        = RSA 2048-bit (أو أحدث)
Digest Algorithm = SHA-256
Key Validity     = 25+ Years (9125+ Days)
Signing Tool     = apksigner (v2 + v3 + v4 Signature Schemes)
Alignment        = zipalign (4-byte boundary)
```

* **سياسة عزل الأسرار (Secret Isolation Policy):**
  - يُحظر تماماً تخزين ملفات الـ Keystore (`.jks`, `.keystore`) أو كلمات المرور داخل مستودع Git العام.
  - يتم تشفير الـ Keystore كنص Base64 وتمريره حصرياً عبر **GitHub Repository Secrets** (`ANDROID_KEYSTORE_BASE64`, `KEY_ALIAS`, `KEY_PASSWORD`, `KEYSTORE_PASSWORD`).
  - في بيئة CI/CD يتم فك التشفير في مسار معزول وتدمير الملف المؤقت فور انتهاء التوقيع.

---

### 2. تحصين الصلاحيات في أندرويد (Android Permissions Hardening)

تتبع منظومة **همّتي** مبدأ الحد الأدنى من الصلاحيات (Least Privilege Principle):

| الصلاحية (Permission) | الغرض المبرر | مستوى الخطورة | الحماية والإلزام |
| :--- | :--- | :--- | :--- |
| `POST_NOTIFICATIONS` | إظهار إشعارات الأذان والصلوات (Android 13+) | متوسط | طلب الصلاحية ديناميكياً فقط عند رغبة المستخدم في تفعيل المنبهات. |
| `SCHEDULE_EXACT_ALARM` | إطلاق الأذان في الثانية الدقيقة للوقت الشرعي | حساس | الفحص المسبق عبر الجسر وتوجيه المستخدم لإعدادات النظام عند الرفض. |
| `FOREGROUND_SERVICE` | تشغيل صوت الأذان كاملاً بدون تقطيع | عادي | تقييد الخدمة بنوع `mediaPlayback` مع توفير زر إيقاف فوري في شريط الإشعارات. |
| `RECEIVE_BOOT_COMPLETED` | إعادة جدولة أوقات الصلوات بعد إعادة تشغيل الهاتف | عادي | معالجة خفيفة وفورية داخل `BroadcastReceiver` بدون حجز موارد. |
| `WAKE_LOCK` | تنبيه المعالج لبدء تشغيل ملف الصوت في الخلفية | متوسط | تحرير القفل (`release()`) فور اكتمال الأذان أو بحد أقصى 180 ثانية. |

---

### 3. أمان البيانات والتحقق من صحة الاستيراد (Data Integrity & Sanitization)

* **التحقق من ملفات النسخ الاحتياطي (Backup Validation Schema):**
  1. التحقق من مطابقة إصدار الملف `version`.
  2. تنقية الحقول المستوردة (Sanitization) لمنع حقن النصوص الخبيثة أو المفاتيح غير المعرفة.
  3. حظر تنفيذ الأكواد الديناميكية (`eval` / `Function constructor`) أثناء معالجة بيانات الـ JSON.

* **الحماية من هجمات XSS وسياسة أمان المحتوى (CSP):**
  - تطبيق عزل تام للـ HTML وعدم استخدام `dangerouslySetInnerHTML` على أي نصوص مدخلة من المستخدم (مثل أسماء الأذكار المخصصة أو الأدعية).
  - استخدام الخطوط والأيقونات المحلية لتقليل الاتصالات الخارجية غير الموثوقة.

---

### 4. استراتيجية العمل في وضع عدم الاتصال (Offline-First Privacy Guarantee)

```
[User Device]  ◄─── No Telemetry / Zero External Trackers ───►  [Private & Offline]
      │
      ├── 100% On-Device Calculations (Prayer times, Hijri dates, Qibla)
      ├── Local Audio Cache (IndexedDB + Bundled Data URLs)
      └── Safe Local Storage (Local Device Only)
```

1. **الخصوصية التامة:** لا يتم إرسال موقع المستخدم الجغرافي أو إحصائيات عباداته أو ختاماته إلى أي خادم خارجي.
2. **استقلالية الحسابات:** محرك المواقيت يعمل بمعادلات رياضية فلكية مدمجة لا تتطلب اتصالاً بالإنترنت نهائياً بعد تحديد الإحداثيات الأولى.

---

> 📖 **للاطلاع على المرجع المعماري والأمني الموسّع والشامل:**  
> يُرجى مراجعة الملف المرجعي الرئيسي: [`docs/APP_ARCHITECTURE_REFERENCE.md`](../APP_ARCHITECTURE_REFERENCE.md) الذي يضم تفاصيل كافة الميزات وإحصاءات الملفات والمعادلات الفلكية الدقيقة والأكواد المحظورة وفهارس النظام.

