export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  releaseName: string;
  changelog: string[];
}

export const APP_VERSION: AppVersionInfo = {
  version: '1.0.4',
  buildNumber: 104,
  releaseDate: 'أغسطس 2026',
  releaseName: 'إصدار الاستقرار وتوافق الـ RTL الكامل',
  changelog: [
    'ضبط ومحاذاة اتجاه النصوص اليمينية بالكامل في القائمة الجانبية',
    'إعادة تصميم وتنسيق بطاقات جولة استكشاف المزايا بصرياً',
    'إضافة شارة رقم الإصدار وتفاصيل البناء في القائمة الجانبية',
    'دعم التحديث التلقائي وبناء الـ APK المتزامن مع GitHub Actions'
  ]
};
