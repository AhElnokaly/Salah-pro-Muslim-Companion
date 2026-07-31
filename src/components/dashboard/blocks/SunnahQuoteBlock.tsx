import React from 'react';
import { CardBlockSize, CardBlockAccent } from '../../../types';

interface SunnahQuoteBlockProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  now: Date;
}

const SunnahQuoteBlock: React.FC<SunnahQuoteBlockProps> = ({
  now
}) => {
  const hr = now.getHours();
  let quote = "احرص على ركعة الوتر قبل النوم ليكون مسك ختام يومك المبارك.";
  if (hr >= 4 && hr < 11) quote = "سنة الضحى صلاة الأوابين، تجزئ عن ٣٦٠ صدقة من مفاصل جسدك.";
  else if (hr >= 11 && hr < 15) quote = "رواتب الظهر: أربع ركعات قبلها وركعتان بعدها تبني لك بيتًا في الجنة.";
  else if (hr >= 15 && hr < 18) quote = "أربع ركعات قبل العصر رحم الله امرءاً صلى قبل العصر أربعاً.";

  return (
    <div className="text-[9.5px] font-bold text-white/80 bg-white/5 border border-white/5 rounded-xl px-2.5 py-1.5 w-full leading-relaxed flex items-start gap-1.5 shadow-sm text-end my-1">
      <span className="text-amber-300 text-[11px] shrink-0 mt-0.5">💡</span>
      <span className="leading-normal">{quote}</span>
    </div>
  );
};

export default SunnahQuoteBlock;
