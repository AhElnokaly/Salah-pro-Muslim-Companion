# المرجع التقني (7): منظومة البناء والتشغيل الآلي (CI/CD & GitHub Actions Workflows)

---

## 1. التوصيف العام لمنظومة CI/CD (Overview)

يحتوي مستودع مشروع **«همّتي»** على منظومة أتمتة وبناء متكاملة عبر **GitHub Actions** تنقسم إلى مسارات ويب ونشر سحابي (Web & PWA)، ومسارات بناء تطبيقات الهاتف المحمول (Android Native APKs):

```
                                  [ Git Push / Tags ]
                                           │
             ┌─────────────────────────────┼─────────────────────────────┐
             ▼                             ▼                             ▼
   [ Deploy PWA Pipeline ]       [ Android Debug Pipeline ]    [ Android Release Pipeline ]
   (.github/workflows/deploy.yml) (.github/workflows/build-apk.yml) (.github/workflows/build-release-apk.yml)
             │                             │                             │
             ▼                             ▼                             ▼
   Build Web App (Vite)          Build Web + Cap Sync          Build Web + Cap Sync
             │                             │                             │
             ▼                             ▼                             ▼
   Deploy to gh-pages Branch     Gradle assembleDebug          Gradle assembleRelease
             │                             │                             │
             ▼                             ▼                             ▼
  pages-build-deployment         Artifact: Hemmaty-Debug.apk   Sign & Align with Keystore
  (Live PWA on Web)              (SHA-256 Verified)            Artifact + GitHub Release Tag
```

---

## 2. توثيق مسارات العمل الناجحة (Battle-Tested Workflows)

### 🟢 المسار الأول: نشر تطبيق الويب PWA (`Deploy PWA to GitHub Pages`)
* **الملف المسؤول:** `.github/workflows/deploy.yml`
* **الحالة:** 🟢 **ناجح ومستقر بنسبة 100%** (متوسط زمن التنفيذ: 39 ثانية).
* **الأحداث المشغلة (Triggers):**
  - عند عمل `push` إلى فرع `main` أو `master`.
  - يدوياً عبر واجهة GitHub بواسطة `workflow_dispatch`.

#### 📄 الكود المعياري المعتمد للمسار:
```yaml
name: Deploy PWA to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code 🛎️
        uses: actions/checkout@v4

      - name: Setup Node.js 22 ⚙️
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install Dependencies 📦
        run: npm install --legacy-peer-deps

      - name: Build Project 🏗️
        run: npm run build

      - name: Deploy to GitHub Pages 🚀
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

#### 🛡️ أسرار وعوامل نجاح هذا المسار:
1. **Node.js 22 (LTS):** يوفر أحدث محرك تشغيل متوافق مع حزم Vite 6 و Tailwind CSS 4.
2. **`--legacy-peer-deps`:** يمنع أي تعارض في حزم الأقران (Peer Dependencies) ويضمن تثبيت الحزم بدون انقطاع.
3. **`concurrency` Protection:** إلغاء عمليات البناء القديمة إذا تم دفع commit جديد قبل انتهاء السابق، مما يوفر وقت الخوادم ويمنع تضارب النشر.
4. **`permissions: contents: write`:** يسمح لـ `peaceiris/actions-gh-pages` بإنشاء وتحديث فرع `gh-pages` تلقائياً عبر التوكن الافتراضي `GITHUB_TOKEN`.

---

### 🟢 المسار الثاني: التشغيل والتوزيع السحابي الداخلي (`pages-build-deployment`)
* **الملف المسؤول:** مسار داخلي مدار تلقائياً من GitHub Actions.
* **الحالة:** 🟢 **ناجح ومستمر (28 عملية نشر خضراء متتالية).**
* **الدور:** يقوم بمراقبة فرع `gh-pages` تلقائياً ونقل الملفات الثابتة إلى شبكة توصيل المحتوى (CDN) الخاصة بـ GitHub Pages لخدمة تطبيق الـ PWA على الرابط العام بشكل فوري وآمن ببروتوكول HTTPS.

---

## 3. مسار بناء حزمة الأندرويد التجريبية (`Build Android APK`)

* **الملف المسؤول:** `.github/workflows/build-apk.yml`
* **الحالة:** 🟢 **تم الإصلاح والتأمين الشامل ضد التلف.**
* **الأحداث المشغلة (Triggers):**
  - Push إلى فرع `main`.
  - عند دفع Tags جديدة بصيغة `v*`.
  - يدوياً عبر `workflow_dispatch`.

#### 🛡️ طبقات الحماية ضد الفشل المطبقة:
1. **بيئة الجافا المعتمدة:** `Java 21 (Temurin LTS)` لتوافق تام مع Capacitor 8.
2. **دمج Action رسمي لـ Gradle:** `gradle/actions/setup-gradle@v4` لتوفير كاش سريع ومستقر لحزم الـ Android SDK.
3. **نظام الاسترداد الذكي للـ Wrapper (Auto-Healing):**
   - فحص سلامة الملف الثنائي `gradle-wrapper.jar` بواسطة `unzip -t`.
   - في حال كان الملف تالفاً أو ناقصاً، يتم جلبه مباشرة من المصدر الرسمي لـ Gradle 8.14.3 دون توقف البناء.
4. **حساب التوقيع والـ Checksum:** توليد بصمة `SHA-256` لملف الـ APK وحفظها مع الحزمة كـ Artifact متاح للتحميل لمدة 30 يوماً.

---

## 4. مسار بناء حزمة الإصدار الموقعة (`Build Release Android APK`)

* **الملف المسؤول:** `.github/workflows/build-release-apk.yml`
* **الأحداث المشغلة (Triggers):**
  - عند إطلاق إصدار جديد (Push Tag `v*`).
  - تشغيل يدوي مخصص بطلب من المطور عبر `workflow_dispatch`.

#### 🔐 مصفوفة الأسرار المطلوبة للتوقيع (GitHub Secrets Matrix):

| اسم السر (Secret Name) | الوصف | القيمة المتوقعة |
| :--- | :--- | :--- |
| `ANDROID_KEYSTORE_BASE64` | ملف الـ Keystore محول إلى نصوص Base64 | ناتج تشغيل: `base64 -w 0 hemmaty-release.jks` |
| `KEY_ALIAS` | الاسم المستعار لمفتاح التوقيع داخل الـ Keystore | مثال: `hemmaty-key` |
| `KEY_PASSWORD` | كلمة مرور المفتاح الخاص | كلمة المرور السرية المحددة أثناء إنشاء المفتاح |
| `KEYSTORE_PASSWORD` | كلمة مرور ملف الـ Keystore بالكامل | كلمة مرور مخزن المفاتيح |

---

## 5. مصفوفة التوافق القياسية المعتمدة (Compatibility Matrix)

```ini
[Runtime & Tools]
Node.js                   = 22.x (Active LTS)
Java JDK                  = 21 (Eclipse Temurin LTS)
Gradle Wrapper            = 8.14.3
Android Gradle Plugin     = 8.13.0
Compile SDK Target        = Android 35 (VanillaIceCream)
Min SDK Support           = Android 24 (Nougat 7.0+)
Capacitor Version         = 8.5.0
Vite Bundler              = 6.x
Tailwind CSS              = 4.x
```

---

## 6. دليل التشخيص والحلول السريعة لأخطاء CI/CD (Troubleshooting Playbook)

### 🔴 السيناريو 1: فشل الـ Gradle Wrapper مع خطأ `exit code 51`
* **السبب:** ملف `gradle-wrapper.jar` تالف أو تم رفعه بوضع نصي في Git.
* **الحل الفوري:** يقوم الـ Workflow حالياً بالتعافي التلقائي، ولإصلاحه محلياً قم بتنفيذ:
  ```bash
  curl -sSL "https://raw.githubusercontent.com/gradle/gradle/v8.14.3/gradle/wrapper/gradle-wrapper.jar" -o "android/gradle/wrapper/gradle-wrapper.jar"
  ```

### 🔴 السيناريو 2: خطأ `ERESOLVE unable to resolve dependency tree` في npm
* **السبب:** تضارب في تعريفات الـ peer dependencies بين حزم React 18 وبعض الإضافات.
* **الحل الفوري:** الاعتماد دائماً على أمر:
  ```bash
  npm install --legacy-peer-deps
  ```

### 🔴 السيناريو 3: خطأ `Permission Denied (126)` لملف `gradlew`
* **السبب:** فقدان صلاحية التنفيذ `+x` في نظام الملفات بنظام Linux.
* **الحل الفوري:**
  ```bash
  git update-index --chmod=+x android/gradlew
  ```

### 🔴 السيناريو 4: تعطل بناء الـ Release بسبب Keystore غير صحيح
* **السبب:** وجود مسافات أو أسطر جديدة داخل `ANDROID_KEYSTORE_BASE64`.
* **الحل الفوري:** استخدام المعامل `-w 0` عند تشفير الملف لمنع تكسير الأسطر:
  ```bash
  base64 -w 0 release.keystore > keystore.txt
  ```
