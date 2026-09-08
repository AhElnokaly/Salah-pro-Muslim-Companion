# fix-state: P25 حل مشكلة تشوه الأيقونة ومنع انهيار التطبيق عند بدء التشغيل (Crash on Startup)

| # | المهمة | Status | QA Gate | Notes |
|---|--------|--------|---------|-------|
| 1 | إعادة توليد وتصحيح ملفات أيقونة وشاشة البداية لأندرويد (`mipmap-*` و `drawable-*`) | done | PASS | استبدال ملفات الـ PNG التالفة بملفات PNG معيارية سليمة ومقاسات دقيقة انطلاقاً من شعار هِمّتي الأصلي `logo.jpg` وتعديل لون الخلفية إلى التدرج الداكن الفاخر `#0A1118` |
| 2 | إنشاء ملف الألوان المفقود `colors.xml` لثيم التطبيق الأساسي في أندرويد | done | PASS | تعريف `colorPrimary` و `colorPrimaryDark` و `colorAccent` لمنع انهيار `Theme.SplashScreen` |
| 3 | تصحيح ترتيب تسجيل إضافات كاباسيتور في `MainActivity.kt` قبل `super.onCreate` | done | PASS | تسجيل `AthanAlarmPlugin` و `KhushuModePlugin` قبل تهيئة الجسر لمنع استدعاءات مفقودة |
| 4 | تعزيز قواعد `proguard-rules.pro` وحماية مكونات WebKit و Reflection من الحذف | done | PASS | إبقاء `android.webkit` و `androidx.webkit` و `kotlin.Metadata` لتفادي انهيار Minification/R8 |
| 5 | مزامنة وبناء الأصول وضمان نجاح الاختبارات بالكامل | done | PASS | 70/70 اختبار ناجح + `vite build` و `npx cap copy android` بنجاح |
