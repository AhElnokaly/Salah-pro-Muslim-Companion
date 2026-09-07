import { MutableRefObject } from 'react';

let spiritualAudioCtx: AudioContext | null = null;

export const playSpiritualChime = (pitch: number = 523.25): void => {
  try {
    if (!spiritualAudioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        spiritualAudioCtx = new AudioContextClass();
      }
    }
    if (!spiritualAudioCtx) return;
    if (spiritualAudioCtx.state === 'suspended') {
      spiritualAudioCtx.resume();
    }
    
    const now = spiritualAudioCtx.currentTime;
    const osc1 = spiritualAudioCtx.createOscillator();
    const osc2 = spiritualAudioCtx.createOscillator();
    const gainNode = spiritualAudioCtx.createGain();
    const delayNode = spiritualAudioCtx.createDelay();
    const delayGain = spiritualAudioCtx.createGain();
    const filter = spiritualAudioCtx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(pitch, now);
    osc1.frequency.exponentialRampToValueAtTime(pitch / 2, now + 1.5);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(pitch / 2, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

    delayNode.delayTime.setValueAtTime(0.4, now);
    delayGain.gain.setValueAtTime(0.06, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    
    gainNode.connect(delayNode);
    delayNode.connect(delayGain);
    delayGain.connect(spiritualAudioCtx.destination);
    delayGain.connect(delayNode);

    gainNode.connect(spiritualAudioCtx.destination);

    osc1.start(now);
    osc2.start(now);
    
    osc1.stop(now + 2.0);
    osc2.stop(now + 2.0);
  } catch (err) {
    console.warn("Spiritual chime audio failed:", err);
  }
};

export const playSpiritualSpeech = async (text: string, volume: number = 0.8): Promise<boolean> => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.volume = Math.max(0, Math.min(1, volume));
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.warn('Spiritual speech synthesis error:', e);
    return false;
  }
};

export const playSpiritualSound = (
  soundType: string,
  title: string,
  volume: number,
  audioRef?: MutableRefObject<HTMLAudioElement | null>,
  notifyMode: string = 'both'
): void => {
  if (notifyMode === 'silent' || soundType === 'silent') return;

  if (soundType === 'speech') {
    playSpiritualSpeech(title, volume);
    return;
  }

  if (soundType === 'chime' || soundType === 'beep') {
    playSpiritualChime(soundType === 'chime' ? 523.25 : 440);
    return;
  }

  // If audio element exists, play audio track
  if (audioRef && audioRef.current) {
    try {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.warn('Audio playback prevented:', e));
    } catch (e) {
      console.warn('Audio ref play error:', e);
    }
  } else {
    // Default fallback to gentle chime
    playSpiritualChime(523.25);
  }
};
