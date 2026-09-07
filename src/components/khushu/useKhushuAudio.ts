/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState, useEffect } from 'react';

export type AmbientSoundType = 'none' | 'rain' | 'breeze' | 'stream';

export function useKhushuAudio() {
  const [activeAmbient, setActiveAmbient] = useState<AmbientSoundType>('none');
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodesRef = useRef<{ source: AudioNode; gain: GainNode } | null>(null);

  const stopAmbientAudio = () => {
    if (soundNodesRef.current) {
      try {
        soundNodesRef.current.gain.disconnect();
      } catch {
        // ignore
      }
      soundNodesRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
    setActiveAmbient('none');
  };

  const playAmbientAudio = (type: 'rain' | 'breeze' | 'stream') => {
    stopAmbientAudio();

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      if (type === 'rain') {
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        }
      } else if (type === 'breeze') {
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.2;
        }
      } else {
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.35;
        }
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.value = 800;
      } else if (type === 'breeze') {
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 1.0;
      } else {
        filter.type = 'lowpass';
        filter.frequency.value = 600;
      }

      const gain = ctx.createGain();
      gain.gain.value = 0.15;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start(0);
      soundNodesRef.current = { source: whiteNoise, gain };
      setActiveAmbient(type);
    } catch (e) {
      console.error('Audio synth error:', e);
      setActiveAmbient('none');
    }
  };

  useEffect(() => {
    return () => {
      stopAmbientAudio();
    };
  }, []);

  return {
    activeAmbient,
    playAmbientAudio,
    stopAmbientAudio,
  };
}
