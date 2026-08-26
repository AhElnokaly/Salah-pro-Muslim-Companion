/**
 * Hemmaty Unified Design Tokens (System-Wide Design System & Accessibility Rules)
 */

export const colors = {
  // Brand & Identity Colors
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    900: '#14532d',
  },
  // Spiritual Gold
  spiritual: {
    amber: '#f59e0b',
    gold: '#d97706',
    glow: 'rgba(245, 158, 11, 0.25)',
  },
  // Semantic Status Colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  // Surface Neutrals (Light & Dark)
  neutral: {
    bgLight: '#faf7f0',
    bgDark: '#0c1017',
    cardLight: '#ffffff',
    cardDark: '#161e2e',
    cardElevatedLight: '#f3eee3',
    cardElevatedDark: '#1f293d',
    borderLight: '#e2d8c3',
    borderDark: '#2a364f',
    textPrimaryLight: '#1e293b',
    textPrimaryDark: '#f8fafc',
    textSecondaryLight: '#64748b',
    textSecondaryDark: '#94a3b8',
  },
};

export const typography = {
  fontFamily: {
    sans: '"Cairo", "Inter", ui-sans-serif, system-ui, sans-serif',
    mono: '"JetBrains Mono", monospace',
  },
  // Standardized Accessible Scale (Minimum size is 12px)
  scale: {
    xs: '12px',    // Subtitles, badges, captions (WCAG compliant min size)
    sm: '14px',    // Secondary body text, details
    base: '16px',  // Standard body text
    lg: '18px',    // Card headings, subheaders
    xl: '20px',    // Section titles
    '2xl': '24px', // Screen titles, main metrics
    '3xl': '30px', // Hero titles
    '4xl': '36px', // Large counters
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  touchMin: '44px', // WCAG AAA touch target size constraint
  containerPadding: {
    mobile: '16px',
    tablet: '24px',
    desktop: '32px',
  },
};

export const radius = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  pill: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  glow: '0 0 15px rgba(245, 158, 11, 0.3)',
};

export const motion = {
  transitionFast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  transitionNormal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  transitionSlow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const accessibility = {
  focusRingClass: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
  minTouchTargetClass: 'min-h-[44px] min-w-[44px]',
};
