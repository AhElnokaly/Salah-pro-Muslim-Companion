/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Spiritual Human Voice & Sound Alert Helper (Zero Music Policy - 100% Real Human Voice)
 * Replaces all Text-to-Speech (TTS) with authentic, high-quality human Islamic voice recordings
 * (Adhan, Takbeer, Hayya 'Alas-Salah, Al-Salatu Khayrun Minan-Nawm, Salawat, Istighfar, Duaa).
 */

import type { MutableRefObject } from 'react';
import type { AlarmSoundType, AlarmNotifyMode } from '../types';

export interface SpiritualAudioSource {
  local: string;
  online: string;
  label: string;
  description: string;
}

export const SPIRITUAL_SOUND_FILES: Record<AlarmSoundType, SpiritualAudioSource> = {
  takbeer: {
    local: '/audio/takbeer.mp3',
    online: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/088-.mp3',
    label: '🔊 تكبيرات الحرمين الشريفين',
    description: 'تسجيل حقيقي لتكبيرات الصلاة والأعياد بالحرم المكي'
  },
  alsalatu_khayr: {
    local: '/audio/alsalatu-khayr.mp3',
    online: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/033--.mp3',
    label: '🌅 الصلاة خير من النوم',
    description: 'مقطع حقيقي بصوت مؤذن الحرم المكي الشريف'
  },
  hayya: {
    local: '/audio/hayya.mp3',
    online: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/033--.mp3',
    label: '🕌 حي على الصلاة',
    description: 'مقطع حقيقي بصوت المؤذن للنداء إلى الفلاح'
  },
  adhan: {
    local: '/audio/adhan.mp3',
    online: 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/047--.mp3',
    label: '📢 الأذان المبارك كاملاً',
    description: 'تسجيل الأذان كاملاً بصوت الشيخ علي أحمد ملا'
  },
  salawat: {
    local: '/audio/salawat.mp3',
    online: 'https://everyayah.com/data/Alafasy_128kbps/033056.mp3',
    label: '🌸 الصلاة على النبي ﷺ',
    description: 'تلاوة ندية بصوت القارئ مشاري العفاسي (إن الله وملائكته يصلون على النبي)'
  },
  istighfar: {
    local: '/audio/istighfar.mp3',
    online: 'https://everyayah.com/data/Alafasy_128kbps/051018.mp3',
    label: '📿 استغفار الأسحار',
    description: 'تلاوة خاشعة بصوت القارئ مشاري العفاسي (وبالأسحار هم يستغفرون)'
  },
  duaa: {
    local: '/audio/duaa.mp3',
    online: 'https://everyayah.com/data/Alafasy_128kbps/002201.mp3',
    label: '🤲 دعاء قرآني خاشع',
    description: 'تلاوة دعاء مبارك بصوت القارئ مشاري العفاسي (ربنا آتنا في الدنيا حسنة)'
  },
  speech: {
    local: '/audio/reminder.mp3',
    online: 'https://everyayah.com/data/Alafasy_128kbps/017079.mp3',
    label: '🎙️ تذكير إيماني بصوت بشري',
    description: 'تلاوة وتذكير إيماني لقيام الليل بصوت القارئ مشاري العفاسي'
  },
  beep: {
    local: '/audio/beep.mp3',
    online: '/audio/beep.mp3',
    label: '🔔 رنين تنبيه هادئ (نقي)',
    description: 'نغمة صوتية هادئة بدون مؤثرات موسيقية'
  },
  silent: {
    local: '',
    online: '',
    label: '🔕 صامت',
    description: 'إشعار مرئي بدون صوت'
  },
  vibrate: {
    local: '',
    online: '',
    label: '📳 اهتزاز فقط',
    description: 'اهتزاز للهاتف'
  }
};

/**
 * Plays an authentic human voice audio reminder.
 * (No robotic text-to-speech / speech synthesis).
 */
export function playSpiritualSpeech(_phrase?: string, volume = 1.0): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    const soundUrl = SPIRITUAL_SOUND_FILES.speech.local || SPIRITUAL_SOUND_FILES.speech.online;
    const audio = new Audio(soundUrl);
    audio.volume = Math.max(0.1, Math.min(1.0, volume));

    audio.onended = () => resolve(true);
    audio.onerror = () => {
      // Fallback to online source if local file encounters an issue
      const fallbackUrl = SPIRITUAL_SOUND_FILES.speech.online;
      if (fallbackUrl && fallbackUrl !== soundUrl) {
        const fallbackAudio = new Audio(fallbackUrl);
        fallbackAudio.volume = Math.max(0.1, Math.min(1.0, volume));
        fallbackAudio.onended = () => resolve(true);
        fallbackAudio.onerror = () => resolve(false);
        fallbackAudio.play().catch(() => resolve(false));
      } else {
        resolve(false);
      }
    };

    audio.play().then(() => {
      // Successfully started real human audio playback
    }).catch((err) => {
      console.warn('[playSpiritualSpeech] Audio play blocked or failed:', err);
      resolve(false);
    });
  });
}

/**
 * Plays genuine, high-quality Islamic voice recordings for alarms and notifications.
 */
export function playSpiritualSound(
  type: AlarmSoundType,
  _customTitle = 'العبادة',
  volume = 1.0,
  globalAudioRef?: MutableRefObject<HTMLAudioElement | null>,
  notifyMode: AlarmNotifyMode = 'sound'
): void {
  if (notifyMode === 'silent' || type === 'silent') return;

  // Handle vibration
  if (notifyMode === 'vibrate' || notifyMode === 'both' || type === 'vibrate') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200, 100, 300]);
      } catch (e) {
        console.warn('Vibration API not supported or blocked:', e);
      }
    }
    if (notifyMode === 'vibrate' || type === 'vibrate') return;
  }

  const soundConfig = SPIRITUAL_SOUND_FILES[type] || SPIRITUAL_SOUND_FILES.speech;
  const primaryUrl = soundConfig.local || soundConfig.online;

  if (!primaryUrl) return;

  // Pause previous audio instance if provided
  if (globalAudioRef && globalAudioRef.current) {
    try {
      globalAudioRef.current.pause();
      globalAudioRef.current.currentTime = 0;
    } catch {
      // Ignore pause error on detached element
    }
  }

  const audio = new Audio(primaryUrl);
  audio.volume = Math.max(0.1, Math.min(1.0, volume));

  if (globalAudioRef) {
    globalAudioRef.current = audio;
  }

  audio.onerror = () => {
    // Fallback to online high-reliability source if local path failed
    if (soundConfig.online && soundConfig.online !== primaryUrl) {
      const fallbackAudio = new Audio(soundConfig.online);
      fallbackAudio.volume = Math.max(0.1, Math.min(1.0, volume));
      if (globalAudioRef) globalAudioRef.current = fallbackAudio;
      fallbackAudio.play().catch(err => {
        console.warn('[playSpiritualSound] Fallback audio playback failed:', err);
      });
    }
  };

  audio.play().catch((err) => {
    console.warn('[playSpiritualSound] Audio playback failed:', err);
  });
}

