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
      style={{ zIndex: 0, opacity, filter: `blur(${blurPx}px)` }}
    >
      <img
        src="/luma/Luma_29.png"
        alt="Luma Guardian"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-luma-float drop-shadow-lg"
        style={{ width: "60vmin", maxWidth: 900, opacity: 0.95, filter: "brightness(1.05)" }}
        onLoad={() => console.log("✅ Luma PNG loaded")}
        onError={(e) => {
          console.warn("Luma PNG not found at /luma/Luma_29.png");
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />

      <style>{`
        @keyframes luma-float {
          0%{transform:translate(-50%,-50%) translateY(0) rotate(0) scale(1)}
          50%{transform:translate(-50%,-50%) translateY(-12px) rotate(1.5deg) scale(1.02)}
          100%{transform:translate(-50%,-50%) translateY(0) rotate(0) scale(1)}
        }
        .animate-luma-float{animation:luma-float 8s ease-in-out infinite}
      `}</style>
    </div>
  );
}