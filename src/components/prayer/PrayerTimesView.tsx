/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { AppSettings, ClockFace, PrayerName, PrayerLog, PrayerStatus } from '../../types';
import { getArabicPrayerName } from '../../utils/prayerCalc';
import { getHijriDate } from '../../utils/hijri';
import { safeSetItem, safeGetItem, safeGetJSON } from '../../utils/storage';
import { StorageFacade } from '../../domain/storage/StorageFacade';
import { AudioTrack, getAudioUrl, LOCAL_FALLBACK_AUDIO } from '../../utils/audioStorage';
import { stopAudioSafely } from '../../utils/audioUtils';
import { getExactCountdown } from './prayerUtils';
import { PrayerCityCountdownCard } from './PrayerCityCountdownCard';
import { PrayerTimeRowItem } from './PrayerTimeRowItem';
import { PrayerCalcMethodCard } from './PrayerCalcMethodCard';
import { HolyCitiesPrayerTimesCard } from './HolyCitiesPrayerTimesCard';

interface PrayerTimesViewProps {
  currentTime: Date;
  targetDate?: Date;
  hijri?: {
    day: number;
    month: number;
    year: number;
    monthName: string;
    fullString: string;
  };
  times: Record<PrayerName, string>;
  clockFace: ClockFace;
  setClockFace: (face: ClockFace) => void;
  soundModes?: Record<string, 'adhan' | 'beep' | 'vibrate' | 'silent'>;
  setSoundModes?: React.Dispatch<React.SetStateAction<Record<string, 'adhan' | 'beep' | 'vibrate' | 'silent'>>>;
  muezzins: AudioTrack[];
  downloadedTrackIds?: Set<string>;
  prayerMuezzins?: Record<string, string>;
  setPrayerMuezzins?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  fajrMuezzin?: string;
  setFajrMuezzin?: (id: string) => void;
  currentMuezzin?: string;
  setCurrentMuezzin?: (id: string) => void;
  isPlaying: boolean;
  currentPlayingPrayer: PrayerName | null;
  togglePlayAthan: (prayerName?: PrayerName, forcedMuezzinId?: string) => void;
  settings: AppSettings;
  setSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  handleUpdateOffset?: (prayer: PrayerName | 'Sunrise', amount: number) => void;
  handleUpdateVolume?: (prayer: string, value: number) => void;
  audioVolume?: number;
  setLogSuccessMessage?: (msg: string) => void;
  setShowDuhaModal?: (show: boolean) => void;
  setShowNightPrayersModal?: (show: boolean) => void;
  targetTimestamp?: number;
  dayLogs?: Record<string, PrayerLog>;
  handleLogPrayerStatus?: (prayer: PrayerName, status: PrayerStatus) => void;
  onNavigateTab?: (tab: string, subTab?: string) => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  currentTime,
  targetDate,
  hijri,
  times,
  clockFace,
  setClockFace,
  soundModes,
  setSoundModes,
  muezzins,
  downloadedTrackIds = new Set<string>(),
  prayerMuezzins: propPrayerMuezzins,
  setPrayerMuezzins: propSetPrayerMuezzins,
  fajrMuezzin: propFajrMuezzin,
  setFajrMuezzin: propSetFajrMuezzin,
  currentMuezzin: propCurrentMuezzin,
  setCurrentMuezzin: propSetCurrentMuezzin,
  isPlaying,
  currentPlayingPrayer,
  togglePlayAthan,
  settings,
  setSettings,
  handleUpdateOffset,
  handleUpdateVolume,
  audioVolume = 1,
  setLogSuccessMessage = (_msg: string) => {},
  setShowDuhaModal = (_show: boolean) => {},
  setShowNightPrayersModal = (_show: boolean) => {},
}) => {
  const activeTargetDate = targetDate || new Date();
  const activeHijri = hijri || getHijriDate(activeTargetDate, settings.hijriOffset);

  const [localSoundModes, setLocalSoundModes] = useState<Record<string, 'adhan' | 'beep' | 'vibrate' | 'silent'>>(() => {
    return safeGetJSON<Record<string, 'adhan' | 'beep' | 'vibrate' | 'silent'>>('salah_sound_modes', {});
  });

  const activeSoundModes = soundModes || localSoundModes;

  const [localPrayerMuezzins, setLocalPrayerMuezzins] = useState<Record<string, string>>(() => {
    const general = safeGetItem('salah_general_muezzin') || 'prayer_default';
    const fajr = safeGetItem('salah_fajr_muezzin') || 'fajr_default';
    return {
      Fajr: safeGetItem('salah_muezzin_Fajr') || fajr,
      Sunrise: safeGetItem('salah_muezzin_Sunrise') || general,
      Dhuhr: safeGetItem('salah_muezzin_Dhuhr') || general,
      Asr: safeGetItem('salah_muezzin_Asr') || general,
      Maghrib: safeGetItem('salah_muezzin_Maghrib') || general,
      Isha: safeGetItem('salah_muezzin_Isha') || general,
    };
  });

  const activePrayerMuezzins = propPrayerMuezzins || localPrayerMuezzins;
  const activeFajrMuezzin = propFajrMuezzin || activePrayerMuezzins.Fajr || 'fajr_default';
  const activeCurrentMuezzin = propCurrentMuezzin || activePrayerMuezzins.Dhuhr || 'prayer_default';

  // Dedicated Audio Preview Controller for Responsive Playback
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingPrayer, setPlayingPrayer] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        stopAudioSafely(previewAudioRef.current);
        previewAudioRef.current = null;
      }
    };
  }, []);

  const handleRowTogglePlay = async (
    pName: PrayerName | 'Sunrise', 
    arabicName: string, 
    activeMuezzinId: string, 
    prayerVol: number
  ) => {
    if (playingPrayer === pName) {
      if (previewAudioRef.current) {
        stopAudioSafely(previewAudioRef.current);
        previewAudioRef.current = null;
      }
      setPlayingPrayer(null);
      setLogSuccessMessage(`تم إيقاف صوت ${arabicName}`);
      return;
    }

    if (previewAudioRef.current) {
      stopAudioSafely(previewAudioRef.current);
      previewAudioRef.current = null;
    }

    // Stop global athan player if active so preview never clashes
    if (isPlaying && togglePlayAthan) {
      togglePlayAthan();
    }

    const isFajr = pName === 'Fajr';
    const track = muezzins.find(m => m.id === activeMuezzinId) || muezzins[0];
    const initialUrl = track?.url || (isFajr ? LOCAL_FALLBACK_AUDIO.fajr : LOCAL_FALLBACK_AUDIO.general);

    // Create Audio synchronously within user gesture to prevent browser autoplay block
    let finalSrc = initialUrl.startsWith('db://') ? (isFajr ? LOCAL_FALLBACK_AUDIO.fajr : LOCAL_FALLBACK_AUDIO.general) : initialUrl;
    const audio = new Audio(finalSrc);
    audio.volume = Math.max(0, Math.min(1, prayerVol));

    audio.onended = () => {
      setPlayingPrayer(null);
    };

    audio.onerror = () => {
      if (!finalSrc.startsWith('/audio/')) {
        const fallbackSrc = isFajr ? LOCAL_FALLBACK_AUDIO.fajr : LOCAL_FALLBACK_AUDIO.general;
        finalSrc = fallbackSrc;
        audio.src = fallbackSrc;
        audio.play().then(() => {
          setLogSuccessMessage(`جارٍ تشغيل الصوت المدمج لـ ${arabicName}...`);
        }).catch(() => {
          setPlayingPrayer(null);
          setLogSuccessMessage('تعذر تشغيل الصوت تلقائياً.');
        });
      } else {
        setPlayingPrayer(null);
        setLogSuccessMessage('تعذر تشغيل الصوت تلقائياً.');
      }
    };

    previewAudioRef.current = audio;

    // Resolve db:// asynchronously if needed
    if (initialUrl.startsWith('db://')) {
      try {
        const resolved = await getAudioUrl(initialUrl, track?.id);
        if (resolved) {
          finalSrc = resolved;
          audio.src = resolved;
        }
      } catch {
        // Keep initial fallback
      }
    }

    try {
      await audio.play();
      setPlayingPrayer(pName);
      setLogSuccessMessage(`جارٍ تشغيل صوت ${arabicName} للتجربة...`);
    } catch (err) {
      console.warn('Direct preview play error:', err);
      // Attempt local fallback directly without ever triggering global AthanOverlay
      if (!finalSrc.startsWith('/audio/')) {
        const fallbackSrc = isFajr ? LOCAL_FALLBACK_AUDIO.fajr : LOCAL_FALLBACK_AUDIO.general;
        audio.src = fallbackSrc;
        audio.play().then(() => {
          setPlayingPrayer(pName);
          setLogSuccessMessage(`جارٍ تشغيل الصوت المدمج لـ ${arabicName}...`);
        }).catch(() => {
          setPlayingPrayer(null);
          setLogSuccessMessage('انقر مرة أخرى للسماح بتشغيل الصوت.');
        });
      } else {
        setPlayingPrayer(null);
        setLogSuccessMessage('انقر مرة أخرى للسماح بتشغيل الصوت.');
      }
    }
  };

  const updateSoundModes = (updater: (prev: Record<string, 'adhan' | 'beep' | 'vibrate' | 'silent'>) => Record<string, 'adhan' | 'beep' | 'vibrate' | 'silent'>) => {
    if (setSoundModes) {
      setSoundModes(updater);
    }
    setLocalSoundModes(prev => {
      const next = updater(prev);
      safeSetItem('salah_sound_modes', JSON.stringify(next));
      return next;
    });
  };

  const updatePrayerMuezzin = (pName: string, val: string) => {
    if (propSetPrayerMuezzins) {
      propSetPrayerMuezzins(prev => ({ ...prev, [pName]: val }));
    }
    setLocalPrayerMuezzins(prev => ({ ...prev, [pName]: val }));
    safeSetItem(`salah_muezzin_${pName}`, val);

    if (pName === 'Fajr') {
      if (propSetFajrMuezzin) propSetFajrMuezzin(val);
      safeSetItem('salah_fajr_muezzin', val);
    } else if (pName !== 'Sunrise') {
      if (propSetCurrentMuezzin) propSetCurrentMuezzin(val);
      safeSetItem('salah_general_muezzin', val);
    }
  };

  const onUpdateOffset = (prayer: PrayerName | 'Sunrise', amount: number) => {
    if (handleUpdateOffset) {
      handleUpdateOffset(prayer, amount);
    } else if (setSettings) {
      setSettings(prev => {
        const currentOffsets = prev.prayerOffsets || {};
        const current = currentOffsets[prayer as PrayerName] || 0;
        const newOffset = current + amount;
        const updated = {
          ...prev,
          prayerOffsets: {
            ...currentOffsets,
            [prayer]: newOffset
          }
        };
        StorageFacade.saveSettings(updated);
        return updated;
      });
    }
  };

  const onUpdateVolume = (prayer: string, value: number) => {
    if (handleUpdateVolume) {
      handleUpdateVolume(prayer, value);
    } else if (setSettings) {
      setSettings(prev => {
        const updated = {
          ...prev,
          prayerVolumes: {
            ...(prev.prayerVolumes || {}),
            [prayer]: value
          }
        };
        StorageFacade.saveSettings(updated);
        return updated;
      });
    }
  };

  const { countdownStr, arabicNextName, nextPrayerName } = getExactCountdown(times, currentTime);

  return (
    <div className="space-y-6">
      {/* Clock & Countdown Header Card */}
      <PrayerCityCountdownCard
        currentTime={currentTime}
        activeHijri={activeHijri}
        cityName={settings.cityName}
        clockFace={clockFace}
        setClockFace={setClockFace}
        arabicNextName={arabicNextName}
        countdownStr={countdownStr}
        nextPrayerTimeStr={times[nextPrayerName as PrayerName] || ''}
      />

      {/* List of Prayer Times with Sound Mode Switcher */}
      <div className="space-y-3">
        {(['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as (PrayerName | 'Sunrise')[]).map((pName) => {
          const pTime = times[pName as PrayerName];
          const isNext = pName === nextPrayerName;
          const sMode = activeSoundModes[pName] || 'adhan';
          const arabicName = getArabicPrayerName(pName as PrayerName) || (pName === 'Sunrise' ? 'الشروق' : pName);
          const prayerOffset = (settings.prayerOffsets || {})[pName as PrayerName] || 0;
          const activeMuezzinId = activePrayerMuezzins[pName] || (pName === 'Fajr' ? activeFajrMuezzin : activeCurrentMuezzin);
          const prayerVolume = settings.prayerVolumes?.[pName] ?? audioVolume;

          const handleCycleSoundMode = () => {
            const cycle: ('adhan' | 'beep' | 'vibrate' | 'silent')[] = ['adhan', 'beep', 'vibrate', 'silent'];
            const nextIdx = (cycle.indexOf(sMode) + 1) % cycle.length;
            const nextMode = cycle[nextIdx];
            updateSoundModes(prev => ({ ...prev, [pName]: nextMode }));

            const modesText = {
              adhan: 'الأذان الكامل',
              beep: 'رنين التنبيه',
              vibrate: 'الاهتزاز فقط',
              silent: 'الوضع الصامت'
            };
            setLogSuccessMessage(`تم تغيير وضع تنبيه صلاة ${arabicName} إلى: ${modesText[nextMode]}`);
          };

          const isItemPlaying = playingPrayer === pName || (isPlaying && currentPlayingPrayer === pName);

          return (
            <PrayerTimeRowItem
              key={pName}
              pName={pName}
              pTime={pTime}
              isNext={isNext}
              sMode={sMode}
              arabicName={arabicName}
              isPlaying={isItemPlaying}
              currentPlayingPrayer={playingPrayer || (currentPlayingPrayer as string | null)}
              activeHijriMonth={activeHijri.month}
              prayerOffset={prayerOffset}
              activeMuezzinId={activeMuezzinId}
              muezzins={muezzins}
              downloadedTrackIds={downloadedTrackIds}
              prayerVolume={prayerVolume}
              onCycleSoundMode={handleCycleSoundMode}
              onTogglePlayAthan={() => handleRowTogglePlay(pName, arabicName, activeMuezzinId, prayerVolume)}
              onOpenDuhaModal={() => setShowDuhaModal(true)}
              onOpenNightPrayersModal={() => setShowNightPrayersModal(true)}
              onUpdateOffset={(amount) => {
                onUpdateOffset(pName as PrayerName, amount);
                const currentVal = prayerOffset + amount;
                setLogSuccessMessage(
                  amount > 0
                    ? `تم تقديم وقت صلاة ${arabicName} بمقدار دقيقة (+${currentVal} د)`
                    : `تم تأخير وقت صلاة ${arabicName} بمقدار دقيقة (${currentVal} د)`
                );
              }}
              onSelectMuezzin={(val) => {
                updatePrayerMuezzin(pName, val);
                setLogSuccessMessage(`تم تحديد الصوت لـ ${arabicName}`);
              }}
              onUpdateVolume={(val) => {
                onUpdateVolume(pName, val);
              }}
            />
          );
        })}
      </div>

      {/* Integrated Calculation Method & Madhab Selector Card */}
      {setSettings && (
        <PrayerCalcMethodCard
          settings={settings}
          setSettings={setSettings}
          setLogSuccessMessage={setLogSuccessMessage}
        />
      )}

      {/* Holy Cities & Al-Aqsa Card */}
      <HolyCitiesPrayerTimesCard
        activeTargetDate={activeTargetDate}
        currentTime={currentTime}
        calcMethod={settings.calcMethod}
        madhab={settings.madhab}
      />
    </div>
  );
};

export default PrayerTimesView;
