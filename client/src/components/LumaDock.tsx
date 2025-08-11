"use client";
import * as React from "react";

interface LumaDockProps {
  onOpen: () => void;
}

export function LumaDock({ onOpen }: LumaDockProps) {
  return (
    <button
      onClick={onOpen}
      aria-label="Open Luma assistant"
      className="fixed bottom-4 right-4 z-40 grid place-items-center w-11 h-11 rounded-full bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-300/30 shadow-lg backdrop-blur transition-all duration-200"
      style={{ animation: "lumaPulse 3.5s ease-in-out infinite" }}
    >
      {/* vector sun glyph */}
      <svg width="22" height="22" viewBox="0 0 24 24" className="text-cyan-200">
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x="11.5"
            y="1"
            width="1"
            height="3"
            fill="currentColor"
            transform={`rotate(${i * 45} 12 12)`}
          />
        ))}
      </svg>
      <style>{`
        @keyframes lumaPulse { 
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.06); opacity: 1; }
        }
      `}</style>
    </button>
  );
}