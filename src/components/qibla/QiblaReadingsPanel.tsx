/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Navigation, Sparkles, HelpCircle } from 'lucide-react';
import { AppSettings } from '../../types';
import { toArabicNumbers } from '../../utils/hijri';

export interface QiblaReadingsPanelProps {
  currentHeading: number;
  qiblaAngle: number;
  angleDiff?: number;
  settings: AppSettings;
  setSettings?: React.Dispatch<React.SetStateAction<AppSettings>>;
  isSyncingLoc: boolean;
  locFeedback: string;
  isAligned: boolean;
  deviceHeading: number | null;
  onSyncLocation: () => void;
  onShowBraveHelp: () => void;
}

export const QiblaReadingsPanel: React.FC<QiblaReadingsPanelProps> = ({
  currentHeading,
  qiblaAngle,
  angleDiff = 0,
  settings,
  setSettings,
  isSyncingLoc,
  locFeedback,
  isAligned,
  deviceHeading,
  onSyncLocation,
  onShowBraveHelp,
}) => {
  const roundedHeading = Math.round(currentHeading);
  const roundedDiff = Math.round(Math.abs(angleDiff));
  const turnDirection = angleDiff > 0 ? 'اليمين' : 'اليسار';

  return (
    <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
      {/* Live Screen Reader Announcement for Visually Impaired Users */}
      <div className="sr-only" aria-live="polite" role="status">
        {isAligned
          ? 'أنت الآن باتجاه القبلة الشريفة تماماً نحو الكعبة المشرفة.'
          : `الاتجاه الحالي ${roundedHeading} درجة. للوصول للقبلة، أدر الهاتف بمقدار ${roundedDiff} درجة نحو ${turnDirection}.`}
      </div>

      {/* Real-time Dynamic Big Digit Heading */}
      <div 
        className="text-5xl sm:text-6xl font-sans font-black tracking-tight text-white drop-shadow-md select-all"
        aria-label={`الاتجاه الحالي للبوصلة ${roundedHeading} درجة`}
      >
        {roundedHeading}
      </div>

      {/* Descriptive Direction details */}
      <div className="space-y-1.5 flex flex-col items-center">
        <p className="text-white/80 text-xs font-semibold tracking-wide">
          الاتجاه التقريبي للقبلة في
        </p>
        <div className="flex items-center gap-2">
          <p className="text-white text-base sm:text-lg font-black tracking-wide" aria-label={`مدينة ${settings.cityName} زاوية القبلة ${toArabicNumbers(Math.round(qiblaAngle))} درجة`}>
            {settings.cityName} {toArabicNumbers(Math.round(qiblaAngle))}°
          </p>
          {setSettings && (
            <button
              type="button"
              disabled={isSyncingLoc}
              onClick={onSyncLocation}
              className="p-1.5 bg-white/10 hover:bg-white/20 text-emerald-300 rounded-full transition-all cursor-pointer border border-white/10 active:scale-95 text-xs flex items-center gap-1"
              title="مزامنة الموقع الحالي عبر GPS / شبكة IP"
              aria-label="مزامنة الموقع الجغرافي الحالي عبر نظام التموضع العالمي GPS"
            >
              {isSyncingLoc ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
              ) : (
                <Navigation className="w-3.5 h-3.5 text-emerald-300" />
              )}
            </button>
          )}
        </div>

        {locFeedback && (
          <p 
            role="status"
            aria-live="polite"
            className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full"
          >
            {locFeedback}
          </p>
        )}
        
        {isAligned && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            role="status"
            aria-live="assertive"
            className="text-emerald-400 text-xs font-black flex items-center justify-center gap-1 mt-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>أنت الآن باتجاه القبلة الشريفة 🕋</span>
          </motion.div>
        )}
      </div>

      {/* Help button for Brave/Chrome sensor issues */}
      {deviceHeading === null && (
        <button
          type="button"
          onClick={onShowBraveHelp}
          aria-label="عرض إرشادات تفعيل مستشعرات البوصلة في المتصفح"
          className="text-[10px] font-bold text-cyan-300 hover:text-cyan-200 cursor-pointer underline underline-offset-2 flex items-center justify-center gap-1 mx-auto mt-2 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 active:scale-95 transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>مشكلة في تفعيل المستشعر؟ اضغط هنا</span>
        </button>
      )}
    </div>
  );
};

export default QiblaReadingsPanel;
