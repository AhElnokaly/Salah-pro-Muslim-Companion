# Persistent Project Rules & Instructions for AI Assistant (AGENTS.md)

## 1. قواعد وحماية الصور والأصول البصرية (Strict Image & Asset Protection)
- **عدم التغيير أو الضغط (No Distortion or Unwanted Compression):**
  - يجب استخدام خاصية `object-cover` دائماً مع كل عنصر صورة (`<img>`).
  - يجب إضافة خاصية `shrink-0` على الحاويات لمنع تشوه الصورة أو انغفال أبعادها عند تغيير حجم الشاشة.
- **تثبيت مسارات الصور العامة (Canonical Image Persistence):**
  - لا تقم بتوليد أو تغيير أسماء الصور ذات الأرقام العشوائية في ملفات التوجيه.
  - استخدم الأسماء المستقرة التالية الثابتة في المجلدات العامة والبرمجية:
    - الشعار والرمز: `/public/images/logo.jpg` و `src/assets/images/hemmaty_logo.jpg`
    - خلفية المسجد الليلي: `/public/images/mosque_dark.jpg` و `src/assets/images/mosque_backdrop_dark.jpg`
    - خلفية المسجد النهاري: `/public/images/mosque_light.jpg` و `src/assets/images/mosque_backdrop_light.jpg`
    - خلفية يوم الجمعة: `/public/images/friday_mosque.jpg` و `src/assets/images/friday_mosque_backdrop.jpg`
    - خلفية البانرات والمناسبات: `/public/images/mosque_banner.jpg` و `src/assets/images/mosque_banner.jpg`
- **الحماية من الحذف أو التلف (Protection Against Deletion):**
  - يمنع حذف هذه الملفات أو استبدالها بروابط وهمية أو مسارات غير موجدة.

## 2. النطاق والالتزام بحدود التغيير المطلوبة (Strict Scope Boundaries)
- **الالتزام الدقيق:** التغييرات المطلوبة تنفذ كما حددها المستخدم فقط دون إضافة أو تعديل عناصر أو صفحات غير مطلوبة.
- **السلامة الهيكلية:** الحفاظ على سلامة شجرة الملفات وعدم إعادة هيكلة الكود بدون طلب صريح.
