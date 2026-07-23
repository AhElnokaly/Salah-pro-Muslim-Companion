import React from 'react';

export type BackdropType = 'gold' | 'classic' | 'banner' | 'ramadan' | 'eid_fitr' | 'eid_adha' | 'friday' | 'auto';

interface MosqueBackdropProps {
  type: BackdropType | string;
  className?: string;
}

export default function MosqueBackdrop({ type, className = '' }: MosqueBackdropProps) {
  // Determine actual style if 'auto' or fallback
  const backdropKey = type === 'auto' ? 'classic' : type;

  return (
    <div className={`w-full h-full relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 1200 400"
        preserveAspectRatio="xMidYMax slice"
        className="w-full h-full object-cover object-bottom"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial Glow Filters */}
          <filter id="moon-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="window-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradients */}
          {/* Classic Night Gradient */}
          <linearGradient id="classicSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a0e1a" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#111827" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>

          {/* Gold Sunlit Gradient */}
          <linearGradient id="goldSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#d97706" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </linearGradient>

          {/* Sunset Banner Gradient */}
          <linearGradient id="bannerSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#be185d" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#881337" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#4c0519" stopOpacity="0" />
          </linearGradient>

          {/* Fill colors for mosque silhouette based on theme */}
          {/* Classic: Deep indigo silhouette with glowing gold windows */}
          <linearGradient id="classicMosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.6" />
          </linearGradient>

          {/* Gold: Shimmering amber/gold silhouette */}
          <linearGradient id="goldMosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.55" />
          </linearGradient>

          {/* Banner: Sunset rose/amber silhouette */}
          <linearGradient id="bannerMosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#9d174d" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Sky Background Tint */}
        <rect
          width="1200"
          height="400"
          fill={
            backdropKey === 'gold'
              ? 'url(#goldSky)'
              : backdropKey === 'banner'
              ? 'url(#bannerSky)'
              : 'url(#classicSky)'
          }
        />

        {/* Decorative Celestial Elements (Stars & Crescent Moon) */}
        {backdropKey !== 'gold' ? (
          <g id="celestial-night">
            {/* Stars */}
            <circle cx="150" cy="70" r="1.5" fill="#ffffff" opacity="0.8" />
            <circle cx="280" cy="110" r="1.2" fill="#fef08a" opacity="0.9" />
            <circle cx="420" cy="50" r="1.8" fill="#ffffff" opacity="0.7" />
            <circle cx="780" cy="80" r="1.5" fill="#fef08a" opacity="0.85" />
            <circle cx="950" cy="60" r="2" fill="#ffffff" opacity="0.9" />
            <circle cx="1080" cy="120" r="1.3" fill="#ffffff" opacity="0.75" />

            {/* Glowing Crescent Moon */}
            <g transform="translate(1020, 85)" filter="url(#moon-glow)">
              <path
                d="M 25,0 A 25,25 0 1,1 0,25 A 20,20 0 1,0 25,0 Z"
                fill={backdropKey === 'banner' ? '#fbcfe8' : '#fef08a'}
                opacity="0.9"
              />
            </g>

            {/* Optional Ramadan Lantern (Fanous) */}
            {(backdropKey === 'ramadan' || backdropKey === 'eid_fitr') && (
              <g transform="translate(140, 0)">
                <line x1="40" y1="0" x2="40" y2="80" stroke="#f59e0b" strokeWidth="1" opacity="0.6" />
                {/* Fanous Body */}
                <path d="M 30,80 L 50,80 L 55,95 L 25,95 Z" fill="#f59e0b" opacity="0.8" />
                <path d="M 25,95 L 55,95 L 48,125 L 32,125 Z" fill="#fbbf24" opacity="0.9" filter="url(#window-glow)" />
                <path d="M 32,125 L 48,125 L 40,140 Z" fill="#d97706" opacity="0.8" />
              </g>
            )}
          </g>
        ) : (
          /* Golden Sun & Rays for Day */
          <g id="celestial-day">
            <circle cx="1020" cy="80" r="35" fill="#fef08a" opacity="0.25" filter="url(#moon-glow)" />
            <circle cx="1020" cy="80" r="20" fill="#fef08a" opacity="0.4" />
          </g>
        )}

        {/* High-Precision Islamic Mosque Architectural Silhouette */}
        <g
          id="mosque-silhouette"
          fill={
            backdropKey === 'gold'
              ? 'url(#goldMosqueGrad)'
              : backdropKey === 'banner'
              ? 'url(#bannerMosqueGrad)'
              : 'url(#classicMosqueGrad)'
          }
        >
          {/* Main Ground Line */}
          <rect x="0" y="380" width="1200" height="20" />

          {/* Left Main Minaret */}
          <g id="minaret-left">
            <rect x="180" y="160" width="28" height="220" rx="2" />
            <rect x="174" y="220" width="40" height="8" rx="1" />
            <rect x="176" y="290" width="36" height="8" rx="1" />
            {/* Minaret Dome Dome Spire */}
            <path d="M 194,100 Q 180,140 180,160 L 208,160 Q 208,140 194,100 Z" />
            {/* Finial Crescent */}
            <path d="M 194,88 L 194,100 M 194,88 A 4,4 0 1,1 198,92" stroke={backdropKey === 'gold' ? '#fef08a' : '#ffffff'} strokeWidth="1.5" fill="none" opacity="0.9" />
          </g>

          {/* Left Secondary Tower */}
          <rect x="290" y="240" width="20" height="140" rx="1" />
          <path d="M 300,200 Q 290,225 290,240 L 310,240 Q 310,225 300,200 Z" />

          {/* Left Side Dome */}
          <g id="dome-left">
            <path d="M 360,260 Q 360,190 420,180 Q 480,190 480,260 Z" />
            <rect x="360" y="260" width="120" height="120" />
            {/* Small Crescent Finial */}
            <line x1="420" y1="168" x2="420" y2="180" stroke="#fef08a" strokeWidth="1.5" opacity="0.8" />
          </g>

          {/* GRAND CENTRAL DOME (Centerpiece) */}
          <g id="dome-center">
            {/* Base Drum */}
            <rect x="520" y="220" width="160" height="160" />
            {/* Majestic Onion Dome Shape */}
            <path d="M 520,220 Q 515,130 600,100 Q 685,130 680,220 Z" />
            {/* Crescent Finial */}
            <g transform="translate(600, 75)">
              <line x1="0" y1="0" x2="0" y2="25" stroke={backdropKey === 'gold' ? '#fef08a' : '#ffffff'} strokeWidth="2" opacity="0.9" />
              <circle cx="0" cy="2" r="5" fill="none" stroke={backdropKey === 'gold' ? '#fef08a' : '#ffffff'} strokeWidth="1.5" />
            </g>
          </g>

          {/* Right Side Dome */}
          <g id="dome-right">
            <path d="M 720,260 Q 720,190 780,180 Q 840,190 840,260 Z" />
            <rect x="720" y="260" width="120" height="120" />
            <line x1="780" y1="168" x2="780" y2="180" stroke="#fef08a" strokeWidth="1.5" opacity="0.8" />
          </g>

          {/* Right Secondary Tower */}
          <rect x="890" y="240" width="20" height="140" rx="1" />
          <path d="M 900,200 Q 890,225 890,240 L 910,240 Q 910,225 900,200 Z" />

          {/* Right Main Minaret */}
          <g id="minaret-right">
            <rect x="992" y="160" width="28" height="220" rx="2" />
            <rect x="986" y="220" width="40" height="8" rx="1" />
            <rect x="988" y="290" width="36" height="8" rx="1" />
            <path d="M 1006,100 Q 992,140 992,160 L 1020,160 Q 1020,140 1006,100 Z" />
            <path d="M 1006,88 L 1006,100 M 1006,88 A 4,4 0 1,1 1010,92" stroke={backdropKey === 'gold' ? '#fef08a' : '#ffffff'} strokeWidth="1.5" fill="none" opacity="0.9" />
          </g>

          {/* Far Outer Wall Silhouettes */}
          <path d="M 0,330 L 180,330 L 180,380 L 0,380 Z" opacity="0.7" />
          <path d="M 1020,330 L 1200,330 L 1200,380 L 1020,380 Z" opacity="0.7" />
        </g>

        {/* Illuminated Arched Windows & Portal Doorway Glows */}
        <g id="illuminated-windows" filter="url(#window-glow)">
          {/* Central Portal Arched Door */}
          <path
            d="M 580,380 L 580,320 A 20,20 0 0,1 620,320 L 620,380 Z"
            fill={backdropKey === 'gold' ? '#fef08a' : '#f59e0b'}
            opacity="0.85"
          />

          {/* Left Dome Windows */}
          <path d="M 390,310 A 10,10 0 0,1 410,310 L 410,340 L 390,340 Z" fill="#fbbf24" opacity="0.7" />
          <path d="M 430,310 A 10,10 0 0,1 450,310 L 450,340 L 430,340 Z" fill="#fbbf24" opacity="0.7" />

          {/* Right Dome Windows */}
          <path d="M 750,310 A 10,10 0 0,1 770,310 L 770,340 L 750,340 Z" fill="#fbbf24" opacity="0.7" />
          <path d="M 790,310 A 10,10 0 0,1 810,310 L 810,340 L 790,340 Z" fill="#fbbf24" opacity="0.7" />

          {/* Minaret Balcony Light Beams */}
          <rect x="186" y="222" width="16" height="4" fill="#fef08a" opacity="0.9" />
          <rect x="998" y="222" width="16" height="4" fill="#fef08a" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
}
