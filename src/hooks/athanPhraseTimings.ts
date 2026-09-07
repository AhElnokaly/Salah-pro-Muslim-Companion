export const athanPhrases = [
  { text: 'الله أكبر، الله أكبر', duration: 10 },
  { text: 'الله أكبر، الله أكبر', duration: 10 },
  { text: 'أشهد أن لا إله إلا الله', duration: 12 },
  { text: 'أشهد أن لا إله إلا الله', duration: 12 },
  { text: 'أشهد أن محمداً رسول الله', duration: 12 },
  { text: 'أشهد أن محمداً رسول الله', duration: 12 },
  { text: 'حي على الصلاة', duration: 10 },
  { text: 'حي على الصلاة', duration: 10 },
  { text: 'حي على الفلاح', duration: 10 },
  { text: 'حي على الفلاح', duration: 10 },
  { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
  { text: 'الصلاة خير من النوم', duration: 15, isFajrOnly: true },
  { text: 'الله أكبر، الله أكبر', duration: 10 },
  { text: 'لا إله إلا الله', duration: 10 },
];

export function computePhraseTimings(isFajr: boolean): { text: string; start: number; end: number }[] {
  const activePhrases = athanPhrases.filter(p => !p.isFajrOnly || isFajr);
  let accumulatedTime = 0;
  return activePhrases.map(p => {
    const start = accumulatedTime;
    const end = accumulatedTime + p.duration;
    accumulatedTime += p.duration;
    return { text: p.text, start, end };
  });
}
