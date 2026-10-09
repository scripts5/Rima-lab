import React from 'react';

interface DuolingoMascotProps {
  mood?: 'waving' | 'happy' | 'urgent' | 'celebrating' | 'thinking' | 'sad';
  speechBubble?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DuolingoMascot: React.FC<DuolingoMascotProps> = ({
  mood = 'waving',
  speechBubble,
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Mascot Animated Avatar */}
      <div className={`relative flex-shrink-0 ${sizeClasses[size]}`}>
        {/* Glow halo */}
        <div
          className={`absolute -inset-1 rounded-full blur-md opacity-40 transition-all ${
            mood === 'urgent'
              ? 'bg-orange-500 animate-pulse'
              : mood === 'celebrating'
              ? 'bg-amber-400 animate-pulse'
              : mood === 'sad'
              ? 'bg-red-500'
              : 'bg-emerald-500'
          }`}
        />

        {/* Mascot SVG (Rap Owl / Coruja do Rap) */}
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full relative z-10 drop-shadow-md transition-transform duration-300 hover:scale-105"
        >
          {/* Main Owl Body - Duolingo Lime Green */}
          <ellipse cx="60" cy="65" rx="42" ry="46" fill="#58cc02" />
          {/* 3D bottom bevel */}
          <path
            d="M 22 75 Q 60 115 98 75 Q 60 110 22 75"
            fill="#46a302"
          />

          {/* Belly Patch - Pale Lime */}
          <ellipse cx="60" cy="74" rx="26" ry="28" fill="#d7ffb8" />
          {/* Rap Feathers / Chest Marks */}
          <path d="M 52 70 Q 60 76 68 70" stroke="#89e219" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 50 80 Q 60 86 70 80" stroke="#89e219" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Owl Feather Ears / Tuft */}
          <polygon points="26,30 38,48 20,44" fill="#58cc02" />
          <polygon points="94,30 82,48 100,44" fill="#58cc02" />

          {/* Eyes Background (White) */}
          <circle cx="44" cy="50" r="17" fill="#ffffff" />
          <circle cx="76" cy="50" r="17" fill="#ffffff" />

          {/* Eye Pupils based on Mood */}
          {mood === 'urgent' ? (
            <>
              {/* Wide alarmed eyes */}
              <circle cx="44" cy="50" r="8" fill="#1b2a32" />
              <circle cx="46" cy="48" r="2.5" fill="#ffffff" />
              <circle cx="76" cy="50" r="8" fill="#1b2a32" />
              <circle cx="78" cy="48" r="2.5" fill="#ffffff" />
              {/* Sweat drop */}
              <ellipse cx="22" cy="45" rx="3" ry="5" fill="#60a5fa" />
            </>
          ) : mood === 'sad' ? (
            <>
              {/* Sad downward eyes */}
              <path d="M 36 50 Q 44 42 52 50" stroke="#1b2a32" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d="M 68 50 Q 76 42 84 50" stroke="#1b2a32" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Tear drop */}
              <ellipse cx="40" cy="62" rx="2" ry="4" fill="#60a5fa" />
            </>
          ) : mood === 'happy' || mood === 'celebrating' ? (
            <>
              {/* Cheerful squinting eyes */}
              <path d="M 36 52 Q 44 42 52 52" stroke="#1b2a32" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              <path d="M 68 52 Q 76 42 84 52" stroke="#1b2a32" strokeWidth="4.5" fill="none" strokeLinecap="round" />
              {/* Blush cheeks */}
              <ellipse cx="32" cy="60" rx="4" ry="2.5" fill="#fca5a5" opacity="0.8" />
              <ellipse cx="88" cy="60" rx="4" ry="2.5" fill="#fca5a5" opacity="0.8" />
            </>
          ) : (
            <>
              {/* Standard Duolingo friendly eyes */}
              <circle cx="44" cy="50" r="9" fill="#1b2a32" />
              <circle cx="47" cy="47" r="3" fill="#ffffff" />
              <circle cx="76" cy="50" r="9" fill="#1b2a32" />
              <circle cx="79" cy="47" r="3" fill="#ffffff" />
            </>
          )}

          {/* Orange Beak */}
          <polygon points="53,56 67,56 60,68" fill="#ff9600" />
          <polygon points="56,58 64,58 60,65" fill="#ffc800" />

          {/* Rap Accessories */}
          {/* Gold Chain with "MC" Medallion */}
          <path d="M 42 90 Q 60 102 78 90" stroke="#ffd700" strokeWidth="3" fill="none" strokeDasharray="2,3" />
          <circle cx="60" cy="98" r="7" fill="#ffd700" stroke="#d4af37" strokeWidth="1" />
          <text x="60" y="101" fontSize="6" fontWeight="900" textAnchor="middle" fill="#5c4300">MC</text>

          {/* Celebration Crown */}
          {mood === 'celebrating' && (
            <polygon points="46,18 52,28 60,15 68,28 74,18 70,30 50,30" fill="#ffd700" stroke="#b8860b" strokeWidth="1.5" />
          )}

          {/* Microphone in Hand if waving / celebrating */}
          {(mood === 'waving' || mood === 'celebrating') && (
            <g transform="translate(86, 68) rotate(-25)">
              <rect x="0" y="8" width="6" height="18" rx="2" fill="#262626" />
              <rect x="-1" y="2" width="8" height="10" rx="3" fill="#d4d4d4" stroke="#737373" strokeWidth="0.8" />
              <line x1="1" y1="5" x2="5" y2="5" stroke="#404040" strokeWidth="0.8" />
              <line x1="1" y1="8" x2="5" y2="8" stroke="#404040" strokeWidth="0.8" />
            </g>
          )}

          {/* Orange Feet */}
          <ellipse cx="48" cy="111" rx="8" ry="4" fill="#ff9600" />
          <ellipse cx="72" cy="111" rx="8" ry="4" fill="#ff9600" />
        </svg>
      </div>

      {/* Duolingo Comic Speech Bubble */}
      {speechBubble && (
        <div className="relative rounded-2xl border-2 border-neutral-700 bg-neutral-900 px-4 py-2.5 shadow-lg max-w-xs sm:max-w-md">
          {/* Speech bubble pointer tip */}
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-neutral-700" />
          <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-t-7 border-t-transparent border-b-7 border-b-transparent border-r-7 border-r-neutral-900" />

          <p className="text-xs sm:text-sm font-bold text-neutral-100 leading-snug">
            {speechBubble}
          </p>
        </div>
      )}
    </div>
  );
};
