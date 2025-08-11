"use client";
import * as React from "react";

interface LumaWhisperProps {
  lines: string[];
  onDone?: () => void;
}

export function LumaWhisper({ lines, onDone }: LumaWhisperProps) {
  const [charIndex, setCharIndex] = React.useState(0);
  const fullText = lines.join(" ");

  React.useEffect(() => {
    if (charIndex < fullText.length) {
      const timer = setTimeout(() => setCharIndex(charIndex + 1), 18);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => onDone?.(), 2200);
      return () => clearTimeout(timer);
    }
  }, [charIndex, fullText, onDone]);

  const displayText = fullText.slice(0, charIndex);

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl border border-slate-700 bg-slate-900/90 text-slate-100 shadow-xl backdrop-blur px-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-300/40">
          <svg width="16" height="16" viewBox="0 0 24 24" className="text-cyan-200">
            <circle cx="12" cy="12" r="4" fill="currentColor" />
          </svg>
        </span>
        <p className="text-sm">
          {displayText}
          {charIndex < fullText.length && (
            <span className="opacity-60 animate-pulse">▌</span>
          )}
        </p>
      </div>
    </div>
  );
}