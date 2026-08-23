import React from 'react';
import { CardBlockSize, CardBlockAccent } from '../../../types';

interface EventTagBlockProps {
  size?: CardBlockSize;
  accent?: CardBlockAccent;
  getIslamicEventLabel: () => { text: string; icon?: string } | null;
}

const EventTagBlock: React.FC<EventTagBlockProps> = ({
  size = 'compact',
  getIslamicEventLabel
}) => {
  const ev = getIslamicEventLabel();
  if (!ev) return null;

  const sizeClasses = {
    compact: 'text-[9px] px-2.5 py-0.5',
    normal: 'text-[10px] px-3 py-0.5',
    large: 'text-[11px] px-3.5 py-1'
  }[size];

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-emerald-600/25 to-amber-500/10 border border-amber-400/15 rounded-full text-center animate-pulse my-0.5">
      <span className={`font-black text-amber-300 block leading-normal ${sizeClasses}`}>{ev.text}</span>
    </div>
  );
};

export default EventTagBlock;
