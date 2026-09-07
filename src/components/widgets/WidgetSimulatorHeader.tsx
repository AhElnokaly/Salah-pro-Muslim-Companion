/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WallpaperOption } from './useWidgetSimulatorLogic';

interface WidgetSimulatorHeaderProps {
  isFaithBright: boolean;
  wallpapers: WallpaperOption[];
  activeWallpaper: string;
  onSelectWallpaper: (id: string) => void;
}

export const WidgetSimulatorHeader: React.FC<WidgetSimulatorHeaderProps> = ({
  isFaithBright,
  wallpapers,
  activeWallpaper,
  onSelectWallpaper,
}) => {
  return (
    <div
      className={`p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b ${
        isFaithBright ? 'border-slate-200/60' : 'border-white/5'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
            isFaithBright ? 'bg-amber-100 text-amber-700' : 'bg-indigo-500/10 text-indigo-400'
          }`}
        >
          📱
        </div>
        <div className="text-end">
          <h3 className="text-sm font-black leading-tight">تطبيقات شاشة الهاتف (Widgets Lab)</h3>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
            صمّم، جرب، وحمل المكونات الذكية التفاعلية الخاصة بهاتفك مباشرة بالأسفل
          </p>
        </div>
      </div>

      {/* Wallpapers selector inside header */}
      <div
        className={`flex items-center gap-1.5 p-1 rounded-xl border ${
          isFaithBright ? 'bg-slate-100/85 border-slate-200' : 'bg-slate-900/65 border-white/5'
        }`}
      >
        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 px-1">الخلفية:</span>
        <div className="flex gap-1">
          {wallpapers.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onSelectWallpaper(w.id)}
              aria-label={`اختيار خلفية الشاشة: ${w.name}`}
              className={`w-4 h-4 rounded-full border transition-all hover:scale-125 cursor-pointer ${
                w.style
              } ${activeWallpaper === w.id ? 'ring-2 ring-indigo-500 scale-110' : ''}`}
              title={w.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WidgetSimulatorHeader;
