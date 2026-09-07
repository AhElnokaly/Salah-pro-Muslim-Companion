/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { MuezzinOption } from '../../../types';
import {
  defaultMuezzins,
  getCustomAudios,
  getAudioUrl,
  archiveMuezzins,
  downloadAndSaveAudio,
  deleteDownloadedAudio,
  getDownloadedTrackIds,
  getAudioStorageStats,
  AudioTrack,
} from '../../../utils/audioStorage';

interface UseAdhanAudioLogicProps {
  audioVolume: number;
}

export function useAdhanAudioLogic({ audioVolume }: UseAdhanAudioLogicProps) {
  // Audio Testing States & Refs
  const [playingAudio, setPlayingAudio] = useState<{
    id: string;
    url: string;
    name: string;
    isFajr: boolean;
  } | null>(null);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [customMuezzins, setCustomMuezzins] = useState<MuezzinOption[]>([]);
  const [downloadedTrackIds, setDownloadedTrackIds] = useState<Set<string>>(new Set());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [audioSuccessMessage, setAudioSuccessMessage] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState<{ count: number; totalMB: string }>({
    count: 0,
    totalMB: '0.0',
  });
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const refreshStorageData = () => {
    getDownloadedTrackIds().then(setDownloadedTrackIds).catch(console.error);
    getAudioStorageStats().then(setStorageStats).catch(console.error);
  };

  useEffect(() => {
    getCustomAudios()
      .then((tracks) => {
        setCustomMuezzins(tracks as MuezzinOption[]);
      })
      .catch((err) => {
        console.error('Failed to load custom muezzins in Settings:', err);
      });
    refreshStorageData();
  }, []);

  // Update volume on audioRef when audioVolume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  const stopAndCleanupAudio = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.onplay = null;
      audio.onpause = null;
      audio.onended = null;
      audio.ontimeupdate = null;
      audio.ondurationchange = null;
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.src = '';
      audio.load();
    } catch (e) {
      console.warn('Audio cleanup warning:', e);
    }
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAndCleanupAudio(audioRef.current);
      audioRef.current = null;
    };
  }, []);

  const handleDownloadTrack = async (track: MuezzinOption) => {
    setDownloadingId(track.id);
    setAudioError(null);
    setAudioSuccessMessage(null);
    try {
      const audioTrack: AudioTrack = {
        id: track.id,
        name: track.name,
        url: track.url || track.src || '',
        isFajr: track.isFajr || false,
        isCustom: track.isCustom,
      };
      await downloadAndSaveAudio(audioTrack);
      refreshStorageData();
      setAudioSuccessMessage(`تم تحميل وتخزين "${track.name}" بنجاح للعمل أوفلاين بدون إنترنت!`);
    } catch (err) {
      console.error('Download failed:', err);
      const errMsg = err instanceof Error ? err.message : 'خطأ في الشبكة';
      setAudioError('فشل تحميل الصوت أوفلاين: ' + errMsg);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteDownloadedTrack = async (trackId: string) => {
    try {
      await deleteDownloadedAudio(trackId);
      refreshStorageData();
      setAudioSuccessMessage('تم حذف النسخة المحفوظة أوفلاين بنجاح.');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleBatchDownloadDefaults = async () => {
    setIsBulkDownloading(true);
    setAudioError(null);
    setAudioSuccessMessage(null);
    try {
      const toDownload = defaultMuezzins.filter((m) => !downloadedTrackIds.has(m.id));
      if (toDownload.length === 0) {
        setAudioSuccessMessage('جميع الأذانات الأساسية محفوظة أوفلاين بالفعل! ⚡');
        setIsBulkDownloading(false);
        return;
      }
      setBulkProgress({ current: 0, total: toDownload.length });
      let downloadedCount = 0;
      for (let i = 0; i < toDownload.length; i++) {
        try {
          await downloadAndSaveAudio(toDownload[i]);
          downloadedCount++;
        } catch (e) {
          console.warn(`Failed to download ${toDownload[i].name}`, e);
        }
        setBulkProgress({ current: i + 1, total: toDownload.length });
      }
      refreshStorageData();
      setAudioSuccessMessage(`تم تحميل وتخزين ${downloadedCount} صوت أذان بنجاح للعمل أوفلاين! ⚡`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'خطأ في الاتصال';
      setAudioError('حدث خطأ أثناء التحميل: ' + errMsg);
    } finally {
      setIsBulkDownloading(false);
      setBulkProgress(null);
    }
  };

  const muezzins = [...defaultMuezzins, ...archiveMuezzins, ...customMuezzins];

  const togglePlayAudio = async (id: string, url: string) => {
    const muezzin = muezzins.find((m) => m.id === id);
    const name = muezzin ? muezzin.name : 'أذان مخصص';
    const isFajr = muezzin ? muezzin.isFajr : false;

    setAudioError(null);

    if (playingAudio && playingAudio.id === id) {
      if (audioRef.current) {
        if (audioIsPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch((e) => {
            console.error('Error playing audio', e);
            setAudioError('فشل تشغيل الملف الصوتي. يرجى التأكد من أن صيغة الملف مدعومة وصالحة.');
          });
        }
      }
    } else {
      if (audioRef.current) {
        stopAndCleanupAudio(audioRef.current);
      }

      setPlayingAudio({ id, url, name, isFajr });
      setAudioCurrentTime(0);
      setAudioDuration(0);

      const playAudioTrack = (srcUrl: string, isFallback = false) => {
        let safeUrl = srcUrl;
        if (!safeUrl || typeof safeUrl !== 'string' || safeUrl.trim() === '' || safeUrl.startsWith('db://')) {
          safeUrl = isFajr
            ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
            : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
        }

        if (audioRef.current) {
          stopAndCleanupAudio(audioRef.current);
        }

        const audio = new Audio(safeUrl);
        audioRef.current = audio;
        audio.volume = audioVolume;
        audio.playbackRate = playbackSpeed;

        audio.onplay = () => {
          setAudioIsPlaying(true);
          setAudioError(null);
        };

        audio.onpause = () => {
          setAudioIsPlaying(false);
        };

        audio.onended = () => {
          setAudioIsPlaying(false);
          setAudioCurrentTime(0);
        };

        audio.ontimeupdate = () => {
          setAudioCurrentTime(audio.currentTime);
        };

        audio.ondurationchange = () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setAudioDuration(audio.duration);
          }
        };

        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            setAudioDuration(audio.duration);
          }
        };

        audio.onerror = () => {
          if (!isFallback) {
            const fallbackUrl = isFajr
              ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
              : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
            playAudioTrack(fallbackUrl, true);
          } else {
            setAudioError('تعذر تشغيل الملف الصوتي.');
          }
        };

        audio.play().catch((e) => {
          console.warn('Audio play error:', e);
          if (e.name === 'NotAllowedError') {
            setAudioError('⚠️ يرجى الضغط على زر التشغيل ▶ لبدء الصوت (بسبب قيود التشغيل التلقائي بالمتصفح).');
          } else if (!isFallback) {
            const fallbackUrl = isFajr
              ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
              : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
            playAudioTrack(fallbackUrl, true);
          } else {
            setAudioError('تعذر تشغيل الملف الصوتي.');
          }
        });
      };

      getAudioUrl(url, id)
        .then((resolvedUrl) => {
          playAudioTrack(resolvedUrl, false);
        })
        .catch((err) => {
          console.error('Failed to resolve settings audio:', err);
          const fallbackUrl = isFajr
            ? 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/020--.mp3'
            : 'https://archive.org/download/90---azan---90---azan--many----sound----mp3---alazan/003--.mp3';
          playAudioTrack(fallbackUrl, true);
        });
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      let newTime = audioRef.current.currentTime + seconds;
      if (newTime < 0) newTime = 0;
      if (newTime > audioDuration) newTime = audioDuration;
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setAudioCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      stopAndCleanupAudio(audioRef.current);
      audioRef.current = null;
    }
    setPlayingAudio(null);
    setAudioIsPlaying(false);
    setAudioCurrentTime(0);
    setAudioDuration(0);
    setAudioError(null);
  };

  return {
    muezzins,
    playingAudio,
    audioIsPlaying,
    audioCurrentTime,
    audioDuration,
    playbackSpeed,
    audioError,
    audioSuccessMessage,
    downloadedTrackIds,
    downloadingId,
    storageStats,
    isBulkDownloading,
    bulkProgress,
    togglePlayAudio,
    handleSkip,
    handleSeek,
    handleSpeedChange,
    handleStopAudio,
    handleDownloadTrack,
    handleDeleteDownloadedTrack,
    handleBatchDownloadDefaults,
  };
}

export default useAdhanAudioLogic;
