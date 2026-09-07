import React from 'react';
import {
  RotateCcw,
  RotateCw,
  Play,
  Pause,
} from 'lucide-react';
import { toArabicNumbers } from '../../../utils/hijri';

interface PlayingAudioState {
  id: string;
  url: string;
  name: string;
  isFajr: boolean;
}

interface AdhanAudioPlaybarProps {
  playingAudio: PlayingAudioState;
  audioIsPlaying: boolean;
  audioCurrentTime: number;
  audioDuration: number;
  playbackSpeed: number;
  audioError: string | null;
  audioSuccessMessage: string | null;
  onStopAudio: () => void;
  onTogglePlay: (id: string, url: string) => void;
  onSkip: (seconds: number) => void;
  onSeek: (time: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const AdhanAudioPlaybar: React.FC<AdhanAudioPlaybarProps> = ({
  playingAudio,
  audioIsPlaying,
  audioCurrentTime,
  audioDuration,
  playbackSpeed,
  audioError,
  audioSuccessMessage,
  onStopAudio,
  onTogglePlay,
  onSkip,
  onSeek,
  onSpeedChange,
}) => {
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  return (
    <div className="p-4 bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-[#131b26] dark:to-[#17212f] rounded-2xl border border-indigo-100 dark:border-indigo-950/50 space-y-3 shadow-md text-end transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 ${
                audioIsPlaying ? '' : 'hidden'
              }`}
            ></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          <span>مشغل الصوت التفاعلي للتحكم والتحقق</span>
        </div>
        <button
          onClick={onStopAudio}
          className="text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
          title="إغلاق المشغل"
        >
          إغلاق ×
        </button>
      </div>

      <div className="space-y-1">
        <h4 className="text-xs font-black text-slate-800 dark:text-white leading-tight">
          {playingAudio.name}
        </h4>
        {playingAudio.isFajr && (
          <p className="text-[11px] text-indigo-600/90 dark:text-indigo-400/90 font-medium">
            ✨ هذا الأذان مخصص لصلاة الفجر، يمكنك التقديم والتحقق من عبارة "الصلاة خير من النوم".
          </p>
        )}
        {audioError && (
          <p className="text-[11px] text-rose-500 font-bold bg-rose-50/50 dark:bg-rose-950/10 p-2 rounded-lg border border-rose-100 dark:border-rose-950/20">
            ⚠️ {audioError}
          </p>
        )}
        {audioSuccessMessage && (
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-950/10 p-2 rounded-lg border border-emerald-100 dark:border-emerald-950/20">
            ✅ {audioSuccessMessage}
          </p>
        )}
      </div>

      {/* Scrubber / Timeline Slider */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={audioDuration || 100}
          step="0.1"
          value={audioCurrentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
        />
        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400">
          <span>{toArabicNumbers(formatTime(audioCurrentTime))}</span>
          <span>{toArabicNumbers(formatTime(audioDuration))}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onSkip(-10)}
            aria-label="تراجع في مقطع الأذان 10 ثوانٍ"
            className="py-1.5 px-2.5 rounded-xl bg-white dark:bg-[#1c2635] border border-slate-150 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-xs font-bold"
            title="تراجع ١٠ ثوانٍ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>١٠ث -</span>
          </button>

          <button
            type="button"
            onClick={() => onTogglePlay(playingAudio.id, playingAudio.url)}
            aria-label={audioIsPlaying ? 'إيقاف مؤقت لصوت الأذان' : 'تشغيل صوت الأذان'}
            className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-200 dark:shadow-none animate-pulse-slow"
            title={audioIsPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
          >
            {audioIsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => onSkip(10)}
            aria-label="تقديم في مقطع الأذان 10 ثوانٍ"
            className="py-1.5 px-2.5 rounded-xl bg-white dark:bg-[#1c2635] border border-slate-150 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95 text-xs font-bold"
            title="تقدم ١٠ ثوانٍ"
          >
            <span>١٠ث +</span>
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed Rates */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#10161f] p-0.5 rounded-lg border border-slate-150 dark:border-slate-800/50">
          {[1.0, 1.25, 1.5, 2.0].map((speed) => {
            const isActive = playbackSpeed === speed;
            return (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {speed === 1.0 ? 'طبيعي' : `${speed}x`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-medium bg-white/40 dark:bg-black/15 p-2.5 rounded-xl border border-slate-150/40 dark:border-slate-800/20">
        💡 **تلميح:** يمكنك السحب على شريط الوقت للتقديم والتأخير، أو زيادة السرعة (مثل 1.5x) لتسريع الفحص للتأكد من وجود جملة "الصلاة خير من النوم" في الأذان المختار.
      </div>
    </div>
  );
};
