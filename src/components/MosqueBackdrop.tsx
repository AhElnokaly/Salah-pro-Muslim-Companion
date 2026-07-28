import React from 'react';

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
  | 'auto';

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

          <filter id="kaaba-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Sky Gradients */}
          <linearGradient id="classicSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0a0e1a" stopOpacity="0.6" />
            <stop offset="60%" stopColor="#111827" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="goldSky" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#d97706" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="bannerSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#be185d" stopOpacity="0.45" />
            <stop offset="50%" stopColor="#881337" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4c0519" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="emeraldSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#047857" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#065f46" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="nightSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#020617" stopOpacity="0.75" />
            <stop offset="60%" stopColor="#0f172a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="kaabaSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0b0f19" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#1e293b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="andulasSkyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#312e81" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4338ca" stopOpacity="0.05" />
          </linearGradient>

          {/* Silhouette Mosque Gradients */}
          <linearGradient id="classicMosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="goldMosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="bannerMosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#9d174d" stopOpacity="0.6" />
          </linearGradient>

          <linearGradient id="emeraldMosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0.65" />
          </linearGradient>

          <linearGradient id="nightMosqueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.7" />
          </linearGradient>

          {/* Pattern Definition for Andalusian Geometric Lattice */}
          <pattern id="andalusianPattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 30,0 L 60,30 L 30,60 L 0,30 Z" fill="none" stroke="#f59e0b" strokeWidth="0.75" opacity="0.25" />
            <path d="M 30,10 L 50,30 L 30,50 L 10,30 Z" fill="none" stroke="#818cf8" strokeWidth="0.5" opacity="0.2" />
            <circle cx="30" cy="30" r="4" fill="#fef08a" opacity="0.3" />
          </pattern>
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
              : backdropKey === 'emerald'
              ? 'url(#emeraldSky)'
              : backdropKey === 'night_sky'
              ? 'url(#nightSkyGrad)'
              : backdropKey === 'kaaba'
              ? 'url(#kaabaSkyGrad)'
              : backdropKey === 'andulas'
              ? 'url(#andulasSkyGrad)'
              : 'url(#classicSky)'
          }
        />

        {/* Andalusian Geometric Pattern Overlay */}
        {backdropKey === 'andulas' && (
          <rect width="1200" height="400" fill="url(#andalusianPattern)" />
        )}

        {/* Celestial Elements (Stars & Crescent Moon / Sun) */}
        {backdropKey !== 'gold' ? (
          <g id="celestial-night">
            {/* Rich Starfield */}
            <circle cx="120" cy="60" r="1.5" fill="#ffffff" opacity="0.85" />
            <circle cx="220" cy="110" r="1.2" fill="#fef08a" opacity="0.9" />
            <circle cx="340" cy="45" r="1.8" fill="#ffffff" opacity="0.75" />
            <circle cx="480" cy="85" r="1.4" fill="#ffffff" opacity="0.8" />
            <circle cx="620" cy="50" r="1.6" fill="#fef08a" opacity="0.85" />
            <circle cx="780" cy="75" r="1.5" fill="#fef08a" opacity="0.9" />
            <circle cx="920" cy="40" r="2" fill="#ffffff" opacity="0.95" />
            <circle cx="1060" cy="110" r="1.3" fill="#ffffff" opacity="0.8" />
            <circle cx="1140" cy="65" r="1.6" fill="#fef08a" opacity="0.85" />

            {/* Glowing Crescent Moon */}
            <g transform="translate(1020, 80)" filter="url(#moon-glow)">
              <path
                d="M 28,0 A 28,28 0 1,1 0,28 A 22,22 0 1,0 28,0 Z"
                fill={
                  backdropKey === 'banner'
                    ? '#fbcfe8'
                    : backdropKey === 'emerald'
                    ? '#a7f3d0'
                    : '#fef08a'
                }
                opacity="0.95"
              />
            </g>

            {/* Ramadan / Eid Fanous Lantern */}
            {(backdropKey === 'ramadan' || backdropKey === 'eid_fitr' || backdropKey === 'eid_adha' || backdropKey === 'friday') && (
              <g transform="translate(140, 0)">
                <line x1="40" y1="0" x2="40" y2="75" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />
                <path d="M 30,75 L 50,75 L 55,90 L 25,90 Z" fill="#f59e0b" opacity="0.85" />
                <path d="M 25,90 L 55,90 L 48,120 L 32,120 Z" fill="#fbbf24" opacity="0.95" filter="url(#window-glow)" />
                <path d="M 32,120 L 48,120 L 40,135 Z" fill="#d97706" opacity="0.85" />
              </g>
            )}
          </g>
        ) : (
          /* Golden Sun & Radiant Rays for Day */
          <g id="celestial-day">
            <circle cx="1020" cy="80" r="40" fill="#fef08a" opacity="0.25" filter="url(#moon-glow)" />
            <circle cx="1020" cy="80" r="22" fill="#fef08a" opacity="0.5" />
            <line x1="1020" y1="20" x2="1020" y2="5" stroke="#fef08a" strokeWidth="2" opacity="0.4" />
            <line x1="1020" y1="140" x2="1020" y2="155" stroke="#fef08a" strokeWidth="2" opacity="0.4" />
            <line x1="960" y1="80" x2="945" y2="80" stroke="#fef08a" strokeWidth="2" opacity="0.4" />
            <line x1="1080" y1="80" x2="1095" y2="80" stroke="#fef08a" strokeWidth="2" opacity="0.4" />
          </g>
        )}

        {/* Specific KAABA Holy Sanctuary Backdrop */}
        {backdropKey === 'kaaba' ? (
          <g id="kaaba-silhouette">
            {/* Ground / Mataf Floor */}
            <rect x="0" y="370" width="1200" height="30" fill="#1e293b" opacity="0.8" />
            
            {/* Minarets of Al-Masjid al-Haram */}
            {/* Far Left Minaret */}
            <rect x="120" y="100" width="22" height="270" fill="url(#goldMosqueGrad)" opacity="0.7" />
            <path d="M 131,60 Q 120,90 120,100 L 142,100 Q 142,90 131,60 Z" fill="#fef08a" opacity="0.8" />
            
            {/* Left Inner Minaret */}
            <rect x="320" y="80" width="26" height="290" fill="url(#goldMosqueGrad)" opacity="0.85" />
            <path d="M 333,40 Q 320,70 320,80 L 346,80 Q 346,70 333,40 Z" fill="#fef08a" opacity="0.9" />

            {/* Right Inner Minaret */}
            <rect x="850" y="80" width="26" height="290" fill="url(#goldMosqueGrad)" opacity="0.85" />
            <path d="M 863,40 Q 850,70 850,80 L 876,80 Q 876,70 863,40 Z" fill="#fef08a" opacity="0.9" />

            {/* Far Right Minaret */}
            <rect x="1050" y="100" width="22" height="270" fill="url(#goldMosqueGrad)" opacity="0.7" />
            <path d="M 1061,60 Q 1050,90 1050,100 L 1072,100 Q 1072,90 1061,60 Z" fill="#fef08a" opacity="0.8" />

            {/* Holy Kaaba Structure (Centerpiece) */}
            <g transform="translate(510, 190)" filter="url(#kaaba-glow)">
              {/* Kaaba Main Cuboid Silhouette */}
              <rect x="0" y="0" width="180" height="180" rx="3" fill="#090d16" stroke="#d97706" strokeWidth="1.5" opacity="0.95" />
              
              {/* Golden Kiswa Band (Hizam) */}
              <rect x="0" y="30" width="180" height="18" fill="#fbbf24" opacity="0.9" />
              <rect x="0" y="33" width="180" height="2" fill="#ffffff" opacity="0.8" />
              <rect x="0" y="43" width="180" height="2" fill="#ffffff" opacity="0.8" />

              {/* Golden Door (Bab al-Kaaba) */}
              <rect x="120" y="60" width="36" height="75" rx="2" fill="#f59e0b" stroke="#fef08a" strokeWidth="1" opacity="0.95" />
              
              {/* Golden Water Spout (Meezab al-Rahmah) */}
              <rect x="80" y="-8" width="20" height="8" fill="#fbbf24" />
            </g>

            {/* Surrounding Arched Colonnades (Rawaq) */}
            <path d="M 0,320 Q 50,290 100,320 Q 150,290 200,320 Q 250,290 300,320 L 300,370 L 0,370 Z" fill="#1e293b" opacity="0.6" />
            <path d="M 900,320 Q 950,290 1000,320 Q 1050,290 1100,320 Q 1150,290 1200,320 L 1200,370 L 900,370 Z" fill="#1e293b" opacity="0.6" />
          </g>
        ) : (
          /* High-Precision Islamic Mosque Architectural Silhouette */
          <g
            id="mosque-silhouette"
            fill={
              backdropKey === 'gold'
                ? 'url(#goldMosqueGrad)'
                : backdropKey === 'banner'
                ? 'url(#bannerMosqueGrad)'
                : backdropKey === 'emerald'
                ? 'url(#emeraldMosqueGrad)'
                : backdropKey === 'night_sky'
                ? 'url(#nightMosqueGrad)'
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
              <path d="M 194,100 Q 180,140 180,160 L 208,160 Q 208,140 194,100 Z" />
              <path d="M 194,88 L 194,100 M 194,88 A 4,4 0 1,1 198,92" stroke={backdropKey === 'gold' || backdropKey === 'emerald' ? '#fef08a' : '#ffffff'} strokeWidth="1.5" fill="none" opacity="0.9" />
            </g>

            {/* Left Secondary Tower */}
            <rect x="290" y="240" width="20" height="140" rx="1" />
            <path d="M 300,200 Q 290,225 290,240 L 310,240 Q 310,225 300,200 Z" />

            {/* Left Side Dome */}
            <g id="dome-left">
              <path d="M 360,260 Q 360,190 420,180 Q 480,190 480,260 Z" />
              <rect x="360" y="260" width="120" height="120" />
              <line x1="420" y1="168" x2="420" y2="180" stroke="#fef08a" strokeWidth="1.5" opacity="0.8" />
            </g>

            {/* GRAND CENTRAL DOME (Centerpiece) */}
            <g id="dome-center">
              <rect x="520" y="220" width="160" height="160" />
              <path d="M 520,220 Q 515,130 600,100 Q 685,130 680,220 Z" />
              <g transform="translate(600, 75)">
                <line x1="0" y1="0" x2="0" y2="25" stroke={backdropKey === 'gold' || backdropKey === 'emerald' ? '#fef08a' : '#ffffff'} strokeWidth="2" opacity="0.9" />
                <circle cx="0" cy="2" r="5" fill="none" stroke={backdropKey === 'gold' || backdropKey === 'emerald' ? '#fef08a' : '#ffffff'} strokeWidth="1.5" />
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
              <path d="M 1006,88 L 1006,100 M 1006,88 A 4,4 0 1,1 1010,92" stroke={backdropKey === 'gold' || backdropKey === 'emerald' ? '#fef08a' : '#ffffff'} strokeWidth="1.5" fill="none" opacity="0.9" />
            </g>

            {/* Far Outer Wall Silhouettes */}
            <path d="M 0,330 L 180,330 L 180,380 L 0,380 Z" opacity="0.7" />
            <path d="M 1020,330 L 1200,330 L 1200,380 L 1020,380 Z" opacity="0.7" />
          </g>
        )}

        {/* Illuminated Arched Windows & Portal Doorway Glows */}
        {backdropKey !== 'kaaba' && (
          <g id="illuminated-windows" filter="url(#window-glow)">
            {/* Central Portal Arched Door */}
            <path
              d="M 580,380 L 580,320 A 20,20 0 0,1 620,320 L 620,380 Z"
              fill={backdropKey === 'gold' ? '#fef08a' : backdropKey === 'emerald' ? '#34d399' : '#f59e0b'}
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
        )}
      </svg>
    </div>
  );
}

