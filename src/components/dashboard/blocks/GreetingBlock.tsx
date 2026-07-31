import React from 'react';
import { CardBlockSize, CardBlockAccent } from '../../../types';

interface GreetingBlockProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  now: Date;
}

const GreetingBlock: React.FC<GreetingBlockProps> = ({
  size = 'compact',
  now
}) => {
  const hr = now.getHours();
  let greetingText = "ليلتك هادئة بذكر الله 🌙";
  if (hr >= 4 && hr < 12) greetingText = "صباحك بذكر الله أجمل 🌸";
  else if (hr >= 12 && hr < 16) greetingText = "يومك مبارك وسعيد ☀️";
  else if (hr >= 16 && hr < 19) greetingText = "مساؤك عامر بالرضا والطاعة ✨";

  const sizeClasses = {
    compact: 'text-[10px] sm:text-[11px]',
    normal: 'text-[11px] sm:text-xs',
    large: 'text-xs sm:text-sm'
  }[size];

  return (
    <span className={`font-extrabold text-amber-200/95 tracking-wide drop-shadow-sm ${sizeClasses}`}>
      {greetingText}
    </span>
  );
};

export default GreetingBlock;
