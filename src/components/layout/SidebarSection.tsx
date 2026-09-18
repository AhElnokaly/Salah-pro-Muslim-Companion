/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarSectionProps {
  title: string;
  icon?: React.ElementType;
  /** Optional "x/y" style count badge shown next to the title (e.g. active count) */
  count?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/**
 * A collapsible group used inside AppSidebar to keep the drawer scannable:
 * only the group headers are visible by default, and the person expands
 * the group they actually want instead of scrolling past everything.
 */
export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  icon: Icon,
  count,
  isOpen,
  onToggle,
  children,
}) => {
  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-2 py-1.5 cursor-pointer group"
      >
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />}
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
            {title}
          </span>
          {count && (
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400 dark:text-slate-500 shrink-0"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 gap-1 pb-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarSection;
