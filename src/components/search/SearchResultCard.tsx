/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Copy, Check, ChevronLeft } from 'lucide-react';
import { SearchResultItem } from '../../data/spiritualSearchData';

export interface SearchResultCardProps {
  item: SearchResultItem;
  playingId: string | null;
  copiedId: string | null;
  onItemClick: (item: SearchResultItem) => void;
  onPlayAudio: (id: string, text: string) => void;
  onCopyText: (id: string, text: string) => void;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  item,
  playingId,
  copiedId,
  onItemClick,
  onPlayAudio,
  onCopyText,
}) => {
  const isPlaying = playingId === item.id;
  const isCopied = copiedId === item.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl transition-all group space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 flex-1 cursor-pointer" onClick={() => onItemClick(item)}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {item.typeLabel}
            </span>
            {item.metadata && (
              <span className="text-[9.5px] text-slate-400 dark:text-slate-500 font-bold">
                • {item.metadata}
              </span>
            )}
          </div>

          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {item.title}
          </h4>

          {item.subtitle && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">
              {item.subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {item.content && (
            <>
              <button
                type="button"
                onClick={() => onPlayAudio(item.id, item.content || item.title)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-900 animate-pulse'
                    : 'bg-slate-200/60 dark:bg-slate-700/60 hover:bg-amber-500 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="قراءة صوتية مباركة"
                aria-label={isPlaying ? `إيقاف القراءة الصوتية لـ ${item.title}` : `تشغيل قراءة صوتية مباركة لـ ${item.title}`}
              >
                {isPlaying ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => onCopyText(item.id, item.content || item.title)}
                className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 hover:bg-emerald-500 text-slate-600 dark:text-slate-300 hover:text-white transition-all cursor-pointer"
                title="نسخ النص"
                aria-label={`نسخ نص ${item.title}`}
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onItemClick(item)}
            className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black"
            title="انتقال للقسم"
            aria-label={`عرض تفاصيل ${item.title}`}
          >
            <span>عرض</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {item.content && (
        <div 
          onClick={() => onItemClick(item)}
          className="p-2.5 bg-white/80 dark:bg-slate-900/60 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-bold leading-relaxed border border-slate-200/50 dark:border-slate-800/80 cursor-pointer line-clamp-3"
        >
          {item.content}
        </div>
      )}
    </motion.div>
  );
};

export default SearchResultCard;
