/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { toArabicNumbers } from '../../../utils/hijri';
import ToggleSwitch from '../../ui/ToggleSwitch';

export interface AdhanVolumeControlsProps {
  audioVolume: number;
  setAudioVolume: React.Dispatch<React.SetStateAction<number>>;
  autoPlayAthan: boolean;
  setAutoPlayAthan: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AdhanVolumeControls: React.FC<AdhanVolumeControlsProps> = ({
  audioVolume,
  setAudioVolume,
  autoPlayAthan,
  setAutoPlayAthan,
}) => {
  return (
    <>
      {/* General Volume Control */}
      <div className="space-y-2 p-3 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-600 dark:text-slate-400 flex items-center gap-1">
            {audioVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : audioVolume < 0.5 ? (
              <Volume1 className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-indigo-500" />
            )}
            شدة ومستوى صوت الأذان
          </span>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
            {toArabicNumbers(Math.round(audioVolume * 100))}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={audioVolume}
          onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
          className="w-full accent-indigo-600 cursor-pointer"
        />
      </div>

      {/* Auto Play Toggle */}
      <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-[#111720] rounded-2xl border border-slate-100 dark:border-slate-800/45 gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-black text-slate-700 dark:text-slate-200 block">
            الأذان التلقائي فور دخول الوقت
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block">
            تشغيل صوت الأذان كاملاً في المتصفح فور حلول وقت الفريضة.
          </span>
        </div>
        <ToggleSwitch
          checked={autoPlayAthan}
          onChange={(checked) => setAutoPlayAthan(checked)}
          activeColor="bg-indigo-600"
        />
      </div>
    </>
  );
};

export default AdhanVolumeControls;
