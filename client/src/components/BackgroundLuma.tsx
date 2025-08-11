"use client";
import * as React from "react";

// Background stars component
function BackgroundStars() {
  return (
    <div className="absolute inset-0">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

export function BackgroundLuma({
  opacity = 0.18,
  blurPx = 6,
}: { opacity?: number; blurPx?: number }) {
  const [paused, setPaused] = React.useState(false);
  const [visPaused, setVisPaused] = React.useState(false);

  React.useEffect(() => {
    const h = () => setVisPaused(document.hidden);
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, filter: `blur(${blurPx}px)`, opacity }}
    >
      {/* Simplified CSS-based background */}
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
          {/* Luma PNG as cosmic guardian */}
          <img 
            src="/luma/Luma_29.png" 
            alt="Luma Guardian" 
            className="w-32 h-32 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-lg"
            style={{ filter: 'brightness(1.2) contrast(0.8)' }}
            onError={(e) => {
              console.warn("Luma PNG not found:", "/luma/Luma_29.png");
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
            onLoad={() => {
              console.log("✅ Luma PNG loaded successfully");
            }}
          />
        </div>
      </div>
    </div>
  );
}