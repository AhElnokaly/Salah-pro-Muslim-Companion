/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const KaabaIsometricIcon: React.FC<{ className?: string }> = ({ 
  className = "w-12 h-12 text-white/95 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" 
}) => {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none">
      {/* Top of Cube */}
      <path d="M50 25 L75 35 L50 45 L25 35 Z" fill="#2c3540" stroke="#424f5e" strokeWidth="0.5" />
      {/* Left wall */}
      <path d="M25 35 L50 45 L50 72 L25 62 Z" fill="#151921" />
      {/* Right wall */}
      <path d="M50 45 L75 35 L75 62 L50 72 Z" fill="#0d1015" />
      {/* Gold Belt (Kiswah gold band) */}
      <path d="M25 43 L50 53 L50 55.5 L25 45.5 Z" fill="#d4af37" />
      <path d="M50 53 L75 43 L75 45.5 L50 55.5 Z" fill="#bfa130" />
      {/* Door of Kaaba */}
      <path d="M57 50.5 L64 47.5 L64 58 L57 61 Z" fill="#d4af37" opacity="0.9" />
    </svg>
  );
};

export default KaabaIsometricIcon;
