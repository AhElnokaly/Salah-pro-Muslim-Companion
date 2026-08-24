export function getMoonPhaseInfo(hijriDay: number) {
  const day = hijriDay || 15;
  if (day >= 1 && day <= 3) return { icon: '🌙', name: 'هلال أول الشهر', phase: 'Waxing Crescent' };
  if (day >= 4 && day <= 7) return { icon: '🌓', name: 'تربيع أول', phase: 'First Quarter' };
  if (day >= 8 && day <= 12) return { icon: '🌔', name: 'أحدب متزايد', phase: 'Waxing Gibbous' };
  if (day >= 13 && day <= 16) return { icon: '🌕', name: 'بدر كامل', phase: 'Full Moon' };
  if (day >= 17 && day <= 21) return { icon: '🌖', name: 'أحدب متناقص', phase: 'Waning Gibbous' };
  if (day >= 22 && day <= 25) return { icon: '🌗', name: 'تربيع ثاني', phase: 'Last Quarter' };
  if (day >= 26 && day <= 28) return { icon: '🌘', name: 'هلال آخر الشهر', phase: 'Waning Crescent' };
  return { icon: '🌑', name: 'محاق', phase: 'New Moon' };
}
