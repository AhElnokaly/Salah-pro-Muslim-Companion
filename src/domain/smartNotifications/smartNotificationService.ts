/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  SmartNotificationsSettings,
  DEFAULT_SMART_NOTIFICATIONS_SETTINGS,
  QuranReadingPortionConfig,
  QuranListeningPortionConfig,
  QURAN_RECITERS
} from './smartNotificationTypes';
import { getSurahForPage } from '../../data/quranSurahPageRanges';
import { SURAHS_LIST } from '../../data/quranData';
import { sendPushNotification } from '../../utils/pushNotificationService';
import { safeGetJSON, safeSetJSON } from '../../utils/storage';
import AthanAlarm from '../../services/athanAlarmPlugin';

export const SMART_NOTIFICATIONS_STORAGE_KEY = 'hemmaty_smart_notifications_config';

export function getSmartNotificationsSettings(): SmartNotificationsSettings {
  const saved = safeGetJSON<SmartNotificationsSettings | null>(SMART_NOTIFICATIONS_STORAGE_KEY, null);
  if (saved) {
    return {
      ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS,
      ...saved,
      ongoingPrayerBar: { ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS.ongoingPrayerBar, ...saved.ongoingPrayerBar },
      readingPortion: { ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS.readingPortion, ...saved.readingPortion },
      listeningPortion: { ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS.listeningPortion, ...saved.listeningPortion },
      contextualAdhkar: { ...DEFAULT_SMART_NOTIFICATIONS_SETTINGS.contextualAdhkar, ...saved.contextualAdhkar },
    };
  }
  return DEFAULT_SMART_NOTIFICATIONS_SETTINGS;
}

export function saveSmartNotificationsSettings(settings: SmartNotificationsSettings): void {
  safeSetJSON(SMART_NOTIFICATIONS_STORAGE_KEY, settings);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('smart-notifications-settings-changed', { detail: settings }));
  }
}

export interface ReadingPortionInfo {
  startPage: number;
  endPage: number;
  surahName: string;
  title: string;
  body: string;
  timeStr: string;
}

export interface ListeningPortionInfo {
  surahNumber: number;
  surahName: string;
  reciterName: string;
  reciterId: string;
  startAyah: number;
  endAyah: number;
  title: string;
  body: string;
  timeStr: string;
  audioUrls: string[];
}

export interface ContextualAdhkarInfo {
  type: 'morning' | 'evening';
  title: string;
  body: string;
  timeStr: string;
  quote: string;
}

export interface OngoingPrayerBarData {
  firstLine: string; // Notification Title: e.g. "🕌 صلاة الظهر: 12:49 م (متبقي 01:33:15)"
  secondLine: string; // Notification Body: e.g. "⏳ متبقي: ساعة و ٣٣ دقيقة  |  📍 القاهرة، مصر • ٧ ربيع الآخر"
  prayerName: string;
  prayerTimeFormatted: string;
  countdownFormatted: string;
  readableRemaining: string;
  locationAndDate: string;
  isPrayerDue: boolean;
}

/**
 * Generates formatted reading portion details matching the notification screenshot.
 */
export function getReadingPortionInfo(config: QuranReadingPortionConfig): ReadingPortionInfo {
  const startPage = Math.max(1, Math.min(604, config.currentPage));
  const goal = Math.max(1, config.dailyPagesGoal);
  const endPage = Math.min(604, startPage + goal);
  const surahName = getSurahForPage(startPage);

  return {
    startPage,
    endPage,
    surahName,
    title: '📖 وردك اليومي من القرآن',
    body: `اقرأ وردك من صفحة ${startPage} إلى صفحة ${endPage} — ${surahName}`,
    timeStr: config.scheduledTime || '17:00',
  };
}

/**
 * Generates formatted listening portion details with live audio streams.
 */
export function getListeningPortionInfo(config: QuranListeningPortionConfig): ListeningPortionInfo {
  const surahNumber = Math.max(1, Math.min(114, config.surahNumber || 96));
  const surahMeta = SURAHS_LIST.find((s) => s.number === surahNumber) || SURAHS_LIST[95]; // Al-Alaq
  const reciter = QURAN_RECITERS.find((r) => r.id === config.reciterId) || QURAN_RECITERS[0];
  const count = Math.max(1, config.versesPerPortion || 5);
  const startAyah = Math.max(1, config.startAyah || 1);
  const endAyah = Math.min(surahMeta.numberOfAyahs, startAyah + count - 1);

  // Generate EveryAyah audio URLs
  const audioUrls: string[] = [];
  const surahPad = String(surahNumber).padStart(3, '0');
  for (let a = startAyah; a <= endAyah; a++) {
    const ayahPad = String(a).padStart(3, '0');
    audioUrls.push(`${reciter.audioBaseUrl}/${surahPad}${ayahPad}.mp3`);
  }

  const countWord =
    count === 3 ? 'ثلاث آيات متتالية' :
    count === 5 ? 'خمس آيات متتالية' :
    count === 7 ? 'سبع آيات متتالية' :
    count === 10 ? 'عشر آيات متتالية' :
    `${count} آيات متتالية`;

  return {
    surahNumber,
    surahName: surahMeta.name,
    reciterName: reciter.name,
    reciterId: reciter.id,
    startAyah,
    endAyah,
    title: 'ورد الاستماع',
    body: `${countWord} من سورة ${surahMeta.name} بصوت ${reciter.name}`,
    timeStr: config.scheduledTime || '20:00',
    audioUrls,
  };
}

/**
 * Generates contextual quotes for morning & evening adhkar notifications.
 */
export function getContextualAdhkarInfo(type: 'morning' | 'evening', timeStr?: string): ContextualAdhkarInfo {
  if (type === 'morning') {
    return {
      type: 'morning',
      title: 'أذكار الصباح',
      body: 'حان وقت أذكار الصباح — «أصبحنا وأصبح المُلْكُ لله»',
      timeStr: timeStr || '05:15 م',
      quote: 'أصبحنا وأصبح المُلْكُ لله، والحمد لله، لا إله إلا الله وحده لا شريك له',
    };
  }

  return {
    type: 'evening',
    title: 'أذكار المساء',
    body: 'حان وقت أذكار المساء — «أمسينا وأمسى المُلْكُ لله»',
    timeStr: timeStr || '04:56 م',
    quote: 'أمسينا وأمسى المُلْكُ لله، والحمد لله، لا إله إلا الله وحده لا شريك له',
  };
}

/**
 * Formats a duration in milliseconds into HH:MM:SS or HH:MM
 */
export function formatCountdown(ms: number, withPlus = false, includeSeconds = true): string {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const hStr = `${String(hours).padStart(2, '0')}:`;
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  if (!includeSeconds) {
    return `${withPlus ? '+' : ''}${hStr}${mStr}`;
  }
  return `${withPlus ? '+' : ''}${hStr}${mStr}:${sStr}`;
}

/**
 * Returns human-readable Arabic duration string (e.g. "ساعة و ٣٣ دقيقة")
 */
export function formatRemainingArabic(ms: number): string {
  if (ms <= 0) return 'حان الآن موعد الصلاة 🕌';
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) {
    const hText = hours === 1 ? 'ساعة' : hours === 2 ? 'ساعتان' : `${hours} ساعات`;
    const mText = minutes === 1 ? 'دقيقة' : minutes === 2 ? 'دقيقتان' : `${minutes} دقيقة`;
    return `${hText} و ${mText}`;
  } else if (hours > 0) {
    return hours === 1 ? 'ساعة واحدة' : hours === 2 ? 'ساعتان' : `${hours} ساعات`;
  } else {
    return minutes <= 1 ? 'أقل من دقيقة' : `${minutes} دقيقة`;
  }
}

/**
 * Formats ongoing prayer status bar matching the top One UI notification card.
 */
export function getOngoingPrayerBarData(
  locationName: string,
  hijriDateStr: string,
  nextPrayerNameArabic: string,
  prayerTimeFormatted: string,
  remainingMs: number,
  config?: { showSeconds?: boolean; showHijriDate?: boolean; showLocation?: boolean }
): OngoingPrayerBarData {
  const showSeconds = config?.showSeconds ?? true;
  const showHijri = config?.showHijriDate ?? true;
  const showLoc = config?.showLocation ?? true;

  const isPrayerDue = remainingMs <= 0;
  const countdownFormatted = isPrayerDue ? '00:00:00' : formatCountdown(remainingMs, false, showSeconds);
  const readableRemaining = formatRemainingArabic(remainingMs);

  const locMeta: string[] = [];
  if (showLoc && locationName) {
    locMeta.push(locationName);
  }
  if (showHijri && hijriDateStr) {
    locMeta.push(hijriDateStr);
  }
  const locationAndDate = locMeta.join(' | ');

  let firstLine = '';
  let secondLine = '';

  if (isPrayerDue) {
    firstLine = `🕌 حان الآن موعد صلاة ${nextPrayerNameArabic} (${prayerTimeFormatted})`;
    secondLine = `حي على الصلاة • حي على الفلاح${locationAndDate ? `  |  📍 ${locationAndDate}` : ''}`;
  } else {
    firstLine = `🕌 صلاة ${nextPrayerNameArabic}: ${prayerTimeFormatted}  (متبقي ${countdownFormatted})`;
    const bodyParts: string[] = [`⏳ متبقي: ${readableRemaining}`];
    if (locationAndDate) {
      bodyParts.push(`📍 ${locationAndDate}`);
    }
    secondLine = bodyParts.join('  |  ');
  }

  return {
    firstLine,
    secondLine,
    prayerName: nextPrayerNameArabic,
    prayerTimeFormatted,
    countdownFormatted,
    readableRemaining,
    locationAndDate,
    isPrayerDue,
  };
}

/**
 * Triggers a real interactive native/browser push notification for any of the smart items.
 */
export async function dispatchSmartNotification(
  type: 'ongoing_prayer' | 'listening' | 'reading' | 'adhkar',
  settings: SmartNotificationsSettings,
  contextData: {
    locationName?: string;
    hijriDateStr?: string;
    nextPrayerNameArabic?: string;
    prayerTimeFormatted?: string;
    remainingMs?: number;
    targetTimestamp?: number;
    adhkarType?: 'morning' | 'evening';
  }
): Promise<boolean> {
  try {
    let title = '';
    let body = '';
    let tag = 'smart_spiritual_notification';

    let targetUrl = './';
    let targetTab: string | undefined = undefined;

    switch (type) {
      case 'ongoing_prayer': {
        const barData = getOngoingPrayerBarData(
          contextData.locationName || 'موقعي',
          contextData.hijriDateStr || '',
          contextData.nextPrayerNameArabic || 'الصلاة القادمة',
          contextData.prayerTimeFormatted || '',
          contextData.remainingMs ?? 0,
          settings.ongoingPrayerBar
        );
        title = barData.firstLine;
        body = barData.secondLine;
        tag = 'ongoing_prayer_tracker';
        targetUrl = './?tab=times';
        targetTab = 'times';

        if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform() && AthanAlarm.updateOngoingPrayerNotification) {
          try {
            await AthanAlarm.updateOngoingPrayerNotification({
              enabled: settings.ongoingPrayerBar.enabled,
              title,
              body,
              targetTimestamp: contextData.targetTimestamp,
            });
          } catch (nativeErr) {
            console.warn('[SmartNotificationService] Native ongoing notification notice:', nativeErr);
          }
        }
        break;
      }
      case 'reading': {
        const reading = getReadingPortionInfo(settings.readingPortion);
        title = reading.title;
        body = reading.body;
        tag = 'quran_reading_portion';
        targetUrl = './?tab=quran';
        targetTab = 'quran';
        break;
      }
      case 'listening': {
        const listening = getListeningPortionInfo(settings.listeningPortion);
        title = listening.title;
        body = listening.body;
        tag = 'quran_listening_portion';
        targetUrl = './?tab=quran&listen=true';
        targetTab = 'quran';
        break;
      }
      case 'adhkar': {
        const adhkar = getContextualAdhkarInfo(contextData.adhkarType || 'evening');
        title = adhkar.title;
        body = adhkar.body;
        tag = 'contextual_adhkar';
        targetUrl = './?tab=adhkar';
        targetTab = 'adhkar';
        break;
      }
    }

    await sendPushNotification(title, {
      body,
      tag,
      icon: '/images/logo.png',
      badge: '/images/logo.png',
      url: targetUrl,
      data: { url: targetUrl, tab: targetTab },
      silent: type === 'ongoing_prayer',
      renotify: false,
      actions: [
        { action: 'open_times', title: '🕌 المواقيت' },
        { action: 'open_adhkar', title: '📿 الأذكار' },
        { action: 'open_quran', title: '📖 القرآن' },
      ],
    } as any);

    return true;
  } catch (err) {
    console.error('[SmartNotificationService] Failed to dispatch notification:', err);
    return false;
  }
}

/**
 * Convenient helper to trigger a test notification for a given smart feature.
 */
export async function triggerSmartNotificationTest(
  type: 'ongoing_prayer' | 'listening' | 'reading' | 'adhkar',
  settings: SmartNotificationsSettings
): Promise<boolean> {
  return dispatchSmartNotification(type, settings, {
    locationName: 'سان ستفانو',
    hijriDateStr: '03 ربيع الآخر 1448',
    nextPrayerNameArabic: 'العشاء',
    prayerTimeFormatted: '08:27 م',
    remainingMs: 4864000,
    adhkarType: 'evening',
  });
}

