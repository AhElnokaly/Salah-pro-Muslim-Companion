/**
 * Focus Mode & Home Modes Manager
 */

export type HomeLayoutMode = 'minimal' | 'balanced' | 'spiritual';

export interface FocusModeState {
  isFocusModeActive: boolean;
  homeLayoutMode: HomeLayoutMode;
  largeTextEnabled: boolean;
  reducedMotionEnabled: boolean;
  highContrastEnabled: boolean;
}

const FOCUS_MODE_STORAGE_KEY = 'hemmaty_focus_mode_state';

export class FocusModeService {
  static getFocusState(): FocusModeState {
    if (typeof window === 'undefined') {
      return {
        isFocusModeActive: false,
        homeLayoutMode: 'balanced',
        largeTextEnabled: false,
        reducedMotionEnabled: false,
        highContrastEnabled: false,
      };
    }

    try {
      const raw = localStorage.getItem(FOCUS_MODE_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    return {
      isFocusModeActive: false,
      homeLayoutMode: 'balanced',
      largeTextEnabled: false,
      reducedMotionEnabled: false,
      highContrastEnabled: false,
    };
  }

  static saveFocusState(state: Partial<FocusModeState>): FocusModeState {
    const current = this.getFocusState();
    const updated = { ...current, ...state };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(updated));
        this.applyAccessibilityClasses(updated);
      } catch {
        // ignore
      }
    }
    return updated;
  }

  static applyAccessibilityClasses(state: FocusModeState): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    if (state.largeTextEnabled) {
      root.classList.add('large-text-mode');
    } else {
      root.classList.remove('large-text-mode');
    }

    if (state.highContrastEnabled) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    if (state.reducedMotionEnabled) {
      root.classList.add('reduced-motion-mode');
    } else {
      root.classList.remove('reduced-motion-mode');
    }
  }
}
