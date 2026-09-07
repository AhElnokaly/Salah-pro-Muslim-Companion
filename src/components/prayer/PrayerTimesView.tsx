import React, { useState } from 'react';
import { AppSettings, ClockFace, PrayerName, PrayerLog, PrayerStatus } from '../../types';
import { getArabicPrayerName } from '../../utils/prayerCalc';
import { getHijriDate } from '../../utils/hijri';
import { safeSetItem, safeGetItem, safeGetJSON } from '../../utils/storage';
import { AudioTrack } from '../../utils/audioStorage';
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
    const general = safeGetItem('salah_general_muezzin') || 'makkah';
    const fajr = safeGetItem('salah_fajr_muezzin') || 'fajr_yusuf';
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
  const activeFajrMuezzin = propFajrMuezzin || activePrayerMuezzins.Fajr || 'fajr_yusuf';
  const activeCurrentMuezzin = propCurrentMuezzin || activePrayerMuezzins.Dhuhr || 'makkah';

  const updateSoundModes = (updater: (prev: Record<string, 'adhan' | 'beep' | 'vibrate' | 'silent'>) => Record<string, 'adhan' | 'beep' | 'vibrate' | 'silent'>) => {
    if (setSoundModes) {
      setSoundModes(updater);
    } else {
      setLocalSoundModes(prev => {
        const next = updater(prev);
        safeSetItem('salah_sound_modes', JSON.stringify(next));
        return next;
      });
    }
  };

  const updatePrayerMuezzin = (pName: string, val: string) => {
    if (propSetPrayerMuezzins) {
      propSetPrayerMuezzins(prev => ({ ...prev, [pName]: val }));
    } else {
      setLocalPrayerMuezzins(prev => ({ ...prev, [pName]: val }));
    }
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
        return {
          ...prev,
          prayerOffsets: {
            ...currentOffsets,
            [prayer]: current + amount
          }
        };
      });
    }
  };

  const onUpdateVolume = (prayer: string, value: number) => {
    if (handleUpdateVolume) {
      handleUpdateVolume(prayer, value);
    } else if (setSettings) {
      setSettings(prev => ({
        ...prev,
        prayerVolumes: {
          ...(prev.prayerVolumes || {}),
          [prayer]: value
        }
      }));
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
      <div className="space-y-2">
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

          return (
            <PrayerTimeRowItem
              key={pName}
              pName={pName}
              pTime={pTime}
              isNext={isNext}
              sMode={sMode}
              arabicName={arabicName}
              isPlaying={isPlaying}
              currentPlayingPrayer={currentPlayingPrayer}
              activeHijriMonth={activeHijri.month}
              prayerOffset={prayerOffset}
              activeMuezzinId={activeMuezzinId}
              muezzins={muezzins}
              downloadedTrackIds={downloadedTrackIds}
              prayerVolume={prayerVolume}
              onCycleSoundMode={handleCycleSoundMode}
              onTogglePlayAthan={() => togglePlayAthan(pName as PrayerName)}
              onOpenDuhaModal={() => setShowDuhaModal(true)}
              onOpenNightPrayersModal={() => setShowNightPrayersModal(true)}
              onUpdateOffset={(amount) => {
                onUpdateOffset(pName as PrayerName, amount);
                setLogSuccessMessage(
                  amount > 0
                    ? `تم تقديم وقت صلاة ${arabicName} بمقدار دقيقة واحدة`
                    : `تم تقليل وقت صلاة ${arabicName} بمقدار دقيقة واحدة`
                );
              }}
              onSelectMuezzin={(val) => {
                updatePrayerMuezzin(pName, val);
                setLogSuccessMessage(`تم تحديد الصوت لـ ${arabicName}`);
              }}
              onUpdateVolume={(val) => onUpdateVolume(pName, val)}
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
