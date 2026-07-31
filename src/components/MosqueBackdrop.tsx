import React, { memo } from 'react';
import { BackdropRenderMode } from '../types';
import { resolveRenderMode, getBackdropImagePath } from '../utils/backdropAssets';

export type BackdropType = 
  | 'gold' 
  | 'classic' 
  | 'banner' 
  | 'emerald' 
  | 'night_sky' 
  | 'kaaba' 
  | 'andulas' 
  | 'minimal' 
  | 'ramadan' 
  | 'eid_fitr' 
  | 'eid_adha' 
  | 'friday' 
  | 'madinah'
  | 'aqsa'
  | 'glass_crystal'
  | 'glass_emerald'
  | 'glass_blue'
  | 'glass_dark'
  | 'auto';

export interface MosqueBackdropProps {
  type: BackdropType | string;
  renderMode?: BackdropRenderMode;
  className?: string;
}

/**
 * OccasionOverlay Component
 * Adds festive/spiritual fine SVG accents (hanging lanterns, crescent arcs, stars)
 * over any backdrop (PNG or LineArt).
 */
export const OccasionOverlay = memo(function OccasionOverlay({
  backdropKey,
}: {
  backdropKey: string;
}) {
  const isRamadan = backdropKey === 'ramadan';
  const isEidFitr = backdropKey === 'eid_fitr';
  const isEidAdha = backdropKey === 'eid_adha';
  const isFriday = backdropKey === 'friday';

  if (!isRamadan && !isEidFitr && !isEidAdha && !isFriday) {
    return null;
  }

  return (
    <svg
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none z-10"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="overlay-lantern-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Ramadan / Eid Hanging Fanoos Lanterns */}
      {(isRamadan || isEidFitr || isEidAdha) && (
        <g id="occasion-lanterns">
          {/* Main Left Lantern */}
          <g className="lineart-flicker" transform="translate(140, 0)">
            <line x1="40" y1="0" x2="40" y2="70" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.8" />
            <path d="M 28,70 L 52,70 L 58,86 L 22,86 Z" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            <path d="M 22,86 L 58,86 L 50,118 L 30,118 Z" fill="#fbbf24" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1.5" filter="url(#overlay-lantern-glow)" />
            <path d="M 30,118 L 50,118 L 40,132 Z" fill="none" stroke="#d97706" strokeWidth="1.5" />
            <circle cx="40" cy="102" r="4" fill="#fef08a" className="lineart-pulse-slow" />
          </g>

          {/* Secondary Center Lantern */}
          <g className="lineart-flicker" transform="translate(600, 0)">
            <line x1="30" y1="0" x2="30" y2="45" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
            <path d="M 20,45 L 40,45 L 45,58 L 15,58 Z" fill="none" stroke="#fef08a" strokeWidth="1.2" />
            <path d="M 15,58 L 45,58 L 38,82 L 22,82 Z" fill="#fef08a" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.2" />
            <path d="M 22,82 L 38,82 L 30,92 Z" fill="none" stroke="#d97706" strokeWidth="1.2" />
            <circle cx="30" cy="70" r="3" fill="#fef08a" className="lineart-pulse-slow" />
          </g>

          {/* Right Lantern */}
          <g className="lineart-flicker" transform="translate(1020, 0)">
            <line x1="35" y1="0" x2="35" y2="60" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.8" />
            <path d="M 24,60 L 46,60 L 51,74 L 19,74 Z" fill="none" stroke="#fbbf24" strokeWidth="1.2" />
            <path d="M 19,74 L 51,74 L 44,102 L 26,102 Z" fill="#fbbf24" fillOpacity="0.2" stroke="#f59e0b" strokeWidth="1.2" filter="url(#overlay-lantern-glow)" />
            <path d="M 26,102 L 44,102 L 35,114 Z" fill="none" stroke="#d97706" strokeWidth="1.2" />
            <circle cx="35" cy="88" r="3.5" fill="#fef08a" className="lineart-pulse-slow" />
          </g>
        </g>
      )}

      {/* Eid Festive Garland Bunting Arc */}
      {(isEidFitr || isEidAdha) && (
        <g id="eid-festive-arc">
          <path d="M 0,30 Q 300,90 600,30 Q 900,90 1200,30" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
          {[150, 300, 450, 750, 900, 1050].map((cx, idx) => (
            <g key={idx} transform={`translate(${cx}, ${48 + (idx % 2 === 0 ? 10 : 0)})`} className="lineart-twinkle">
              <polygon points="0,-8 6,6 -8,-2 8,-2 -6,6" fill="#fef08a" opacity="0.85" />
            </g>
          ))}
        </g>
      )}

      {/* Friday Jumu'ah Subtle Ray Header */}
      {isFriday && (
        <g id="friday-rays" opacity="0.4" className="lineart-pulse-slow">
          <path d="M 600,0 L 500,200 L 700,200 Z" fill="url(#friday-ray-grad)" opacity="0.15" />
          <circle cx="600" cy="40" r="2" fill="#34d399" className="lineart-twinkle" />
          <circle cx="580" cy="60" r="1.5" fill="#34d399" className="lineart-twinkle" />
          <circle cx="620" cy="60" r="1.5" fill="#34d399" className="lineart-twinkle" />
        </g>
      )}
    </svg>
  );
});

/**
 * LineArtBackdrop Component
 * Elegant, fine-line vector art SVG for all Islamic backdrop themes.
 * Renders sharp gold / emerald / cyan lines with glowing accents and twinkling stars.
 */
export const LineArtBackdrop = memo(function LineArtBackdrop({
  type,
  className = '',
}: {
  type: string;
  className?: string;
}) {
  const backdropKey = type === 'auto' ? 'classic' : type;
  const isGlass = backdropKey.startsWith('glass_');

  // Determine primary stroke color scheme based on theme
  let strokeColor = '#f59e0b'; // Gold default
  let glowColor = '#fef08a';
  let accentColor = '#fbbf24';

  if (backdropKey === 'emerald' || backdropKey === 'madinah' || backdropKey === 'glass_emerald') {
    strokeColor = '#10b981';
    glowColor = '#a7f3d0';
    accentColor = '#34d399';
  } else if (backdropKey === 'classic' || backdropKey === 'glass_blue' || backdropKey === 'night_sky') {
    strokeColor = '#38bdf8';
    glowColor = '#bae6fd';
    accentColor = '#60a5fa';
  } else if (backdropKey === 'banner') {
    strokeColor = '#f43f5e';
    glowColor = '#fecdd3';
    accentColor = '#fb7185';
  } else if (backdropKey === 'andulas') {
    strokeColor = '#c084fc';
    glowColor = '#f3e8ff';
    accentColor = '#a855f7';
  }

  return (
    <div className={`w-full h-full relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full object-cover object-bottom"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="lineart-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <linearGradient id="lineart-sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0b0f19" stopOpacity={isGlass ? "0.2" : "0.65"} />
            <stop offset="70%" stopColor="#1e293b" stopOpacity={isGlass ? "0.1" : "0.35"} />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="friday-ray-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle Background Tint */}
        {!isGlass && (
          <rect width="1200" height="400" fill="url(#lineart-sky-grad)" />
        )}

        {/* Twinkling Starfield */}
        <g id="lineart-stars" className="lineart-twinkle">
          <circle cx="120" cy="50" r="1.5" fill={glowColor} opacity="0.8" />
          <circle cx="240" cy="90" r="1.2" fill="#ffffff" opacity="0.6" />
          <circle cx="380" cy="40" r="1.8" fill={glowColor} opacity="0.85" />
          <circle cx="520" cy="75" r="1.4" fill="#ffffff" opacity="0.7" />
          <circle cx="680" cy="45" r="1.6" fill={glowColor} opacity="0.8" />
          <circle cx="840" cy="80" r="1.3" fill="#ffffff" opacity="0.6" />
          <circle cx="980" cy="35" r="2" fill={glowColor} opacity="0.9" />
          <circle cx="1100" cy="95" r="1.4" fill="#ffffff" opacity="0.7" />
        </g>

        {/* Glowing Crescent Moon & Star */}
        <g id="lineart-moon" transform="translate(1020, 65)" filter="url(#lineart-glow)" className="lineart-pulse-slow">
          <path
            d="M 22,0 A 22,22 0 1,1 0,22 A 17,17 0 1,0 22,0 Z"
            fill={accentColor}
            fillOpacity="0.2"
            stroke={accentColor}
            strokeWidth="1.5"
          />
          <polygon points="32,8 35,14 41,15 37,19 38,25 32,22 26,25 27,19 23,15 29,14" fill={glowColor} opacity="0.9" />
        </g>

        {/* Architectural Fine Line Vector Art Selection */}
        {backdropKey === 'kaaba' ? (
          /* Holy Kaaba Fine Line Vector */
          <g id="lineart-kaaba" stroke={strokeColor} strokeWidth="1.2" fill="none">
            {/* Courtyard Base Line */}
            <line x1="0" y1="380" x2="1200" y2="380" strokeWidth="1.5" opacity="0.8" />
            
            {/* Kaaba Cube Fine Lines */}
            <g transform="translate(510, 190)" filter="url(#lineart-glow)">
              <rect x="0" y="0" width="180" height="180" rx="3" fill="#0b0f19" fillOpacity="0.8" stroke={strokeColor} strokeWidth="1.8" />
              {/* Kiswa Gold Band Lines */}
              <rect x="0" y="32" width="180" height="16" fill={accentColor} fillOpacity="0.25" stroke={accentColor} strokeWidth="1.2" />
              <line x1="0" y1="36" x2="180" y2="36" stroke={glowColor} strokeWidth="0.8" strokeDasharray="4 2" />
              <line x1="0" y1="44" x2="180" y2="44" stroke={glowColor} strokeWidth="0.8" strokeDasharray="4 2" />
              {/* Door Outline */}
              <rect x="115" y="62" width="42" height="80" rx="2" fill={accentColor} fillOpacity="0.3" stroke={glowColor} strokeWidth="1.5" />
              {/* Corner Lines */}
              <line x1="0" y1="0" x2="0" y2="180" strokeWidth="1.5" />
              <line x1="180" y1="0" x2="180" y2="180" strokeWidth="1.5" />
            </g>

            {/* Minaret Line Art */}
            <g opacity="0.85">
              <rect x="140" y="100" width="22" height="280" strokeWidth="1" />
              <polygon points="151,50 140,100 162,100" strokeWidth="1.2" />
              <rect x="340" y="80" width="24" height="300" strokeWidth="1" />
              <polygon points="352,30 340,80 364,80" strokeWidth="1.2" />
              <rect x="836" y="80" width="24" height="300" strokeWidth="1" />
              <polygon points="848,30 836,80 860,80" strokeWidth="1.2" />
              <rect x="1038" y="100" width="22" height="280" strokeWidth="1" />
              <polygon points="1049,50 1038,100 1060,100" strokeWidth="1.2" />
            </g>
          </g>
        ) : backdropKey === 'madinah' ? (
          /* Prophet's Mosque Green Dome Line Art */
          <g id="lineart-madinah" stroke={strokeColor} strokeWidth="1.2" fill="none">
            <line x1="0" y1="380" x2="1200" y2="380" strokeWidth="1.5" opacity="0.8" />

            {/* Green Dome Curve Strokes */}
            <g transform="translate(510, 140)" filter="url(#lineart-glow)">
              <path d="M 0,140 L 0,80 Q -5,10 90,0 Q 185,10 180,80 L 180,140 Z" fill="#047857" fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.8" />
              <line x1="90" y1="-28" x2="90" y2="0" stroke={glowColor} strokeWidth="2" />
              <circle cx="90" cy="-28" r="4.5" fill={glowColor} stroke={strokeColor} strokeWidth="1.2" />
            </g>

            {/* Nabawi Minarets */}
            <g opacity="0.85">
              <rect x="220" y="110" width="26" height="270" strokeWidth="1.2" />
              <polygon points="233,50 220,110 246,110" strokeWidth="1.5" />
              <rect x="950" y="110" width="26" height="270" strokeWidth="1.2" />
              <polygon points="963,50 950,110 976,110" strokeWidth="1.5" />
            </g>
          </g>
        ) : backdropKey === 'aqsa' ? (
          /* Dome of the Rock Line Art */
          <g id="lineart-aqsa" stroke={strokeColor} strokeWidth="1.2" fill="none">
            <line x1="0" y1="380" x2="1200" y2="380" strokeWidth="1.5" opacity="0.8" />

            <g transform="translate(480, 150)" filter="url(#lineart-glow)">
              {/* Octagonal Base Stroke */}
              <polygon points="20,130 0,210 240,210 220,130" fill="#78350f" fillOpacity="0.25" stroke={strokeColor} strokeWidth="1.5" />
              <rect x="20" y="98" width="200" height="32" fill="#b45309" fillOpacity="0.3" stroke={strokeColor} strokeWidth="1.5" />
              {/* Dome Stroke */}
              <path d="M 30,98 Q 25,10 120,0 Q 215,10 210,98 Z" fill="#d97706" fillOpacity="0.35" stroke={glowColor} strokeWidth="2" />
              <line x1="120" y1="-25" x2="120" y2="0" stroke={glowColor} strokeWidth="2" />
              <circle cx="120" cy="-25" r="4" fill={glowColor} />
            </g>

            {/* Arched Colonnades Line Art */}
            <path d="M 120,290 Q 170,250 220,290 Q 270,250 320,290 L 320,380 L 120,380 Z" strokeWidth="1.2" opacity="0.7" />
            <path d="M 880,290 Q 930,250 980,290 Q 1030,250 1080,290 L 1080,380 L 880,380 Z" strokeWidth="1.2" opacity="0.7" />
          </g>
        ) : backdropKey === 'andulas' ? (
          /* Andalusian Geometric Horseshoe Arch Line Art */
          <g id="lineart-andulas" stroke={strokeColor} strokeWidth="1.2" fill="none">
            <line x1="0" y1="380" x2="1200" y2="380" strokeWidth="1.5" opacity="0.8" />
            
            {/* Grand Andalusian Horseshoe Arch */}
            <g transform="translate(480, 140)" filter="url(#lineart-glow)">
              <path d="M 20,240 L 20,140 Q 0,40 120,10 Q 240,40 220,140 L 220,240 Z" stroke={strokeColor} strokeWidth="2" fill={accentColor} fillOpacity="0.1" />
              <path d="M 40,240 L 40,145 Q 20,60 120,30 Q 220,60 200,145 L 200,240 Z" stroke={glowColor} strokeWidth="1" strokeDasharray="5 3" />
            </g>

            {/* Side Andalusian Arches */}
            <path d="M 120,380 L 120,260 Q 110,180 200,160 Q 290,180 280,260 L 280,380" strokeWidth="1.2" opacity="0.7" />
            <path d="M 920,380 L 920,260 Q 910,180 1000,160 Q 1090,180 1080,260 L 1080,380" strokeWidth="1.2" opacity="0.7" />
          </g>
        ) : (
          /* High-Precision Mosque Fine Line Vector Architecture */
          <g id="lineart-mosque-generic" stroke={strokeColor} strokeWidth="1.2" fill="none">
            <line x1="0" y1="380" x2="1200" y2="380" strokeWidth="1.5" opacity="0.8" />

            {/* Left Minaret */}
            <g opacity="0.85">
              <rect x="180" y="160" width="28" height="220" strokeWidth="1.2" />
              <path d="M 194,95 Q 180,135 180,160 L 208,160 Q 208,135 194,95 Z" strokeWidth="1.5" />
              <line x1="194" y1="70" x2="194" y2="95" stroke={glowColor} strokeWidth="1.5" />
              <circle cx="194" cy="68" r="3" fill={glowColor} />
            </g>

            {/* Left Dome */}
            <g opacity="0.8">
              <rect x="360" y="260" width="120" height="120" strokeWidth="1" />
              <path d="M 360,260 Q 360,185 420,175 Q 480,185 480,260 Z" fill={accentColor} fillOpacity="0.1" strokeWidth="1.5" />
            </g>

            {/* GRAND CENTRAL DOME */}
            <g filter="url(#lineart-glow)">
              <rect x="520" y="210" width="160" height="170" strokeWidth="1.2" />
              <path d="M 520,210 Q 515,115 600,85 Q 685,115 680,210 Z" fill={accentColor} fillOpacity="0.18" stroke={glowColor} strokeWidth="2" />
              <line x1="600" y1="58" x2="600" y2="85" stroke={glowColor} strokeWidth="2" />
              <circle cx="600" cy="56" r="4" fill={glowColor} />
            </g>

            {/* Right Dome */}
            <g opacity="0.8">
              <rect x="720" y="260" width="120" height="120" strokeWidth="1" />
              <path d="M 720,260 Q 720,185 780,175 Q 840,185 840,260 Z" fill={accentColor} fillOpacity="0.1" strokeWidth="1.5" />
            </g>

            {/* Right Minaret */}
            <g opacity="0.85">
              <rect x="992" y="160" width="28" height="220" strokeWidth="1.2" />
              <path d="M 1006,95 Q 992,135 992,160 L 1020,160 Q 1020,135 1006,95 Z" strokeWidth="1.5" />
              <line x1="1006" y1="70" x2="1006" y2="95" stroke={glowColor} strokeWidth="1.5" />
              <circle cx="1006" cy="68" r="3" fill={glowColor} />
            </g>

            {/* Illuminated Arch Gate Line Art */}
            <path d="M 570,380 L 570,320 A 30,30 0 0,1 630,320 L 630,380 Z" stroke={glowColor} strokeWidth="1.8" fill={glowColor} fillOpacity="0.25" />
          </g>
        )}
      </svg>

      {/* Occasion Overlay Accents (Lanterns, Arcs, Stars) */}
      <OccasionOverlay backdropKey={backdropKey} />
    </div>
  );
});

/**
 * IllustratedBackdrop Component
 * Renders high-fidelity PNG image asset when available in src/assets/backdrops/.
 */
export const IllustratedBackdrop = memo(function IllustratedBackdrop({
  type,
  className = '',
}: {
  type: string;
  className?: string;
}) {
  const backdropKey = type === 'auto' ? 'classic' : type;
  const imagePath = getBackdropImagePath(backdropKey);

  if (!imagePath) {
    // Fallback to LineArtBackdrop if image path is not found
    return <LineArtBackdrop type={backdropKey} className={className} />;
  }

  return (
    <div className={`w-full h-full relative overflow-hidden pointer-events-none select-none ${className}`}>
      <img
        src={imagePath}
        alt={`Islamic Backdrop ${backdropKey}`}
        className="w-full h-full object-cover object-bottom transition-opacity duration-500"
        referrerPolicy="no-referrer"
        onError={(e) => {
          // Hide broken image gracefully if file fails to load
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
      {/* Occasion Overlay over the PNG image */}
      <OccasionOverlay backdropKey={backdropKey} />
    </div>
  );
});

/**
 * Main MosqueBackdrop Component
 * Chooses between Illustrated (PNG) and LineArt (SVG) dynamically
 * based on user preference and asset availability.
 */
function MosqueBackdropComponent({
  type,
  renderMode,
  className = '',
}: MosqueBackdropProps) {
  const backdropKey = type === 'auto' ? 'classic' : type;

  // Read setting preference if renderMode prop is not explicitly supplied
  let effectivePreference: BackdropRenderMode = renderMode || 'auto';
  if (!renderMode && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('salah_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.backdropRenderMode) {
          effectivePreference = parsed.backdropRenderMode;
        }
      }
    } catch (e) {
      // ignore parse error
    }
  }

  const resolvedMode = resolveRenderMode(backdropKey, effectivePreference);

  if (resolvedMode === 'illustrated') {
    return <IllustratedBackdrop type={backdropKey} className={className} />;
  }

  return <LineArtBackdrop type={backdropKey} className={className} />;
}

export default memo(MosqueBackdropComponent);
