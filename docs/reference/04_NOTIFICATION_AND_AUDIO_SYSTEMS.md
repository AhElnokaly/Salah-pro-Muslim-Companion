# المرجع التقني (4): منظومة الإشعارات والصوتيات (Notification & Audio Systems)

---

## 1. محرك الإشعارات المحلية والدفع (Push & Local Notification Engine)

يتم إدارة الإشعارات عبر ملف `src/utils/pushNotificationService.ts` والذي يوفر آليات آمنة متوافقة مع متصفحات سطح المكتب والأجهزة المحمولة.

### المعالجة الآمنة لمنشئ الإشعارات (`Notification Construction Safe Handling`):

في بعض المتصفحات المحمولة وأجهزة الأندرويد، يؤدي استدعاء `new Notification(...)` المباشر إلى ظهور خطأ حاد:
`Failed to construct 'Notification': Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead.`

#### الحل المعتمد في `sendLocalNotification`:
```typescript
export const sendLocalNotification = async (title: string, options: NotificationOptions = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return null;

  // 1. محاولة استخدام ServiceWorker أولاً للأجهزة المحمولة
  if ('serviceWorker' in navigator) {
    try {
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<ServiceWorkerRegistration | null>((resolve) => setTimeout(() => resolve(null), 1000))
      ]);
      if (registration && registration.showNotification) {
        await registration.showNotification(title, options);
        return null;
      }
    } catch (swErr) {
      console.warn("ServiceWorker showNotification failed:", swErr);
    }
  }

  // 2. الرجوع لـ new Notification() لمتصفحات سطح المكتب مع تغليف كامل بـ try/catch
  try {
    return new Notification(title, options);
  } catch (constructErr) {
    console.warn("new Notification constructor failed:", constructErr);
    return null;
  }
};
```

---

## 2. محرك تشغيل صوت الأذان (`useAthanPlayer.ts` & `audioStorage.ts`)

يوفر خطاف `useAthanPlayer` إدارة شاملة لتشغيل وصوتيات الأذان مع دعم البدائل المحلية في حال انقطاع الإنترنت.

### خطة البدائل المعتمدة (Audio Fallback Strategy):
1. **الصوت المخصص للمؤذن:** محاولة تشغيل ملف المؤذن المختار من الأرشيف الرقمي (`archiveMuezzins.ts`) أو الملفات المخزنة محلياً في `IndexedDB` عبر `audioStorage.ts`.
2. **المهلة الزمانية (Timeout):** تحديد مهلة 2.5 ثانية للتحميل من الشبكة؛ إذا تعذر التحميل، يتم الانتقال الفوري للبديل المحلي.
3. **البديل المحلي المدمج (`LOCAL_FALLBACK_AUDIO`):** ملفات تكبيرات وتلاوات مخزنة كـ Data URLs أو أصول محلية تعمل بدون حاجة للإنترنت نهائياً.

---

## 3. التحكم بالصوت والأنماط (Sound Modes & Spiritual Audio)

يحتوي ملف `src/utils/spiritualAudio.ts` على توليد أصوات وإشعار صوتي للعبادات (التكبير، المؤثرات الروحية، التنبيهات المخصصة):
- **أنماط الصوت:**
  - `full_athan`: أذان كامل.
  - `takbeer_only`: تكبيرات فقط.
  - `beep_silent`: نغمة هادئة أو وضع الصامت.
- **التشغيل الآمن:** استخدام `AudioContext` موحد أو عناصر `HTMLAudioElement` مع التأكد من تحرير الذاكرة وتجنب تداخل الأصوات.
