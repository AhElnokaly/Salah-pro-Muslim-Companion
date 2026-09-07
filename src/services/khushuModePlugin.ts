/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerPlugin } from '@capacitor/core';
import { safeGetJSON, safeSetJSON } from '../utils/storage';

export type KhushuModeType = 'silent' | 'dnd';

export interface KhushuStatusResult {
  active: boolean;
  mode: KhushuModeType;
  durationMinutes: number;
  remainingSeconds: number;
  hasPermission: boolean;
}

export interface KhushuModePluginInterface {
  checkPermission(): Promise<{ granted: boolean }>;
  requestPermission(): Promise<{ requested: boolean }>;
  activate(options: { mode: KhushuModeType; durationMinutes: number }): Promise<{
    active: boolean;
    mode: KhushuModeType;
    durationMinutes: number;
  }>;
  deactivate(): Promise<{ active: boolean }>;
  getStatus(): Promise<KhushuStatusResult>;
}

// Fallback implementation for web preview environments
class KhushuModeWebFallback implements KhushuModePluginInterface {
  private STORAGE_KEY = 'hemmaty_khushu_web_state';

  private getState(): {
    active: boolean;
    mode: KhushuModeType;
    durationMinutes: number;
    activatedAt: number;
  } {
    return safeGetJSON(this.STORAGE_KEY, {
      active: false,
      mode: 'silent' as KhushuModeType,
      durationMinutes: 30,
      activatedAt: 0,
    });
  }

  async checkPermission(): Promise<{ granted: boolean }> {
    return { granted: true };
  }

  async requestPermission(): Promise<{ requested: boolean }> {
    return { requested: true };
  }

  async activate(options: { mode: KhushuModeType; durationMinutes: number }): Promise<{
    active: boolean;
    mode: KhushuModeType;
    durationMinutes: number;
  }> {
    const state = {
      active: true,
      mode: options.mode || 'silent',
      durationMinutes: options.durationMinutes || 30,
      activatedAt: Date.now(),
    };
    safeSetJSON(this.STORAGE_KEY, state);
    return {
      active: true,
      mode: state.mode,
      durationMinutes: state.durationMinutes,
    };
  }

  async deactivate(): Promise<{ active: boolean }> {
    const state = this.getState();
    state.active = false;
    state.activatedAt = 0;
    safeSetJSON(this.STORAGE_KEY, state);
    return { active: false };
  }

  async getStatus(): Promise<KhushuStatusResult> {
    const state = this.getState();
    let remainingSeconds = 0;
    if (state.active && state.activatedAt > 0) {
      const elapsedMs = Date.now() - state.activatedAt;
      const totalMs = state.durationMinutes * 60 * 1000;
      const leftMs = totalMs - elapsedMs;
      remainingSeconds = leftMs > 0 ? Math.floor(leftMs / 1000) : 0;
      if (leftMs <= 0) {
        state.active = false;
        safeSetJSON(this.STORAGE_KEY, state);
      }
    }

    return {
      active: state.active && remainingSeconds > 0,
      mode: state.mode,
      durationMinutes: state.durationMinutes,
      remainingSeconds,
      hasPermission: true,
    };
  }
}

export const KhushuMode = registerPlugin<KhushuModePluginInterface>('KhushuMode', {
  web: () => new KhushuModeWebFallback(),
});
