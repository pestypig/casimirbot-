// components/BackgroundLuma.tsx
// Simplified version without Three.js - using CSS animations for now
import * as React from "react";

type Props = {
  opacity?: number;          // 0.12–0.25 feels right
  blurPx?: number;           // 4–10px (CSS filter)
  paused?: boolean;          // allow toggling
};

export function BackgroundLuma({
  opacity = 0.18,
  blurPx = 6,
  paused = false
}: Props) {
  // Pause when tab hidden (perf)
  const [visPaused, setVisPaused] = React.useState(false);
  React.useEffect(() => {
    const h = () => setVisPaused(document.hidden);
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ filter: `blur(${blurPx}px)`, opacity }}
    >
      {/* Simplified CSS-based background until Three.js is available */}
      <div className="absolute inset-0 bg-gradient-radial from-amber-300/20 via-orange-400/10 to-transparent">
        <BackgroundStars />
        <div 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-radial from-yellow-200/30 via-orange-300/20 to-transparent ${
            paused || visPaused ? '' : 'animate-pulse'
          }`}
          style={{
            animation: paused || visPaused ? 'none' : 'gentle-float 8s ease-in-out infinite, gentle-glow 4s ease-in-out infinite alternate',
          }}
        >
          {/* Luma PNG as fallback until 3D model loads */}
          <img 
            src="/luma/Luma_29.png" 
            alt="Luma Guardian" 
            className="w-32 h-32 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
            style={{ filter: 'brightness(1.2) contrast(0.8)' }}
          />
        </div>
      </div>
    </div>
  );
}

function BackgroundStars() {
  // CSS-based star field
  const stars = React.useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      delay: Math.random() * 4
    }));
  }, []);

  return (
    <div className="absolute inset-0">
      {stars.map(star => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
}