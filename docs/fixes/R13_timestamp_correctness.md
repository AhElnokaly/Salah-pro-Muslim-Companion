# R13: صحة توقيت الجدولة ومطابقة المناطق الزمنية (Prayer Schedule Timestamp Correctness)

## 1. المشكلة والدليل (Problem & Evidence)
- **المشكلة:** كانت أوقات الصلوات تُبنى باستخدام `pDate.setHours(hours, minutes, 0, 0)` و`new Date(year, month, day, hours, mins)`. هذه التوابع تعتمد حصرياً على **توقيت الجهاز المحلي (Host Device Wall-Clock)**.
- **الأثر السلبي:** إذا كان الجهاز في منطقة زمنية مختلفة عن المدينة المختارة (مثلاً: جهاز في نيويورك `America/New_York` والمدينة القاهرة `Africa/Cairo`، أو مسافر من الرياض إلى لندن)، فإن توقيت `timeMs` الواصل إلى `AlarmManager` وService Worker ينزلق بعدد ساعات فارق التوقيت بين الجهاز والمدينة.
- **مشكلة منتصف الليل (Carry):** عند وجود تعديل يدوي (`manualOffsets`) يدفع صلاة العشاء لما بعد منتصف الليل (مثلاً: 23:45 + 30 دقيقة = 00:15)، كانت دالة التنسيق تطبق `% 24` فيعود الوقت إلى `00:15` صباح نفس اليوم بدلاً من التقدم إلى فجر اليوم التالي، مما يجعل وقت المنبه ماضياً بـ 24 ساعة.

## 2. السبب الجذري (Root Cause)
- الاعتماد على كائنات `Date` المحلية في بناء الـ timestamps.
- غياب دالة موحدة pure تأخذ `cityDate` و`prayerMinutes` و`timezoneId` وتبني الـ epoch ms بحساب فلكي وUTC مستقل عن بيئة الجهاز.
- عدم تضمين `timezoneId` في مفتاح كاش المواقع `locationCache.ts`.

## 3. القرار والبدائل المرفوضة (Decision & Rejected Alternatives)
- **القرار المعتمد:**
  1. بناء دالة معيارية pure: `buildPrayerTimestampMs({ cityDate, prayerMinutes, timezoneId })`.
  2. حساب الـ carry داخلياً داخل الدالة (سواء كان موجباً `>= 1440` أو سالباً `< 0`) بتقديم أو تأخير تقويم المدينة في فضاء UTC.
  3. استخدام `Intl.DateTimeFormat` مع `hourCycle: 'h23'` لحساب الإزاحة اللحظية الدقيقة عند التوقيت المستهدف مع دعم DST الديناميكي.
  4. سياسة عدم الانهيار (No-Throw): الأخطاء في المدخلات تسجل تحذيراً وترجع fallback آمن بدلاً من رمي استثناء يوقف الجدولة.
  5. معالجة DST: فجوة الربيع تتقدم تلقائياً لأول لحظة صالحة، وتكرار الخريف يعتمد قاعدة **الحدوث الأول (First Occurrence)**.
- **البدائل المرفوضة:**
  - *رفض الاعتماد على `dayCarry` كمدخل خارجي منفصل:* لمنع وجود مصدرين للحقيقة؛ الـ carry يُحسب من `prayerMinutes` داخلياً.
  - *رفض تمرير `timeStr` للدالة:* التحويل من النص يحصل قبل الاستدعاء لضمان أن الدالة pure رقمية 100%.

## 4. الملفات المتأثرة في R13a (Files Affected)
- `src/utils/prayerTimestamp.ts`: المحرك المعياري لتحويل التوقيت ومساعدات تقويم المدينة.
- `src/utils/prayerTimestamp.test.ts`: 14 اختبار وحدة شامل للخاصية المستقلة وحالات الـ carry والـ DST.
- `scripts/test_tz_invariance.cjs`: سكريبت فحص عدم التأثر بالمناطق الزمنية عبر 5 عمليات Node منفصلة.
- `package.json`: إضافة أمر `"test:tz"`.
- `CODE_INDEX.md` و`FIXES-STATE.md`: التوثيق المعماري وتتبع الحالة.

## 5. قائمة الاختبارات وتصنيفها (Tests & Evidence Classification)
- `TS_VERIFIED`:
  - 14 اختبار وحدة في `src/utils/prayerTimestamp.test.ts`:
    - مطابقة القيم المرجعية الذهبية (Golden Reference Values) للقاهرة والرياض ونيويورك.
    - عبور منتصف الليل (+1440 دقيقة، +1455 دقيقة، -15 دقيقة، +2 يوم).
    - التوقيت الصيفي (Spring forward gap وFall back overlap مع First Occurrence).
    - تحمل الأخطاء وسياسة No-Throw لمدخلات غير صالحة.
    - مساعدات `getCityCalendarDate` و`advanceCityCalendarDate`.
  - سكريبت `test:tz`: اجتياز المطابقة الرقمية التامة للـ timestamps عبر 5 عمليات Node منفصلة معزولة (`Africa/Cairo`, `Asia/Riyadh`, `America/New_York`, `UTC`, `Australia/Sydney`).
- `KOTLIN_STATIC`:
  - مطابقة ومراجعة كود `PrayerTimesCalculator.kt` لحساب الزوايا الشمسية وإزاحة التوقيت.

## 6. المخاطر المتبقية (Residual Risks)
- دالة `buildPrayerTimestampMs` لم تُربط بعد بالمسارات الحية (مؤجلة إلى R13b بعد موافقة R12a وR12b)، وبالتالي لا يوجد أي خطر حالي على مسارات الأذان القائمة.
