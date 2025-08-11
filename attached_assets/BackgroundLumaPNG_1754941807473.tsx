"use client";
import * as React from "react";

export default function BackgroundLumaPNG({
  src = "/luma/Luma_29.png",
  opacity = 0.18,
  blurPx = 6
}:{src?:string;opacity?:number;blurPx?:number}) {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex:0, opacity, filter:`blur(${blurPx}px)` }}>
      <img
        src={src}
        alt="Luma"
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-luma-float"
        style={{ width:"60vmin", maxWidth:900, opacity:0.8 }}
        onError={(e) => {
          console.warn("Luma PNG fallback not found:", src);
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
        onLoad={() => {
          console.log("✅ Luma PNG fallback loaded successfully");
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