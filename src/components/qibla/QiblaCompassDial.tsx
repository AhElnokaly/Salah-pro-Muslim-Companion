/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface QiblaCompassDialProps {
  dialRotation: number;
  dialTransitionClass: string;
  qiblaAngle: number;
}

const cardinalLabels = [
  { text: 'N', angle: 0, isMajor: true },
  { text: 'NE', angle: 45, isMajor: false },
  { text: 'E', angle: 90, isMajor: true },
  { text: 'SE', angle: 135, isMajor: false },
  { text: 'S', angle: 180, isMajor: true },
  { text: 'SW', angle: 225, isMajor: false },
  { text: 'W', angle: 270, isMajor: true },
  { text: 'NW', angle: 315, isMajor: false },
];

export const QiblaCompassDial: React.FC<QiblaCompassDialProps> = ({
  dialRotation,
  dialTransitionClass,
  qiblaAngle,
}) => {
  const renderCompassTicks = () => {
    return Array.from({ length: 72 }).map((_, index) => {
      const angle = index * 5;
      const isMajor = angle % 30 === 0;
      const isCardinal = angle % 90 === 0;
      const tickLength = isCardinal ? 8 : isMajor ? 6 : 4;
      const strokeWidth = isCardinal ? 1.2 : isMajor ? 0.8 : 0.5;
      const strokeColor = isCardinal 
        ? 'rgba(255, 255, 255, 0.85)' 
        : isMajor 
        ? 'rgba(255, 255, 255, 0.5)' 
        : 'rgba(255, 255, 255, 0.2)';
      
      const r1 = 96;
      const r2 = 96 - tickLength;
      const rad = (angle * Math.PI) / 180;
      const x1 = 100 + r1 * Math.sin(rad);
      const y1 = 100 - r1 * Math.cos(rad);
      const x2 = 100 + r2 * Math.sin(rad);
      const y2 = 100 - r2 * Math.cos(rad);
      
      return (
        <line
          key={index}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      );
    });
  };

  const qRad = (qiblaAngle * Math.PI) / 180;
  const qr = 54;
  const qx = 100 + qr * Math.sin(qRad);
  const qy = 100 - qr * Math.cos(qRad);

  return (
    <div 
      className={`w-52 h-52 sm:w-60 sm:h-60 rounded-full border border-white/5 bg-[#050e14] shadow-inner flex items-center justify-center pointer-events-none relative ${dialTransitionClass}`}
      style={{
        transform: `rotate(${dialRotation}deg)`
      }}
    >
      {/* SVG Tick Marks and Cardinal Directions */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
        {/* Ticks */}
        {renderCompassTicks()}
        
        {/* English Cardinal Text Labels exactly rotating with the dial */}
        {cardinalLabels.map((lbl, idx) => {
          const rad = (lbl.angle * Math.PI) / 180;
          const r = 76; // outer padding for labels
          const x = 100 + r * Math.sin(rad);
          const y = 100 - r * Math.cos(rad);
          return (
            <text
              key={idx}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className={`font-sans tracking-tighter ${
                lbl.isMajor 
                  ? 'text-[11px] font-extrabold fill-white/90' 
                  : 'text-[7.5px] font-bold fill-white/40'
              }`}
              transform={`rotate(${lbl.angle}, ${x}, ${y})`}
            >
              {lbl.text}
            </text>
          );
        })}

        {/* Gold marker for Qibla direction inside the dial */}
        <g transform={`rotate(${qiblaAngle}, ${qx}, ${qy})`}>
          <circle cx={qx} cy={qy} r="6" className="fill-amber-400" />
          <text x={qx} y={qy} textAnchor="middle" dominantBaseline="middle" className="text-[7px] fill-slate-950 font-black">🕋</text>
        </g>
      </svg>

      {/* Subtle center background circle decoration */}
      <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center">
        <span className="text-xl opacity-20">✨</span>
      </div>
    </div>
  );
};

export default QiblaCompassDial;
