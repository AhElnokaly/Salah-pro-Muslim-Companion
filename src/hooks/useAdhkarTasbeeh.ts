/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { safeSetItem, safeGetItem, safeGetJSON } from '../utils/storage';

export interface UseAdhkarTasbeehOptions {
  triggerFeedback?: (type?: 'tap' | 'completed_dhikr' | 'completed_category') => void;
  onSpawnTapParticles?: () => void;
}

export function useAdhkarTasbeeh({ triggerFeedback, onSpawnTapParticles }: UseAdhkarTasbeehOptions = {}) {
  const [tasbeehPresetIdx, setTasbeehPresetIdx] = useState(0);
  const [customTasbeehText, setCustomTasbeehText] = useState('');
  const [isCustomTasbeeh, setIsCustomTasbeeh] = useState(false);
  const [tasbeehCount, setTasbeehCount] = useState(0);
  const [tasbeehTarget, setTasbeehTarget] = useState(33);
  const [showCompletionNotice, setShowCompletionNotice] = useState(false);

  const [tasbeehColor, setTasbeehColor] = useState<string>(() => {
    return safeGetItem('salah_tasbih_color') || 'indigo';
  });

  const [customTasbeehs, setCustomTasbeehs] = useState<string[]>(() => {
    return safeGetJSON<string[]>('mc_custom_tasbeehs', []);
  });

  useEffect(() => {
    safeSetItem('mc_custom_tasbeehs', JSON.stringify(customTasbeehs));
  }, [customTasbeehs]);

  const selectColor = useCallback((color: string) => {
    setTasbeehColor(color);
    safeSetItem('salah_tasbih_color', color);
  }, []);

  const addCustomTasbeeh = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setCustomTasbeehs((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCustomTasbeehText(trimmed);
    setIsCustomTasbeeh(true);
    setTasbeehCount(0);
  }, []);

  const removeCustomTasbeeh = useCallback((text: string) => {
    setCustomTasbeehs((prev) => prev.filter((t) => t !== text));
  }, []);

  const handleIncrementTasbeeh = useCallback(() => {
    if (onSpawnTapParticles) {
      onSpawnTapParticles();
    }

    if (tasbeehCount + 1 >= tasbeehTarget) {
      setTasbeehCount(tasbeehTarget);
      if (triggerFeedback) triggerFeedback('completed_category');
      setShowCompletionNotice(true);
      setTimeout(() => setShowCompletionNotice(false), 3000);
      setTasbeehCount(0);
    } else {
      if (triggerFeedback) triggerFeedback('tap');
      setTasbeehCount((prev) => prev + 1);
    }
  }, [tasbeehCount, tasbeehTarget, triggerFeedback, onSpawnTapParticles]);

  const resetCount = useCallback(() => {
    setTasbeehCount(0);
  }, []);

  return {
    tasbeehPresetIdx,
    setTasbeehPresetIdx,
    customTasbeehText,
    setCustomTasbeehText,
    isCustomTasbeeh,
    setIsCustomTasbeeh,
    tasbeehCount,
    setTasbeehCount,
    tasbeehTarget,
    setTasbeehTarget,
    tasbeehColor,
    selectColor,
    customTasbeehs,
    addCustomTasbeeh,
    removeCustomTasbeeh,
    handleIncrementTasbeeh,
    resetCount,
    showCompletionNotice,
  };
}

export type UseAdhkarTasbeehReturn = ReturnType<typeof useAdhkarTasbeeh>;
